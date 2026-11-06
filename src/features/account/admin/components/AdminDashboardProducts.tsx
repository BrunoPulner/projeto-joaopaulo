
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  LayoutGrid,
  LoaderCircle,
  Package,
  Pencil,
  RefreshCw,
  RotateCcw,
  Salad,
  Search,
  Trash2,
} from "lucide-react";

import {
  productsApi,
  type AdminCategory,
  type AdminProduct,
  type AdminSubcategory,
  type ProductPayload,
} from "../api/products.api";

import { ProductCategorySelector } from "./products/ProductCategorySelector";
import { ProductAddonsManager } from "./products/ProductAddonsManager";

import { ProductIngredientsManager } from "../../../admin/components/delivery/ProductIngredientsManager";

import {
  ProductForm,
  type CommonProductFormValues,
} from "./products/ProductForm";

import { PizzaProductForm } from "./products/PizzaProductForm";
import { formatCurrency } from "./products/currency.utils";

// ============================================
// CONFIGURAÇÕES
// ============================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_PRICE_CENTS = 2147483647;

// Atualização periódica dos indicadores.
// Útil após adicionar/remover ingredientes.
const INGREDIENTS_REFRESH_MS = 15000;

// ============================================
// TIPOS
// ============================================

type IngredientStatus =
  | "loading"
  | "configured"
  | "missing"
  | "exempt"
  | "pizza"
  | "error";

type IngredientFilter =
  | "all"
  | "missing"
  | "configured";

type ProductIngredientResponse = {
  id: number;
  productId: number;
  name: string;
  isRemovable: boolean;
  sortOrder: number;
};

type IngredientStatusMap = Record<
  number,
  IngredientStatus
>;

// ============================================
// FORMULÁRIO INICIAL
// ============================================

const emptyForm: CommonProductFormValues = {
  name: "",
  description: "",
  priceCents: 0,
  subcategoryId: "",
  imageUrl: "",
  isAvailable: true,
  isFeatured: false,
  stockQuantity: null,
};

const searchInputClass = [
  "min-h-12 w-full rounded-xl",
  "border border-slate-200 bg-white",
  "px-4 py-3 text-sm text-slate-900",
  "outline-none focus:border-sky-500",
  "focus:ring-2 focus:ring-sky-100",
].join(" ");

// ============================================
// UTILITÁRIOS DE CATEGORIAS
// ============================================

function normalizeCategory(
  category: AdminCategory,
): string {
  return (category.slug || category.name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isPizzaCategory(
  category: AdminCategory,
): boolean {
  return ["pizza", "pizzas"].includes(
    normalizeCategory(category),
  );
}

function isBeverageCategory(
  category: AdminCategory,
): boolean {
  return ["bebida", "bebidas"].includes(
    normalizeCategory(category),
  );
}

function allowsAddonsForCategory(
  category: AdminCategory,
): boolean {
  return [
    "pastel",
    "pasteis",
    "crepe",
    "crepes",
    "espetinho",
    "espetinhos",
    "bebida",
    "bebidas",
  ].includes(normalizeCategory(category));
}

function getProductCategory(
  product: AdminProduct,
  categories: AdminCategory[],
) {
  return (
    categories.find(
      (category) =>
        category.id === product.categoryId,
    ) ?? null
  );
}

// ============================================
// API DE INGREDIENTES
// ============================================

async function fetchProductIngredients(
  productId: number,
  signal?: AbortSignal,
): Promise<ProductIngredientResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}/ingredients`,
    {
      credentials: "include",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao consultar ingredientes (${response.status}).`,
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "Resposta inesperada ao consultar ingredientes.",
    );
  }

  return data as ProductIngredientResponse[];
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function AdminDashboardProducts() {
  // ------------------------------------------
  // DADOS
  // ------------------------------------------

  const [products, setProducts] = useState<
    AdminProduct[]
  >([]);

  const [categories, setCategories] = useState<
    AdminCategory[]
  >([]);

  const [subcategories, setSubcategories] = useState<
    AdminSubcategory[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [processingId, setProcessingId] = useState<
    number | null
  >(null);

  // ------------------------------------------
  // FILTROS
  // ------------------------------------------

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [ingredientFilter, setIngredientFilter] =
    useState<IngredientFilter>("all");

  // ------------------------------------------
  // FORMULÁRIO
  // ------------------------------------------

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState<number | null>(null);

  const [addonsSelected, setAddonsSelected] =
    useState(false);

  const [formOpen, setFormOpen] = useState(false);

  const [editingId, setEditingId] = useState<
    number | null
  >(null);

  const [form, setForm] =
    useState<CommonProductFormValues>({
      ...emptyForm,
    });

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<
    string | null
  >(null);

  // ------------------------------------------
  // INGREDIENTES
  // ------------------------------------------

  const [
    ingredientStatuses,
    setIngredientStatuses,
  ] = useState<IngredientStatusMap>({});

  const [
    refreshingIngredients,
    setRefreshingIngredients,
  ] = useState(false);

  const [ingredientsRefreshKey, setIngredientsRefreshKey] =
    useState(0);

  // ------------------------------------------
  // MENSAGENS
  // ------------------------------------------

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ==========================================
  // CARREGAR PRODUTOS
  // ==========================================

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        productsData,
        categoriesData,
        subcategoriesData,
      ] = await Promise.all([
        productsApi.listAdmin(),
        productsApi.listCategories(),
        productsApi.listSubcategories(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os produtos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  // ==========================================
  // LIMPEZA DA PRÉVIA DA IMAGEM
  // ==========================================

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ==========================================
  // CARREGAR STATUS DOS INGREDIENTES
  // ==========================================

  useEffect(() => {
    if (loading) return;

    const controller = new AbortController();

    async function refreshIngredientStatuses() {
      if (controller.signal.aborted) return;

      setRefreshingIngredients(true);

      const nextStatuses: IngredientStatusMap = {};

      const productsToCheck: AdminProduct[] = [];

      for (const product of products) {
        const category = getProductCategory(
          product,
          categories,
        );

        if (!category) {
          nextStatuses[product.id] = "error";
          continue;
        }

        if (isBeverageCategory(category)) {
          nextStatuses[product.id] = "exempt";
          continue;
        }

        if (isPizzaCategory(category)) {
          // Os sabores terão seus próprios
          // ingredientes em uma etapa posterior.
          nextStatuses[product.id] = "pizza";
          continue;
        }

        nextStatuses[product.id] = "loading";
        productsToCheck.push(product);
      }

      // Não sobrescreve imediatamente indicadores
      // já conhecidos durante a atualização.
      setIngredientStatuses((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(nextStatuses).filter(
            ([, status]) => status !== "loading",
          ),
        ),
      }));

      const results = await Promise.all(
        productsToCheck.map(async (product) => {
          try {
            const ingredients =
              await fetchProductIngredients(
                product.id,
                controller.signal,
              );

            return {
              productId: product.id,
              status: ingredients.length > 0
                ? ("configured" as const)
                : ("missing" as const),
            };
          } catch {
            return {
              productId: product.id,
              status: "error" as const,
            };
          }
        }),
      );

      if (controller.signal.aborted) return;

      for (const result of results) {
        nextStatuses[result.productId] =
          result.status;
      }

      setIngredientStatuses(nextStatuses);
      setRefreshingIngredients(false);
    }

    void refreshIngredientStatuses();

    return () => controller.abort();
  }, [
    products,
    categories,
    loading,
    ingredientsRefreshKey,
  ]);

  // ==========================================
  // ATUALIZAÇÃO AUTOMÁTICA
  // ==========================================

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setIngredientsRefreshKey(
          (current) => current + 1,
        );
      }
    }, INGREDIENTS_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, []);

  function refreshIngredients() {
    setIngredientsRefreshKey(
      (current) => current + 1,
    );
  }

  // ==========================================
  // CATEGORIAS
  // ==========================================

  const activeCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.isActive,
      ),
    [categories],
  );

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === selectedCategoryId,
    ) ?? null;

  const availableSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) =>
          subcategory.categoryId ===
            selectedCategoryId &&
          subcategory.isActive,
      ),
    [subcategories, selectedCategoryId],
  );

  // ==========================================
  // RESUMO DE INGREDIENTES
  // ==========================================

  const ingredientSummary = useMemo(() => {
    let configured = 0;
    let missing = 0;
    let exempt = 0;
    let pizzas = 0;
    let pending = 0;

    for (const product of products) {
      const status =
        ingredientStatuses[product.id];

      switch (status) {
        case "configured":
          configured++;
          break;

        case "missing":
          missing++;
          break;

        case "exempt":
          exempt++;
          break;

        case "pizza":
          pizzas++;
          break;

        default:
          pending++;
      }
    }

    return {
      total: products.length,
      configured,
      missing,
      exempt,
      pizzas,
      pending,
    };
  }, [products, ingredientStatuses]);

  // ==========================================
  // FILTRAR PRODUTOS
  // ==========================================

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return products.filter((product) => {
      const matchesSearch = product.name
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedSearch);

      const matchesCategory =
        !categoryFilter ||
        product.categoryId ===
          Number(categoryFilter);

      const status =
        ingredientStatuses[product.id];

      const matchesIngredients =
        ingredientFilter === "all" ||
        (ingredientFilter === "missing" &&
          status === "missing") ||
        (ingredientFilter === "configured" &&
          status === "configured");

      return (
        matchesSearch &&
        matchesCategory &&
        matchesIngredients
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    ingredientFilter,
    ingredientStatuses,
  ]);

  // ==========================================
  // LIMPAR FORMULÁRIO
  // ==========================================

  function clearForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setSelectedImage(null);
    setPreviewUrl(null);
    setError("");

    refreshIngredients();
  }

  // ==========================================
  // SELECIONAR CATEGORIA
  // ==========================================

  function handleCategorySelected(
    category: AdminCategory,
  ) {
    if (saving) return;

    setAddonsSelected(false);
    clearForm();

    setSelectedCategoryId(category.id);
    setMessage("");
    setFormOpen(true);
  }

  // ==========================================
  // EDITAR PRODUTO
  // ==========================================

  function openEditForm(product: AdminProduct) {
    if (saving) return;

    setAddonsSelected(false);

    setSelectedCategoryId(product.categoryId);
    setEditingId(product.id);

    setSelectedImage(null);
    setPreviewUrl(null);

    setError("");
    setMessage("");

    setForm({
      name: product.name,
      description: product.description ?? "",
      priceCents: product.priceCents,
      subcategoryId:
        product.subcategoryId === null
          ? ""
          : String(product.subcategoryId),
      imageUrl: product.imageUrl ?? "",
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      stockQuantity: product.stockQuantity,
    });

    setFormOpen(true);
  }

  // ==========================================
  // IMAGEM
  // ==========================================

  function handleImageChange(file: File | null) {
    if (!file) {
      setSelectedImage(null);
      setPreviewUrl(null);
      setError("");
      return;
    }

    if (!IMAGE_TYPES.includes(file.type)) {
      setError(
        "Selecione uma imagem JPG, PNG ou WebP.",
      );
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError(
        "A imagem deve ter no máximo 5 MB.",
      );
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  }

  async function uploadImage(
    file: File,
  ): Promise<string> {
    const data = new FormData();
    data.append("image", file);

    const response = await fetch(
      `${API_BASE_URL}/api/admin/uploads/products`,
      {
        method: "POST",
        credentials: "include",
        body: data,
      },
    );

    const result: {
      message?: string;
      image?: {
        objectPath?: string;
      };
    } = await response.json();

    if (
      !response.ok ||
      !result.image?.objectPath
    ) {
      throw new Error(
        result.message ??
          "Não foi possível enviar a imagem.",
      );
    }

    const filename = result.image.objectPath
      .split("/")
      .pop();

    if (
      !filename ||
      !/^[a-f0-9-]+\.webp$/i.test(filename)
    ) {
      throw new Error(
        "O Storage retornou um nome de imagem inválido.",
      );
    }

    return `${API_BASE_URL}/api/images/products/${filename}`;
  }

  // ==========================================
  // SALVAR PRODUTO
  // ==========================================

  async function handleSave() {
    if (saving || !selectedCategory) return;

    const isPizza =
      isPizzaCategory(selectedCategory);

    const name = form.name
      .trim()
      .replace(/\s+/g, " ");

    if (name.length < 2) {
      setError(
        "Informe um nome com pelo menos 2 caracteres.",
      );
      return;
    }

    if (!selectedCategory.isActive) {
      setError("Selecione uma categoria ativa.");
      return;
    }

    if (
      !Number.isSafeInteger(form.priceCents) ||
      form.priceCents < 1 ||
      form.priceCents > MAX_PRICE_CENTS
    ) {
      setError(
        "Informe um preço válido e maior que zero.",
      );
      return;
    }

    const subcategoryId = form.subcategoryId
      ? Number(form.subcategoryId)
      : null;

    if (
      availableSubcategories.length &&
      !availableSubcategories.some(
        (item) => item.id === subcategoryId,
      )
    ) {
      setError("Selecione uma subcategoria ativa.");
      return;
    }

    if (
      !availableSubcategories.length &&
      subcategoryId !== null
    ) {
      setError(
        "A subcategoria selecionada não está disponível.",
      );
      return;
    }

    const controlsStock =
      isBeverageCategory(selectedCategory);

    if (
      controlsStock &&
      (typeof form.stockQuantity !== "number" ||
        !Number.isSafeInteger(
          form.stockQuantity,
        ) ||
        form.stockQuantity < 0 ||
        form.stockQuantity > MAX_PRICE_CENTS)
    ) {
      setError(
        "Informe uma quantidade de estoque válida para a bebida (zero ou mais).",
      );
      return;
    }

    const imageUrl = form.imageUrl.trim();

    if (
      imageUrl &&
      !imageUrl.startsWith("/") &&
      !/^https?:\/\//i.test(imageUrl)
    ) {
      setError(
        "O endereço da imagem atual é inválido.",
      );
      return;
    }

    const current =
      editingId === null
        ? null
        : products.find(
            (product) =>
              product.id === editingId,
          );

    const payload: ProductPayload = {
      categoryId: selectedCategory.id,
      subcategoryId,
      name,
      description:
        form.description.trim() || null,
      imageUrl: imageUrl || null,
      priceCents: form.priceCents,
      stockQuantity: controlsStock
        ? form.stockQuantity
        : null,
      isActive: current?.isActive ?? true,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      sortOrder: current?.sortOrder ?? 0,
      allowsFlavors: isPizza,
      maxFlavors: isPizza ? 2 : 1,
      pricingType: isPizza
        ? "PIZZA_CUSTOM"
        : "FIXED",
      pizzaSlices: isPizza ? 8 : null,
      allowsAddons:
        isPizza ||
        allowsAddonsForCategory(
          selectedCategory,
        ),
    };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (selectedImage) {
        payload.imageUrl =
          await uploadImage(selectedImage);
      }

      const isCreating = editingId === null;

      const saved = isCreating
        ? await productsApi.create(payload)
        : await productsApi.update(
            editingId,
            payload,
          );

      setProducts((items) =>
        isCreating
          ? [...items, saved]
          : items.map((item) =>
              item.id === saved.id
                ? saved
                : item,
            ),
      );

      setEditingId(saved.id);
      setSelectedCategoryId(saved.categoryId);

      setForm({
        name: saved.name,
        description: saved.description ?? "",
        priceCents: saved.priceCents,
        subcategoryId:
          saved.subcategoryId === null
            ? ""
            : String(saved.subcategoryId),
        imageUrl: saved.imageUrl ?? "",
        isAvailable: saved.isAvailable,
        isFeatured: saved.isFeatured,
        stockQuantity: saved.stockQuantity,
      });

      setSelectedImage(null);
      setPreviewUrl(null);
      setFormOpen(true);
      setError("");

      setMessage(
        isCreating
          ? "Produto cadastrado! Agora configure os ingredientes abaixo."
          : "Produto atualizado com sucesso!",
      );

      refreshIngredients();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar produto.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // DESATIVAR PRODUTO
  // ==========================================

  async function handleDeactivate(
    product: AdminProduct,
  ) {
    if (
      processingId !== null ||
      !window.confirm(
        `Deseja desativar "${product.name}"?`,
      )
    ) {
      return;
    }

    setProcessingId(product.id);
    setError("");
    setMessage("");

    try {
      const { product: updated } =
        await productsApi.deactivate(
          product.id,
        );

      setProducts((items) =>
        items.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      if (editingId === product.id) {
        clearForm();
      }

      setMessage(
        "Produto desativado. Seu registro foi preservado.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao desativar produto.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==========================================
  // REATIVAR PRODUTO
  // ==========================================

  async function handleReactivate(
    product: AdminProduct,
  ) {
    if (processingId !== null) return;

    setProcessingId(product.id);
    setError("");
    setMessage("");

    try {
      const updated = await productsApi.update(
        product.id,
        {
          isActive: true,
        },
      );

      setProducts((items) =>
        items.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      setMessage("Produto reativado.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao reativar produto.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==========================================
  // ALTERAR DISPONIBILIDADE
  // ==========================================

  async function handleAvailability(
    product: AdminProduct,
  ) {
    if (processingId !== null) return;

    setProcessingId(product.id);
    setError("");
    setMessage("");

    try {
      const updated = await productsApi.update(
        product.id,
        {
          isAvailable: !product.isAvailable,
        },
      );

      setProducts((items) =>
        items.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      setMessage(
        updated.isAvailable
          ? "Produto disponível para venda."
          : "Produto marcado como indisponível.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar disponibilidade.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}

      <section className="rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:p-8">
        <h2 className="text-2xl font-black sm:text-3xl">
          Produtos do restaurante
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-orange-50">
          Organize seu cardápio, atualize os preços
          e cadastre novos produtos.
        </p>
      </section>

      {/* MENSAGENS */}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-slate-700"
        >
          {message}
        </p>
      )}

      {!loading &&
        activeCategories.length === 0 && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Cadastre uma categoria ativa antes de
            adicionar produtos.
          </p>
        )}

      {/* SELEÇÃO DE CATEGORIAS */}

      <section
        aria-labelledby="product-category-title"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <h2
          id="product-category-title"
          className="mb-4 text-lg font-black text-slate-900"
        >
          Cadastrar produto por categoria
        </h2>

        <ProductCategorySelector
          categories={categories}
          selectedCategoryId={
            addonsSelected
              ? null
              : selectedCategoryId
          }
          onSelect={handleCategorySelected}
          onSelectAddons={() => {
            if (saving || loading) return;

            clearForm();
            setSelectedCategoryId(null);
            setMessage("");
            setAddonsSelected(true);
          }}
          addonsSelected={addonsSelected}
          disabled={saving || loading}
        />
      </section>

      {/* GERENCIAR ADICIONAIS */}

      {addonsSelected && (
        <ProductAddonsManager
          onCancel={() =>
            setAddonsSelected(false)
          }
        />
      )}

      {/* FORMULÁRIO DE PIZZAS */}

      {!addonsSelected &&
        formOpen &&
        selectedCategory &&
        isPizzaCategory(selectedCategory) && (
          <>
            <PizzaProductForm
              category={selectedCategory}
              subcategories={subcategories}
              values={form}
              onChange={(values) => {
                setForm(values);
                setError("");
              }}
              onSubmit={handleSave}
              onCancel={clearForm}
              onImageChange={handleImageChange}
              selectedImage={selectedImage}
              previewUrl={previewUrl}
              saving={saving}
              editing={editingId !== null}
              error={error || undefined}
            />

            {editingId !== null && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
                <h3 className="font-bold">
                  Pizza salva · ID {editingId}
                </h3>

                <p className="mt-1">
                  Os ingredientes serão vinculados
                  individualmente aos sabores na
                  próxima etapa.
                </p>
              </section>
            )}
          </>
        )}

      {/* FORMULÁRIO CONVENCIONAL */}

      {!addonsSelected &&
        formOpen &&
        selectedCategory &&
        !isPizzaCategory(selectedCategory) && (
          <ProductForm
            category={selectedCategory}
            subcategories={subcategories}
            values={form}
            onChange={(values) => {
              setForm(values);
              setError("");
            }}
            onSubmit={handleSave}
            onCancel={clearForm}
            onImageChange={handleImageChange}
            selectedImage={selectedImage}
            previewUrl={previewUrl}
            saving={saving}
            editing={editingId !== null}
            error={error || undefined}
          />
        )}

      {/* INGREDIENTES DE PRODUTO EXISTENTE */}

      {!addonsSelected &&
        formOpen &&
        editingId !== null &&
        selectedCategory &&
        !isPizzaCategory(selectedCategory) &&
        !isBeverageCategory(selectedCategory) && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-bold text-emerald-900">
                Personalização dos ingredientes
              </p>

              <p className="mt-1 text-xs text-emerald-800">
                Os ingredientes são salvos
                individualmente. Não é necessário
                salvar novamente o formulário
                do produto.
              </p>
            </div>

            <ProductIngredientsManager
              key={editingId}
              productId={editingId}
            />
          </div>
        )}

      {/* LISTAGEM DE PRODUTOS */}

      <section
        aria-labelledby="product-list-title"
        className="space-y-5"
      >
        {/* CABEÇALHO DA LISTAGEM */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              id="product-list-title"
              className="text-lg font-black text-stone-900"
            >
              Produtos cadastrados
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              {visibleProducts.length} de{" "}
              {products.length} produtos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refreshIngredients}
              disabled={refreshingIngredients}
              title="Atualizar situação dos ingredientes"
              className="inline-flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={
                  refreshingIngredients
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            <div className="relative">
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                type="search"
                aria-label="Buscar produto"
                placeholder="Buscar produto..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className={`${searchInputClass} pl-10`}
              />
            </div>
          </div>
        </div>

        {/* RESUMO DOS INGREDIENTES */}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <IngredientSummaryCard
            label="Produtos cadastrados"
            value={ingredientSummary.total}
            icon={Package}
            tone="slate"
          />

          <IngredientSummaryCard
            label="Sem ingredientes"
            value={ingredientSummary.missing}
            icon={AlertCircle}
            tone="amber"
          />

          <IngredientSummaryCard
            label="Configurados"
            value={ingredientSummary.configured}
            icon={CheckCircle2}
            tone="emerald"
          />

          <IngredientSummaryCard
            label="Dispensados"
            value={ingredientSummary.exempt}
            icon={Salad}
            tone="sky"
          />
        </div>

        {/* AVISO SOBRE PIZZAS */}

        {ingredientSummary.pizzas > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
            <CircleHelp
              size={19}
              className="mt-0.5 shrink-0 text-orange-700"
            />

            <div>
              <p className="text-sm font-bold text-orange-900">
                Ingredientes dos sabores de pizza
              </p>

              <p className="mt-1 text-xs leading-relaxed text-orange-800">
                {ingredientSummary.pizzas}{" "}
                {ingredientSummary.pizzas === 1
                  ? "produto de pizza está"
                  : "produtos de pizza estão"}{" "}
                aguardando a integração de
                ingredientes por sabor. Eles não
                entram na contagem de produtos
                sem ingredientes.
              </p>
            </div>
          </div>
        )}

        {/* FILTROS DE CATEGORIA */}

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar produtos por categoria"
        >
          <button
            type="button"
            onClick={() => setCategoryFilter("")}
            aria-pressed={categoryFilter === ""}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              categoryFilter === ""
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            <LayoutGrid size={16} />
            Todos os produtos
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                setCategoryFilter(
                  String(category.id),
                )
              }
              aria-pressed={
                categoryFilter ===
                String(category.id)
              }
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                categoryFilter ===
                String(category.id)
                  ? "border-sky-600 bg-sky-50 text-sky-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* FILTROS DE INGREDIENTES */}

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filtrar por situação dos ingredientes"
        >
          <span className="mr-1 text-xs font-bold text-slate-500">
            Ingredientes:
          </span>

          <IngredientFilterButton
            active={ingredientFilter === "all"}
            onClick={() =>
              setIngredientFilter("all")
            }
          >
            Todos
          </IngredientFilterButton>

          <IngredientFilterButton
            active={
              ingredientFilter === "missing"
            }
            onClick={() =>
              setIngredientFilter("missing")
            }
          >
            <AlertCircle size={14} />
            Sem ingredientes
            <span>
              ({ingredientSummary.missing})
            </span>
          </IngredientFilterButton>

          <IngredientFilterButton
            active={
              ingredientFilter === "configured"
            }
            onClick={() =>
              setIngredientFilter("configured")
            }
          >
            <CheckCircle2 size={14} />
            Configurados
            <span>
              ({ingredientSummary.configured})
            </span>
          </IngredientFilterButton>
        </div>

        {/* PRODUTOS */}

        {loading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-10 text-sm text-stone-500">
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
            Carregando produtos...
          </div>
        ) : visibleProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => {
              const category =
                getProductCategory(
                  product,
                  categories,
                );

              const categoryName =
                category?.name;

              const subcategoryName =
                subcategories.find(
                  (subcategory) =>
                    subcategory.id ===
                    product.subcategoryId,
                )?.name;

              const ingredientStatus =
                ingredientStatuses[product.id] ??
                "loading";

              return (
                <article
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <ProductImage
                    src={product.imageUrl}
                    name={product.name}
                    className="h-40 w-full"
                  />

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-bold text-orange-700">
                      {categoryName ??
                        "Categoria indisponível"}

                      {subcategoryName &&
                        ` · ${subcategoryName}`}
                    </p>

                    <h3 className="mt-2 text-lg font-black text-stone-900">
                      {product.name}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">
                      {product.description ||
                        "Sem descrição cadastrada."}
                    </p>

                    {/* INDICADOR DE INGREDIENTES */}

                    <div className="mt-4">
                      <IngredientStatusBadge
                        status={ingredientStatus}
                      />
                    </div>

                    {/* STATUS DO PRODUTO */}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span
                        className={`rounded-full px-2 py-1 ${
                          product.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {product.isActive
                          ? "Ativo"
                          : "Desativado"}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 ${
                          product.isAvailable
                            ? "bg-orange-50 text-orange-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {product.isAvailable
                          ? "Disponível"
                          : "Indisponível"}
                      </span>

                      {product.isFeatured && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                          Destaque
                        </span>
                      )}

                      {product.stockQuantity !==
                        null && (
                        <span
                          className={`rounded-full px-2 py-1 ${
                            product.stockQuantity === 0
                              ? "bg-red-50 text-red-700"
                              : product.stockQuantity <= 5
                                ? "bg-amber-50 text-amber-700"
                                : "bg-sky-50 text-sky-700"
                          }`}
                        >
                          {product.stockQuantity === 0
                            ? "Estoque esgotado"
                            : `Estoque: ${product.stockQuantity} un.`}
                        </span>
                      )}
                    </div>

                    {/* PREÇO E AÇÕES */}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <p className="text-xl font-black text-stone-900">
                        {formatCurrency(
                          product.priceCents,
                        )}
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void handleAvailability(
                              product,
                            )
                          }
                          disabled={
                            processingId !== null
                          }
                          aria-label={`${
                            product.isAvailable
                              ? "Marcar indisponível"
                              : "Marcar disponível"
                          }: ${product.name}`}
                          title="Alternar disponibilidade"
                          className="flex size-10 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-sky-50 disabled:opacity-50"
                        >
                          <Package size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(product)
                          }
                          disabled={
                            processingId !== null
                          }
                          aria-label={`Editar ${product.name}`}
                          className="flex size-10 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-sky-50 disabled:opacity-50"
                        >
                          <Pencil size={17} />
                        </button>

                        {product.isActive ? (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeactivate(
                                product,
                              )
                            }
                            disabled={
                              processingId !== null
                            }
                            aria-label={`Desativar ${product.name}`}
                            className="flex size-10 items-center justify-center rounded-xl border border-red-100 text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              void handleReactivate(
                                product,
                              )
                            }
                            disabled={
                              processingId !== null
                            }
                            aria-label={`Reativar ${product.name}`}
                            className="flex size-10 items-center justify-center rounded-xl border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            <RotateCcw size={17} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <Package
              size={32}
              aria-hidden="true"
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-semibold text-stone-700">
              {products.length === 0
                ? "Nenhum produto cadastrado."
                : "Nenhum produto encontrado com esses filtros."}
            </p>

            {products.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("");
                  setIngredientFilter("all");
                }}
                className="mt-4 text-sm font-bold text-orange-700 hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================
// CARD DO RESUMO
// ============================================

type SummaryTone =
  | "slate"
  | "amber"
  | "emerald"
  | "sky";

type SummaryIcon = typeof Package;

function IngredientSummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: SummaryIcon;
  tone: SummaryTone;
}) {
  const toneClasses: Record<
    SummaryTone,
    string
  > = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-700",
    emerald:
      "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        <span
          className={`flex size-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon size={19} />
        </span>
      </div>

      <p className="mt-3 text-3xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

// ============================================
// FILTRO DE INGREDIENTES
// ============================================

function IngredientFilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
        active
          ? "border-orange-700 bg-orange-700 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50"
      }`}
    >
      {children}
    </button>
  );
}

// ============================================
// INDICADOR DE INGREDIENTES
// ============================================

function IngredientStatusBadge({
  status,
}: {
  status: IngredientStatus;
}) {
  switch (status) {
    case "configured":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 size={14} />
          Ingredientes configurados
        </span>
      );

    case "missing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
          <AlertCircle size={14} />
          Sem ingredientes
        </span>
      );

    case "exempt":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
          <Salad size={14} />
          Ingredientes dispensados
        </span>
      );

    case "pizza":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
          <CircleHelp size={14} />
          Ingredientes por sabor
        </span>
      );

    case "error":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
          <AlertCircle size={14} />
          Não foi possível verificar
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
          <LoaderCircle
            size={14}
            className="animate-spin"
          />
          Verificando ingredientes
        </span>
      );
  }
}

// ============================================
// IMAGEM DO PRODUTO
// ============================================

function ProductImage({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className: string;
}) {
  const [failedSrc, setFailedSrc] = useState<
    string | null
  >(null);

  const showImage =
    Boolean(src) && failedSrc !== src;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-slate-50 ${className}`}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={name}
          loading="lazy"
          onError={() =>
            setFailedSrc(src ?? null)
          }
          className="h-full w-full object-cover"
        />
      ) : (
        <Package
          size={36}
          aria-hidden="true"
          className="text-slate-300"
        />
      )}
    </div>
  );
}

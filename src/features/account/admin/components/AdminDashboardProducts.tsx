import { useState, type FormEvent } from "react";
import {
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  categories as catalogCategories,
  products as catalogProducts,
  subcategories,
  type Category,
  type Product,
} from "../../../catalog/catalogData";

const productsStorageKey = "admin-products-demo";
const categoriesStorageKey = "admin-categories-demo";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  subcategoryId: string;
  image: string;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  subcategoryId: "",
  image: "",
};

const inputClass =
  "min-h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-700/10";

const labelClass =
  "mb-2 block text-sm font-semibold text-stone-700";

function loadCategories(): Category[] {
  try {
    const saved = localStorage.getItem(categoriesStorageKey);
    const parsed: unknown = saved ? JSON.parse(saved) : null;

    if (
      Array.isArray(parsed) &&
      parsed.every(
        (item) =>
          item !== null &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.name === "string",
      )
    ) {
      return parsed as Category[];
    }
  } catch {
    // Usa as categorias iniciais quando não puder ler o armazenamento.
  }

  return catalogCategories.map((category) => ({ ...category }));
}

function loadProducts(): Product[] {
  try {
    const saved = localStorage.getItem(productsStorageKey);
    const parsed: unknown = saved ? JSON.parse(saved) : null;

    if (
      Array.isArray(parsed) &&
      parsed.every(
        (item) =>
          item !== null &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.description === "string" &&
          typeof item.categoryId === "string" &&
          typeof item.price === "number" &&
          Number.isFinite(item.price) &&
          item.price >= 0 &&
          (item.image === undefined || typeof item.image === "string") &&
          (item.subcategoryId === undefined ||
            typeof item.subcategoryId === "string"),
      )
    ) {
      return parsed as Product[];
    }
  } catch {
    // Usa os produtos iniciais quando não puder ler o armazenamento.
  }

  return catalogProducts.map((product) => ({ ...product }));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function AdminDashboardProducts() {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [categories] = useState<Category[]>(loadCategories);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const availableSubcategories = subcategories.filter(
    (subcategory) => subcategory.categoryId === form.categoryId,
  );

  const visibleProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLocaleLowerCase("pt-BR")
      .includes(search.trim().toLocaleLowerCase("pt-BR"));

    const matchesCategory =
      !categoryFilter || product.categoryId === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  function updateField(field: keyof ProductForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "categoryId" ? { subcategoryId: "" } : {}),
    }));
    setError("");
  }

  function persist(nextProducts: Product[], successMessage: string) {
    setProducts(nextProducts);

    try {
      localStorage.setItem(
        productsStorageKey,
        JSON.stringify(nextProducts),
      );
      setMessage(successMessage);
    } catch {
      setMessage(
        "A alteração foi aplicada nesta tela, mas não pôde ser salva no navegador.",
      );
    }
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function openEditForm(product: Product) {
    const categoryExists = categories.some(
      (category) => category.id === product.categoryId,
    );

    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toFixed(2).replace(".", ","),
      categoryId: categoryExists ? product.categoryId : "",
      subcategoryId: categoryExists
        ? product.subcategoryId ?? ""
        : "",
      image: product.image ?? "",
    });
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim().replace(/\s+/g, " ");
    const priceText = form.price.trim();

    if (!name) {
      setError("Informe o nome do produto.");
      return;
    }

    if (!categories.some((category) => category.id === form.categoryId)) {
      setError("Selecione uma categoria cadastrada.");
      return;
    }

    if (
      availableSubcategories.length > 0 &&
      !availableSubcategories.some(
        (subcategory) => subcategory.id === form.subcategoryId,
      )
    ) {
      setError("Selecione o tipo do produto.");
      return;
    }

    if (!/^\d+([.,]\d{1,2})?$/.test(priceText)) {
      setError("Informe o preço no formato 15,00.");
      return;
    }

    const price = Number(priceText.replace(",", "."));

    if (!Number.isFinite(price) || price <= 0) {
      setError("O preço deve ser maior que zero.");
      return;
    }

    const data = {
      name,
      description: form.description.trim(),
      price,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || undefined,
      image: form.image.trim() || undefined,
    };

    if (editingId) {
      persist(
        products.map((product) =>
          product.id === editingId
            ? { ...product, ...data }
            : product,
        ),
        "Produto atualizado.",
      );
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        ...data,
      };

      persist([...products, newProduct], "Produto cadastrado.");
    }

    closeForm();
  }

  function handleDelete(product: Product) {
    if (!window.confirm(`Deseja excluir "${product.name}"?`)) {
      return;
    }

    persist(
      products.filter((item) => item.id !== product.id),
      "Produto excluído.",
    );

    if (editingId === product.id) closeForm();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-2xl font-black sm:text-3xl">
            Produtos do restaurante
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-orange-50">
            Organize seu cardápio, atualize os preços e cadastre
            novos produtos.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          disabled={categories.length === 0}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-800 transition hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={19} aria-hidden="true" />
          Novo produto
        </button>
      </section>

      {categories.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Cadastre uma categoria antes de adicionar produtos.
        </p>
      )}

      {formOpen && (
        <section
          aria-labelledby="product-form-title"
          className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2
              id="product-form-title"
              className="text-lg font-black text-stone-900"
            >
              {editingId ? "Editar produto" : "Novo produto"}
            </h2>

            <button
              type="button"
              onClick={closeForm}
              aria-label="Fechar formulário"
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="product-name" className={labelClass}>
                  Nome do produto
                </label>
                <input
                  id="product-name"
                  autoFocus
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  placeholder="Ex.: Pizza de calabresa"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="product-category" className={labelClass}>
                  Categoria
                </label>
                <select
                  id="product-category"
                  required
                  value={form.categoryId}
                  onChange={(event) =>
                    updateField("categoryId", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {availableSubcategories.length > 0 && (
                <div>
                  <label
                    htmlFor="product-subcategory"
                    className={labelClass}
                  >
                    Tipo do produto
                  </label>
                  <select
                    id="product-subcategory"
                    required
                    value={form.subcategoryId}
                    onChange={(event) =>
                      updateField("subcategoryId", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Selecione um tipo</option>
                    {availableSubcategories.map((subcategory) => (
                      <option
                        key={subcategory.id}
                        value={subcategory.id}
                      >
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="product-price" className={labelClass}>
                  Preço em reais
                </label>
                <input
                  id="product-price"
                  inputMode="decimal"
                  required
                  value={form.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  placeholder="Ex.: 50,00"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="product-description"
                  className={labelClass}
                >
                  Descrição e ingredientes
                </label>
                <textarea
                  id="product-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Descreva o produto e seus ingredientes."
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="product-image" className={labelClass}>
                  Imagem do produto
                </label>
                <input
                  id="product-image"
                  value={form.image}
                  onChange={(event) =>
                    updateField("image", event.target.value)
                  }
                  placeholder="/images/produto.png ou URL da imagem"
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-stone-500">
                  Para imagens em public, informe o caminho começando
                  por /. O envio de arquivos será adicionado depois.
                </p>

                {form.image.trim() && (
                  <ProductImage
                    src={form.image.trim()}
                    name={form.name || "Prévia do produto"}
                    className="mt-4 h-40 w-48 rounded-xl"
                  />
                )}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="min-h-11 rounded-xl border border-stone-200 px-5 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="min-h-11 rounded-xl bg-orange-700 px-5 py-2 text-sm font-bold text-white hover:bg-orange-800"
              >
                {editingId ? "Salvar alterações" : "Cadastrar produto"}
              </button>
            </div>
          </form>
        </section>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-medium text-stone-700"
        >
          {message}
        </p>
      )}

      <section aria-labelledby="product-list-title" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              id="product-list-title"
              className="text-lg font-black text-stone-900"
            >
              Produtos cadastrados
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {visibleProducts.length} de {products.length} produtos
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
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
                onChange={(event) => setSearch(event.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              aria-label="Filtrar produtos por categoria"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => {
              const categoryName = categories.find(
                (category) => category.id === product.categoryId,
              )?.name;

              const subcategoryName = subcategories.find(
                (subcategory) =>
                  subcategory.id === product.subcategoryId &&
                  subcategory.categoryId === product.categoryId,
              )?.name;

              return (
                <article
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                >
                  <ProductImage
                    src={product.image}
                    name={product.name}
                    className="h-40 w-full"
                  />

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-bold text-orange-700">
                      {categoryName ?? "Categoria indisponível"}
                      {subcategoryName && ` · ${subcategoryName}`}
                    </p>

                    <h3 className="mt-2 text-lg font-black text-stone-900">
                      {product.name}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">
                      {product.description || "Sem descrição cadastrada."}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <p className="text-xl font-black text-stone-900">
                        {formatPrice(product.price)}
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          aria-label={`Editar ${product.name}`}
                          className="flex size-11 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-orange-700"
                        >
                          <Pencil size={18} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          aria-label={`Excluir ${product.name}`}
                          className="flex size-11 items-center justify-center rounded-xl border border-red-100 text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700"
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-12 text-center">
            <Package
              size={32}
              aria-hidden="true"
              className="mx-auto text-orange-300"
            />
            <p className="mt-4 font-semibold text-stone-700">
              {products.length === 0
                ? "Nenhum produto cadastrado."
                : "Nenhum produto encontrado com esses filtros."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ProductImage({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-orange-50 ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailedSrc(src ?? null)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Package
          size={36}
          aria-hidden="true"
          className="text-orange-300"
        />
      )}
    </div>
  );
}
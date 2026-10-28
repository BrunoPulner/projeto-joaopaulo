
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Pizza,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

import { useCatalog } from "./hooks/useCatalog";

import type {
  CatalogProduct,
} from "./types/catalog.types";

import { CategoryVideo } from "./components/CategoryVideo";
import { CategoryTabs } from "./components/CategoryTabs";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailsModal } from "./components/ProductDetailsModal";

import {
  PizzaSizeSelector,
  type PizzaSize,
} from "./components/PizzaSizeSelector";

import {
  PizzaFlavorSelector,
  type PizzaCatalogFlavor,
} from "./components/PizzaFlavorSelector";

import {
  PizzaAddonSelector,
  type PizzaAddon,
} from "./components/PizzaAddonSelector";

import { useCart } from "../cart/useCart";

import "../../styles/catalog.css";

// ============================================
// TIPOS
// ============================================

type PizzaStep =
  | "size"
  | "flavors"
  | "addons"
  | "review";

// ============================================
// FORMATAÇÃO DE PREÇOS
// ============================================

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatPrice(cents: number) {
  return currency.format(cents / 100);
}

// ============================================
// VÍDEOS POR CATEGORIA
// ============================================

// Os vídeos ainda são arquivos locais.
// O banco controla categorias e produtos.

const categoryVideos: Record<string, string> = {
  espetinhos: "/video/espetin.mp4",
  lanches: "/video/hamburguer.mp4",
  pasteis: "/video/pastel.mp4",
  pizzas: "/video/pizza.mp4",
  bebidas: "/video/coca.mp4",
};

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// ============================================
// COMPONENTE
// ============================================

export function CatalogPage() {
  // ==========================================
  // CATÁLOGO DA API
  // ==========================================

  const {
    categories,
    subcategories,
    products,
    loading,
    error,
    reload,
  } = useCatalog();

  // ==========================================
  // ESTADOS DO CATÁLOGO
  // ==========================================

  const [selectedCategory, setSelectedCategory] =
    useState<number | null>(null);

  const [selectedSubcategory, setSelectedSubcategory] =
    useState<number | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<CatalogProduct | null>(null);

  // ==========================================
  // ESTADOS DA PIZZA
  // ==========================================

  const [pizzaStep, setPizzaStep] =
    useState<PizzaStep>("size");

  const [selectedPizzaSize, setSelectedPizzaSize] =
    useState<PizzaSize | null>(null);

  const [selectedPizzaFlavors, setSelectedPizzaFlavors] =
    useState<PizzaCatalogFlavor[]>([]);

  const [pizzaFlavorTotalCents, setPizzaFlavorTotalCents] =
    useState(0);

  const [selectedPizzaAddons, setSelectedPizzaAddons] =
    useState<PizzaAddon[]>([]);

  const [pizzaTotalPriceCents, setPizzaTotalPriceCents] =
    useState(0);

  // ==========================================
  // ANIMAÇÃO DAS CATEGORIAS
  // ==========================================

  const [leaving, setLeaving] = useState(false);

  const pendingCategory = useRef<number | null>(null);

  // ==========================================
  // CARRINHO
  // ==========================================

  const { addItem, openCart } = useCart();

  // ==========================================
  // CATEGORIA ATIVA
  // ==========================================

  // Permite que a primeira categoria da API
  // seja selecionada automaticamente.

  const activeCategoryId =
    categories.some(
      (category) => category.id === selectedCategory,
    )
      ? selectedCategory
      : categories[0]?.id ?? null;

  const selectedCategoryData = categories.find(
    (category) => category.id === activeCategoryId,
  );

  const categoryName =
    selectedCategoryData?.name ?? "";

  const categorySlug = selectedCategoryData
    ? normalizeSlug(selectedCategoryData.slug)
    : "";

  const isPizzaCategory =
    categorySlug === "pizzas" ||
    categorySlug === "pizza";

  // ==========================================
  // SUBCATEGORIAS
  // ==========================================

  const availableSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.categoryId === activeCategoryId,
  );

  const showSubcategoryTabs =
    availableSubcategories.length > 1;

  const activeSubcategory =
  showSubcategoryTabs &&
  availableSubcategories.some(
    (subcategory) =>
      subcategory.id === selectedSubcategory,
  )
    ? selectedSubcategory
    : null;

  const selectedSubcategoryData =
    availableSubcategories.find(
      (subcategory) =>
        subcategory.id === activeSubcategory,
    );

  const subcategoryName =
    selectedSubcategoryData?.name;

  // ==========================================
  // PRODUTOS VISÍVEIS
  // ==========================================

  const visibleProducts = products.filter((product) => {
  if (product.categoryId !== activeCategoryId) {
    return false;
  }

  if (
    activeSubcategory !== null &&
    product.subcategoryId !== activeSubcategory
  ) {
    return false;
  }

  return product.pricingType === "FIXED";
});

  // ==========================================
  // PRODUTO BASE DA PIZZA
  // ==========================================

  // A pizza precisa estar associada a um
  // produto real do banco para entrar no
  // carrinho e futuramente no checkout.

  const pizzaProduct = products.find(
    (product) =>
      product.categoryId === activeCategoryId &&
      product.pricingType === "PIZZA_CUSTOM",
  );

  // ==========================================
  // VÍDEO DA CATEGORIA
  // ==========================================

  const videoSrc =
    categoryVideos[categorySlug] ?? null;

  // ==========================================
  // REINICIAR MONTAGEM DA PIZZA
  // ==========================================

  function resetPizzaOrder() {
    setPizzaStep("size");
    setSelectedPizzaSize(null);
    setSelectedPizzaFlavors([]);
    setPizzaFlavorTotalCents(0);
    setSelectedPizzaAddons([]);
    setPizzaTotalPriceCents(0);
  }

  // ==========================================
  // NAVEGAÇÃO ENTRE CATEGORIAS
  // ==========================================

  function handleCategorySelect(categoryId: number) {
    if (
      categoryId === activeCategoryId ||
      leaving
    ) {
      return;
    }

    pendingCategory.current = categoryId;
    setLeaving(true);
  }

  // Uma única função finaliza a animação e o fallback.
  // Assim, a nova categoria sempre inicia em "Todos".
  const finishCategoryTransition = useCallback(() => {
    const categoryId = pendingCategory.current;

    if (categoryId === null) return;

    pendingCategory.current = null;
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setSelectedProduct(null);

    setPizzaStep("size");
    setSelectedPizzaSize(null);
    setSelectedPizzaFlavors([]);
    setPizzaFlavorTotalCents(0);
    setSelectedPizzaAddons([]);
    setPizzaTotalPriceCents(0);

    setLeaving(false);
  }, []);

  // Fallback para quando o evento de animação não disparar.
  useEffect(() => {
    if (!leaving) return;

    const timeout = window.setTimeout(() => {
      finishCategoryTransition();
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [leaving, finishCategoryTransition]);

  // ==========================================
  // PRODUTOS CONVENCIONAIS
  // ==========================================

  function handleViewProduct(
    product: CatalogProduct,
  ) {
    setSelectedProduct(product);
  }

  function handleCloseProduct() {
    setSelectedProduct(null);
  }

  function handleAddProduct(
    product: CatalogProduct,
    quantity: number,
    notes: string,
  ) {
    addItem({
      product,
      quantity,
      notes,
      type: "PRODUCT",
      unitPriceCents: product.priceCents,
    });

    setSelectedProduct(null);
    openCart();
  }


  
  // ==========================================
  // ADICIONAR DIRETAMENTE PELO CARD
  // ==========================================

  function handleQuickAddProduct(
    product: CatalogProduct,
    quantity: number,
  ) {
    // Pizzas precisam passar pelo fluxo de
    // personalização antes de entrar na sacola.
    if (product.pricingType === "PIZZA_CUSTOM") {
      handleViewProduct(product);
      return;
    }

    // Garante uma quantidade inteira e positiva.
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      return;
    }

    // Adiciona o produto sem observações.
    addItem({
      product,
      quantity,
      notes: "",
      type: "PRODUCT",
      unitPriceCents: product.priceCents,
    });

    // Abre a sacola após adicionar.
    openCart();
  }


  // ==========================================
  // PIZZA — ETAPA 1: TAMANHO
  // ==========================================

  function handlePizzaSizeContinue(size: PizzaSize) {
    setSelectedPizzaSize(size);

    setSelectedPizzaFlavors([]);
    setSelectedPizzaAddons([]);

    setPizzaFlavorTotalCents(
      size.basePriceCents,
    );

    setPizzaTotalPriceCents(
      size.basePriceCents,
    );

    setPizzaStep("flavors");
  }

  // ==========================================
  // PIZZA — ETAPA 2: SABORES
  // ==========================================

  function handlePizzaFlavorsContinue(
    flavors: PizzaCatalogFlavor[],
    totalPriceCents: number,
  ) {
    if (
      !selectedPizzaSize ||
      flavors.length === 0
    ) {
      return;
    }

    setSelectedPizzaFlavors(flavors);

    setPizzaFlavorTotalCents(
      totalPriceCents,
    );

    setSelectedPizzaAddons([]);

    setPizzaTotalPriceCents(
      totalPriceCents,
    );

    setPizzaStep("addons");
  }

  // ==========================================
  // PIZZA — ETAPA 3: ADICIONAIS
  // ==========================================

  function handlePizzaAddonsContinue(
    addons: PizzaAddon[],
    totalPriceCents: number,
  ) {
    setSelectedPizzaAddons(addons);

    setPizzaTotalPriceCents(
      totalPriceCents,
    );

    setPizzaStep("review");
  }

  // ==========================================
  // PIZZA — ADICIONAR À SACOLA
  // ==========================================

  function handleAddPizzaToCart() {
    if (
      !pizzaProduct ||
      !selectedPizzaSize ||
      selectedPizzaFlavors.length === 0
    ) {
      return;
    }

    addItem({
      product: pizzaProduct,
      type: "PIZZA",
      quantity: 1,
      notes: "",
      unitPriceCents: pizzaTotalPriceCents,

      pizza: {
        size: {
          id: selectedPizzaSize.id,
          name: selectedPizzaSize.name,
          slices: selectedPizzaSize.slices,
          basePriceCents:
            selectedPizzaSize.basePriceCents,
        },

        flavors: selectedPizzaFlavors.map(
          (flavor) => ({
            id: flavor.id,
            name: flavor.name,
            additionalPriceCents:
              flavor.additionalPriceCents +
              (flavor.isPremium
                ? flavor.premiumAdditionalCents
                : 0),
            isPremium: flavor.isPremium,
          }),
        ),

        addons: selectedPizzaAddons.map(
          (addon) => ({
            id: addon.id,
            name: addon.name,
            priceCents: addon.priceCents,
          }),
        ),
      },
    });

    resetPizzaOrder();
    openCart();
  }

  // ==========================================
  // CARREGAMENTO
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-[65dvh] items-center justify-center bg-[#fffaf5] px-5">
        <div className="flex flex-col items-center gap-4 text-center">
          <LoaderCircle
            size={38}
            className="animate-spin text-orange-700"
            aria-hidden="true"
          />

          <h1 className="text-xl font-black text-stone-900">
            Preparando nosso cardápio...
          </h1>

          <p className="text-sm text-stone-500">
            Buscando os produtos disponíveis.
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERRO DA API
  // ==========================================

  if (error) {
    return (
      <main className="flex min-h-[65dvh] items-center justify-center bg-[#fffaf5] px-5">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-stone-900">
            Não foi possível carregar o cardápio.
          </h1>

          <p className="mt-3 text-sm text-stone-500">
            {error}
          </p>

          <button
            type="button"
            onClick={reload}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white hover:bg-orange-800"
          >
            <RefreshCw size={17} />
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // CATÁLOGO VAZIO
  // ==========================================

  if (categories.length === 0) {
    return (
      <main className="flex min-h-[65dvh] items-center justify-center bg-[#fffaf5] px-5">
        <div className="max-w-md text-center">
          <ShoppingBag
            size={40}
            className="mx-auto text-orange-300"
          />

          <h1 className="mt-4 text-xl font-black text-stone-900">
            Nosso cardápio está sendo preparado.
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Em breve você encontrará nossos produtos
            por aqui.
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <>
      <main className="min-h-[calc(100dvh-89px)] bg-[#fffaf5] sm:min-h-[calc(100dvh-105px)]">
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
          {/* CABEÇALHO */}

          <header className="text-center">
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-700 px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-md shadow-orange-700/15">
              <ShoppingBag
                size={15}
                aria-hidden="true"
              />
              Faça seu pedido
            </span>

            <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-stone-950 sm:text-4xl">
              Seu próximo pedido começa aqui.
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
              Escolha uma categoria e encontre seu favorito.
            </p>
          </header>

          {/* CATEGORIAS */}

          <div className="mt-7 sm:mt-8">
            <CategoryTabs
              categories={categories}
              selectedCategory={activeCategoryId}
              onSelect={handleCategorySelect}
            />
          </div>

          {/* CONTEÚDO DA CATEGORIA */}

          <section
            aria-label="Produtos e personalização"
            aria-busy={leaving}
            className="mt-8 sm:mt-10"
          >
            <div
              key={activeCategoryId}
              inert={leaving}
              className={
                leaving
                  ? "catalog-content-exit"
                  : "catalog-content-enter"
              }
              onAnimationEnd={(event) => {
                if (
                  event.target !== event.currentTarget
                ) {
                  return;
                }

                if (leaving) {
                  finishCategoryTransition();
                }
              }}
            >
              {isPizzaCategory ? (
                // ==================================
                // FLUXO EXCLUSIVO DE PIZZAS
                // ==================================

                <>
                  {/* ETAPA 1: TAMANHO */}

                  {pizzaStep === "size" && (
                    <PizzaSizeSelector
                      onContinue={
                        handlePizzaSizeContinue
                      }
                    />
                  )}

                  {/* ETAPA 2: SABORES */}

                  {pizzaStep === "flavors" &&
                    selectedPizzaSize && (
                      <PizzaFlavorSelector
                        sizeId={selectedPizzaSize.id}
                        sizeName={selectedPizzaSize.name}
                        basePriceCents={
                          selectedPizzaSize.basePriceCents
                        }
                        maxFlavors={
                          selectedPizzaSize.maxFlavors
                        }
                        onBack={() =>
                          setPizzaStep("size")
                        }
                        onContinue={
                          handlePizzaFlavorsContinue
                        }
                      />
                    )}

                  {/* ETAPA 3: ADICIONAIS */}

                  {pizzaStep === "addons" &&
                    selectedPizzaFlavors.length > 0 && (
                      <PizzaAddonSelector
                        flavors={selectedPizzaFlavors}
                        baseTotalCents={
                          pizzaFlavorTotalCents
                        }
                        onBack={() =>
                          setPizzaStep("flavors")
                        }
                        onContinue={
                          handlePizzaAddonsContinue
                        }
                      />
                    )}

                  {/* ETAPA 4: REVISÃO */}

                  {pizzaStep === "review" &&
                    selectedPizzaSize && (
                      <div className="mx-auto w-full max-w-2xl">
                        <div className="text-center">
                          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-700">
                            <Pizza size={15} />
                            Monte sua pizza
                          </span>

                          <h2 className="mt-4 text-3xl font-black tracking-tight text-stone-950">
                            Revise sua pizza
                          </h2>

                          <p className="mt-2 text-sm text-stone-500">
                            Confira suas escolhas antes de adicionar
                            à sacola.
                          </p>
                        </div>

                        <div className="mt-7 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                          {/* TAMANHO */}

                          <div className="flex items-center gap-3">
                            <CheckCircle2
                              size={25}
                              className="text-orange-700"
                            />

                            <div>
                              <h3 className="font-black text-stone-900">
                                Pizza {selectedPizzaSize.name}
                              </h3>

                              <p className="text-sm text-stone-500">
                                {selectedPizzaSize.slices} fatias
                              </p>
                            </div>
                          </div>

                          {/* SABORES */}

                          <div className="mt-5 border-t border-stone-100 pt-5">
                            <p className="text-sm font-black text-stone-900">
                              Sabores escolhidos
                            </p>

                            <div className="mt-3 space-y-2">
                              {selectedPizzaFlavors.map(
                                (flavor) => (
                                  <div
                                    key={flavor.id}
                                    className="flex items-center justify-between gap-3 text-sm text-stone-600"
                                  >
                                    <span className="flex items-center gap-2">
                                      <CheckCircle2
                                        size={16}
                                        className="text-orange-700"
                                      />
                                      {flavor.name}
                                    </span>

                                    <span className="shrink-0 text-xs text-orange-700">
                                      +{" "}
                                      {formatPrice(
                                        flavor.additionalPriceCents +
                                          (flavor.isPremium
                                            ? flavor.premiumAdditionalCents
                                            : 0),
                                      )}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          {/* ADICIONAIS */}

                          <div className="mt-5 border-t border-stone-100 pt-5">
                            <p className="text-sm font-black text-stone-900">
                              Adicionais
                            </p>

                            {selectedPizzaAddons.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {selectedPizzaAddons.map(
                                  (addon) => (
                                    <div
                                      key={addon.id}
                                      className="flex items-center justify-between gap-3 text-sm text-stone-600"
                                    >
                                      <span>{addon.name}</span>

                                      <span>
                                        +{" "}
                                        {formatPrice(
                                          addon.priceCents,
                                        )}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-stone-500">
                                Nenhum adicional selecionado.
                              </p>
                            )}
                          </div>

                          {/* TOTAL */}

                          <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-5">
                            <span className="font-black text-stone-900">
                              Total da pizza
                            </span>

                            <span className="text-xl font-black text-orange-700">
                              {formatPrice(
                                pizzaTotalPriceCents,
                              )}
                            </span>
                          </div>
                        </div>

                        {/* VOLTAR */}

                        <button
                          type="button"
                          onClick={() =>
                            setPizzaStep("addons")
                          }
                          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-black text-stone-700 hover:bg-stone-50"
                        >
                          <ArrowLeft size={18} />
                          Voltar aos adicionais
                        </button>

                        {/* ADICIONAR À SACOLA */}

                        <button
                          type="button"
                          onClick={handleAddPizzaToCart}
                          disabled={!pizzaProduct}
                          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-black text-white shadow-md shadow-orange-900/10 transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                        >
                          <ShoppingBag size={18} />
                          Adicionar à sacola
                          <span className="opacity-60">
                            •
                          </span>
                          {formatPrice(
                            pizzaTotalPriceCents,
                          )}
                        </button>

                        {!pizzaProduct && (
                          <p className="mt-3 text-center text-xs text-red-600">
                            Não encontramos um produto base de
                            pizza personalizada no catálogo.
                            Verifique o cadastro no painel
                            administrativo.
                          </p>
                        )}
                      </div>
                    )}
                </>
              ) : (
                // ==================================
                // CATÁLOGO CONVENCIONAL
                // ==================================

                <>

                  {/* SUBCATEGORIAS */}

                  {showSubcategoryTabs && (
                    <div
                      role="group"
                      aria-label={`Tipos de ${categoryName}`}
                      className="flex justify-center"
                    >
                      <div className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-2xl border border-stone-200 bg-white p-1 sm:rounded-full">
                        <button
                          type="button"
                          aria-pressed={activeSubcategory === null}
                          onClick={() => setSelectedSubcategory(null)}
                          className={`min-h-11 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 motion-reduce:transition-none sm:rounded-full ${
                            activeSubcategory === null
                              ? "bg-orange-700 text-white"
                              : "text-stone-600 hover:bg-orange-50 hover:text-orange-700"
                          }`}
                        >
                          Todos
                        </button>
                        {availableSubcategories.map(
                          (subcategory) => {
                            const selected =
                              subcategory.id ===
                              activeSubcategory;

                            return (
                              <button
                                key={subcategory.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                  setSelectedSubcategory(
                                    subcategory.id,
                                  )
                                }
                                className={`min-h-11 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 motion-reduce:transition-none sm:rounded-full ${
                                  selected
                                    ? "bg-orange-700 text-white"
                                    : "text-stone-600 hover:bg-orange-50 hover:text-orange-700"
                                }`}
                              >
                                {subcategory.name}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                  {/* TÍTULO DA CATEGORIA */}

                  <div
                    className={
                      showSubcategoryTabs ? "mt-7" : ""
                    }
                  >
                    <h2
                      id="category-title"
                      className="text-2xl font-black tracking-tight text-stone-900"
                    >
                      {categoryName}
                    </h2>

                    {showSubcategoryTabs && (
                      <p className="mt-1 text-sm font-medium text-stone-500">
                        {subcategoryName}
                      </p>
                    )}
                  </div>

                  {/* CARDS DOS PRODUTOS */}

                  <div
                    key={activeSubcategory ?? "all"}
                    className="catalog-products-enter mt-5"
                  >
                    {visibleProducts.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-3 lg:gap-5">
                        {visibleProducts.map(
                          (product) => (
                            
<ProductCard
  key={product.id}
  product={product}
  onView={handleViewProduct}
  onAddToCart={handleQuickAddProduct}
/>

                          ),
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 px-6 py-12 text-center">
                        <ShoppingBag
                          size={32}
                          aria-hidden="true"
                          className="mx-auto text-orange-300"
                        />

                        <p className="mt-4 font-semibold text-stone-700">
                          Novidades chegando por aqui!
                        </p>

                        <p className="mt-2 text-sm text-stone-500">
                          Os produtos desta seleção serão
                          adicionados em breve.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* VÍDEO DA CATEGORIA */}

                  {videoSrc && (
                    <CategoryVideo
                      src={videoSrc}
                      title={
                        subcategoryName
                          ? `${categoryName} — ${subcategoryName}`
                          : categoryName || "cardápio"
                      }
                    />
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* MODAL DOS PRODUTOS CONVENCIONAIS */}

      {selectedProduct && (
        <ProductDetailsModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={handleCloseProduct}
          onAdd={handleAddProduct}
        />
      )}
    </>
  );
}

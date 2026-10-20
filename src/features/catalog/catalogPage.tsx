
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Pizza,
  ShoppingBag,
} from "lucide-react";

import {
  categories,
  products,
  subcategories,
  type Product,
} from "./catalogData";

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
// COMPONENTE
// ============================================

export function CatalogPage() {
  // ==========================================
  // ESTADOS DO CATÁLOGO
  // ==========================================

  const [selectedCategory, setSelectedCategory] =
    useState(categories[0].id);

  const [selectedSubcategory, setSelectedSubcategory] =
    useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

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

  const pendingCategory = useRef<string | null>(null);

  // ==========================================
  // CARRINHO
  // ==========================================

  const { addItem, openCart } = useCart();

  // ==========================================
  // CATEGORIAS E PRODUTOS CONVENCIONAIS
  // ==========================================

  const availableSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.categoryId === selectedCategory,
  );

  const showSubcategoryTabs =
    availableSubcategories.length > 1;

  const activeSubcategory = showSubcategoryTabs
    ? availableSubcategories.find(
        (subcategory) =>
          subcategory.id === selectedSubcategory,
      )?.id ?? availableSubcategories[0].id
    : null;

  const visibleProducts = products.filter((product) => {
    if (product.categoryId !== selectedCategory) {
      return false;
    }

    return (
      !showSubcategoryTabs ||
      product.subcategoryId === activeSubcategory
    );
  });

  const selectedCategoryData = categories.find(
    (category) => category.id === selectedCategory,
  );

  const isPizzaCategory =
    selectedCategory === "pizzas";

  const categoryName = selectedCategoryData?.name;

  const selectedSubcategoryData =
    availableSubcategories.find(
      (subcategory) =>
        subcategory.id === activeSubcategory,
    );

  const subcategoryName =
    selectedSubcategoryData?.name;

  const videoSrc =
    selectedSubcategoryData?.video ??
    selectedCategoryData?.video;

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

  function handleCategorySelect(categoryId: string) {
    if (
      categoryId === selectedCategory ||
      leaving
    ) {
      return;
    }

    pendingCategory.current = categoryId;
    setLeaving(true);
  }

  function finishCategoryTransition() {
    const categoryId = pendingCategory.current;

    if (!categoryId) return;

    const firstSubcategory = subcategories.find(
      (subcategory) =>
        subcategory.categoryId === categoryId,
    );

    setSelectedCategory(categoryId);

    setSelectedSubcategory(
      firstSubcategory?.id ?? null,
    );

    resetPizzaOrder();

    pendingCategory.current = null;
    setLeaving(false);
  }

  // ==========================================
  // PRODUTOS CONVENCIONAIS
  // ==========================================

  function handleViewProduct(product: Product) {
    setSelectedProduct(product);
  }

  function handleCloseProduct() {
    setSelectedProduct(null);
  }

  function handleAddProduct(
    product: Product,
    quantity: number,
    notes: string,
  ) {
    addItem({
      product,
      quantity,
      notes,
    });

    setSelectedProduct(null);
    openCart();
  }

  // ==========================================
  // ETAPA 1 — TAMANHO
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
  // ETAPA 2 — SABORES
  // ==========================================

  function handlePizzaFlavorsContinue(
    flavors: PizzaCatalogFlavor[],
    totalPriceCents: number,
  ) {
    if (!selectedPizzaSize || flavors.length === 0) {
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
  // ETAPA 3 — ADICIONAIS
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

          {/* CARDS DAS CATEGORIAS */}

          <div className="mt-7 sm:mt-8">
            <CategoryTabs
              categories={categories}
              selectedCategory={selectedCategory}
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
              key={selectedCategory}
              inert={leaving}
              className={
                leaving
                  ? "catalog-content-exit"
                  : "catalog-content-enter"
              }
              onAnimationEnd={(event) => {
                if (
                  event.target !==
                  event.currentTarget
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
                        sizeId={
                          selectedPizzaSize.id
                        }
                        sizeName={
                          selectedPizzaSize.name
                        }
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
                        flavors={
                          selectedPizzaFlavors
                        }
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

                  {/* ETAPA 4: REVISÃO PROVISÓRIA */}

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
                            Confira as escolhas antes de adicionar
                            à sacola.
                          </p>
                        </div>

                        <div className="mt-7 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
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

                          <div className="mt-5 border-t border-stone-100 pt-5">
                            <p className="text-sm font-black text-stone-900">
                              Sabores escolhidos
                            </p>

                            <div className="mt-3 space-y-2">
                              {selectedPizzaFlavors.map(
                                (flavor) => (
                                  <div
                                    key={flavor.id}
                                    className="flex items-center gap-2 text-sm text-stone-600"
                                  >
                                    <CheckCircle2
                                      size={16}
                                      className="text-orange-700"
                                    />

                                    {flavor.name}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

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
                                        + {formatPrice(
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

                        <p className="mt-4 text-center text-xs text-stone-500">
                          A integração com a sacola será feita
                          na próxima etapa.
                        </p>
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
                              onView={
                                handleViewProduct
                              }
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
                          : categoryName ?? "cardápio"
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


import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Pizza,
  RefreshCw,
  ShoppingBag,
  Star,
} from "lucide-react";

import { useCatalog } from "./hooks/useCatalog";

import type {
  CatalogProduct,
} from "./types/catalog.types";

import { CategoryVideo } from "./components/CategoryVideo";
import {
  CategoryTabs,
  type CatalogCategorySelection,
} from "./components/CategoryTabs";
import { ProductCard } from "./components/ProductCard";
import { PizzaOrderProgress, type PizzaStep } from "./components/PizzaOrderProgress";
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
import {
  adminPromotionsApi,
  type PublicPromotion,
} from "../account/admin/api/admin-promotions.api";
import type {
  PizzaFlavorCustomization,
} from "../account/admin/components/products/pizza/PizzaFlavorDetailsModal";

import "../../styles/catalog.css";

import type { RemovedIngredient } from "./api/product-ingredients.api";

// ============================================
// TIPOS
// ============================================

type PizzaOfferSelection = { size: PizzaSize; flavorId: number };

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

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
    useState<CatalogCategorySelection | null>(null);

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

  const [selectedPizzaCustomizations, setSelectedPizzaCustomizations] =
    useState<PizzaFlavorCustomization[]>([]);

  const [selectedPizzaAddons, setSelectedPizzaAddons] =
    useState<PizzaAddon[]>([]);

  const [pizzaTotalPriceCents, setPizzaTotalPriceCents] =
    useState(0);

  // ==========================================
  // ANIMAÇÃO DAS CATEGORIAS
  // ==========================================

  const [leaving, setLeaving] = useState(false);

  const pendingCategory = useRef<{
    categoryId: CatalogCategorySelection;
    pizzaOffer?: PizzaOfferSelection;
  } | null>(null);
  const [promotedFlavorId, setPromotedFlavorId] = useState<number | null>(null);
  const pizzaFlavorsSection = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pizzaStep !== "flavors" || promotedFlavorId === null) return;

    const section = pizzaFlavorsSection.current;
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [pizzaStep, promotedFlavorId]);

  // ==========================================
  // CARRINHO
  // ==========================================

  const { addItem, openCart } = useCart();

  // Promoções públicas válidas: o backend decide datas e disponibilidade.
  const [promotions, setPromotions] = useState<PublicPromotion[]>([]);
  const [promotionFlavors, setPromotionFlavors] = useState<PizzaCatalogFlavor[]>([]);
  const [promotionGrandeSize, setPromotionGrandeSize] = useState<PizzaSize | null>(null);

  

  useEffect(() => {
  let cancelled = false;

  async function loadPromotions() {
    try {
      const data = await adminPromotionsApi.listPublic();

      if (!cancelled) {
        setPromotions(data);
      }
    } catch (error) {
      console.error(
        "[CATALOG] Não foi possível carregar ofertas:",
        error,
      );

      if (!cancelled) {
        setPromotions([]);
      }
    }
  }

  void loadPromotions();

  return () => {
    cancelled = true;
  };
}, []);

  // Busca nomes, imagens e preços reais dos sabores, sem exibir "Sabor #ID".
  useEffect(() => {
    let cancelled = false;
    async function loadPizzaOffers() {
      try {
        const sizesResponse = await fetch(`${API_URL}/api/pizza-sizes`);
        if (!sizesResponse.ok) throw new Error("Falha ao carregar tamanhos");
        const sizes = (await sizesResponse.json()) as PizzaSize[];
        const grande = sizes.find((size) =>
          size.isActive && size.isAvailable && normalizeSlug(size.name) === "grande",
        );
        if (!grande) return;
        const flavorsResponse = await fetch(`${API_URL}/api/pizza-catalog-flavors?sizeId=${grande.id}`);
        if (!flavorsResponse.ok) throw new Error("Falha ao carregar sabores");
        const flavors = (await flavorsResponse.json()) as PizzaCatalogFlavor[];
        if (!cancelled) {
          setPromotionGrandeSize(grande);
          setPromotionFlavors(flavors.filter((flavor) => flavor.isActive));
        }
      } catch (error) {
        console.error("[CATALOG] Não foi possível carregar sabores promocionais:", error);
      }
    }
    void loadPizzaOffers();
    return () => { cancelled = true; };
  }, []);


  const productOffers = useMemo(() => {
    const offers = new Map<number, PublicPromotion>();

    for (const offer of promotions) {
      if (offer.targetType === "PRODUCT" && offer.productId !== null && !offers.has(offer.productId)) {
        offers.set(offer.productId, offer);
      }
    }

    return offers;
  }, [promotions]);

  const getPizzaPromotionPrice = useCallback(
    (size: PizzaSize | null, flavors: PizzaCatalogFlavor[]) => {
      if (
        !size ||
        normalizeSlug(size.name) !== "grande" ||
        flavors.length !== 1
      ) return null;

      return promotions.find(
        (item) =>
          item.targetType === "PIZZA_FLAVOR" &&
          item.pizzaFlavorId === flavors[0]?.id,
      )?.promotionalPriceCents ?? null;
    },
    [promotions],
  );


  const offerProducts = products.filter(
    (product) => product.pricingType === "FIXED" && productOffers.has(product.id),
  );

  const offerFlavors = promotions.flatMap((offer) => {
    if (offer.targetType !== "PIZZA_FLAVOR") return [];
    const flavor = promotionFlavors.find((item) => item.id === offer.pizzaFlavorId);
    if (!flavor || !promotionGrandeSize) return [];
    return [{ offer, flavor }];
  });


  // ==========================================
  // CATEGORIA ATIVA
  // ==========================================

  // Permite que a primeira categoria da API
  // seja selecionada automaticamente.

  const isPromotionsCategory = selectedCategory === "promotions";

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

  const pizzaCategory = categories.find(
    (category) =>
      ["pizza", "pizzas"].includes(normalizeSlug(category.slug)),
  );

  const pizzaProduct = products.find(
    (product) =>
      product.categoryId === pizzaCategory?.id &&
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
    setPromotedFlavorId(null);
    setPizzaStep("size");
    setSelectedPizzaSize(null);
    setSelectedPizzaFlavors([]);
    setSelectedPizzaCustomizations([]);
    setPizzaFlavorTotalCents(0);
    setSelectedPizzaAddons([]);
    setPizzaTotalPriceCents(0);
  }

  // ==========================================
  // NAVEGAÇÃO ENTRE CATEGORIAS
  // ==========================================

  function handleCategorySelect(
    categoryId: CatalogCategorySelection,
    pizzaOffer?: PizzaOfferSelection,
  ) {
    if (
      categoryId === (isPromotionsCategory ? "promotions" : activeCategoryId) ||
      leaving
    ) {
      return;
    }

    pendingCategory.current = { categoryId, pizzaOffer };
    setLeaving(true);
  }

  // Uma única função finaliza a animação e o fallback.
  // Assim, a nova categoria sempre inicia em "Todos".
  const finishCategoryTransition = useCallback(() => {
    const pending = pendingCategory.current;
    if (!pending) return;

    const { categoryId, pizzaOffer } = pending;

    pendingCategory.current = null;
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setSelectedProduct(null);

    setPromotedFlavorId(pizzaOffer?.flavorId ?? null);
    setPizzaStep(pizzaOffer ? "flavors" : "size");
    setSelectedPizzaSize(pizzaOffer?.size ?? null);
    setSelectedPizzaFlavors([]);
    setSelectedPizzaCustomizations([]);
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
  removedIngredients: RemovedIngredient[] = [],
) {
  const offer = productOffers.get(product.id);
  addItem({
    product,
    quantity,
    notes,
    type: "PRODUCT",
    unitPriceCents: offer?.promotionalPriceCents ?? product.priceCents,
    originalUnitPriceCents: product.priceCents,
    promotionId: offer?.id,
    removedIngredients,
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
    const offer = productOffers.get(product.id);
    addItem({
      product,
      quantity,
      notes: "",
      type: "PRODUCT",
      unitPriceCents: offer?.promotionalPriceCents ?? product.priceCents,
      originalUnitPriceCents: product.priceCents,
      promotionId: offer?.id,
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
    setSelectedPizzaCustomizations([]);
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
    customizations: PizzaFlavorCustomization[],
  ) {
    if (
      !selectedPizzaSize ||
      flavors.length === 0
    ) {
      return;
    }

    setSelectedPizzaFlavors(flavors);
    setSelectedPizzaCustomizations(
      customizations.filter((customization) =>
        flavors.some((flavor) => flavor.id === customization.flavorId),
      ),
    );

    const effectivePrice =
      getPizzaPromotionPrice(selectedPizzaSize, flavors) ??
      totalPriceCents;

    setPizzaFlavorTotalCents(effectivePrice);

    setSelectedPizzaAddons([]);

    setPizzaTotalPriceCents(effectivePrice);

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

    setPizzaTotalPriceCents(totalPriceCents);

    setPizzaStep("review");
  }

  // ==========================================
  // PIZZA — ADICIONAR À SACOLA
  // ==========================================

  function addPizzaToCart(
    size: PizzaSize | null,
    flavors: PizzaCatalogFlavor[],
    customizations: PizzaFlavorCustomization[],
    addons: PizzaAddon[],
    totalCents: number,
  ) {
    if (
      !pizzaProduct ||
      !size ||
      flavors.length === 0
    ) {
      return;
    }

    addItem({
      product: pizzaProduct,
      type: "PIZZA",
      quantity: 1,

      // As remoções ficam estruturadas em pizza.flavors,
      // não duplicadas nas observações do cliente.
      notes: "",
      unitPriceCents: totalCents,

      pizza: {
        size: {
          id: size.id,
          name: size.name,
          slices: size.slices,
          basePriceCents: size.basePriceCents,
        },

        flavors: flavors.map((flavor) => {
          const customization = customizations.find(
            (item) => item.flavorId === flavor.id,
          );

          return {
            id: flavor.id,
            name: flavor.name,
            additionalPriceCents:
              flavor.additionalPriceCents +
              (flavor.isPremium ? flavor.premiumAdditionalCents : 0),
            isPremium: flavor.isPremium,
            removedIngredients:
              customization?.removedIngredients.map((ingredient) => ({
                id: ingredient.id,
                name: ingredient.name,
              })) ?? [],
          };
        }),

        addons: addons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          priceCents: addon.priceCents,
        })),
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
      <main className="flex min-h-[calc(100dvh-var(--public-header-height))] items-center justify-center bg-[#fffaf5] px-5">
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
      <main className="flex min-h-[calc(100dvh-var(--public-header-height))] items-center justify-center bg-[#fffaf5] px-5">
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
      <main className="flex min-h-[calc(100dvh-var(--public-header-height))] items-center justify-center bg-[#fffaf5] px-5">
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
      <main className="min-h-[calc(100dvh-var(--public-header-height))] bg-[#fffaf5]">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <header className="relative isolate flex min-h-28 items-center overflow-hidden rounded-2xl bg-[#211d17] px-5 py-4 text-[#fff9ed] sm:min-h-36 sm:px-8">
            <img
              src="/images/cardapio-pizza.jpg"
              alt=""
              className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-[68%_50%] sm:object-center"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-[#211d17] via-[#211d17]/75 to-transparent" />
            <div>
              <h1 className="restaurant-display text-4xl leading-none tracking-tight sm:text-6xl">
                Cardápio
              </h1>
              <p className="mt-2 max-w-56 text-sm text-stone-100 sm:max-w-none sm:text-base">
                Escolha o que vai à mesa hoje.
              </p>
            </div>
          </header>

          {/* CATEGORIAS */}


          <CategoryTabs
            categories={categories}
            selectedCategory={isPromotionsCategory ? "promotions" : activeCategoryId}
            onSelect={handleCategorySelect}
          />

          {/* CONTEÚDO DA CATEGORIA */}

          <section
            aria-label="Produtos e personalização"
            aria-busy={leaving}
            className="mt-5 sm:mt-6"
          >
            <div
              key={isPromotionsCategory ? "promotions" : activeCategoryId}
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
              {isPromotionsCategory ? (
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                      <Star size={23} fill="currentColor" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 id="category-title" className="text-2xl font-black tracking-tight text-stone-900">Promoções</h2>
                      <p className="mt-1 text-sm text-stone-500">Produtos e pizzas com ofertas especiais disponíveis.</p>
                    </div>
                  </div>
                  {offerProducts.length === 0 && (!pizzaProduct || offerFlavors.length === 0) ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center">
                      <Star className="mx-auto text-orange-300" size={32} />
                      <p className="mt-3 font-bold text-stone-800">Nenhuma promoção disponível no momento.</p>
                      <p className="mt-1 text-sm text-stone-500">Confira novamente em breve!</p>
                    </div>
                  ) : (
                    <div className="catalog-short-list mt-4 grid gap-3 md:grid-cols-2">

                      {offerProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          offer={productOffers.get(product.id)}
                          categoryLabel={
                            subcategories.find((category) => category.id === product.subcategoryId)?.name ??
                            categories.find((category) => category.id === product.categoryId)?.name
                          }
                          onView={handleViewProduct}
                          onAddToCart={handleQuickAddProduct}
                        />
                      ))}
                      {pizzaCategory && pizzaProduct && promotionGrandeSize && offerFlavors.map(({ offer, flavor }) => (
                        <ProductCard
                          key={`offer-flavor-${offer.id}`}
                          product={{
                            ...pizzaProduct,
                            name: `Pizza ${flavor.name}`,
                            description: flavor.description,
                            imageUrl: flavor.imageUrl,
                            priceCents: promotionGrandeSize.basePriceCents + flavor.additionalPriceCents +
                              (flavor.isPremium ? flavor.premiumAdditionalCents : 0),
                          }}
                          offer={offer}
                          categoryLabel={`Pizza ${promotionGrandeSize.name} · 1 sabor`}
                          onView={() => handleCategorySelect(pizzaCategory.id, {
                            size: promotionGrandeSize,
                            flavorId: flavor.id,
                          })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : isPizzaCategory ? (
                // ==================================
                // FLUXO EXCLUSIVO DE PIZZAS
                // ==================================

                <>
                  {pizzaStep !== "size" && pizzaStep !== "flavors" && (
                    <PizzaOrderProgress className="mb-3" step={pizzaStep} />
                  )}

                  {/* ETAPA 1: TAMANHO */}

                  {pizzaStep === "size" && (
                    <PizzaSizeSelector onContinue={handlePizzaSizeContinue} />
                  )}

                  {/* ETAPA 2: SABORES */}

                  {pizzaStep === "flavors" &&
                    selectedPizzaSize && (
                      <div
                        ref={pizzaFlavorsSection}
                        tabIndex={-1}
                        className="scroll-mt-[calc(var(--public-header-height)+1rem)] focus:outline-none"
                      >
                        <PizzaFlavorSelector
                          sizeId={selectedPizzaSize.id}
                          sizeName={selectedPizzaSize.name}
                          promotions={promotions}
                          promotedFlavorId={promotedFlavorId}
                          basePriceCents={selectedPizzaSize.basePriceCents}
                          maxFlavors={selectedPizzaSize.maxFlavors}
                          onBack={resetPizzaOrder}
                          onContinue={handlePizzaFlavorsContinue}
                          onAddOfferToCart={(flavors, totalCents, customizations) =>
                            addPizzaToCart(selectedPizzaSize, flavors, customizations, [], totalCents)
                          }
                        />
                      </div>
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
                              {selectedPizzaCustomizations
                                .filter((item) => item.removedIngredients.length > 0)
                                .map((item) => {
                                  const flavor = selectedPizzaFlavors.find(
                                    (value) => value.id === item.flavorId,
                                  );
                                  if (!flavor) return null;

                                  return (
                                    <div
                                      key={`removed-${item.flavorId}`}
                                      className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800"
                                    >
                                      <span className="font-bold">{flavor.name}:</span>{" "}
                                      sem {item.removedIngredients
                                        .map((ingredient) => ingredient.name)
                                        .join(", ")}
                                    </div>
                                  );
                                })}
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
                          onClick={() => addPizzaToCart(
                            selectedPizzaSize,
                            selectedPizzaFlavors,
                            selectedPizzaCustomizations,
                            selectedPizzaAddons,
                            pizzaTotalPriceCents,
                          )}
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
                      showSubcategoryTabs ? "mt-4" : ""
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
                    className="catalog-products-enter mt-3"
                  >
                    {visibleProducts.length > 0 ? (

                      <div className={visibleProducts.length <= 2 ? "catalog-short-list grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"}>
                        {visibleProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            offer={productOffers.get(product.id)}
                            categoryLabel={subcategoryName || categoryName}
                            onView={handleViewProduct}
                            onAddToCart={handleQuickAddProduct}
                          />
                        ))}
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
          promotionalPriceCents={productOffers.get(selectedProduct.id)?.promotionalPriceCents}
          onClose={handleCloseProduct}
          onAdd={handleAddProduct}
        />
      )}
    </>
  );
}

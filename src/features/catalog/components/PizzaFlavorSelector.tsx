import { useEffect, useMemo, useState } from "react";
import { PizzaOrderProgress } from "./PizzaOrderProgress";

import {

  ArrowLeft, ArrowRight, Check, Crown, Eye, ImageOff, ShoppingBag,

  LoaderCircle, Minus, Plus, RefreshCw, Pizza, Tag,

} from "lucide-react";

import {

  PizzaFlavorDetailsModal,

  type PizzaFlavorCustomization,

} from "../../../features/account/admin/components/products/pizza/PizzaFlavorDetailsModal";

import type { PublicPromotion } from "../../../features/account/admin/api/admin-promotions.api";



export type PizzaCatalogFlavor = {

  id: number;

  subcategoryId: number;

  name: string;

  description: string | null;

  imageUrl: string | null;

  additionalPriceCents: number;

  isPremium: boolean;

  premiumAdditionalCents: number;

  allSizes: boolean;

  isActive: boolean;

  sortOrder: number;

};

type PizzaFlavorSelectionHandler = (
  flavors: PizzaCatalogFlavor[],
  totalPriceCents: number,
  customizations: PizzaFlavorCustomization[],
) => void;

type PizzaFlavorSelectorProps = {
  sizeId: number;
  sizeName: string;
  basePriceCents: number;
  maxFlavors?: number;
  promotions?: PublicPromotion[];
  promotedFlavorId?: number | null;
  onBack: () => void;
  onContinue?: PizzaFlavorSelectionHandler;
  onAddOfferToCart?: PizzaFlavorSelectionHandler;
};

const API_URL = (

  import.meta.env.VITE_API_URL || "http://localhost:3000"

).replace(/\/$/, "");

const currency = new Intl.NumberFormat("pt-BR", {

  style: "currency",

  currency: "BRL",

});

function formatPrice(cents: number) {

  return currency.format(cents / 100);

}

function flavorExtraPrice(flavor: PizzaCatalogFlavor) {

  return flavor.additionalPriceCents +

    (flavor.isPremium ? flavor.premiumAdditionalCents : 0);

}

function resolveImageUrl(url: string | null) {

  if (!url) return null;

  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/api/")) return `${API_URL}${url}`;

  return url;

}

export function PizzaFlavorSelector({

  sizeId,

  sizeName,

  basePriceCents,

  maxFlavors = 2,

  promotions = [],

  promotedFlavorId = null,

  onAddOfferToCart,

  onBack,

  onContinue,

}: PizzaFlavorSelectorProps) {

  const limit = Math.min(2, Math.max(1, maxFlavors));

  const [flavors, setFlavors] = useState<PizzaCatalogFlavor[]>([]);

  const [flavorCount, setFlavorCount] = useState(1);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [customizations, setCustomizations] = useState<

    Record<number, PizzaFlavorCustomization>

  >({});

  const [detailsFlavor, setDetailsFlavor] = useState<PizzaCatalogFlavor | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const [failedImages, setFailedImages] = useState<number[]>([]);

  useEffect(() => {

    const controller = new AbortController();

    async function loadFlavors() {

      try {

        const response = await fetch(

          `${API_URL}/api/pizza-catalog-flavors?sizeId=${sizeId}`,

          { signal: controller.signal },

        );

        if (!response.ok) {

          throw new Error("Não foi possível carregar os sabores.");

        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {

          throw new Error("Formato inesperado na resposta dos sabores.");

        }

        if (controller.signal.aborted) return;

        const availableFlavors = (data as PizzaCatalogFlavor[]).filter((flavor) => flavor.isActive);
        setFlavors(availableFlavors);
        setSelectedIds(
          promotedFlavorId !== null && availableFlavors.some((flavor) => flavor.id === promotedFlavorId)
            ? [promotedFlavorId]
            : [],
        );

        setFlavorCount(1);

        setCustomizations({});

        setFailedImages([]);

        setError(null);

      } catch (err) {

        if (controller.signal.aborted) return;

        setError(err instanceof Error ? err.message : "Erro ao carregar sabores.");

      } finally {

        if (!controller.signal.aborted) setLoading(false);

      }

    }

    void loadFlavors();

    return () => controller.abort();

  }, [sizeId, promotedFlavorId, reloadKey]);

  const selectedFlavors = useMemo(

    () => selectedIds

      .map((id) => flavors.find((flavor) => flavor.id === id))

      .filter((flavor): flavor is PizzaCatalogFlavor => Boolean(flavor)),

    [flavors, selectedIds],

  );

  const extraPriceCents = selectedFlavors.reduce(

    (sum, flavor) => sum + flavorExtraPrice(flavor), 0,

  );

  const regularTotalPriceCents = basePriceCents + extraPriceCents;

  const isGrande = sizeName.normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .trim().toLowerCase() === "grande";

  const promotionForFlavor = (id: number) =>

    isGrande && flavorCount === 1 ? promotions.find((promotion) =>

      promotion.targetType === "PIZZA_FLAVOR" && promotion.pizzaFlavorId === id,

    ) : undefined;

  const selectedPromotion = selectedFlavors.length === 1 && flavorCount === 1

    ? promotionForFlavor(selectedFlavors[0].id)

    : undefined;

  const totalPriceCents = selectedPromotion &&
    selectedPromotion.promotionalPriceCents < regularTotalPriceCents
      ? selectedPromotion.promotionalPriceCents
      : regularTotalPriceCents;

  const canContinue = !loading && !error && selectedFlavors.length === flavorCount;
  const canAddOffer = canContinue && Boolean(onAddOfferToCart && selectedPromotion &&
    selectedFlavors[0]?.id === promotedFlavorId);

  function changeFlavorCount(next: number) {

    if (next < 1 || next > limit) return;

    setFlavorCount(next);

    setSelectedIds((current) => current.slice(0, next));

  }

  function toggleFlavor(id: number) {

    setSelectedIds((current) => {

      if (current.includes(id)) {

        return current.filter((selectedId) => selectedId !== id);

      }

      if (flavorCount === 1) return [id];

      if (current.length < flavorCount) return [...current, id];

      return current;

    });

  }

  function handleCustomization(value: PizzaFlavorCustomization) {

    setCustomizations((current) => ({ ...current, [value.flavorId]: value }));

    setDetailsFlavor(null);

  }

  function submitSelection(callback?: PizzaFlavorSelectionHandler) {
    if (!canContinue || !callback) return;

    callback(

      selectedFlavors,

      totalPriceCents,

      selectedFlavors.map((flavor) => customizations[flavor.id] ?? {

        flavorId: flavor.id,

        removedIngredients: [],

      }),

    );

  }

  return (

    <div className="w-full">

      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>

        <h2 className="restaurant-display text-2xl leading-tight tracking-tight text-stone-950 sm:text-3xl">

          Escolha os sabores da sua pizza

        </h2>

        <p className="mt-2 text-sm text-stone-500">

          Pizza {sizeName}. Escolha até {limit} {limit === 1 ? "sabor" : "sabores"} diferentes.

        </p>

        </div>

        <PizzaOrderProgress step="flavors" className="order-last w-full xl:order-0 xl:w-auto" />
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1">
          <span className="px-1 text-xs font-semibold text-stone-700">Quantidade de sabores</span>

          <button type="button" onClick={() => changeFlavorCount(flavorCount - 1)}

            disabled={flavorCount <= 1} aria-label="Diminuir quantidade de sabores"

            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-stone-700 shadow-sm transition hover:text-orange-700 disabled:opacity-30">

            <Minus size={17} />

          </button>

          <span className="min-w-7 text-center text-lg font-black text-stone-900">{flavorCount}</span>

          <button type="button" onClick={() => changeFlavorCount(flavorCount + 1)}

            disabled={flavorCount >= limit} aria-label="Aumentar quantidade de sabores"

            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-stone-700 shadow-sm transition hover:text-orange-700 disabled:opacity-30">

            <Plus size={17} />

          </button>

        </div>

      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,25%)]">
        <div className="min-w-0">
          {loading && (

            <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-stone-500">

              <LoaderCircle size={22} className="animate-spin text-orange-700" /> Carregando sabores...

            </div>

          )}

          {!loading && error && (

            <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">

              <p className="text-sm font-semibold text-red-700">{error}</p>

              <button type="button" onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }}

                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-bold text-white hover:bg-orange-800">

                <RefreshCw size={16} /> Tentar novamente

              </button>

            </div>

          )}

          {!loading && !error && flavors.length === 0 && (

            <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-8 text-center">

              <ImageOff size={32} className="mx-auto text-orange-300" />

              <p className="mt-3 font-bold text-stone-800">Nenhum sabor disponível.</p>

              <p className="mt-2 text-sm text-stone-500">Os sabores serão disponibilizados em breve.</p>

            </div>

          )}

          {!loading && !error && flavors.length > 0 && (

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">

              {flavors.map((flavor) => {

                const selected = selectedIds.includes(flavor.id);

                const reachedLimit = !selected && selectedIds.length >= flavorCount;

                const imageUrl = resolveImageUrl(flavor.imageUrl);

                const showImage = Boolean(imageUrl) && !failedImages.includes(flavor.id);

                const extra = flavorExtraPrice(flavor);

                const offer = promotionForFlavor(flavor.id);

                const regularSinglePrice = basePriceCents + extra;

                const discounted = offer !== undefined && offer.promotionalPriceCents < regularSinglePrice;

                const removed = customizations[flavor.id]?.removedIngredients ?? [];

                return (

                  <article key={flavor.id}

                    className={`group relative overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all duration-300 hover:shadow-lg ${selected ? "border-orange-700 shadow-orange-700/15" : "border-stone-200 hover:border-orange-300"}`}>

                    <div className="relative h-20 overflow-hidden bg-orange-50">

                      {showImage ? (

                        <img src={imageUrl!} alt={flavor.name} loading="lazy"

                          className="h-full w-full object-cover object-center"

                          onError={() => setFailedImages((current) => current.includes(flavor.id) ? current : [...current, flavor.id])} />

                      ) : (

                        <div className="flex h-full items-center justify-center bg-linear-to-br from-orange-50 to-amber-100 text-orange-300">

                          <Pizza size={42} strokeWidth={1.4} />

                        </div>

                      )}

                      {discounted && (

                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-green-700 px-3 py-1.5 text-xs font-black text-white shadow-md">

                          <Tag size={13} /> Em oferta

                        </span>

                      )}

                      {flavor.isPremium && (

                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-black text-white shadow-md">

                          <Crown size={13} /> Sabor nobre

                        </span>

                      )}

                      {selected && (

                        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-700 text-white shadow-md">

                          <Check size={19} />

                        </span>

                      )}

                    </div>

                    <div className="p-3">

                      <h3 className="text-lg font-black text-stone-900">{flavor.name}</h3>

                      {flavor.description && (

                        <p className="mt-1 line-clamp-2 text-xs text-stone-600">{flavor.description}</p>

                      )}

                      {discounted ? (
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs">
                          <s className="text-stone-500">{formatPrice(regularSinglePrice)}</s>
                          <strong className="text-sm text-green-800">{formatPrice(offer.promotionalPriceCents)}</strong>
                          <span className="text-stone-600">Grande · 1 sabor</span>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-xs font-bold text-orange-800">
                          {extra > 0 ? "+ " + formatPrice(extra) : "Sem acréscimo"}
                        </p>
                      )}

                      {selected && removed.length > 0 && (

                        <p className="mt-2 text-xs font-semibold text-amber-800">

                          Sem: {removed.map((ingredient) => ingredient.name).join(", ")}

                        </p>

                      )}

                      <div className="mt-2 grid grid-cols-2 gap-2">

                        <button type="button" onClick={() => setDetailsFlavor(flavor)}

                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-800 transition hover:bg-orange-100">

                          <Eye size={16} /> Ver detalhes

                        </button>

                        <button type="button" aria-pressed={selected}

                          disabled={flavorCount > 1 && reachedLimit}

                          onClick={() => toggleFlavor(flavor.id)}

                          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "bg-orange-700 text-white hover:bg-orange-800" : "bg-stone-100 text-stone-800 hover:bg-stone-200"}`}>

                          {selected ? <><Check size={15} /> Selecionado</> : "Selecionar"}

                        </button>

                      </div>

                    </div>

                  </article>

                );

              })}

            </div>

          )}

        </div>
        <div className="min-w-0">
          {/* RESUMO DINÂMICO DOS VALORES */}
          <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-stone-500">Preço base</span>
              <span className="text-sm font-bold text-stone-900">{formatPrice(basePriceCents)}</span>
            </div>

            {selectedFlavors.map((flavor) => {
              const removed = customizations[flavor.id]?.removedIngredients ?? [];
              return (
                <div key={flavor.id} className="mt-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-sm text-stone-600">
                      {flavor.name}{flavor.isPremium && " (nobre)"}
                    </span>
                    {removed.length > 0 && (
                      <p className="mt-1 text-xs text-amber-800">
                        Sem: {removed.map((item) => item.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-stone-900">
                    + {formatPrice(flavorExtraPrice(flavor))}
                  </span>
                </div>
              );
            })}

            {selectedPromotion && totalPriceCents < regularTotalPriceCents && (
              <div className="mt-4 space-y-2 rounded-xl border border-green-100 bg-green-50 p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-bold text-green-800">
                    <Tag size={15} aria-hidden="true" /> Oferta aplicada
                  </span>
                  <span className="text-xs font-semibold text-green-800">
                    Grande · 1 sabor
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-green-800">Desconto promocional</span>
                  <strong className="text-green-800">
                    - {formatPrice(regularTotalPriceCents - totalPriceCents)}
                  </strong>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
              <span className="font-black text-stone-900">Total da pizza</span>
              <div className="text-right">
                {selectedPromotion && totalPriceCents < regularTotalPriceCents && (
                  <span className="block text-xs font-semibold text-stone-400 line-through">
                    {formatPrice(regularTotalPriceCents)}
                  </span>
                )}
                <strong className={`block text-xl font-black ${
                  selectedPromotion && totalPriceCents < regularTotalPriceCents
                    ? "text-green-700"
                    : "text-orange-700"
                }`}>
                  {formatPrice(totalPriceCents)}
                </strong>
              </div>
            </div>

            <p className="mt-2 text-xs text-stone-500">
              {selectedFlavors.length === 0
                ? "Selecione os sabores para visualizar o valor final da pizza."
                : selectedPromotion && totalPriceCents < regularTotalPriceCents
                  ? "Promoção válida apenas para pizza Grande com 1 sabor. Adicionais opcionais são cobrados à parte."
                  : flavorCount === 2
                    ? "Para pizzas com 2 sabores, vale o preço base mais os acréscimos de cada sabor, sem desconto promocional."
                    : "Preço base mais o acréscimo do sabor selecionado. Adicionais opcionais são calculados posteriormente."}
            </p>
          </div>

          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row lg:flex-col-reverse">

            <button type="button" onClick={onBack}

              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-black text-stone-700 transition hover:bg-stone-50">

              <ArrowLeft size={18} /> Voltar

            </button>

            <button type="button" disabled={!canContinue || !onContinue} onClick={() => submitSelection(onContinue)}

              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50">

              {canAddOffer ? "Escolher adicionais" : "Continuar"} <ArrowRight size={18} />

            </button>

            {canAddOffer && (
              <button
                type="button"
                onClick={() => submitSelection(onAddOfferToCart)}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-900"
              >
                <ShoppingBag size={18} aria-hidden="true" />
                Adicionar à sacola
              </button>
            )}

          </div>

        </div>
      </div>

      {detailsFlavor && (

        <PizzaFlavorDetailsModal

          key={detailsFlavor.id}

          flavor={detailsFlavor}

          initialRemovedIngredientIds={

            customizations[detailsFlavor.id]?.removedIngredients.map((item) => item.id) ?? []

          }

          onClose={() => setDetailsFlavor(null)}

          onConfirm={handleCustomization}

        />

      )}

    </div>

  );

}

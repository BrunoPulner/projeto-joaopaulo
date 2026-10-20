
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  ImageOff,
  LoaderCircle,
  Minus,
  Plus,
  RefreshCw,
  Pizza,
} from "lucide-react";

// ============================================
// TIPOS
// ============================================

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

type PizzaFlavorSelectorProps = {
  sizeId: number;
  sizeName: string;
  basePriceCents: number;
  maxFlavors?: number;

  onBack: () => void;

  onContinue?: (
    flavors: PizzaCatalogFlavor[],
    totalPriceCents: number,
  ) => void;
};

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatPrice(cents: number) {
  return currency.format(cents / 100);
}

function flavorExtraPrice(flavor: PizzaCatalogFlavor) {
  return (
    flavor.additionalPriceCents +
    (flavor.isPremium
      ? flavor.premiumAdditionalCents
      : 0)
  );
}

function resolveImageUrl(url: string | null) {
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/api/")) {
    return `${API_URL}${url}`;
  }

  return url;
}

// ============================================
// COMPONENTE
// ============================================

export function PizzaFlavorSelector({
  sizeId,
  sizeName,
  basePriceCents,
  maxFlavors = 2,
  onBack,
  onContinue,
}: PizzaFlavorSelectorProps) {
  const limit = Math.min(2, Math.max(1, maxFlavors));

  const [flavors, setFlavors] = useState<
    PizzaCatalogFlavor[]
  >([]);

  const [flavorCount, setFlavorCount] = useState(1);

  const [selectedIds, setSelectedIds] = useState<
    number[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [reloadKey, setReloadKey] = useState(0);

  const [failedImages, setFailedImages] = useState<
    number[]
  >([]);

  // ==========================================
  // CARREGAR SABORES DO NEON VIA API
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadFlavors() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/pizza-catalog-flavors?sizeId=${sizeId}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            "Não foi possível carregar os sabores.",
          );
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "Formato inesperado na resposta dos sabores.",
          );
        }

        const available = (
          data as PizzaCatalogFlavor[]
        ).filter((flavor) => flavor.isActive);

        if (controller.signal.aborted) return;

        setFlavors(available);
        setSelectedIds([]);
        setFlavorCount(1);
        setFailedImages([]);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar sabores.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadFlavors();

    return () => controller.abort();
  }, [sizeId, reloadKey]);

  // ==========================================
  // CÁLCULOS
  // ==========================================

  const selectedFlavors = useMemo(
    () =>
      selectedIds
        .map((id) =>
          flavors.find((flavor) => flavor.id === id),
        )
        .filter(
          (flavor): flavor is PizzaCatalogFlavor =>
            Boolean(flavor),
        ),
    [flavors, selectedIds],
  );

  const extraPriceCents = selectedFlavors.reduce(
    (sum, flavor) => sum + flavorExtraPrice(flavor),
    0,
  );

  const totalPriceCents =
    basePriceCents + extraPriceCents;

  const canContinue =
    selectedFlavors.length === flavorCount;

  // ==========================================
  // SELEÇÃO
  // ==========================================

  function changeFlavorCount(next: number) {
    if (next < 1 || next > limit) return;

    setFlavorCount(next);

    setSelectedIds((current) =>
      current.slice(0, next),
    );
  }

  function toggleFlavor(id: number) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter(
          (selectedId) => selectedId !== id,
        );
      }

      if (current.length >= flavorCount) {
        return current;
      }

      return [...current, id];
    });
  }

  function handleContinue() {
    if (!canContinue || !onContinue) return;

    onContinue(selectedFlavors, totalPriceCents);
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* CABEÇALHO */}

      <div className="mb-7 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-700">
          <Pizza size={15} />
          Monte sua pizza
        </span>

        <h2 className="mt-4 text-2xl font-black tracking-tight text-stone-950 sm:text-3xl">
          Escolha os sabores da sua pizza
        </h2>

        <p className="mt-2 text-sm text-stone-500">
          Pizza {sizeName}. Escolha até {limit}{" "}
          {limit === 1 ? "sabor" : "sabores"} diferentes.
        </p>
      </div>

      {/* QUANTIDADE DE SABORES */}

      <div className="mx-auto mb-8 flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-black text-stone-900">
            Quantos sabores?
          </h3>

          <p className="mt-1 text-xs text-stone-500">
            Selecione 1 ou {limit} sabores.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-1">
          <button
            type="button"
            onClick={() =>
              changeFlavorCount(flavorCount - 1)
            }
            disabled={flavorCount <= 1}
            aria-label="Diminuir quantidade de sabores"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-stone-700 shadow-sm transition hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={17} />
          </button>

          <span className="min-w-7 text-center text-lg font-black text-stone-900">
            {flavorCount}
          </span>

          <button
            type="button"
            onClick={() =>
              changeFlavorCount(flavorCount + 1)
            }
            disabled={flavorCount >= limit}
            aria-label="Aumentar quantidade de sabores"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-stone-700 shadow-sm transition hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={17} />
          </button>
        </div>
      </div>

      {/* CARREGAMENTO */}

      {loading && (
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-stone-500">
          <LoaderCircle
            size={22}
            className="animate-spin text-orange-700"
          />
          Carregando sabores...
        </div>
      )}

      {/* ERRO */}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setReloadKey((value) => value + 1)
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-bold text-white hover:bg-orange-800"
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      )}

      {/* SEM SABORES */}

      {!loading &&
        !error &&
        flavors.length === 0 && (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-8 text-center">
            <ImageOff
              size={32}
              className="mx-auto text-orange-300"
            />

            <p className="mt-3 font-bold text-stone-800">
              Nenhum sabor disponível.
            </p>

            <p className="mt-2 text-sm text-stone-500">
              Os sabores serão disponibilizados
              em breve.
            </p>
          </div>
        )}

      {/* CARDS DE SABORES */}

      {!loading &&
        !error &&
        flavors.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {flavors.map((flavor) => {
              const selected = selectedIds.includes(
                flavor.id,
              );

              const reachedLimit =
                !selected &&
                selectedIds.length >= flavorCount;

              const imageUrl = resolveImageUrl(
                flavor.imageUrl,
              );

              const showImage =
                Boolean(imageUrl) &&
                !failedImages.includes(flavor.id);

              const extra = flavorExtraPrice(flavor);

              return (
                <button
                  key={flavor.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={reachedLimit}
                  onClick={() =>
                    toggleFlavor(flavor.id)
                  }
                  className={`group relative overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700 disabled:cursor-not-allowed disabled:opacity-55 ${
                    selected
                      ? "border-orange-700 shadow-orange-700/15"
                      : "border-stone-200 hover:border-orange-300"
                  }`}
                >
                  {/* IMAGEM */}

                  <div className="relative aspect-video overflow-hidden bg-orange-50">
                    {showImage ? (
                      <img
                        src={imageUrl!}
                        alt={flavor.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() =>
                          setFailedImages((current) => [
                            ...current,
                            flavor.id,
                          ])
                        }
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-linear-to-br from-orange-50 to-amber-100 text-orange-300">
                        <Pizza
                          size={42}
                          strokeWidth={1.4}
                        />
                      </div>
                    )}

                    {flavor.isPremium && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-black text-white shadow-md">
                        <Crown size={13} />
                        Sabor nobre
                      </span>
                    )}

                    {selected && (
                      <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-700 text-white shadow-md">
                        <Check size={19} />
                      </span>
                    )}
                  </div>

                  {/* INFORMAÇÕES */}

                  <div className="p-4">
                    <h3 className="text-lg font-black text-stone-900">
                      {flavor.name}
                    </h3>

                    {flavor.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                        {flavor.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-orange-700">
                        {extra > 0
                          ? `+ ${formatPrice(extra)}`
                          : "Sem acréscimo"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          selected
                            ? "bg-orange-700 text-white"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {selected
                          ? "Selecionado"
                          : "Selecionar"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      {/* RESUMO E NAVEGAÇÃO */}

      <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-stone-500">
            Preço base
          </span>

          <span className="text-sm font-bold text-stone-900">
            {formatPrice(basePriceCents)}
          </span>
        </div>

        {selectedFlavors.map((flavor) => (
          <div
            key={flavor.id}
            className="mt-3 flex items-center justify-between gap-4"
          >
            <span className="min-w-0 text-sm text-stone-600">
              {flavor.name}
              {flavor.isPremium && " (nobre)"}
            </span>

            <span className="shrink-0 text-sm font-semibold text-stone-900">
              + {formatPrice(flavorExtraPrice(flavor))}
            </span>
          </div>
        ))}

        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
          <span className="font-black text-stone-900">
            Total da pizza
          </span>

          <span className="text-xl font-black text-orange-700">
            {formatPrice(totalPriceCents)}
          </span>
        </div>

        <p className="mt-2 text-xs text-stone-500">
          Os acréscimos dos sabores são somados.
          Adicionais opcionais serão calculados
          posteriormente.
        </p>
      </div>

      <div className="mx-auto mt-6 flex max-w-2xl flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-black text-stone-700 transition hover:bg-stone-50"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <button
          type="button"
          disabled={!canContinue || !onContinue}
          onClick={handleContinue}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

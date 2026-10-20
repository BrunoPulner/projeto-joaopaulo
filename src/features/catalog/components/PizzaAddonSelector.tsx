
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Pizza,
  Plus,
  RefreshCw,
} from "lucide-react";

import type { PizzaCatalogFlavor } from "./PizzaFlavorSelector";

// ============================================
// TIPOS
// ============================================

export type PizzaAddon = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  linkId: number;
  linkIsActive: boolean;
  sortOrder: number;
};

type PizzaAddonSelectorProps = {
  flavors: PizzaCatalogFlavor[];
  baseTotalCents: number;
  onBack: () => void;
  onContinue: (
    addons: PizzaAddon[],
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

function resolveImageUrl(url: string | null) {
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return `${API_URL}/${url}`;
}

// ============================================
// COMPONENTE
// ============================================

export function PizzaAddonSelector({
  flavors,
  baseTotalCents,
  onBack,
  onContinue,
}: PizzaAddonSelectorProps) {
  const [addons, setAddons] = useState<PizzaAddon[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [failedImages, setFailedImages] = useState<number[]>([]);

  const flavorIdsKey = flavors
    .map((flavor) => flavor.id)
    .sort((a, b) => a - b)
    .join(",");

  // ==========================================
  // CONSULTAR ADICIONAIS
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadAddons() {
      setLoading(true);
      setError(null);

      try {
        const subcategoryIds = [
          ...new Set(
            flavors.map((flavor) => flavor.subcategoryId),
          ),
        ];

        const endpoints = [
          ...subcategoryIds.map(
            (id) =>
              `${API_URL}/api/pizza-addons/subcategory/${id}`,
          ),
          ...flavors.map(
            (flavor) =>
              `${API_URL}/api/pizza-addons/flavor/${flavor.id}`,
          ),
        ];

        const results = await Promise.all(
          endpoints.map(async (endpoint) => {
            const response = await fetch(endpoint, {
              signal: controller.signal,
            });

            if (!response.ok) {
              throw new Error(
                "Não foi possível carregar os adicionais.",
              );
            }

            const data: unknown = await response.json();

            if (!Array.isArray(data)) {
              throw new Error(
                "Resposta inválida da API de adicionais.",
              );
            }

            return data as PizzaAddon[];
          }),
        );

        const uniqueAddons = new Map<number, PizzaAddon>();

        for (const list of results) {
          for (const addon of list) {
            if (
              addon.isActive &&
              addon.linkIsActive &&
              !uniqueAddons.has(addon.id)
            ) {
              uniqueAddons.set(addon.id, addon);
            }
          }
        }

        const sorted = [...uniqueAddons.values()].sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.name.localeCompare(b.name, "pt-BR"),
        );

        if (controller.signal.aborted) return;

        setAddons(sorted);
        setSelectedIds([]);
        setFailedImages([]);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar adicionais.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadAddons();

    return () => controller.abort();
    // Recarregar apenas quando mudarem os sabores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flavorIdsKey, reloadKey]);

  // ==========================================
  // SELEÇÃO E PREÇO
  // ==========================================

  const selectedAddons = useMemo(
    () =>
      addons.filter((addon) =>
        selectedIds.includes(addon.id),
      ),
    [addons, selectedIds],
  );

  const addonTotalCents = selectedAddons.reduce(
    (sum, addon) => sum + addon.priceCents,
    0,
  );

  const totalPriceCents =
    baseTotalCents + addonTotalCents;

  function toggleAddon(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-7 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-700">
          <Pizza size={15} />
          Monte sua pizza
        </span>

        <h2 className="mt-4 text-2xl font-black tracking-tight text-stone-950 sm:text-3xl">
          Deseja adicionar algo à sua pizza?
        </h2>

        <p className="mt-2 text-sm text-stone-500">
          Escolha seus adicionais favoritos ou continue
          sem adicionar nada.
        </p>
      </div>

      {loading && (
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-stone-500">
          <LoaderCircle
            size={22}
            className="animate-spin text-orange-700"
          />
          Carregando adicionais...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-bold text-white hover:bg-orange-800"
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && addons.length === 0 && (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-10 text-center">
          <Pizza
            size={32}
            className="mx-auto text-orange-300"
          />
          <p className="mt-3 font-bold text-stone-800">
            Nenhum adicional disponível.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Você pode continuar com os sabores escolhidos.
          </p>
        </div>
      )}

      {!loading && !error && addons.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addons.map((addon) => {
            const selected = selectedIds.includes(addon.id);
            const imageUrl = resolveImageUrl(addon.imageUrl);
            const showImage =
              Boolean(imageUrl) &&
              !failedImages.includes(addon.id);

            return (
              <button
                key={addon.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleAddon(addon.id)}
                className={`group overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  selected
                    ? "border-orange-700 shadow-orange-700/15"
                    : "border-stone-200 hover:border-orange-300"
                }`}
              >
                <div className="relative aspect-video bg-orange-50">
                  {showImage ? (
                    <img
                      src={imageUrl!}
                      alt={addon.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={() =>
                        setFailedImages((current) => [
                          ...current,
                          addon.id,
                        ])
                      }
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-orange-300">
                      <Pizza size={42} strokeWidth={1.4} />
                    </div>
                  )}

                  {selected && (
                    <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-700 text-white">
                      <Check size={19} />
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-black text-stone-900">
                    {addon.name}
                  </h3>

                  {addon.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                      {addon.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-orange-700">
                      + {formatPrice(addon.priceCents)}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${
                        selected
                          ? "bg-orange-700 text-white"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {selected ? (
                        <>
                          <Check size={13} />
                          Selecionado
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          Adicionar
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && !error && (
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500">
              Pizza com sabores
            </span>
            <span className="font-bold text-stone-900">
              {formatPrice(baseTotalCents)}
            </span>
          </div>

          {selectedAddons.map((addon) => (
            <div
              key={addon.id}
              className="mt-3 flex items-center justify-between gap-3"
            >
              <span className="text-sm text-stone-600">
                {addon.name}
              </span>
              <span className="text-sm font-semibold text-stone-900">
                + {formatPrice(addon.priceCents)}
              </span>
            </div>
          ))}

          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
            <span className="font-black text-stone-900">
              Total
            </span>
            <span className="text-xl font-black text-orange-700">
              {formatPrice(totalPriceCents)}
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto mt-6 flex max-w-2xl flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-black text-stone-700 hover:bg-stone-50"
        >
          <ArrowLeft size={18} />
          Voltar aos sabores
        </button>

        <button
          type="button"
          disabled={loading || Boolean(error)}
          onClick={() =>
            onContinue(selectedAddons, totalPriceCents)
          }
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-black text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar para revisão
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

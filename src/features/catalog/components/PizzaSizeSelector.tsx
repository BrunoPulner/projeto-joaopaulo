
import { useEffect, useState } from "react";
import { PizzaOrderProgress } from "./PizzaOrderProgress";
import {
  ArrowRight,
  CheckCircle2,
  ImageOff,
  LoaderCircle,
  Pizza,
  RefreshCw,
} from "lucide-react";

export type PizzaSize = {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  slices: number;
  diameterCm?: number | null;
  basePriceCents: number;
  maxFlavors: number;
  isActive: boolean;
  isAvailable: boolean;
  sortOrder?: number;
};

type PizzaSizeSelectorProps = {
  onContinue?: (size: PizzaSize) => void;
};

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatPrice(priceCents: number) {
  return currency.format(priceCents / 100);
}

function resolveImageUrl(
  imageUrl?: string | null,
): string | null {
  if (!imageUrl?.trim()) return null;

  const value = imageUrl.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${API_URL}/${value.replace(/^\/+/, "")}`;
}

function PizzaSizeImage({
  size,
}: {
  size: PizzaSize;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(
    null,
  );

  const imageUrl = resolveImageUrl(size.imageUrl);
  const showImage = imageUrl && failedUrl !== imageUrl;

  return (
    <div className="relative aspect-square w-full max-w-28 overflow-hidden rounded-xl bg-[#faf2e6]">
      {showImage ? (
        <img
          src={imageUrl}
          alt={`Tamanho de pizza ${size.name}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(imageUrl)}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-orange-700">
          {imageUrl ? (
            <ImageOff size={32} strokeWidth={1.5} />
          ) : (
            <Pizza size={42} strokeWidth={1.5} />
          )}
        </div>
      )}
    </div>
  );
}

export function PizzaSizeSelector({
  onContinue,
}: PizzaSizeSelectorProps) {
  const [sizes, setSizes] = useState<PizzaSize[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSizes() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/pizza-sizes`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(
            "Não foi possível carregar os tamanhos.",
          );
        }

        const data: unknown = await response.json();

        const list: PizzaSize[] = Array.isArray(data)
          ? data
          : typeof data === "object" &&
              data !== null &&
              "sizes" in data &&
              Array.isArray(data.sizes)
            ? data.sizes
            : typeof data === "object" &&
                data !== null &&
                "data" in data &&
                Array.isArray(data.data)
              ? data.data
              : [];

        const activeSizes = list.filter(
          (size) =>
            size.isActive !== false &&
            size.isAvailable !== false,
        );

        if (!controller.signal.aborted) {
          setSizes(activeSizes);
          setSelectedId((current) =>
            activeSizes.some((size) => size.id === current)
              ? current
              : null,
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar tamanhos.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSizes();

    return () => controller.abort();
  }, [reloadKey]);

  const selectedSize =
    sizes.find((size) => size.id === selectedId) ?? null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-5 gap-y-2 sm:mb-4">
        <div>
          <h2 className="restaurant-display text-2xl leading-tight tracking-tight text-stone-950 sm:text-3xl">
            Escolha o tamanho da sua pizza
          </h2>
          <p className="mt-1 text-sm text-stone-600">Você escolhe os sabores na próxima etapa.</p>
        </div>
        <PizzaOrderProgress step="size" />
      </div>

      {loading && (
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm font-semibold text-stone-500">
          <LoaderCircle
            size={22}
            className="animate-spin text-orange-700"
          />
          Carregando tamanhos...
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

      {!loading && !error && sizes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-8 text-center">
          <Pizza
            size={32}
            className="mx-auto text-orange-300"
          />
          <p className="mt-3 font-bold text-stone-800">
            Nenhum tamanho disponível.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Os tamanhos de pizza serão disponibilizados
            em breve.
          </p>
        </div>
      )}

      {!loading && !error && sizes.length > 0 && (
        <>
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {sizes.map((size) => {
              const selected = selectedId === size.id;

              return (
                <button
                  key={size.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedId(size.id)}
                  className={`relative grid min-w-0 grid-cols-[minmax(4.75rem,0.7fr)_minmax(0,1fr)] items-center gap-2.5 rounded-xl border bg-white p-2.5 text-left shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-800 sm:p-3 ${
                    selected ? "border-orange-800 bg-[#fff8ef] ring-1 ring-orange-800" : "border-stone-200 hover:border-orange-400"
                  }`}
                >
                  <PizzaSizeImage size={size} />
                  <div className="min-w-0 border-l border-stone-200 pl-2.5">
                    <h3 className="restaurant-display wrap-break-word text-xl leading-tight text-stone-950 sm:text-2xl">{size.name}</h3>
                    <div className="mt-1 text-xs font-medium text-stone-600">
                      {size.slices != null && <span>{size.slices} {size.slices === 1 ? "fatia" : "fatias"}</span>}
                      {size.diameterCm != null && <span>{size.slices != null && " · "}{size.diameterCm} cm</span>}
                    </div>
                    <p className="mt-1 text-xs text-stone-600">Até {size.maxFlavors} {size.maxFlavors === 1 ? "sabor" : "sabores"}</p>
                    {size.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-stone-600">{size.description}</p>
                    )}
                    <p className="mt-1 text-sm font-bold text-stone-950">{formatPrice(size.basePriceCents)}</p>
                    <span className={`mt-1 inline-flex items-center gap-1 text-xs font-bold ${selected ? "text-orange-800" : "text-stone-600"}`}>
                      {selected && <CheckCircle2 size={14} aria-hidden="true" />}
                      {selected ? "Selecionado" : "Selecionar"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col items-end gap-2">
            <button
              type="button"
              disabled={!selectedSize || !onContinue}
              onClick={() => {
                if (selectedSize) {
                  onContinue?.(selectedSize);
                }
              }}
              className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-orange-700 px-6 py-3 text-sm font-black text-white shadow-md shadow-orange-700/15 transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar para sabores
              <ArrowRight size={18} />
            </button>

            {!onContinue && selectedSize && (
              <p className="text-center text-xs text-stone-500">
                A seleção de sabores será conectada
                na próxima etapa.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

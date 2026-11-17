
import { useEffect, useState } from "react";
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
    <div className="relative aspect-16/10 w-full overflow-hidden bg-orange-50">
      {showImage ? (
        <img
          src={imageUrl}
          alt={`Tamanho de pizza ${size.name}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(imageUrl)}
          className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
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
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-7 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-700">
          <Pizza size={15} />
          Monte sua pizza
        </span>

        <h2 className="mt-4 text-2xl font-black tracking-tight text-stone-950 sm:text-3xl">
          Escolha o tamanho da sua pizza
        </h2>

        <p className="mt-2 text-sm text-stone-500">
          Primeiro escolha o tamanho. Depois você poderá
          selecionar os sabores disponíveis.
        </p>
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
          <div className="flex flex-wrap justify-center gap-5">
            {sizes.map((size) => {
              const selected = selectedId === size.id;

              return (
                <button
                  key={size.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedId(size.id)}
                  className={`group relative w-full max-w-80 overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700 ${
                    selected
                      ? "border-orange-700 shadow-orange-700/15"
                      : "border-stone-200 hover:border-orange-300"
                  }`}
                >
                  <PizzaSizeImage size={size} />

                  {selected && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-orange-700 px-3 py-1.5 text-xs font-bold text-white shadow">
                      <CheckCircle2 size={14} />
                      Selecionado
                    </span>
                  )}

                  <div className="space-y-3 p-5">
                    <div>
                      <h3 className="text-xl font-black text-stone-950">
                        {size.name}
                      </h3>

                      {size.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-stone-500">
                          {size.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {size.diameterCm != null && (
                        <span className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-semibold text-stone-600">
                          {size.diameterCm} cm
                        </span>
                      )}

                      {size.slices != null && (
                        <span className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-semibold text-stone-600">
                          {size.slices} fatias
                        </span>
                      )}

                      <span className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-semibold text-stone-600">
                        Até {size.maxFlavors}{" "}
                        {size.maxFlavors === 1
                          ? "sabor"
                          : "sabores"}
                      </span>
                    </div>

                    <div className="border-t border-stone-100 pt-3">
                      <p className="text-xs font-medium text-stone-500">
                        Preço-base
                      </p>

                      <p className="mt-1 text-xl font-black text-orange-700">
                        {formatPrice(size.basePriceCents)}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl px-4 py-2.5 text-center text-xs font-bold ${
                        selected
                          ? "bg-orange-700 text-white"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {selected
                        ? "Tamanho selecionado"
                        : "Selecionar tamanho"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={!selectedSize || !onContinue}
              onClick={() => {
                if (selectedSize) {
                  onContinue?.(selectedSize);
                }
              }}
              className="inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-3 rounded-xl bg-orange-700 px-6 py-3 text-sm font-black text-white shadow-md shadow-orange-700/15 transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar para os sabores
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

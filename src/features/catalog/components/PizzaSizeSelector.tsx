
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Pizza,
  RefreshCw,
} from "lucide-react";

export type PizzaSize = {
  id: number;
  name: string;
  slices: number;
  basePriceCents: number;
  maxFlavors: number;
  isActive: boolean;
  isAvailable: boolean;
};

type PizzaSizeSelectorProps = {
  onContinue?: (size: PizzaSize) => void;
};

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
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
          {
            signal: controller.signal,
          },
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
          selecionar até dois sabores.
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
          <div className="flex flex-wrap justify-center gap-4">
            {sizes.map((size) => {
              const selected = selectedId === size.id;

              const price = size.basePriceCents;

              return (
                <button
                  key={size.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedId(size.id)}
                  className={`group relative flex min-h-52 flex-col items-center justify-center rounded-2xl border-2 p-6 text-center shadow-sm w-full max-w-80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700 ${
                    selected
                      ? "border-orange-700 bg-orange-700 text-white shadow-orange-700/20"
                      : "border-stone-200 bg-white text-stone-900 hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  {selected && (
                    <CheckCircle2
                      size={22}
                      className="absolute right-4 top-4 text-white"
                    />
                  )}

                  <div
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                      selected
                        ? "bg-white/15 text-white"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    <Pizza size={36} strokeWidth={1.5} />
                  </div>

                  <h3 className="text-xl font-black">
                    {size.name}
                  </h3>

                  {size.slices != null && (
                    <p
                      className={`mt-2 text-sm font-medium ${
                        selected
                          ? "text-white/85"
                          : "text-stone-500"
                      }`}
                    >
                      {size.slices} fatias
                    </p>
                  )}

                  {price != null && (
                    <p
                      className={`mt-3 text-lg font-black ${
                        selected
                          ? "text-white"
                          : "text-orange-700"
                      }`}
                    >
                      {formatPrice(price)}
                    </p>
                  )}

                  <span
                    className={`mt-4 rounded-full px-3 py-1.5 text-xs font-bold ${
                      selected
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {selected
                      ? "Selecionado"
                      : "Selecionar tamanho"}
                  </span>
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

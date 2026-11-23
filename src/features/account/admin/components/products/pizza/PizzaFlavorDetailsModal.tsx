import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Check,
  ChefHat,
  ImageOff,
  LoaderCircle,
  RotateCcw,
  X,
} from "lucide-react";

import type { PizzaCatalogFlavor } from "../../../../../catalog/components/PizzaFlavorSelector";

export interface PizzaFlavorIngredient {
  id: number;
  pizzaFlavorId: number;
  name: string;
  isRemovable: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PizzaFlavorCustomization {
  flavorId: number;
  removedIngredients: Array<{ id: number; name: string }>;
}

interface PizzaFlavorDetailsModalProps {
  flavor: PizzaCatalogFlavor;
  onClose: () => void;
  onConfirm: (customization: PizzaFlavorCustomization) => void;
  initialRemovedIngredientIds?: number[];
}

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function resolveImageUrl(value: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/api/")) return `${API_URL}${value}`;
  return value;
}

export function PizzaFlavorDetailsModal({
  flavor,
  onClose,
  onConfirm,
  initialRemovedIngredientIds = [],
}: PizzaFlavorDetailsModalProps) {
  const titleId = useId();
  const [ingredients, setIngredients] = useState<PizzaFlavorIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [mode, setMode] = useState<"complete" | "custom">(
    initialRemovedIngredientIds.length ? "custom" : "complete",
  );
  const [removedIds, setRemovedIds] = useState<number[]>(
    initialRemovedIngredientIds,
  );
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadIngredients() {
      try {
        const response = await fetch(
          `${API_URL}/api/pizza-catalog-flavors/${flavor.id}/ingredients`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Não foi possível consultar os ingredientes deste sabor.");
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("A API retornou uma lista de ingredientes inválida.");
        }
        if (controller.signal.aborted) return;

        setIngredients(
          (data as PizzaFlavorIngredient[]).sort(
            (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
          ),
        );
        setError("");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar ingredientes.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadIngredients();
    return () => controller.abort();
  }, [flavor.id, retryKey]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const imageUrl = resolveImageUrl(flavor.imageUrl);
  const extraPrice =
    flavor.additionalPriceCents +
    (flavor.isPremium ? flavor.premiumAdditionalCents : 0);

  const removableIngredients = ingredients.filter((item) => item.isRemovable);
  const removedIngredients =
    mode === "custom"
      ? removableIngredients.filter((item) => removedIds.includes(item.id))
      : [];

  function toggleIngredient(id: number) {
    setRemovedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function confirm() {
    if (loading || error) return;
    onConfirm({
      flavorId: flavor.id,
      removedIngredients: removedIngredients.map(({ id, name }) => ({ id, name })),
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9 flex h-dvh w-screen items-center justify-center overflow-hidden bg-stone-950/65 px-4 pb-5 pt-19 backdrop-blur-md sm:px-6 sm:pb-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-auto max-h-[calc(100dvh-100px)] w-full max-w-195 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl lg:flex-row"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes do sabor"
          className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-white text-stone-800 shadow-md transition hover:bg-stone-100"
        >
          <X size={19} />
        </button>

        <div className="relative h-40 shrink-0 overflow-hidden bg-stone-950 sm:h-48 lg:h-auto lg:w-[40%] lg:self-stretch">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={`Pizza sabor ${flavor.name}`}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-300">
              <ImageOff size={30} />
              <span className="text-xs">Imagem indisponível</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4 text-white">
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-200">
              restaurante.com
            </span>
            <p className="mt-1 text-base font-black">Preparado para você.</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:w-[60%]">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
            <div className="pr-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-700">
                Sabor de pizza
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <h2 id={titleId} className="text-xl font-black text-stone-950 sm:text-2xl">
                  {flavor.name}
                </h2>
                <span className="text-lg font-black text-orange-700">
                  + {currency.format(extraPrice / 100)}
                </span>
              </div>
              {flavor.isPremium && (
                <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                  Sabor nobre
                </span>
              )}
              {flavor.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
                  {flavor.description}
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-orange-200">
              <div className="bg-orange-50/60 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                    <ChefHat size={17} />
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-stone-900">
                      Ingredientes do sabor
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Confira os ingredientes utilizados no preparo.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <p className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                    <LoaderCircle size={15} className="animate-spin" />
                    Carregando ingredientes...
                  </p>
                ) : error ? (
                  <div role="alert" className="mt-3 text-xs text-red-700">
                    <p className="flex items-center gap-2">
                      <AlertCircle size={15} /> {error}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLoading(true);
                        setRetryKey((value) => value + 1);
                      }}
                      className="mt-2 font-bold underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : ingredients.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ingredients.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-orange-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-stone-500">
                    Ingredientes ainda não cadastrados.
                  </p>
                )}
              </div>

              {!loading && !error && ingredients.length > 0 && (
                <div className="space-y-2.5 p-3">
                  <h3 className="text-xs font-black text-stone-900">
                    Como deseja seu pedido?
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Você pode retirar ingredientes sem alterar o preço.
                  </p>

                  <button
                    type="button"
                    onClick={() => setMode("complete")}
                    aria-pressed={mode === "complete"}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
                      mode === "complete"
                        ? "border-orange-600 bg-orange-50"
                        : "border-stone-200 hover:border-orange-200"
                    }`}
                  >
                    <span>
                      <strong className="block text-xs">Sabor completo</strong>
                      <small className="text-[11px] text-stone-500">
                        Manter todos os ingredientes
                      </small>
                    </span>
                    {mode === "complete" && <Check size={17} className="text-orange-700" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("custom")}
                    aria-pressed={mode === "custom"}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
                      mode === "custom"
                        ? "border-orange-600 bg-orange-50"
                        : "border-stone-200 hover:border-orange-200"
                    }`}
                  >
                    <span>
                      <strong className="block text-xs">Personalizar ingredientes</strong>
                      <small className="text-[11px] text-stone-500">
                        Escolher o que deseja retirar
                      </small>
                    </span>
                    {mode === "custom" && <Check size={17} className="text-orange-700" />}
                  </button>

                  {mode === "custom" && (
                    <div className="space-y-1.5 rounded-lg bg-stone-50 p-2">
                      {ingredients.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs"
                        >
                          <span>
                            <span className="block font-semibold text-stone-800">
                              {item.name}
                            </span>
                            {!item.isRemovable && (
                              <small className="text-[10px] text-stone-500">
                                Ingrediente obrigatório
                              </small>
                            )}
                          </span>
                          <span className="flex items-center gap-2 text-[11px] font-semibold text-stone-600">
                            {item.isRemovable
                              ? removedIds.includes(item.id) ? "Retirado" : "Manter"
                              : "Manter"}
                            <input
                              type="checkbox"
                              checked={!removedIds.includes(item.id) || !item.isRemovable}
                              disabled={!item.isRemovable}
                              onChange={() => toggleIngredient(item.id)}
                              aria-label={`Manter ${item.name}`}
                              className="size-4 accent-orange-700"
                            />
                          </span>
                        </label>
                      ))}
                      <button
                        type="button"
                        onClick={() => setRemovedIds([])}
                        className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold text-orange-700"
                      >
                        <RotateCcw size={13} /> Restaurar ingredientes
                      </button>
                    </div>
                  )}

                  <div className="rounded-lg bg-stone-900 px-3 py-2.5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Resumo da personalização
                    </p>
                    <p className="mt-1 text-xs font-bold">
                      {removedIngredients.length
                        ? `Sem: ${removedIngredients.map((item) => item.name).join(", ")}`
                        : "Sabor completo"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t border-stone-200 bg-white px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 rounded-lg border border-stone-200 px-4 text-xs font-bold text-stone-700 hover:bg-stone-50"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={loading || Boolean(error)}
              className="min-h-10 flex-1 rounded-lg bg-orange-700 px-4 text-xs font-bold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar personalização
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

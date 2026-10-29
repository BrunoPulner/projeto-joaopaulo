
import {
  Check,
  CheckCircle2,
  ChefHat,
  ImageOff,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import type { Product } from "../catalogData";
import type { CatalogProduct } from "../types/catalog.types";

import { resolveCatalogImageUrl } from "../api/catalog.api";

import {
  getProductIngredients,
  getRemovedIngredients,
  formatRemovedIngredients,
  type CatalogProductIngredient,
  type RemovedIngredient,
} from "../api/product-ingredients.api";

// ============================================
// TIPOS
// ============================================

type ModalProduct = Product | CatalogProduct;

type ProductDetailsModalProps<T extends ModalProduct> = {
  product: T | null;
  onClose: () => void;
  onAdd: (
    product: T,
    quantity: number,
    notes: string,
    removedIngredients?: RemovedIngredient[],
  ) => void;
};

type CustomizationMode = "complete" | "custom";

// ============================================
// UTILITÁRIOS
// ============================================

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function isCatalogProduct(
  product: ModalProduct,
): product is CatalogProduct {
  return "priceCents" in product;
}

function getProductPrice(product: ModalProduct): number {
  return isCatalogProduct(product)
    ? product.priceCents / 100
    : product.price;
}

function getProductImage(product: ModalProduct) {
  if (isCatalogProduct(product)) {
    return resolveCatalogImageUrl(product.imageUrl);
  }

  return product.image ?? null;
}

function getProductStock(product: ModalProduct) {
  return isCatalogProduct(product)
    ? product.stockQuantity
    : null;
}

// ============================================
// COMPONENTE
// ============================================

export function ProductDetailsModal<T extends ModalProduct>({
  product,
  onClose,
  onAdd,
}: ProductDetailsModalProps<T>) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const [failedImage, setFailedImage] = useState<
    string | null
  >(null);

  const [isClosing, setIsClosing] = useState(false);

  // ==========================================
  // INGREDIENTES
  // ==========================================

  const [ingredients, setIngredients] = useState<
    CatalogProductIngredient[]
  >([]);

  const [loadingIngredients, setLoadingIngredients] =
    useState(false);

  const [ingredientsError, setIngredientsError] =
    useState("");

  const [customizationMode, setCustomizationMode] =
    useState<CustomizationMode>("complete");

  const [removedIngredientIds, setRemovedIngredientIds] =
    useState<number[]>([]);

  const productId =
    product && isCatalogProduct(product)
      ? product.id
      : null;

  // ==========================================
  // BUSCAR INGREDIENTES
  // ==========================================

  useEffect(() => {
    if (productId === null) return;

    const controller = new AbortController();

    async function fetchIngredients() {
      try {
        const data = await getProductIngredients(
          productId as number,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setIngredients(data);
        setIngredientsError("");
      } catch (error) {
        if (controller.signal.aborted) return;

        setIngredientsError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os ingredientes.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingIngredients(false);
        }
      }
    }

    void fetchIngredients();

    return () => {
      controller.abort();
    };
  }, [productId]);

  // ==========================================
  // BLOQUEIO DE SCROLL E ESCAPE
  // ==========================================

  useEffect(() => {
    if (!product) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsClosing(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [product]);

  // ==========================================
  // RENDERIZAÇÃO CONDICIONAL
  // ==========================================

  if (!product) {
    return null;
  }

  // ==========================================
  // DADOS DO PRODUTO
  // ==========================================

  const price = getProductPrice(product);
  const total = price * quantity;

  const imageUrl = getProductImage(product);

  const showImage =
    Boolean(imageUrl) && failedImage !== imageUrl;

  const stock = getProductStock(product);
  const hasStockLimit = stock !== null;

  const outOfStock =
    hasStockLimit && stock <= 0;

  const maxQuantity = hasStockLimit
    ? Math.max(0, stock)
    : null;

  const reachedStockLimit =
    maxQuantity !== null &&
    quantity >= maxQuantity;

  const hasIngredients = ingredients.length > 0;

  const removableIngredients = ingredients.filter(
    (ingredient) => ingredient.isRemovable,
  );

  const hasRemovableIngredients =
    removableIngredients.length > 0;

  const removedIngredients =
    customizationMode === "custom"
      ? getRemovedIngredients(
          ingredients,
          removedIngredientIds,
        )
      : [];

  const customizationSummary =
    formatRemovedIngredients(removedIngredients);

  // ==========================================
  // AÇÕES
  // ==========================================

  function handleClose() {
    if (isClosing) return;
    setIsClosing(true);
  }

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1),
    );
  }

  function increaseQuantity() {
    setQuantity((current) => {
      if (maxQuantity !== null) {
        return Math.min(maxQuantity, current + 1);
      }

      return current + 1;
    });
  }

  function handleCustomizationMode(
    mode: CustomizationMode,
  ) {
    setCustomizationMode(mode);

    if (mode === "complete") {
      setRemovedIngredientIds([]);
    }
  }

  function toggleIngredient(ingredientId: number) {
    const ingredient = ingredients.find(
      (item) => item.id === ingredientId,
    );

    if (!ingredient?.isRemovable) return;

    setRemovedIngredientIds((current) =>
      current.includes(ingredientId)
        ? current.filter((id) => id !== ingredientId)
        : [...current, ingredientId],
    );
  }

  function resetCustomization() {
    setCustomizationMode("complete");
    setRemovedIngredientIds([]);
  }

  
  
function handleAdd() {
  if (!product) return;

  if (
    isClosing ||
    outOfStock ||
    loadingIngredients ||
    ingredientsError
  ) {
    return;
  }

  if (
    maxQuantity !== null &&
    quantity > maxQuantity
  ) {
    return;
  }

  onAdd(
    product,
    quantity,
    notes.trim(),
    removedIngredients,
  );
}



  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div
      className={`
        product-details-backdrop
        ${isClosing
          ? "product-details-backdrop-closing"
          : ""}
        fixed inset-0 z-100
        flex items-end justify-center
        bg-stone-950/50 backdrop-blur-sm
        sm:items-center sm:p-5
      `}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }

          if (isClosing) {
            onClose();
          }
        }}
        className={`
          product-details-sheet
          ${isClosing
            ? "product-details-sheet-closing"
            : ""}
          relative flex max-h-[92dvh] w-full
          flex-col overflow-hidden
          rounded-t-[28px] bg-white shadow-2xl
          sm:max-h-[calc(100dvh-40px)]
          sm:max-w-5xl sm:rounded-[30px]
          lg:h-150
          lg:max-h-[calc(100dvh-48px)]
          lg:flex-row
        `}
      >
        {/* =====================================
            IMAGEM
        ===================================== */}

        <div
          className="
            relative h-48 shrink-0
            overflow-hidden bg-orange-50
            sm:h-56
            lg:h-full lg:w-[44%]
          "
        >
          {showImage && imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={product.name}
                className="
                  absolute inset-0
                  h-full w-full object-cover
                "
                onError={() =>
                  setFailedImage(imageUrl)
                }
              />

              <div
                className="
                  absolute inset-0
                  bg-linear-to-t
                  from-black/35 via-black/5 to-black/5
                  lg:bg-linear-to-r
                  lg:from-black/15
                  lg:via-transparent lg:to-black/5
                "
                aria-hidden="true"
              />
            </>
          ) : (
            <div
              className="
                absolute inset-0 flex flex-col
                items-center justify-center gap-3
                bg-linear-to-br from-orange-50
                via-amber-50 to-orange-100
                text-orange-300
              "
            >
              <div
                className="
                  flex h-16 w-16 items-center
                  justify-center rounded-2xl
                  border border-orange-200/60
                  bg-white/60
                "
              >
                <ImageOff
                  size={32}
                  strokeWidth={1.4}
                  aria-hidden="true"
                />
              </div>

              <span className="text-xs font-bold sm:text-sm">
                Imagem em breve
              </span>
            </div>
          )}

          <div
            className="
              absolute bottom-7 left-7
              hidden lg:block
            "
          >
            <span
              className="
                text-[10px] font-black uppercase
                tracking-[0.2em] text-white/80
              "
            >
              João Paulo Espetinhos
            </span>

            <p
              className="
                mt-2 max-w-60 text-xl
                font-black leading-tight
                text-white drop-shadow-md
              "
            >
              Preparado para você.
            </p>
          </div>
        </div>

        {/* =====================================
            BOTÃO FECHAR
        ===================================== */}

        <button
          type="button"
          onClick={handleClose}
          disabled={isClosing}
          aria-label="Fechar detalhes do produto"
          className="
            absolute right-3 top-3 z-40
            inline-flex h-10 w-10
            items-center justify-center
            rounded-full
            border border-stone-200/70
            bg-white/95 text-stone-700
            shadow-md backdrop-blur
            transition-all duration-200
            hover:bg-white hover:text-orange-700
            active:scale-95
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-orange-700
            disabled:pointer-events-none
            sm:right-4 sm:top-4
            lg:right-5 lg:top-5
          "
        >
          <X size={19} aria-hidden="true" />
        </button>

        {/* =====================================
            CONTEÚDO
        ===================================== */}

        <div
          className="
            min-h-0 flex-1
            overflow-y-auto overscroll-contain
          "
        >
          <div
            className="
              flex min-h-full flex-col
              p-5 pb-6
              sm:p-6
              lg:p-8 lg:pr-9
            "
          >
            {/* IDENTIFICAÇÃO */}

            <div className="pr-9 lg:pr-8">
              <span
                className="
                  text-[10px] font-black uppercase
                  tracking-[0.18em] text-orange-700
                  sm:text-xs
                "
              >
                Espetinhos do João Paulo
              </span>

              <div
                className="
                  mt-2 flex items-start
                  justify-between gap-4
                "
              >
                <h2
                  id="product-details-title"
                  className="
                    min-w-0 text-xl font-black
                    leading-tight tracking-tight
                    text-stone-950
                    sm:text-2xl lg:text-3xl
                  "
                >
                  {product.name}
                </h2>

                <span
                  className="
                    shrink-0 text-lg font-black
                    text-orange-700
                    sm:text-xl lg:text-2xl
                  "
                >
                  {currency.format(price)}
                </span>
              </div>

              {product.description && (
                <p
                  className="
                    mt-2.5 text-sm leading-5
                    text-stone-600 sm:leading-6
                  "
                >
                  {product.description}
                </p>
              )}
            </div>

            {/* =====================================
                INGREDIENTES DO BANCO
            ===================================== */}

            {isCatalogProduct(product) && (
              <section className="mt-5">
                {loadingIngredients && (
                  <div
                    className="
                      flex items-center gap-2
                      rounded-xl border border-orange-100
                      bg-orange-50 px-4 py-4
                      text-sm text-orange-800
                    "
                  >
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />

                    Carregando ingredientes...
                  </div>
                )}

                {ingredientsError && (
                  <div
                    role="alert"
                    className="
                      rounded-xl border border-red-200
                      bg-red-50 px-4 py-3
                      text-sm text-red-700
                    "
                  >
                    <p>{ingredientsError}</p>

                    <button
                      type="button"
                      onClick={() => {
                        setLoadingIngredients(true);
                        setIngredientsError("");

                        void getProductIngredients(
                          product.id,
                        )
                          .then((data) => {
                            setIngredients(data);
                            setIngredientsError("");
                          })
                          .catch((error: unknown) => {
                            setIngredientsError(
                              error instanceof Error
                                ? error.message
                                : "Erro ao carregar ingredientes.",
                            );
                          })
                          .finally(() => {
                            setLoadingIngredients(false);
                          });
                      }}
                      className="
                        mt-2 inline-flex items-center
                        gap-1 font-bold underline
                      "
                    >
                      <RotateCcw size={14} />
                      Tentar novamente
                    </button>
                  </div>
                )}

                {!loadingIngredients &&
                  !ingredientsError &&
                  hasIngredients && (
                    <div
                      className="
                        overflow-hidden rounded-2xl
                        border border-orange-100
                        bg-orange-50/50
                      "
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className="
                              flex h-10 w-10 shrink-0
                              items-center justify-center
                              rounded-xl bg-orange-100
                              text-orange-700
                            "
                          >
                            <ChefHat size={20} />
                          </div>

                          <div className="flex-1">
                            <h3
                              className="
                                text-sm font-black
                                text-stone-900
                              "
                            >
                              Ingredientes do produto
                            </h3>

                            <p
                              className="
                                mt-1 text-xs
                                leading-relaxed
                                text-stone-500
                              "
                            >
                              Confira os ingredientes
                              utilizados no preparo.
                            </p>
                          </div>
                        </div>

                        <div
                          className="
                            mt-4 flex flex-wrap gap-2
                          "
                        >
                          {ingredients.map((ingredient) => (
                            <span
                              key={ingredient.id}
                              className="
                                rounded-full border
                                border-orange-100
                                bg-white px-3 py-1.5
                                text-xs font-semibold
                                text-stone-700
                              "
                            >
                              {ingredient.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {hasRemovableIngredients && (
                        <div
                          className="
                            border-t border-orange-100
                            bg-white p-4 sm:p-5
                          "
                        >
                          <h3
                            className="
                              text-sm font-black
                              text-stone-900
                            "
                          >
                            Como deseja seu pedido?
                          </h3>

                          <p
                            className="
                              mt-1 text-xs
                              text-stone-500
                            "
                          >
                            Você pode retirar ingredientes
                            sem alterar o preço.
                          </p>

                          {/* COMPLETO */}

                          <button
                            type="button"
                            onClick={() =>
                              handleCustomizationMode(
                                "complete",
                              )
                            }
                            disabled={isClosing || outOfStock}
                            aria-pressed={
                              customizationMode === "complete"
                            }
                            className={`
                              mt-4 flex w-full items-center
                              gap-3 rounded-xl border
                              px-4 py-3 text-left
                              transition-colors
                              ${
                                customizationMode === "complete"
                                  ? "border-orange-500 bg-orange-50"
                                  : "border-stone-200 bg-white hover:bg-stone-50"
                              }
                            `}
                          >
                            <CheckCircle2
                              size={21}
                              className={
                                customizationMode === "complete"
                                  ? "text-orange-700"
                                  : "text-stone-400"
                              }
                            />

                            <div className="flex-1">
                              <p
                                className="
                                  text-sm font-bold
                                  text-stone-900
                                "
                              >
                                Produto completo
                              </p>

                              <p
                                className="
                                  mt-0.5 text-xs
                                  text-stone-500
                                "
                              >
                                Manter todos os ingredientes
                              </p>
                            </div>

                            {customizationMode === "complete" && (
                              <Check
                                size={18}
                                className="text-orange-700"
                              />
                            )}
                          </button>

                          {/* PERSONALIZAR */}

                          <button
                            type="button"
                            onClick={() =>
                              handleCustomizationMode(
                                "custom",
                              )
                            }
                            disabled={isClosing || outOfStock}
                            aria-pressed={
                              customizationMode === "custom"
                            }
                            className={`
                              mt-2 flex w-full items-center
                              gap-3 rounded-xl border
                              px-4 py-3 text-left
                              transition-colors
                              ${
                                customizationMode === "custom"
                                  ? "border-orange-500 bg-orange-50"
                                  : "border-stone-200 bg-white hover:bg-stone-50"
                              }
                            `}
                          >
                            <ChefHat
                              size={21}
                              className={
                                customizationMode === "custom"
                                  ? "text-orange-700"
                                  : "text-stone-400"
                              }
                            />

                            <div className="flex-1">
                              <p
                                className="
                                  text-sm font-bold
                                  text-stone-900
                                "
                              >
                                Personalizar ingredientes
                              </p>

                              <p
                                className="
                                  mt-0.5 text-xs
                                  text-stone-500
                                "
                              >
                                Escolher o que deseja retirar
                              </p>
                            </div>

                            {customizationMode === "custom" && (
                              <Check
                                size={18}
                                className="text-orange-700"
                              />
                            )}
                          </button>

                          {/* LISTA DE INGREDIENTES */}

                          {customizationMode === "custom" && (
                            <div
                              className="
                                mt-4 rounded-xl
                                border border-stone-200
                                bg-stone-50 p-3 sm:p-4
                              "
                            >
                              <p
                                className="
                                  mb-3 text-xs
                                  font-semibold
                                  text-stone-500
                                "
                              >
                                Desmarque os ingredientes
                                que deseja retirar:
                              </p>

                              <div className="space-y-2">
                                {ingredients.map((ingredient) => {
                                  const removed =
                                    removedIngredientIds.includes(
                                      ingredient.id,
                                    );

                                  const checked = !removed;

                                  return (
                                    <label
                                      key={ingredient.id}
                                      className={`
                                        flex items-center gap-3
                                        rounded-xl border
                                        px-3 py-3
                                        ${
                                          removed
                                            ? "border-red-100 bg-red-50"
                                            : "border-stone-200 bg-white"
                                        }
                                        ${
                                          ingredient.isRemovable
                                            ? "cursor-pointer"
                                            : "cursor-not-allowed"
                                        }
                                      `}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={
                                          !ingredient.isRemovable ||
                                          isClosing ||
                                          outOfStock
                                        }
                                        onChange={() =>
                                          toggleIngredient(
                                            ingredient.id,
                                          )
                                        }
                                        className="
                                          h-4 w-4 shrink-0
                                          accent-orange-700
                                        "
                                      />

                                      <span
                                        className={`
                                          min-w-0 flex-1
                                          text-sm font-semibold
                                          ${
                                            removed
                                              ? "text-red-700 line-through"
                                              : "text-stone-800"
                                          }
                                        `}
                                      >
                                        {ingredient.name}
                                      </span>

                                      {!ingredient.isRemovable ? (
                                        <span
                                          className="
                                            rounded-full
                                            bg-stone-100
                                            px-2 py-1
                                            text-[10px]
                                            font-bold
                                            text-stone-500
                                          "
                                        >
                                          Fixo
                                        </span>
                                      ) : removed ? (
                                        <span
                                          className="
                                            text-[10px]
                                            font-bold
                                            text-red-600
                                          "
                                        >
                                          Removido
                                        </span>
                                      ) : null}
                                    </label>
                                  );
                                })}
                              </div>

                              {removedIngredients.length > 0 && (
                                <button
                                  type="button"
                                  onClick={resetCustomization}
                                  className="
                                    mt-3 inline-flex
                                    items-center gap-1.5
                                    text-xs font-bold
                                    text-orange-700
                                    hover:text-orange-900
                                  "
                                >
                                  <RotateCcw size={13} />
                                  Restaurar ingredientes
                                </button>
                              )}
                            </div>
                          )}

                          {/* RESUMO */}

                          <div
                            className="
                              mt-4 rounded-xl
                              bg-stone-900 px-4 py-3
                              text-white
                            "
                          >
                            <p
                              className="
                                text-[10px] font-bold
                                uppercase tracking-wider
                                text-stone-400
                              "
                            >
                              Resumo da personalização
                            </p>

                            <p
                              className="
                                mt-1 text-sm
                                font-semibold
                              "
                            >
                              {customizationSummary}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </section>
            )}

            {/* =====================================
                INGREDIENTES LEGADOS
            ===================================== */}

            {!isCatalogProduct(product) &&
              product.ingredients &&
              product.ingredients.length > 0 && (
                <div
                  className="
                    mt-4 rounded-xl
                    border border-orange-100
                    bg-orange-50/60 px-4 py-3
                    lg:mt-5
                  "
                >
                  <h3
                    className="
                      text-xs font-black
                      text-stone-900
                    "
                  >
                    Ingredientes
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.ingredients.map((ingredient) => (
                      <span
                        key={ingredient}
                        className="
                          rounded-full border
                          border-orange-100
                          bg-white px-2.5 py-1
                          text-[11px] font-semibold
                          text-stone-600
                        "
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* =====================================
                QUANTIDADE
            ===================================== */}

            <div
              className="
                mt-5 flex items-center
                justify-between gap-4
                border-t border-stone-100 pt-5
              "
            >
              <div>
                <h3
                  className="
                    text-sm font-black
                    text-stone-900
                  "
                >
                  Quantidade
                </h3>

                <p
                  className="
                    mt-0.5 text-xs
                    text-stone-500
                  "
                >
                  Escolha quantas unidades deseja.
                </p>

                {hasStockLimit && (
                  <p
                    className="
                      mt-1 text-xs
                      font-semibold
                      text-orange-700
                    "
                  >
                    {outOfStock
                      ? "Produto esgotado"
                      : `${stock} unidade(s) disponível(is)`}
                  </p>
                )}
              </div>

              <div
                className="
                  flex shrink-0 items-center
                  rounded-xl border
                  border-stone-200
                  bg-stone-50 p-1
                "
              >
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={
                    quantity === 1 ||
                    isClosing ||
                    outOfStock
                  }
                  aria-label="Diminuir quantidade"
                  className="
                    inline-flex h-9 w-9
                    items-center justify-center
                    rounded-lg text-stone-700
                    transition hover:bg-white
                    hover:text-orange-700
                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                >
                  <Minus size={17} aria-hidden="true" />
                </button>

                <span
                  className="
                    min-w-9 text-center
                    text-sm font-black
                    text-stone-900
                  "
                  aria-live="polite"
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={
                    isClosing ||
                    outOfStock ||
                    reachedStockLimit
                  }
                  aria-label="Aumentar quantidade"
                  className="
                    inline-flex h-9 w-9
                    items-center justify-center
                    rounded-lg text-stone-700
                    transition hover:bg-white
                    hover:text-orange-700
                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                >
                  <Plus size={17} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* =====================================
                OBSERVAÇÕES
            ===================================== */}

            <div className="mt-5">
              <div
                className="
                  flex items-end
                  justify-between gap-4
                "
              >
                <div>
                  <label
                    htmlFor="product-notes"
                    className="
                      text-sm font-black
                      text-stone-900
                    "
                  >
                    Observações

                    <span
                      className="
                        ml-1 font-medium
                        text-stone-400
                      "
                    >
                      (opcional)
                    </span>
                  </label>

                  <p
                    className="
                      mt-0.5 text-xs
                      text-stone-500
                    "
                  >
                    Alguma preferência para o preparo?
                  </p>
                </div>

                <span
                  className="
                    shrink-0 text-[10px]
                    text-stone-400
                  "
                >
                  {notes.length}/200
                </span>
              </div>

              <textarea
                id="product-notes"
                value={notes}
                disabled={isClosing || outOfStock}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                maxLength={200}
                rows={2}
                placeholder="Ex.: ponto da carne, embalagem separada..."
                className="
                  mt-2.5 w-full resize-none
                  rounded-xl border
                  border-stone-200 bg-stone-50
                  px-4 py-3
                  text-sm text-stone-800
                  outline-none transition
                  placeholder:text-stone-400
                  focus:border-orange-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-orange-100
                  disabled:cursor-not-allowed
                  lg:min-h-18
                "
              />
            </div>

            {/* =====================================
                ADICIONAR À SACOLA
            ===================================== */}

            <div
              className="
                mt-5 border-t
                border-stone-100 pt-4
                lg:mt-auto lg:pt-5
              "
            >
              <button
                type="button"
                onClick={handleAdd}
                disabled={
                  isClosing ||
                  outOfStock ||
                  loadingIngredients ||
                  Boolean(ingredientsError)
                }
                className="
                  inline-flex min-h-12 w-full
                  items-center justify-center gap-2
                  rounded-xl bg-orange-700
                  px-5 py-3 text-sm
                  font-black text-white
                  shadow-md shadow-orange-900/10
                  transition-all duration-200
                  hover:bg-orange-800
                  active:scale-[0.99]
                  active:bg-orange-900
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-orange-700
                  disabled:pointer-events-none
                  disabled:opacity-50
                  motion-reduce:transform-none
                "
              >
                {loadingIngredients ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <ShoppingBag
                    size={18}
                    aria-hidden="true"
                  />
                )}

                {outOfStock
                  ? "Produto esgotado"
                  : loadingIngredients
                    ? "Carregando ingredientes..."
                    : "Adicionar à sacola"}

                {!outOfStock &&
                  !loadingIngredients && (
                    <>
                      <span
                        className="opacity-60"
                        aria-hidden="true"
                      >
                        •
                      </span>

                      {currency.format(total)}
                    </>
                  )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

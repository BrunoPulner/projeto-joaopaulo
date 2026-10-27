
import {
  ImageOff,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import type { Product } from "../catalogData";
import type { CatalogProduct } from "../types/catalog.types";

import { resolveCatalogImageUrl } from "../api/catalog.api";

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
  ) => void;
};

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

function getProductPrice(product: ModalProduct) {
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
  if (!isCatalogProduct(product)) {
    return null;
  }

  return product.stockQuantity;
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

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [product]);

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

  const maxQuantity =
    hasStockLimit ? Math.max(0, stock) : null;

  const reachedStockLimit =
    maxQuantity !== null &&
    quantity >= maxQuantity;

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
        return Math.min(
          maxQuantity,
          current + 1,
        );
      }

      return current + 1;
    });
  }

  function handleAdd() {
    if (
      !product ||
      isClosing ||
      outOfStock ||
      reachedStockLimit && quantity > (maxQuantity ?? Infinity)
    ) {
      return;
    }

    onAdd(
      product,
      quantity,
      notes.trim(),
    );
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div
      className={`
        product-details-backdrop
        ${
          isClosing
            ? "product-details-backdrop-closing"
            : ""
        }

        fixed
        inset-0
        z-100

        flex
        items-end
        justify-center

        bg-stone-950/50
        backdrop-blur-sm

        sm:items-center
        sm:p-5
      `}
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
        onAnimationEnd={(event) => {
          if (
            event.target !== event.currentTarget
          ) {
            return;
          }

          if (isClosing) {
            onClose();
          }
        }}
        className={`
          product-details-sheet
          ${
            isClosing
              ? "product-details-sheet-closing"
              : ""
          }

          relative
          flex
          max-h-[92dvh]
          w-full
          flex-col
          overflow-hidden

          rounded-t-[28px]
          bg-white
          shadow-2xl

          sm:max-h-[calc(100dvh-40px)]
          sm:max-w-5xl
          sm:rounded-[30px]

          lg:h-150
          lg:max-h-[calc(100dvh-48px)]
          lg:flex-row
        `}
      >
        {/* ALÇA MOBILE */}

        <div
          className="
            absolute
            left-1/2
            top-2
            z-30
            -translate-x-1/2
            sm:hidden
          "
          aria-hidden="true"
        >
          <div className="h-1.5 w-11 rounded-full bg-white/80 shadow-sm" />
        </div>

        {/* =====================================
            IMAGEM
        ===================================== */}

        <div
          className="
            relative
            h-48
            shrink-0
            overflow-hidden
            bg-orange-50

            sm:h-56

            lg:h-full
            lg:w-[44%]
          "
        >
          {showImage && imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={product.name}
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                "
                onError={() =>
                  setFailedImage(imageUrl)
                }
              />

              <div
                className="
                  absolute
                  inset-0
                  bg-linear-to-t
                  from-black/35
                  via-black/5
                  to-black/5

                  lg:bg-linear-to-r
                  lg:from-black/15
                  lg:via-transparent
                  lg:to-black/5
                "
                aria-hidden="true"
              />
            </>
          ) : (
            <div
              className="
                absolute
                inset-0
                flex
                flex-col
                items-center
                justify-center
                gap-3

                bg-linear-to-br
                from-orange-50
                via-amber-50
                to-orange-100

                text-orange-300
              "
            >
              <div
                className="
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center

                  rounded-2xl
                  border
                  border-orange-200/60
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

          {/* MARCA SOBRE A IMAGEM */}

          <div
            className="
              absolute
              bottom-7
              left-7
              hidden
              lg:block
            "
          >
            <span
              className="
                text-[10px]
                font-black
                uppercase
                tracking-[0.2em]
                text-white/80
              "
            >
              João Paulo Espetinhos
            </span>

            <p
              className="
                mt-2
                max-w-60
                text-xl
                font-black
                leading-tight
                text-white
                drop-shadow-md
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
            absolute
            right-3
            top-3
            z-40

            inline-flex
            h-10
            w-10
            items-center
            justify-center

            rounded-full
            border
            border-stone-200/70

            bg-white/95
            text-stone-700

            shadow-md
            backdrop-blur

            transition-all
            duration-200

            hover:bg-white
            hover:text-orange-700

            active:scale-95

            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-orange-700

            disabled:pointer-events-none

            sm:right-4
            sm:top-4

            lg:right-5
            lg:top-5
          "
        >
          <X size={19} aria-hidden="true" />
        </button>

        {/* =====================================
            CONTEÚDO
        ===================================== */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            lg:overflow-hidden
          "
        >
          <div
            className="
              flex
              min-h-full
              flex-col

              p-5
              pb-6

              sm:p-6

              lg:h-full
              lg:p-8
              lg:pr-9
            "
          >
            {/* IDENTIFICAÇÃO */}

            <div className="pr-9 lg:pr-8">
              <span
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-orange-700
                  sm:text-xs
                "
              >
                Espetinhos do João Paulo
              </span>

              <div
                className="
                  mt-2
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >
                <h2
                  id="product-details-title"
                  className="
                    min-w-0
                    text-xl
                    font-black
                    leading-tight
                    tracking-tight
                    text-stone-950

                    sm:text-2xl
                    lg:text-3xl
                  "
                >
                  {product.name}
                </h2>

                <span
                  className="
                    shrink-0
                    text-lg
                    font-black
                    text-orange-700

                    sm:text-xl
                    lg:text-2xl
                  "
                >
                  {currency.format(price)}
                </span>
              </div>

              {product.description && (
                <p
                  className="
                    mt-2.5
                    text-sm
                    leading-5
                    text-stone-600
                    sm:leading-6
                  "
                >
                  {product.description}
                </p>
              )}
            </div>

            {/* =====================================
                INGREDIENTES
                Disponíveis apenas no modelo antigo
            ===================================== */}

            {!isCatalogProduct(product) &&
              product.ingredients &&
              product.ingredients.length > 0 && (
                <div
                  className="
                    mt-4
                    rounded-xl
                    border
                    border-orange-100
                    bg-orange-50/60
                    px-4
                    py-3
                    lg:mt-5
                  "
                >
                  <h3 className="text-xs font-black text-stone-900">
                    Ingredientes
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.ingredients.map(
                      (ingredient) => (
                        <span
                          key={ingredient}
                          className="
                            rounded-full
                            border
                            border-orange-100
                            bg-white
                            px-2.5
                            py-1
                            text-[11px]
                            font-semibold
                            text-stone-600
                          "
                        >
                          {ingredient}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* =====================================
                QUANTIDADE
            ===================================== */}

            <div
              className="
                mt-4
                flex
                items-center
                justify-between
                gap-4
                border-t
                border-stone-100
                pt-4
                lg:mt-5
                lg:pt-5
              "
            >
              <div>
                <h3 className="text-sm font-black text-stone-900">
                  Quantidade
                </h3>

                <p className="mt-0.5 text-xs text-stone-500">
                  Escolha quantas unidades deseja.
                </p>

                {hasStockLimit && (
                  <p className="mt-1 text-xs font-semibold text-orange-700">
                    {outOfStock
                      ? "Produto esgotado"
                      : `${stock} unidade(s) disponível(is)`}
                  </p>
                )}
              </div>

              <div
                className="
                  flex
                  shrink-0
                  items-center
                  rounded-xl
                  border
                  border-stone-200
                  bg-stone-50
                  p-1
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
                    inline-flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    text-stone-700
                    transition
                    hover:bg-white
                    hover:text-orange-700
                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                >
                  <Minus
                    size={17}
                    aria-hidden="true"
                  />
                </button>

                <span
                  className="
                    min-w-9
                    text-center
                    text-sm
                    font-black
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
                    inline-flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    text-stone-700
                    transition
                    hover:bg-white
                    hover:text-orange-700
                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                >
                  <Plus
                    size={17}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            {/* =====================================
                OBSERVAÇÕES
            ===================================== */}

            <div className="mt-4 lg:mt-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <label
                    htmlFor="product-notes"
                    className="text-sm font-black text-stone-900"
                  >
                    Observações

                    <span className="ml-1 font-medium text-stone-400">
                      (opcional)
                    </span>
                  </label>

                  <p className="mt-0.5 text-xs text-stone-500">
                    Alguma preferência para o preparo?
                  </p>
                </div>

                <span className="shrink-0 text-[10px] text-stone-400">
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
                placeholder="Ex.: sem cebola, sem tomate..."
                className="
                  mt-2.5
                  w-full
                  resize-none

                  rounded-xl
                  border
                  border-stone-200
                  bg-stone-50

                  px-4
                  py-3

                  text-sm
                  text-stone-800

                  outline-none
                  transition

                  placeholder:text-stone-400

                  focus:border-orange-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-orange-100

                  disabled:cursor-not-allowed

                  lg:h-18
                "
              />
            </div>

            {/* =====================================
                BOTÃO ADICIONAR
            ===================================== */}

            <div
              className="
                mt-5
                border-t
                border-stone-100
                pt-4
                lg:mt-auto
                lg:pt-5
              "
            >
              <button
                type="button"
                onClick={handleAdd}
                disabled={isClosing || outOfStock}
                className="
                  inline-flex
                  min-h-12
                  w-full
                  items-center
                  justify-center
                  gap-2

                  rounded-xl
                  bg-orange-700

                  px-5
                  py-3

                  text-sm
                  font-black
                  text-white

                  shadow-md
                  shadow-orange-900/10

                  transition-all
                  duration-200

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
                <ShoppingBag
                  size={18}
                  aria-hidden="true"
                />

                {outOfStock
                  ? "Produto esgotado"
                  : "Adicionar à sacola"}

                {!outOfStock && (
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

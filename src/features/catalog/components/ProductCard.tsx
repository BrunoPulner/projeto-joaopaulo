
import { useState } from "react";

import {
  ArrowUpRight,
  ImageOff,
  Minus,
  Plus,
  ShoppingBag,
  Pizza,
} from "lucide-react";

import type { CatalogProduct } from "../types/catalog.types";

import { resolveCatalogImageUrl } from "../api/catalog.api";

// ============================================
// TIPAGEM
// ============================================

type ProductCardProps = {
  product: CatalogProduct;

  onView: (product: CatalogProduct) => void;

  onAddToCart?: (
    product: CatalogProduct,
    quantity: number,
  ) => void;
};

// ============================================
// FORMATAÇÃO
// ============================================

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// ============================================
// COMPONENTE
// ============================================

export function ProductCard({
  product,
  onView,
  onAddToCart,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const [failedImage, setFailedImage] = useState<
    string | null
  >(null);

  const imageUrl = resolveCatalogImageUrl(
    product.imageUrl,
  );

  const showImage =
    Boolean(imageUrl) && failedImage !== imageUrl;

  const isCustomPizza =
    product.pricingType === "PIZZA_CUSTOM";

  const price = product.priceCents / 100;

  // ==========================================
  // QUANTIDADE
  // ==========================================

  function increaseQuantity() {
    setQuantity((current) => current + 1);
  }

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1),
    );
  }

  // ==========================================
  // VISUALIZAR DETALHES
  // ==========================================

  function handleViewProduct() {
    onView(product);
  }

  // ==========================================
  // ADICIONAR AO CARRINHO
  // ==========================================

  function handleAddToCart() {
    // Pizzas personalizadas precisam passar
    // pelo fluxo de seleção de sabores.
    if (isCustomPizza) {
      onView(product);
      return;
    }

    // Se o catálogo ainda não estiver conectado
    // à função de adicionar, abre os detalhes.
    if (!onAddToCart) {
      onView(product);
      return;
    }

    onAddToCart(product, quantity);

    setQuantity(1);
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <article
      className="
        group
        relative
        flex
        h-full
        min-w-0
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-stone-200
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-orange-200
        hover:shadow-xl
        hover:shadow-stone-900/5
        motion-reduce:transform-none
        motion-reduce:transition-none
      "
    >
      {/* =====================================
          IMAGEM CLICÁVEL
      ===================================== */}

      <button
        type="button"
        onClick={handleViewProduct}
        aria-label={`Ver detalhes de ${product.name}`}
        className="
          relative
          aspect-16/10
          w-full
          shrink-0
          cursor-pointer
          overflow-hidden
          bg-orange-50
          text-left
          focus-visible:outline-2
          focus-visible:outline-orange-700
        "
      >
        {showImage && imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() =>
                setFailedImage(imageUrl)
              }
              className="
                absolute
                inset-0
                h-full
                w-full
                object-cover
                transition-transform
                duration-500
                group-hover:scale-105
                motion-reduce:transform-none
              "
            />

            <div
              className="
                absolute
                inset-x-0
                bottom-0
                h-20
                bg-linear-to-t
                from-black/30
                to-transparent
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
              gap-2
              bg-linear-to-br
              from-orange-50
              to-amber-100/60
              text-orange-300
            "
          >
            <ImageOff
              size={32}
              strokeWidth={1.5}
              aria-hidden="true"
            />

            <span className="text-xs font-semibold">
              Imagem em breve
            </span>
          </div>
        )}

        {/* ÍCONE DE DETALHES */}

        <span
          className="
            absolute
            right-3
            top-3
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-white/95
            text-stone-700
            shadow-sm
            backdrop-blur
            transition-all
            duration-200
            group-hover:bg-orange-700
            group-hover:text-white
          "
          aria-hidden="true"
        >
          <ArrowUpRight size={17} />
        </span>

        {/* IDENTIFICAÇÃO DA PIZZA */}

        {isCustomPizza && (
          <span
            className="
              absolute
              bottom-3
              left-3
              flex
              items-center
              gap-1.5
              rounded-full
              bg-orange-700/95
              px-3
              py-1.5
              text-[11px]
              font-bold
              text-white
              shadow-sm
            "
          >
            <Pizza size={13} />
            Monte sua pizza
          </span>
        )}
      </button>

      {/* =====================================
          INFORMAÇÕES
      ===================================== */}

      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
          p-4
          sm:p-5
        "
      >
        {/* ÁREA CLICÁVEL DE INFORMAÇÕES */}

        <button
          type="button"
          onClick={handleViewProduct}
          className="
            flex
            w-full
            flex-1
            flex-col
            text-left
            focus-visible:outline-2
            focus-visible:outline-orange-700
          "
        >
          <div
            className="
              flex
              w-full
              items-start
              justify-between
              gap-3
            "
          >
            <h3
              className="
                min-w-0
                text-base
                font-black
                leading-snug
                text-stone-900
                transition-colors
                group-hover:text-orange-800
                sm:text-lg
              "
            >
              {product.name}
            </h3>

            <div className="shrink-0 text-right">
              {isCustomPizza && (
                <span className="block text-[10px] font-semibold text-stone-400">
                  A partir de
                </span>
              )}

              <span
                className="
                  whitespace-nowrap
                  text-base
                  font-black
                  text-orange-700
                  sm:text-lg
                "
              >
                {currency.format(price)}
              </span>
            </div>
          </div>

          {product.description && (
            <p
              className="
                mt-2
                line-clamp-2
                text-xs
                leading-relaxed
                text-stone-500
                sm:text-sm
              "
            >
              {product.description}
            </p>
          )}
        </button>

        {/* =====================================
            CONTROLES DE COMPRA
        ===================================== */}

        <div
          className="
            mt-4
            flex
            items-center
            gap-2
            border-t
            border-stone-100
            pt-4
          "
        >
          {/* QUANTIDADE */}

          {!isCustomPizza && (
            <div
              className="
                flex
                h-11
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
                disabled={quantity <= 1}
                aria-label={`Diminuir quantidade de ${product.name}`}
                className="
                  flex
                  h-9
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-stone-600
                  transition
                  hover:bg-white
                  hover:text-orange-700
                  disabled:cursor-not-allowed
                  disabled:opacity-30
                "
              >
                <Minus size={15} />
              </button>

              <span
                className="
                  min-w-7
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
                aria-label={`Aumentar quantidade de ${product.name}`}
                className="
                  flex
                  h-9
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-stone-600
                  transition
                  hover:bg-white
                  hover:text-orange-700
                "
              >
                <Plus size={15} />
              </button>
            </div>
          )}

          {/* ADICIONAR */}

          <button
            type="button"
            onClick={handleAddToCart}
            className="
              inline-flex
              min-h-11
              min-w-0
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-orange-700
              px-3
              py-2.5
              text-sm
              font-bold
              text-white
              shadow-sm
              shadow-orange-900/10
              transition-all
              duration-200
              hover:bg-orange-800
              hover:shadow-md
              active:scale-[0.98]
              active:bg-orange-900
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-orange-700
              motion-reduce:transform-none
            "
          >
            <ShoppingBag
              size={17}
              className="shrink-0"
              aria-hidden="true"
            />

            <span className="truncate">
              {isCustomPizza
                ? "Montar pizza"
                : "Adicionar"}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

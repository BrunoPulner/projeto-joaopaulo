
import { useState } from "react";

import {
  ArrowUpRight,
  ImageOff,
  UtensilsCrossed,
} from "lucide-react";

import type { CatalogProduct } from "../types/catalog.types";

import { resolveCatalogImageUrl } from "../api/catalog.api";

// ============================================
// TIPAGEM
// ============================================

type ProductCardProps = {
  product: CatalogProduct;
  onView: (product: CatalogProduct) => void;
};

// ============================================
// FORMATAÇÃO DE MOEDA
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
}: ProductCardProps) {
  const [failedImage, setFailedImage] = useState<
    string | null
  >(null);

  // URL da imagem cadastrada no backend
  const imageUrl = resolveCatalogImageUrl(
    product.imageUrl,
  );

  // Exibe a imagem apenas se ela existir
  // e não tiver apresentado erro
  const showImage =
    Boolean(imageUrl) && failedImage !== imageUrl;

  // Preço armazenado em centavos no banco
  const price = product.priceCents / 100;

  // Identifica produtos com preço personalizado
  const isCustomPizza =
    product.pricingType === "PIZZA_CUSTOM";

  function handleViewProduct() {
    onView(product);
  }

  return (
    <article
      className="
        group
        flex
        h-full
        min-w-0
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
        sm:flex-col
      "
    >
      {/* =====================================
          IMAGEM DO PRODUTO
      ===================================== */}

      <button
        type="button"
        onClick={handleViewProduct}
        aria-label={`Ver ${product.name}`}
        className="
          relative
          w-[34%]
          shrink-0
          cursor-pointer
          overflow-hidden
          bg-orange-50
          text-left
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-orange-700
          sm:aspect-16/10
          sm:w-full
        "
      >
        {showImage && imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
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
                motion-reduce:transition-none
              "
              onError={() =>
                setFailedImage(imageUrl)
              }
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

            <span
              className="
                hidden
                text-xs
                font-semibold
                sm:block
              "
            >
              Imagem em breve
            </span>
          </div>
        )}

        {/* Indicador visual de abertura */}

        <span
          className="
            absolute
            right-3
            top-3
            hidden
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
            sm:flex
          "
          aria-hidden="true"
        >
          <ArrowUpRight size={17} />
        </span>

        {/* Identificação de pizza personalizável */}

        {isCustomPizza && (
          <span
            className="
              absolute
              bottom-3
              left-3
              rounded-full
              bg-orange-700/95
              px-3
              py-1.5
              text-[10px]
              font-bold
              text-white
              shadow-sm
              backdrop-blur-sm
              sm:text-xs
            "
          >
            Monte sua pizza
          </span>
        )}
      </button>

      {/* =====================================
          INFORMAÇÕES DO PRODUTO
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
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
          "
        >
          {/* Nome */}

          <button
            type="button"
            onClick={handleViewProduct}
            className="
              min-w-0
              text-left
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-orange-700
            "
          >
            <h3
              className="
                text-base
                font-black
                leading-snug
                text-stone-900
                transition-colors
                duration-200
                group-hover:text-orange-800
                sm:text-lg
              "
            >
              {product.name}
            </h3>
          </button>

          {/* Preço */}

          <div
            className="
              flex
              shrink-0
              flex-col
              items-end
              gap-0.5
            "
          >
            {isCustomPizza && (
              <span
                className="
                  text-[10px]
                  font-semibold
                  text-stone-400
                  sm:text-xs
                "
              >
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

        {/* Descrição */}

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

        {/* =====================================
            BOTÃO DE DETALHES
        ===================================== */}

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={handleViewProduct}
            aria-label={`Ver detalhes de ${product.name}`}
            className="
              inline-flex
              min-h-11
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-orange-700
              px-4
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
              motion-reduce:transition-none
            "
          >
            <UtensilsCrossed
              size={17}
              aria-hidden="true"
            />

            {isCustomPizza
              ? "Montar pizza"
              : "Ver produto"}

            <ArrowUpRight
              size={16}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </article>
  );
}

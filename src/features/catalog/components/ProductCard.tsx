import { useState } from "react";
import {
  ArrowUpRight,
  ImageOff,
  UtensilsCrossed,
} from "lucide-react";

import type { Product } from "../catalogData";

type ProductCardProps = {
  product: Product;
  onView: (product: Product) => void;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function ProductCard({
  product,
  onView,
}: ProductCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(
    null,
  );

  const showImage =
    Boolean(product.image) && failedImage !== product.image;

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
      {/* Imagem do produto */}
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
        {showImage ? (
          <>
            <img
              src={product.image}
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
                setFailedImage(product.image ?? null)
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

            <span className="hidden text-xs font-semibold sm:block">
              Imagem em breve
            </span>
          </div>
        )}

        {/* Ícone para indicar abertura */}
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
      </button>

      {/* Informações */}
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
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

          <span
            className="
              shrink-0
              whitespace-nowrap
              text-base
              font-black
              text-orange-700
              sm:text-lg
            "
          >
            {currency.format(product.price)}
          </span>
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

            Ver produto

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
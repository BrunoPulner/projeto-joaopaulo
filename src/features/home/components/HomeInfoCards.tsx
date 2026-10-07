import {
  ArrowUpRight,
  Banknote,
  CreditCard,
  MapPin,
  ShoppingBag,
} from "lucide-react";

const location = {
  address: "",
  mapsUrl: "",
};

const cardClass = `
  group
  relative
  overflow-hidden

  rounded-2xl
  border
  border-white/15

  bg-black/25

  p-4

  shadow-lg
  shadow-black/10

  backdrop-blur-md

  transition-all
  duration-500
  ease-out

  hover:-translate-y-1.5
  hover:border-orange-400/35
  hover:bg-black/40
  hover:shadow-2xl
  hover:shadow-black/25

  motion-reduce:transform-none
  motion-reduce:transition-none
`;

const iconClass = `
  relative
  z-10

  flex
  h-10
  w-10
  shrink-0
  items-center
  justify-center

  rounded-xl

  border
  border-orange-400/20

  bg-orange-500/15
  text-orange-300

  transition-all
  duration-500
  ease-out

  group-hover:scale-110
  group-hover:border-orange-400/40
  group-hover:bg-orange-500/25
  group-hover:text-orange-200
  group-hover:shadow-lg
  group-hover:shadow-orange-500/10

  motion-reduce:transform-none
  motion-reduce:transition-none
`;

export function HomeInfoCards() {
  return (
    <section
      aria-label="Informações do restaurante"
      className="
        grid
        gap-2.5

        sm:grid-cols-3

        md:gap-3
      "
    >
      {/* Localização */}

      <article
        className={`
          ${cardClass}
          home-info-card
          home-info-card-1
        `}
      >
        {/* Glow do hover */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-10
            -top-10

            h-28
            w-28

            rounded-full

            bg-orange-500/0
            blur-3xl

            transition-all
            duration-700

            group-hover:bg-orange-500/15
          "
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className={iconClass}>
            <MapPin
              size={19}
              aria-hidden="true"
              className="
                transition-transform
                duration-500
                ease-out

                group-hover:-translate-y-0.5
                group-hover:scale-110

                motion-reduce:transform-none
              "
            />
          </span>

          <div className="min-w-0">
            <h2
              className="
                text-sm
                font-black
                text-white

                transition-colors
                duration-300

                group-hover:text-orange-100
              "
            >
              Venha nos visitar
            </h2>

            <p className="mt-0.5 truncate text-xs text-white/55">
              {location.address ||
                "João Paulo Espetinhos"}
            </p>
          </div>
        </div>

        {location.mapsUrl && (
          <a
            href={location.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              relative
              z-10

              mt-3
              inline-flex
              items-center
              gap-1

              text-xs
              font-bold
              text-orange-300

              transition-colors
              duration-300

              hover:text-orange-200
            "
          >
            Como chegar

            <ArrowUpRight
              size={14}
              aria-hidden="true"
              className="
                transition-transform
                duration-300

                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5

                motion-reduce:transform-none
              "
            />
          </a>
        )}

        {/* Linha inferior */}

        <span
          aria-hidden="true"
          className="
            absolute
            bottom-0
            left-1/2

            h-px
            w-0

            -translate-x-1/2

            bg-linear-to-r
            from-transparent
            via-orange-400
            to-transparent

            transition-all
            duration-500
            ease-out

            group-hover:w-3/4

            motion-reduce:transition-none
          "
        />
      </article>

      {/* Pedido */}

      <article
        className={`
          ${cardClass}
          home-info-card
          home-info-card-2
        `}
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-10
            -top-10

            h-28
            w-28

            rounded-full

            bg-orange-500/0
            blur-3xl

            transition-all
            duration-700

            group-hover:bg-orange-500/15
          "
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className={iconClass}>
            <ShoppingBag
              size={19}
              aria-hidden="true"
              className="
                transition-transform
                duration-500
                ease-out

                group-hover:-translate-y-0.5
                group-hover:scale-110

                motion-reduce:transform-none
              "
            />
          </span>

          <div className="min-w-0">
            <h2
              className="
                text-sm
                font-black
                text-white

                transition-colors
                duration-300

                group-hover:text-orange-100
              "
            >
              Do seu jeito
            </h2>

            <p className="mt-0.5 text-xs leading-5 text-white/55">
              Peça pelo site para receber ou retirar.
            </p>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="
            absolute
            bottom-0
            left-1/2

            h-px
            w-0

            -translate-x-1/2

            bg-linear-to-r
            from-transparent
            via-orange-400
            to-transparent

            transition-all
            duration-500
            ease-out

            group-hover:w-3/4

            motion-reduce:transition-none
          "
        />
      </article>

      {/* Pagamento */}

      <article
        className={`
          ${cardClass}
          home-info-card
          home-info-card-3
        `}
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-10
            -top-10

            h-28
            w-28

            rounded-full

            bg-orange-500/0
            blur-3xl

            transition-all
            duration-700

            group-hover:bg-orange-500/15
          "
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className={iconClass}>
            <CreditCard
              size={19}
              aria-hidden="true"
              className="
                transition-transform
                duration-500
                ease-out

                group-hover:-translate-y-0.5
                group-hover:scale-110

                motion-reduce:transform-none
              "
            />
          </span>

          <div className="min-w-0">
            <h2
              className="
                text-sm
                font-black
                text-white

                transition-colors
                duration-300

                group-hover:text-orange-100
              "
            >
              Formas de pagamento
            </h2>

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {["Pix", "Crédito", "Débito"].map(
                (method) => (
                  <span
                    key={method}
                    className="
                      inline-flex
                      items-center
                      gap-1

                      rounded-md
                      border
                      border-white/10
                      bg-white/10

                      px-2
                      py-1

                      text-[10px]
                      font-semibold
                      text-white/70

                      transition-all
                      duration-300

                      group-hover:border-white/15
                      group-hover:bg-white/15
                      group-hover:text-white/85
                    "
                  >
                    {method === "Pix" ? (
                      <Banknote
                        size={11}
                        aria-hidden="true"
                      />
                    ) : (
                      <CreditCard
                        size={11}
                        aria-hidden="true"
                      />
                    )}

                    {method}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="
            absolute
            bottom-0
            left-1/2

            h-px
            w-0

            -translate-x-1/2

            bg-linear-to-r
            from-transparent
            via-orange-400
            to-transparent

            transition-all
            duration-500
            ease-out

            group-hover:w-3/4

            motion-reduce:transition-none
          "
        />
      </article>
    </section>
  );
}
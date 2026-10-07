import {
  ArrowRight,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";

type HomeHeroProps = {
  locationUrl?: string;
};

export function HomeHero({
  locationUrl,
}: HomeHeroProps) {
  const locationButtonClass = `
    inline-flex
    min-h-12
    items-center
    justify-center
    gap-2

    rounded-xl
    border
    border-white/25
    bg-black/20

    px-5
    py-3

    text-sm
    font-bold
    text-white

    backdrop-blur-md

    transition
    duration-300

    hover:-translate-y-0.5
    hover:border-white/40
    hover:bg-white/15

    focus-visible:outline-2
    focus-visible:outline-offset-4
    focus-visible:outline-white

    motion-reduce:transform-none
    motion-reduce:transition-none
  `;

  return (
    <section
  aria-labelledby="home-title"
  className="
    home-enter
    flex
    flex-1
    items-start

    pt-24
    sm:pt-28

    md:items-center
    md:pt-20

    lg:pt-18
  "
>
      <div
        className="
          w-full
          max-w-xl

          md:max-w-145
          lg:max-w-157.5
        "
      >
        {/* Identificação */}

        

        {/* Título */}

        <h1
          id="home-title"
          className="
            mt-5

            text-[clamp(2.6rem,11vw,4rem)]
            font-black
            leading-[0.98]
            tracking-[-0.035em]
            text-white

            drop-shadow-lg

            md:mt-6
            md:text-[clamp(3.4rem,5vw,4.8rem)]
          "
        >
          <span className="block">
            Sabor que reúne.
          </span>

          <span
            className="
              mt-2
              block
              text-orange-400

              md:mt-1
            "
          >
            Momentos que ficam.
          </span>
        </h1>

        {/* Descrição */}

        <p
          className="
            mt-5
            max-w-lg

            text-sm
            font-medium
            leading-6
            text-white/75

            sm:text-base
            sm:leading-7

            md:mt-6
          "
        >
          Escolha seu favorito e faça seu pedido.
          Espetinhos, lanches, pizzas, pastéis e
          bebidas preparados para deixar seu
          momento ainda melhor.
        </p>

        {/* Categorias */}

        <div
          className="
            mt-4
            flex
            flex-wrap
            gap-x-2
            gap-y-1

            text-[10px]
            font-black
            uppercase
            tracking-[0.13em]
            text-white/55

            sm:text-[11px]
          "
          aria-label="Categorias disponíveis"
        >
          <span>Espetinhos</span>
          <span aria-hidden="true">•</span>

          <span>Lanches</span>
          <span aria-hidden="true">•</span>

          <span>Pizzas</span>
          <span aria-hidden="true">•</span>

          <span>Pastéis</span>
          <span aria-hidden="true">•</span>

          <span>Bebidas</span>
        </div>

        {/* Botões */}

        <div
          className="
            mt-6
            flex
            flex-col
            gap-3

            min-[420px]:flex-row
            min-[420px]:flex-wrap

            md:mt-7
          "
        >
          <Link
            to="/cardapio"
            className="
              group

              inline-flex
              min-h-12
              items-center
              justify-center
              gap-3

              rounded-xl
              bg-orange-600

              px-6
              py-3

              text-sm
              font-black
              text-white

              shadow-xl
              shadow-orange-950/30

              transition
              duration-300

              hover:-translate-y-0.5
              hover:bg-orange-500
              hover:shadow-2xl

              active:scale-[0.98]

              focus-visible:outline-2
              focus-visible:outline-offset-4
              focus-visible:outline-orange-300

              motion-reduce:transform-none
              motion-reduce:transition-none
            "
          >
            <ShoppingBag
              size={18}
              aria-hidden="true"
            />

            Explorar cardápio

            <ArrowRight
              size={18}
              aria-hidden="true"
              className="
                transition-transform
                duration-300

                group-hover:translate-x-1

                motion-reduce:transform-none
                motion-reduce:transition-none
              "
            />
          </Link>

          {locationUrl ? (
            <a
              href={locationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={locationButtonClass}
            >
              <MapPin
                size={18}
                aria-hidden="true"
              />

              Como chegar
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="A localização será adicionada em breve"
              className="
                inline-flex
                min-h-12
                cursor-not-allowed
                items-center
                justify-center
                gap-2

                rounded-xl
                border
                border-white/15
                bg-black/15

                px-5
                py-3

                text-sm
                font-bold
                text-white/45

                backdrop-blur-md
              "
            >
              <MapPin
                size={18}
                aria-hidden="true"
              />

              Como chegar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
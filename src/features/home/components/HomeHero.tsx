
import {
  ArrowRight,
  MapPin,
  ShoppingBag,
} from "lucide-react";

import { Link } from "react-router-dom";

type HomeHeroProps = {
  locationUrl?: string;
};

const locationButtonClass = `
  inline-flex
  min-h-11
  w-full
  items-center
  justify-center
  gap-2.5

  rounded-xl
  border
  border-orange-400/45
  bg-orange-950/65

  px-5
  py-3

  text-sm
  font-bold
  text-orange-100

  shadow-lg
  shadow-black/20

  backdrop-blur-md

  transition-all
  duration-300

  hover:-translate-y-0.5
  hover:border-orange-300/70
  hover:bg-orange-900/75
  hover:text-white

  focus-visible:outline-2
  focus-visible:outline-offset-4
  focus-visible:outline-orange-300

  min-[420px]:w-auto

  motion-reduce:transform-none
  motion-reduce:transition-none
`;

const categories = [
  "Espetinhos",
  "Lanches",
  "Pizzas",
  "Pastéis",
  "Bebidas",
];

export function HomeHero({
  locationUrl,
}: HomeHeroProps) {
  return (
    <section
      aria-labelledby="home-title"
      className="
        home-enter

        flex
        min-w-0
        flex-1
        items-start

        pt-20

        sm:pt-24

        md:items-center
        md:pt-16

        lg:pt-14
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
        {/* Título principal */}

        <h1
          id="home-title"
          className="
            text-[clamp(2.4rem,10vw,4rem)]
            font-black
            leading-[1.02]
            tracking-[-0.035em]
            text-white

            drop-shadow-lg

            sm:text-[clamp(3rem,7vw,4.5rem)]

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
            text-white/90

            drop-shadow-md

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
          aria-label="Categorias disponíveis"
          className="
            mt-5

            flex
            flex-wrap
            items-center

            gap-x-2
            gap-y-2

            text-[10px]
            font-extrabold
            uppercase
            tracking-widest
            text-white/90

            drop-shadow-md

            sm:text-[11px]

            md:mt-5
          "
        >
          {categories.map((category, index) => (
            <span
              key={category}
              className="
                inline-flex
                items-center
                gap-2
              "
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="
                    text-orange-400
                  "
                >
                  •
                </span>
              )}

              <span>{category}</span>
            </span>
          ))}
        </div>

        {/* Botões de ação */}

        {/* Botões de ação */}

<div
  className="
    mt-7
    flex
    w-full
    flex-col
    items-center
    justify-center
    gap-3

    md:mt-8
    md:flex-row
    md:flex-wrap
    md:items-center
    md:justify-start
  "
>
  {/* Botão principal */}

  <Link
    to="/cardapio"
    className="
      group
      inline-flex
      min-h-13
      w-fit
      items-center
      justify-center
      gap-3
      whitespace-nowrap
      rounded-xl
      bg-linear-to-r
      from-orange-600
      to-orange-500
      px-7
      py-3.5
      text-sm
      font-black
      text-white
      shadow-xl
      shadow-orange-950/50
      ring-1
      ring-orange-300/30
      transition-all
      duration-300
      hover:-translate-y-1
      hover:from-orange-500
      hover:to-orange-400
      hover:shadow-2xl
      active:scale-[0.98]
      motion-reduce:transform-none
      motion-reduce:transition-none
    "
  >
    <ShoppingBag size={19} aria-hidden="true" />

    Explorar cardápio

    <ArrowRight
      size={19}
      aria-hidden="true"
      className="
        transition-transform
        duration-300
        group-hover:translate-x-1
      "
    />
  </Link>

  {/* Botão secundário */}

  {locationUrl ? (
    <a
      href={locationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={locationButtonClass}
    >
      <MapPin size={18} aria-hidden="true" />
      Como chegar
    </a>
  ) : (
    <button
      type="button"
      disabled
      className={`
        ${locationButtonClass}
        cursor-not-allowed
        opacity-75
      `}
    >
      <MapPin size={18} aria-hidden="true" />
      Como chegar
    </button>
  )}
</div>
</div>
    </section>
  );
}

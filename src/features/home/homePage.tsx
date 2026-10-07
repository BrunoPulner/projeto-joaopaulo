import { HomeHero } from "./components/HomeHero";
import { HomeInfoCards } from "./components/HomeInfoCards";

import "../../styles/home.css";

export function HomePage() {
  return (
    <main
      className="
        relative
        isolate
        min-h-[calc(100dvh-89px)]
        overflow-hidden
        bg-[#160905]

        sm:min-h-[calc(100dvh-105px)]
      "
    >
      {/* Background mobile */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          -z-30

          bg-[url('/images/hero-cel.png')]
          bg-cover
          bg-center
          bg-no-repeat

          md:bg-[url('/images/hero-pc.png')]
          md:bg-center
        "
      />

      {/* Escurecimento geral */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-20

          bg-black/25

          md:bg-black/15
        "
      />

      {/* Gradiente para leitura no mobile */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10

          bg-linear-to-b
          from-black/80
          via-black/40
          to-black/35

          md:bg-linear-to-r
          md:from-black/90
          md:via-black/60
          md:to-black/5
        "
      />

      <div
        className="
          mx-auto
          flex
          min-h-[calc(100dvh-89px)]
          w-full
          max-w-6xl
          flex-col

          px-5
          pb-5
          pt-8

          sm:min-h-[calc(100dvh-105px)]
          sm:pb-7
          sm:pt-10

          md:px-8
          md:pb-8
          md:pt-12
        "
      >
        <HomeHero />

        <div className="mt-auto pt-7 md:pt-10">
          <HomeInfoCards />
        </div>
      </div>
    </main>
  );
}
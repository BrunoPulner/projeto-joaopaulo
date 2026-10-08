
import { useEffect, useState } from "react";

import { HomeHero } from "./components/HomeHero";
import { HomeInfoCards } from "./components/HomeInfoCards";

import "../../styles/home.css";

export function HomePage() {
  const [backgroundLoaded, setBackgroundLoaded] =
    useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(min-width: 768px)"
    );

    let active = true;

    const loadBackground = () => {
      setBackgroundLoaded(false);

      const image = new Image();

      image.onload = () => {
        if (active) {
          setBackgroundLoaded(true);
        }
      };

      image.onerror = () => {
        if (active) {
          setBackgroundLoaded(true);
        }
      };

      image.src = mediaQuery.matches
        ? "/images/hero-pc.png"
        : "/images/hero-cel.png";
    };

    loadBackground();

    const handleChange = () => {
      loadBackground();
    };

    mediaQuery.addEventListener(
      "change",
      handleChange
    );

    return () => {
      active = false;

      mediaQuery.removeEventListener(
        "change",
        handleChange
      );
    };
  }, []);

  return (
    <main
      className="
        relative
        isolate
        min-h-dvh
        overflow-hidden
        bg-[#160905]
      "
    >
      {/* Background com animação de blur */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          -inset-3
          -z-30

          bg-[url('/images/hero-cel.png')]
          bg-cover
          bg-center
          bg-no-repeat

          md:bg-[url('/images/hero-pc.png')]

          ${
            backgroundLoaded
              ? "hero-background-blur"
              : ""
          }
        `}
      />

      {/* Escurecimento geral */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-20

          bg-black/35
          md:bg-black/25
        "
      />

      {/* Gradiente de leitura */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10

          bg-linear-to-b
          from-black/85
          via-black/55
          to-black/50

          md:bg-linear-to-r
          md:from-black/95
          md:via-black/65
          md:to-black/15
        "
      />

      {/* Conteúdo */}
      <div
        className="
          mx-auto
          flex
          min-h-dvh
          w-full
          max-w-6xl
          flex-col

          px-5
          pb-5
          pt-8

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

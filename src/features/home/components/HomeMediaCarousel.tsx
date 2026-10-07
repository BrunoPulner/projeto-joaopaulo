import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";

import "../../../styles/home-carousel.css";

type MediaSlide = {
  id: string;
  type: "image" | "video";
  src: string;
  alt: string;
  poster?: string;
};

const slides: MediaSlide[] = [
  {
    id: "entrada-1",
    type: "image",
    src: "/images/entrada.png",
    alt: "Entrada do João Paulo Espetinhos",
  },
  {
    id: "entrada-2",
    type: "image",
    src: "/images/entrada.png",
    alt: "Espaço do João Paulo Espetinhos",
  },
  {
    id: "entrada-3",
    type: "image",
    src: "/images/entrada.png",
    alt: "Conheça o João Paulo Espetinhos",
  },
];

type CarouselVideoProps = {
  slide: MediaSlide;
  playing: boolean;
};

function CarouselVideo({ slide, playing }: CarouselVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (playing) {
      void video.play().catch(() => {
        // O navegador pode impedir a reprodução automática.
      });
    } else {
      video.pause();
    }

    return () => video.pause();
  }, [playing]);

  return (
    <video
      ref={videoRef}
      src={slide.src}
      poster={slide.poster}
      aria-label={slide.alt}
      className="home-carousel__media"
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}

export function HomeMediaCarousel() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const activeIndex = ((step % slides.length) + slides.length) % slides.length;
  const playing = !paused && !hovered && !focused;

  useEffect(() => {
    if (!playing) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const timer = window.setInterval(() => {
      if (!reducedMotion.matches) {
        setStep((current) => current + 1);
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [playing]);

  const rotationStyle = {
    "--carousel-rotation": `${step * -120}deg`,
  } as CSSProperties;

  function move(direction: number) {
    setStep((current) => current + direction);
  }

  return (
    <section
      aria-label="Fotos e vídeos do João Paulo Espetinhos"
      aria-roledescription="carrossel"
      className="home-carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      <div className="home-carousel__scene">
        <div
          className="home-carousel__rotator"
          style={rotationStyle}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${slides.length}`}
              aria-hidden={index !== activeIndex}
              className="home-carousel__slide"
              style={{
                transform: `rotateY(${index * 120}deg) translateZ(var(--carousel-depth))`,
              }}
            >
              {slide.type === "video" ? (
                <CarouselVideo
                  slide={slide}
                  playing={index === activeIndex && playing}
                />
              ) : (
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="home-carousel__media"
                  loading={index === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="home-carousel__gradient"
      />

      <button
        type="button"
        onClick={() => setPaused((current) => !current)}
        aria-label={
          paused ? "Retomar carrossel" : "Pausar carrossel"
        }
        className="home-carousel__control absolute right-4 top-4 z-20"
      >
        {paused ? (
          <Play size={17} aria-hidden="true" />
        ) : (
          <Pause size={17} aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        onClick={() => move(-1)}
        aria-label="Slide anterior"
        className="home-carousel__control absolute left-3 top-1/2 z-20 -translate-y-1/2"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => move(1)}
        aria-label="Próximo slide"
        className="home-carousel__control absolute right-3 top-1/2 z-20 -translate-y-1/2"
      >
        <ChevronRight size={22} aria-hidden="true" />
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
          Nosso espaço
        </span>

        <p className="mt-2 text-xl font-bold leading-snug text-white">
          Seu próximo encontro tem lugar.
        </p>

        <div className="pointer-events-auto mt-4 flex items-center gap-1">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Mostrar slide ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() =>
                setStep((current) => current + index - activeIndex)
              }
              className="flex h-6 min-w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span
                className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                  index === activeIndex
                    ? "w-6 bg-orange-400"
                    : "w-1.5 bg-white/60"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
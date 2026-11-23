import { useEffect, useRef, useState } from "react";

type CategoryVideoProps = {
  src: string;
  title: string;
};

export function CategoryVideo({ src, title }: CategoryVideoProps) {
  const [open, setOpen] = useState(false);
  const frameRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const videoElement = videoRef.current;

    if (!frame || !videoElement) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const initialScrollY = window.scrollY;
    let animationFrame = 0;

    function applyParallax() {
      const activeVideo = videoRef.current;
      if (!activeVideo) return;

      const scrollDistance = window.scrollY - initialScrollY;
      const offset = Math.max(-24, Math.min(24, scrollDistance * 0.2));

      activeVideo.style.transform =
        `translate3d(-50%, calc(-50% + ${offset}px), 0)`;
    }

    function updateParallax() {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(applyParallax);
    }

    window.addEventListener("scroll", updateParallax, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateParallax);
      cancelAnimationFrame(animationFrame);
    };
  }, [src, open]);

  return (
    <details className="mt-3 text-xs text-stone-600" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="w-fit cursor-pointer rounded-md py-1 font-semibold hover:text-orange-800">Ver vídeo de {title}</summary>
      {open && (
        <section
          ref={frameRef}
          aria-label={`Vídeo de ${title}`}
          className="relative mt-2 h-52 overflow-hidden rounded-xl bg-stone-950 sm:h-64"
        >
          <video
            ref={videoRef}
            key={src}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label={`Vídeo de ${title}`}
            className="absolute left-1/2 top-1/2 h-[calc(100%+48px)] w-full object-cover"
            style={{
              transform: "translate3d(-50%, -50%, 0)",
              objectPosition: "center 50%",
            }}
          >
            <source src={src} type="video/mp4" />
            Seu navegador não conseguiu reproduzir este vídeo.
          </video>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-black/10"
          />
        </section>
      )}
    </details>
  );
}
import { useEffect, useRef } from "react";

type CategoryVideoProps = {
  src: string;
  title: string;
};

export function CategoryVideo({ src, title }: CategoryVideoProps) {
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
  }, [src]);

  return (
    <section
      ref={frameRef}
      aria-label={`Vídeo de ${title}`}
      className="relative left-1/2 mt-14 h-64 w-screen -translate-x-1/2 overflow-hidden bg-stone-950 sm:mt-16 sm:h-72 lg:h-80"
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
  );
}
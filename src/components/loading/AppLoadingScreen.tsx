import { LoaderCircle } from "lucide-react";

type AppLoadingScreenProps = {
  leaving?: boolean;
};

export function AppLoadingScreen({
  leaving = false,
}: AppLoadingScreenProps) {
  return (
    <div
  className={`
    app-loading
    ${leaving ? "app-loading-leaving" : ""}

    fixed
    inset-0
    z-9999
    flex
    items-center
    justify-center
    overflow-hidden
    bg-linear-to-br
    from-stone-950
    via-orange-950
    to-stone-950
  `}
  role="status"
  aria-live="polite"
  aria-label="Carregando aplicação"
>
      {/* Vídeo */}
      <video
  className="
    absolute
    inset-0
    h-full
    w-full
    object-cover
    object-center
  "
  autoPlay
  muted
  loop
  playsInline
  preload="auto"
  aria-hidden="true"
>
  <source
    src="/video/loading.mp4"
    type="video/mp4"
  />
</video>

      {/* Escurecimento do vídeo */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          bg-black/45
        "
      />

      {/* Gradiente para destacar o centro */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_55%,rgba(0,0,0,0.55)_100%)]
        "
      />

      {/* Conteúdo */}
      <div
        className="
          relative
          z-10
          flex
          -translate-y-8
          flex-col
          items-center
          px-6
          text-center
        "
      >
        {/* Logo */}
        <img
          src="/images/Logo-branco-loading.png"
          alt="Espetinhos do João Paulo"
          className="
            app-loading-logo
            h-auto
            w-40
            object-contain

            sm:w-48
          "
        />

        {/* Loading */}
        <div className="mt-10 flex flex-col items-center">
          <LoaderCircle
            size={30}
            strokeWidth={2}
            className="animate-spin text-white"
            aria-hidden="true"
          />

          <p
            className="
              mt-4
              text-xs
              font-bold
              uppercase
              tracking-[0.18em]
              text-white/90
            "
          >
            Preparando tudo para você
          </p>
        </div>
      </div>
    </div>
  );
}
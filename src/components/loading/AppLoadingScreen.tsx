type AppLoadingScreenProps = {
  leaving?: boolean;
};

export function AppLoadingScreen({ leaving = false }: AppLoadingScreenProps) {
  return (
    <div
      className={`app-loading fixed inset-0 z-9999 grid place-items-center bg-[#171611] px-6 ${leaving ? "app-loading-leaving" : ""}`}
      role="status"
    >
      <div className="app-loading-logo grid w-60 justify-items-center gap-5">
        <img
          src="/images/restaurante-wordmark-light.svg"
          width={240}
          height={48}
          alt="restaurante.com"
        />
        <div className="restaurant-loader" aria-hidden="true" />
        <span className="sr-only">Carregando</span>
      </div>
    </div>
  );
}

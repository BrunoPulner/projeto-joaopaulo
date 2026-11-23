export function LoginIntro() {
  return (
    <div className="relative isolate hidden min-w-0 flex-col justify-between overflow-hidden bg-[#221910] p-8 text-[#fff9ef] lg:flex xl:p-10">
      <img
        src="/images/restaurante-salao.jpg"
        alt=""
        className="absolute inset-0 -z-20 size-full object-cover object-[65%_50%]"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-[#1b130d] via-[#1b130d]/25 to-[#1b130d]/70" aria-hidden="true" />

      <img
        src="/images/restaurante-wordmark-light.svg"
        alt="restaurante.com"
        width={204}
        height={41}
      />

      <div className="max-w-sm pt-28">
        <span aria-hidden="true" className="mb-4 block h-px w-10 bg-[#eac69d]" />
        <p className="restaurant-display text-[clamp(2.65rem,5vw,4.5rem)] leading-[0.98] tracking-tight">
          Bom ter você <em className="text-[#f2d8ae]">à mesa.</em>
        </p>
      </div>
    </div>
  );
}

import { UserRound } from "lucide-react";

export function LoginIntro() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#fff1df] p-10 lg:flex">
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-20 size-72 rounded-full bg-orange-200/50 blur-3xl"
      />

      <div className="relative">
        <img
          src="/images/logo-semfundo.png"
          alt="Espetinhos João Paulo"
          className="h-24 w-auto object-contain"
        />
      </div>

      <div className="relative max-w-sm pb-8">
        <span className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-white text-orange-700 shadow-sm">
          <UserRound size={27} aria-hidden="true" />
        </span>

        <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-700">
          Seu perfil
        </p>
        <h2 className="mt-3 text-4xl font-black leading-tight text-stone-950">
          Que bom ter você por aqui.
        </h2>
        <p className="mt-4 leading-relaxed text-stone-600">
          Entre para acessar sua conta e acompanhar sua experiência com
          João Paulo Espetinhos.
        </p>
      </div>

      <p className="relative text-xs text-stone-500">
        João Paulo Espetinhos
      </p>
    </aside>
  );
}
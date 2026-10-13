import {
  ArrowLeft,
  Flame,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { LoginSuccessRedirect } from "../components/LoginSuccessRedirect";

import { LoginForm } from "../components/LoginForm";
import { LoginIntro } from "../components/LoginIntro";

export function LoginPage() {
  return (
    <main
  className="
    relative
    flex
    min-h-[calc(100dvh-88px)]
    items-center
    justify-center
    overflow-hidden
    bg-linear-to-br
    from-[#fff7ed]
    via-[#fffaf5]
    to-[#fff1e8]
    px-5
    py-10

    sm:min-h-[calc(100dvh-104px)]
    sm:py-14
  "
>
      {/* Decoração do fundo */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-32
          top-10
          h-80
          w-80
          rounded-full
          bg-orange-200/35
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-40
          -right-24
          h-96
          w-96
          rounded-full
          bg-red-200/30
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-[12%]
          top-[10%]
          h-40
          w-40
          rounded-full
          bg-amber-200/25
          blur-3xl
        "
      />

      {/* Card principal */}
      <div
        className="
          login-card-enter

          relative
          z-10
          grid
          w-full
          max-w-5xl
          overflow-hidden
          rounded-[28px]
          border
          border-orange-100/80
          bg-white
          shadow-2xl
          shadow-orange-950/10

          lg:grid-cols-2
        "
      >
        <LoginIntro />

        {/* Área do formulário */}
        <section
          className="
            relative
            flex
            items-center
            overflow-hidden
            bg-white
            px-6
            py-9

            sm:px-10
            sm:py-12

            lg:px-12
          "
        >
          {/* Mancha decorativa interna */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-56
              w-56
              rounded-full
              bg-orange-100/60
              blur-3xl
            "
          />

          {/* Detalhe lateral */}
          <div
            aria-hidden="true"
            className="
              absolute
              right-0
              top-1/2
              hidden
              h-40
              w-1
              -translate-y-1/2
              rounded-l-full
              bg-linear-to-b
              from-orange-400
              via-orange-700
              to-red-600

              lg:block
            "
          />

          <div className="relative mx-auto w-full max-w-md">
            {/* Voltar */}
            <Link
              to="/"
              className="
                group
                inline-flex
                items-center
                gap-2
                text-sm
                font-bold
                text-stone-500
                transition-colors
                duration-200

                hover:text-orange-700
              "
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  bg-orange-50
                  text-orange-700
                  transition-all
                  duration-200

                  group-hover:-translate-x-0.5
                  group-hover:bg-orange-100
                "
              >
                <ArrowLeft
                  size={15}
                  aria-hidden="true"
                />
              </span>

              Voltar ao início
            </Link>

            {/* Título */}
            <div className="mt-8">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-orange-100
                  bg-orange-50
                  px-3
                  py-1.5
                  text-[11px]
                  font-black
                  uppercase
                  tracking-[0.14em]
                  text-orange-700
                "
              >
                <Flame
                  size={14}
                  aria-hidden="true"
                />

                Área do cliente
              </div>

              <h1
                className="
                  mt-4
                  text-3xl
                  font-black
                  tracking-tight
                  text-stone-950

                  sm:text-[2rem]
                "
              >
                Acesse seu perfil
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-600">
                Entre na sua conta para acompanhar seus
                pedidos e acessar suas informações.
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-stone-400">
                <ShieldCheck
                  size={15}
                  className="text-emerald-600"
                  aria-hidden="true"
                />

                Acesso seguro à sua conta
              </div>
            </div>
            <LoginSuccessRedirect />
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
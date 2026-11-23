import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { GoogleLoginButton } from "../../auth/components/GoogleLoginButton";
import { LoginSuccessRedirect } from "../components/LoginSuccessRedirect";
import { LoginForm } from "../components/LoginForm";
import { LoginIntro } from "../components/LoginIntro";

export function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f3eae0] px-4 py-5 sm:px-8 sm:py-8 lg:grid lg:min-h-dvh lg:place-items-center lg:p-8">
      <div className="login-card-enter mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-[#ded1c1] bg-[#fffcf7] shadow-[0_20px_64px_rgba(42,29,17,0.13)] sm:rounded-3xl lg:grid-cols-[1.05fr_1fr]">
        <LoginIntro />

        <section aria-labelledby="login-title" className="flex items-center px-5 py-6 sm:px-10 sm:py-8 lg:px-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 flex min-h-9 flex-wrap items-center justify-between gap-x-2 gap-y-2 sm:mb-8">
              <Link
                to="/"
                className="group inline-flex min-h-9 items-center gap-2 rounded-sm text-sm font-semibold text-stone-700 transition-colors hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-800"
              >
                <ArrowLeft size={16} aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />
                Voltar ao início
              </Link>
              <img src="/images/restaurante-wordmark.svg" alt="restaurante.com" width={140} height={28} className="lg:hidden" />
            </div>

            <h1 id="login-title" className="restaurant-display text-[clamp(2.35rem,6vw,3.4rem)] leading-none tracking-tight text-[#241b13]">
              Entre na sua conta
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
              Consulte seus pedidos e gerencie seus endereços.
            </p>

            <LoginSuccessRedirect />
            <div className="mt-5 sm:mt-6">
              <GoogleLoginButton />
            </div>

            <div className="my-5 flex items-center gap-3 sm:my-6">
              <span className="h-px flex-1 bg-[#e5dcd0]" aria-hidden="true" />
              <h2 id="admin-login-title" className="text-xs font-semibold text-stone-600">
                Acesso administrativo
              </h2>
              <span className="h-px flex-1 bg-[#e5dcd0]" aria-hidden="true" />
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}

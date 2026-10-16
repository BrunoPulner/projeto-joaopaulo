
import type { ReactNode } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Pizza,
  X,
} from "lucide-react";

// ============================================
// PROPRIEDADES
// ============================================

interface PizzaManagerLayoutProps {
  children: ReactNode;

  title?: string;
  description?: string;

  onBack?: () => void;

  error?: string;
  success?: string;

  onDismissError?: () => void;
  onDismissSuccess?: () => void;

  loading?: boolean;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function PizzaManagerLayout({
  children,

  title = "Gerenciamento de pizzas",

  description =
    "Configure os tamanhos, sabores e adicionais disponíveis no cardápio do restaurante.",

  onBack,

  error,
  success,

  onDismissError,
  onDismissSuccess,

  loading = false,
}: PizzaManagerLayoutProps) {
  return (
    <section
      aria-label="Gerenciamento de pizzas"
      aria-busy={loading}
      className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm"
    >
      {/* =====================================
          CABEÇALHO
      ===================================== */}

      <header className="relative overflow-hidden border-b border-orange-100 bg-linear-to-br from-orange-50 via-white to-amber-50 px-5 py-6 sm:px-7 sm:py-7">
        {/* Elemento decorativo */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-orange-100/50 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {/* Ícone */}

            <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-100 text-orange-700 shadow-sm">
              <Pizza size={26} strokeWidth={1.8} />
            </div>

            {/* Título */}

            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                Cardápio do restaurante
              </span>

              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                {title}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          </div>

          {/* Voltar */}

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="
                inline-flex min-h-11 shrink-0
                items-center justify-center gap-2
                rounded-xl border border-slate-200
                bg-white px-4 py-2.5
                text-sm font-bold text-slate-700
                shadow-sm transition
                hover:border-orange-300
                hover:bg-orange-50
                hover:text-orange-800
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-orange-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <ArrowLeft size={17} />
              Voltar
            </button>
          )}
        </div>
      </header>

      {/* =====================================
          CONTEÚDO
      ===================================== */}

      <div className="space-y-6 p-4 sm:p-6 lg:p-7">
        {/* Mensagem de erro */}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <CircleAlert
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-red-800">
                Não foi possível concluir a operação
              </p>

              <p className="mt-1 wrap-break-word text-sm leading-relaxed text-red-700">
                {error}
              </p>
            </div>

            {onDismissError && (
              <button
                type="button"
                onClick={onDismissError}
                aria-label="Fechar mensagem de erro"
                className="rounded-lg p-1 text-red-600 transition hover:bg-red-100"
              >
                <X size={17} />
              </button>
            )}
          </div>
        )}

        {/* Mensagem de sucesso */}

        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-800">
                Operação realizada com sucesso
              </p>

              <p className="mt-1 wrap-break-word text-sm leading-relaxed text-emerald-700">
                {success}
              </p>
            </div>

            {onDismissSuccess && (
              <button
                type="button"
                onClick={onDismissSuccess}
                aria-label="Fechar mensagem de sucesso"
                className="rounded-lg p-1 text-emerald-600 transition hover:bg-emerald-100"
              >
                <X size={17} />
              </button>
            )}
          </div>
        )}

        {/* Conteúdo dinâmico */}

        <div className="min-w-0">
          {children}
        </div>
      </div>
    </section>
  );
}

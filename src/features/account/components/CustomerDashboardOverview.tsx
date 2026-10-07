import {
  CheckCircle2,
  Clock3,
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    label: "Pedidos no total",
    value: "0",
    icon: ShoppingBag,
  },
  {
    label: "Em andamento",
    value: "0",
    icon: Clock3,
  },
  {
    label: "Concluídos",
    value: "0",
    icon: CheckCircle2,
  },
];

export function CustomerDashboardOverview() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:p-9">
        <p className="text-sm font-semibold text-orange-100">
          Bem-vindo ao seu espaço
        </p>

        <h2 className="mt-2 max-w-xl text-2xl font-black leading-tight sm:text-3xl">
          Acompanhe seus pedidos por aqui.
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-orange-50">
          Consulte seus pedidos e encontre seus sabores favoritos no
          cardápio.
        </p>

        <Link
          to="/cardapio"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-orange-800 transition hover:bg-orange-50"
        >
          Explorar cardápio
        </Link>
      </section>

      <section aria-label="Resumo dos pedidos">
        <h2 className="text-lg font-black text-stone-900">
          Resumo dos pedidos
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <article
              key={label}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-stone-600">
                  {label}
                </p>

                <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>

              <p className="mt-4 text-3xl font-black text-stone-900">
                {value}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-stone-900">
          Pedidos recentes
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Seus pedidos aparecerão aqui quando você fizer a primeira
          compra.
        </p>
      </section>
    </div>
  );
}
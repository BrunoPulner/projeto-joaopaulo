
import {
  CheckCircle2,
  Clock3,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useSession } from "../../../../src/lib/auth-client";

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
  const { data: session } = useSession();

  const user = session?.user;

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Cliente";

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:p-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15">
            {user?.image ? (
              <img
                src={user.image}
                alt={`Foto de ${user.name}`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound
                size={30}
                aria-hidden="true"
                className="text-white"
              />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-orange-100">
              Bem-vindo ao seu espaço
            </p>

            <h2 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
              Olá, {firstName}!
            </h2>

            <p className="mt-1 text-sm text-orange-100">
              Que bom ter você por aqui.
            </p>
          </div>
        </div>

        <p className="mt-6 max-w-xl text-sm leading-relaxed text-orange-50">
          Acompanhe seus pedidos, consulte seu histórico de compras
          e encontre seus sabores favoritos no cardápio.
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

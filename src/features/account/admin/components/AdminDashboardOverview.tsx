import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ReceiptText,
  Wallet,
} from "lucide-react";

type AdminDashboardOverviewProps = {
  onViewOrders: () => void;
};

const stats = [
  {
    label: "Pedidos hoje",
    value: "0",
    icon: ReceiptText,
    cardClass: "border-orange-100 bg-orange-50/60",
    iconClass: "bg-orange-100 text-orange-700",
  },
  {
    label: "Em andamento",
    value: "0",
    icon: Clock3,
    cardClass: "border-amber-100 bg-amber-50/60",
    iconClass: "bg-amber-100 text-amber-700",
  },
  {
    label: "Concluídos",
    value: "0",
    icon: CheckCircle2,
    cardClass: "border-emerald-100 bg-emerald-50/60",
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Vendas concluídas",
    value: "R$ 0,00",
    icon: Wallet,
    cardClass: "border-sky-100 bg-sky-50/60",
    iconClass: "bg-sky-100 text-sky-700",
  },
];

export function AdminDashboardOverview({
  onViewOrders,
}: AdminDashboardOverviewProps) {
  const today = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-7">
      <section className="rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:p-8">
        <p className="text-sm font-semibold text-orange-100">
          Bem-vindo ao seu painel
        </p>

        <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
          Seu restaurante em um só lugar.
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-orange-50">
          Acompanhe os pedidos do dia e organize os produtos,
          categorias e clientes do seu restaurante.
        </p>

        <button
          type="button"
          onClick={onViewOrders}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-orange-800 transition hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Acessar pedidos
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>

      <section aria-labelledby="daily-summary-title">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="daily-summary-title"
            className="text-xl font-black text-stone-900"
          >
            Resumo do dia
          </h2>

          <p className="text-sm text-stone-500">{today}</p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(
            ({
              label,
              value,
              icon: Icon,
              cardClass,
              iconClass,
            }) => (
              <article
                key={label}
                className={`rounded-2xl border p-5 shadow-sm ${cardClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-600">
                    {label}
                  </p>

                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                </div>

                <p className="mt-5 text-2xl font-black text-stone-900">
                  {value}
                </p>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-black text-stone-900">
            Pedidos recentes
          </h2>

          <button
            type="button"
            onClick={onViewOrders}
            className="inline-flex items-center gap-1 text-sm font-bold text-orange-700 hover:text-orange-800"
          >
            Ver pedidos
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-10 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
            <ReceiptText size={24} aria-hidden="true" />
          </span>

          <p className="mt-4 font-semibold text-stone-700">
            Nenhum pedido para exibir
          </p>

          <p className="mt-2 text-sm text-stone-500">
            Os pedidos recebidos aparecerão nesta área.
          </p>
        </div>
      </section>
    </div>
  );
}
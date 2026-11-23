import { ArrowRight, ArrowUpRight, CircleUserRound, ReceiptText } from "lucide-react";
import { Link } from "react-router-dom";
import type { CustomerDashboardSection } from "./CustomerDashboardSidebar";

const shortcuts = [
  {
    section: "orders",
    title: "Meus pedidos",
    description: "Veja o status do seu pedido ou consulte compras anteriores.",
    icon: ReceiptText,
  },
  {
    section: "profile",
    title: "Meu perfil",
    description: "Atualize seus dados, telefone e endereço de entrega.",
    icon: CircleUserRound,
  },
] as const;

type CustomerDashboardOverviewProps = {
  firstName?: string;
  onSectionChange: (section: CustomerDashboardSection) => void;
};

export function CustomerDashboardOverview({ firstName, onSectionChange }: CustomerDashboardOverviewProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#302a22] px-5 py-6 text-[#fff9ed] sm:px-7 sm:py-8">
        <img src="/images/restaurante-salao.jpg" alt="" className="absolute inset-y-0 right-0 -z-20 h-full w-[64%] object-cover object-center" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-[#302a22] from-35% via-[#302a22]/90 via-55% to-[#302a22]/35" aria-hidden="true" />
        <h2 className="restaurant-display max-w-xl wrap-break-word text-3xl leading-tight tracking-tight sm:text-4xl">
          {firstName ? "Olá, " + firstName + "." : "Que bom ter você por aqui."}
        </h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-100">Escolha o que vai à mesa no seu próximo pedido.</p>
        <Link
          to="/cardapio"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#eadbc4] px-4 text-sm font-bold text-[#2d251c] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Explorar cardápio <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="customer-shortcuts-title">
        <h2 id="customer-shortcuts-title" className="mb-3 text-base font-bold text-stone-900">Acesso rápido</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {shortcuts.map(({ section, title, description, icon: Icon }) => (
            <button
              key={section}
              type="button"
              onClick={() => onSectionChange(section)}
              className="group flex min-w-0 items-center gap-3 rounded-2xl border border-stone-200 bg-[#fffcf7] p-4 text-left shadow-sm transition-colors hover:border-orange-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-800 sm:p-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f2e5d5] text-[#754223]">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-stone-900">{title}</span>
                <span className="mt-1 block text-sm leading-snug text-stone-600">{description}</span>
              </span>
              <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-[#754223] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

import {
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  ReceiptText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export type CustomerDashboardSection =
  | "overview"
  | "orders"
  | "profile";

type CustomerDashboardSidebarProps = {
  activeSection: CustomerDashboardSection;
  onSectionChange: (section: CustomerDashboardSection) => void;
};

const sections = [
  {
    id: "overview",
    label: "Visão geral",
    icon: LayoutDashboard,
  },
  {
    id: "orders",
    label: "Meus pedidos",
    icon: ReceiptText,
  },
  {
    id: "profile",
    label: "Meu perfil",
    icon: CircleUserRound,
  },
] as const;

export function CustomerDashboardSidebar({
  activeSection,
  onSectionChange,
}: CustomerDashboardSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-2 py-2 md:inset-y-0 md:left-0 md:right-auto md:flex md:w-64 md:flex-col md:border-r md:border-t-0 md:px-4 md:py-6">
      <div className="mb-9 hidden items-center justify-center md:flex">
        <img
          src="/images/logo-semfundo.png"
          alt="Espetinhos João Paulo"
          className="h-20 w-auto object-contain"
        />
      </div>

      <p className="mb-3 hidden px-3 text-xs font-bold uppercase tracking-[0.14em] text-stone-400 md:block">
        Minha conta
      </p>

      <nav
        aria-label="Menu da conta"
        className="flex justify-around gap-1 md:flex-col md:justify-start md:gap-2"
      >
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;

          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSectionChange(id)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors md:flex-row md:justify-start md:gap-3 md:px-3 md:py-3 md:text-sm ${
                isActive
                  ? "bg-orange-50 text-orange-800"
                  : "text-stone-600 hover:bg-stone-50 hover:text-orange-700"
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => navigate("/perfil")}
        className="mt-auto hidden w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 hover:text-orange-700 md:flex"
      >
        <LogOut size={19} aria-hidden="true" />
        Sair da conta
      </button>
    </aside>
  );
}
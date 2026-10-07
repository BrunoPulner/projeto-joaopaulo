import {
  LayoutDashboard,
  Package,
  Shapes,
  ReceiptText,
  UsersRound,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";

export type AdminDashboardSection =
  | "overview"
  | "products"
  | "categories"
  | "orders"
  | "customers";

type AdminDashboardSidebarProps = {
  activeSection: AdminDashboardSection;
  onSectionChange: (section: AdminDashboardSection) => void;
};

const sections = [
  {
    id: "overview",
    label: "Início",
    icon: LayoutDashboard,
  },
  {
    id: "products",
    label: "Produtos",
    icon: Package,
  },
  {
    id: "categories",
    label: "Categorias",
    icon: Shapes,
  },
  {
    id: "orders",
    label: "Pedidos",
    icon: ReceiptText,
  },
  {
    id: "customers",
    label: "Clientes",
    icon: UsersRound,
  },
] as const;

export function AdminDashboardSidebar({
  activeSection,
  onSectionChange,
}: AdminDashboardSidebarProps) {
  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-2 py-2 md:inset-y-0 md:left-0 md:right-auto md:flex md:w-64 md:flex-col md:border-r md:border-t-0 md:px-4 md:py-6">
      <Link
        to="/"
        aria-label="Espetinhos João Paulo — Início"
        className="mb-8 hidden justify-center md:flex"
      >
        <img
          src="/images/logo-semfundo.png"
          alt="Espetinhos João Paulo"
          className="h-20 w-auto object-contain"
        />
      </Link>

      <div className="mb-6 hidden rounded-xl bg-orange-50 px-3 py-3 md:block">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-800">
          Administração
        </p>
        <p className="mt-1 text-xs text-stone-600">
          Gerencie seu restaurante
        </p>
      </div>

      <nav
        aria-label="Menu da administração"
        className="flex gap-1 md:flex-col md:gap-2"
      >
        {sections.map(({ id, label, icon: Icon }) => {
          const selected = activeSection === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSectionChange(id)}
              aria-current={selected ? "page" : undefined}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-orange-700 sm:text-xs md:flex-row md:justify-start md:gap-3 md:px-3 md:py-3 md:text-sm ${
                selected
                  ? "bg-orange-700 text-white shadow-sm shadow-orange-700/20"
                  : "text-stone-600 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      <Link
        to="/perfil"
        className="mt-auto hidden min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-600 transition-colors hover:bg-red-50 hover:text-red-700 md:flex"
      >
        <LogOut size={19} aria-hidden="true" />
        Sair do painel
      </Link>
    </aside>
  );
}
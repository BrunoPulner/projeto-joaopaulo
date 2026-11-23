
import { useState } from "react";

import {
  LayoutDashboard,
  Package,
  Shapes,
  ReceiptText,
  UsersRound,
  LogOut,
  LoaderCircle,
  Truck,
  Tags,
  ChevronRight,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { signOut } from "../../../../lib/auth-client";

// ============================================
// TIPOS
// ============================================

export type AdminDashboardSection =
  | "overview"
  | "products"
  | "categories"
  | "promotions"
  | "orders"
  | "customers"
  | "delivery";

type AdminDashboardSidebarProps = {
  activeSection: AdminDashboardSection;
  onSectionChange: (
    section: AdminDashboardSection,
  ) => void;
};

// ============================================
// SEÇÕES DO DASHBOARD
// ============================================

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
    id: "promotions",
    label: "Promoções",
    icon: Tags,
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
  {
    id: "delivery",
    label: "Entregas e Fretes",
    icon: Truck,
  },
] as const satisfies ReadonlyArray<{
  id: AdminDashboardSection;
  label: string;
  icon: typeof LayoutDashboard;
}>;

// ============================================
// COMPONENTE
// ============================================

const sectionGroups = [
  { label: "Painel", items: sections.slice(0, 1) },
  { label: "Cardápio", items: sections.slice(1, 4) },
  { label: "Operação", items: sections.slice(4) },
];

export function AdminDashboardSidebar({
  activeSection,
  onSectionChange,
}: AdminDashboardSidebarProps) {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [logoutError, setLogoutError] =
    useState("");

  // ==========================================
  // ENCERRAR SESSÃO
  // ==========================================

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const result = await signOut();

      if (result.error) {
        setLogoutError(
          "Não foi possível encerrar sua sessão. Tente novamente.",
        );
        return;
      }

      // Sessão encerrada no Better Auth.
      // Redireciona para a página inicial.
      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Erro ao encerrar sessão administrativa:",
        error,
      );

      setLogoutError(
        "Erro de conexão ao sair do painel. Tente novamente.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (

    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-2 py-2 md:inset-y-0 md:left-0 md:right-auto md:flex md:w-60 md:flex-col md:border-0 md:bg-[#24241f] md:px-4 md:py-5 md:text-stone-100 lg:w-64">
      <Link
        to="/"
        aria-label="restaurante.com — Início"
        className="mb-5 hidden shrink-0 items-center rounded-xl border border-white/10 bg-white/5 px-3 py-3 focus-visible:outline-2 focus-visible:outline-amber-200 md:flex"
      >
        <img
          src="/images/restaurante-wordmark-light.svg"
          alt="restaurante.com"
          width={192}
          height={38}
          className="h-9 w-auto max-w-full object-contain"
        />
      </Link>

      <nav
        aria-label="Menu da administração"
        className="flex gap-1 overflow-x-auto md:min-h-0 md:flex-1 md:flex-col md:gap-4 md:overflow-x-hidden md:overflow-y-auto md:py-1"
      >
        {sectionGroups.map(({ label: group, items }) => (
          <div key={group} className="contents md:flex md:flex-col md:gap-1">
            <p className="hidden px-3 pb-1 text-xs font-semibold text-stone-400 md:block">{group}</p>
            {items.map(({ id, label, icon: Icon }) => {
              const selected = activeSection === id;

              return (
                <button
                  key={id}
                  type="button"
                  disabled={loggingOut}
                  onClick={() => onSectionChange(id)}
                  aria-current={selected ? "page" : undefined}
                  className={`flex min-h-12 min-w-17 shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-orange-700 disabled:opacity-50 sm:text-xs md:min-h-10 md:w-full md:min-w-0 md:flex-row md:justify-start md:gap-3 md:rounded-lg md:px-3 md:text-sm md:focus-visible:-outline-offset-2 md:focus-visible:outline-amber-200 ${
                    selected
                      ? "bg-orange-700 text-white shadow-sm shadow-orange-700/20 md:bg-[#eadbc4] md:text-[#2d251c] md:shadow-none"
                      : "text-stone-600 hover:bg-orange-50 hover:text-orange-700 md:text-stone-200 md:hover:bg-white/10 md:hover:text-white"
                  }`}
                >
                  <Icon size={20} aria-hidden="true" className="shrink-0 md:size-[18px]" />
                  <span className="max-w-full truncate">{label}</span>
                  {selected && <ChevronRight size={16} aria-hidden="true" className="ml-auto hidden shrink-0 md:block" />}
                </button>
              );
            })}
          </div>
        ))}

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          aria-label={loggingOut ? "Saindo do painel" : "Sair do painel"}
          className="flex min-h-12 min-w-17 shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs md:hidden"
        >
          {loggingOut ? (
            <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
          ) : (
            <LogOut size={20} aria-hidden="true" />
          )}
          <span className="max-w-full truncate">{loggingOut ? "Saindo..." : "Sair"}</span>
        </button>
      </nav>

      {/* LOGOUT DESKTOP */}

      <div className="mt-4 hidden shrink-0 border-t border-white/10 pt-3 md:block">
        <button
          type="button"
          onClick={() =>
            void handleLogout()
          }
          disabled={loggingOut}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loggingOut ? (
            <LoaderCircle
              size={19}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <LogOut
              size={19}
              aria-hidden="true"
            />
          )}

          {loggingOut
            ? "Saindo do painel..."
            : "Sair do painel"}
        </button>
      </div>

      {/* ERRO DE LOGOUT */}

      {logoutError && (
        <p
          role="alert"
          className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 shadow-md md:static md:mt-2 md:border-0 md:bg-red-950/40 md:px-3 md:text-red-200 md:shadow-none"
        >
          {logoutError}
        </p>
      )}
    </aside>
  );
}

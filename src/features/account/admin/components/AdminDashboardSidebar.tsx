
import { useState } from "react";

import {
  LayoutDashboard,
  Package,
  Shapes,
  ReceiptText,
  UsersRound,
  LogOut,
  LoaderCircle,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { signOut } from "../../../../lib/auth-client";

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
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-2 py-2 md:inset-y-0 md:left-0 md:right-auto md:flex md:w-64 md:flex-col md:border-r md:border-t-0 md:px-4 md:py-6">
      {/* LOGO */}

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

      {/* IDENTIFICAÇÃO ADMINISTRATIVA */}

      <div className="mb-6 hidden rounded-xl bg-orange-50 px-3 py-3 md:block">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-800">
          Administração
        </p>

        <p className="mt-1 text-xs text-stone-600">
          Gerencie seu restaurante
        </p>
      </div>

      {/* NAVEGAÇÃO */}

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
              disabled={loggingOut}
              onClick={() => onSectionChange(id)}
              aria-current={selected ? "page" : undefined}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-orange-700 disabled:opacity-50 sm:text-xs md:flex-row md:justify-start md:gap-3 md:px-3 md:py-3 md:text-sm ${
                selected
                  ? "bg-orange-700 text-white shadow-sm shadow-orange-700/20"
                  : "text-stone-600 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              <Icon size={20} aria-hidden="true" />

              <span className="max-w-full truncate">
                {label}
              </span>
            </button>
          );
        })}

        {/* LOGOUT MOBILE */}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label={
            loggingOut
              ? "Saindo do painel"
              : "Sair do painel"
          }
          className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs md:hidden"
        >
          {loggingOut ? (
            <LoaderCircle
              size={20}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <LogOut
              size={20}
              aria-hidden="true"
            />
          )}

          <span className="max-w-full truncate">
            {loggingOut ? "Saindo..." : "Sair"}
          </span>
        </button>
      </nav>

      {/* LOGOUT DESKTOP */}

      <div className="mt-auto hidden md:block">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 shadow-md md:static md:mt-2 md:border-0 md:bg-transparent md:px-3 md:shadow-none"
        >
          {logoutError}
        </p>
      )}
    </aside>
  );
}

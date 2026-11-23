
import { useState } from "react";
import {
  ChevronRight,
  CircleUserRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  ReceiptText,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { signOut } from "../../../lib/auth-client";

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

      // Sessão encerrada com sucesso no Better Auth.
      // Redireciona para a página inicial.
      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao sair da conta:", error);

      setLogoutError(
        "Erro de conexão ao encerrar a sessão. Tente novamente.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:inset-y-0 md:left-0 md:right-auto md:flex md:w-60 md:flex-col md:border-0 md:bg-[#24241f] md:px-4 md:py-5 lg:w-64">
      {/* LOGO */}

      <Link to="/" aria-label="restaurante.com — Início" className="mb-5 hidden items-center rounded-xl border border-white/10 bg-white/5 px-3 py-3 focus-visible:outline-2 focus-visible:outline-amber-200 md:flex">
        <img
          src="/images/restaurante-wordmark-light.svg"
          alt="restaurante.com"
          width={192}
          height={38}
          className="h-9 w-auto max-w-full object-contain"
        />
      </Link>

      {/* TÍTULO */}

      <p className="mb-2 hidden px-3 text-xs font-semibold text-stone-400 md:block">
        Minha conta
      </p>

      {/* NAVEGAÇÃO */}

      <nav
        aria-label="Menu da conta"
        className="flex justify-around gap-1 md:flex-col md:justify-start md:gap-1"
      >
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;

          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              disabled={loggingOut}
              onClick={() => onSectionChange(id)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-orange-800 disabled:opacity-50 md:flex-row md:justify-start md:gap-3 md:px-3 md:py-3 md:text-sm ${
                isActive
                  ? "bg-orange-50 text-orange-800 md:bg-[#eadbc4] md:text-[#2d251c]"
                  : "text-stone-600 hover:bg-stone-50 hover:text-orange-700 md:text-stone-200 md:hover:bg-white/10 md:hover:text-white"
              }`}
            >
              <Icon size={20} aria-hidden="true" />

              <span className="truncate">
                {label}
              </span>
              {isActive && <ChevronRight size={16} aria-hidden="true" className="ml-auto hidden shrink-0 md:block" />}
            </button>
          );
        })}

        {/* LOGOUT MOBILE */}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label={
            loggingOut ? "Saindo da conta" : "Sair da conta"
          }
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
        >
          {loggingOut ? (
            <LoaderCircle
              size={20}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <LogOut size={20} aria-hidden="true" />
          )}

          <span className="truncate">
            {loggingOut ? "Saindo..." : "Sair"}
          </span>
        </button>
      </nav>

      {/* LOGOUT DESKTOP */}

      <div className="mt-auto hidden border-t border-white/10 pt-3 md:block">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loggingOut ? (
            <LoaderCircle
              size={19}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <LogOut size={19} aria-hidden="true" />
          )}

          {loggingOut
            ? "Saindo da conta..."
            : "Sair da conta"}
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


import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, X } from "lucide-react";

import {
  CustomerDashboardSidebar,
  type CustomerDashboardSection,
} from "../components/CustomerDashboardSidebar";

import { CustomerDashboardOverview } from "../components/CustomerDashboardOverview";
import { CustomerDashboardOrders } from "../components/CustomerDashboardOrders";
import { CustomerDashboardProfile } from "../components/CustomerDashboardProfile";

const sectionTitles: Record<CustomerDashboardSection, string> = {
  overview: "Visão geral",
  orders: "Meus pedidos",
  profile: "Meu perfil",
};

export function CustomerDashboardPage() {
  const [activeSection, setActiveSection] =
    useState<CustomerDashboardSection>("overview");

  const location = useLocation();
  const navigate = useNavigate();

  // Identifica se o usuário acabou de concluir o login Google.
  const [showLoginSuccess, setShowLoginSuccess] = useState(
    () => location.state?.loginSuccess === true,
  );

  // Remove o estado da navegação para que a mensagem
  // não reapareça quando o usuário atualizar a página.
  useEffect(() => {
    if (!showLoginSuccess) return;

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [showLoginSuccess, navigate, location.pathname]);

  // Fecha a notificação automaticamente após 5 segundos.
  useEffect(() => {
    if (!showLoginSuccess) return;

    const timeout = window.setTimeout(() => {
      setShowLoginSuccess(false);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [showLoginSuccess]);

  return (
    <div className="min-h-screen bg-[#fffaf5]">
      {/* Notificação de login realizado */}
      {showLoginSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="
            fixed
            right-4
            top-5
            z-50

            flex
            w-[calc(100%-2rem)]
            max-w-sm
            items-start
            gap-3

            rounded-2xl
            border
            border-emerald-200
            bg-white

            px-4
            py-4

            shadow-xl
            shadow-black/10

            animate-in
            fade-in
            slide-in-from-top-3

            sm:right-6
            sm:top-6
            sm:px-5
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center

              rounded-xl
              bg-emerald-50
              text-emerald-600
            "
          >
            <CheckCircle2 size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-stone-900">
              Login realizado com sucesso!
            </p>

            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              Seja bem-vindo ao Espetinhos João Paulo.
              Sua conta está conectada.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLoginSuccess(false)}
            aria-label="Fechar notificação"
            className="
              rounded-lg
              p-1
              text-stone-400
              transition-colors

              hover:bg-stone-100
              hover:text-stone-700
            "
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Sidebar do cliente */}
      <CustomerDashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Conteúdo principal */}
      <main className="min-h-screen pb-24 md:ml-64 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-700">
                Área do cliente
              </p>

              <h1 className="mt-1 text-xl font-black text-stone-900">
                {sectionTitles[activeSection]}
              </h1>
            </div>

            <Link
              to="/"
              className="
                rounded-xl
                border
                border-stone-200
                px-4
                py-2.5
                text-sm
                font-semibold
                text-stone-700
                transition

                hover:border-orange-300
                hover:bg-orange-50
                hover:text-orange-700
              "
            >
              Voltar à loja
            </Link>
          </div>
        </header>

        {/* Seções do dashboard */}
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
          {activeSection === "overview" && (
            <CustomerDashboardOverview />
          )}

          {activeSection === "orders" && (
            <CustomerDashboardOrders />
          )}

          {activeSection === "profile" && (
            <CustomerDashboardProfile />
          )}
        </div>
      </main>
    </div>
  );
}

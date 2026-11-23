
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, X } from "lucide-react";

import {
  CustomerDashboardSidebar,
  type CustomerDashboardSection,
} from "../components/CustomerDashboardSidebar";

import { CustomerDashboardOverview } from "../components/CustomerDashboardOverview";
import { CustomerDashboardOrders } from "../components/CustomerDashboardOrders";
import { CustomerDashboardProfile } from "../components/CustomerDashboardProfile";
import { useSession } from "../../../lib/auth-client";

const sections = {
  overview: { title: "Visão geral", description: "Acesse seus pedidos e os dados da sua conta." },
  orders: { title: "Meus pedidos", description: "Acompanhe o andamento e consulte seu histórico." },
  profile: { title: "Meu perfil", description: "Gerencie seus dados, telefone e endereço de entrega." },
} satisfies Record<CustomerDashboardSection, { title: string; description: string }>;

export function CustomerDashboardPage() {
  const [activeSection, setActiveSection] =
    useState<CustomerDashboardSection>("overview");

  const { data: session } = useSession();
  const firstName = session?.user.name?.trim().split(/\s+/)[0];
  const section = sections[activeSection];
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

  function handleSectionChange(nextSection: CustomerDashboardSection) {
    if (nextSection === activeSection) return;
    setActiveSection(nextSection);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <div className="min-h-screen bg-[#f4f3ef]">
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
              Seja bem-vindo ao restaurante.com.
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
        onSectionChange={handleSectionChange}
      />

      <main className="min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:ml-60 md:pb-8 lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#fffcf7]/95 backdrop-blur">
          <div className="mx-auto flex min-h-15 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 xl:px-9">
            <p className="text-sm font-semibold text-stone-700">Minha conta</p>
            <Link
              to="/cardapio"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-800"
            >
              Ver cardápio <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 xl:px-9">
          <div className="mb-5 border-b border-stone-200 pb-4 sm:mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-[#25241f] sm:text-4xl">{section.title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{section.description}</p>
          </div>

          <div key={activeSection} className="customer-section-enter">
            {activeSection === "overview" && (
              <CustomerDashboardOverview firstName={firstName} onSectionChange={handleSectionChange} />
            )}
            {activeSection === "orders" && <CustomerDashboardOrders />}
            {activeSection === "profile" && <CustomerDashboardProfile />}
          </div>
        </div>
      </main>
    </div>
  );
}

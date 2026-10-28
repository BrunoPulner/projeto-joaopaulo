
import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

import {
  AdminDashboardSidebar,
  type AdminDashboardSection,
} from "../components/AdminDashboardSidebar";

import { AdminDashboardOverview } from "../components/AdminDashboardOverview";

import { AdminDashboardCategories } from "../components/AdminDashboardCategories";

import { AdminDashboardSectionPlaceholder } from "../components/AdminDashboardSectionPlaceholder";

import { AdminDashboardProducts } from "../components/AdminDashboardProducts";

// NOVO: configurações de entregas e fretes
import { AdminDeliverySettings } from "../../../admin/components/delivery/AdminDeliverySettings";

// ============================================
// TÍTULOS DAS SEÇÕES
// ============================================

const sectionTitles: Record<AdminDashboardSection, string> = {
  overview: "Visão geral",
  products: "Produtos",
  categories: "Categorias",
  orders: "Pedidos",
  customers: "Clientes",
  delivery: "Entregas e Fretes",
};

// ============================================
// DASHBOARD ADMINISTRATIVO
// ============================================

export function AdminDashboardPage() {
  const [activeSection, setActiveSection] =
    useState<AdminDashboardSection>("overview");

  // ============================================
  // CONTEÚDO DA SEÇÃO SELECIONADA
  // ============================================

  function renderActiveSection() {
    switch (activeSection) {
      case "overview":
        return (
          <AdminDashboardOverview
            onViewOrders={() => setActiveSection("orders")}
          />
        );

      case "products":
        return <AdminDashboardProducts />;

      case "categories":
        return <AdminDashboardCategories />;

      // NOVO: entregas e fretes
      case "delivery":
        return <AdminDeliverySettings />;

      case "orders":
      case "customers":
        return (
          <AdminDashboardSectionPlaceholder
            section={activeSection}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf5]">
      {/* SIDEBAR ADMINISTRATIVA */}

      <AdminDashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* CONTEÚDO PRINCIPAL */}

      <main className="min-h-screen pb-24 md:ml-64 md:pb-0">
        {/* HEADER */}

        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-5 md:px-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-700 sm:text-xs">
                Painel administrativo
              </p>

              <h1 className="mt-1 text-xl font-black text-stone-900">
                {sectionTitles[activeSection]}
              </h1>
            </div>

            {/* AÇÕES DO HEADER */}

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                aria-label="Voltar à loja"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              >
                <ExternalLink
                  size={17}
                  aria-hidden="true"
                />

                <span className="hidden sm:inline">
                  Ver loja
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* SEÇÃO ATIVA */}

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
}

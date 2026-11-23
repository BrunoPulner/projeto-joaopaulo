
import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

import {
  AdminDashboardSidebar,
  type AdminDashboardSection,
} from "../components/AdminDashboardSidebar";

import { AdminDashboardOverview } from "../components/AdminDashboardOverview";

import { AdminDashboardCategories } from "../components/AdminDashboardCategories";

import { AdminDashboardProducts } from "../components/AdminDashboardProducts";

import { AdminDashboardOrders } from "../components/AdminDashboardOrders";

import { AdminDashboardCustomers } from "../components/AdminDashboardCustomers";

// Promoções e ofertas
import { AdminDashboardPromotions } from "../components/AdminDashboardPromotions";

// Configurações de entregas e fretes
import { AdminDeliverySettings } from "../../../admin/components/delivery/AdminDeliverySettings";

// ============================================
// TÍTULOS DAS SEÇÕES
// ============================================

const sectionTitles: Record<AdminDashboardSection, string> = {
  overview: "Visão geral",
  products: "Produtos",
  categories: "Categorias",
  promotions: "Promoções e Ofertas",
  orders: "Pedidos",
  customers: "Clientes",

  delivery: "Entregas e fretes",
};

const sectionDescriptions: Record<AdminDashboardSection, string> = {
  overview: "Acompanhe a operação do restaurante.",
  products: "Cadastre produtos e gerencie preços, ingredientes e adicionais.",
  categories: "Organize os grupos que aparecem no cardápio.",
  promotions: "Crie e acompanhe as ofertas de produtos e pizzas.",
  orders: "Acompanhe os pedidos e atualize o atendimento.",
  customers: "Consulte cadastros e gerencie permissões de compra.",
  delivery: "Configure áreas atendidas, taxas e condições de entrega.",
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
      // VISÃO GERAL
      case "overview":
        return (
          <AdminDashboardOverview
            onViewOrders={() =>
              setActiveSection("orders")
            }
          />
        );

      // PRODUTOS
      case "products":
        return <AdminDashboardProducts />;

      // CATEGORIAS
      case "categories":
        return <AdminDashboardCategories />;

      // PROMOÇÕES E OFERTAS
      case "promotions":
        return <AdminDashboardPromotions />;

      // PEDIDOS
      case "orders":
        return <AdminDashboardOrders />;

      // CLIENTES
      case "customers":
        return <AdminDashboardCustomers />;

      // ENTREGAS E FRETES
      case "delivery":
        return <AdminDeliverySettings />;

      default:
        return null;
    }
  }

  return (

    <div className="min-h-screen bg-[#f4f3ef]">
      <AdminDashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="min-w-0 pb-24 md:ml-60 md:pb-0 lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-14 max-w-[100rem] items-center justify-between gap-3 px-4 sm:px-6 xl:px-10">
            <p className="text-sm font-semibold text-stone-600">Painel administrativo</p>
            <Link
              to="/"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-700"
            >
              Ver loja
              <ExternalLink size={15} aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[100rem] px-4 py-5 sm:px-6 sm:py-7 xl:px-10">
          <div className="mb-5 border-b border-stone-200 pb-4 sm:mb-7 sm:pb-5">
            <h1 className="text-3xl font-bold tracking-tight text-[#25241f] sm:text-4xl">
              {sectionTitles[activeSection]}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-stone-600">
              {sectionDescriptions[activeSection]}
            </p>
          </div>
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
}

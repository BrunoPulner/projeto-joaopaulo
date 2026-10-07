import { useState } from "react";
import { Link } from "react-router-dom";

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

  return (
    <div className="min-h-screen bg-[#fffaf5]">
      <CustomerDashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="min-h-screen pb-24 md:ml-64 md:pb-0">
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
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            >
              Voltar à loja
            </Link>
          </div>
        </header>

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
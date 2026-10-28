
import {
  Package,
  ReceiptText,
  Shapes,
  Truck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { AdminDashboardSection } from "./AdminDashboardSidebar";

// ============================================
// TIPOS
// ============================================

type Section = Exclude<
  AdminDashboardSection,
  "overview"
>;

type AdminDashboardSectionPlaceholderProps = {
  section: Section;
};

type SectionDetails = {
  title: string;
  description: string;
  emptyMessage: string;
  icon: LucideIcon;
};

// ============================================
// CONFIGURAÇÕES DAS SEÇÕES
// ============================================

const sectionDetails: Record<Section, SectionDetails> = {
  products: {
    title: "Produtos do restaurante",
    description:
      "Cadastre e organize os produtos que serão exibidos no cardápio.",
    emptyMessage:
      "Nenhum produto para exibir nesta área.",
    icon: Package,
  },

  categories: {
    title: "Categorias do cardápio",
    description:
      "Organize as categorias e consulte os produtos de cada uma.",
    emptyMessage:
      "As categorias serão exibidas nesta área.",
    icon: Shapes,
  },

  orders: {
    title: "Pedidos recebidos",
    description:
      "Acompanhe os pedidos e atualize a situação de cada um.",
    emptyMessage:
      "Nenhum pedido para exibir nesta área.",
    icon: ReceiptText,
  },

  customers: {
    title: "Clientes cadastrados",
    description:
      "Consulte os clientes e as informações cadastradas no sistema.",
    emptyMessage:
      "Nenhum cliente para exibir nesta área.",
    icon: UsersRound,
  },

  // ==========================================
  // ENTREGAS E FRETES
  // ==========================================

  delivery: {
    title: "Entregas e fretes",
    description:
      "Configure as áreas de atendimento, taxas de entrega e disponibilidade do serviço.",
    emptyMessage:
      "As configurações de entrega serão exibidas nesta área.",
    icon: Truck,
  },
};

// ============================================
// COMPONENTE
// ============================================

export function AdminDashboardSectionPlaceholder({
  section,
}: AdminDashboardSectionPlaceholderProps) {
  const {
    title,
    description,
    emptyMessage,
    icon: Icon,
  } = sectionDetails[section];

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA SEÇÃO */}
      <section className="rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:p-8">
        <h2 className="text-2xl font-black sm:text-3xl">
          {title}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-orange-50">
          {description}
        </p>
      </section>

      {/* CONTEÚDO DA SEÇÃO */}
      <section className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
          <Icon size={27} aria-hidden="true" />
        </span>

        <p className="mt-5 font-semibold text-stone-700">
          {emptyMessage}
        </p>
      </section>
    </div>
  );
}

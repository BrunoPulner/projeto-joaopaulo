
import {
  FolderOpen,
  Plus,
  SearchX,
} from "lucide-react";

import type {
  AdminCategory,
} from "../../api/categories.api";

import { CategoryCard } from "./CategoryCard";

// ============================================
// TIPOS
// ============================================

interface CategoriesGridProps {
  categories: AdminCategory[];

  loading?: boolean;
  disabled?: boolean;

  processingId?: number | null;

  search?: string;

  onEdit: (category: AdminCategory) => void;

  onDeactivate: (category: AdminCategory) => void;

  onReactivate: (category: AdminCategory) => void;

  onCreate?: () => void;
}

// ============================================
// SKELETON
// ============================================

function CategoryCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="flex items-center gap-3 p-4">
        <div className="size-11 shrink-0 rounded-xl bg-stone-100" />

        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded bg-stone-100" />

          <div className="h-3 w-16 rounded bg-stone-100" />
        </div>

        <div className="flex gap-2">
          <div className="size-9 rounded-lg bg-stone-100" />

          <div className="size-9 rounded-lg bg-stone-100" />
        </div>
      </div>

      <div className="space-y-2 px-4 pb-4">
        <div className="h-3 w-full rounded bg-stone-100" />

        <div className="h-3 w-3/4 rounded bg-stone-100" />
      </div>

      <div className="border-t border-stone-100 p-3">
        <div className="h-10 rounded-xl bg-stone-100" />
      </div>
    </div>
  );
}

// ============================================
// ESTADO VAZIO
// ============================================

interface EmptyStateProps {
  hasSearch: boolean;
  onCreate?: () => void;
}

function CategoriesEmptyState({
  hasSearch,
  onCreate,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
        {hasSearch ? (
          <SearchX size={30} />
        ) : (
          <FolderOpen size={30} />
        )}
      </div>

      <h3 className="mt-5 text-lg font-black text-stone-900">
        {hasSearch
          ? "Nenhuma categoria encontrada"
          : "Nenhuma categoria cadastrada"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
        {hasSearch
          ? "Não encontramos categorias correspondentes à sua pesquisa. Tente buscar por outro nome."
          : "Comece cadastrando uma categoria para organizar os produtos do restaurante."}
      </p>

      {!hasSearch && onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white transition hover:bg-orange-800"
        >
          <Plus size={17} />
          Nova categoria
        </button>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CategoriesGrid({
  categories,
  loading = false,
  disabled = false,
  processingId = null,
  search = "",
  onEdit,
  onDeactivate,
  onReactivate,
  onCreate,
}: CategoriesGridProps) {
  // ==========================================
  // CARREGAMENTO
  // ==========================================

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Carregando categorias"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <CategoryCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // ==========================================
  // ESTADO VAZIO
  // ==========================================

  if (categories.length === 0) {
    return (
      <CategoriesEmptyState
        hasSearch={search.trim().length > 0}
        onCreate={disabled ? undefined : onCreate}
      />
    );
  }

  // ==========================================
  // GRID DE CATEGORIAS
  // ==========================================

  return (
    <div
      aria-label="Categorias cadastradas"
      className="
        grid
        grid-cols-1
        items-start
        gap-4

        md:grid-cols-2
        xl:grid-cols-3
      "
    >
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          processing={processingId === category.id}
          disabled={disabled}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
          onReactivate={onReactivate}
        />
      ))}
    </div>
  );
}

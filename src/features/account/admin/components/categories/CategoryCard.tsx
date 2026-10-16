
import { useState } from "react";

import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Shapes,
  Trash2,
} from "lucide-react";

import type {
  AdminCategory,
} from "../../api/categories.api";

import {
  AdminSubcategories,
} from "../AdminSubcategories";

// ============================================
// PROPRIEDADES
// ============================================

interface CategoryCardProps {
  category: AdminCategory;

  processing?: boolean;
  disabled?: boolean;

  onEdit: (category: AdminCategory) => void;
  onDeactivate: (category: AdminCategory) => void;
  onReactivate: (category: AdminCategory) => void;
}

// ============================================
// COMPONENTE
// ============================================

export function CategoryCard({
  category,
  processing = false,
  disabled = false,
  onEdit,
  onDeactivate,
  onReactivate,
}: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isDisabled = disabled || processing;

  return (
    <article
      className={`
        flex min-w-0 flex-col overflow-hidden
        rounded-2xl border bg-white
        shadow-sm transition-all duration-300

        ${
          expanded
            ? "border-orange-300 shadow-orange-900/10"
            : "border-stone-200 hover:border-orange-200 hover:shadow-md"
        }
      `}
    >
      {/* CABEÇALHO */}

      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
            <Shapes size={21} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-stone-900">
              {category.name}
            </h3>

            <p
              className={`mt-1 text-xs font-bold ${
                category.isActive
                  ? "text-emerald-700"
                  : "text-stone-400"
              }`}
            >
              {category.isActive
                ? "● Ativa"
                : "● Desativada"}
            </p>
          </div>
        </div>

        {/* AÇÕES */}

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(category)}
            disabled={isDisabled}
            aria-label={`Editar ${category.name}`}
            title="Editar categoria"
            className="flex size-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50"
          >
            <Pencil size={16} />
          </button>

          {category.isActive ? (
            <button
              type="button"
              onClick={() => onDeactivate(category)}
              disabled={isDisabled}
              aria-label={`Desativar ${category.name}`}
              title="Desativar categoria"
              className="flex size-9 items-center justify-center rounded-lg border border-red-100 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              {processing ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReactivate(category)}
              disabled={isDisabled}
              aria-label={`Reativar ${category.name}`}
              title="Reativar categoria"
              className="flex size-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
            >
              {processing ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <RotateCcw size={16} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* DESCRIÇÃO */}

      <div className="flex-1 px-4 pb-4">
        <p className="text-xs leading-relaxed text-stone-500">
          Gerencie as subcategorias e organize
          os produtos desta categoria.
        </p>
      </div>

      {/* BOTÃO EXPANDIR */}

      <div className="border-t border-stone-100 p-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className={`
            flex min-h-10 w-full items-center
            justify-between gap-2 rounded-xl
            px-3 text-xs font-bold transition

            ${
              expanded
                ? "bg-orange-50 text-orange-800"
                : "bg-stone-50 text-stone-600 hover:bg-orange-50 hover:text-orange-800"
            }
          `}
        >
          <span>
            {expanded
              ? "Recolher subcategorias"
              : "Gerenciar subcategorias"}
          </span>

          {expanded ? (
            <ChevronUp size={17} />
          ) : (
            <ChevronDown size={17} />
          )}
        </button>
      </div>

      {/* SUBCATEGORIAS */}

      {expanded && (
        <div className="border-t border-orange-100 bg-orange-50/30">
          <AdminSubcategories
            categoryId={category.id}
            categoryName={category.name}
          />
        </div>
      )}
    </article>
  );
}

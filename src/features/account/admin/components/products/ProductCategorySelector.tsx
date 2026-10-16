
import { useMemo } from "react";

import {
  ArrowUpRight,
  Beer,
  Check,
  CircleHelp,
  Flame,
  Hamburger,
  Pizza,
  PlusCircle,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import type { AdminCategory } from "../../api/products.api";

// ============================================
// PROPRIEDADES
// ============================================

interface ProductCategorySelectorProps {
  categories: AdminCategory[];

  selectedCategoryId: number | null;

  onSelect: (category: AdminCategory) => void;

  // Nova aba administrativa de adicionais
  onSelectAddons?: () => void;

  // Indica se a aba Adicionais está selecionada
  addonsSelected?: boolean;

  disabled?: boolean;
}

// ============================================
// APARÊNCIA DAS CATEGORIAS
// ============================================

interface CategoryAppearance {
  icon: LucideIcon;
  description: string;
  iconColor: string;
  iconBackground: string;
  selectedBorder: string;
  selectedBackground: string;
  hoverBorder: string;
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-");
}

function getCategoryAppearance(
  category: AdminCategory,
): CategoryAppearance {
  const slug = normalizeSlug(category.slug);
  const name = normalizeSlug(category.name);

  const matches = (...values: string[]) =>
    values.includes(slug) || values.includes(name);

  if (matches("pizza", "pizzas")) {
    return {
      icon: Pizza,
      description: "Sabores e acréscimos",
      iconColor: "text-orange-600",
      iconBackground: "bg-orange-100",
      selectedBorder: "border-orange-400",
      selectedBackground: "bg-orange-50",
      hoverBorder: "hover:border-orange-300",
    };
  }

  if (matches("lanche", "lanches")) {
    return {
      icon: Hamburger,
      description: "Lanches e adicionais",
      iconColor: "text-amber-700",
      iconBackground: "bg-amber-100",
      selectedBorder: "border-amber-400",
      selectedBackground: "bg-amber-50",
      hoverBorder: "hover:border-amber-300",
    };
  }

  if (matches("pastel", "pasteis")) {
    return {
      icon: UtensilsCrossed,
      description: "Recheios e adicionais",
      iconColor: "text-violet-600",
      iconBackground: "bg-violet-100",
      selectedBorder: "border-violet-400",
      selectedBackground: "bg-violet-50",
      hoverBorder: "hover:border-violet-300",
    };
  }

  if (matches("crepe", "crepes")) {
    return {
      icon: UtensilsCrossed,
      description: "Crepes e adicionais",
      iconColor: "text-pink-600",
      iconBackground: "bg-pink-100",
      selectedBorder: "border-pink-400",
      selectedBackground: "bg-pink-50",
      hoverBorder: "hover:border-pink-300",
    };
  }

  if (matches("espetinho", "espetinhos")) {
    return {
      icon: Flame,
      description: "Espetinhos e porções",
      iconColor: "text-rose-600",
      iconBackground: "bg-rose-100",
      selectedBorder: "border-rose-400",
      selectedBackground: "bg-rose-50",
      hoverBorder: "hover:border-rose-300",
    };
  }

  if (matches("bebida", "bebidas")) {
    return {
      icon: Beer,
      description: "Bebidas e refrigerantes",
      iconColor: "text-sky-600",
      iconBackground: "bg-sky-100",
      selectedBorder: "border-sky-400",
      selectedBackground: "bg-sky-50",
      hoverBorder: "hover:border-sky-300",
    };
  }

  return {
    icon: CircleHelp,
    description: "Cadastro de produto",
    iconColor: "text-slate-600",
    iconBackground: "bg-slate-100",
    selectedBorder: "border-slate-400",
    selectedBackground: "bg-slate-50",
    hoverBorder: "hover:border-slate-300",
  };
}

// ============================================
// APARÊNCIA DA ABA ADICIONAIS
// ============================================

const addonsAppearance: CategoryAppearance = {
  icon: PlusCircle,
  description: "Gerenciar adicionais",
  iconColor: "text-emerald-600",
  iconBackground: "bg-emerald-100",
  selectedBorder: "border-emerald-400",
  selectedBackground: "bg-emerald-50",
  hoverBorder: "hover:border-emerald-300",
};

// ============================================
// COMPONENTE
// ============================================

export function ProductCategorySelector({
  categories,
  selectedCategoryId,
  onSelect,
  onSelectAddons,
  addonsSelected = false,
  disabled = false,
}: ProductCategorySelectorProps) {
  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories],
  );

  const hasAddonsTab = Boolean(onSelectAddons);

  const hasOptions =
    activeCategories.length > 0 || hasAddonsTab;

  if (!hasOptions) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
        <CircleHelp
          size={28}
          className="mx-auto mb-2 text-amber-600"
        />

        <h3 className="font-bold text-slate-900">
          Nenhuma categoria disponível
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Cadastre uma categoria ativa para continuar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* CABEÇALHO */}

      <div>
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">
          O que deseja gerenciar?
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Selecione uma categoria para cadastrar produtos
          ou gerencie os adicionais disponíveis.
        </p>
      </div>

      {/* CATEGORIAS E ADICIONAIS */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {activeCategories.map((category) => {
          const appearance =
            getCategoryAppearance(category);

          const Icon = appearance.icon;

          const selected =
            !addonsSelected &&
            selectedCategoryId === category.id;

          return (
            <button
              key={category.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(category)}
              aria-pressed={selected}
              className={[
                "group relative flex min-h-29",
                "flex-col items-start justify-between",
                "rounded-2xl border p-3.5 text-left",
                "transition-all duration-200",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-sky-500",
                "focus-visible:ring-offset-2",

                selected
                  ? [
                      appearance.selectedBorder,
                      appearance.selectedBackground,
                      "shadow-sm",
                    ].join(" ")
                  : [
                      "border-slate-200 bg-white",
                      appearance.hoverBorder,
                      "hover:-translate-y-0.5",
                      "hover:shadow-md",
                    ].join(" "),

                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer",
              ].join(" ")}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div
                  className={[
                    "flex size-10 shrink-0",
                    "items-center justify-center",
                    "rounded-xl",
                    appearance.iconBackground,
                    appearance.iconColor,
                  ].join(" ")}
                >
                  <Icon
                    size={22}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                </div>

                {selected ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-slate-800 text-white">
                    <Check size={14} />
                  </span>
                ) : (
                  <ArrowUpRight
                    size={17}
                    className="text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="mt-3 w-full">
                <h4 className="text-sm font-bold text-slate-900 sm:text-[15px]">
                  {category.name}
                </h4>

                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {appearance.description}
                </p>
              </div>
            </button>
          );
        })}

        {/* ABA ADMINISTRATIVA DE ADICIONAIS */}

        {onSelectAddons && (
          <button
            type="button"
            disabled={disabled}
            onClick={onSelectAddons}
            aria-pressed={addonsSelected}
            className={[
              "group relative flex min-h-29",
              "flex-col items-start justify-between",
              "rounded-2xl border p-3.5 text-left",
              "transition-all duration-200",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-emerald-500",
              "focus-visible:ring-offset-2",

              addonsSelected
                ? [
                    addonsAppearance.selectedBorder,
                    addonsAppearance.selectedBackground,
                    "shadow-sm",
                  ].join(" ")
                : [
                    "border-slate-200 bg-white",
                    addonsAppearance.hoverBorder,
                    "hover:-translate-y-0.5",
                    "hover:shadow-md",
                  ].join(" "),

              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer",
            ].join(" ")}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <div
                className={[
                  "flex size-10 shrink-0",
                  "items-center justify-center",
                  "rounded-xl",
                  addonsAppearance.iconBackground,
                  addonsAppearance.iconColor,
                ].join(" ")}
              >
                <PlusCircle
                  size={22}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
              </div>

              {addonsSelected ? (
                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check size={14} />
                </span>
              ) : (
                <ArrowUpRight
                  size={17}
                  className="text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-600"
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="mt-3 w-full">
              <h4 className="text-sm font-bold text-slate-900 sm:text-[15px]">
                Adicionais
              </h4>

              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {addonsAppearance.description}
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

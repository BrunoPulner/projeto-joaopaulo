
import { useState } from "react";

import {
  Beer,
  Flame,
  Hamburger,
  Pizza,
  Star,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { CatalogCategory } from "../types/catalog.types";

import { resolveCatalogImageUrl } from "../api/catalog.api";

// ============================================
// TIPOS
// ============================================

export type CatalogCategorySelection =
  | number
  | "promotions";

type CategoryTabsProps = {
  categories: CatalogCategory[];
  selectedCategory: CatalogCategorySelection | null;
  onSelect: (categoryId: CatalogCategorySelection) => void;
};

// ============================================
// ÍCONES E IMAGENS ALTERNATIVAS
// ============================================

const categoryImages: Record<string, string> = {
  espetinhos: "/icons/espetin.png",
  espetinho: "/icons/espetin.png",
  pasteis: "/icons/pastel.png",
  pastel: "/icons/pastel.png",
};

const categoryIcons: Record<string, LucideIcon> = {
  pizzas: Pizza,
  pizza: Pizza,
  bebidas: Beer,
  bebida: Beer,
};

function normalizeSlug(slug?: string | null) {
  return (slug ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// ============================================
// IMAGEM OU ÍCONE
// ============================================

type CategoryIconProps = {
  category: CatalogCategory;
};

function CategoryIcon({ category }: CategoryIconProps) {
  const slug = normalizeSlug(
    category.slug ?? String(category.id),
  );

  const isBurgerCategory = ["lanche", "lanches"].includes(slug) ||
    ["lanche", "lanches"].includes(normalizeSlug(category.name));
  const uploadedImage = isBurgerCategory ? null : resolveCatalogImageUrl(category.imageUrl);

  const fallbackImage = categoryImages[slug];

  const Icon = isBurgerCategory ? Hamburger : categoryIcons[slug] ?? Flame;

  const [failedImage, setFailedImage] = useState<
    string | null
  >(null);

  const image =
    uploadedImage && failedImage !== uploadedImage
      ? uploadedImage
      : fallbackImage ?? null;

  return (
    <span
      aria-hidden="true"
      className="
        flex
        size-5
        shrink-0
        items-center
        justify-center
        transition-colors
        duration-300
        motion-reduce:transition-none
      "
    >
      {image ? (
        <span
          className="
            block
            size-full
            bg-current
          "
          style={{
            maskImage: `url("${image}")`,
            WebkitMaskImage: `url("${image}")`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskMode: "alpha",
          }}
        >
          {uploadedImage &&
            image === uploadedImage && (
              <img
                src={uploadedImage}
                alt=""
                className="sr-only"
                onError={() =>
                  setFailedImage(uploadedImage)
                }
              />
            )}
        </span>
      ) : (
        <Icon
          size={21}
          strokeWidth={1.7}
          className="block"
        />
      )}
    </span>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelect,
}: CategoryTabsProps) {
  const items = [
    { id: "promotions" as const, label: "Promoções", icon: <Star size={21} aria-hidden="true" /> },
    ...categories.map((category) => ({
      id: category.id,
      label: category.name,
      icon: <CategoryIcon category={category} />,
    })),
  ];

  return (
    <div
      role="group"
      aria-label="Categorias do cardápio"
      className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(6rem,100%),1fr))] gap-2 sm:mt-4 sm:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] sm:gap-2.5"
    >
      {items.map(({ id, label, icon }, index) => {
        const selected = selectedCategory === id;

        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(id)}
            style={{ animationDelay: `${Math.min(index, 8) * 38}ms` }}
            className={`category-tab-enter flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-xs font-bold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-800 motion-reduce:transition-none sm:min-h-13 sm:gap-2 sm:text-sm ${
              selected ? "border-orange-800 bg-orange-800 text-white" : "border-stone-200 bg-white text-stone-800 hover:border-orange-300 hover:bg-orange-50"
            }`}
          >
            <span aria-hidden="true" className={selected ? "shrink-0 text-white" : "shrink-0 text-orange-800"}>{icon}</span>
            <span className="min-w-0 break-words leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

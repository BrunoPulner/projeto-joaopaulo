import {
  Beer,
  Flame,
  Hamburger,
  Pizza,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { Category } from "../catalogData";

type CategoryTabsProps = {
  categories: Category[];
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
};

const categoryImages: Record<string, string> = {
  espetinhos: "/icons/espetin.png",
  pasteis: "/icons/pastel.png",
};

const categoryIcons: Record<string, LucideIcon> = {
  lanches: Hamburger,
  pizzas: Pizza,
  bebidas: Beer,
};

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div
      role="group"
      aria-label="Categorias do cardápio"
      className="
        category-tabs-enter

        mx-auto
        flex
        w-full
        min-w-0
        max-w-4xl
        flex-wrap
        justify-center

        gap-2

        sm:gap-3
      "
    >
      {categories.map((category, index) => {
        const selected =
          selectedCategory === category.id;

        const image =
          categoryImages[category.id];

        const Icon =
          categoryIcons[category.id] ?? Flame;

        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onSelect(category.id)
            }
            style={{
              animationDelay: `${100 + index * 70}ms`,
            }}
            className={`
              category-tab-enter

              flex
              min-h-20

              w-[calc((100%-1rem)/3)]
              min-w-0

              flex-col
              items-center
              justify-center
              gap-2

              rounded-2xl
              border

              px-2
              py-3

              text-xs
              font-bold

              transition
              duration-300

              focus-visible:outline-2
              focus-visible:outline-offset-4
              focus-visible:outline-orange-700

              motion-reduce:transform-none
              motion-reduce:transition-none

              sm:min-h-24
              sm:w-28
              sm:text-sm

              md:w-32

              ${
                selected
                  ? `
                      border-orange-700
                      bg-orange-700
                      text-white
                      shadow-md
                      shadow-orange-700/20
                    `
                  : `
                      border-stone-200
                      bg-white
                      text-stone-700
                      shadow-sm

                      hover:-translate-y-0.5
                      hover:border-orange-300
                      hover:bg-orange-50
                      hover:text-orange-700
                    `
              }
            `}
          >
            <span
              aria-hidden="true"
              className={`
                flex
                size-7
                shrink-0
                items-center
                justify-center

                transition-colors
                duration-300

                motion-reduce:transition-none

                ${
                  selected
                    ? "text-white"
                    : "text-orange-700"
                }
              `}
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
                    WebkitMaskPosition:
                      "center",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat:
                      "no-repeat",
                    maskMode: "alpha",
                  }}
                />
              ) : (
                <Icon
                  size={28}
                  strokeWidth={1.7}
                  className="block"
                />
              )}
            </span>

            <span
              className="
                max-w-full
                truncate
                leading-5
              "
            >
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
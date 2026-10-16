
import {
  Pizza,
  Ruler,
  ListPlus,
} from "lucide-react";

export type PizzaManagerTab =
  | "sizes"
  | "flavors"
  | "addons";

interface PizzaManagerTabsProps {
  activeTab: PizzaManagerTab;
  onTabChange: (tab: PizzaManagerTab) => void;
  disabled?: boolean;
}

const tabs = [
  {
    id: "sizes",
    label: "Tamanhos",
    description: "Preços e dimensões",
    icon: Ruler,
  },
  {
    id: "flavors",
    label: "Sabores",
    description: "Doces e salgados",
    icon: Pizza,
  },
  {
    id: "addons",
    label: "Adicionais",
    description: "Vincular adicionais",
    icon: ListPlus,
  },
] as const;

export function PizzaManagerTabs({
  activeTab,
  onTabChange,
  disabled = false,
}: PizzaManagerTabsProps) {
  return (
    <nav
      aria-label="Gerenciamento de pizzas"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={disabled}
            onClick={() => onTabChange(tab.id)}
            aria-current={selected ? "page" : undefined}
            className={`
              group flex items-center gap-3
              rounded-2xl border p-4
              text-left transition-all duration-200
              disabled:cursor-not-allowed
              disabled:opacity-50
              ${
                selected
                  ? "border-orange-500 bg-orange-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
              }
            `}
          >
            <div
              className={`
                flex size-11 shrink-0 items-center
                justify-center rounded-xl transition
                ${
                  selected
                    ? "bg-orange-600 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-700"
                }
              `}
            >
              <Icon size={21} />
            </div>

            <div className="min-w-0">
              <p
                className={`
                  text-sm font-bold
                  ${
                    selected
                      ? "text-orange-900"
                      : "text-slate-800"
                  }
                `}
              >
                {tab.label}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {tab.description}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

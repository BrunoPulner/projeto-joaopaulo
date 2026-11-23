import { Check } from "lucide-react";

const steps = [
  { id: "size", label: "Tamanho" },
  { id: "flavors", label: "Sabores" },
  { id: "addons", label: "Adicionais" },
  { id: "review", label: "Revisão" },
] as const;

export type PizzaStep = (typeof steps)[number]["id"];

export function PizzaOrderProgress({ step, className }: { step: PizzaStep; className?: string }) {
  const currentIndex = steps.findIndex(({ id }) => id === step);

  return (
    <ol
      aria-label="Etapas da montagem"
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold sm:gap-x-4 ${className ?? ""}`}
    >
      {steps.map(({ id, label }, index) => {
        const current = step === id;
        const completed = index < currentIndex;

        return (
          <li key={id} aria-current={current ? "step" : undefined} className={`flex items-center gap-1.5 ${current ? "text-orange-800" : "text-stone-600"}`}>
            <span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-full border ${current ? "border-orange-800 bg-orange-800 text-white" : "border-stone-300"}`}>
              {completed ? <Check size={12} /> : index + 1}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

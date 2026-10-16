
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import type {
  AdminCategory,
  AdminSubcategory,
} from "../../api/products.api";

import {
  adminAddonsApi,
} from "../../api/addons.api";

import type {
  CommonProductFormValues,
} from "./ProductForm";

import {
  PizzaManagerLayout,
} from "./pizza/PizzaManagerLayout";

import {
  PizzaManagerTabs,
  type PizzaManagerTab,
} from "./pizza/PizzaManagerTabs";

import {
  PizzaSizesManager,
} from "./pizza/PizzaSizesManager";

import {
  PizzaFlavorsManager,
} from "./pizza/PizzaFlavorsManager";

import {
  PizzaAddonLinksManager,
  type PizzaAvailableAddon,
} from "./pizza/PizzaAddonLinksManager";

// ============================================
// PROPRIEDADES
// ============================================

interface PizzaProductFormProps {
  category: AdminCategory;
  subcategories: AdminSubcategory[];

  // Compatibilidade com o dashboard atual.
  values?: CommonProductFormValues;

  onChange?: (
    values: CommonProductFormValues,
  ) => void;

  onSubmit?: () => void | Promise<void>;

  onCancel: () => void;

  onImageChange?: (
    file: File | null,
  ) => void;

  selectedImage?: File | null;
  previewUrl?: string | null;

  saving?: boolean;
  editing?: boolean;
  error?: string;
}

// ============================================
// COMPONENTE
// ============================================

export function PizzaProductForm({
  category,
  subcategories,
  onCancel,
  saving = false,
  error,
}: PizzaProductFormProps) {
  const [activeTab, setActiveTab] =
    useState<PizzaManagerTab>("sizes");

  // ==========================================
  // ADICIONAIS
  // ==========================================

  const [availableAddons, setAvailableAddons] =
    useState<PizzaAvailableAddon[]>([]);

  const [loadingAddons, setLoadingAddons] =
    useState(true);

  const [addonsError, setAddonsError] =
    useState("");

  // ==========================================
  // CARREGAR ADICIONAIS
  // ==========================================

  const loadAddons = useCallback(async () => {
    setLoadingAddons(true);
    setAddonsError("");

    try {
      const addons = await adminAddonsApi.list();

      setAvailableAddons(
        addons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          description: addon.description,
          imageUrl: addon.imageUrl,
          priceCents: addon.priceCents,
          isActive: addon.isActive,
        })),
      );
    } catch (err) {
      setAddonsError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os adicionais.",
      );
    } finally {
      setLoadingAddons(false);
    }
  }, []);

  // ==========================================
  // CARREGAMENTO INICIAL
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const addons = await adminAddonsApi.list();

        if (cancelled) return;

        setAvailableAddons(
          addons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            description: addon.description,
            imageUrl: addon.imageUrl,
            priceCents: addon.priceCents,
            isActive: addon.isActive,
          })),
        );

        setAddonsError("");
      } catch (err) {
        if (cancelled) return;

        setAddonsError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os adicionais.",
        );
      } finally {
        if (!cancelled) {
          setLoadingAddons(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // SUBCATEGORIAS DE PIZZA
  // ==========================================

  const pizzaSubcategories = useMemo(() => {
    return subcategories.filter(
      (subcategory) =>
        subcategory.categoryId === category.id,
    );
  }, [subcategories, category.id]);

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <PizzaManagerLayout
      title="Gerenciamento de pizzas"
      description="Configure os tamanhos, sabores e adicionais disponíveis no cardápio do restaurante."
      onBack={onCancel}
      error={error}
      loading={saving}
    >
      {/* ABAS */}

      <PizzaManagerTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        disabled={saving}
      />

      {/* CONTEÚDO */}

      <div className="mt-6">
        {activeTab === "sizes" && (
          <PizzaSizesManager />
        )}

        {activeTab === "flavors" && (
          <PizzaFlavorsManager
            subcategories={pizzaSubcategories}
          />
        )}

        {activeTab === "addons" && (
          <div className="space-y-5">
            {/* STATUS DO CARREGAMENTO */}

            {loadingAddons && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />

                Carregando adicionais cadastrados...
              </div>
            )}

            {/* ERRO */}

            {addonsError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">
                    Não foi possível consultar os adicionais.
                  </p>

                  <p className="mt-1 text-xs text-red-700">
                    {addonsError}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadAddons()}
                  disabled={loadingAddons}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <RefreshCw size={15} />
                  Tentar novamente
                </button>
              </div>
            )}

            {/* RESUMO DOS ADICIONAIS */}

            {!loadingAddons && !addonsError && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    Adicionais disponíveis
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    {
                      availableAddons.filter(
                        (addon) => addon.isActive,
                      ).length
                    }{" "}
                    adicional(is) ativo(s) encontrado(s)
                    no cadastro central.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadAddons()}
                  disabled={loadingAddons}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  <RefreshCw size={15} />
                  Atualizar adicionais
                </button>
              </div>
            )}

            {/* GERENCIADOR DE VÍNCULOS */}

            {!loadingAddons && !addonsError && (
              <PizzaAddonLinksManager
                subcategories={pizzaSubcategories}
                availableAddons={availableAddons}
              />
            )}
          </div>
        )}
      </div>
    </PizzaManagerLayout>
  );
}

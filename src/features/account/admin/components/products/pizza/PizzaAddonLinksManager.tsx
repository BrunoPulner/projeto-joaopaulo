
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  CircleOff,
  Link2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Square,
  Trash2,
} from "lucide-react";

import {
  pizzaCatalogApi,
  type PizzaAddon,
  type PizzaFlavor,
} from "../../../api/pizza-catalog.api";

import type {
  AdminSubcategory,
} from "../../../api/products.api";

import { formatCurrency } from "../currency.utils";

// ============================================
// TIPOS
// ============================================

// Os adicionais devem ser carregados do
// cadastro central de adicionais.
//
// Este tipo contém somente os campos
// necessários para selecionar um adicional.

export interface PizzaAvailableAddon {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
  isActive: boolean;
}

interface PizzaAddonLinksManagerProps {
  subcategories: AdminSubcategory[];
  availableAddons: PizzaAvailableAddon[];
}

type TargetType = "subcategory" | "flavor";

interface LinkTarget {
  type: TargetType;
  id: number;
}

// ============================================
// UTILITÁRIOS
// ============================================

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function sortByName<T extends { name: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function PizzaAddonLinksManager({
  subcategories,
  availableAddons,
}: PizzaAddonLinksManagerProps) {
  const [flavors, setFlavors] =
    useState<PizzaFlavor[]>([]);

  const [targetType, setTargetType] =
    useState<TargetType>("subcategory");

  const [targetId, setTargetId] =
    useState<number | null>(null);

  const [linkedAddons, setLinkedAddons] =
    useState<PizzaAddon[]>([]);

  const [selectedAddonIds, setSelectedAddonIds] =
    useState<number[]>([]);

  const [search, setSearch] =
    useState("");

  const [loadingFlavors, setLoadingFlavors] =
    useState(true);

  const [loadingLinks, setLoadingLinks] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [removingId, setRemovingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================
  // CARREGAR SABORES
  // ==========================================

  const loadFlavors = useCallback(async () => {
    try {
      const data =
        await pizzaCatalogApi.flavors.listAdmin();

      setFlavors(sortByName(data));
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível carregar os sabores.",
        ),
      );
    } finally {
      setLoadingFlavors(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const data =
          await pizzaCatalogApi.flavors.listAdmin();

        if (!active) return;

        setFlavors(sortByName(data));
      } catch (err) {
        if (!active) return;

        setError(
          getErrorMessage(
            err,
            "Não foi possível carregar os sabores.",
          ),
        );
      } finally {
        if (active) {
          setLoadingFlavors(false);
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // DESTINOS DISPONÍVEIS
  // ==========================================

  const targets = useMemo(() => {
    if (targetType === "subcategory") {
      return sortByName(
        subcategories.filter(
          (subcategory) => subcategory.isActive,
        ),
      ).map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
      }));
    }

    return sortByName(
      flavors.filter((flavor) => flavor.isActive),
    ).map((flavor) => ({
      id: flavor.id,
      name: flavor.name,
    }));
  }, [targetType, subcategories, flavors]);

  // ==========================================
  // DESTINO SELECIONADO
  // ==========================================

  const selectedTarget = useMemo<LinkTarget | null>(
    () =>
      targetId !== null &&
      targets.some((target) => target.id === targetId)
        ? {
            type: targetType,
            id: targetId,
          }
        : null,
    [targetId, targetType, targets],
  );

  // ==========================================
  // CARREGAR VÍNCULOS
  // ==========================================

  const loadLinks = useCallback(
    async (target: LinkTarget) => {
      setLoadingLinks(true);
      setError("");

      try {
        const data =
          target.type === "subcategory"
            ? await pizzaCatalogApi.addons
                .listAdminBySubcategory(target.id)
            : await pizzaCatalogApi.addons
                .listAdminByFlavor(target.id);

        setLinkedAddons(data);
      } catch (err) {
        setError(
          getErrorMessage(
            err,
            "Não foi possível carregar os vínculos.",
          ),
        );
      } finally {
        setLoadingLinks(false);
      }
    },
    [],
  );

  // ==========================================
  // SELECIONAR DESTINO
  // ==========================================

  function handleTargetTypeChange(
    nextType: TargetType,
  ) {
    setTargetType(nextType);
    setTargetId(null);
    setLinkedAddons([]);
    setSelectedAddonIds([]);
    setError("");
    setSuccess("");
  }

  async function handleTargetChange(
    id: number | null,
  ) {
    setTargetId(id);
    setLinkedAddons([]);
    setSelectedAddonIds([]);
    setError("");
    setSuccess("");

    if (id === null) return;

    await loadLinks({
      type: targetType,
      id,
    });
  }

  // ==========================================
  // ADICIONAIS DISPONÍVEIS
  // ==========================================

  const activeAddons = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return sortByName(
      availableAddons.filter((addon) => {
        if (!addon.isActive) return false;

        if (!normalizedSearch) return true;

        return (
          addon.name
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch) ||
          (addon.description ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch)
        );
      }),
    );
  }, [availableAddons, search]);

  const activeLinkedIds = useMemo(
    () =>
      new Set(
        linkedAddons
          .filter((addon) => addon.linkIsActive)
          .map((addon) => addon.id),
      ),
    [linkedAddons],
  );

  const selectableAddons = useMemo(
    () =>
      activeAddons.filter(
        (addon) => !activeLinkedIds.has(addon.id),
      ),
    [activeAddons, activeLinkedIds],
  );

  // ==========================================
  // SELEÇÃO DE ADICIONAIS
  // ==========================================

  function toggleAddon(addonId: number) {
    setSelectedAddonIds((current) =>
      current.includes(addonId)
        ? current.filter((id) => id !== addonId)
        : [...current, addonId],
    );
  }

  function selectAllVisible() {
    setSelectedAddonIds((current) => [
      ...new Set([
        ...current,
        ...selectableAddons.map((addon) => addon.id),
      ]),
    ]);
  }

  function clearSelection() {
    setSelectedAddonIds([]);
  }

  // ==========================================
  // SALVAR VÍNCULOS
  // ==========================================

  async function handleLinkAddons() {
    if (
      !selectedTarget ||
      selectedAddonIds.length === 0 ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (selectedTarget.type === "subcategory") {
        await pizzaCatalogApi.addons.linkSubcategories({
          subcategoryIds: [selectedTarget.id],
          addonIds: selectedAddonIds,
        });
      } else {
        await pizzaCatalogApi.addons.linkFlavors({
          flavorIds: [selectedTarget.id],
          addonIds: selectedAddonIds,
        });
      }

      setSelectedAddonIds([]);

      await loadLinks(selectedTarget);

      setSuccess(
        "Adicionais vinculados com sucesso!",
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível vincular os adicionais.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // REMOVER VÍNCULO
  // ==========================================

  async function handleUnlink(addonId: number) {
    if (!selectedTarget || removingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      "Deseja remover este vínculo? O adicional continuará cadastrado no sistema.",
    );

    if (!confirmed) return;

    setRemovingId(addonId);
    setError("");
    setSuccess("");

    try {
      if (selectedTarget.type === "subcategory") {
        await pizzaCatalogApi.addons.unlinkSubcategory(
          selectedTarget.id,
          addonId,
        );
      } else {
        await pizzaCatalogApi.addons.unlinkFlavor(
          selectedTarget.id,
          addonId,
        );
      }

      await loadLinks(selectedTarget);

      setSuccess(
        "Vínculo removido. O adicional original foi preservado.",
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível remover o vínculo.",
        ),
      );
    } finally {
      setRemovingId(null);
    }
  }

  // ==========================================
  // ATUALIZAR DADOS
  // ==========================================

  async function handleRefresh() {
    setError("");
    setSuccess("");

    await loadFlavors();

    if (selectedTarget) {
      await loadLinks(selectedTarget);
    }
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  const activeLinks = linkedAddons.filter(
    (addon) => addon.linkIsActive,
  );

  const hasTarget = selectedTarget !== null;

  const processing =
    saving ||
    removingId !== null ||
    loadingLinks;

    const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

function resolveAddonImageUrl(
  imageUrl: string | null | undefined,
): string | null {
  if (!imageUrl) return null;

  if (
    /^https?:\/\//i.test(imageUrl) ||
    imageUrl.startsWith("blob:")
  ) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  if (/^addons\/[a-f0-9-]+\.webp$/i.test(imageUrl)) {
    return `${API_BASE_URL}/api/images/${imageUrl}`;
  }

  return null;
}

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            Vínculos de adicionais
          </h3>

          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            Associe adicionais já cadastrados
            às subcategorias ou aos sabores de pizza.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={processing}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={17} />
          Atualizar
        </button>
      </div>

      {/* AVISO */}

      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <Link2
            size={20}
            className="mt-0.5 shrink-0 text-orange-700"
          />

          <div>
            <p className="text-sm font-bold text-orange-950">
              Cadastro centralizado de adicionais
            </p>

            <p className="mt-1 text-xs leading-relaxed text-orange-800">
              Os adicionais são cadastrados uma
              única vez na seção de adicionais do
              restaurante. Aqui você apenas escolhe
              onde eles poderão ser oferecidos.
            </p>
          </div>
        </div>
      </div>

      {/* MENSAGENS */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle
            size={19}
            className="shrink-0"
          />

          <p>{error}</p>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <CheckCircle2
            size={19}
            className="shrink-0"
          />

          <p className="font-semibold">
            {success}
          </p>
        </div>
      )}

      {/* SELEÇÃO DO DESTINO */}

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div>
          <h4 className="text-base font-black text-slate-900">
            1. Escolha onde vincular
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Selecione uma subcategoria ou um sabor
            específico de pizza.
          </p>
        </div>

        {/* TIPO */}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={processing}
            onClick={() =>
              handleTargetTypeChange("subcategory")
            }
            className={`min-h-12 rounded-xl border px-4 py-3 text-sm font-bold transition ${
              targetType === "subcategory"
                ? "border-orange-500 bg-orange-50 text-orange-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Por subcategoria
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={() =>
              handleTargetTypeChange("flavor")
            }
            className={`min-h-12 rounded-xl border px-4 py-3 text-sm font-bold transition ${
              targetType === "flavor"
                ? "border-orange-500 bg-orange-50 text-orange-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Por sabor
          </button>
        </div>

        {/* DESTINO */}

        <div>
          <label
            htmlFor="pizza-addon-target"
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            {targetType === "subcategory"
              ? "Subcategoria"
              : "Sabor"}
          </label>

          <select
            id="pizza-addon-target"
            value={targetId ?? ""}
            disabled={
              processing ||
              (targetType === "flavor" &&
                loadingFlavors)
            }
            onChange={(event) =>
              void handleTargetChange(
                event.target.value
                  ? Number(event.target.value)
                  : null,
              )
            }
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-orange-500 disabled:opacity-60"
          >
            <option value="">
              Selecione uma opção
            </option>

            {targets.map((target) => (
              <option
                key={target.id}
                value={target.id}
              >
                {target.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ADICIONAIS */}

      {hasTarget && (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <h4 className="text-base font-black text-slate-900">
              2. Selecione os adicionais
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Marque os adicionais que deseja
              disponibilizar para o destino escolhido.
            </p>
          </div>

          {/* BUSCA */}

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar adicional..."
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-orange-500"
            />
          </div>

          {/* SELEÇÃO EM MASSA */}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500">
              {selectedAddonIds.length} selecionado(s)
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={
                  processing ||
                  selectableAddons.length === 0
                }
                onClick={selectAllVisible}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:underline disabled:opacity-50"
              >
                <CheckSquare size={15} />
                Selecionar visíveis
              </button>

              <button
                type="button"
                disabled={
                  processing ||
                  selectedAddonIds.length === 0
                }
                onClick={clearSelection}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:underline disabled:opacity-50"
              >
                <CircleOff size={15} />
                Limpar seleção
              </button>
            </div>
          </div>

          {/* LISTA */}

          {loadingLinks ? (
            <div className="flex min-h-32 items-center justify-center gap-3 text-sm text-slate-500">
              <LoaderCircle
                size={19}
                className="animate-spin"
              />

              Carregando vínculos...
            </div>
          ) : selectableAddons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nenhum adicional disponível para
              vincular com os filtros atuais.
            </div>
          ) : (
            <div className="grid max-h-96 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {selectableAddons.map((addon) => {
                const selected =
                  selectedAddonIds.includes(addon.id);

                return (
                  <label
                    key={addon.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      selected
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 bg-white hover:border-orange-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={processing}
                      checked={selected}
                      onChange={() =>
                        toggleAddon(addon.id)
                      }
                      className="sr-only"
                    />

                    {selected ? (
                      <CheckSquare
                        size={20}
                        className="shrink-0 text-orange-700"
                      />
                    ) : (
                      <Square
                        size={20}
                        className="shrink-0 text-slate-400"
                      />
                    )}

                    {resolveAddonImageUrl(addon.imageUrl) && (
  <img
    src={resolveAddonImageUrl(addon.imageUrl) ?? undefined}
    alt={addon.name}
    loading="lazy"
    className="size-12 shrink-0 rounded-lg object-cover"
  />
)}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {addon.name}
                      </p>

                      <p className="text-xs font-semibold text-orange-800">
                        {formatCurrency(
                          addon.priceCents,
                        )}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* SALVAR */}

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={
                processing ||
                selectedAddonIds.length === 0
              }
              onClick={() =>
                void handleLinkAddons()
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Plus size={17} />
              )}

              {saving
                ? "Vinculando..."
                : "Vincular adicionais"}
            </button>
          </div>
        </div>
      )}

      {/* VÍNCULOS EXISTENTES */}

      {hasTarget && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <h4 className="text-base font-black text-slate-900">
              3. Adicionais vinculados
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Remover um vínculo não exclui o
              adicional do cadastro central.
            </p>
          </div>

          {loadingLinks ? (
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-500">
              <LoaderCircle
                size={18}
                className="animate-spin"
              />

              Carregando...
            </div>
          ) : activeLinks.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              Nenhum adicional vinculado.
            </p>
          ) : (
            <div className="space-y-3">
              {activeLinks.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                >
                  {resolveAddonImageUrl(addon.imageUrl) && (
  <img
    src={resolveAddonImageUrl(addon.imageUrl) ?? undefined}
    alt={addon.name}
    loading="lazy"
    className="size-12 shrink-0 rounded-lg object-cover"
  />
)}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      {addon.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {formatCurrency(
                        addon.priceCents,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={processing}
                    onClick={() =>
                      void handleUnlink(addon.id)
                    }
                    title="Remover vínculo"
                    aria-label={`Remover vínculo de ${addon.name}`}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {removingId === addon.id ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={17} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ESTADO INICIAL */}

      {!hasTarget && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <Link2
            size={32}
            className="text-slate-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            Selecione uma subcategoria ou um sabor
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Os adicionais disponíveis aparecerão
            após a seleção.
          </p>
        </div>
      )}
    </div>
  );
}

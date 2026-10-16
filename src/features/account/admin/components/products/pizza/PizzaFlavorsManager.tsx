
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Crown,
  ImageOff,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Pizza,
} from "lucide-react";

import {
  pizzaCatalogApi,
  type PizzaFlavor,
  type PizzaFlavorPayload,
  type PizzaSize,
} from "../../../api/pizza-catalog.api";

import type {
  AdminSubcategory,
} from "../../../api/products.api";

import { formatCurrency } from "../currency.utils";

import { PizzaFlavorForm } from "./PizzaFlavorForm";

// ============================================
// CONFIGURAÇÕES
// ============================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// ============================================
// TIPOS
// ============================================

interface PizzaFlavorsManagerProps {
  subcategories: AdminSubcategory[];
}

type FormMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; flavor: PizzaFlavor };

type StatusFilter =
  | "all"
  | "active"
  | "inactive";

interface FlavorCardProps {
  flavor: PizzaFlavor;
  subcategoryName: string;
  processing: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
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

function getFlavorTotal(
  flavor: PizzaFlavor,
): number {
  return (
    flavor.additionalPriceCents +
    (flavor.isPremium
      ? flavor.premiumAdditionalCents
      : 0)
  );
}

function sortFlavors(
  flavors: PizzaFlavor[],
): PizzaFlavor[] {
  return [...flavors].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.name.localeCompare(b.name, "pt-BR") ||
      a.id - b.id,
  );
}

// ============================================
// UPLOAD DE IMAGEM
// ============================================

async function uploadPizzaFlavorImage(
  file: File,
): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Selecione uma imagem JPG, PNG ou WebP.",
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      "A imagem deve ter no máximo 5 MB.",
    );
  }

  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(
    `${API_BASE_URL}/api/admin/uploads/products`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  const result: {
  message?: string;
  image?: {
    objectPath?: string;
  };
} = await response.json().catch(() => {
  throw new Error(
    "O servidor retornou uma resposta inválida ao enviar a imagem.",
  );
});

  if (!response.ok || !result.image?.objectPath) {
    throw new Error(
      result.message ??
        "Não foi possível enviar a imagem.",
    );
  }

  const filename = result.image.objectPath
    .split("/")
    .pop();

  if (
    !filename ||
    !/^[a-f0-9-]+\.webp$/i.test(filename)
  ) {
    throw new Error(
      "O servidor retornou um nome de imagem inválido.",
    );
  }

  return `${API_BASE_URL}/api/images/products/${filename}`;
}

// ============================================
// CARD DE SABOR
// ============================================

function PizzaFlavorCard({
  flavor,
  subcategoryName,
  processing,
  onEdit,
  onDeactivate,
  onReactivate,
}: FlavorCardProps) {
  const [failedImage, setFailedImage] =
    useState<string | null>(null);

  const showImage =
    Boolean(flavor.imageUrl) &&
    failedImage !== flavor.imageUrl;

  const totalExtra = getFlavorTotal(flavor);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md">
      {/* IMAGEM */}

      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-orange-50">
        {showImage ? (
          <img
            src={flavor.imageUrl ?? undefined}
            alt={`Pizza sabor ${flavor.name}`}
            loading="lazy"
            onError={() =>
              setFailedImage(flavor.imageUrl)
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageOff size={32} />

            <span className="text-xs">
              Sem imagem
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {flavor.isPremium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm">
              <Crown size={13} />
              Nobre
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
              flavor.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {flavor.isActive
              ? "Ativo"
              : "Desativado"}
          </span>
        </div>
      </div>

      {/* CONTEÚDO */}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-black text-slate-900">
            {flavor.name}
          </h3>

          <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-800">
            {subcategoryName}
          </span>
        </div>

        {flavor.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">
            {flavor.description}
          </p>
        )}

        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
            <span>Acréscimo do sabor</span>

            <strong className="text-slate-800">
              {formatCurrency(
                flavor.additionalPriceCents,
              )}
            </strong>
          </div>

          {flavor.isPremium && (
            <div className="flex items-center justify-between gap-2 text-xs text-amber-800">
              <span>Acréscimo nobre</span>

              <strong>
                {formatCurrency(
                  flavor.premiumAdditionalCents,
                )}
              </strong>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
            <span className="text-xs font-bold text-slate-700">
              Acréscimo total
            </span>

            <span className="text-lg font-black text-orange-800">
              {formatCurrency(totalExtra)}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500">
            Tamanhos permitidos
          </p>

          <p className="mt-1 text-sm font-medium text-slate-800">
            {flavor.allSizes
              ? "Todos os tamanhos"
              : "Tamanhos específicos"}
          </p>
        </div>

        {/* AÇÕES */}

        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={processing}
            onClick={onEdit}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Pencil size={15} />
            Editar
          </button>

          {flavor.isActive ? (
            <button
              type="button"
              disabled={processing}
              onClick={onDeactivate}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={15} />
              Desativar
            </button>
          ) : (
            <button
              type="button"
              disabled={processing}
              onClick={onReactivate}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
            >
              <RotateCcw size={15} />
              Reativar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ============================================
// GERENCIADOR PRINCIPAL
// ============================================

export function PizzaFlavorsManager({
  subcategories,
}: PizzaFlavorsManagerProps) {
  const [flavors, setFlavors] =
    useState<PizzaFlavor[]>([]);

  const [sizes, setSizes] =
    useState<PizzaSize[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [formMode, setFormMode] =
    useState<FormMode>({ type: "closed" });

  const [search, setSearch] =
    useState("");

  const [subcategoryFilter, setSubcategoryFilter] =
    useState<number | "all">("all");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================
  // CARREGAR DADOS
  // ==========================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [flavorData, sizeData] =
        await Promise.all([
          pizzaCatalogApi.flavors.listAdmin(),
          pizzaCatalogApi.sizes.listAdmin(),
        ]);

      setFlavors(sortFlavors(flavorData));
      setSizes(sizeData);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível carregar os sabores.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregamento inicial assíncrono.
  // Evita chamar setState diretamente
  // no corpo do useEffect.

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const [flavorData, sizeData] =
          await Promise.all([
            pizzaCatalogApi.flavors.listAdmin(),
            pizzaCatalogApi.sizes.listAdmin(),
          ]);

        if (!active) return;

        setFlavors(sortFlavors(flavorData));
        setSizes(sizeData);
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
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // SUBCATEGORIAS
  // ==========================================

  const subcategoryMap = useMemo(() => {
    return new Map(
      subcategories.map(
        (subcategory) => [
          subcategory.id,
          subcategory.name,
        ],
      ),
    );
  }, [subcategories]);

  // ==========================================
  // FILTROS
  // ==========================================

  const filteredFlavors = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return flavors.filter((flavor) => {
      const matchesSearch =
        !normalizedSearch ||
        flavor.name
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        (flavor.description ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);

      const matchesSubcategory =
        subcategoryFilter === "all" ||
        flavor.subcategoryId ===
          subcategoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          flavor.isActive) ||
        (statusFilter === "inactive" &&
          !flavor.isActive);

      return (
        matchesSearch &&
        matchesSubcategory &&
        matchesStatus
      );
    });
  }, [
    flavors,
    search,
    subcategoryFilter,
    statusFilter,
  ]);

  // ==========================================
  // ABRIR FORMULÁRIOS
  // ==========================================

  function openCreateForm() {
    setFormMode({ type: "create" });
    setError("");
    setSuccess("");
  }

  function openEditForm(flavor: PizzaFlavor) {
    // Não presumimos os IDs de PizzaFlavorSize.
    // O formulário recebe uma cópia dos dados
    // existentes e não deve alterar vínculos
    // desconhecidos.

    setFormMode({
      type: "edit",
      flavor,
    });

    setError("");
    setSuccess("");
  }

  function closeForm() {
    if (saving) return;

    setFormMode({ type: "closed" });
    setError("");
  }

  // ==========================================
  // SALVAR SABOR
  // ==========================================

  async function handleSave(
    payload: PizzaFlavorPayload,
    imageFile: File | null,
  ) {
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let imageUrl = payload.imageUrl;

      if (imageFile) {
        imageUrl =
          await uploadPizzaFlavorImage(imageFile);
      }

      const finalPayload: PizzaFlavorPayload = {
        ...payload,
        imageUrl,
      };

      if (formMode.type === "edit") {
        const original = formMode.flavor;

        // Se o sabor usa tamanhos específicos,
        // os vínculos devem ser recuperados
        // antes de permitir sua alteração.
        //
        // Como a API atual não expõe sizeIds,
        // preservamos os vínculos existentes
        // omitindo esses campos no PATCH.

        if (!original.allSizes) {
  await pizzaCatalogApi.flavors.update(
    original.id,
    {
      subcategoryId: finalPayload.subcategoryId,
      name: finalPayload.name,
      description: finalPayload.description,
      imageUrl: finalPayload.imageUrl,
      additionalPriceCents:
        finalPayload.additionalPriceCents,
      isPremium: finalPayload.isPremium,
      premiumAdditionalCents:
        finalPayload.premiumAdditionalCents,
      isActive: finalPayload.isActive,
      sortOrder: finalPayload.sortOrder,
    },
  );
} else {
  await pizzaCatalogApi.flavors.update(
    original.id,
    finalPayload,
  );
}

        setSuccess(
          "Sabor atualizado com sucesso!",
        );
      } else {
        await pizzaCatalogApi.flavors.create(
          finalPayload,
        );

        setSuccess(
          "Sabor cadastrado com sucesso!",
        );
      }

      setFormMode({ type: "closed" });

      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível salvar o sabor.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // DESATIVAR SABOR
  // ==========================================

  async function handleDeactivate(
    flavor: PizzaFlavor,
  ) {
    if (processingId !== null) return;

    const confirmed = window.confirm(
      `Deseja desativar o sabor "${flavor.name}"?`,
    );

    if (!confirmed) return;

    setProcessingId(flavor.id);
    setError("");
    setSuccess("");

    try {
      await pizzaCatalogApi.flavors.deactivate(
        flavor.id,
      );

      await loadData();

      setSuccess(
        "Sabor desativado. O registro foi preservado.",
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível desativar o sabor.",
        ),
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==========================================
  // REATIVAR SABOR
  // ==========================================

  async function handleReactivate(
    flavor: PizzaFlavor,
  ) {
    if (processingId !== null) return;

    setProcessingId(flavor.id);
    setError("");
    setSuccess("");

    try {
      await pizzaCatalogApi.flavors.reactivate(
        flavor.id,
      );

      await loadData();

      setSuccess(
        "Sabor reativado com sucesso!",
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível reativar o sabor.",
        ),
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  const formOpen =
    formMode.type !== "closed";

  const activeCount = flavors.filter(
    (flavor) => flavor.isActive,
  ).length;

  const premiumCount = flavors.filter(
    (flavor) =>
      flavor.isActive && flavor.isPremium,
  ).length;

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            Sabores de pizza
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Gerencie sabores doces, salgados,
            acréscimos e opções nobres.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void loadData()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Atualizar
          </button>

          {!formOpen && (
            <button
              type="button"
              disabled={loading || saving}
              onClick={openCreateForm}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white transition hover:bg-orange-800 disabled:opacity-50"
            >
              <Plus size={18} />
              Novo sabor
            </button>
          )}
        </div>
      </div>

      {/* MENSAGENS */}

      {error && !formOpen && (
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

      {/* FORMULÁRIO */}

      {formOpen && (
        <PizzaFlavorForm
          key={
            formMode.type === "edit"
              ? `edit-${formMode.flavor.id}`
              : "create"
          }
          initialData={
            formMode.type === "edit"
              ? formMode.flavor
              : null
          }
          initialSizeIds={[]}
          subcategories={subcategories}
          sizes={sizes}
          saving={saving}
          error={error || undefined}
          onCancel={closeForm}
          onSubmit={handleSave}
        />
      )}

      {/* LISTAGEM */}

      {!formOpen && (
        <>
          {/* RESUMO */}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">
                Total de sabores
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {flavors.length}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-700">
                Sabores ativos
              </p>

              <p className="mt-2 text-2xl font-black text-emerald-900">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-700">
                Sabores nobres ativos
              </p>

              <p className="mt-2 text-2xl font-black text-amber-900">
                {premiumCount}
              </p>
            </div>
          </div>

          {/* FILTROS */}

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
              />

              <input
                type="search"
                placeholder="Buscar sabor..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <select
              aria-label="Filtrar por tipo de sabor"
              value={subcategoryFilter}
              onChange={(event) =>
                setSubcategoryFilter(
                  event.target.value === "all"
                    ? "all"
                    : Number(event.target.value),
                )
              }
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
            >
              <option value="all">
                Todos os tipos
              </option>

              {subcategories.map(
                (subcategory) => (
                  <option
                    key={subcategory.id}
                    value={subcategory.id}
                  >
                    {subcategory.name}
                  </option>
                ),
              )}
            </select>

            <select
              aria-label="Filtrar por situação"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as StatusFilter,
                )
              }
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
            >
              <option value="all">
                Todos os status
              </option>

              <option value="active">
                Ativos
              </option>

              <option value="inactive">
                Desativados
              </option>
            </select>
          </div>

          {/* RESULTADOS */}

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
              <LoaderCircle
                size={20}
                className="animate-spin"
              />

              Carregando sabores...
            </div>
          ) : filteredFlavors.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <Pizza
                size={36}
                className="text-slate-300"
              />

              <h4 className="mt-4 text-base font-black text-slate-800">
                Nenhum sabor encontrado
              </h4>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {flavors.length === 0
                  ? "Cadastre o primeiro sabor de pizza para começar a montar o cardápio."
                  : "Tente alterar os filtros para encontrar outros sabores."}
              </p>

              {flavors.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white hover:bg-orange-800"
                >
                  <Plus size={17} />
                  Cadastrar sabor
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredFlavors.map(
                (flavor) => (
                  <PizzaFlavorCard
                    key={flavor.id}
                    flavor={flavor}
                    subcategoryName={
                      subcategoryMap.get(
                        flavor.subcategoryId,
                      ) ?? "Sem categoria"
                    }
                    processing={
                      processingId !== null ||
                      saving
                    }
                    onEdit={() =>
                      openEditForm(flavor)
                    }
                    onDeactivate={() =>
                      void handleDeactivate(
                        flavor,
                      )
                    }
                    onReactivate={() =>
                      void handleReactivate(
                        flavor,
                      )
                    }
                  />
                ),
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

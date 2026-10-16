
import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  ImageOff,
  LoaderCircle,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Ruler,
  Trash2,
} from "lucide-react";

import {
  pizzaCatalogApi,
  type PizzaSize,
  type PizzaSizePayload,
} from "../../../api/pizza-catalog.api";

import { formatCurrency } from "../currency.utils";
import { PizzaSizeForm } from "./PizzaSizeForm";

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

interface PizzaSizesManagerProps {
  onCancel?: () => void;
}

type FormMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; size: PizzaSize };

// ============================================
// UPLOAD DE IMAGEM
// ============================================

async function uploadPizzaImage(
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
  } = await response.json();

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
// CARD DO TAMANHO
// ============================================

interface PizzaSizeCardProps {
  size: PizzaSize;

  processing: boolean;

  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onAvailability: () => void;
}

function PizzaSizeCard({
  size,
  processing,
  onEdit,
  onDeactivate,
  onReactivate,
  onAvailability,
}: PizzaSizeCardProps) {
  const [failedImage, setFailedImage] =
    useState<string | null>(null);

  const showImage =
    Boolean(size.imageUrl) &&
    failedImage !== size.imageUrl;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md">
      {/* IMAGEM */}

      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-orange-50">
        {showImage ? (
          <img
            src={size.imageUrl ?? undefined}
            alt={`Pizza tamanho ${size.name}`}
            loading="lazy"
            onError={() =>
              setFailedImage(size.imageUrl)
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

        <div className="absolute right-3 top-3">
          <span
            className={`
              rounded-full px-3 py-1.5
              text-xs font-bold shadow-sm
              ${
                size.isActive
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-200 text-slate-600"
              }
            `}
          >
            {size.isActive
              ? "Ativo"
              : "Desativado"}
          </span>
        </div>
      </div>

      {/* INFORMAÇÕES */}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-black text-slate-900">
          {size.name}
        </h3>

        {size.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500">
            {size.description}
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-lg font-black text-slate-800">
              {size.diameterCm ?? "—"}
            </p>

            <p className="text-xs text-slate-500">
              cm
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-lg font-black text-slate-800">
              {size.slices}
            </p>

            <p className="text-xs text-slate-500">
              Fatias
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-lg font-black text-slate-800">
              {size.maxFlavors}
            </p>

            <p className="text-xs text-slate-500">
              Sabores
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Preço-base
            </p>

            <p className="text-2xl font-black text-orange-800">
              {formatCurrency(size.basePriceCents)}
            </p>
          </div>

          <span
            className={`
              rounded-full px-3 py-1.5
              text-xs font-bold
              ${
                size.isAvailable
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }
            `}
          >
            {size.isAvailable
              ? "Disponível"
              : "Indisponível"}
          </span>
        </div>

        {/* AÇÕES */}

        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onEdit}
            disabled={processing}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Pencil size={15} />
            Editar
          </button>

          {size.isActive && (
            <button
              type="button"
              onClick={onAvailability}
              disabled={processing}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-orange-200 px-3 text-xs font-bold text-orange-800 transition hover:bg-orange-50 disabled:opacity-50"
            >
              {size.isAvailable ? (
                <PackageX size={15} />
              ) : (
                <PackageCheck size={15} />
              )}

              {size.isAvailable
                ? "Indisponibilizar"
                : "Disponibilizar"}
            </button>
          )}

          {size.isActive ? (
            <button
              type="button"
              onClick={onDeactivate}
              disabled={processing}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              title="Desativar tamanho"
            >
              <Trash2 size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onReactivate}
              disabled={processing}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-green-200 px-3 text-xs font-bold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
              title="Reativar tamanho"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ============================================
// GERENCIADOR DE TAMANHOS
// ============================================

export function PizzaSizesManager({
  onCancel,
}: PizzaSizesManagerProps) {
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

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================
  // CARREGAR TAMANHOS
  // ==========================================

  const loadSizes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data =
        await pizzaCatalogApi.sizes.listAdmin();

      setSizes(
        [...data].sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.id - b.id,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os tamanhos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  const controller = new AbortController();

  const initialize = async () => {
    try {
      const data = await pizzaCatalogApi.sizes.listAdmin();

      if (controller.signal.aborted) return;

      setSizes(
        [...data].sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.id - b.id,
        ),
      );
    } catch (err) {
      if (controller.signal.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os tamanhos.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  void initialize();

  return () => {
    controller.abort();
  };
}, []);

  // ==========================================
  // ABRIR FORMULÁRIOS
  // ==========================================

  function openCreateForm() {
    setFormMode({ type: "create" });
    setError("");
    setSuccess("");
  }

  function openEditForm(size: PizzaSize) {
    setFormMode({
      type: "edit",
      size,
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
  // SALVAR TAMANHO
  // ==========================================

  async function handleSave(
    payload: PizzaSizePayload,
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
          await uploadPizzaImage(imageFile);
      }

      const finalPayload: PizzaSizePayload = {
        ...payload,
        imageUrl,
      };

      if (formMode.type === "edit") {
        await pizzaCatalogApi.sizes.update(
          formMode.size.id,
          finalPayload,
        );

        setSuccess(
          "Tamanho atualizado com sucesso!",
        );
      } else {
        await pizzaCatalogApi.sizes.create(
          finalPayload,
        );

        setSuccess(
          "Tamanho cadastrado com sucesso!",
        );
      }

      setFormMode({ type: "closed" });

      await loadSizes();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o tamanho.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // ALTERAR DISPONIBILIDADE
  // ==========================================

  async function handleAvailability(
    size: PizzaSize,
  ) {
    if (processingId !== null) return;

    setProcessingId(size.id);
    setError("");
    setSuccess("");

    try {
      await pizzaCatalogApi.sizes.setAvailability(
        size.id,
        !size.isAvailable,
      );

      await loadSizes();

      setSuccess(
        size.isAvailable
          ? "Tamanho marcado como indisponível."
          : "Tamanho disponível para venda.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao alterar disponibilidade.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==========================================
  // DESATIVAR
  // ==========================================

  async function handleDeactivate(
    size: PizzaSize,
  ) {
    if (processingId !== null) return;

    const confirmed = window.confirm(
      `Deseja desativar o tamanho "${size.name}"?`,
    );

    if (!confirmed) return;

    setProcessingId(size.id);
    setError("");
    setSuccess("");

    try {
      await pizzaCatalogApi.sizes.deactivate(
        size.id,
      );

      await loadSizes();

      setSuccess(
        "Tamanho desativado. O registro foi preservado.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao desativar tamanho.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  // ==========================================
  // REATIVAR
  // ==========================================

  async function handleReactivate(
    size: PizzaSize,
  ) {
    if (processingId !== null) return;

    setProcessingId(size.id);
    setError("");
    setSuccess("");

    try {
      await pizzaCatalogApi.sizes.reactivate(
        size.id,
      );

      await loadSizes();

      setSuccess(
        "Tamanho reativado com sucesso!",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao reativar tamanho.",
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

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            Tamanhos de pizza
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Configure os tamanhos, preços-base e
            características das pizzas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadSizes()}
            disabled={loading || saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Atualizar
          </button>

          {!formOpen && (
            <button
              type="button"
              onClick={openCreateForm}
              disabled={loading || saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white transition hover:bg-orange-800 disabled:opacity-50"
            >
              <Plus size={18} />
              Novo tamanho
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Voltar
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

          <p className="text-sm">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          <CheckCircle2
            size={19}
            className="shrink-0"
          />

          <p className="text-sm font-semibold">
            {success}
          </p>
        </div>
      )}

      {/* FORMULÁRIO */}

      {formOpen && (
        <PizzaSizeForm
          key={
            formMode.type === "edit"
              ? `edit-${formMode.size.id}`
              : "create"
          }
          initialData={
            formMode.type === "edit"
              ? formMode.size
              : null
          }
          saving={saving}
          error={error || undefined}
          onCancel={closeForm}
          onSubmit={handleSave}
        />
      )}

      {/* LISTAGEM */}

      {!formOpen && (
        <>
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
              <LoaderCircle
                size={20}
                className="animate-spin"
              />

              Carregando tamanhos...
            </div>
          ) : sizes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <Ruler
                size={36}
                className="text-slate-300"
              />

              <h4 className="mt-4 text-base font-black text-slate-800">
                Nenhum tamanho cadastrado
              </h4>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Cadastre o primeiro tamanho de pizza
                para começar a configurar o cardápio.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white hover:bg-orange-800"
              >
                <Plus size={17} />
                Cadastrar tamanho
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sizes.map((size) => (
                <PizzaSizeCard
                  key={size.id}
                  size={size}
                  processing={
                    processingId !== null ||
                    saving
                  }
                  onEdit={() =>
                    openEditForm(size)
                  }
                  onDeactivate={() =>
                    void handleDeactivate(size)
                  }
                  onReactivate={() =>
                    void handleReactivate(size)
                  }
                  onAvailability={() =>
                    void handleAvailability(size)
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

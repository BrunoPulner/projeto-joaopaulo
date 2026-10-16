
import { useEffect, useState } from "react";

import {
  Check,
  LoaderCircle,
  RotateCcw,
  Ruler,
  X,
} from "lucide-react";

import type {
  PizzaSize,
  PizzaSizePayload,
} from "../../../api/pizza-catalog.api";

import { CurrencyInput } from "../CurrencyInput";
import { formatCurrency } from "../currency.utils";

import { PizzaImageUpload } from "./PizzaImageUpload";

// ============================================
// TIPOS
// ============================================

export interface PizzaSizeFormValues {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;

  slices: number;
  diameterCm: number;
  basePriceCents: number;
  maxFlavors: number;

  isActive: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

interface PizzaSizeFormProps {
  initialData?: PizzaSize | null;

  onSubmit: (
    payload: PizzaSizePayload,
    imageFile: File | null,
  ) => void | Promise<void>;

  onCancel: () => void;

  saving?: boolean;
  error?: string;
}

// ============================================
// CONFIGURAÇÕES
// ============================================

const MAX_INT = 2147483647;

const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:opacity-70";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

// ============================================
// VALORES INICIAIS
// ============================================

const emptyForm: PizzaSizeFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",

  slices: 8,
  diameterCm: 40,
  basePriceCents: 0,
  maxFlavors: 2,

  isActive: true,
  isAvailable: true,
  sortOrder: 0,
};

// ============================================
// UTILITÁRIOS
// ============================================

function generateSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toFormValues(
  size?: PizzaSize | null,
): PizzaSizeFormValues {
  if (!size) {
    return { ...emptyForm };
  }

  return {
    name: size.name,
    slug: size.slug,
    description: size.description ?? "",
    imageUrl: size.imageUrl ?? "",

    slices: size.slices,
    diameterCm: size.diameterCm ?? 0,
    basePriceCents: size.basePriceCents,
    maxFlavors: size.maxFlavors,

    isActive: size.isActive,
    isAvailable: size.isAvailable,
    sortOrder: size.sortOrder,
  };
}

// ============================================
// COMPONENTE
// ============================================

export function PizzaSizeForm({
  initialData = null,
  onSubmit,
  onCancel,
  saving = false,
  error,
}: PizzaSizeFormProps) {
  const editing = initialData !== null;

  const [values, setValues] =
    useState<PizzaSizeFormValues>(() =>
      toFormValues(initialData),
    );

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [slugEdited, setSlugEdited] =
    useState(Boolean(initialData));

  const [validationError, setValidationError] =
    useState("");

  // ==========================================
  // ATUALIZAR FORMULÁRIO AO EDITAR
  // ==========================================

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(toFormValues(initialData));

    setSelectedImage(null);
    setSlugEdited(Boolean(initialData));
    setValidationError("");
  }, [initialData]);

  // ==========================================
  // ATUALIZAÇÃO DE CAMPOS
  // ==========================================

  function updateField<K extends keyof PizzaSizeFormValues>(
    field: K,
    value: PizzaSizeFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setValidationError("");
  }

  function handleNameChange(name: string) {
    setValues((current) => ({
      ...current,
      name,
      slug: slugEdited
        ? current.slug
        : generateSlug(name),
    }));

    setValidationError("");
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================

  function validate(): string | null {
    const name = values.name.trim();
    const slug = generateSlug(values.slug);

    if (name.length < 2) {
      return "Informe um nome com pelo menos 2 caracteres.";
    }

    if (!slug) {
      return "Informe um identificador válido.";
    }

    if (
      !Number.isSafeInteger(values.slices) ||
      values.slices < 1 ||
      values.slices > 100
    ) {
      return "Informe uma quantidade de fatias entre 1 e 100.";
    }

    if (
      !Number.isFinite(values.diameterCm) ||
      values.diameterCm <= 0 ||
      values.diameterCm > 200
    ) {
      return "Informe um diâmetro válido entre 0 e 200 cm.";
    }

    if (
      !Number.isSafeInteger(values.basePriceCents) ||
      values.basePriceCents < 1 ||
      values.basePriceCents > MAX_INT
    ) {
      return "Informe um preço-base válido e maior que zero.";
    }

    if (
      !Number.isSafeInteger(values.maxFlavors) ||
      values.maxFlavors < 1 ||
      values.maxFlavors > 10
    ) {
      return "Informe um limite de sabores entre 1 e 10.";
    }

    if (
      !Number.isSafeInteger(values.sortOrder) ||
      values.sortOrder < 0 ||
      values.sortOrder > MAX_INT
    ) {
      return "Informe uma ordem de exibição válida.";
    }

    return null;
  }

  // ==========================================
  // SALVAR
  // ==========================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) return;

    const invalid = validate();

    if (invalid) {
      setValidationError(invalid);
      return;
    }

    const payload: PizzaSizePayload = {
      name: values.name.trim(),
      slug: generateSlug(values.slug),

      description:
        values.description.trim() || null,

      imageUrl:
        values.imageUrl.trim() || null,

      slices: values.slices,
      diameterCm: values.diameterCm,
      basePriceCents: values.basePriceCents,
      maxFlavors: values.maxFlavors,

      isActive: values.isActive,
      isAvailable: values.isAvailable,
      sortOrder: values.sortOrder,
    };

    await onSubmit(payload, selectedImage);
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* CABEÇALHO */}

      <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-6">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            {editing
              ? "Editar tamanho de pizza"
              : "Cadastrar tamanho de pizza"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Defina as características e o preço-base
            deste tamanho.
          </p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
          <Ruler size={22} />
        </div>
      </div>

      {/* FORMULÁRIO */}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-6 p-5 sm:p-6"
      >
        {(validationError || error) && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {validationError || error}
          </div>
        )}

        {/* INFORMAÇÕES PRINCIPAIS */}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="pizza-size-name"
              className={labelClass}
            >
              Nome do tamanho
            </label>

            <input
              id="pizza-size-name"
              type="text"
              required
              maxLength={100}
              disabled={saving}
              value={values.name}
              onChange={(event) =>
                handleNameChange(event.target.value)
              }
              placeholder="Ex.: Grande"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="pizza-size-slug"
              className={labelClass}
            >
              Identificador (slug)
            </label>

            <input
              id="pizza-size-slug"
              type="text"
              required
              maxLength={100}
              disabled={saving}
              value={values.slug}
              onChange={(event) => {
                setSlugEdited(true);

                updateField(
                  "slug",
                  generateSlug(event.target.value),
                );
              }}
              placeholder="Ex.: grande"
              className={inputClass}
            />

            <p className="mt-1 text-xs text-slate-500">
              Utilizado internamente para identificar
              o tamanho.
            </p>
          </div>

          <div>
            <label
              htmlFor="pizza-size-sort-order"
              className={labelClass}
            >
              Ordem de exibição
            </label>

            <input
              id="pizza-size-sort-order"
              type="number"
              min={0}
              step={1}
              disabled={saving}
              value={values.sortOrder}
              onChange={(event) =>
                updateField(
                  "sortOrder",
                  Number(event.target.value),
                )
              }
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="pizza-size-description"
              className={labelClass}
            >
              Descrição
            </label>

            <textarea
              id="pizza-size-description"
              rows={3}
              maxLength={500}
              disabled={saving}
              value={values.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              placeholder="Ex.: Pizza grande com 8 fatias, ideal para compartilhar."
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        {/* IMAGEM */}

        <PizzaImageUpload
          label="Imagem do tamanho"
          description="Foto da pizza ou caixa representando seu tamanho em centímetros. JPG, PNG ou WebP, até 5 MB."
          imageUrl={values.imageUrl}
          selectedFile={selectedImage}
          onFileChange={setSelectedImage}
          disabled={saving}
        />

        {/* DIMENSÕES */}

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div>
            <h4 className="text-base font-black text-slate-900">
              Dimensões e características
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Informações exibidas ao cliente na
              escolha do tamanho.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label
                htmlFor="pizza-size-diameter"
                className={labelClass}
              >
                Diâmetro (cm)
              </label>

              <input
                id="pizza-size-diameter"
                type="number"
                min={0.1}
                max={200}
                step={0.1}
                required
                disabled={saving}
                value={values.diameterCm}
                onChange={(event) =>
                  updateField(
                    "diameterCm",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="pizza-size-slices"
                className={labelClass}
              >
                Fatias
              </label>

              <input
                id="pizza-size-slices"
                type="number"
                min={1}
                max={100}
                step={1}
                required
                disabled={saving}
                value={values.slices}
                onChange={(event) =>
                  updateField(
                    "slices",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="pizza-size-max-flavors"
                className={labelClass}
              >
                Máximo de sabores
              </label>

              <input
                id="pizza-size-max-flavors"
                type="number"
                min={1}
                max={10}
                step={1}
                required
                disabled={saving}
                value={values.maxFlavors}
                onChange={(event) =>
                  updateField(
                    "maxFlavors",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* PREÇO */}

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div>
            <h4 className="text-base font-black text-slate-900">
              Preço-base
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Os acréscimos de sabores nobres e
              adicionais serão somados posteriormente.
            </p>
          </div>

          <CurrencyInput
            id="pizza-size-base-price"
            label="Valor-base da pizza"
            required
            disabled={saving}
            value={values.basePriceCents}
            onChange={(value) =>
              updateField(
                "basePriceCents",
                value,
              )
            }
            minCents={1}
          />

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
              Valor-base configurado
            </p>

            <p className="mt-1 text-2xl font-black text-orange-950">
              {formatCurrency(values.basePriceCents)}
            </p>

            <p className="mt-1 text-xs text-orange-800">
              Este valor não inclui acréscimos dos
              sabores e adicionais.
            </p>
          </div>
        </div>

        {/* DISPONIBILIDADE */}

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <h4 className="text-base font-black text-slate-900">
            Configurações
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                disabled={saving}
                checked={values.isActive}
                onChange={(event) =>
                  updateField(
                    "isActive",
                    event.target.checked,
                  )
                }
                className="size-4 accent-orange-600"
              />

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Cadastro ativo
                </p>

                <p className="text-xs text-slate-500">
                  Mantém o tamanho habilitado no
                  catálogo.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                disabled={saving}
                checked={values.isAvailable}
                onChange={(event) =>
                  updateField(
                    "isAvailable",
                    event.target.checked,
                  )
                }
                className="size-4 accent-orange-600"
              />

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Disponível para venda
                </p>

                <p className="text-xs text-slate-500">
                  Permite selecionar este tamanho
                  no cardápio.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* BOTÕES */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500">
            {editing
              ? `Editando tamanho #${initialData?.id}`
              : "Novo tamanho de pizza"}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <X size={17} />
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : editing ? (
                <RotateCcw size={17} />
              ) : (
                <Check size={17} />
              )}

              {saving
                ? "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "Cadastrar tamanho"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

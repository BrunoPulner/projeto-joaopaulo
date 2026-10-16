
import { useState, type FormEvent } from "react";

import {
  Check,
  Crown,
  LoaderCircle,
  Pizza,
  RotateCcw,
  X,
} from "lucide-react";

import type {
  PizzaFlavor,
  PizzaFlavorPayload,
  PizzaSize,
} from "../../../api/pizza-catalog.api";

import type {
  AdminSubcategory,
} from "../../../api/products.api";

import { CurrencyInput } from "../CurrencyInput";
import { formatCurrency } from "../currency.utils";
import { PizzaImageUpload } from "./PizzaImageUpload";

// ============================================
// TIPOS
// ============================================

interface PizzaFlavorFormProps {
  initialData?: PizzaFlavor | null;

  subcategories: AdminSubcategory[];
  sizes: PizzaSize[];

  // IDs já vinculados ao sabor em edição.
  // O manager deverá carregar esses IDs
  // quando abrir o formulário de edição.
  initialSizeIds?: number[];

  onSubmit: (
    payload: PizzaFlavorPayload,
    imageFile: File | null,
  ) => void | Promise<void>;

  onCancel: () => void;

  saving?: boolean;
  error?: string;
}

interface PizzaFlavorFormValues {
  subcategoryId: number;

  name: string;
  description: string;
  imageUrl: string;

  additionalPriceCents: number;

  isPremium: boolean;
  premiumAdditionalCents: number;

  allSizes: boolean;
  sizeIds: number[];

  isActive: boolean;
  sortOrder: number;
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

function createInitialValues(
  initialData: PizzaFlavor | null,
  initialSizeIds: number[],
  subcategories: AdminSubcategory[],
): PizzaFlavorFormValues {
  if (initialData) {
    return {
      subcategoryId: initialData.subcategoryId,

      name: initialData.name,
      description: initialData.description ?? "",
      imageUrl: initialData.imageUrl ?? "",

      additionalPriceCents:
        initialData.additionalPriceCents,

      isPremium: initialData.isPremium,

      premiumAdditionalCents:
        initialData.premiumAdditionalCents,

      allSizes: initialData.allSizes,
      sizeIds: [...initialSizeIds],

      isActive: initialData.isActive,
      sortOrder: initialData.sortOrder,
    };
  }

  return {
    subcategoryId:
      subcategories.find(
        (subcategory) => subcategory.isActive,
      )?.id ?? 0,

    name: "",
    description: "",
    imageUrl: "",

    additionalPriceCents: 0,

    isPremium: false,
    premiumAdditionalCents: 0,

    allSizes: true,
    sizeIds: [],

    isActive: true,
    sortOrder: 0,
  };
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function PizzaFlavorForm({
  initialData = null,
  subcategories,
  sizes,
  initialSizeIds = [],
  onSubmit,
  onCancel,
  saving = false,
  error,
}: PizzaFlavorFormProps) {
  const editing = initialData !== null;

  const [values, setValues] =
    useState<PizzaFlavorFormValues>(() =>
      createInitialValues(
        initialData,
        initialSizeIds,
        subcategories,
      ),
    );

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [validationError, setValidationError] =
    useState("");

  // ==========================================
  // ATUALIZAÇÃO DOS CAMPOS
  // ==========================================

  function updateField<
    K extends keyof PizzaFlavorFormValues
  >(
    field: K,
    value: PizzaFlavorFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setValidationError("");
  }

  function toggleSize(sizeId: number) {
    setValues((current) => {
      const exists = current.sizeIds.includes(sizeId);

      return {
        ...current,
        sizeIds: exists
          ? current.sizeIds.filter(
              (id) => id !== sizeId,
            )
          : [...current.sizeIds, sizeId],
      };
    });

    setValidationError("");
  }

  // ==========================================
  // VALIDAÇÃO
  // ==========================================

  function validate(): string | null {
    const name = values.name.trim();

    if (name.length < 2) {
      return "Informe um nome com pelo menos 2 caracteres.";
    }

    if (
      !subcategories.some(
        (subcategory) =>
          subcategory.id === values.subcategoryId &&
          (subcategory.isActive ||
            initialData?.subcategoryId ===
              subcategory.id),
      )
    ) {
      return "Selecione uma subcategoria válida de pizza.";
    }

    if (
      !Number.isSafeInteger(
        values.additionalPriceCents,
      ) ||
      values.additionalPriceCents < 0 ||
      values.additionalPriceCents > MAX_INT
    ) {
      return "Informe um acréscimo válido para o sabor.";
    }

    if (
      values.isPremium &&
      (!Number.isSafeInteger(
        values.premiumAdditionalCents,
      ) ||
        values.premiumAdditionalCents < 0 ||
        values.premiumAdditionalCents > MAX_INT)
    ) {
      return "Informe um acréscimo nobre válido.";
    }

    if (!values.allSizes) {
      if (values.sizeIds.length === 0) {
        return "Selecione pelo menos um tamanho permitido.";
      }

      const validIds = sizes
        .filter((size) => size.isActive)
        .map((size) => size.id);

      if (
        values.sizeIds.some(
          (id) => !validIds.includes(id),
        )
      ) {
        return "Existe um tamanho selecionado que não está ativo.";
      }
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
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) return;

    const invalid = validate();

    if (invalid) {
      setValidationError(invalid);
      return;
    }

    const payload: PizzaFlavorPayload = {
      subcategoryId: values.subcategoryId,

      name: values.name.trim(),
      description:
        values.description.trim() || null,

      imageUrl:
        values.imageUrl.trim() || null,

      additionalPriceCents:
        values.additionalPriceCents,

      isPremium: values.isPremium,

      premiumAdditionalCents:
        values.isPremium
          ? values.premiumAdditionalCents
          : 0,

      allSizes: values.allSizes,

      sizeIds:
        values.allSizes
          ? []
          : [...new Set(values.sizeIds)],

      isActive: values.isActive,
      sortOrder: values.sortOrder,
    };

    await onSubmit(payload, selectedImage);
  }

  // ==========================================
  // DADOS AUXILIARES
  // ==========================================

  const availableSizes = sizes.filter(
    (size) => size.isActive,
  );

  const flavorExtra =
    values.additionalPriceCents +
    (values.isPremium
      ? values.premiumAdditionalCents
      : 0);

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
              ? "Editar sabor de pizza"
              : "Cadastrar sabor de pizza"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Configure os ingredientes, valores e
            tamanhos disponíveis para este sabor.
          </p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
          <Pizza size={22} />
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

        {/* DADOS PRINCIPAIS */}

        <div className="space-y-4">
          <h4 className="text-base font-black text-slate-900">
            Informações do sabor
          </h4>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pizza-flavor-name"
                className={labelClass}
              >
                Nome do sabor
              </label>

              <input
                id="pizza-flavor-name"
                required
                maxLength={100}
                disabled={saving}
                value={values.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value,
                  )
                }
                placeholder="Ex.: Calabresa"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="pizza-flavor-subcategory"
                className={labelClass}
              >
                Tipo de sabor
              </label>

              <select
                id="pizza-flavor-subcategory"
                required
                disabled={saving}
                value={values.subcategoryId || ""}
                onChange={(event) =>
                  updateField(
                    "subcategoryId",
                    Number(event.target.value),
                  )
                }
                className={inputClass}
              >
                <option value="">
                  Selecione uma subcategoria
                </option>

                {subcategories
                  .filter(
                    (subcategory) =>
                      subcategory.isActive ||
                      subcategory.id ===
                        initialData?.subcategoryId,
                  )
                  .map((subcategory) => (
                    <option
                      key={subcategory.id}
                      value={subcategory.id}
                    >
                      {subcategory.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="pizza-flavor-description"
                className={labelClass}
              >
                Descrição e ingredientes
              </label>

              <textarea
                id="pizza-flavor-description"
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
                placeholder="Ex.: Mussarela, calabresa fatiada, cebola e orégano."
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        </div>

        {/* IMAGEM */}

        <div className="border-t border-slate-100 pt-6">
          <PizzaImageUpload
            label="Imagem do sabor"
            description="Utilize uma foto da pizza pronta com os ingredientes deste sabor. JPG, PNG ou WebP, até 5 MB."
            imageUrl={values.imageUrl}
            selectedFile={selectedImage}
            onFileChange={setSelectedImage}
            disabled={saving}
          />
        </div>

        {/* PREÇOS */}

        <div className="space-y-5 border-t border-slate-100 pt-6">
          <div>
            <h4 className="text-base font-black text-slate-900">
              Acréscimos de preço
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Esses valores serão somados ao preço-base
              do tamanho escolhido pelo cliente.
            </p>
          </div>

          <CurrencyInput
            id="pizza-flavor-additional-price"
            label="Acréscimo do sabor"
            disabled={saving}
            value={values.additionalPriceCents}
            onChange={(value) =>
              updateField(
                "additionalPriceCents",
                value,
              )
            }
            minCents={0}
          />

          {/* SABOR NOBRE */}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                disabled={saving}
                checked={values.isPremium}
                onChange={(event) =>
                  updateField(
                    "isPremium",
                    event.target.checked,
                  )
                }
                className="mt-1 size-4 accent-orange-600"
              />

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Crown
                    size={18}
                    className="text-amber-700"
                  />

                  <span className="text-sm font-bold text-amber-950">
                    Sabor nobre
                  </span>
                </div>

                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  Ative quando o sabor utilizar
                  ingredientes especiais e possuir
                  um acréscimo adicional.
                </p>
              </div>
            </label>

            {values.isPremium && (
              <div className="mt-4 border-t border-amber-200 pt-4">
                <CurrencyInput
                  id="pizza-flavor-premium-price"
                  label="Acréscimo adicional do sabor nobre"
                  disabled={saving}
                  value={
                    values.premiumAdditionalCents
                  }
                  onChange={(value) =>
                    updateField(
                      "premiumAdditionalCents",
                      value,
                    )
                  }
                  minCents={0}
                />
              </div>
            )}
          </div>

          {/* RESUMO */}

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
              Acréscimo total deste sabor
            </p>

            <p className="mt-1 text-2xl font-black text-orange-950">
              {formatCurrency(flavorExtra)}
            </p>

            <p className="mt-1 text-xs text-orange-800">
              Este valor será somado ao preço-base da
              pizza, sem incluir outros sabores ou
              adicionais.
            </p>
          </div>
        </div>

        {/* TAMANHOS PERMITIDOS */}

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div>
            <h4 className="text-base font-black text-slate-900">
              Tamanhos permitidos
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Defina em quais tamanhos este sabor
              poderá ser selecionado.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              disabled={saving}
              checked={values.allSizes}
              onChange={(event) =>
                updateField(
                  "allSizes",
                  event.target.checked,
                )
              }
              className="size-4 accent-orange-600"
            />

            <div>
              <p className="text-sm font-bold text-slate-800">
                Disponível para todos os tamanhos
              </p>

              <p className="text-xs text-slate-500">
                Inclui tamanhos cadastrados futuramente.
              </p>
            </div>
          </label>

          {!values.allSizes && (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableSizes.length === 0 ? (
                <p className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Nenhum tamanho ativo encontrado.
                  Cadastre ou ative um tamanho antes
                  de restringir este sabor.
                </p>
              ) : (
                availableSizes.map((size) => (
                  <label
                    key={size.id}
                    className={`
                      flex cursor-pointer items-center
                      gap-3 rounded-xl border p-4
                      transition
                      ${
                        values.sizeIds.includes(size.id)
                          ? "border-orange-300 bg-orange-50"
                          : "border-slate-200 bg-white hover:border-orange-200"
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      disabled={saving}
                      checked={values.sizeIds.includes(
                        size.id,
                      )}
                      onChange={() =>
                        toggleSize(size.id)
                      }
                      className="size-4 accent-orange-600"
                    />

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {size.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {size.slices} fatias
                        {size.diameterCm !== null
                          ? ` · ${size.diameterCm} cm`
                          : ""}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* CONFIGURAÇÕES */}

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
                  Sabor ativo
                </p>

                <p className="text-xs text-slate-500">
                  Permite utilizar este sabor no
                  catálogo.
                </p>
              </div>
            </label>

            <div>
              <label
                htmlFor="pizza-flavor-sort-order"
                className={labelClass}
              >
                Ordem de exibição
              </label>

              <input
                id="pizza-flavor-sort-order"
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
          </div>
        </div>

        {/* AÇÕES */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500">
            {editing
              ? `Editando sabor #${initialData?.id}`
              : "Novo sabor de pizza"}
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
                  : "Cadastrar sabor"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

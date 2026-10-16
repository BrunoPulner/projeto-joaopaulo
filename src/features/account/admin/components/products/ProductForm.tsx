import {
  Check,
  ImagePlus,
  LoaderCircle,
  Package,
  RotateCcw,
  X,
} from "lucide-react";

import type {
  AdminCategory,
  AdminSubcategory,
} from "../../api/products.api";
import { CurrencyInput } from "./CurrencyInput";
import { formatCurrency } from "./currency.utils";

export interface CommonProductFormValues {
  name: string;
  description: string;
  priceCents: number;
  subcategoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  // null para produtos sem estoque; inteiro >= 0 para bebidas.
  stockQuantity?: number | null;
}

interface ProductFormProps {
  category: AdminCategory;
  subcategories: AdminSubcategory[];
  values: CommonProductFormValues;
  onChange: (values: CommonProductFormValues) => void;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
  onImageChange: (file: File | null) => void;
  selectedImage: File | null;
  previewUrl: string | null;
  saving?: boolean;
  editing?: boolean;
  error?: string;
}

const inputClass = [
  "min-h-12 w-full rounded-xl",
  "border border-slate-200 bg-white",
  "px-4 py-3 text-sm text-slate-900",
  "outline-none transition",
  "focus:border-sky-500 focus:ring-2 focus:ring-sky-100",
].join(" ");

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

function normalizeSlug(value: string): string {
  return value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoryAllowsAddons(category: AdminCategory) {
  return ["lanche", "lanches", "pastel", "pasteis", "crepe", "crepes"]
    .includes(normalizeSlug(category.slug));
}

function categoryControlsStock(category: AdminCategory) {
  return ["bebida", "bebidas"].includes(normalizeSlug(category.slug));
}

export function ProductForm({
  category,
  subcategories,
  values,
  onChange,
  onSubmit,
  onCancel,
  onImageChange,
  selectedImage,
  previewUrl,
  saving = false,
  editing = false,
  error,
}: ProductFormProps) {
  const availableSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.categoryId === category.id && subcategory.isActive,
  );
  const allowsAddons = categoryAllowsAddons(category);
  const controlsStock = categoryControlsStock(category);
  const stockQuantity = values.stockQuantity;
  const stockIsValid =
    !controlsStock ||
    (typeof stockQuantity === "number" &&
      Number.isSafeInteger(stockQuantity) &&
      stockQuantity >= 0);

  const updateField = <K extends keyof CommonProductFormValues>(
    field: K,
    value: CommonProductFormValues[K],
  ) => {
    onChange({ ...values, [field]: value });
  };

  const imageSource = previewUrl || values.imageUrl;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
              {category.name}
            </span>
            <h3 className="mt-1 text-xl font-black text-slate-900">
              {editing ? "Editar produto" : "Cadastrar produto"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Preencha as informações do produto.
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Package size={22} />
          </div>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!stockIsValid) return;
          void onSubmit();
        }}
        className="space-y-6 p-5 sm:p-6"
      >
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="common-product-name" className={labelClass}>
              Nome do produto
            </label>
            <input
              id="common-product-name"
              required
              maxLength={100}
              disabled={saving}
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder={controlsStock ? "Ex.: Coca-Cola Lata 350 ml" : "Ex.: X-Bacon"}
              className={inputClass}
            />
          </div>

          {availableSubcategories.length > 0 && (
            <div>
              <label htmlFor="common-product-subcategory" className={labelClass}>
                Tipo do produto
              </label>
              <select
                id="common-product-subcategory"
                required
                disabled={saving}
                value={values.subcategoryId}
                onChange={(event) => updateField("subcategoryId", event.target.value)}
                className={inputClass}
              >
                <option value="">Selecione um tipo</option>
                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <CurrencyInput
              id="common-product-price"
              label="Preço do produto"
              required
              disabled={saving}
              value={values.priceCents}
              onChange={(value) => updateField("priceCents", value)}
              minCents={1}
            />
          </div>

          {controlsStock && (
            <div>
              <label htmlFor="common-product-stock" className={labelClass}>
                Quantidade em estoque <span className="text-rose-600">*</span>
              </label>
              <input
                id="common-product-stock"
                type="number"
                min={0}
                max={2147483647}
                step={1}
                inputMode="numeric"
                required
                disabled={saving}
                value={stockQuantity ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (raw === "") {
                    updateField("stockQuantity", null);
                    return;
                  }
                  if (!/^\d+$/.test(raw)) return;
                  const quantity = Number(raw);
                  if (Number.isSafeInteger(quantity) && quantity <= 2147483647) {
                    updateField("stockQuantity", quantity);
                  }
                }}
                placeholder="Ex.: 24"
                className={inputClass}
              />
              <p className="mt-2 text-xs text-slate-500">
                Informe a quantidade disponível. Zero significa bebida esgotada.
              </p>
              {stockQuantity === 0 ? (
                <p className="mt-2 text-xs font-bold text-rose-600">Estoque esgotado</p>
              ) : typeof stockQuantity === "number" && stockQuantity <= 5 ? (
                <p className="mt-2 text-xs font-bold text-amber-700">Estoque baixo: {stockQuantity} unidade(s)</p>
              ) : typeof stockQuantity === "number" ? (
                <p className="mt-2 text-xs font-bold text-emerald-700">{stockQuantity} unidade(s) disponíveis</p>
              ) : (
                <p className="mt-2 text-xs font-medium text-rose-600">Informe a quantidade para continuar.</p>
              )}
            </div>
          )}

          <div className="sm:col-span-2">
            <label htmlFor="common-product-description" className={labelClass}>
              Descrição e ingredientes
            </label>
            <textarea
              id="common-product-description"
              rows={3}
              disabled={saving}
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Descreva o produto e seus ingredientes."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="common-product-image" className={labelClass}>
              Imagem do produto
            </label>
            <label
              htmlFor="common-product-image"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-sky-300 bg-sky-50 px-4 py-5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
            >
              <ImagePlus size={22} />
              {selectedImage ? selectedImage.name : "Selecionar imagem do computador"}
            </label>
            <input
              id="common-product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={saving}
              onChange={(event) => {
                onImageChange(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
              className="sr-only"
            />
            <p className="mt-2 text-xs text-slate-500">JPG, PNG ou WebP, até 5 MB.</p>
            {selectedImage && (
              <button
                type="button"
                disabled={saving}
                onClick={() => onImageChange(null)}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
              >
                <X size={14} />
                Remover imagem selecionada
              </button>
            )}
            {imageSource && (
              <div className="mt-4">
                <img
                  src={imageSource}
                  alt={values.name || "Prévia do produto"}
                  className="h-40 w-52 rounded-xl border border-slate-200 object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <h4 className="mb-3 text-sm font-bold text-slate-900">Configurações do produto</h4>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                disabled={saving}
                checked={values.isAvailable}
                onChange={(event) => updateField("isAvailable", event.target.checked)}
                className="size-4 accent-sky-600"
              />
              Disponível para venda
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                disabled={saving}
                checked={values.isFeatured}
                onChange={(event) => updateField("isFeatured", event.target.checked)}
                className="size-4 accent-sky-600"
              />
              Produto em destaque
            </label>
          </div>
          {controlsStock && (
            <p className="mt-3 text-xs text-slate-500">
              Mesmo com a opção disponível para venda marcada, bebidas com estoque zero deverão ser bloqueadas no checkout.
            </p>
          )}
        </div>

        {allowsAddons && (
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
            <h4 className="text-sm font-bold text-violet-900">Adicionais do produto</h4>
            <p className="mt-1 text-xs leading-relaxed text-violet-700">
              Esta categoria permite adicionais. Depois de cadastrar o produto,
              você poderá vincular adicionais como queijo extra e bacon.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500">
            Preço atual: <strong className="text-slate-800">{formatCurrency(values.priceCents)}</strong>
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="min-h-11 rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || values.priceCents < 1 || !stockIsValid}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : editing ? (
                <RotateCcw size={17} />
              ) : (
                <Check size={17} />
              )}
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar produto"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

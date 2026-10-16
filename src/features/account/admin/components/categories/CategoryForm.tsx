
import {
  useState,
  type FormEvent,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  FolderPlus,
  LoaderCircle,
  Pencil,
  X,
} from "lucide-react";

// ============================================
// TIPOS
// ============================================

export interface CategoryFormValues {
  name: string;
}

interface CategoryFormProps {
  initialValues?: CategoryFormValues;

  editing?: boolean;
  saving?: boolean;
  error?: string;

  onSubmit: (
    values: CategoryFormValues,
  ) => void | Promise<void>;

  onCancel: () => void;
}

// ============================================
// CONFIGURAÇÕES
// ============================================

const MAX_NAME_LENGTH = 100;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CategoryForm({
  initialValues,
  editing = false,
  saving = false,
  error,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  // ==========================================
  // ESTADOS
  // ==========================================

  const [name, setName] = useState(
    initialValues?.name ?? "",
  );

  const [validationError, setValidationError] =
    useState("");

  // ==========================================
  // VALIDAÇÃO
  // ==========================================

  function validate(): boolean {
    const normalizedName = name.trim();

    if (!normalizedName) {
      setValidationError(
        "Informe o nome da categoria.",
      );

      return false;
    }

    if (normalizedName.length < 2) {
      setValidationError(
        "O nome deve conter pelo menos 2 caracteres.",
      );

      return false;
    }

    if (normalizedName.length > MAX_NAME_LENGTH) {
      setValidationError(
        `O nome deve conter no máximo ${MAX_NAME_LENGTH} caracteres.`,
      );

      return false;
    }

    setValidationError("");

    return true;
  }

  // ==========================================
  // ENVIAR FORMULÁRIO
  // ==========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving || !validate()) return;

    await onSubmit({
      name: name.trim(),
    });
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  const displayedError =
    validationError || error;

  return (
    <section className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
      {/* CABEÇALHO */}

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-orange-100 bg-orange-50/60 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700 shadow-sm">
            {editing ? (
              <Pencil size={21} />
            ) : (
              <FolderPlus size={21} />
            )}
          </div>

          <div>
            <h3 className="text-lg font-black text-stone-900">
              {editing
                ? "Editar categoria"
                : "Nova categoria"}
            </h3>

            <p className="mt-1 max-w-lg text-sm leading-relaxed text-stone-500">
              {editing
                ? "Atualize as informações da categoria selecionada."
                : "Cadastre uma nova categoria para organizar os produtos do cardápio."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="Fechar formulário"
          title="Fechar"
          className="flex size-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50 hover:text-stone-800 disabled:opacity-50"
        >
          <X size={18} />
        </button>
      </div>

      {/* FORMULÁRIO */}

      <form
        onSubmit={(event) =>
          void handleSubmit(event)
        }
        className="space-y-6 p-5 sm:p-6"
      >
        {/* CAMPO NOME */}

        <div>
          <label
            htmlFor="category-name"
            className="mb-2 block text-sm font-bold text-stone-800"
          >
            Nome da categoria
            <span className="ml-1 text-red-600">
              *
            </span>
          </label>

          <input
            id="category-name"
            name="name"
            type="text"
            autoComplete="off"
            autoFocus
            required
            minLength={2}
            maxLength={MAX_NAME_LENGTH}
            value={name}
            disabled={saving}
            onChange={(event) => {
              setName(event.target.value);

              if (validationError) {
                setValidationError("");
              }
            }}
            placeholder="Ex.: Pizzas, Bebidas, Lanches..."
            aria-invalid={Boolean(displayedError)}
            aria-describedby={
              displayedError
                ? "category-form-error"
                : "category-name-help"
            }
            className={`
              min-h-12 w-full rounded-xl border
              bg-white px-4 text-sm
              text-stone-900 outline-none
              transition
              placeholder:text-stone-400
              disabled:cursor-not-allowed
              disabled:opacity-60

              ${
                displayedError
                  ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : "border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              }
            `}
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <p
              id="category-name-help"
              className="text-xs text-stone-500"
            >
              Utilize um nome claro para identificar
              a categoria.
            </p>

            <span className="shrink-0 text-xs tabular-nums text-stone-400">
              {name.length}/{MAX_NAME_LENGTH}
            </span>
          </div>
        </div>

        {/* MENSAGENS DE ERRO */}

        {displayedError && (
          <div
            id="category-form-error"
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <p className="text-sm leading-relaxed text-red-700">
              {displayedError}
            </p>
          </div>
        )}

        {/* INFORMAÇÃO */}

        <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-xs leading-relaxed text-stone-500">
            As subcategorias poderão ser gerenciadas
            diretamente no card da categoria após
            salvar as alterações.
          </p>
        </div>

        {/* BOTÕES */}

        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 text-sm font-bold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
          >
            <ArrowLeft size={17} />
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />

                Salvando...
              </>
            ) : (
              <>
                <Check size={18} />

                {editing
                  ? "Salvar alterações"
                  : "Cadastrar categoria"}
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

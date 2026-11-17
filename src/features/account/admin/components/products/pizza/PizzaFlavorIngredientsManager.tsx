
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  AlertCircle,
  Check,
  ChefHat,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import {
  pizzaFlavorIngredientsApi,
  type PizzaFlavorIngredient,
} from "../../../api/pizza-catalog.api";

// ============================================
// TIPOS
// ============================================

interface PizzaFlavorIngredientsManagerProps {
  pizzaFlavorId: number;
  pizzaFlavorName: string;
}

interface IngredientFormValues {
  name: string;
  isRemovable: boolean;
  sortOrder: number;
}

const emptyForm: IngredientFormValues = {
  name: "",
  isRemovable: true,
  sortOrder: 0,
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-50";

// ============================================
// COMPONENTE
// ============================================

export function PizzaFlavorIngredientsManager({
  pizzaFlavorId,
  pizzaFlavorName,
}: PizzaFlavorIngredientsManagerProps) {
  const [ingredients, setIngredients] = useState<
    PizzaFlavorIngredient[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<
    number | null
  >(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<
    number | null
  >(null);

  const [form, setForm] =
    useState<IngredientFormValues>(emptyForm);

  const [reloadKey, setReloadKey] = useState(0);

  
  
  // ==========================================
  // CARREGAR INGREDIENTES
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    async function fetchIngredients() {
      try {
        const data = await pizzaFlavorIngredientsApi.list(
          pizzaFlavorId,
        );

        if (cancelled) return;

        setIngredients(
          [...data].sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.id - b.id,
          ),
        );
        setError("");
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os ingredientes.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchIngredients();

    return () => {
      cancelled = true;
    };
  }, [pizzaFlavorId, reloadKey]);

  function refreshIngredients() {
    setLoading(true);
    setError("");
    setReloadKey((value) => value + 1);
  }

  // ==========================================
  // FORMULÁRIO
  // ==========================================

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sortOrder: ingredients.length + 1,
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    ingredient: PizzaFlavorIngredient,
  ) {
    setEditingId(ingredient.id);

    setForm({
      name: ingredient.name,
      isRemovable: ingredient.isRemovable,
      sortOrder: ingredient.sortOrder,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  // ==========================================
  // SALVAR
  // ==========================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) return;

    const name = form.name.trim();

    if (!name || name.length > 120) {
      setError(
        "Informe um ingrediente com até 120 caracteres.",
      );
      return;
    }

    if (
      !Number.isInteger(form.sortOrder) ||
      form.sortOrder < 0 ||
      form.sortOrder > 2147483647
    ) {
      setError("Informe uma ordem válida.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name,
        isRemovable: form.isRemovable,
        sortOrder: form.sortOrder,
      };

      if (editingId !== null) {
        await pizzaFlavorIngredientsApi.update(
          editingId,
          payload,
        );

        setSuccess(
          "Ingrediente atualizado com sucesso.",
        );
      } else {
        await pizzaFlavorIngredientsApi.create(
          pizzaFlavorId,
          payload,
        );

        setSuccess(
          "Ingrediente cadastrado com sucesso.",
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o ingrediente.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // EXCLUIR
  // ==========================================

  async function handleDelete(
    ingredient: PizzaFlavorIngredient,
  ) {
    if (saving || deletingId !== null) return;

    const confirmed = window.confirm(
      `Deseja excluir o ingrediente "${ingredient.name}" do sabor "${pizzaFlavorName}"?`,
    );

    if (!confirmed) return;

    setDeletingId(ingredient.id);
    setError("");
    setSuccess("");

    try {
      await pizzaFlavorIngredientsApi.remove(
        ingredient.id,
      );

      setSuccess(
        "Ingrediente excluído com sucesso.",
      );

      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o ingrediente.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      {/* CABEÇALHO */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
            <ChefHat size={22} />
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900">
              Ingredientes do sabor
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Configure os ingredientes de{" "}
              <strong>{pizzaFlavorName}</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            {ingredients.length} ingredientes
          </span>

          <button
            type="button"
            onClick={refreshIngredients}
            disabled={loading || saving}
            aria-label="Atualizar ingredientes"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading ? "animate-spin" : ""
              }
            />
          </button>
        </div>
      </div>

      {/* MENSAGENS */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle
            size={18}
            className="shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <Check size={18} />
          {success}
        </div>
      )}

      {/* LISTAGEM */}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
          <LoaderCircle
            size={20}
            className="animate-spin"
          />
          Carregando ingredientes...
        </div>
      ) : ingredients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <ChefHat
            size={30}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-bold text-slate-700">
            Nenhum ingrediente cadastrado
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Adicione os ingredientes utilizados
            neste sabor de pizza.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition hover:border-orange-200"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-slate-500">
                  {ingredient.sortOrder}
                </div>

                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-bold text-slate-800">
                    {ingredient.name}
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      ingredient.isRemovable
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {ingredient.isRemovable
                      ? "Removível"
                      : "Obrigatório"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openEditForm(ingredient)
                  }
                  disabled={saving || deletingId !== null}
                  aria-label={`Editar ${ingredient.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:text-orange-700 disabled:opacity-50"
                >
                  <Pencil size={15} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(ingredient)
                  }
                  disabled={saving || deletingId !== null}
                  aria-label={`Excluir ${ingredient.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === ingredient.id ? (
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORMULÁRIO */}

      {showForm ? (
        <form
          onSubmit={(event) =>
            void handleSubmit(event)
          }
          className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/40 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-black text-slate-800">
              {editingId !== null
                ? "Editar ingrediente"
                : "Novo ingrediente"}
            </h4>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              aria-label="Fechar formulário"
              className="text-slate-500 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          <div>
            <label
              htmlFor="pizza-ingredient-name"
              className="mb-2 block text-xs font-bold text-slate-700"
            >
              Nome do ingrediente
            </label>

            <input
              id="pizza-ingredient-name"
              type="text"
              maxLength={120}
              required
              disabled={saving}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Ex.: Mussarela"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="pizza-ingredient-order"
              className="mb-2 block text-xs font-bold text-slate-700"
            >
              Ordem de exibição
            </label>

            <input
              id="pizza-ingredient-order"
              type="number"
              min={0}
              max={2147483647}
              step={1}
              required
              disabled={saving}
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sortOrder: Number(
                    event.target.value,
                  ),
                }))
              }
              className={inputClass}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              checked={form.isRemovable}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isRemovable:
                    event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 accent-orange-700"
            />

            <div>
              <p className="text-sm font-bold text-slate-800">
                Permitir remover ingrediente
              </p>

              <p className="mt-1 text-xs text-slate-500">
                O cliente poderá solicitar a pizza
                sem este ingrediente.
              </p>
            </div>
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-800 disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Check size={16} />
              )}

              {saving
                ? "Salvando..."
                : editingId !== null
                  ? "Salvar alterações"
                  : "Adicionar"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={openCreateForm}
          disabled={saving || deletingId !== null}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 text-sm font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
        >
          <Plus size={18} />
          Adicionar ingrediente
        </button>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Os ingredientes cadastrados serão
        apresentados ao cliente nos detalhes
        deste sabor. Ingredientes obrigatórios
        não poderão ser removidos.
      </p>
    </section>
  );
}

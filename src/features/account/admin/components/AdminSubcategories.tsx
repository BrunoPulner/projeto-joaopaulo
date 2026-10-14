
import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import {
  subcategoriesApi,
  type AdminSubcategory,
} from "../api/subcategories.api";

type Props = {
  categoryId: number;
  categoryName: string;
};

export function AdminSubcategories({
  categoryId,
  categoryName,
}: Props) {
  const [subcategories, setSubcategories] = useState<
    AdminSubcategory[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await subcategoriesApi.listAdmin(categoryId);

        if (!cancelled) {
          setSubcategories(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar subcategorias.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setName("");
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function openEdit(subcategory: AdminSubcategory) {
    setEditingId(subcategory.id);
    setName(subcategory.name);
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const normalizedName = name.trim().replace(/\s+/g, " ");

    if (normalizedName.length < 2) {
      setError("Informe pelo menos 2 caracteres.");
      return;
    }

    const duplicate = subcategories.some(
      (item) =>
        item.id !== editingId &&
        item.name.toLocaleLowerCase("pt-BR") ===
          normalizedName.toLocaleLowerCase("pt-BR"),
    );

    if (duplicate) {
      setError("Já existe uma subcategoria com esse nome.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId !== null) {
        const updated = await subcategoriesApi.update(editingId, {
          name: normalizedName,
        });

        setSubcategories((current) =>
          current.map((item) =>
            item.id === editingId ? updated : item,
          ),
        );

        setMessage("Subcategoria atualizada com sucesso.");
      } else {
        const created = await subcategoriesApi.create(
          categoryId,
          normalizedName,
        );

        setSubcategories((current) =>
          [...current, created].sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.name.localeCompare(b.name, "pt-BR"),
          ),
        );

        setMessage("Subcategoria cadastrada com sucesso.");
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a subcategoria.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(subcategory: AdminSubcategory) {
    if (processingId !== null) return;

    if (
      !window.confirm(
        `Deseja desativar "${subcategory.name}" de ${categoryName}?`,
      )
    ) {
      return;
    }

    setProcessingId(subcategory.id);
    setError("");
    setMessage("");

    try {
      const result = await subcategoriesApi.deactivate(
        subcategory.id,
      );

      setSubcategories((current) =>
        current.map((item) =>
          item.id === subcategory.id
            ? result.subcategory
            : item,
        ),
      );

      if (editingId === subcategory.id) resetForm();

      setMessage("Subcategoria desativada com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível desativar a subcategoria.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReactivate(subcategory: AdminSubcategory) {
    if (processingId !== null) return;

    setProcessingId(subcategory.id);
    setError("");
    setMessage("");

    try {
      const updated = await subcategoriesApi.update(
        subcategory.id,
        { isActive: true },
      );

      setSubcategories((current) =>
        current.map((item) =>
          item.id === subcategory.id ? updated : item,
        ),
      );

      setMessage("Subcategoria reativada com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível reativar a subcategoria.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="border-t border-orange-100 bg-orange-50/40 px-5 py-5 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-stone-800">
            Subcategorias de {categoryName}
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Organize os filtros exibidos no cardápio.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={loading || saving || processingId !== null}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 text-xs font-bold text-orange-800 transition hover:bg-orange-50 disabled:opacity-50"
        >
          <Plus size={16} />
          Adicionar subcategoria
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSave}
          className="mb-4 rounded-xl border border-orange-200 bg-white p-4"
        >
          <label
            htmlFor={`subcategory-name-${categoryId}`}
            className="mb-2 block text-xs font-bold text-stone-700"
          >
            {editingId !== null
              ? "Editar subcategoria"
              : "Nome da subcategoria"}
          </label>

          <div className="flex flex-wrap gap-2">
            <input
              id={`subcategory-name-${categoryId}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Salgados"
              minLength={2}
              maxLength={100}
              required
              disabled={saving}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-orange-700"
            />

            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-xs font-bold text-white hover:bg-orange-800 disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Salvar
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              aria-label="Cancelar edição"
              className="flex size-11 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
            >
              <X size={17} />
            </button>
          </div>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="mb-3 rounded-lg bg-white px-3 py-2 text-xs font-medium text-green-700"
        >
          {message}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-stone-500">
          <LoaderCircle size={16} className="animate-spin" />
          Carregando subcategorias...
        </div>
      ) : subcategories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 bg-white p-4 text-sm text-stone-500">
          Nenhuma subcategoria cadastrada.
        </p>
      ) : (
        <ul className="space-y-2">
          {subcategories.map((subcategory) => (
            <li
              key={subcategory.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-stone-800">
                  {subcategory.name}
                </p>

                <p
                  className={`mt-1 text-xs font-semibold ${
                    subcategory.isActive
                      ? "text-green-700"
                      : "text-stone-400"
                  }`}
                >
                  {subcategory.isActive ? "Ativa" : "Desativada"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(subcategory)}
                  disabled={saving || processingId !== null}
                  aria-label={`Editar ${subcategory.name}`}
                  className="flex size-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-orange-50 disabled:opacity-50"
                >
                  <Pencil size={16} />
                </button>

                {subcategory.isActive ? (
                  <button
                    type="button"
                    onClick={() => void handleDeactivate(subcategory)}
                    disabled={saving || processingId !== null}
                    aria-label={`Desativar ${subcategory.name}`}
                    className="flex size-9 items-center justify-center rounded-lg border border-red-100 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {processingId === subcategory.id ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleReactivate(subcategory)}
                    disabled={saving || processingId !== null}
                    aria-label={`Reativar ${subcategory.name}`}
                    className="flex size-9 items-center justify-center rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"
                  >
                    {processingId === subcategory.id ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <RotateCcw size={16} />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

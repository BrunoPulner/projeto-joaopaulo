
import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shapes,
  Trash2,
  X,
} from "lucide-react";
import {
  categoriesApi,
  type AdminCategory,
} from "../api/categories.api";
import { AdminSubcategories } from "./AdminSubcategories";
export function AdminDashboardCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const data = await categoriesApi.listAdmin();
        if (!cancelled) {
          setCategories(data);
          setLoadError("");
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar as categorias.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);
  const visibleCategories = categories.filter((category) =>
    category.name
      .toLocaleLowerCase("pt-BR")
      .includes(search.trim().toLocaleLowerCase("pt-BR")),
  );
  const activeCount = categories.filter(
    (category) => category.isActive,
  ).length;
  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setName("");
    setError("");
  }
  function openCreateForm() {
    setEditingId(null);
    setName("");
    setError("");
    setMessage("");
    setFormOpen(true);
  }
  function openEditForm(category: AdminCategory) {
    setEditingId(category.id);
    setName(category.name);
    setError("");
    setMessage("");
    setFormOpen(true);
  }
  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const normalizedName = name.trim().replace(/\s+/g, " ");
    if (normalizedName.length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    const duplicate = categories.some(
      (category) =>
        category.id !== editingId &&
        category.name.toLocaleLowerCase("pt-BR") ===
          normalizedName.toLocaleLowerCase("pt-BR"),
    );
    if (duplicate) {
      setError("Já existe uma categoria com esse nome.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (editingId !== null) {
        const updated = await categoriesApi.update(editingId, {
          name: normalizedName,
        });
        setCategories((current) =>
          current.map((category) =>
            category.id === editingId ? updated : category,
          ),
        );
        setMessage("Categoria atualizada com sucesso.");
      } else {
        const created = await categoriesApi.create(normalizedName);
        setCategories((current) =>
          [...current, created].sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.name.localeCompare(b.name, "pt-BR"),
          ),
        );
        setMessage("Categoria cadastrada no Neon com sucesso.");
      }
      closeForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a categoria.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleDeactivate(category: AdminCategory) {
    if (processingId !== null) return;
    const confirmed = window.confirm(
      `Deseja desativar a categoria "${category.name}"?\n\nEla deixará de aparecer no cardápio público.`,
    );
    if (!confirmed) return;
    setProcessingId(category.id);
    setMessage("");
    setLoadError("");
    try {
      const result = await categoriesApi.deactivate(category.id);
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? result.category : item,
        ),
      );
      if (editingId === category.id) closeForm();
      setMessage("Categoria desativada com sucesso.");
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível desativar a categoria.",
      );
    } finally {
      setProcessingId(null);
    }
  }
  async function handleReactivate(category: AdminCategory) {
    if (processingId !== null) return;
    setProcessingId(category.id);
    setMessage("");
    setLoadError("");
    try {
      const updated = await categoriesApi.update(category.id, {
        isActive: true,
      });
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? updated : item,
        ),
      );
      setMessage("Categoria reativada com sucesso.");
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível reativar a categoria.",
      );
    } finally {
      setProcessingId(null);
    }
  }
  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <section className="flex flex-col gap-5 rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-2xl font-black sm:text-3xl">
            Categorias do cardápio
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-orange-50">
            Organize as categorias para seus clientes encontrarem
            os produtos com facilidade.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          disabled={loading || !!loadError}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-800 transition hover:bg-orange-50 disabled:opacity-50"
        >
          <Plus size={19} aria-hidden="true" />
          Nova categoria
        </button>
      </section>
      {/* FORMULÁRIO */}
      {formOpen && (
        <section
          aria-labelledby="category-form-title"
          className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2
              id="category-form-title"
              className="text-lg font-black text-stone-900"
            >
              {editingId !== null
                ? "Editar categoria"
                : "Nova categoria"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              aria-label="Fechar formulário"
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="category-name"
                className="mb-2 block text-sm font-semibold text-stone-700"
              >
                Nome da categoria
              </label>
              <input
                id="category-name"
                autoFocus
                required
                minLength={2}
                maxLength={100}
                value={name}
                disabled={saving}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                aria-invalid={!!error}
                placeholder="Ex.: Porções"
                className="min-h-12 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-700/10 disabled:opacity-60"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="min-h-11 rounded-xl border border-stone-200 px-5 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                {saving
                  ? "Salvando..."
                  : editingId !== null
                    ? "Salvar alterações"
                    : "Adicionar categoria"}
              </button>
            </div>
          </form>
        </section>
      )}
      {/* MENSAGENS */}
      {message && (
        <p
          role="status"
          className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-medium text-stone-700"
        >
          {message}
        </p>
      )}
      {loadError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {loadError}
        </p>
      )}
      {/* LISTAGEM */}
      <section
        aria-labelledby="category-list-title"
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2
              id="category-list-title"
              className="text-lg font-black text-stone-900"
            >
              Categorias cadastradas
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {activeCount} ativas de {categories.length} cadastradas
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              aria-label="Buscar categoria"
              placeholder="Buscar categoria..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-stone-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-700/10"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-14 text-stone-500">
            <LoaderCircle size={22} className="animate-spin" />
            Carregando categorias...
          </div>
        ) : loadError && categories.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-stone-500">
            Não foi possível carregar as categorias.
          </div>
        ) : visibleCategories.length > 0 ? (
          <ul className="divide-y divide-stone-100">
{visibleCategories.map((category) => {
  return (
    <li key={category.id}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
            <Shapes size={21} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="wrap-break-word font-bold text-stone-800">
              {category.name}
            </p>
            <p
              className={`mt-1 text-xs font-semibold ${
                category.isActive
                  ? "text-green-700"
                  : "text-stone-400"
              }`}
            >
              {category.isActive ? "Ativa" : "Desativada"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => openEditForm(category)}
            disabled={processingId !== null}
            aria-label={`Editar ${category.name}`}
            title="Editar categoria"
            className="flex size-11 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50"
          >
            <Pencil size={18} />
          </button>
          {category.isActive ? (
            <button
              type="button"
              onClick={() => void handleDeactivate(category)}
              disabled={processingId !== null}
              aria-label={`Desativar ${category.name}`}
              title="Desativar categoria"
              className="flex size-11 items-center justify-center rounded-xl border border-red-100 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              {processingId === category.id ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleReactivate(category)}
              disabled={processingId !== null}
              aria-label={`Reativar ${category.name}`}
              title="Reativar categoria"
              className="flex size-11 items-center justify-center rounded-xl border border-green-200 text-green-700 transition hover:bg-green-50 disabled:opacity-50"
            >
              {processingId === category.id ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <RotateCcw size={18} />
              )}
            </button>
          )}
        </div>
      </div>
      <AdminSubcategories
        categoryId={category.id}
        categoryName={category.name}
      />
    </li>
  );
})}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <Shapes
              size={30}
              aria-hidden="true"
              className="mx-auto text-orange-300"
            />
            <p className="mt-4 font-semibold text-stone-700">
              {search.trim()
                ? "Nenhuma categoria encontrada."
                : "Você ainda não tem categorias cadastradas."}
            </p>
            <p className="mt-2 text-sm text-stone-500">
              {search.trim()
                ? "Experimente buscar por outro nome."
                : "Clique em Nova categoria para começar."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

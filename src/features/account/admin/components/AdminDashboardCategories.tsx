import { useState, type FormEvent } from "react";
import {
  Check,
  Pencil,
  Plus,
  Search,
  Shapes,
  Trash2,
  X,
} from "lucide-react";

import {
  categories as catalogCategories,
  type Category,
} from "../../../catalog/catalogData";

const storageKey = "admin-categories-demo";

function loadCategories(): Category[] {
  try {
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (
        Array.isArray(parsed) &&
        parsed.every(
          (category) =>
            category !== null &&
            typeof category === "object" &&
            typeof category.id === "string" &&
            typeof category.name === "string",
        )
      ) {
        return parsed as Category[];
      }
    }
  } catch {
    // Usa os dados do catálogo quando o armazenamento não puder ser lido.
  }

  return catalogCategories.map((category) => ({ ...category }));
}

function createCategoryId(name: string, existing: Category[]) {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "categoria";

  let id = base;
  let suffix = 2;

  while (existing.some((category) => category.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  return id;
}

export function AdminDashboardCategories() {
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const visibleCategories = categories.filter((category) =>
    category.name.toLocaleLowerCase("pt-BR").includes(
      search.trim().toLocaleLowerCase("pt-BR"),
    ),
  );

  function persist(nextCategories: Category[], successMessage: string) {
    setCategories(nextCategories);

    try {
      localStorage.setItem(storageKey, JSON.stringify(nextCategories));
      setMessage(successMessage);
    } catch {
      setMessage(
        "A alteração foi aplicada nesta tela, mas não pôde ser salva no navegador.",
      );
    }
  }

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

  function openEditForm(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = name.trim().replace(/\s+/g, " ");

    if (!normalizedName) {
      setError("Informe o nome da categoria.");
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

    if (editingId) {
      const nextCategories = categories.map((category) =>
        category.id === editingId
          ? { ...category, name: normalizedName }
          : category,
      );

      persist(nextCategories, "Categoria atualizada.");
    } else {
      const newCategory: Category = {
        id: createCategoryId(normalizedName, categories),
        name: normalizedName,
        
      };

      persist([...categories, newCategory], "Categoria adicionada.");
    }

    closeForm();
  }

  function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `Deseja excluir a categoria "${category.name}" da lista administrativa de demonstração?`,
    );

    if (!confirmed) return;

    persist(
      categories.filter((item) => item.id !== category.id),
      "Categoria excluída.",
    );

    if (editingId === category.id) {
      closeForm();
    }
  }

  return (
    <div className="space-y-6">
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
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-800 transition hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus size={19} aria-hidden="true" />
          Nova categoria
        </button>
      </section>

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
              {editingId ? "Editar categoria" : "Nova categoria"}
            </h2>

            <button
              type="button"
              onClick={closeForm}
              aria-label="Fechar formulário"
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-orange-700"
            >
              <X size={20} aria-hidden="true" />
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
                maxLength={60}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "category-error" : undefined}
                placeholder="Ex.: Porções"
                className="min-h-12 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-700/10"
              />
            </div>

            {error && (
              <p
                id="category-error"
                role="alert"
                className="text-sm font-semibold text-red-700"
              >
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="min-h-11 rounded-xl border border-stone-200 px-5 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-2 text-sm font-bold text-white hover:bg-orange-800"
              >
                <Check size={18} aria-hidden="true" />
                {editingId ? "Salvar alterações" : "Adicionar categoria"}
              </button>
            </div>
          </form>
        </section>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-medium text-stone-700"
        >
          {message}
        </p>
      )}

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
              {categories.length}{" "}
              {categories.length === 1 ? "categoria" : "categorias"}
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

        {visibleCategories.length > 0 ? (
          <ul className="divide-y divide-stone-100">
            {visibleCategories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                    <Shapes size={21} aria-hidden="true" />
                  </span>

                  <p className="wrap-break-word font-bold text-stone-800">
                    {category.name}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(category)}
                    aria-label={`Editar ${category.name}`}
                    title="Editar categoria"
                    className="flex size-11 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-orange-700"
                  >
                    <Pencil size={18} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    aria-label={`Excluir ${category.name}`}
                    title="Excluir categoria"
                    className="flex size-11 items-center justify-center rounded-xl border border-red-100 text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
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
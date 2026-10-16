
import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
} from "lucide-react";

import {
  categoriesApi,
  type AdminCategory,
} from "../api/categories.api";

import {
  CategoriesGrid,
} from "./categories/CategoriesGrid";

import {
  CategoryForm,
  type CategoryFormValues,
} from "./categories/CategoryForm";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function AdminDashboardCategories() {
  // ==========================================
  // ESTADOS
  // ==========================================

  const [categories, setCategories] =
    useState<AdminCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  // ==========================================
  // CARREGAR CATEGORIAS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await categoriesApi.listAdmin();

        if (cancelled) return;

        setCategories(data);
        setLoadError("");
      } catch (err) {
        if (cancelled) return;

        setLoadError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as categorias.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // FILTROS E CONTADORES
  // ==========================================

  const visibleCategories = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return categories.filter((category) =>
      category.name
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedSearch),
    );
  }, [categories, search]);

  const activeCount = useMemo(() => {
    return categories.filter(
      (category) => category.isActive,
    ).length;
  }, [categories]);

  const editingCategory = useMemo(() => {
    if (editingId === null) return null;

    return (
      categories.find(
        (category) => category.id === editingId,
      ) ?? null
    );
  }, [categories, editingId]);

  // ==========================================
  // FECHAR FORMULÁRIO
  // ==========================================

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setError("");
  }

  // ==========================================
  // ABRIR CADASTRO
  // ==========================================

  function openCreateForm() {
    setEditingId(null);
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  // ==========================================
  // ABRIR EDIÇÃO
  // ==========================================

  function openEditForm(category: AdminCategory) {
    setEditingId(category.id);
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  // ==========================================
  // SALVAR CATEGORIA
  // ==========================================

  async function handleSaveCategory(
    values: CategoryFormValues,
  ) {
    if (saving) return;

    const normalizedName = values.name
      .trim()
      .replace(/\s+/g, " ");

    // Validar nome

    if (normalizedName.length < 2) {
      setError(
        "Informe um nome com pelo menos 2 caracteres.",
      );
      return;
    }

    // Evitar categorias duplicadas

    const duplicate = categories.some(
      (category) =>
        category.id !== editingId &&
        category.name.toLocaleLowerCase("pt-BR") ===
          normalizedName.toLocaleLowerCase("pt-BR"),
    );

    if (duplicate) {
      setError(
        "Já existe uma categoria com esse nome.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId !== null) {
        // Atualizar categoria existente

        const updated = await categoriesApi.update(
          editingId,
          {
            name: normalizedName,
          },
        );

        setCategories((current) =>
          current.map((category) =>
            category.id === editingId
              ? updated
              : category,
          ),
        );

        setMessage(
          "Categoria atualizada com sucesso.",
        );
      } else {
        // Cadastrar nova categoria

        const created = await categoriesApi.create(
          normalizedName,
        );

        setCategories((current) =>
          [...current, created].sort(
            (a, b) =>
              a.sortOrder - b.sortOrder ||
              a.name.localeCompare(b.name, "pt-BR"),
          ),
        );

        setMessage(
          "Categoria cadastrada no Neon com sucesso.",
        );
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

  // ==========================================
  // DESATIVAR CATEGORIA
  // ==========================================

  async function handleDeactivate(
    category: AdminCategory,
  ) {
    if (processingId !== null) return;

    const confirmed = window.confirm(
      `Deseja desativar a categoria "${category.name}"?\n\nEla deixará de aparecer no cardápio público.`,
    );

    if (!confirmed) return;

    setProcessingId(category.id);
    setMessage("");
    setLoadError("");

    try {
      const result = await categoriesApi.deactivate(
        category.id,
      );

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? result.category
            : item,
        ),
      );

      if (editingId === category.id) {
        closeForm();
      }

      setMessage(
        "Categoria desativada com sucesso.",
      );
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

  // ==========================================
  // REATIVAR CATEGORIA
  // ==========================================

  async function handleReactivate(
    category: AdminCategory,
  ) {
    if (processingId !== null) return;

    setProcessingId(category.id);
    setMessage("");
    setLoadError("");

    try {
      const updated = await categoriesApi.update(
        category.id,
        {
          isActive: true,
        },
      );

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? updated
            : item,
        ),
      );

      setMessage(
        "Categoria reativada com sucesso.",
      );
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

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <div className="space-y-6">
      {/* =====================================
          CABEÇALHO
      ===================================== */}

      <section className="flex flex-col gap-5 rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-2xl font-black sm:text-3xl">
            Categorias do cardápio
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-orange-50">
            Organize as categorias para seus clientes
            encontrarem os produtos com facilidade.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          disabled={
            loading ||
            Boolean(loadError && categories.length === 0) ||
            saving ||
            processingId !== null
          }
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-800 transition hover:bg-orange-50 disabled:opacity-50"
        >
          <Plus size={19} aria-hidden="true" />
          Nova categoria
        </button>
      </section>

      {/* =====================================
          FORMULÁRIO
      ===================================== */}

      {formOpen && (
        <CategoryForm
          key={editingId ?? "new"}
          initialValues={{
            name: editingCategory?.name ?? "",
          }}
          editing={editingId !== null}
          saving={saving}
          error={error}
          onSubmit={handleSaveCategory}
          onCancel={closeForm}
        />
      )}

      {/* =====================================
          MENSAGENS
      ===================================== */}

      {message && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <p>{message}</p>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <p>{loadError}</p>
        </div>
      )}

      {/* =====================================
          LISTAGEM
      ===================================== */}

      <section
        aria-labelledby="category-list-title"
        className="rounded-2xl border border-stone-200 bg-white shadow-sm"
      >
        {/* CABEÇALHO DA LISTAGEM */}

        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2
              id="category-list-title"
              className="text-lg font-black text-stone-900"
            >
              Categorias cadastradas
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              {activeCount} ativas de{" "}
              {categories.length} cadastradas
            </p>
          </div>

          {/* BUSCA */}

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
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="min-h-11 w-full rounded-xl border border-stone-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-700/10"
            />
          </div>
        </div>

        {/* GRID RESPONSIVO */}

        <div className="p-4 sm:p-6">
          {loadError && categories.length === 0 && !loading ? (
            <div className="rounded-xl border border-dashed border-red-200 bg-red-50 px-6 py-12 text-center">
              <AlertCircle
                size={30}
                className="mx-auto text-red-400"
              />

              <p className="mt-4 font-semibold text-red-800">
                Não foi possível carregar as categorias.
              </p>

              <p className="mt-2 text-sm text-red-600">
                Verifique a conexão com o servidor
                e tente novamente.
              </p>
            </div>
          ) : (
            <CategoriesGrid
              categories={visibleCategories}
              loading={loading}
              disabled={
                saving || processingId !== null
              }
              processingId={processingId}
              search={search}
              onEdit={openEditForm}
              onDeactivate={(category) =>
                void handleDeactivate(category)
              }
              onReactivate={(category) =>
                void handleReactivate(category)
              }
              onCreate={openCreateForm}
            />
          )}
        </div>
      </section>
    </div>
  );
}

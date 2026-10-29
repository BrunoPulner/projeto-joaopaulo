
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Check,
  ChefHat,
  Loader2,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Salad,
  Save,
  Trash2,
  X,
} from "lucide-react";

// ============================================
// CONFIGURAÇÃO
// ============================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

// ============================================
// TIPOS
// ============================================

export type ProductIngredient = {
  id: number;
  productId: number;
  name: string;
  isRemovable: boolean;
  sortOrder: number;
  createdAt: string;
};

type ProductIngredientsManagerProps = {
  productId: number;
};

type IngredientForm = {
  name: string;
  isRemovable: boolean;
};

type ApiError = {
  error?: string;
  message?: string;
};

// ============================================
// FUNÇÕES DA API
// ============================================

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiError;

    throw new Error(
      data.error ||
      data.message ||
      `Erro na requisição (${response.status}).`,
    );
  }

  return response.json() as Promise<T>;
}

function getIngredients(
  productId: number,
  signal?: AbortSignal,
) {
  return request<ProductIngredient[]>(
    `/api/products/${productId}/ingredients`,
    { signal },
  );
}

function createIngredient(
  productId: number,
  data: {
    name: string;
    isRemovable: boolean;
    sortOrder: number;
  },
) {
  return request<ProductIngredient>(
    `/api/products/${productId}/ingredients`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

function updateIngredient(
  id: number,
  data: Partial<IngredientForm>,
) {
  return request<ProductIngredient>(
    `/api/product-ingredients/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

function deleteIngredient(id: number) {
  return request<{ message: string }>(
    `/api/product-ingredients/${id}`,
    {
      method: "DELETE",
    },
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ProductIngredientsManager({
  productId,
}: ProductIngredientsManagerProps) {
  const [ingredients, setIngredients] = useState<
    ProductIngredient[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<
    number | null
  >(null);

  const [deletingId, setDeletingId] = useState<
    number | null
  >(null);

  const [form, setForm] = useState<IngredientForm>({
    name: "",
    isRemovable: true,
  });

  const [editForm, setEditForm] =
    useState<IngredientForm>({
      name: "",
      isRemovable: true,
    });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // CARREGAR INGREDIENTES
  // ==========================================

  
const loadIngredients = useCallback(
  async (signal?: AbortSignal) => {
    try {
      const data = await getIngredients(
        productId,
        signal,
      );

      if (signal?.aborted) return;

      setIngredients(data);
      setError("");
    } catch (err) {
      if (signal?.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar ingredientes.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  },
  [productId],
);


  

useEffect(() => {
  const controller = new AbortController();

  async function fetchInitialIngredients() {
    try {
      const data = await getIngredients(
        productId,
        controller.signal,
      );

      if (controller.signal.aborted) return;

      setIngredients(data);
      setError("");
    } catch (err) {
      if (controller.signal.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar ingredientes.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  void fetchInitialIngredients();

  return () => {
    controller.abort();
  };
}, [productId]);



  // ==========================================
  // ADICIONAR INGREDIENTE
  // ==========================================

  async function handleAddIngredient(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Informe o nome do ingrediente.");
      return;
    }

    if (name.length > 120) {
      setError("O nome deve ter no máximo 120 caracteres.");
      return;
    }

    if (
      ingredients.some(
        (ingredient) =>
          ingredient.name.toLocaleLowerCase("pt-BR") ===
          name.toLocaleLowerCase("pt-BR"),
      )
    ) {
      setError("Esse ingrediente já está cadastrado.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const nextOrder =
        ingredients.reduce(
          (max, ingredient) =>
            Math.max(max, ingredient.sortOrder),
          -1,
        ) + 1;

      const created = await createIngredient(
        productId,
        {
          name,
          isRemovable: form.isRemovable,
          sortOrder: nextOrder,
        },
      );

      setIngredients((current) =>
        [...current, created].sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.id - b.id,
        ),
      );

      setForm({
        name: "",
        isRemovable: true,
      });

      setSuccess("Ingrediente adicionado com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao adicionar ingrediente.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // INICIAR EDIÇÃO
  // ==========================================

  function handleStartEdit(
    ingredient: ProductIngredient,
  ) {
    setEditingId(ingredient.id);

    setEditForm({
      name: ingredient.name,
      isRemovable: ingredient.isRemovable,
    });

    setError("");
    setSuccess("");
  }

  // ==========================================
  // CANCELAR EDIÇÃO
  // ==========================================

  function handleCancelEdit() {
    setEditingId(null);

    setEditForm({
      name: "",
      isRemovable: true,
    });
  }

  // ==========================================
  // SALVAR EDIÇÃO
  // ==========================================

  async function handleSaveEdit(id: number) {
    const name = editForm.name.trim();

    if (!name) {
      setError("Informe o nome do ingrediente.");
      return;
    }

    if (name.length > 120) {
      setError("O nome deve ter no máximo 120 caracteres.");
      return;
    }

    if (
      ingredients.some(
        (ingredient) =>
          ingredient.id !== id &&
          ingredient.name.toLocaleLowerCase("pt-BR") ===
            name.toLocaleLowerCase("pt-BR"),
      )
    ) {
      setError("Esse ingrediente já está cadastrado.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await updateIngredient(id, {
        name,
        isRemovable: editForm.isRemovable,
      });

      setIngredients((current) =>
        current.map((ingredient) =>
          ingredient.id === id
            ? updated
            : ingredient,
        ),
      );

      setEditingId(null);

      setSuccess("Ingrediente atualizado com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar ingrediente.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // ALTERAR PERMISSÃO DE REMOÇÃO
  // ==========================================

  async function handleToggleRemovable(
    ingredient: ProductIngredient,
  ) {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await updateIngredient(
        ingredient.id,
        {
          isRemovable: !ingredient.isRemovable,
        },
      );

      setIngredients((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      setSuccess("Permissão atualizada com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar permissão.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // EXCLUIR INGREDIENTE
  // ==========================================

  async function handleDeleteIngredient(
    ingredient: ProductIngredient,
  ) {
    const confirmed = window.confirm(
      `Deseja excluir o ingrediente "${ingredient.name}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(ingredient.id);
      setError("");
      setSuccess("");

      await deleteIngredient(ingredient.id);

      setIngredients((current) =>
        current.filter(
          (item) => item.id !== ingredient.id,
        ),
      );

      if (editingId === ingredient.id) {
        setEditingId(null);
      }

      setSuccess("Ingrediente excluído com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao excluir ingrediente.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ======================================
          CABEÇALHO
      ====================================== */}

      <div className="border-b border-slate-200 bg-linear-to-r from-emerald-50 via-white to-sky-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Salad size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-slate-900">
              Ingredientes do produto
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Cadastre os ingredientes e defina quais
              podem ser retirados pelo cliente.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
  setLoading(true);
  setError("");
  void loadIngredients();
}}
            disabled={loading || saving || deletingId !== null}
            title="Atualizar ingredientes"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {/* ====================================
            FORMULÁRIO DE CADASTRO
        ==================================== */}

        <form
          onSubmit={handleAddIngredient}
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4"
        >
          <label
            htmlFor="new-ingredient-name"
            className="block text-xs font-bold text-slate-700"
          >
            Adicionar ingrediente
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="new-ingredient-name"
              type="text"
              maxLength={120}
              placeholder="Ex.: Tomate, queijo, alface..."
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />

            <button
              type="submit"
              disabled={
                saving ||
                loading ||
                deletingId !== null ||
                !form.name.trim()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Plus size={16} />
              )}

              Adicionar
            </button>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.isRemovable}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isRemovable: event.target.checked,
                }))
              }
              className="size-4 accent-emerald-600"
            />

            Permitir que o cliente retire este ingrediente
          </label>
        </form>

        {/* ====================================
            MENSAGENS
        ==================================== */}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700"
          >
            <Check size={16} />
            {success}
          </div>
        )}

        {/* ====================================
            LISTAGEM
        ==================================== */}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Ingredientes cadastrados
              </h4>

              <p className="text-xs text-slate-500">
                {ingredients.length} ingrediente(s)
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-10 text-sm text-slate-500">
              <Loader2
                size={18}
                className="animate-spin"
              />
              Carregando ingredientes...
            </div>
          ) : ingredients.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <ChefHat
                size={30}
                className="text-slate-400"
              />

              <p className="mt-3 text-sm font-bold text-slate-700">
                Nenhum ingrediente cadastrado
              </p>

              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Adicione os ingredientes que compõem
                este produto para permitir personalizações.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {ingredients.map((ingredient) => {
                const isEditing =
                  editingId === ingredient.id;

                const isDeleting =
                  deletingId === ingredient.id;

                return (
                  <div
                    key={ingredient.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          maxLength={120}
                          value={editForm.name}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                        />

                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={editForm.isRemovable}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                isRemovable:
                                  event.target.checked,
                              }))
                            }
                            className="size-4 accent-emerald-600"
                          />

                          Permitir remoção
                        </label>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
                          >
                            <X size={14} />
                            Cancelar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleSaveEdit(
                                ingredient.id,
                              )
                            }
                            disabled={
                              saving ||
                              !editForm.name.trim()
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={14} />
                            )}
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          {ingredient.isRemovable ? (
                            <Salad size={17} />
                          ) : (
                            <LockKeyhole size={16} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="wrap-break-word text-sm font-bold text-slate-800">
                            {ingredient.name}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleRemovable(
                                ingredient,
                              )
                            }
                            disabled={
                              saving ||
                              deletingId !== null ||
                              editingId !== null
                            }
                            className={`mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition disabled:opacity-50 ${
                              ingredient.isRemovable
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            {ingredient.isRemovable ? (
                              <>
                                <Check size={11} />
                                Removível
                              </>
                            ) : (
                              <>
                                <LockKeyhole size={11} />
                                Fixo
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            title="Editar ingrediente"
                            onClick={() =>
                              handleStartEdit(ingredient)
                            }
                            disabled={
                              saving ||
                              deletingId !== null ||
                              editingId !== null
                            }
                            className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            title="Excluir ingrediente"
                            onClick={() =>
                              void handleDeleteIngredient(
                                ingredient,
                              )
                            }
                            disabled={
                              saving ||
                              deletingId !== null ||
                              editingId !== null
                            }
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            {isDeleting ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ====================================
            INFORMAÇÃO
        ==================================== */}

        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
          <p className="text-xs leading-relaxed text-sky-800">
            <strong>Como funciona?</strong> Os
            ingredientes cadastrados serão exibidos
            nos detalhes do produto. O cliente poderá
            retirar apenas os ingredientes marcados
            como removíveis.
          </p>
        </div>
      </div>
    </section>
  );
}

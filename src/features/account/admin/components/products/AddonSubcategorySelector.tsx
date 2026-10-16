
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ImageIcon,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Save,
  Tags,
} from "lucide-react";

import {
  productsApi,
  type AdminCategory,
  type AdminSubcategory,
} from "../../api/products.api";

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

interface CategoryWithImage extends AdminCategory {
  imageUrl?: string | null;
}

interface SubcategoryLink {
  id: number;
  addonId: number;
  subcategoryId: number;
  isActive: boolean;
  sortOrder: number;
}

interface CategoryLink {
  id: number;
  addonId: number;
  categoryId: number;
  isActive: boolean;
  sortOrder: number;
}

interface Props {
  addonId: number;
  addonName: string;
}

const HIDDEN_CATEGORIES = ["pizza", "pizzas"];
const BLOCKED_CATEGORIES = ["lanche", "lanches"];

const CARD_STYLES = [
  {
    border: "border-orange-200",
    background: "bg-orange-50/70",
    heading: "bg-orange-100/80",
    accent: "text-orange-800",
    selected: "border-orange-300 bg-orange-100/80",
    checkbox: "accent-orange-600",
  },
  {
    border: "border-rose-200",
    background: "bg-rose-50/70",
    heading: "bg-rose-100/80",
    accent: "text-rose-800",
    selected: "border-rose-300 bg-rose-100/80",
    checkbox: "accent-rose-600",
  },
  {
    border: "border-emerald-200",
    background: "bg-emerald-50/70",
    heading: "bg-emerald-100/80",
    accent: "text-emerald-800",
    selected: "border-emerald-300 bg-emerald-100/80",
    checkbox: "accent-emerald-600",
  },
  {
    border: "border-sky-200",
    background: "bg-sky-50/70",
    heading: "bg-sky-100/80",
    accent: "text-sky-800",
    selected: "border-sky-300 bg-sky-100/80",
    checkbox: "accent-sky-600",
  },
  {
    border: "border-violet-200",
    background: "bg-violet-50/70",
    heading: "bg-violet-100/80",
    accent: "text-violet-800",
    selected: "border-violet-300 bg-violet-100/80",
    checkbox: "accent-violet-600",
  },
];

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Erro HTTP ${response.status}.`;

    throw new Error(message);
  }

  return data as T;
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isHiddenCategory(category: AdminCategory): boolean {
  const slug = normalizeSlug(category.slug || category.name);
  return HIDDEN_CATEGORIES.includes(slug);
}

function isBlockedCategory(category: AdminCategory): boolean {
  const slug = normalizeSlug(category.slug || category.name);
  return BLOCKED_CATEGORIES.includes(slug);
}

function resolveImageUrl(
  imageUrl: string | null | undefined,
): string | null {
  if (!imageUrl) return null;

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${API_URL}${imageUrl}`;
  }

  return null;
}

export function AddonSubcategorySelector({
  addonId,
  addonName,
}: Props) {
  const [categories, setCategories] = useState<
    CategoryWithImage[]
  >([]);

  const [subcategories, setSubcategories] = useState<
    AdminSubcategory[]
  >([]);

  const [selectedCategoryIds, setSelectedCategoryIds] =
    useState<number[]>([]);

  const [selectedSubcategoryIds, setSelectedSubcategoryIds] =
    useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================
  // CARREGAR CATEGORIAS E VÍNCULOS
  // ============================================

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      setSaveError("");
      setSuccess("");

      try {
        const [
          categoryData,
          subcategoryData,
          categoryLinksData,
          subcategoryLinksData,
        ] = await Promise.all([
          productsApi.listCategories(),
          productsApi.listSubcategories(),
          request<{ links: CategoryLink[] }>(
            `/api/addons/admin/${addonId}/categories`,
          ),
          request<{ links: SubcategoryLink[] }>(
            `/api/addons/admin/${addonId}/subcategories`,
          ),
        ]);

        if (cancelled) return;

        setCategories(categoryData);
        setSubcategories(subcategoryData);

        const editableCategoryIds = new Set(
          categoryData
            .filter(
              (category) =>
                category.isActive &&
                !isHiddenCategory(category) &&
                !isBlockedCategory(category),
            )
            .map((category) => category.id),
        );

        const editableSubcategoryIds = new Set(
          subcategoryData
            .filter(
              (subcategory) =>
                subcategory.isActive &&
                editableCategoryIds.has(
                  subcategory.categoryId,
                ),
            )
            .map((subcategory) => subcategory.id),
        );

        setSelectedCategoryIds(
          categoryLinksData.links
            .filter(
              (link) =>
                link.isActive &&
                editableCategoryIds.has(link.categoryId),
            )
            .map((link) => link.categoryId),
        );

        setSelectedSubcategoryIds(
          subcategoryLinksData.links
            .filter(
              (link) =>
                link.isActive &&
                editableSubcategoryIds.has(
                  link.subcategoryId,
                ),
            )
            .map((link) => link.subcategoryId),
        );
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar os vínculos.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [addonId]);

  // ============================================
  // CATEGORIAS E SUBCATEGORIAS EDITÁVEIS
  // ============================================

  const orderedCategories = useMemo(() => {
    return [...categories]
      .filter((category) => !isHiddenCategory(category))
      .sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }

        return a.name.localeCompare(b.name, "pt-BR");
      });
  }, [categories]);

  const editableCategoryIds = useMemo(() => {
    return new Set(
      categories
        .filter(
          (category) =>
            category.isActive &&
            !isHiddenCategory(category) &&
            !isBlockedCategory(category),
        )
        .map((category) => category.id),
    );
  }, [categories]);

  const editableSubcategoryIds = useMemo(() => {
    return new Set(
      subcategories
        .filter(
          (subcategory) =>
            subcategory.isActive &&
            editableCategoryIds.has(
              subcategory.categoryId,
            ),
        )
        .map((subcategory) => subcategory.id),
    );
  }, [subcategories, editableCategoryIds]);

  const selectedCategorySet = useMemo(
    () => new Set(selectedCategoryIds),
    [selectedCategoryIds],
  );

  const selectedSubcategorySet = useMemo(
    () => new Set(selectedSubcategoryIds),
    [selectedSubcategoryIds],
  );

  const selectedCategoryCount = selectedCategoryIds.filter(
    (id) => editableCategoryIds.has(id),
  ).length;

  const selectedSubcategoryCount =
    selectedSubcategoryIds.filter(
      (id) => editableSubcategoryIds.has(id),
    ).length;

  // ============================================
  // SELEÇÃO DE CATEGORIA INTEIRA
  // ============================================

  function toggleCategory(categoryId: number) {
    if (loading || saving || loadError) return;
    if (!editableCategoryIds.has(categoryId)) return;

    setSaveError("");
    setSuccess("");

    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );

    // Preserva vínculos individuais existentes.
    // A categoria inteira tem prioridade na exibição.
  }

  // ============================================
  // SELEÇÃO INDIVIDUAL DE SUBCATEGORIAS
  // ============================================

  function toggleSubcategory(
    subcategoryId: number,
    categoryId: number,
  ) {
    if (loading || saving || loadError) return;
    if (!editableSubcategoryIds.has(subcategoryId)) return;
    if (selectedCategorySet.has(categoryId)) return;

    setSaveError("");
    setSuccess("");

    setSelectedSubcategoryIds((current) =>
      current.includes(subcategoryId)
        ? current.filter((id) => id !== subcategoryId)
        : [...current, subcategoryId],
    );
  }

  // ============================================
  // SALVAR VÍNCULOS EM UMA ÚNICA TRANSAÇÃO
  // ============================================

  async function handleSave() {
    if (loading || saving || loadError) return;

    setSaving(true);
    setSaveError("");
    setSuccess("");

    const categoryIds = selectedCategoryIds.filter(
      (id) => editableCategoryIds.has(id),
    );

    const subcategoryIds = selectedSubcategoryIds.filter(
      (id) => editableSubcategoryIds.has(id),
    );

    try {
      const result = await request<{
        message: string;
        categoryLinks: CategoryLink[];
        subcategoryLinks: SubcategoryLink[];
      }>(
        `/api/addons/admin/${addonId}/links`,
        {
          method: "PUT",
          body: JSON.stringify({
            categoryIds,
            subcategoryIds,
          }),
        },
      );

      // Atualiza a interface com o retorno do banco.
      setSelectedCategoryIds(
        result.categoryLinks
          .filter(
            (link) =>
              link.isActive &&
              editableCategoryIds.has(link.categoryId),
          )
          .map((link) => link.categoryId),
      );

      setSelectedSubcategoryIds(
        result.subcategoryLinks
          .filter(
            (link) =>
              link.isActive &&
              editableSubcategoryIds.has(
                link.subcategoryId,
              ),
          )
          .map((link) => link.subcategoryId),
      );

      setSuccess(
        "Categorias e subcategorias vinculadas com sucesso!",
      );
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar os vínculos.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Tags
              size={19}
              className="text-emerald-700"
            />

            <h4 className="text-base font-black text-slate-900">
              Vincular adicional às categorias
            </h4>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Escolha onde o adicional{" "}
            <strong>{addonName}</strong> poderá aparecer:
            em uma categoria inteira ou em subcategorias
            específicas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
            {selectedCategoryCount} categoria(s)
          </span>

          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
            {selectedSubcategoryCount} subcategoria(s)
          </span>
        </div>
      </div>

      {/* Erros de carregamento */}
      {loadError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          Não foi possível carregar as informações:{" "}
          {loadError}
        </p>
      )}

      {/* Erros de salvamento */}
      {saveError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {saveError}
        </p>
      )}

      {/* Sucesso */}
      {success && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-sm font-semibold text-emerald-700"
        >
          <CheckCircle2 size={17} />
          {success}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
          Carregando categorias e subcategorias...
        </div>
      ) : orderedCategories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Nenhuma categoria disponível.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orderedCategories.map((category, index) => {
            const style =
              CARD_STYLES[index % CARD_STYLES.length];

            const blocked =
              isBlockedCategory(category) ||
              !category.isActive;

            const entireCategorySelected =
              selectedCategorySet.has(category.id);

            const items = subcategories
              .filter(
                (subcategory) =>
                  subcategory.categoryId === category.id,
              )
              .sort((a, b) =>
                a.name.localeCompare(b.name, "pt-BR"),
              );

            const activeItems = items.filter(
              (item) => item.isActive,
            );

            const linkedCount = activeItems.filter(
              (item) =>
                selectedSubcategorySet.has(item.id),
            ).length;

            const imageUrl = resolveImageUrl(
              category.imageUrl,
            );

            return (
              <article
                key={category.id}
                className={`overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${style.border} ${style.background}`}
              >
                {/* Cabeçalho do card */}
                <div
                  className={`flex items-center gap-3 border-b ${style.border} ${style.heading} p-3`}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/90 shadow-sm">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={category.name}
                        className="size-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <ImageIcon
                        size={21}
                        className={style.accent}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5
                      className={`truncate text-sm font-black ${style.accent}`}
                    >
                      {category.name}
                    </h5>

                    <p className="mt-1 text-xs text-slate-600">
                      {activeItems.length} subcategoria(s)
                    </p>
                  </div>

                  {blocked ? (
                    <LockKeyhole
                      size={17}
                      className="shrink-0 text-slate-500"
                    />
                  ) : entireCategorySelected ||
                    linkedCount > 0 ? (
                    <CheckCircle2
                      size={19}
                      className="shrink-0 text-emerald-600"
                    />
                  ) : null}
                </div>

                <div className="space-y-3 p-3">
                  {blocked && (
                    <p className="rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-slate-600">
                      {!category.isActive
                        ? "Categoria desativada."
                        : "Vinculação indisponível nesta etapa."}
                    </p>
                  )}

                  {/* Seleção da categoria inteira */}
                  {!blocked && (
                    <label
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${
                        entireCategorySelected
                          ? "border-emerald-400 bg-emerald-100/80"
                          : "border-white/80 bg-white/85 hover:bg-white"
                      } ${
                        saving || Boolean(loadError)
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={entireCategorySelected}
                        disabled={
                          saving || Boolean(loadError)
                        }
                        onChange={() =>
                          toggleCategory(category.id)
                        }
                        className="size-4 shrink-0 accent-emerald-600"
                      />

                      <Layers3
                        size={18}
                        className="shrink-0 text-emerald-700"
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-900">
                          Aplicar à categoria inteira
                        </span>

                        <span className="mt-0.5 block text-xs text-slate-600">
                          Todos os produtos, mesmo sem
                          subcategoria.
                        </span>
                      </span>

                      {entireCategorySelected && (
                        <Check
                          size={17}
                          className="shrink-0 text-emerald-700"
                        />
                      )}
                    </label>
                  )}

                  {/* Subcategorias */}
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-white/80 bg-white/60 px-3 py-4 text-center text-xs text-slate-500">
                      Nenhuma subcategoria cadastrada.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="px-1 text-xs font-bold text-slate-600">
                        Subcategorias
                      </p>

                      {items.map((subcategory) => {
                        const explicitlySelected =
                          selectedSubcategorySet.has(
                            subcategory.id,
                          );

                        const inherited =
                          entireCategorySelected &&
                          subcategory.isActive;

                        const checked =
                          explicitlySelected || inherited;

                        const disabled =
                          blocked ||
                          !subcategory.isActive ||
                          entireCategorySelected ||
                          saving ||
                          Boolean(loadError);

                        return (
                          <label
                            key={subcategory.id}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                              checked && !blocked
                                ? style.selected
                                : "border-transparent bg-white/75"
                            } ${
                              disabled
                                ? "cursor-not-allowed opacity-65"
                                : "cursor-pointer hover:bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() =>
                                toggleSubcategory(
                                  subcategory.id,
                                  category.id,
                                )
                              }
                              className={`size-4 shrink-0 ${style.checkbox}`}
                            />

                            <span className="min-w-0 flex-1 font-medium text-slate-800">
                              {subcategory.name}
                            </span>

                            {!subcategory.isActive && (
                              <span className="text-[10px] text-slate-500">
                                Inativa
                              </span>
                            )}

                            {inherited && (
                              <span className="text-[10px] font-semibold text-emerald-700">
                                Incluída
                              </span>
                            )}

                            {checked && !blocked && (
                              <Check
                                size={15}
                                className="shrink-0 text-emerald-700"
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rodapé do card */}
                <div
                  className={`border-t ${style.border} px-3 py-2.5`}
                >
                  <p className="text-xs font-semibold text-slate-600">
                    {blocked
                      ? "Somente visualização"
                      : entireCategorySelected
                        ? "Categoria inteira selecionada"
                        : `${linkedCount} de ${activeItems.length} vinculada(s)`}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Rodapé geral */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100 pt-4">
        <p className="text-xs text-slate-600">
          <strong>{selectedCategoryCount}</strong>{" "}
          categoria(s) e{" "}
          <strong>{selectedSubcategoryCount}</strong>{" "}
          subcategoria(s) selecionada(s) para{" "}
          <strong>{addonName}</strong>.
        </p>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={
            loading ||
            saving ||
            Boolean(loadError) ||
            orderedCategories.length === 0
          }
          className="
            inline-flex items-center gap-2
            rounded-xl bg-emerald-600
            px-5 py-2.5
            text-sm font-bold text-white
            shadow-sm
            transition duration-200
            hover:bg-emerald-700
            hover:shadow-md
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {saving ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <Save size={17} />
          )}

          {saving ? "Salvando..." : "Salvar vínculos"}
        </button>
      </div>
    </section>
  );
}

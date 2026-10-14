import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { Check, ImagePlus, LoaderCircle, Package, Pencil, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";

import {

  productsApi,

  type AdminCategory,

  type AdminProduct,

  type AdminSubcategory,

  type ProductPayload,

} from "../api/products.api";



type ProductForm = {

  name: string;

  description: string;

  price: string;

  categoryId: string;

  subcategoryId: string;

  imageUrl: string;

  isAvailable: boolean;

  isFeatured: boolean;

};



const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const emptyForm: ProductForm = {

  name: "", description: "", price: "", categoryId: "", subcategoryId: "",

  imageUrl: "", isAvailable: true, isFeatured: false,

};



const inputClass = "min-h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-700/10";

const labelClass = "mb-2 block text-sm font-semibold text-stone-700";

const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);



function parsePriceCents(value: string): number | null {

  const text = value.trim();

  if (!/^\d+(?:[,.]\d{1,2})?$/.test(text)) return null;

  const [integer, fraction = ""] = text.replace(",", ".").split(".");

  const cents = Number(integer) * 100 + Number(fraction.padEnd(2, "0"));

  return Number.isSafeInteger(cents) && cents > 0 && cents <= 2147483647 ? cents : null;

}



export function AdminDashboardProducts() {

  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [processingId, setProcessingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<ProductForm>({ ...emptyForm });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");



  const load = useCallback(async () => {

    setLoading(true);

    setError("");

    try {

      const [productsData, categoriesData, subcategoriesData] = await Promise.all([

        productsApi.listAdmin(), productsApi.listCategories(), productsApi.listSubcategories(),

      ]);

      setProducts(productsData);

      setCategories(categoriesData);

      setSubcategories(subcategoriesData);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Não foi possível carregar os produtos.");

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {
    // Agenda o carregamento fora da execução síncrona do efeito.
    void Promise.resolve().then(load);
  }, [load]);



  useEffect(() => {
    // Apenas libera o objeto de prévia; não atualiza estado no efeito.
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Selecione uma imagem JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  }

  async function uploadImage(file: File): Promise<string> {
    const data = new FormData();
    data.append("image", file);
    const response = await fetch(`${API_BASE_URL}/api/admin/uploads/products`, {
      method: "POST",
      credentials: "include",
      body: data,
    });
    const result: {
      message?: string;
      image?: { objectPath?: string };
    } = await response.json();
    if (!response.ok || !result.image?.objectPath) {
      throw new Error(result.message ?? "Não foi possível enviar a imagem.");
    }
    // Este endereço depende da rota GET /api/images/products/:filename.
    const filename = result.image.objectPath.split("/").pop();
    if (!filename || !/^[a-f0-9-]+\.webp$/i.test(filename)) {
      throw new Error("O Storage retornou um nome de imagem inválido.");
    }
    return `${API_BASE_URL}/api/images/products/${filename}`;
  }

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);

  const availableSubcategories = useMemo(() => subcategories.filter(

    (subcategory) => subcategory.categoryId === Number(form.categoryId) && subcategory.isActive,

  ), [subcategories, form.categoryId]);

  const visibleProducts = useMemo(() => products.filter((product) => {

    const matchesSearch = product.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"));

    return matchesSearch && (!categoryFilter || product.categoryId === Number(categoryFilter));

  }), [products, search, categoryFilter]);



  function updateField<K extends keyof ProductForm>(field: K, value: ProductForm[K]) {

    setForm((current) => ({

      ...current,

      [field]: value,

      ...(field === "categoryId" ? { subcategoryId: "" } : {}),

    }));

    setError("");

  }



  function closeForm() {

    setFormOpen(false);

    setEditingId(null);

    setForm({ ...emptyForm });
    setSelectedImage(null);
    setPreviewUrl(null);

    setError("");

  }



  function openCreateForm() {

    setEditingId(null);
    setSelectedImage(null);
    setPreviewUrl(null);

    setForm({ ...emptyForm, categoryId: String(activeCategories[0]?.id ?? "") });

    setError(""); setMessage(""); setFormOpen(true);

  }



  function openEditForm(product: AdminProduct) {

    setEditingId(product.id);
    setSelectedImage(null);
    setPreviewUrl(null);

    setForm({

      name: product.name,

      description: product.description ?? "",

      price: (product.priceCents / 100).toFixed(2).replace(".", ","),

      categoryId: String(product.categoryId),

      subcategoryId: product.subcategoryId === null ? "" : String(product.subcategoryId),

      imageUrl: product.imageUrl ?? "",

      isAvailable: product.isAvailable,

      isFeatured: product.isFeatured,

    });

    setError(""); setMessage(""); setFormOpen(true);

  }



  async function handleSave(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    if (saving) return;

    const name = form.name.trim().replace(/\s+/g, " ");

    const categoryId = Number(form.categoryId);

    const priceCents = parsePriceCents(form.price);

    if (name.length < 2) { setError("Informe um nome com pelo menos 2 caracteres."); return; }

    if (!activeCategories.some((c) => c.id === categoryId)) { setError("Selecione uma categoria ativa."); return; }

    if (priceCents === null) { setError("Informe um preço válido e maior que zero, como 15,00."); return; }

    const subcategoryId = form.subcategoryId ? Number(form.subcategoryId) : null;

    if (availableSubcategories.length && !availableSubcategories.some((s) => s.id === subcategoryId)) {

      setError("Selecione uma subcategoria ativa."); return;

    }

    if (!availableSubcategories.length && subcategoryId !== null) {

      setError("A subcategoria selecionada não está disponível."); return;

    }

    const imageUrl = form.imageUrl.trim();
    if (imageUrl && !imageUrl.startsWith("/") && !/^https?:\/\//i.test(imageUrl)) {
      setError("O endereço da imagem atual é inválido.");
      return;
    }

    const current = editingId === null ? null : products.find((p) => p.id === editingId);

    const payload: ProductPayload = {

      categoryId, subcategoryId, name,

      description: form.description.trim() || null,

      imageUrl: imageUrl || null,

      priceCents,

      isActive: current?.isActive ?? true,

      isAvailable: form.isAvailable,

      isFeatured: form.isFeatured,

      sortOrder: current?.sortOrder ?? 0,

      allowsFlavors: current?.allowsFlavors ?? false,

      maxFlavors: current?.maxFlavors ?? 1,

    };

    setSaving(true); setError(""); setMessage("");

    try {
      // Envia a nova imagem antes de persistir os dados do produto.
      // Sem imagem selecionada, mantém a URL atual (na edição).
      if (selectedImage) {
        payload.imageUrl = await uploadImage(selectedImage);
      }

      const isCreating = editingId === null;
      const saved = isCreating
        ? await productsApi.create(payload)
        : await productsApi.update(editingId, payload);

      setProducts((currentProducts) => isCreating
        ? [...currentProducts, saved]
        : currentProducts.map((p) => p.id === saved.id ? saved : p));

      closeForm();
      setMessage(isCreating ? "Produto cadastrado com sucesso!" : "Produto atualizado com sucesso!");

    } catch (err) {

      setError(err instanceof Error ? err.message : "Erro ao salvar produto.");

    } finally { setSaving(false); }

  }



  async function handleDeactivate(product: AdminProduct) {

    if (processingId !== null || !window.confirm(`Deseja desativar "${product.name}"?`)) return;

    setProcessingId(product.id); setError(""); setMessage("");

    try {

      const { product: updated } = await productsApi.deactivate(product.id);

      setProducts((items) => items.map((p) => p.id === updated.id ? updated : p));

      if (editingId === product.id) closeForm();

      setMessage("Produto desativado. Seu registro foi preservado.");

    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao desativar produto."); }

    finally { setProcessingId(null); }

  }



  async function handleReactivate(product: AdminProduct) {

    if (processingId !== null) return;

    setProcessingId(product.id); setError(""); setMessage("");

    try {

      const updated = await productsApi.update(product.id, { isActive: true });

      setProducts((items) => items.map((p) => p.id === updated.id ? updated : p));

      setMessage("Produto reativado.");

    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao reativar produto."); }

    finally { setProcessingId(null); }

  }



  async function handleAvailability(product: AdminProduct) {

    if (processingId !== null) return;

    setProcessingId(product.id); setError(""); setMessage("");

    try {

      const updated = await productsApi.update(product.id, { isAvailable: !product.isAvailable });

      setProducts((items) => items.map((p) => p.id === updated.id ? updated : p));

      setMessage(updated.isAvailable ? "Produto disponível para venda." : "Produto marcado como indisponível.");

    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao atualizar disponibilidade."); }

    finally { setProcessingId(null); }

  }



  return (

    <div className="space-y-6">

      <section className="flex flex-col gap-5 rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">

        <div>

          <h2 className="text-2xl font-black sm:text-3xl">Produtos do restaurante</h2>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-orange-50">Organize seu cardápio, atualize os preços e cadastre novos produtos.</p>

        </div>

        <button type="button" onClick={openCreateForm} disabled={loading || activeCategories.length === 0}

          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-orange-800 transition hover:bg-orange-50 disabled:opacity-60">

          <Plus size={19} aria-hidden="true" /> Novo produto

        </button>

      </section>



      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {message && <p role="status" className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-medium text-stone-700">{message}</p>}

      {!loading && activeCategories.length === 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Cadastre uma categoria ativa antes de adicionar produtos.</p>}



      {formOpen && (

        <section aria-labelledby="product-form-title" className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-6 flex items-center justify-between gap-3">

            <h2 id="product-form-title" className="text-lg font-black text-stone-900">{editingId !== null ? "Editar produto" : "Novo produto"}</h2>

            <button type="button" onClick={closeForm} disabled={saving} aria-label="Fechar formulário" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><X size={20} /></button>

          </div>

          <form onSubmit={(event) => void handleSave(event)} className="space-y-5">

            <div className="grid gap-5 sm:grid-cols-2">

              <div className="sm:col-span-2">

                <label htmlFor="product-name" className={labelClass}>Nome do produto</label>

                <input id="product-name" autoFocus required maxLength={100} value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ex.: Pizza de calabresa" className={inputClass} />

              </div>

              <div>

                <label htmlFor="product-category" className={labelClass}>Categoria</label>

                <select id="product-category" required value={form.categoryId} onChange={(event) => updateField("categoryId", event.target.value)} className={inputClass}>

                  <option value="">Selecione uma categoria</option>

                  {activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}

                </select>

              </div>

              {availableSubcategories.length > 0 && (

                <div>

                  <label htmlFor="product-subcategory" className={labelClass}>Tipo do produto</label>

                  <select id="product-subcategory" required value={form.subcategoryId} onChange={(event) => updateField("subcategoryId", event.target.value)} className={inputClass}>

                    <option value="">Selecione um tipo</option>

                    {availableSubcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}

                  </select>

                </div>

              )}

              <div>

                <label htmlFor="product-price" className={labelClass}>Preço em reais</label>

                <input id="product-price" inputMode="decimal" required value={form.price} onChange={(event) => updateField("price", event.target.value)} placeholder="Ex.: 50,00" className={inputClass} />

              </div>

              <div className="sm:col-span-2">

                <label htmlFor="product-description" className={labelClass}>Descrição e ingredientes</label>

                <textarea id="product-description" rows={3} value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Descreva o produto e seus ingredientes." className={`${inputClass} resize-y`} />

              </div>

              <div className="sm:col-span-2">

                <label htmlFor="product-image" className={labelClass}>Imagem do produto</label>

                <label htmlFor="product-image" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-5 text-sm font-semibold text-orange-800 hover:bg-orange-100">
                  <ImagePlus size={22} aria-hidden="true" />
                  {selectedImage ? selectedImage.name : "Selecionar imagem do computador"}
                </label>
                <input
                  id="product-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={saving}
                  className="sr-only"
                />
                <p className="mt-2 text-xs text-stone-500">JPG, PNG ou WebP, até 5 MB. O envio acontece ao salvar o produto.</p>
                {selectedImage && (
                  <button type="button" onClick={() => { setSelectedImage(null); setPreviewUrl(null); }} disabled={saving} className="mt-2 text-xs font-semibold text-red-700 hover:underline">
                    Remover imagem selecionada
                  </button>
                )}
                {(previewUrl || form.imageUrl.trim()) && (
                  <ProductImage
                    src={previewUrl || form.imageUrl.trim()}
                    name={form.name || "Prévia do produto"}
                    className="mt-4 h-40 w-48 rounded-xl"
                  />
                )}

              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-5 rounded-xl bg-orange-50 p-4">

                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">

                  <input type="checkbox" checked={form.isAvailable} onChange={(event) => updateField("isAvailable", event.target.checked)} className="accent-orange-700" /> Disponível para venda

                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">

                  <input type="checkbox" checked={form.isFeatured} onChange={(event) => updateField("isFeatured", event.target.checked)} className="accent-orange-700" /> Produto em destaque

                </label>

              </div>

            </div>

            <div className="flex flex-wrap justify-end gap-3">

              <button type="button" onClick={closeForm} disabled={saving} className="min-h-11 rounded-xl border border-stone-200 px-5 py-2 text-sm font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-50">Cancelar</button>

              <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50">

                {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />}

                {saving ? "Salvando produto e imagem..." : editingId !== null ? "Salvar alterações" : "Cadastrar produto"}

              </button>

            </div>

          </form>

        </section>

      )}



      <section aria-labelledby="product-list-title" className="space-y-4">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h2 id="product-list-title" className="text-lg font-black text-stone-900">Produtos cadastrados</h2>

            <p className="mt-1 text-sm text-stone-500">{visibleProducts.length} de {products.length} produtos</p>

          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="relative">

              <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />

              <input type="search" aria-label="Buscar produto" placeholder="Buscar produto..." value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-10`} />

            </div>

            <select aria-label="Filtrar produtos por categoria" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={inputClass}>

              <option value="">Todas as categorias</option>

              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}

            </select>

          </div>

        </div>

        {loading ? (

          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-10 text-sm text-stone-500"><LoaderCircle size={18} className="animate-spin" /> Carregando produtos...</div>

        ) : visibleProducts.length > 0 ? (

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

            {visibleProducts.map((product) => {

              const categoryName = categories.find((category) => category.id === product.categoryId)?.name;

              const subcategoryName = subcategories.find((subcategory) => subcategory.id === product.subcategoryId)?.name;

              return (

                <article key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">

                  <ProductImage src={product.imageUrl} name={product.name} className="h-40 w-full" />

                  <div className="flex flex-1 flex-col p-5">

                    <p className="text-xs font-bold text-orange-700">{categoryName ?? "Categoria indisponível"}{subcategoryName && ` · ${subcategoryName}`}</p>

                    <h3 className="mt-2 text-lg font-black text-stone-900">{product.name}</h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">{product.description || "Sem descrição cadastrada."}</p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">

                      <span className={`rounded-full px-2 py-1 ${product.isActive ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-500"}`}>{product.isActive ? "Ativo" : "Desativado"}</span>

                      <span className={`rounded-full px-2 py-1 ${product.isAvailable ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"}`}>{product.isAvailable ? "Disponível" : "Indisponível"}</span>

                      {product.isFeatured && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Destaque</span>}

                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">

                      <p className="text-xl font-black text-stone-900">{money(product.priceCents)}</p>

                      <div className="flex gap-2">

                        <button type="button" onClick={() => void handleAvailability(product)} disabled={processingId !== null} aria-label={`${product.isAvailable ? "Marcar indisponível" : "Marcar disponível"}: ${product.name}`} title="Alternar disponibilidade" className="flex size-10 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-orange-50 disabled:opacity-50"><Package size={17} /></button>

                        <button type="button" onClick={() => openEditForm(product)} disabled={processingId !== null} aria-label={`Editar ${product.name}`} className="flex size-10 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-orange-50 disabled:opacity-50"><Pencil size={17} /></button>

                        {product.isActive ? (

                          <button type="button" onClick={() => void handleDeactivate(product)} disabled={processingId !== null} aria-label={`Desativar ${product.name}`} className="flex size-10 items-center justify-center rounded-xl border border-red-100 text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={17} /></button>

                        ) : (

                          <button type="button" onClick={() => void handleReactivate(product)} disabled={processingId !== null} aria-label={`Reativar ${product.name}`} className="flex size-10 items-center justify-center rounded-xl border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50"><RotateCcw size={17} /></button>

                        )}

                      </div>

                    </div>

                  </div>

                </article>

              );

            })}

          </div>

        ) : (

          <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-12 text-center">

            <Package size={32} aria-hidden="true" className="mx-auto text-orange-300" />

            <p className="mt-4 font-semibold text-stone-700">{products.length === 0 ? "Nenhum produto cadastrado." : "Nenhum produto encontrado com esses filtros."}</p>

          </div>

        )}

      </section>

    </div>

  );

}



function ProductImage({ src, name, className }: { src?: string | null; name: string; className: string }) {

  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = Boolean(src) && failedSrc !== src;

  return (

    <div className={`flex items-center justify-center overflow-hidden bg-orange-50 ${className}`}>

      {showImage ? (

        <img src={src ?? undefined} alt={name} loading="lazy" onError={() => setFailedSrc(src ?? null)} className="h-full w-full object-cover" />

      ) : <Package size={36} aria-hidden="true" className="text-orange-300" />}

    </div>

  );

}

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Check,
  CirclePlus,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { CurrencyInput } from "./CurrencyInput";
import { formatCurrency } from "./currency.utils";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface Addon {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddonFormValues {
  name: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  isActive: boolean;
}

interface ProductAddonsManagerProps {
  onCancel?: () => void;
}

interface UploadResponse {
  message: string;
  image: {
    objectPath: string;
    storageUri: string;
    contentType: string;
    sizeBytes: number;
  };
}

const emptyForm: AddonFormValues = {
  name: "",
  description: "",
  imageUrl: "",
  priceCents: 0,
  isActive: true,
};

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : `Erro HTTP ${response.status}.`;
    throw new Error(message);
  }
  return data as T;
}

function extractAddonList(data: unknown): Addon[] {
  if (Array.isArray(data)) return data as Addon[];
  if (data && typeof data === "object") {
    if ("addons" in data && Array.isArray(data.addons)) return data.addons as Addon[];
    if ("data" in data && Array.isArray(data.data)) return data.data as Addon[];
  }
  throw new Error("A API retornou um formato inesperado para os adicionais.");
}

const addonsApi = {
  async list(): Promise<Addon[]> {
    return extractAddonList(await request<unknown>("/api/addons/admin"));
  },
  create(payload: AddonFormValues) {
    return request<unknown>("/api/addons", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name.trim(),
        description: payload.description.trim() || null,
        imageUrl: payload.imageUrl || null,
        priceCents: payload.priceCents,
        isActive: payload.isActive,
      }),
    });
  },
  update(id: number, payload: Partial<Omit<AddonFormValues, "description" | "imageUrl">> & { description?: string | null; imageUrl?: string | null }) {
    return request<unknown>(`/api/addons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deactivate(id: number) {
    return request<unknown>(`/api/addons/${id}`, { method: "DELETE" });
  },
  uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    return request<UploadResponse>("/api/admin/uploads/addons", {
      method: "POST",
      body: formData,
    });
  },
};

function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("blob:")) return imageUrl;
  if (imageUrl.startsWith("/")) return `${API_URL}${imageUrl}`;
  if (/^(products|addons)\/[a-f0-9-]+\.webp$/i.test(imageUrl)) {
    return `${API_URL}/api/images/${imageUrl}`;
  }
  return null;
}

function AddonImage({ src, name, className = "" }: { src: string | null; name: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolved = resolveImageUrl(src);
  const visible = resolved && failedSrc !== resolved;
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-emerald-50 text-emerald-600 ${className}`}>
      {visible ? (
        <img
          src={resolved}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(resolved)}
        />
      ) : (
        <ImagePlus size={25} aria-hidden="true" />
      )}
    </div>
  );
}

export function ProductAddonsManager({ onCancel }: ProductAddonsManagerProps) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddonFormValues>({ ...emptyForm });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const loadAddons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setAddons(await addonsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar adicionais.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      try {
        const result = await addonsApi.list();
        if (!cancelled) {
          setAddons(result);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar adicionais.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initialize();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    };
  }, []);

  function clearSelectedFile() {
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    previewObjectUrlRef.current = null;
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateField<K extends keyof AddonFormValues>(field: K, value: AddonFormValues[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateForm() {
    clearSelectedFile();
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function openEditForm(addon: Addon) {
    clearSelectedFile();
    setEditingId(addon.id);
    setForm({
      name: addon.name,
      description: addon.description ?? "",
      imageUrl: addon.imageUrl ?? "",
      priceCents: addon.priceCents,
      isActive: addon.isActive,
    });
    setError("");
    setMessage("");
    setFormOpen(true);
  }

  function closeForm() {
    clearSelectedFile();
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError("Formato inválido. Escolha uma imagem JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }
    clearSelectedFile();
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("Informe o nome do adicional.");
      return;
    }
    if (!Number.isSafeInteger(form.priceCents) || form.priceCents < 0) {
      setError("Informe um preço válido.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      let imageUrl = form.imageUrl;
      if (selectedFile) {
        const uploaded = await addonsApi.uploadImage(selectedFile);
        if (!/^[a-f0-9-]+\.webp$/i.test(uploaded.image.objectPath.split("/")[1] ?? "") ||
            !uploaded.image.objectPath.startsWith("addons/")) {
          throw new Error("O servidor retornou um caminho de imagem inválido.");
        }
        // Caminho relativo: funciona em desenvolvimento e após trocar o domínio da API.
        imageUrl = `/api/images/${uploaded.image.objectPath}`;
      }

      const payload: AddonFormValues = {
        name,
        description: form.description.trim(),
        imageUrl,
        priceCents: form.priceCents,
        isActive: form.isActive,
      };

      if (editingId !== null) {
        await addonsApi.update(editingId, {
          name: payload.name,
          description: payload.description || null,
          imageUrl: payload.imageUrl || null,
          priceCents: payload.priceCents,
          isActive: payload.isActive,
        });
        setMessage("Adicional atualizado com sucesso.");
      } else {
        await addonsApi.create(payload);
        setMessage("Adicional cadastrado com sucesso.");
      }
      closeForm();
      await loadAddons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o adicional.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(addon: Addon) {
    if (!window.confirm(`Deseja desativar o adicional "${addon.name}"?`)) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await addonsApi.deactivate(addon.id);
      await loadAddons();
      setMessage("Adicional desativado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível desativar o adicional.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReactivate(addon: Addon) {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await addonsApi.update(addon.id, { isActive: true });
      await loadAddons();
      setMessage("Adicional reativado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível reativar o adicional.");
    } finally {
      setSaving(false);
    }
  }

  const filteredAddons = addons.filter((addon) =>
    addon.name.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")) &&
    (showInactive || addon.isActive),
  );
  const activeCount = addons.filter((addon) => addon.isActive).length;
  const displayedPreview = previewUrl ?? resolveImageUrl(form.imageUrl);

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <div className="border-b border-emerald-100 bg-emerald-50/60 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <CirclePlus size={15} /> Gerenciamento de adicionais
            </div>
            <h3 className="mt-2 text-xl font-black text-slate-900">Adicionais do restaurante</h3>
            <p className="mt-1 text-sm text-slate-500">Cadastre e gerencie os adicionais disponíveis para seus produtos.</p>
          </div>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button type="button" onClick={onCancel} disabled={saving} aria-label="Fechar gerenciamento" className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                <X size={18} />
              </button>
            )}
            {!formOpen && (
              <button type="button" onClick={openCreateForm} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700">
                <Plus size={17} /> Novo adicional
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
        {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{message}</div>}

        {formOpen && (
          <form onSubmit={(event) => { void handleSubmit(event); }} className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-base font-black text-slate-900">{editingId !== null ? "Editar adicional" : "Cadastrar adicional"}</h4>
              <button type="button" onClick={closeForm} disabled={saving} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-50" aria-label="Cancelar formulário"><X size={18} /></button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="addon-name" className="mb-2 block text-sm font-semibold text-slate-700">Nome do adicional *</label>
                <input id="addon-name" required maxLength={100} disabled={saving} value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ex.: Queijo extra" className={inputClass} />
              </div>
              <CurrencyInput id="addon-price" label="Preço adicional" value={form.priceCents} onChange={(value) => updateField("priceCents", value)} disabled={saving} minCents={0} />
              <div className="sm:col-span-2">
                <label htmlFor="addon-description" className="mb-2 block text-sm font-semibold text-slate-700">Descrição</label>
                <textarea id="addon-description" rows={3} disabled={saving} value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Ex.: 200g de calabresa" className={`${inputClass} resize-y`} />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="addon-image-file" className="mb-2 block text-sm font-semibold text-slate-700">Imagem do adicional (opcional)</label>
                <div className="flex flex-col gap-4 rounded-xl border border-dashed border-emerald-200 bg-white p-4 sm:flex-row sm:items-center">
                  <AddonImage src={displayedPreview} name="Prévia da imagem do adicional" className="h-32 w-full shrink-0 rounded-xl sm:w-40" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input ref={fileInputRef} id="addon-image-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={handleFileChange} className="sr-only" />
                    <label htmlFor="addon-image-file" className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 ${saving ? "pointer-events-none opacity-50" : ""}`}>
                      <UploadCloud size={17} /> {displayedPreview ? "Trocar imagem" : "Selecionar imagem"}
                    </label>
                    <p className="text-xs text-slate-500">JPG, PNG ou WebP, até 5 MB. A imagem será otimizada e salva no Cloud Storage.</p>
                    {selectedFile && <p className="truncate text-xs font-medium text-emerald-700">Arquivo selecionado: {selectedFile.name}</p>}
                    {displayedPreview && (
                      <button type="button" disabled={saving} onClick={() => { clearSelectedFile(); updateField("imageUrl", ""); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50">
                        <Trash2 size={14} /> Remover imagem
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.isActive} disabled={saving} onChange={(event) => updateField("isActive", event.target.checked)} className="size-4 accent-emerald-600" />
              Adicional ativo
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-500">Valor: <strong className="text-slate-900">{formatCurrency(form.priceCents)}</strong></p>
              <div className="flex gap-2">
                <button type="button" onClick={closeForm} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />}
                  {saving ? (selectedFile ? "Enviando e salvando..." : "Salvando...") : editingId !== null ? "Salvar alterações" : "Cadastrar adicional"}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-black text-slate-900">Adicionais cadastrados</h4>
            <p className="mt-1 text-xs text-slate-500">{activeCount} ativos de {addons.length} cadastrados</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar adicional..." className="min-h-10 w-52 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-400" />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="size-4 accent-emerald-600" />
              Mostrar inativos
            </label>
            <button type="button" onClick={() => { void loadAddons(); }} disabled={loading} aria-label="Atualizar adicionais" title="Atualizar lista" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle size={20} className="animate-spin" /> Carregando adicionais...</div>
        ) : filteredAddons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
            <CirclePlus size={30} className="mx-auto mb-3 text-slate-300" />
            <h4 className="font-bold text-slate-800">Nenhum adicional encontrado</h4>
            <p className="mt-1 text-sm text-slate-500">Cadastre um adicional ou ajuste os filtros da listagem.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredAddons.map((addon) => (
              <article key={addon.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <AddonImage src={addon.imageUrl} name={addon.name} className="size-14 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-sm font-bold text-slate-900">{addon.name}</h5>
                    <p className="mt-1 text-lg font-black text-emerald-700">{formatCurrency(addon.priceCents)}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${addon.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {addon.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
                {addon.description && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{addon.description}</p>}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <button type="button" disabled={saving} onClick={() => openEditForm(addon)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                    <Pencil size={14} /> Editar
                  </button>
                  {addon.isActive ? (
                    <button type="button" disabled={saving} onClick={() => { void handleDeactivate(addon); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                      <Trash2 size={14} /> Desativar
                    </button>
                  ) : (
                    <button type="button" disabled={saving} onClick={() => { void handleReactivate(addon); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50">
                      <RefreshCw size={14} /> Reativar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

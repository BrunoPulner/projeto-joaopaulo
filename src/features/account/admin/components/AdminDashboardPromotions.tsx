import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle, CalendarDays, CheckCircle2, Clock3, Edit3,
  Loader2, Percent, Plus, RefreshCw, Search, Tag, TrendingDown, X,
} from "lucide-react";
import {
  adminPromotionsApi, adminPromotionGroupsApi, formatPromotionPrice,
  getPromotionStatus, maskPromotionCurrency, maskedPromotionCurrencyToCents,
  promotionCentsToMaskedCurrency, PROMOTION_STATUS_LABELS,
  PROMOTION_TARGET_LABELS,
  type AdminPromotion, type AdminPromotionGroup,
  type PromotionTargetType, type PromotionStatus,
} from "../api/admin-promotions.api";
import { productsApi, type AdminProduct } from "../api/products.api";

type StatusFilter = "ALL" | PromotionStatus;
type Offer =
  | { kind: "individual"; id: number; data: AdminPromotion }
  | { kind: "group"; id: number; data: AdminPromotionGroup };

interface PizzaFlavorOption {
  id: number;
  name: string;
  additionalPriceCents: number;
  isPremium: boolean;
  premiumAdditionalCents: number;
  isActive: boolean;
}
interface PizzaSizeOption {
  id: number;
  name: string;
  basePriceCents: number;
  isActive: boolean;
  isAvailable: boolean;
}
interface PromotionFormState {
  name: string;
  targetType: PromotionTargetType;
  targetId: string;
  pizzaFlavorIds: number[];
  price: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  immediateStart: boolean;
  noEndDate: boolean;
}
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const STATUS_STYLES: Record<PromotionStatus, string> = {
  ACTIVE: "border-green-200 bg-green-50 text-green-700",
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700",
  EXPIRED: "border-amber-200 bg-amber-50 text-amber-700",
  INACTIVE: "border-stone-200 bg-stone-100 text-stone-600",
};
const INITIAL_FORM: PromotionFormState = {
  name: "", targetType: "PRODUCT", targetId: "", pizzaFlavorIds: [],
  price: "", isActive: true, startsAt: "", endsAt: "",
  immediateStart: true, noEndDate: true,
};
const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-100";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
function formatDate(value: string | null): string {
  if (!value) return "Não definida";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data inválida" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function toISOString(value: string): string {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new Error("Informe uma data e horário válidos.");
  return date.toISOString();
}
function getTargetId(promotion: AdminPromotion): number | null {
  return promotion.targetType === "PRODUCT" ? promotion.productId : promotion.pizzaFlavorId;
}
function isGrande(name: string): boolean {
  return name.trim().toLocaleLowerCase("pt-BR") === "grande";
}
async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include", signal });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
      ? result.message : `Erro HTTP ${response.status}.`;
    throw new Error(message);
  }
  return result as T;
}
function offerKey(offer: Offer): string { return `${offer.kind}-${offer.id}`; }
function StatisticCard({ title, value, icon: Icon, description }: {
  title: string; value: number; icon: typeof Tag; description: string;
}) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wide text-stone-500">{title}</p><p className="mt-2 text-3xl font-black text-stone-900">{value}</p></div>
        <div className="rounded-xl bg-orange-50 p-3 text-orange-600"><Icon size={21} /></div>
      </div>
      <p className="mt-3 text-xs text-stone-500">{description}</p>
    </article>
  );
}
function PromotionStatusBadge({ offer }: { offer: Offer }) {
  const status = getPromotionStatus(offer.data);
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />{PROMOTION_STATUS_LABELS[status]}
  </span>;
}

function PromotionForm({ offer, products, flavors, sizes, onClose, onSaved }: {
  offer: Offer | null;
  products: AdminProduct[];
  flavors: PizzaFlavorOption[];
  sizes: PizzaSizeOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<PromotionFormState>(() => {
    if (!offer) return { ...INITIAL_FORM, pizzaFlavorIds: [] };
    const data = offer.data;
    const individual = offer.kind === "individual" ? offer.data : null;
    return {
      name: data.name,
      targetType: data.targetType,
      targetId: individual ? String(getTargetId(individual) ?? "") : "",
      pizzaFlavorIds: offer.kind === "group" ? [...offer.data.pizzaFlavorIds] :
        individual?.targetType === "PIZZA_FLAVOR" && individual.pizzaFlavorId ? [individual.pizzaFlavorId] : [],
      price: promotionCentsToMaskedCurrency(data.promotionalPriceCents),
      isActive: data.isActive,
      startsAt: toDateTimeLocal(data.startsAt),
      endsAt: toDateTimeLocal(data.endsAt),
      immediateStart: data.startsAt === null,
      noEndDate: data.endsAt === null,
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = offer !== null;
  const editingIndividual = offer?.kind === "individual";
  const availableProducts = useMemo(() => products.filter(product =>
    product.pricingType === "FIXED" && (product.isActive || (offer?.kind === "individual" && product.id === offer.data.productId))
  ), [products, offer]);
  const availableFlavors = useMemo(() => flavors.filter(flavor =>
    flavor.isActive || form.pizzaFlavorIds.includes(flavor.id)
  ), [flavors, form.pizzaFlavorIds]);
  const grande = sizes.find(size => isGrande(size.name) && size.isActive && size.isAvailable);
  const selectedProduct = products.find(product => form.targetType === "PRODUCT" && product.id === Number(form.targetId));
  const originalPriceCents = selectedProduct?.priceCents ?? null;
  const flavorPrices = form.targetType === "PIZZA_FLAVOR" && grande
    ? form.pizzaFlavorIds.map(id => {
      const flavor = flavors.find(item => item.id === id);
      if (!flavor) return null;
      return {
        name: flavor.name,
        price: grande.basePriceCents + flavor.additionalPriceCents + (flavor.isPremium ? flavor.premiumAdditionalCents : 0),
      };
    }).filter((item): item is { name: string; price: number } => item !== null)
    : [];
  const priceCents = maskedPromotionCurrencyToCents(form.price);
  const selectedCount = form.pizzaFlavorIds.length;
  function updateForm(changes: Partial<PromotionFormState>) {
    setForm(current => ({ ...current, ...changes }));
  }
  function toggleFlavor(id: number) {
    setForm(current => ({
      ...current,
      pizzaFlavorIds: current.pizzaFlavorIds.includes(id)
        ? current.pizzaFlavorIds.filter(value => value !== id)
        : [...current.pizzaFlavorIds, id],
    }));
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const name = form.name.trim();
      if (name.length < 2) throw new Error("Informe um nome com pelo menos 2 caracteres.");
      if (!Number.isSafeInteger(priceCents) || priceCents <= 0 || priceCents > 2_147_483_647) {
        throw new Error("Informe um preço promocional válido.");
      }
      const startsAt = form.immediateStart ? null : toISOString(form.startsAt);
      const endsAt = form.noEndDate ? null : toISOString(form.endsAt);
      if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        throw new Error("O término deve ser posterior ao início.");
      }
      if (endsAt && new Date(endsAt).getTime() <= Date.now()) {
        throw new Error("A data de término precisa estar no futuro.");
      }
      const common = { name, promotionalPriceCents: priceCents, isActive: form.isActive, startsAt, endsAt };
      if (form.targetType === "PIZZA_FLAVOR") {
        if (!grande) throw new Error("Não há uma pizza Grande disponível.");
        if (selectedCount === 0) throw new Error("Selecione pelo menos um sabor de pizza.");
        if (offer?.kind === "individual") {
          // Promoções individuais antigas permanecem editáveis pelo endpoint legado.
          // A troca de sabores é reservada às ofertas agrupadas.
          await adminPromotionsApi.update(offer.data.id, common);
        } else if (offer?.kind === "group") {
          await adminPromotionGroupsApi.update(offer.data.id, { ...common, pizzaFlavorIds: form.pizzaFlavorIds });
        } else {
          await adminPromotionGroupsApi.create({ ...common, targetType: "PIZZA_FLAVOR", pizzaFlavorIds: form.pizzaFlavorIds });
        }
      } else if (offer?.kind === "individual") {
        await adminPromotionsApi.update(offer.data.id, common);
      } else if (!offer) {
        const productId = Number(form.targetId);
        if (!Number.isInteger(productId) || productId <= 0) throw new Error("Selecione um produto.");
        await adminPromotionsApi.create({ ...common, targetType: "PRODUCT", productId });
      } else {
        throw new Error("Não é possível alterar o tipo de uma oferta agrupada.");
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="fixed inset-0 z-110 flex justify-end bg-stone-950/60" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <aside role="dialog" aria-modal="true" aria-label={isEditing ? "Editar promoção" : "Cadastrar promoção"}
        className="flex h-full w-full max-w-xl flex-col bg-[#faf8f5] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Promoções e ofertas</p>
            <h2 className="mt-1 text-xl font-black text-stone-900">{isEditing ? "Editar promoção" : "Nova promoção"}</h2>
            <p className="mt-1 text-sm text-stone-500">Configure preços e sabores participantes da oferta.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Fechar formulário"
            className="rounded-xl p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-50"><X size={20} /></button>
        </header>
        <form onSubmit={event => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            <section className="rounded-2xl border border-stone-200 bg-white p-4">
              <h3 className="font-black text-stone-900">Informações da oferta</h3>
              <label className="mt-4 block text-sm font-semibold text-stone-700">Nome da promoção
                <input type="text" required maxLength={120} value={form.name} onChange={event => updateForm({ name: event.target.value })}
                  placeholder="Ex.: Terça da Pizza" className={fieldClass} />
              </label>
              <label className="mt-4 block text-sm font-semibold text-stone-700">Aplicar promoção em
                <select value={form.targetType} disabled={isEditing} onChange={event => updateForm({
                  targetType: event.target.value as PromotionTargetType, targetId: "", pizzaFlavorIds: [],
                })} className={fieldClass}>
                  <option value="PRODUCT">Produto convencional</option>
                  <option value="PIZZA_FLAVOR">Sabores de pizza</option>
                </select>
              </label>
              {form.targetType === "PRODUCT" ? (
                <label className="mt-4 block text-sm font-semibold text-stone-700">Produto
                  <select value={form.targetId} required disabled={isEditing} onChange={event => updateForm({ targetId: event.target.value })} className={fieldClass}>
                    <option value="">Selecione um produto</option>
                    {availableProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                </label>
              ) : (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-700">Sabores participantes</p>
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">{selectedCount} selecionado(s)</span>
                  </div>
                  {editingIndividual && <p className="mt-2 text-xs text-amber-700">Esta é uma promoção individual antiga. Seus sabores não podem ser alterados aqui. Para selecionar vários sabores, crie uma nova oferta agrupada.</p>}
                  <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-2">
                    {availableFlavors.length === 0 ? <p className="p-3 text-sm text-stone-500">Nenhum sabor disponível.</p> : availableFlavors.map(flavor => (
                      <label key={flavor.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${form.pizzaFlavorIds.includes(flavor.id) ? "border-orange-200 bg-orange-50" : "border-transparent bg-white"} ${editingIndividual ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-orange-200"}`}>
                        <input type="checkbox" checked={form.pizzaFlavorIds.includes(flavor.id)} disabled={editingIndividual}
                          onChange={() => toggleFlavor(flavor.id)} className="h-4 w-4 accent-orange-600" />
                        <span className="flex-1 font-medium text-stone-800">{flavor.name}</span>
                        {flavor.isPremium && <span className="text-xs font-semibold text-orange-700">Premium</span>}
                      </label>
                    ))}
                  </div>
                  {!editingIndividual && availableFlavors.length > 0 && (
                    <div className="mt-2 flex gap-3 text-xs font-semibold">
                      <button type="button" onClick={() => updateForm({ pizzaFlavorIds: availableFlavors.map(flavor => flavor.id) })} className="text-orange-700 hover:underline">Selecionar todos</button>
                      <button type="button" onClick={() => updateForm({ pizzaFlavorIds: [] })} className="text-stone-500 hover:underline">Limpar seleção</button>
                    </div>
                  )}
                  <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-3 text-xs leading-relaxed text-orange-900">
                    <strong>Pizza Grande:</strong> a promoção é aplicada somente quando o cliente escolhe exatamente um sabor. Pizzas de dois sabores continuam com preço normal.
                  </div>
                </div>
              )}
              {editingIndividual && form.targetType === "PRODUCT" && <p className="mt-3 text-xs text-stone-500">Para trocar o produto, cadastre uma nova promoção.</p>}
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-4">
              <h3 className="font-black text-stone-900">Preço promocional</h3>
              {originalPriceCents !== null && <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-50 p-3">
                <span className="text-sm text-stone-600">Preço original</span><strong className="text-stone-800">{formatPromotionPrice(originalPriceCents)}</strong>
              </div>}
              {flavorPrices.length > 0 && <div className="mt-4 rounded-xl bg-stone-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Preços originais dos sabores</p>
                <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">{flavorPrices.map(item => <div key={item.name} className="flex justify-between gap-2 text-sm text-stone-700">
                  <span>{item.name}</span><strong>{formatPromotionPrice(item.price)}</strong>
                </div>)}</div>
              </div>}
              <label className="mt-4 block text-sm font-semibold text-stone-700">Novo preço (R$)
                <input type="text" inputMode="numeric" required value={form.price} onChange={event => updateForm({ price: maskPromotionCurrency(event.target.value) })}
                  placeholder="0,00" className={fieldClass} />
              </label>
              <p className="mt-2 text-xs text-stone-500">Digite apenas números: 2500 corresponde a R$ 25,00.</p>
              {originalPriceCents !== null && priceCents > 0 && priceCents < originalPriceCents && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">
                  <TrendingDown size={17} /> Economia de {formatPromotionPrice(originalPriceCents - priceCents)} ({((originalPriceCents - priceCents) / originalPriceCents * 100).toFixed(1)}%)
                </div>
              )}
              {flavorPrices.length > 0 && priceCents > 0 && <div className="mt-3 space-y-1 text-xs text-stone-600">
                {flavorPrices.map(item => <p key={item.name}>{item.name}: {item.price > priceCents
                  ? `economia de ${formatPromotionPrice(item.price - priceCents)}`
                  : "sem desconto em relação ao preço original"}</p>)}
              </div>}
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-2"><CalendarDays size={19} className="text-orange-600" /><h3 className="font-black text-stone-900">Período da promoção</h3></div>
              <p className="mt-2 text-xs text-stone-500">Configure as datas ou mantenha a promoção disponível por tempo indeterminado.</p>
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 text-sm font-semibold text-stone-700">
                <input type="checkbox" checked={form.immediateStart} onChange={event => updateForm({ immediateStart: event.target.checked })} className="h-4 w-4 accent-orange-600" />Iniciar imediatamente
              </label>
              {!form.immediateStart && <label className="mt-3 block text-sm font-semibold text-stone-700">Data de início
                <input type="datetime-local" required value={form.startsAt} onChange={event => updateForm({ startsAt: event.target.value })} className={fieldClass} />
              </label>}
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 text-sm font-semibold text-stone-700">
                <input type="checkbox" checked={form.noEndDate} onChange={event => updateForm({ noEndDate: event.target.checked })} className="h-4 w-4 accent-orange-600" />Sem data de término (vitalícia)
              </label>
              {!form.noEndDate && <label className="mt-3 block text-sm font-semibold text-stone-700">Data de término
                <input type="datetime-local" required value={form.endsAt} onChange={event => updateForm({ endsAt: event.target.value })} className={fieldClass} />
              </label>}
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-4">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div><p className="font-black text-stone-900">Promoção habilitada</p><p className="mt-1 text-xs text-stone-500">Permite utilizar a oferta dentro do período configurado.</p></div>
                <input type="checkbox" checked={form.isActive} onChange={event => updateForm({ isActive: event.target.checked })} className="h-5 w-5 accent-orange-600" />
              </label>
            </section>
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" />{error}</div>}
          </div>
          <footer className="flex gap-3 border-t border-stone-200 bg-white p-4 sm:p-5">
            <button type="button" onClick={onClose} disabled={saving} className="min-h-11 flex-1 rounded-xl border border-stone-200 px-4 text-sm font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
              {saving && <Loader2 size={17} className="animate-spin" />}{saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar promoção"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

export function AdminDashboardPromotions() {
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [groups, setGroups] = useState<AdminPromotionGroup[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [flavors, setFlavors] = useState<PizzaFlavorOption[]>([]);
  const [sizes, setSizes] = useState<PizzaSizeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [changingKey, setChangingKey] = useState<string | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const [promotionsResult, groupsResult, productsResult, flavorsResult, sizesResult] = await Promise.all([
      adminPromotionsApi.listAdmin(), adminPromotionGroupsApi.listAdmin(), productsApi.listAdmin(),
      fetchJson<PizzaFlavorOption[]>("/api/pizza-catalog-flavors/admin", signal),
      fetchJson<PizzaSizeOption[]>("/api/pizza-sizes", signal),
    ]);
    if (signal?.aborted) return;
    setPromotions(promotionsResult);
    setGroups(groupsResult);
    setProducts(productsResult);
    setFlavors(flavorsResult);
    setSizes(sizesResult);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      try { await loadData(controller.signal); }
      catch (err) { if (!controller.signal.aborted) setError(errorMessage(err)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    });
    return () => controller.abort();
  }, [loadData]);
  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true); setError(null);
    try { await loadData(); } catch (err) { setError(errorMessage(err)); }
    finally { setRefreshing(false); }
  }
  const offers = useMemo<Offer[]>(() => [
    ...groups.map(group => ({ kind: "group" as const, id: group.id, data: group })),
    ...promotions.filter(promotion => promotion.groupId == null).map(promotion => ({ kind: "individual" as const, id: promotion.id, data: promotion })),
  ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()), [groups, promotions]);
  async function handleToggle(offer: Offer) {
    if (changingKey !== null) return;
    setChangingKey(offerKey(offer)); setError(null);
    try {
      if (offer.kind === "group") {
        if (offer.data.isActive) await adminPromotionGroupsApi.deactivate(offer.id);
        else await adminPromotionGroupsApi.reactivate(offer.id);
      } else {
        if (offer.data.isActive) await adminPromotionsApi.deactivate(offer.id);
        else await adminPromotionsApi.reactivate(offer.id);
      }
      await loadData();
    } catch (err) { setError(errorMessage(err)); }
    finally { setChangingKey(null); }
  }
  const statistics = useMemo(() => ({
    total: offers.length,
    active: offers.filter(offer => getPromotionStatus(offer.data) === "ACTIVE").length,
    scheduled: offers.filter(offer => getPromotionStatus(offer.data) === "SCHEDULED").length,
    inactive: offers.filter(offer => getPromotionStatus(offer.data) === "INACTIVE").length,
  }), [offers]);
  function getTargetName(offer: Offer): string {
    if (offer.kind === "group") {
      return offer.data.pizzaFlavorIds.map(id => flavors.find(flavor => flavor.id === id)?.name ?? `Sabor #${id}`).join(", ");
    }
    const id = getTargetId(offer.data);
    return offer.data.targetType === "PRODUCT"
      ? products.find(product => product.id === id)?.name ?? `Produto #${id}`
      : flavors.find(flavor => flavor.id === id)?.name ?? `Sabor #${id}`;
  }
  const filteredOffers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return offers.filter(offer => {
      if (statusFilter !== "ALL" && getPromotionStatus(offer.data) !== statusFilter) return false;
      if (!term) return true;
      return [offer.data.name, getTargetName(offer), String(offer.id)].some(value => value.toLocaleLowerCase("pt-BR").includes(term));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, products, flavors, search, statusFilter]);
  function openCreate() { setEditingOffer(null); setFormOpen(true); }
  function openEdit(offer: Offer) { setEditingOffer(offer); setFormOpen(true); }
  return (
    <div className="space-y-6 pb-8">
      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle size={19} className="shrink-0" /><span className="flex-1">{error}</span>
        <button type="button" onClick={() => setError(null)} aria-label="Fechar aviso"><X size={17} /></button>
      </div>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatisticCard title="Total de ofertas" value={statistics.total} icon={Tag} description="Promoções cadastradas" />
        <StatisticCard title="Ativas" value={statistics.active} icon={CheckCircle2} description="Disponíveis no momento" />
        <StatisticCard title="Agendadas" value={statistics.scheduled} icon={Clock3} description="Com início futuro" />
        <StatisticCard title="Desativadas" value={statistics.inactive} icon={Percent} description="Ofertas desabilitadas" />
      </div>
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h3 className="font-black text-stone-900">Ofertas cadastradas</h3><p className="mt-1 text-xs text-stone-500">{filteredOffers.length} promoção(ões) encontrada(s)</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 lg:flex-initial"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar promoção..." className="min-h-10 w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-orange-500 sm:w-56" /></div>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filtrar por status" className="min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700">
              <option value="ALL">Todos os status</option><option value="ACTIVE">Ativas</option><option value="SCHEDULED">Agendadas</option><option value="EXPIRED">Expiradas</option><option value="INACTIVE">Desativadas</option>
            </select>
            <button type="button" onClick={() => void handleRefresh()} disabled={refreshing} title="Atualizar promoções" aria-label="Atualizar promoções" className="flex min-h-10 items-center justify-center rounded-xl border border-stone-200 px-3 text-stone-600 hover:bg-stone-50 disabled:opacity-50"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button>
            <button type="button" onClick={openCreate} disabled={loading} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#302a22] px-4 text-sm font-semibold text-white transition hover:bg-[#483a2b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:opacity-50"><Plus size={17} aria-hidden="true" />Nova promoção</button>
          </div>
        </div>
        {loading ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-stone-500"><Loader2 size={28} className="animate-spin text-orange-600" /><p className="text-sm">Carregando promoções...</p></div>
          : filteredOffers.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
            <div className="rounded-2xl bg-orange-50 p-4 text-orange-600"><Tag size={27} /></div>
            <h3 className="mt-4 font-black text-stone-900">Nenhuma promoção encontrada</h3>
            <p className="mt-2 max-w-sm text-sm text-stone-500">Cadastre uma oferta ou altere os filtros para visualizar outras promoções.</p>
            {offers.length === 0 && <button type="button" onClick={openCreate} className="mt-5 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700">Criar primeira promoção</button>}
          </div> : <div className="overflow-x-auto"><table role="table" aria-label="Ofertas cadastradas" className="w-full text-left max-xl:block xl:min-w-212.5">
            <thead role="rowgroup" className="bg-stone-50 text-xs uppercase tracking-wide text-stone-600 max-xl:sr-only"><tr>
              <th className="px-5 py-4 font-bold">Promoção</th><th className="px-5 py-4 font-bold">Produto / Sabor</th>
              <th className="px-5 py-4 font-bold">Preço</th><th className="px-5 py-4 font-bold">Período</th>
              <th className="px-5 py-4 font-bold">Status</th><th className="px-5 py-4 text-right font-bold">Ações</th>
            </tr></thead>
            <tbody role="rowgroup" className="divide-y divide-stone-100 max-xl:block">{filteredOffers.map(offer => (
              <tr role="row" key={offerKey(offer)} className="transition hover:bg-stone-50/70 max-xl:grid max-xl:grid-cols-2 max-xl:gap-x-3 max-xl:gap-y-2 max-xl:p-4">
                <td role="cell" className="max-xl:col-span-2 min-w-0 break-words xl:px-4 xl:py-3"><p className="font-bold text-stone-900">{offer.data.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{offer.kind === "group" ? "Oferta agrupada" : "Promoção individual"} #{offer.id}</p></td>
                <td role="cell" className="min-w-0 break-words xl:px-4 xl:py-3"><span aria-hidden="true" className="mb-0.5 block text-xs font-medium text-stone-600 xl:hidden">Produto / sabor</span><p className="max-w-64 text-sm font-semibold text-stone-800">{getTargetName(offer)}</p>
                  <p className="mt-1 text-xs text-stone-500">{offer.kind === "group" ? `${offer.data.pizzaFlavorIds.length} sabores de pizza` : PROMOTION_TARGET_LABELS[offer.data.targetType]}</p></td>
                <td role="cell" className="min-w-0 break-words xl:px-4 xl:py-3"><span aria-hidden="true" className="mb-0.5 block text-xs font-medium text-stone-600 xl:hidden">Preço</span><p className="font-black text-green-700">{formatPromotionPrice(offer.data.promotionalPriceCents)}</p></td>
                <td role="cell" className="max-xl:col-span-2 min-w-0 break-words xl:px-4 xl:py-3"><p className="text-xs text-stone-700">Início: {offer.data.startsAt ? formatDate(offer.data.startsAt) : "Imediato"}</p>
                  <p className="mt-1 text-xs text-stone-500">Fim: {offer.data.endsAt ? formatDate(offer.data.endsAt) : "Sem vencimento"}</p></td>
                <td role="cell" className="min-w-0 break-words xl:px-4 xl:py-3"><PromotionStatusBadge offer={offer} /></td>
                <td role="cell" className="max-xl:col-span-2 min-w-0 break-words xl:px-4 xl:py-3"><div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => openEdit(offer)} title="Editar promoção" aria-label={`Editar ${offer.data.name}`} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"><Edit3 size={16} /></button>
                  <button type="button" disabled={changingKey !== null} onClick={() => void handleToggle(offer)} className={`min-w-24 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${offer.data.isActive ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"}`}>
                    {changingKey === offerKey(offer) ? "Aguarde..." : offer.data.isActive ? "Desativar" : "Ativar"}
                  </button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>}
      </section>
      {formOpen && <PromotionForm key={editingOffer ? offerKey(editingOffer) : "new-promotion"} offer={editingOffer}
        products={products} flavors={flavors} sizes={sizes}
        onClose={() => { setFormOpen(false); setEditingOffer(null); }}
        onSaved={async () => { await loadData(); }} />}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Filter,
  LayoutGrid,
  Clock3,
  MapPin,
  PackageOpen,
  RefreshCw,
  Search,
  ShoppingBag,
  UtensilsCrossed,
  Truck,
  X,
} from "lucide-react";

import {
  FULFILLMENT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatOrderDate,
  formatOrderPrice,
  getAdminOrderById,
  getAdminOrders,
  updateAdminOrderStatus,
  type AdminOrder,
  type AdminOrderStatus,
} from "../api/admin-orders.api";

const STATUSES: AdminOrderStatus[] = [
  "PENDING", "CONFIRMED", "PREPARING", "READY",
  "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED",
];

const statusClasses: Record<AdminOrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-800 border-blue-200",
  PREPARING: "bg-orange-50 text-orange-800 border-orange-200",
  READY: "bg-violet-50 text-violet-800 border-violet-200",
  OUT_FOR_DELIVERY: "bg-sky-50 text-sky-800 border-sky-200",
  COMPLETED: "bg-green-50 text-green-800 border-green-200",
  CANCELLED: "bg-red-50 text-red-800 border-red-200",
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function StatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

function OrderDetails({
  order,
  onClose,
  onUpdated,
}: {
  order: AdminOrder;
  onClose: () => void;
  onUpdated: (order: AdminOrder) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<AdminOrderStatus>(order.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    if (saving || selectedStatus === order.status) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAdminOrderStatus(order.id, selectedStatus);
      onUpdated(updated);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const address = order.deliveryAddress;

  return (
    <div className="fixed inset-0 z-100 flex justify-end bg-stone-950/60" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <aside role="dialog" aria-modal="true" aria-label={`Detalhes do pedido ${order.orderNumber}`} className="flex h-full w-full max-w-2xl flex-col bg-[#faf8f5] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Detalhes do pedido</p>
            <h3 className="mt-1 text-xl font-black text-stone-900">{order.orderNumber}</h3>
            <p className="mt-1 text-xs text-stone-500">{formatOrderDate(order.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Fechar detalhes" className="rounded-xl p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-50"><X size={20} /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-black text-stone-900">Situação do pedido</h4>
              <StatusBadge status={order.status} />
            </div>
            <label htmlFor="admin-order-status" className="mt-4 block text-xs font-bold text-stone-600">Alterar status</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <select id="admin-order-status" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as AdminOrderStatus)} disabled={saving || order.status === "COMPLETED" || order.status === "CANCELLED"} className="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800">
                {STATUSES.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
              </select>
              <button type="button" onClick={() => void handleUpdate()} disabled={saving || selectedStatus === order.status || order.status === "COMPLETED" || order.status === "CANCELLED"} className="min-h-11 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? "Salvando..." : "Atualizar status"}
              </button>
            </div>
            {(order.status === "COMPLETED" || order.status === "CANCELLED") && <p className="mt-2 text-xs text-stone-500">Este pedido está encerrado.</p>}
            {error && <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</p>}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h4 className="font-black text-stone-900">Cliente e recebimento</h4>
            <p className="mt-3 text-sm font-semibold text-stone-800">{order.customerName}</p>
            <p className="text-xs text-stone-500">{order.customerEmail}</p>
            <p className="mt-3 flex items-center gap-2 text-sm font-bold text-orange-800">
              {order.fulfillmentType === "DELIVERY" ? <Truck size={17} /> : <ShoppingBag size={17} />}
              {FULFILLMENT_TYPE_LABELS[order.fulfillmentType]}
            </p>
            {order.fulfillmentType === "DELIVERY" && address && (
              <div className="mt-2 flex gap-2 rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
                <MapPin size={17} className="mt-0.5 shrink-0 text-orange-700" />
                <div>
                  <p>{address.street}, {address.number} — {address.neighborhood}</p>
                  {address.complement && <p>{address.complement}</p>}
                  <p>{address.city}/{address.state}</p>
                </div>
              </div>
            )}
            {order.notes && <p className="mt-3 rounded-xl bg-orange-50 p-3 text-sm text-stone-700"><strong>Observações do pedido:</strong> {order.notes}</p>}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h4 className="font-black text-stone-900">Itens do pedido</h4>
            <div className="mt-3 divide-y divide-stone-100">
              {order.items.map((item) => (
                <article key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between gap-3 text-sm">
                    <p className="font-bold text-stone-900">{item.quantity}x {item.productName}</p>
                    <strong className="shrink-0 text-stone-900">{formatOrderPrice(item.totalPriceCents)}</strong>
                  </div>
                  {item.pizza && (
                    <div className="mt-2 text-xs text-stone-600">
                      <p><strong>Tamanho:</strong> {item.pizza.size.name}</p>
                      <p><strong>Sabores:</strong> {item.pizza.flavors.map((flavor) => flavor.name).join(", ")}</p>
                      {item.pizza.addons.length > 0 && <p><strong>Adicionais:</strong> {item.pizza.addons.map((addon) => addon.name).join(", ")}</p>}
                    </div>
                  )}
                  {item.addons.length > 0 && <p className="mt-2 text-xs text-stone-600"><strong>Adicionais:</strong> {item.addons.map((addon) => `${addon.quantity}x ${addon.name}`).join(", ")}</p>}
                  {item.removedIngredients.length > 0 && <p className="mt-1 text-xs text-red-700"><strong>Sem:</strong> {item.removedIngredients.map((ingredient) => ingredient.name).join(", ")}</p>}
                  {item.notes && <p className="mt-2 rounded-lg bg-orange-50 p-2 text-xs text-stone-700"><strong>Observação:</strong> {item.notes}</p>}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h4 className="font-black text-stone-900">Resumo financeiro</h4>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatOrderPrice(order.subtotalCents)}</span></div>
              <div className="flex justify-between"><span>Entrega</span><span>{formatOrderPrice(order.deliveryFeeCents)}</span></div>
              <div className="flex justify-between border-t border-stone-200 pt-3 font-black"><span>Total</span><span>{formatOrderPrice(order.totalCents)}</span></div>
            </div>
            <p className="mt-3 text-xs text-stone-600">Pagamento: {PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
            {order.paymentStatus === "NOT_PROCESSED" && <p className="mt-1 text-xs text-amber-700">Pagamento online ainda não processado. Não considere este pedido pago.</p>}
          </section>
        </div>
      </aside>
    </div>
  );
}

export function AdminDashboardOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    const result = await getAdminOrders(signal);
    setOrders(result);
  }, []);

  useEffect(() => {
  const controller = new AbortController();

  void Promise.resolve().then(async () => {
    if (controller.signal.aborted) return;

    try {
      await loadOrders(controller.signal);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(errorMessage(err));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  });

  return () => controller.abort();
}, [loadOrders]);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      await loadOrders();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleOpenOrder(orderId: number) {
    if (openingId !== null) return;
    setOpeningId(orderId);
    setError(null);
    try {
      setSelectedOrder(await getAdminOrderById(orderId));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setOpeningId(null);
    }
  }

  function handleOrderUpdated(updated: AdminOrder) {
    setSelectedOrder(updated);
    setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
  }

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return orders
      .filter((order) => statusFilter === "ALL" || order.status === statusFilter)
      .filter((order) => !term || [order.orderNumber, order.customerName, order.customerEmail].some((value) => value.toLocaleLowerCase("pt-BR").includes(term)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, search, statusFilter]);

  const pendingCount = orders.filter((order) => order.status === "PENDING").length;
  const activeCount = orders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status)).length;

  const completedCount = orders.filter((order) => order.status === "COMPLETED").length;
  const deliveryCount = orders.filter((order) => order.fulfillmentType === "DELIVERY" && !["COMPLETED", "CANCELLED"].includes(order.status)).length;
  const hasFilters = search.trim().length > 0 || statusFilter !== "ALL";
  const quickFilters: { label: string; value: AdminOrderStatus | "ALL"; count: number }[] = [
    { label: "Todos", value: "ALL", count: orders.length },
    { label: "Pendentes", value: "PENDING", count: pendingCount },
    { label: "Confirmados", value: "CONFIRMED", count: orders.filter((order) => order.status === "CONFIRMED").length },
    { label: "Em preparo", value: "PREPARING", count: orders.filter((order) => order.status === "PREPARING").length },
    { label: "Prontos", value: "READY", count: orders.filter((order) => order.status === "READY").length },
    { label: "Concluídos", value: "COMPLETED", count: completedCount },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      {/* CABEÇALHO */}
      <section className="relative overflow-hidden rounded-[26px] bg-linear-to-r from-[#a92b06] via-[#c8380a] to-[#eb570f] px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-40 border-white/5" />
        <div className="pointer-events-none absolute bottom-0 right-20 h-32 w-32 translate-y-1/2 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-50">
              <ClipboardList size={13} /> Central de pedidos
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Gerencie seus pedidos</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-orange-50/90">Acompanhe o fluxo de atendimento, confira os itens e mantenha tudo organizado.</p>
          </div>
          <div className="flex items-center gap-3 self-start rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><UtensilsCrossed size={20} /></div>
            <div><p className="text-[11px] text-orange-50/80">Pedidos em andamento</p><p className="text-2xl font-black leading-tight">{activeCount}</p></div>
          </div>
        </div>
      </section>

      {/* INDICADORES */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total de pedidos", value: orders.length, icon: ClipboardList, tone: "text-stone-800 bg-stone-100", sub: "Pedidos registrados" },
          { label: "Aguardando", value: pendingCount, icon: Clock3, tone: "text-amber-700 bg-amber-50", sub: "Precisam de confirmação" },
          { label: "Em aberto", value: activeCount, icon: LayoutGrid, tone: "text-orange-700 bg-orange-50", sub: "Em atendimento" },
          { label: "Entregas ativas", value: deliveryCount, icon: Truck, tone: "text-sky-700 bg-sky-50", sub: "Pedidos para entrega" },
        ].map(({ label, value, icon: Icon, tone, sub }) => (
          <div key={label} className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-stone-500">{label}</span><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span></div>
            <p className="mt-2 text-3xl font-black tracking-tight text-stone-900">{loading ? "—" : value}</p>
            <p className="mt-1 text-[11px] text-stone-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><h3 className="flex items-center gap-2 text-base font-black text-stone-900"><Filter size={18} className="text-orange-600" /> Lista de pedidos</h3><p className="mt-1 text-xs text-stone-500">Encontre rapidamente o que precisa</p></div>
          <button type="button" onClick={() => void handleRefresh()} disabled={refreshing || loading} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-stone-200 bg-white px-4 text-xs font-bold text-stone-700 transition hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando..." : "Atualizar pedidos"}</button>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1"><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por número, nome ou e-mail..." aria-label="Buscar pedido ou cliente" className="min-h-11 w-full rounded-xl border border-stone-200 bg-[#fcfbfa] pl-11 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></label>
            <select aria-label="Filtrar pedidos por status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AdminOrderStatus | "ALL")} className="min-h-11 rounded-xl border border-stone-200 bg-[#fcfbfa] px-3 text-sm text-stone-700 outline-none focus:border-orange-500"><option value="ALL">Todos os status</option>{STATUSES.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}</select>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickFilters.map((filter) => (
              <button key={filter.value} type="button" onClick={() => setStatusFilter(filter.value)} aria-pressed={statusFilter === filter.value} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${statusFilter === filter.value ? "border-orange-600 bg-orange-600 text-white shadow-sm" : "border-stone-200 bg-white text-stone-600 hover:border-orange-200 hover:bg-orange-50"}`}>
                {filter.label}<span className={`rounded-md px-1.5 py-0.5 text-[10px] ${statusFilter === filter.value ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}`}>{filter.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{error}</span></div>}

      {/* LISTAGEM */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1"><div><h3 className="text-base font-black text-stone-900">Pedidos recebidos</h3><p className="mt-0.5 text-xs text-stone-500">{loading ? "Buscando pedidos..." : `${filteredOrders.length} ${filteredOrders.length === 1 ? "pedido encontrado" : "pedidos encontrados"}`}</p></div>{hasFilters && <button type="button" onClick={() => { setSearch(""); setStatusFilter("ALL"); }} className="text-xs font-bold text-orange-700 hover:underline">Limpar filtros</button>}</div>
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-stone-200 bg-white" />)}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-5 py-14 text-center shadow-sm"><PackageOpen size={36} className="mx-auto text-orange-500" /><p className="mt-3 font-bold text-stone-800">{orders.length === 0 ? "Nenhum pedido recebido até o momento." : "Nenhum pedido corresponde aos filtros."}</p><p className="mt-1 text-xs text-stone-500">{orders.length === 0 ? "Os novos pedidos aparecerão aqui." : "Tente outro termo ou altere os filtros."}</p></div>
        ) : (
          <div className="grid gap-3">
            {filteredOrders.map((order) => (
              <article key={order.id} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md">
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${order.fulfillmentType === "DELIVERY" ? "bg-orange-50 text-orange-700" : "bg-stone-100 text-stone-700"}`}>{order.fulfillmentType === "DELIVERY" ? <Truck size={21} /> : <ShoppingBag size={21} />}</div>
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="text-base font-black tracking-tight text-stone-900 sm:text-lg">{order.orderNumber}</h4><StatusBadge status={order.status} /></div><p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500"><CalendarDays size={13} />{formatOrderDate(order.createdAt)}</p><p className="mt-2 truncate text-sm font-bold text-stone-800">{order.customerName}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-stone-100 pt-3 sm:grid-cols-3 lg:w-[44%] lg:border-l lg:border-t-0 lg:py-1 lg:pl-6">
                    <div><p className="text-[11px] font-medium text-stone-400">Modalidade</p><p className="mt-1 text-xs font-bold text-stone-700">{FULFILLMENT_TYPE_LABELS[order.fulfillmentType]}</p><p className="mt-1 text-[11px] text-stone-400">{order.items.reduce((sum, item) => sum + item.quantity, 0)} itens</p></div>
                    <div><p className="text-[11px] font-medium text-stone-400">Pagamento</p><p className={`mt-1 text-xs font-bold ${order.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"}`}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p></div>
                    <div className="col-span-2 sm:col-span-1"><p className="text-[11px] font-medium text-stone-400">Valor total</p><p className="mt-1 whitespace-nowrap text-lg font-black text-stone-900">{formatOrderPrice(order.totalCents)}</p></div>
                  </div>
                  <button type="button" disabled={openingId !== null} onClick={() => void handleOpenOrder(order.id)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-xs font-bold text-white transition hover:bg-orange-700 disabled:opacity-50 lg:self-center">{openingId === order.id ? "Abrindo..." : "Detalhes"}<ChevronRight size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {selectedOrder && <OrderDetails key={`${selectedOrder.id}:${selectedOrder.status}`} order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={handleOrderUpdated} />}
    </div>
  );
}

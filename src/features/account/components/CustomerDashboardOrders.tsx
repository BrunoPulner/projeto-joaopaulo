
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  cancelMyOrder,
  getMyOrders,
  type CreatedOrder,
  type OrderItemSnapshot,
  type OrderStatus,
} from "../../cart/api/orders.api";

// ============================================
// CONFIGURAÇÕES
// ============================================

const CANCELLATION_WINDOW_MS = 5 * 60 * 1000;
const POLLING_INTERVAL_MS = 15_000;

// Substituir pelo WhatsApp real do restaurante.
const restaurantWhatsAppNumber = "55DDDNÚMEROAQUI";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// ============================================
// STATUS
// ============================================

const statusDetails: Record<
  OrderStatus,
  {
    label: string;
    icon: LucideIcon;
    className: string;
  }
> = {
  PENDING: {
    label: "Recebido",
    icon: Clock3,
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  CONFIRMED: {
    label: "Confirmado",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  PREPARING: {
    label: "Em preparo",
    icon: Clock3,
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  READY: {
    label: "Pronto",
    icon: PackageCheck,
    className: "bg-sky-50 text-sky-800 ring-sky-200",
  },
  OUT_FOR_DELIVERY: {
    label: "Saiu para entrega",
    icon: Truck,
    className: "bg-blue-50 text-blue-800 ring-blue-200",
  },
  COMPLETED: {
    label: "Concluído",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-red-50 text-red-800 ring-red-200",
  },
};

type ProgressStep = {
  status: OrderStatus;
  label: string;
};

const deliverySteps: ProgressStep[] = [
  { status: "PENDING", label: "Recebido" },
  { status: "CONFIRMED", label: "Confirmado" },
  { status: "PREPARING", label: "Em preparo" },
  { status: "READY", label: "Pronto" },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Em entrega",
  },
  { status: "COMPLETED", label: "Entregue" },
];

const pickupSteps: ProgressStep[] = [
  { status: "PENDING", label: "Recebido" },
  { status: "CONFIRMED", label: "Confirmado" },
  { status: "PREPARING", label: "Em preparo" },
  { status: "READY", label: "Pronto" },
  { status: "COMPLETED", label: "Retirado" },
];

// ============================================
// UTILITÁRIOS
// ============================================

function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return dateFormatter.format(date);
}

function isActiveOrder(order: CreatedOrder): boolean {
  return (
    order.status !== "COMPLETED" &&
    order.status !== "CANCELLED"
  );
}

function getRemainingMs(
  order: CreatedOrder,
  now: number,
): number {
  const createdAt = new Date(order.createdAt).getTime();

  if (!Number.isFinite(createdAt)) {
    return 0;
  }

  return Math.max(
    0,
    createdAt + CANCELLATION_WINDOW_MS - now,
  );
}

function canCancelOrder(
  order: CreatedOrder,
  now: number,
): boolean {
  return (
    order.status === "PENDING" &&
    getRemainingMs(order, now) > 0
  );
}

function formatRemainingTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function getFulfillmentLabel(
  order: CreatedOrder,
): string {
  return order.fulfillmentType === "DELIVERY"
    ? "Entrega"
    : "Retirada";
}

function getStatusLabel(
  order: CreatedOrder,
): string {
  if (order.status === "COMPLETED") {
    return order.fulfillmentType === "DELIVERY"
      ? "Entregue"
      : "Retirado";
  }

  if (order.status === "READY") {
    return order.fulfillmentType === "DELIVERY"
      ? "Pronto para entrega"
      : "Pronto para retirada";
  }

  return statusDetails[order.status].label;
}

// ============================================
// BADGE DE STATUS
// ============================================

function StatusBadge({
  order,
}: {
  order: CreatedOrder;
}) {
  const {
    icon: Icon,
    className,
  } = statusDetails[order.status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${className}`}
    >
      <Icon size={15} aria-hidden="true" />
      {getStatusLabel(order)}
    </span>
  );
}

// ============================================
// PROGRESSO DO PEDIDO
// ============================================

function OrderProgress({
  order,
}: {
  order: CreatedOrder;
}) {
  if (order.status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        Este pedido foi cancelado.
      </div>
    );
  }

  const steps =
    order.fulfillmentType === "DELIVERY"
      ? deliverySteps
      : pickupSteps;

  const activeStep = steps.findIndex(
    (step) => step.status === order.status,
  );

  const progress =
    activeStep <= 0
      ? 0
      : (activeStep / (steps.length - 1)) * 100;

  return (
    <div
      aria-label={`Status do pedido: ${getStatusLabel(order)}`}
      className="overflow-x-auto pb-2"
    >
      <div
        className="relative grid min-w-85"
        style={{
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute left-[8%] right-[8%] top-3 h-1 rounded-full bg-stone-200"
        >
          <div
            className="h-full rounded-full bg-orange-700 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const complete = index <= activeStep;

          return (
            <div
              key={step.status}
              className="relative z-10 flex flex-col items-center gap-2 text-center"
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full border-2 ${
                  complete
                    ? "border-orange-700 bg-orange-700 text-white"
                    : "border-stone-300 bg-white text-stone-400"
                }`}
              >
                {complete ? (
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="size-2 rounded-full bg-current" />
                )}
              </span>

              <span
                className={`px-0.5 text-[10px] font-semibold leading-tight ${
                  complete
                    ? "text-orange-800"
                    : "text-stone-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ITENS DO PEDIDO
// ============================================

function OrderItems({
  items,
}: {
  items: OrderItemSnapshot[];
}) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start justify-between gap-4 text-sm"
        >
          <div className="min-w-0">
            <p className="text-stone-700">
              <strong className="mr-2 text-stone-900">
                {item.quantity}x
              </strong>
              {item.productName}
            </p>

            {item.pizza && (
              <div className="mt-1 space-y-1 text-xs text-stone-500">
                <p>Tamanho: {item.pizza.size.name}</p>
                <p>
                  Sabores:{" "}
                  {item.pizza.flavors
                    .map((flavor) => flavor.name)
                    .join(", ")}
                </p>

                {item.pizza.addons.length > 0 && (
                  <p>
                    Adicionais:{" "}
                    {item.pizza.addons
                      .map((addon) => addon.name)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}

            {item.addons?.length > 0 && (
              <p className="mt-1 text-xs text-stone-500">
                Adicionais:{" "}
                {item.addons
                  .map(
                    (addon) =>
                      `${addon.quantity}x ${addon.name}`,
                  )
                  .join(", ")}
              </p>
            )}

            {item.removedIngredients?.length > 0 && (
              <p className="mt-1 text-xs text-stone-500">
                Sem:{" "}
                {item.removedIngredients
                  .map((ingredient) => ingredient.name)
                  .join(", ")}
              </p>
            )}

            {item.notes && (
              <p className="mt-1 text-xs italic text-stone-500">
                Obs.: {item.notes}
              </p>
            )}
          </div>

          <span className="shrink-0 font-medium text-stone-700">
            {formatCurrency(item.totalPriceCents)}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ============================================
// RESUMO FINANCEIRO
// ============================================

function OrderTotals({
  order,
}: {
  order: CreatedOrder;
}) {
  return (
    <div className="space-y-2 border-t border-stone-100 pt-4 text-sm">
      <div className="flex justify-between gap-4 text-stone-600">
        <span>Subtotal</span>
        <span>{formatCurrency(order.subtotalCents)}</span>
      </div>

      {order.fulfillmentType === "DELIVERY" && (
        <div className="flex justify-between gap-4 text-stone-600">
          <span>Taxa de entrega</span>
          <span>
            {formatCurrency(order.deliveryFeeCents)}
          </span>
        </div>
      )}

      <div className="flex justify-between gap-4 font-black text-stone-900">
        <span>Total</span>
        <span>{formatCurrency(order.totalCents)}</span>
      </div>
    </div>
  );
}

// ============================================
// HISTÓRICO
// ============================================

function OrderHistoryRow({
  order,
}: {
  order: CreatedOrder;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 px-4 py-4 outline-none transition hover:bg-orange-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-700 sm:px-5">
        <span className="min-w-36 flex-1">
          <span className="block font-bold text-stone-900">
            Pedido #{order.orderNumber}
          </span>
          <span className="mt-1 block text-xs text-stone-500">
            {formatDate(order.createdAt)}
          </span>
          <span className="mt-1 block text-xs text-stone-500">
            {getFulfillmentLabel(order)}
          </span>
        </span>

        <StatusBadge order={order} />

        <span className="min-w-24">
          <span className="block text-xs text-stone-500">
            Total
          </span>
          <span className="font-bold text-stone-900">
            {formatCurrency(order.totalCents)}
          </span>
        </span>

        <span className="inline-flex items-center gap-1 text-sm font-semibold text-stone-600">
          <span className="hidden sm:inline">
            Ver detalhes
          </span>
          <ChevronRight
            size={18}
            aria-hidden="true"
            className="transition-transform group-open:rotate-90"
          />
        </span>
      </summary>

      <div className="space-y-4 border-t border-stone-100 bg-stone-50/70 px-4 py-4 sm:px-5">
        <OrderItems items={order.items} />
        <OrderTotals order={order} />

        {order.notes && (
          <p className="text-xs text-stone-600">
            Observações do pedido: {order.notes}
          </p>
        )}
      </div>
    </details>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CustomerDashboardOrders() {
  const [orders, setOrders] = useState<CreatedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<
    string | null
  >(null);
  const [cancellingId, setCancellingId] = useState<
    number | null
  >(null);
  const [now, setNow] = useState(Date.now);

  const loadOrders = useCallback(
    async (
      signal?: AbortSignal,
      silent = false,
    ) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const result = await getMyOrders(signal);

        if (signal?.aborted) return;

        setOrders(result);
        setError(null);
      } catch (caught) {
        if (signal?.aborted) return;

        setError(
          caught instanceof Error
            ? caught.message
            : "Não foi possível carregar seus pedidos.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  // Carregamento inicial e atualização periódica.
 useEffect(() => {
  const controller = new AbortController();

  // Agenda o carregamento inicial fora da
  // execução síncrona do useEffect.
  const initialLoad = window.setTimeout(() => {
    void loadOrders(controller.signal);
  }, 0);

  // Atualização automática a cada 15 segundos.
  const polling = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      void loadOrders(controller.signal, true);
    }
  }, POLLING_INTERVAL_MS);

  return () => {
    controller.abort();
    window.clearTimeout(initialLoad);
    window.clearInterval(polling);
  };
}, [loadOrders]);

  // Atualiza a contagem regressiva a cada segundo.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const activeOrders = orders.filter(isActiveOrder);

  const history = orders.filter(
    (order) => !isActiveOrder(order),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadOrders(undefined, true);
  }

  async function handleCancelOrder(
    order: CreatedOrder,
  ) {
    if (
      cancellingId !== null ||
      !canCancelOrder(order, Date.now())
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente cancelar o pedido #${order.orderNumber}?`,
    );

    if (!confirmed) return;

    setCancellingId(order.id);
    setActionError(null);

    try {
      const updated = await cancelMyOrder(order.id);

      setOrders((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );

      // Recarrega para garantir os dados atuais.
      await loadOrders(undefined, true);
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível cancelar o pedido.",
      );

      await loadOrders(undefined, true);
    } finally {
      setCancellingId(null);
    }
  }

  const whatsappMessage = encodeURIComponent(
    "Olá! Gostaria de informações sobre meu pedido.",
  );

  const whatsappUrl =
    `https://wa.me/${restaurantWhatsAppNumber}` +
    `?text=${whatsappMessage}`;

  return (
    <div className="space-y-7">
      {/* CABEÇALHO */}
      <section className="flex flex-col gap-5 rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-2xl font-black leading-tight sm:text-3xl">
            Acompanhe seus pedidos.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-orange-50 sm:text-base">
            Veja o status, consulte seu histórico e fale
            com a gente sempre que precisar.
          </p>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar com o restaurante pelo WhatsApp"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/50 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
        >
          <MessageCircle size={20} aria-hidden="true" />
          Fale com o restaurante
        </a>
      </section>

      {/* ATUALIZAÇÃO */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-500">
          Os pedidos são atualizados automaticamente.
        </p>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Atualizar
        </button>
      </div>

      {/* ERROS */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      {/* CARREGAMENTO */}
      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white text-sm text-stone-600">
          <Loader2
            size={20}
            className="animate-spin text-orange-700"
          />
          Carregando seus pedidos...
        </div>
      ) : (
        <>
          {/* PEDIDOS EM ANDAMENTO */}
          <section aria-labelledby="current-order-title">
            <h2
              id="current-order-title"
              className="mb-4 text-xl font-black text-stone-900"
            >
              {activeOrders.length > 1
                ? "Pedidos em andamento"
                : "Pedido atual"}
            </h2>

            {activeOrders.length > 0 ? (
              <div className="space-y-5">
                {activeOrders.map((order) => {
                  const canCancel = canCancelOrder(
                    order,
                    now,
                  );

                  const remaining = getRemainingMs(
                    order,
                    now,
                  );

                  const cancelling =
                    cancellingId === order.id;

                  return (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-bold text-stone-900">
                            Pedido #{order.orderNumber}
                          </p>

                          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-stone-500">
                            <CalendarDays
                              size={15}
                              aria-hidden="true"
                            />
                            {formatDate(order.createdAt)}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-orange-800">
                            {getFulfillmentLabel(order)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                          <div>
                            <p className="text-xs text-stone-500">
                              Total do pedido
                            </p>
                            <p className="text-xl font-black text-stone-900">
                              {formatCurrency(
                                order.totalCents,
                              )}
                            </p>
                          </div>

                          <StatusBadge order={order} />
                        </div>
                      </div>

                      <div className="grid gap-6 py-5 lg:grid-cols-2">
                        <div>
                          <h3 className="mb-4 text-sm font-bold text-stone-800">
                            Itens do pedido
                          </h3>

                          <OrderItems
                            items={order.items}
                          />

                          <div className="mt-4">
                            <OrderTotals order={order} />
                          </div>

                          {order.notes && (
                            <p className="mt-3 text-xs text-stone-500">
                              Observações: {order.notes}
                            </p>
                          )}
                        </div>

                        <div className="border-t border-stone-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                          <h3 className="mb-5 text-sm font-bold text-stone-800">
                            Status do pedido
                          </h3>

                          <OrderProgress order={order} />

                          <p className="mt-5 text-xs leading-relaxed text-stone-500">
                            {order.fulfillmentType ===
                            "DELIVERY"
                              ? "Acompanhe o preparo, a saída para entrega e a confirmação de recebimento."
                              : "Acompanhe o preparo e aguarde o pedido ficar pronto para retirada."}
                          </p>
                        </div>
                      </div>

                      {/* CANCELAMENTO */}
                      <div className="border-t border-stone-100 pt-5">
                        {canCancel ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-stone-700">
                                Cancelamento disponível
                              </p>

                              <p className="mt-1 text-xs text-stone-500">
                                Você pode cancelar em até
                                5 minutos após realizar o pedido,
                                desde que ainda não tenha sido
                                confirmado.
                              </p>

                              <p className="mt-2 font-bold tabular-nums text-orange-800">
                                Tempo restante:{" "}
                                {formatRemainingTime(
                                  remaining,
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={cancelling}
                              onClick={() =>
                                void handleCancelOrder(order)
                              }
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {cancelling ? (
                                <Loader2
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <XCircle size={17} />
                              )}

                              {cancelling
                                ? "Cancelando..."
                                : "Cancelar pedido"}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-stone-500">
                            {order.status === "PENDING"
                              ? "O prazo de 5 minutos para cancelar este pedido expirou."
                              : "Este pedido já foi confirmado ou está em andamento e não pode mais ser cancelado pelo cliente."}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-9 text-center shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                  <ShoppingBag
                    size={23}
                    aria-hidden="true"
                  />
                </span>

                <h3 className="mt-4 text-lg font-black text-stone-900">
                  Você não tem um pedido em andamento
                </h3>

                <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-600">
                  Quando fizer um novo pedido, ele
                  aparecerá aqui para você acompanhar.
                </p>

                <Link
                  to="/cardapio"
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-800"
                >
                  Ver cardápio
                  <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </section>

          {/* HISTÓRICO */}
          <section aria-labelledby="order-history-title">
            <h2
              id="order-history-title"
              className="mb-4 text-xl font-black text-stone-900"
            >
              Histórico de pedidos
            </h2>

            {history.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                {history.map((order, index) => (
                  <div
                    key={order.id}
                    className={
                      index > 0
                        ? "border-t border-stone-100"
                        : ""
                    }
                  >
                    <OrderHistoryRow order={order} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
                Seu histórico aparecerá aqui depois
                que um pedido for concluído ou cancelado.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type CustomerOrder = {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
};

const cancellationWindowMs = 15 * 60 * 1000;

// Substitua pelo número do WhatsApp do restaurante, com código do país e DDD.
const restaurantWhatsAppNumber = "55DDDNÚMEROAQUI";

const statusDetails: Record<
  OrderStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  preparing: {
    label: "Em preparo",
    icon: Clock3,
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  ready: {
    label: "Pronto para retirada",
    icon: PackageCheck,
    className: "bg-sky-50 text-sky-800 ring-sky-200",
  },
  completed: {
    label: "Concluído",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-red-50 text-red-800 ring-red-200",
  },
};

const progressSteps: {
  status: Exclude<OrderStatus, "cancelled">;
  label: string;
}[] = [
  { status: "confirmed", label: "Recebido" },
  { status: "preparing", label: "Em preparo" },
  { status: "ready", label: "Pronto" },
  { status: "completed", label: "Concluído" },
];

function createDemoActiveOrder(): CustomerOrder {
  return {
    id: "JP-0248",
    createdAt: new Date(Date.now() - 7 * 60 * 1000),
    status: "confirmed",
    total: 24,
    items: [
      { name: "Espetinho de coração", quantity: 2, price: 18 },
      { name: "Refrigerante lata", quantity: 1, price: 6 },
    ],
  };
}

function createDemoHistory(): CustomerOrder[] {
  const daysAgo = (days: number, hour: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(hour, 20, 0, 0);
    return date;
  };

  return [
    {
      id: "JP-0219",
      createdAt: daysAgo(3, 20),
      status: "completed",
      total: 36,
      items: [
        { name: "Espetinho de coração", quantity: 2, price: 18 },
        { name: "Refrigerante lata", quantity: 3, price: 18 },
      ],
    },
    {
      id: "JP-0197",
      createdAt: daysAgo(8, 19),
      status: "cancelled",
      total: 28,
      items: [
        { name: "Espetinho de coração", quantity: 2, price: 18 },
        { name: "Porção de acompanhamento", quantity: 1, price: 10 },
      ],
    },
    {
      id: "JP-0182",
      createdAt: daysAgo(14, 18),
      status: "completed",
      total: 54,
      items: [
        { name: "Espetinho de coração", quantity: 4, price: 36 },
        { name: "Refrigerante lata", quantity: 3, price: 18 },
      ],
    },
  ];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, icon: Icon, className } = statusDetails[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${className}`}
    >
      <Icon size={15} aria-hidden="true" />
      {label}
    </span>
  );
}

function OrderProgress({ status }: { status: CustomerOrder["status"] }) {
  const activeStep = progressSteps.findIndex(
    (step) => step.status === status,
  );
  const progress =
    activeStep <= 0 ? 0 : (activeStep / (progressSteps.length - 1)) * 100;

  return (
    <div
      aria-label={`Status do pedido: ${statusDetails[status].label}`}
      className="relative grid grid-cols-4"
    >
      <div
        aria-hidden="true"
        className="absolute left-[12.5%] right-[12.5%] top-3 h-1 rounded-full bg-stone-200"
      >
        <div
          className="h-full rounded-full bg-orange-700 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      

      {progressSteps.map((step, index) => {
        const isComplete = index <= activeStep;

        return (
          <div
            key={step.status}
            className="relative z-10 flex flex-col items-center gap-2 text-center"
          >
            <span
              className={`flex size-7 items-center justify-center rounded-full border-2 ${
                isComplete
                  ? "border-orange-700 bg-orange-700 text-white"
                  : "border-stone-300 bg-white text-stone-400"
              }`}
            >
              {isComplete ? (
                <CheckCircle2 size={16} aria-hidden="true" />
              ) : (
                <span className="size-2 rounded-full bg-current" />
              )}
            </span>

            <span
              className={`text-[10px] font-semibold leading-tight sm:text-xs ${
                isComplete ? "text-orange-800" : "text-stone-500"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderItems({ items }: { items: OrderItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.name}
          className="flex items-start justify-between gap-4 text-sm"
        >
          <span className="text-stone-700">
            <strong className="mr-2 text-stone-900">{item.quantity}x</strong>
            {item.name}
          </span>

          <span className="shrink-0 font-medium text-stone-700">
            {formatCurrency(item.price)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function OrderHistoryRow({ order }: { order: CustomerOrder }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 px-4 py-4 outline-none transition hover:bg-orange-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-700 sm:px-5">
        <span className="min-w-36 flex-1">
          <span className="block font-bold text-stone-900">
            Pedido #{order.id}
          </span>
          <span className="mt-1 block text-xs text-stone-500">
            {formatDate(order.createdAt)}
          </span>
        </span>

        <StatusBadge status={order.status} />

        <span className="min-w-24">
          <span className="block text-xs text-stone-500">Total</span>
          <span className="font-bold text-stone-900">
            {formatCurrency(order.total)}
          </span>
        </span>

        <span className="inline-flex items-center gap-1 text-sm font-semibold text-stone-600">
          <span className="hidden sm:inline">Ver detalhes</span>
          <ChevronRight
            size={18}
            aria-hidden="true"
            className="transition-transform group-open:rotate-90"
          />
        </span>
      </summary>

      <div className="border-t border-stone-100 bg-stone-50/70 px-4 py-4 sm:px-5">
        <OrderItems items={order.items} />
      </div>
    </details>
  );
}

export function CustomerDashboardOrders() {
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(
    () => createDemoActiveOrder(),
  );
  const [history, setHistory] = useState<CustomerOrder[]>(() =>
    createDemoHistory(),
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const canCancel =
    activeOrder !== null &&
    now - activeOrder.createdAt.getTime() < cancellationWindowMs;

  const whatsappMessage = encodeURIComponent(
    "Olá! Gostaria de informações sobre meu pedido.",
  );
  const whatsappUrl = `https://wa.me/${restaurantWhatsAppNumber}?text=${whatsappMessage}`;

  function handleCancelOrder() {
    if (!activeOrder || !canCancel) return;

    const confirmed = window.confirm(
      `Deseja cancelar o pedido #${activeOrder.id}?`,
    );

    if (!confirmed) return;

    setHistory((currentHistory) => [
      { ...activeOrder, status: "cancelled" },
      ...currentHistory,
    ]);
    setActiveOrder(null);
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-2xl font-black leading-tight sm:text-3xl">
            Acompanhe seus pedidos.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-orange-50 sm:text-base">
            Veja o status, consulte seu histórico e fale com a gente sempre
            que precisar.
          </p>
        </div>

        

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar com o restaurante pelo WhatsApp"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/50 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <MessageCircle size={20} aria-hidden="true" />
          Fale com o restaurante
        </a>
      </section>

      <section aria-labelledby="current-order-title">
        <h2
          id="current-order-title"
          className="mb-4 text-xl font-black text-stone-900"
        >
          Pedido atual
        </h2>

        {activeOrder ? (
          <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-stone-900">
                  Pedido #{activeOrder.id}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-stone-500">
                  <CalendarDays size={15} aria-hidden="true" />
                  {formatDate(activeOrder.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                <div>
                  <p className="text-xs text-stone-500">Total do pedido</p>
                  <p className="text-xl font-black text-stone-900">
                    {formatCurrency(activeOrder.total)}
                  </p>
                </div>
                <StatusBadge status={activeOrder.status} />
              </div>
            </div>

            <div className="grid gap-6 py-5 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-sm font-bold text-stone-800">
                  Itens do pedido
                </h3>
                <OrderItems items={activeOrder.items} />
              </div>

              <div className="border-t border-stone-100 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <h3 className="mb-5 text-sm font-bold text-stone-800">
                  Status do pedido
                </h3>
                <OrderProgress status={activeOrder.status} />
              </div>
            </div>

            <div className="border-t border-stone-100 pt-5">
              {canCancel ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                  >
                    <XCircle size={17} aria-hidden="true" />
                    Cancelar pedido
                  </button>
                  <p className="mt-2 text-xs text-stone-500">
                    O cancelamento fica disponível por até 15 minutos após
                    realizar o pedido.
                  </p>
                </>
              ) : (
                <p className="text-sm text-stone-500">
                  O prazo para cancelar este pedido expirou.
                </p>
              )}
            </div>
          </article>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-orange-200 bg-white px-6 py-9 text-center shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
              <ShoppingBag size={23} aria-hidden="true" />
            </span>

            <h3 className="mt-4 text-lg font-black text-stone-900">
              Você não tem um pedido em andamento
            </h3>

            <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-600">
              Quando fizer um novo pedido, ele aparecerá aqui para você
              acompanhar.
            </p>

            <Link
              to="/cardapio"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
            >
              Ver cardápio
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

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
                className={index > 0 ? "border-t border-stone-100" : ""}
              >
                <OrderHistoryRow order={order} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
            Seu histórico aparecerá aqui depois que você fizer um pedido.
          </div>
        )}
      </section>
    </div>
  );
}

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  blockAdminCustomer,
  formatAdminCustomerDate,
  getAdminCustomerById,
  getAdminCustomerDisplayName,
  getAdminCustomers,
  getAdminCustomerStats,
  unblockAdminCustomer,
  updateAdminCustomerName,
  type AdminCustomer,
  type AdminCustomerDetails,
  type AdminCustomerStats,
} from "../api/admin-customers.api";

// ============================================
// TIPAGENS
// ============================================

type CustomerFilter =
  | "ALL"
  | "ENABLED"
  | "BLOCKED";

type CustomerAction =
  | "name"
  | "block"
  | "unblock"
  | null;

// ============================================
// UTILITÁRIOS
// ============================================

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

function getCustomerInitials(
  customer: AdminCustomer,
): string {
  const name = getAdminCustomerDisplayName(customer);

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function CustomerAvatar({
  customer,
  size = "md",
}: {
  customer: AdminCustomer;
  size?: "md" | "lg";
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const classes =
    size === "lg"
      ? "h-16 w-16 text-xl"
      : "h-12 w-12 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-100 font-black text-orange-800 ${classes}`}
    >
      {customer.image && !imageFailed ? (
        <img
          src={customer.image}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getCustomerInitials(customer) || (
          <UserRound size={22} />
        )
      )}
    </div>
  );
}

function CustomerStatus({
  blocked,
}: {
  blocked: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
        blocked
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {blocked ? (
        <Ban size={13} />
      ) : (
        <CheckCircle2 size={13} />
      )}

      {blocked ? "Bloqueado" : "Liberado"}
    </span>
  );
}

// ============================================
// INDICADORES
// ============================================

function CustomerStats({
  stats,
}: {
  stats: AdminCustomerStats;
}) {
  const cards = [
    {
      label: "Total de clientes",
      value: stats.total,
      icon: UsersRound,
      style: "bg-orange-50 text-orange-700",
    },
    {
      label: "Liberados",
      value: stats.enabled,
      icon: ShieldCheck,
      style: "bg-green-50 text-green-700",
    },
    {
      label: "Bloqueados",
      value: stats.blocked,
      icon: Ban,
      style: "bg-red-50 text-red-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.style}`}
            >
              <Icon size={21} />
            </div>

            <p className="mt-4 text-3xl font-black text-stone-900">
              {card.value}
            </p>

            <p className="mt-1 text-sm font-medium text-stone-500">
              {card.label}
            </p>
          </article>
        );
      })}
    </div>
  );
}

// ============================================
// PAINEL LATERAL DO CLIENTE
// ============================================

function CustomerDetails({
  customer,
  onClose,
  onUpdated,
}: {
  customer: AdminCustomerDetails;
  onClose: () => void;
  onUpdated: (customer: AdminCustomer) => void;
}) {
  const [displayName, setDisplayName] = useState(
    customer.displayName ?? "",
  );

  const [blockReason, setBlockReason] = useState(
    customer.blockedReason ?? "",
  );

  const [action, setAction] =
    useState<CustomerAction>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [confirmingBlock, setConfirmingBlock] =
    useState(false);

  const saving = action !== null;

  // ============================================
  // ATUALIZAR NOME
  // ============================================

  async function handleSaveName() {
    if (saving) return;

    const normalized = displayName.trim();

    if (normalized.length > 100) {
      setError(
        "O nome deve ter no máximo 100 caracteres.",
      );
      return;
    }

    setAction("name");
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateAdminCustomerName(
        customer.id,
        normalized || null,
      );

      onUpdated(updated);
      setDisplayName(updated.displayName ?? "");
      setSuccess("Nome atualizado com sucesso.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAction(null);
    }
  }

  // ============================================
  // BLOQUEAR CLIENTE
  // ============================================

  async function handleBlock() {
    if (saving) return;

    if (blockReason.trim().length > 500) {
      setError(
        "O motivo deve ter no máximo 500 caracteres.",
      );
      return;
    }

    setAction("block");
    setError(null);
    setSuccess(null);

    try {
      const updated = await blockAdminCustomer(
        customer.id,
        blockReason.trim() || null,
      );

      onUpdated(updated);
      setConfirmingBlock(false);
      setSuccess("Cliente bloqueado com sucesso.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAction(null);
    }
  }

  // ============================================
  // DESBLOQUEAR CLIENTE
  // ============================================

  async function handleUnblock() {
    if (saving) return;

    setAction("unblock");
    setError(null);
    setSuccess(null);

    try {
      const updated = await unblockAdminCustomer(
        customer.id,
      );

      onUpdated(updated);
      setBlockReason("");
      setSuccess("Cliente desbloqueado com sucesso.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAction(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex justify-end bg-stone-950/60"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do cliente"
        className="flex h-full w-full max-w-xl flex-col bg-[#faf8f5] shadow-2xl"
      >
        {/* HEADER */}

        <header className="flex items-center justify-between border-b border-stone-200 bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
              Gerenciamento de clientes
            </p>

            <h3 className="mt-1 text-xl font-black text-stone-900">
              Detalhes do cliente
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar painel"
            className="rounded-xl p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-50"
          >
            <X size={21} />
          </button>
        </header>

        {/* CONTEÚDO */}

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {/* PERFIL */}

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-4">
              <CustomerAvatar
                key={customer.id}
                customer={customer}
                size="lg"
              />

              <div className="min-w-0 flex-1">
                <h4 className="wrap-break-word text-lg font-black text-stone-900">
                  {getAdminCustomerDisplayName(customer)}
                </h4>

                <p className="break-all text-sm text-stone-500">
                  {customer.email}
                </p>

                <div className="mt-2">
                  <CustomerStatus
                    blocked={customer.ordersBlocked}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-stone-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Data de cadastro
              </p>

              <p className="mt-1 text-sm font-semibold text-stone-800">
                {formatAdminCustomerDate(
                  customer.createdAt,
                )}
              </p>
            </div>
          </section>

          {/* CONTATO E ENTREGA */}

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <MapPin size={21} />
              </span>

              <div>
                <h4 className="font-black text-stone-900">
                  Contato e entrega
                </h4>
                <p className="mt-1 text-xs text-stone-500">
                  Informações cadastradas pelo cliente.
                </p>
              </div>
            </div>

            {/* TELEFONE */}

            <div className="mt-5 border-t border-stone-100 pt-4">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-stone-500" />
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                  Telefone / WhatsApp
                </p>
              </div>

              {customer.phone ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-stone-900">
                    {customer.phone}
                  </p>

                  <a
                    href={`https://wa.me/55${customer.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <MessageCircle size={16} />
                    Abrir WhatsApp
                    <ExternalLink size={13} />
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-500">
                  Telefone não cadastrado.
                </p>
              )}

              <p className="mt-2 text-xs text-stone-400">
                Número ainda não verificado.
              </p>
            </div>

            {/* ENDEREÇO */}

            <div className="mt-5 border-t border-stone-100 pt-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-stone-500" />
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                  Endereço de entrega
                </p>
              </div>

              {customer.address ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl bg-sky-50/70 p-4">
                    <p className="text-sm font-bold text-stone-900">
                      {customer.address.street}, {customer.address.number}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {customer.address.neighborhood} — {customer.address.city}/{customer.address.state}
                    </p>
                    {customer.address.complement && (
                      <p className="mt-3 border-t border-sky-100 pt-3 text-sm text-stone-600">
                        <span className="font-semibold">Complemento:</span>{" "}
                        {customer.address.complement}
                      </p>
                    )}
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${customer.address.coordinates.latitude},${customer.address.coordinates.longitude}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 text-xs font-bold text-white transition hover:bg-sky-700"
                  >
                    <MapPin size={16} />
                    Visualizar no Google Maps
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-medium text-stone-600">
                    Nenhum endereço cadastrado.
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    O cliente ainda não informou uma localização para entrega.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* MENSAGENS */}

          {error && (
            <div
              role="alert"
              className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle
                size={18}
                className="shrink-0"
              />
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              <CheckCircle2
                size={18}
                className="shrink-0"
              />
              {success}
            </div>
          )}

          {/* EDITAR NOME */}

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h4 className="font-black text-stone-900">
              Nome exibido no restaurante
            </h4>

            <p className="mt-1 text-xs text-stone-500">
              Altere como o cliente aparece no painel,
              sem modificar o nome original da conta.
            </p>

            <label
              htmlFor="admin-customer-name"
              className="mt-4 block text-xs font-bold text-stone-600"
            >
              Nome personalizado
            </label>

            <input
              id="admin-customer-name"
              type="text"
              maxLength={100}
              value={displayName}
              disabled={saving}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setSuccess(null);
              }}
              placeholder={customer.name}
              className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-orange-500 disabled:opacity-60"
            />

            <p className="mt-2 text-xs text-stone-500">
              Deixe vazio para utilizar o nome original.
            </p>

            <button
              type="button"
              onClick={() => void handleSaveName()}
              disabled={
                saving ||
                displayName.trim() ===
                  (customer.displayName ?? "")
              }
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {action === "name" ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              Salvar nome
            </button>
          </section>

          {/* BLOQUEIO */}

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h4 className="font-black text-stone-900">
              Permissão para realizar pedidos
            </h4>

            <p className="mt-2 text-sm text-stone-600">
              {customer.ordersBlocked
                ? "Este cliente está impedido de realizar novos pedidos."
                : "Este cliente está autorizado a realizar pedidos normalmente."}
            </p>

            {customer.ordersBlocked ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs font-bold text-red-800">
                    Bloqueado em
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {formatAdminCustomerDate(
                      customer.blockedAt,
                    )}
                  </p>

                  <p className="mt-3 text-xs font-bold text-red-800">
                    Motivo
                  </p>

                  <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm text-red-700">
                    {customer.blockedReason ||
                      "Nenhum motivo informado."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleUnblock()}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {action === "unblock" ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <ShieldCheck size={17} />
                  )}

                  Desbloquear cliente
                </button>
              </div>
            ) : (
              <div className="mt-4">
                {!confirmingBlock ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingBlock(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    disabled={saving}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 hover:bg-red-100"
                  >
                    <Ban size={17} />
                    Bloquear cliente
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-800">
                      Confirmar bloqueio
                    </p>

                    <p className="text-xs text-red-700">
                      O cliente não poderá realizar
                      novos pedidos até ser desbloqueado.
                    </p>

                    <label
                      htmlFor="admin-customer-block-reason"
                      className="block text-xs font-bold text-stone-700"
                    >
                      Motivo do bloqueio (opcional)
                    </label>

                    <textarea
                      id="admin-customer-block-reason"
                      value={blockReason}
                      maxLength={500}
                      rows={3}
                      disabled={saving}
                      onChange={(event) =>
                        setBlockReason(
                          event.target.value,
                        )
                      }
                      placeholder="Informe o motivo..."
                      className="w-full resize-none rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:border-red-400"
                    />

                    <p className="text-right text-xs text-stone-500">
                      {blockReason.length}/500
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleBlock()
                        }
                        disabled={saving}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
                      >
                        {action === "block" ? (
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Ban size={16} />
                        )}

                        Confirmar bloqueio
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmingBlock(false)
                        }
                        disabled={saving}
                        className="min-h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

// ============================================
// DASHBOARD DE CLIENTES
// ============================================

export function AdminDashboardCustomers() {
  const [customers, setCustomers] = useState<
    AdminCustomer[]
  >([]);

  const [stats, setStats] =
    useState<AdminCustomerStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<CustomerFilter>("ALL");

  const [selectedCustomer, setSelectedCustomer] =
    useState<AdminCustomerDetails | null>(null);

  const [openingId, setOpeningId] =
    useState<string | null>(null);

  // ============================================
  // CARREGAR CLIENTES E INDICADORES
  // ============================================

  const loadCustomers = useCallback(
    async (signal?: AbortSignal) => {
      const [customerList, customerStats] =
        await Promise.all([
          getAdminCustomers(signal),
          getAdminCustomerStats(signal),
        ]);

      if (signal?.aborted) return;

      setCustomers(customerList);
      setStats(customerStats);
    },
    [],
  );

  
useEffect(() => {
  const controller = new AbortController();

  async function fetchCustomers() {
    try {
      await loadCustomers(controller.signal);
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  void Promise.resolve().then(() => {
    if (!controller.signal.aborted) {
      void fetchCustomers();
    }
  });

  return () => {
    controller.abort();
  };
}, [loadCustomers]);


  // ============================================
  // ATUALIZAR LISTAGEM
  // ============================================

  async function handleRefresh() {
    if (refreshing) return;

    setRefreshing(true);
    setError(null);

    try {
      await loadCustomers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  // ============================================
  // ABRIR DETALHES
  // ============================================

  async function handleOpenCustomer(
    customerId: string,
  ) {
    if (openingId !== null) return;

    setOpeningId(customerId);
    setError(null);

    try {
      const customer =
        await getAdminCustomerById(customerId);

      setSelectedCustomer(customer);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOpeningId(null);
    }
  }

  // ============================================
  // SINCRONIZAR ALTERAÇÕES
  // ============================================

  function handleCustomerUpdated(
    updated: AdminCustomer,
  ) {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === updated.id
          ? updated
          : customer,
      ),
    );

    setSelectedCustomer((current) =>
      current?.id === updated.id
        ? { ...current, ...updated }
        : current,
    );

    setStats((current) => {
      if (!current) return current;

      const previous = customers.find(
        (customer) => customer.id === updated.id,
      );

      if (
        !previous ||
        previous.ordersBlocked === updated.ordersBlocked
      ) {
        return current;
      }

      const becameBlocked = updated.ordersBlocked;

      return {
        ...current,
        enabled:
          current.enabled + (becameBlocked ? -1 : 1),
        blocked:
          current.blocked + (becameBlocked ? 1 : -1),
      };
    });
  }

  // ============================================
  // PESQUISA E FILTROS
  // ============================================

  const filteredCustomers = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return customers.filter((customer) => {
      if (
        filter === "ENABLED" &&
        customer.ordersBlocked
      ) {
        return false;
      }

      if (
        filter === "BLOCKED" &&
        !customer.ordersBlocked
      ) {
        return false;
      }

      if (!query) return true;

      const searchable = [
        customer.name,
        customer.displayName ?? "",
        customer.email,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchable.includes(query);
    });
  }, [customers, search, filter]);

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  return (
    <div className="space-y-6">
      {/* TÍTULO */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900">
            Gerenciamento de clientes
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Consulte cadastros e gerencie permissões
            para realizar pedidos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={loading || refreshing}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "animate-spin" : ""
            }
          />
          Atualizar
        </button>
      </div>

      {/* ERRO GERAL */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle
            size={19}
            className="shrink-0"
          />
          {error}
        </div>
      )}

      {/* CARREGAMENTO */}

      {loading ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white">
          <LoaderCircle
            size={30}
            className="animate-spin text-orange-700"
          />

          <p className="text-sm text-stone-500">
            Carregando clientes...
          </p>
        </div>
      ) : (
        <>
          {/* INDICADORES */}

          {stats && <CustomerStats stats={stats} />}

          {/* BUSCA E FILTROS */}

          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Buscar por nome ou e-mail..."
                  aria-label="Buscar clientes"
                  className="min-h-12 w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-4 text-sm outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["ALL", "Todos"],
                    ["ENABLED", "Liberados"],
                    ["BLOCKED", "Bloqueados"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    className={`min-h-10 rounded-xl px-4 text-xs font-bold transition-colors ${
                      filter === value
                        ? "bg-orange-700 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-orange-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* LISTAGEM */}

          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 p-5">
              <h3 className="font-black text-stone-900">
                Clientes cadastrados
              </h3>

              <span className="text-xs font-semibold text-stone-500">
                {filteredCustomers.length} resultado(s)
              </span>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
                <UsersRound
                  size={32}
                  className="text-stone-300"
                />

                <p className="font-bold text-stone-700">
                  Nenhum cliente encontrado.
                </p>

                <p className="text-sm text-stone-500">
                  Ajuste os filtros ou a pesquisa.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() =>
                      void handleOpenCustomer(
                        customer.id,
                      )
                    }
                    disabled={openingId !== null}
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-orange-50/50 disabled:opacity-60 sm:gap-4 sm:p-5"
                  >
                    <CustomerAvatar
                      customer={customer}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-stone-900">
                        {getAdminCustomerDisplayName(
                          customer,
                        )}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-stone-500">
                        {customer.email}
                      </p>

                      <p className="mt-1 text-xs text-stone-400">
                        Cadastro:{" "}
                        {formatAdminCustomerDate(
                          customer.createdAt,
                        )}
                      </p>
                    </div>

                    <div className="hidden sm:block">
                      <CustomerStatus
                        blocked={
                          customer.ordersBlocked
                        }
                      />
                    </div>

                    {openingId === customer.id ? (
                      <LoaderCircle
                        size={19}
                        className="shrink-0 animate-spin text-orange-700"
                      />
                    ) : (
                      <ChevronRight
                        size={20}
                        className="shrink-0 text-stone-400"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* PAINEL LATERAL */}

      {selectedCustomer && (
        <CustomerDetails
          key={selectedCustomer.id}
          customer={selectedCustomer}
          onClose={() =>
            setSelectedCustomer(null)
          }
          onUpdated={handleCustomerUpdated}
        />
      )}
    </div>
  );
}

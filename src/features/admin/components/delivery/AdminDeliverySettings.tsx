
import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Loader2,
  MapPinned,
  MessageCircle,
  RefreshCw,
  Save,
  Truck,
} from "lucide-react";

import {
  getDeliverySettings,
  updateDeliverySettings,
  type DeliverySettings,
  type UpdateDeliverySettingsInput,
} from "./deliverySettingsApi";

// ============================================
// TIPOS
// ============================================

type DeliveryForm = {
  fixedFee: string;
  isEnabled: boolean;
  contactPhone: string;
  unavailableMessage: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function parseMoneyToCents(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/^R\$\s*/, "");

  if (!/^\d+(?:[,.]\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [integerPart, decimalPart = ""] =
    normalized.replace(",", ".").split(".");

  const cents =
    Number(integerPart) * 100 +
    Number(decimalPart.padEnd(2, "0"));

  return Number.isSafeInteger(cents) ? cents : null;
}

function settingsToForm(
  settings: DeliverySettings,
): DeliveryForm {
  return {
    fixedFee: centsToInput(settings.fixedFeeCents),
    isEnabled: settings.isEnabled,
    contactPhone: settings.contactPhone ?? "",
    unavailableMessage: settings.unavailableMessage,
  };
}

// ============================================
// COMPONENTE
// ============================================

export function AdminDeliverySettings() {
  const [form, setForm] = useState<DeliveryForm>({
    fixedFee: "8,00",
    isEnabled: true,
    contactPhone: "",
    unavailableMessage:
      "Entrega indisponível neste endereço. Entre em contato com o restaurante para consultar a possibilidade de entrega.",
  });

  const [originalForm, setOriginalForm] =
    useState<DeliveryForm | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const settings = await getDeliverySettings();
      const nextForm = settingsToForm(settings);

      setForm(nextForm);
      setOriginalForm(nextForm);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as configurações.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  let cancelled = false;

  async function initializeSettings() {
    try {
      const settings = await getDeliverySettings();

      if (cancelled) return;

      const nextForm = settingsToForm(settings);

      setForm(nextForm);
      setOriginalForm(nextForm);
    } catch (error) {
      if (cancelled) return;

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as configurações.",
      });
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  void initializeSettings();

  return () => {
    cancelled = true;
  };
}, []);

  const hasChanges =
    originalForm !== null &&
    JSON.stringify(form) !== JSON.stringify(originalForm);

  const fixedFeeCents = parseMoneyToCents(form.fixedFee);

  const updateField = <K extends keyof DeliveryForm>(
    field: K,
    value: DeliveryForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFeedback(null);
  };

  const handleSave = async () => {
    if (saving || loading) return;

    if (fixedFeeCents === null || fixedFeeCents > 1_000_000) {
      setFeedback({
        type: "error",
        message:
          "Informe uma taxa válida em reais, com no máximo duas casas decimais.",
      });
      return;
    }

    const digits = form.contactPhone.replace(/\D/g, "");

    if (
      form.contactPhone.trim() !== "" &&
      (digits.length < 10 || digits.length > 13)
    ) {
      setFeedback({
        type: "error",
        message: "Informe um WhatsApp válido com DDD.",
      });
      return;
    }

    const message = form.unavailableMessage.trim();

    if (message.length < 5 || message.length > 300) {
      setFeedback({
        type: "error",
        message:
          "A mensagem deve conter entre 5 e 300 caracteres.",
      });
      return;
    }

    const payload: UpdateDeliverySettingsInput = {
      fixedFeeCents,
      isEnabled: form.isEnabled,
      contactPhone: form.contactPhone.trim() || null,
      unavailableMessage: message,
    };

    setSaving(true);
    setFeedback(null);

    try {
      const updated = await updateDeliverySettings(payload);
      const nextForm = settingsToForm(updated);

      setForm(nextForm);
      setOriginalForm(nextForm);

      setFeedback({
        type: "success",
        message: "Configurações de entrega salvas com sucesso!",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar as configurações.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // CARREGAMENTO
  // ============================================

  if (loading) {
    return (
      <div className="flex min-h-90 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <Loader2
            size={30}
            className="animate-spin text-orange-600"
          />
          <p className="text-sm font-medium">
            Carregando configurações de entrega...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // INTERFACE
  // ============================================

  return (
    <section className="space-y-6">
      {/* CABEÇALHO */}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-orange-600">
            <Truck size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Administração
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-stone-900">
            Entregas e Fretes
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Configure a taxa fixa e as condições de entrega
            do restaurante.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSettings()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* FEEDBACK */}

      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={19} className="shrink-0" />
          ) : (
            <AlertCircle size={19} className="shrink-0" />
          )}

          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* FORMULÁRIO PRINCIPAL */}

        <div className="space-y-5">
          {/* ATIVAR ENTREGAS */}

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                  <Truck size={21} />
                </div>

                <div>
                  <h3 className="font-bold text-stone-900">
                    Entregas pelo site
                  </h3>

                  <p className="mt-1 text-sm text-stone-500">
                    Habilite ou suspenda os pedidos para entrega.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={form.isEnabled}
                aria-label="Habilitar entregas"
                onClick={() =>
                  updateField("isEnabled", !form.isEnabled)
                }
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  form.isEnabled
                    ? "bg-orange-600"
                    : "bg-stone-300"
                }`}
              >
                <span
                  className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    form.isEnabled
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* TAXA FIXA */}

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <DollarSign size={21} />
              </div>

              <div>
                <h3 className="font-bold text-stone-900">
                  Taxa fixa de entrega
                </h3>

                <p className="text-sm text-stone-500">
                  Valor cobrado dentro da área delimitada.
                </p>
              </div>
            </div>

            <label
              htmlFor="delivery-fixed-fee"
              className="mb-2 block text-sm font-semibold text-stone-700"
            >
              Valor da entrega
            </label>

            <div className="flex max-w-sm overflow-hidden rounded-xl border border-stone-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
              <span className="flex items-center bg-stone-50 px-4 text-sm font-bold text-stone-500">
                R$
              </span>

              <input
                id="delivery-fixed-fee"
                type="text"
                inputMode="decimal"
                value={form.fixedFee}
                onChange={(event) =>
                  updateField("fixedFee", event.target.value)
                }
                placeholder="8,00"
                className="min-w-0 flex-1 px-4 py-3 text-lg font-bold text-stone-900 outline-none"
              />
            </div>

            <p className="mt-2 text-xs text-stone-500">
              Exemplo: informe 8,00 para cobrar R$ 8,00
              por entrega.
            </p>
          </div>

          {/* WHATSAPP */}

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <MessageCircle size={21} />
              </div>

              <div>
                <h3 className="font-bold text-stone-900">
                  Contato para entregas especiais
                </h3>

                <p className="text-sm text-stone-500">
                  Número exibido quando o endereço não
                  estiver na área atendida.
                </p>
              </div>
            </div>

            <label
              htmlFor="delivery-phone"
              className="mb-2 block text-sm font-semibold text-stone-700"
            >
              WhatsApp do restaurante
            </label>

            <input
              id="delivery-phone"
              type="tel"
              value={form.contactPhone}
              onChange={(event) =>
                updateField("contactPhone", event.target.value)
              }
              placeholder="(42) 99999-9999"
              maxLength={30}
              className="w-full max-w-sm rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            <label
              htmlFor="delivery-message"
              className="mb-2 mt-5 block text-sm font-semibold text-stone-700"
            >
              Mensagem de indisponibilidade
            </label>

            <textarea
              id="delivery-message"
              value={form.unavailableMessage}
              onChange={(event) =>
                updateField(
                  "unavailableMessage",
                  event.target.value,
                )
              }
              rows={3}
              maxLength={300}
              className="w-full resize-y rounded-xl border border-stone-200 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            <p className="mt-1 text-right text-xs text-stone-400">
              {form.unavailableMessage.length}/300
            </p>
          </div>
        </div>

        {/* COLUNA LATERAL */}

        <div className="space-y-5">
          {/* RESUMO */}

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-stone-900">
              Resumo das entregas
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-stone-500">
                  Situação
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    form.isEnabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {form.isEnabled ? "Habilitadas" : "Desativadas"}
                </span>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <span className="text-sm text-stone-500">
                  Taxa configurada
                </span>

                <p className="mt-1 text-2xl font-black text-orange-600">
                  {fixedFeeCents === null
                    ? "Valor inválido"
                    : (fixedFeeCents / 100).toLocaleString(
                        "pt-BR",
                        {
                          style: "currency",
                          currency: "BRL",
                        },
                      )}
                </p>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <span className="text-sm text-stone-500">
                  Área de atendimento
                </span>

                <p className="mt-1 text-sm font-semibold text-stone-800">
                  Rebouças — PR
                </p>

                <p className="mt-1 text-xs text-stone-500">
                  Perímetro urbano a configurar.
                </p>
              </div>
            </div>
          </div>

          {/* PRÓXIMA ETAPA: MAPA */}

          <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-5">
            <div className="mb-3 inline-flex rounded-xl bg-white p-3 text-orange-600 shadow-sm">
              <MapPinned size={22} />
            </div>

            <h3 className="font-bold text-stone-900">
              Área de entrega
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Na próxima etapa, você poderá desenhar
              e editar a área atendida diretamente no
              Google Maps.
            </p>

            <div className="mt-4 rounded-xl border border-orange-100 bg-white p-3 text-xs font-medium text-orange-700">
              Enquanto nenhuma área estiver cadastrada,
              o sistema não liberará entregas pelo site.
            </div>
          </div>
        </div>
      </div>

      {/* AÇÕES */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-stone-500">
          {hasChanges
            ? "Existem alterações que ainda não foram salvas."
            : "Configurações sincronizadas com o servidor."}
        </p>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!hasChanges || saving || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}

          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </section>
  );
}

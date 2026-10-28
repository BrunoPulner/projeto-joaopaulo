
import { useEffect, useId } from "react";

import {
  MapPin,
  X,
} from "lucide-react";

import { DeliveryAddressSelector } from "../delivery/components/DeliveryAddressSelector";

import type {
  DeliveryAddress,
  ValidatedDeliveryAddress,
} from "../delivery/deliveryAddress.types";

// ============================================
// TIPOS
// ============================================

type DeliveryAddressSheetProps = {
  open: boolean;

  initialAddress?: DeliveryAddress | null;

  onClose: () => void;

  onConfirm: (
    result: ValidatedDeliveryAddress,
  ) => void;
};

// ============================================
// COMPONENTE
// ============================================

export function DeliveryAddressSheet({
  open,
  initialAddress = null,
  onClose,
  onConfirm,
}: DeliveryAddressSheetProps) {
  const titleId = useId();

  // ==========================================
  // FECHAR COM ESCAPE
  // ==========================================

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
      true,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
        true,
      );
    };
  }, [open, onClose]);

  // ==========================================
  // CONFIRMAR ENDEREÇO
  // ==========================================

  function handleConfirm(
    result: ValidatedDeliveryAddress,
  ) {
    onConfirm(result);
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <div
      className={`fixed inset-0 z-70 transition-visibility duration-300 ${
        open
          ? "visible pointer-events-auto"
          : "invisible pointer-events-none"
      }`}
    >
      {/* =====================================
          FUNDO ESCURECIDO
      ===================================== */}

      <button
        type="button"
        aria-label="Fechar seleção de endereço"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`absolute inset-0 h-full w-full bg-stone-950/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* =====================================
          PAINEL DESLIZANTE
      ===================================== */}

      <section
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-hidden={!open}
        aria-labelledby={titleId}
        inert={!open}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl transition-transform duration-300 ease-out sm:bottom-4 sm:rounded-[28px] ${
          open
            ? "translate-y-0"
            : "translate-y-[110%]"
        }`}
      >
        {/* BARRA SUPERIOR */}

        <div className="flex shrink-0 flex-col items-center border-b border-stone-100 bg-white px-5 pb-4 pt-3">
          <div className="mb-4 h-1.5 w-12 rounded-full bg-stone-200" />

          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <MapPin size={20} />
              </span>

              <div>
                <h2
                  id={titleId}
                  className="text-base font-black text-stone-900"
                >
                  Endereço de entrega
                </h2>

                <p className="mt-0.5 text-xs text-stone-500">
                  Rebouças - PR
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex size-9 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* =====================================
            CONTEÚDO ROLÁVEL
        ===================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(24px,env(safe-area-inset-bottom))]">
          {open && (
            <DeliveryAddressSelector
              initialAddress={initialAddress}
              onConfirm={handleConfirm}
              onCancel={onClose}
            />
          )}
        </div>
      </section>
    </div>
  );
}

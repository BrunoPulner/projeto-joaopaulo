
import { useEffect, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ImageOff,
  MapPin,
  Minus,
  Pencil,
  Pizza,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import type { CartItem, CartProduct } from "../cartTypes";

import {
  getCartItemTotalCents,
  getCartItemUnitPriceCents,
  getCartSubtotalCents,
} from "../cartTypes";

import { resolveCatalogImageUrl } from "../../catalog/api/catalog.api";

import { DeliveryAddressSheet } from "./DeliveryAddressSheet";

import type {
  ValidatedDeliveryAddress,
} from "../delivery/deliveryAddress.types";

// ============================================
// TIPAGEM
// ============================================

type CartDrawerProps = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

type FulfillmentType = "DELIVERY" | "PICKUP";

// ============================================
// UTILITÁRIOS
// ============================================

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

function getProductImage(
  product: CartProduct,
): string | null {
  if ("imageUrl" in product) {
    return resolveCatalogImageUrl(product.imageUrl);
  }

  return product.image ?? null;
}

function getStockLimit(
  product: CartProduct,
): number | null {
  if ("stockQuantity" in product) {
    return product.stockQuantity;
  }

  return null;
}

// ============================================
// DRAWER PRINCIPAL
// ============================================

export function CartDrawer({
  open,
  items,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
}: CartDrawerProps) {
  // ==========================================
  // MODALIDADE DE RECEBIMENTO
  // ==========================================

  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("DELIVERY");

  // ==========================================
  // ENDEREÇO E DISPONIBILIDADE
  // ==========================================

  const [deliveryAddress, setDeliveryAddress] =
    useState<ValidatedDeliveryAddress | null>(null);

  const [showAddressSelector, setShowAddressSelector] =
    useState(false);

  const [deliveryNeedsRevalidation, setDeliveryNeedsRevalidation] =
    useState(false);

  // ==========================================
  // FECHAR COM ESCAPE
  // ==========================================

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !showAddressSelector) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open, onClose, showAddressSelector]);

  // ==========================================
  // TOTAIS
  // ==========================================

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const subtotalCents = getCartSubtotalCents(items);

  const isDelivery = fulfillmentType === "DELIVERY";

  const deliveryAvailable =
    isDelivery &&
    !deliveryNeedsRevalidation &&
    deliveryAddress?.availability.available === true &&
    typeof deliveryAddress.availability.feeCents ===
      "number" &&
    Number.isFinite(
      deliveryAddress.availability.feeCents,
    );

  const deliveryFeeCents: number | null =
    !isDelivery
      ? 0
      : deliveryAvailable
        ? (deliveryAddress?.availability.feeCents ?? null)
        : null;

  const hasCalculatedTotal =
    deliveryFeeCents !== null;

  const totalCents =
    subtotalCents + (deliveryFeeCents ?? 0);

  // ==========================================
  // CONFIRMAR ENDEREÇO
  // ==========================================

  function handleAddressConfirmed(
    result: ValidatedDeliveryAddress,
  ) {
    setDeliveryAddress(result);
    setDeliveryNeedsRevalidation(false);
    setShowAddressSelector(false);
  }

  // ==========================================
  // ADICIONAR / ALTERAR ENDEREÇO
  // ==========================================

  function handleChangeAddress() {
    setShowAddressSelector(true);
  }

  // ==========================================
  // MODALIDADE DE RECEBIMENTO
  // ==========================================

  function handleFulfillmentChange(
    type: FulfillmentType,
  ) {
    if (type === "DELIVERY") {
      setFulfillmentType("DELIVERY");
      if (!deliveryAddress || deliveryNeedsRevalidation) {
        setShowAddressSelector(true);
      }
      return;
    }

    setFulfillmentType("PICKUP");
    setShowAddressSelector(false);
    // Ao voltar à entrega, será necessária nova validação.
    setDeliveryNeedsRevalidation(true);
  }

  // ==========================================
  // CANCELAR SELEÇÃO DE ENDEREÇO
  // ==========================================

  function handleCancelAddressSelection() {
    setShowAddressSelector(false);
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <div
      className={`fixed inset-0 z-50 ${
        open
          ? "pointer-events-auto"
          : "pointer-events-none"
      }`}
    >
      {/* =====================================
          OVERLAY
      ===================================== */}

      <button
        type="button"
        aria-label="Fechar sacola"
        onClick={() => {
          if (!showAddressSelector) onClose();
        }}
        tabIndex={open && !showAddressSelector ? 0 : -1}
        className={`
          absolute inset-0
          bg-stone-950/55
          backdrop-blur-[1px]
          transition-opacity duration-500
          ${open ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* =====================================
          DRAWER
      ===================================== */}

      <aside
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-hidden={!open}
        aria-labelledby="cart-title"
        inert={!open}
        className={`
          absolute inset-y-0 right-0
          flex w-full max-w-md flex-col
          overflow-hidden bg-[#fffdfb]
          shadow-2xl
          transition-transform duration-500 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* =====================================
            CABEÇALHO
        ===================================== */}

        <div className="flex min-h-18 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
              <ShoppingBag
                size={20}
                aria-hidden="true"
              />
            </span>

            <div>
              <h2
                id="cart-title"
                className="text-lg font-black text-stone-900"
              >
                Sua sacola
              </h2>

              {itemCount > 0 && (
                <p className="mt-0.5 text-xs text-stone-500">
                  {itemCount}{" "}
                  {itemCount === 1 ? "item" : "itens"}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar sacola"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* =====================================
            CONTEÚDO ROLÁVEL
        ===================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-6 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-300">
                <ShoppingBag
                  size={32}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-5 font-bold text-stone-700">
                Sua sacola está vazia.
              </h3>

              <p className="mt-2 max-w-64 text-sm leading-relaxed text-stone-500">
                Escolha algo no cardápio para começar seu
                pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4 pb-4 sm:p-5">
              {/* PRODUTOS */}

              {items.map((item) => (
                <CartProduct
                  key={item.id}
                  item={item}
                  items={items}
                  onIncrease={onIncrease}
                  onDecrease={onDecrease}
                  onRemove={onRemove}
                />
              ))}

            </div>
          )}
        </div>

        {/* =====================================
            RECEBIMENTO FIXO
        ===================================== */}

        {items.length > 0 && (
          <div className="shrink-0 border-t border-stone-200 bg-[#fffdfb] px-4 py-3 sm:px-5">
            {/* MODALIDADE DE RECEBIMENTO */}

            <section
              className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"
              aria-labelledby="receiving-title"
            >
              <h3
                id="receiving-title"
                className="text-sm font-black text-stone-900"
              >
                Como deseja receber seu pedido?
              </h3>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {/* ENTREGA */}

                <button
                  type="button"
                  aria-pressed={isDelivery}
                  onClick={() =>
                    handleFulfillmentChange("DELIVERY")
                  }
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-bold transition-colors ${
                    isDelivery
                      ? "border-orange-600 bg-orange-50 text-orange-800"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <Truck
                    size={17}
                    aria-hidden="true"
                  />
                  Entrega
                </button>

                {/* RETIRADA */}

                <button
                  type="button"
                  aria-pressed={!isDelivery}
                  onClick={() =>
                    handleFulfillmentChange("PICKUP")
                  }
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-bold transition-colors ${
                    !isDelivery
                      ? "border-orange-600 bg-orange-50 text-orange-800"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <Store
                    size={17}
                    aria-hidden="true"
                  />
                  Retirada
                </button>
              </div>
            </section>

            {/* =====================================
                ENDEREÇO DE ENTREGA
            ===================================== */}

            {isDelivery && (
              <section className="mt-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-black text-stone-900">
                    <MapPin
                      size={17}
                      className="text-orange-600"
                    />
                    Endereço de entrega
                  </h3>

                  {deliveryAddress && (
                    <button
                      type="button"
                      onClick={handleChangeAddress}
                      className="flex items-center gap-1 text-xs font-bold text-orange-700 transition hover:text-orange-800"
                    >
                      <Pencil size={13} />
                      Alterar
                    </button>
                  )}
                </div>

                {deliveryAddress ? (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-sm font-bold text-stone-800">
                      {deliveryAddress.address.street},{" "}
                      {deliveryAddress.address.number}
                    </p>

                    <p className="text-xs text-stone-500">
                      {deliveryAddress.address.neighborhood}
                      {" - "}
                      {deliveryAddress.address.city}/
                      {deliveryAddress.address.state}
                    </p>

                    {deliveryAddress.address.complement && (
                      <p className="text-xs text-stone-500">
                        {deliveryAddress.address.complement}
                      </p>
                    )}

                    {/* DISPONIBILIDADE */}

                    {deliveryNeedsRevalidation ? (
                      <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
                        <AlertCircle
                          size={16}
                          className="shrink-0"
                        />
                        Confirme novamente seu endereço
                        para atualizar a disponibilidade
                        e o frete.
                      </div>
                    ) : deliveryAvailable ? (
                      <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-xs font-bold text-green-700">
                        <CheckCircle2 size={16} />
                        Entrega disponível para este endereço
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                        <AlertCircle
                          size={16}
                          className="shrink-0"
                        />
                        Entrega indisponível neste endereço.
                      </div>
                    )}

                    {deliveryNeedsRevalidation && (
                      <button
                        type="button"
                        onClick={handleChangeAddress}
                        className="w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs font-bold text-orange-700 hover:bg-orange-100"
                      >
                        Confirmar endereço novamente
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs leading-relaxed text-stone-500">
                      Informe seu endereço para verificar
                      a disponibilidade e calcular o frete.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setShowAddressSelector(true)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-100"
                    >
                      <MapPin size={17} />
                      Adicionar endereço
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* =====================================
            RESUMO FINANCEIRO
        ===================================== */}

        <div className="shrink-0 border-t border-stone-200 bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(28,25,23,0.04)] sm:px-5">
          <div className="space-y-2.5">
            {/* SUBTOTAL */}

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-600">
                Subtotal dos itens
              </span>

              <strong className="font-bold text-stone-900">
                {formatPrice(subtotalCents)}
              </strong>
            </div>

            {/* FRETE */}

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-600">
                Taxa de entrega
              </span>

              <span
                className={`font-bold ${
                  !isDelivery
                    ? "text-green-700"
                    : deliveryFeeCents !== null
                      ? "text-orange-700"
                      : "text-stone-500"
                }`}
              >
                {!isDelivery
                  ? "Grátis"
                  : deliveryFeeCents !== null
                    ? formatPrice(deliveryFeeCents)
                    : "A calcular"}
              </span>
            </div>

            {/* TOTAL */}

            <div className="border-t border-stone-100 pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-stone-900">
                  {hasCalculatedTotal
                    ? "Total"
                    : "Total parcial"}
                </span>

                <strong className="text-xl font-black text-stone-950">
                  {formatPrice(totalCents)}
                </strong>
              </div>

              {isDelivery && !hasCalculatedTotal && (
                <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                  A taxa de entrega ainda não está
                  incluída.
                </p>
              )}
            </div>
          </div>

          {/* =====================================
              CONTINUAR PEDIDO
          ===================================== */}

          <button
            type="button"
            disabled
            title="O fechamento de pedidos será disponibilizado após a integração do checkout."
            className="mt-4 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-stone-300 px-5 py-3 text-sm font-black text-white"
          >
            Continuar pedido

            <ArrowRight
              size={17}
              aria-hidden="true"
            />
          </button>

          {/* CONTINUAR COMPRANDO */}

          <button
            type="button"
            onClick={onClose}
            className="mt-2 min-h-10 w-full rounded-xl text-xs font-bold text-orange-700 transition hover:bg-orange-50"
          >
            Continuar comprando
          </button>
        </div>
      </aside>

      <DeliveryAddressSheet
        open={open && isDelivery && showAddressSelector}
        initialAddress={deliveryAddress?.address ?? null}
        onClose={handleCancelAddressSelection}
        onConfirm={handleAddressConfirmed}
      />
    </div>
  );
}

// ============================================
// CARD DE PRODUTO NA SACOLA
// ============================================

type CartProductProps = {
  item: CartItem;
  items: CartItem[];
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

function CartProduct({
  item,
  items,
  onIncrease,
  onDecrease,
  onRemove,
}: CartProductProps) {
  const [failedImage, setFailedImage] = useState<
    string | null
  >(null);

  const { product, quantity, notes } = item;

  // ==========================================
  // IMAGEM
  // ==========================================

  const imageUrl = getProductImage(product);

  const showImage =
    Boolean(imageUrl) &&
    failedImage !== imageUrl;

  // ==========================================
  // PREÇOS
  // ==========================================

  const unitPriceCents =
    getCartItemUnitPriceCents(item);

  const totalCents = getCartItemTotalCents(item);

  // ==========================================
  // ESTOQUE
  // ==========================================

  const stockLimit = getStockLimit(product);

  const quantityInCart = items.reduce(
    (total, currentItem) =>
      currentItem.product.id === product.id
        ? total + currentItem.quantity
        : total,
    0,
  );

  const reachedStockLimit =
    stockLimit !== null &&
    quantityInCart >= stockLimit;

  // ==========================================
  // PIZZA PERSONALIZADA
  // ==========================================

  const isPizza =
    item.type === "PIZZA" &&
    Boolean(item.pizza);

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* =====================================
          PRODUTO
      ===================================== */}

      <div className="flex gap-3 p-3">
        {/* IMAGEM */}

        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-orange-50">
          {showImage && imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() =>
                setFailedImage(imageUrl)
              }
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-orange-50 to-amber-100/60 text-orange-300">
              {isPizza ? (
                <Pizza
                  size={24}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              ) : (
                <ImageOff
                  size={22}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>

        {/* INFORMAÇÕES */}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-black leading-snug text-stone-900">
                {product.name}
              </h3>

              {isPizza && item.pizza && (
                <p className="mt-0.5 text-xs text-stone-500">
                  {item.pizza.size.name} •{" "}
                  {item.pizza.size.slices} fatias
                </p>
              )}

              <p className="mt-1 text-xs font-semibold text-orange-700">
                {formatPrice(unitPriceCents)} cada
              </p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remover ${product.name}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2
                size={16}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================
          CONFIGURAÇÃO DA PIZZA
      ===================================== */}

      {isPizza && item.pizza && (
        <div className="mx-3 mb-3 rounded-xl border border-orange-100 bg-orange-50/60 p-3">
          <div className="flex items-center gap-2 text-xs font-black text-orange-800">
            <Pizza size={15} />
            Sua pizza
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-bold text-stone-700">
              Sabores
            </p>

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.pizza.flavors.map((flavor) => (
                <span
                  key={flavor.id}
                  className="rounded-full border border-orange-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-600"
                >
                  {flavor.name}
                </span>
              ))}
            </div>
          </div>

          {item.pizza.addons.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold text-stone-700">
                Adicionais
              </p>

              <div className="mt-1.5 space-y-1">
                {item.pizza.addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between gap-3 text-xs text-stone-600"
                  >
                    <span>{addon.name}</span>

                    <span className="shrink-0 font-semibold text-orange-700">
                      + {formatPrice(addon.priceCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================
          ADICIONAIS CONVENCIONAIS
      ===================================== */}

      {!isPizza &&
        item.addons &&
        item.addons.length > 0 && (
          <div className="mx-3 mb-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-stone-700">
              Adicionais
            </p>

            <div className="mt-2 space-y-1.5">
              {item.addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between gap-3 text-xs text-stone-600"
                >
                  <span>
                    {addon.quantity > 1
                      ? `${addon.quantity}x `
                      : ""}
                    {addon.name}
                  </span>

                  <span className="shrink-0 font-semibold text-orange-700">
                    +{" "}
                    {formatPrice(
                      addon.priceCents *
                        addon.quantity,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* =====================================
          OBSERVAÇÕES
      ===================================== */}

      {notes && (
        <div className="mx-3 mb-3 rounded-xl bg-orange-50 px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-orange-700">
            Observação
          </p>

          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            {notes}
          </p>
        </div>
      )}

      {/* =====================================
          QUANTIDADE E TOTAL
      ===================================== */}

      <div className="mt-3 flex items-center justify-between border-t border-stone-100 px-3 py-3">
        <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5">
          <button
            type="button"
            onClick={() => onDecrease(item.id)}
            aria-label={`Diminuir quantidade de ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 transition hover:bg-white hover:text-orange-700"
          >
            <Minus size={15} aria-hidden="true" />
          </button>

          <span
            className="min-w-8 text-center text-sm font-black text-stone-900"
            aria-live="polite"
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => onIncrease(item.id)}
            disabled={reachedStockLimit}
            aria-label={`Aumentar quantidade de ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 transition hover:bg-white hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="text-right">
          <span className="block text-[11px] text-stone-400">
            Total
          </span>

          <strong className="text-sm font-black text-stone-900">
            {formatPrice(totalCents)}
          </strong>
        </div>
      </div>
    </article>
  );
}

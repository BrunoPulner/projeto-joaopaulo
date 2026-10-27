
import { useEffect, useState } from "react";

import {
  ImageOff,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  Pizza,
  Store,
  Truck,
  ArrowRight,
} from "lucide-react";

import type { CartItem, CartProduct } from "../cartTypes";

import {
  getCartItemTotalCents,
  getCartItemUnitPriceCents,
  getCartSubtotalCents,
} from "../cartTypes";

import { resolveCatalogImageUrl } from "../../catalog/api/catalog.api";

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
  // FECHAR COM ESCAPE
  // ==========================================

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
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
  }, [open, onClose]);

  // ==========================================
  // TOTAIS
  // ==========================================

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const subtotalCents = getCartSubtotalCents(items);

  // Estado visual temporário: será conectado ao pedido
  // quando implementarmos endereço e cálculo de frete.
  const [fulfillmentType, setFulfillmentType] = useState<
    "DELIVERY" | "PICKUP"
  >("DELIVERY");

  const isDelivery = fulfillmentType === "DELIVERY";
  const deliveryFeeCents: number | null = isDelivery ? null : 0;
  const hasCalculatedTotal = deliveryFeeCents !== null;
  const totalCents = subtotalCents + (deliveryFeeCents ?? 0);

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
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={`
          absolute
          inset-0
          bg-stone-950/55
          backdrop-blur-[1px]
          transition-opacity
          duration-500
          ${
            open
              ? "opacity-100"
              : "opacity-0"
          }
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
          absolute
          inset-y-0
          right-0

          flex
          w-full
          max-w-md
          flex-col
          overflow-hidden

          bg-[#fffdfb]
          shadow-2xl

          transition-transform
          duration-500
          ease-in-out

          ${
            open
              ? "translate-x-0"
              : "translate-x-full"
          }
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
            CONTEÚDO
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
            Fora da rolagem dos produtos
        ===================================== */}

        {items.length > 0 && (
          <div className="shrink-0 border-t border-stone-200 bg-[#fffdfb] px-4 py-3 sm:px-5">
              {/* Modalidade de recebimento — interface inicial */}
              <section className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm" aria-labelledby="receiving-title">
                <h3 id="receiving-title" className="text-sm font-black text-stone-900">
                  Como deseja receber seu pedido?
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={isDelivery}
                    onClick={() => setFulfillmentType("DELIVERY")}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-bold transition-colors ${
                      isDelivery
                        ? "border-orange-600 bg-orange-50 text-orange-800"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <Truck size={17} aria-hidden="true" />
                    Entrega
                  </button>
                  <button
                    type="button"
                    aria-pressed={!isDelivery}
                    onClick={() => setFulfillmentType("PICKUP")}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm font-bold transition-colors ${
                      !isDelivery
                        ? "border-orange-600 bg-orange-50 text-orange-800"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <Store size={17} aria-hidden="true" />
                    Retirada
                  </button>
                </div>


              </section>
          </div>
        )}

        {/* =====================================
            RESUMO
        ===================================== */}

        <div className="shrink-0 border-t border-stone-200 bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(28,25,23,0.04)] sm:px-5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-600">Subtotal dos itens</span>
              <strong className="font-bold text-stone-900">{formatPrice(subtotalCents)}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-600">Taxa de entrega</span>
              <span className={`font-bold ${isDelivery ? "text-orange-700" : "text-green-700"}`}>
                {isDelivery ? "A calcular" : "Grátis"}
              </span>
            </div>
            <div className="border-t border-stone-100 pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-stone-900">
                  {hasCalculatedTotal ? "Total" : "Total parcial"}
                </span>
                <strong className="text-xl font-black text-stone-950">
                  {formatPrice(totalCents)}
                </strong>
              </div>
              {isDelivery && (
                <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                  A taxa de entrega ainda não está incluída.
                </p>
              )}
            </div>
          </div>

          {/* Checkout será habilitado após implementar pedido e frete. */}
          <button
            type="button"
            disabled
            title="O fechamento de pedidos será disponibilizado após a integração do checkout."
            className="mt-4 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-stone-300 px-5 py-3 text-sm font-black text-white"
          >
            Continuar pedido
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="mt-2 min-h-10 w-full rounded-xl text-xs font-bold text-orange-700 transition hover:bg-orange-50"
          >
            Continuar comprando
          </button>
        </div>
      </aside>
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

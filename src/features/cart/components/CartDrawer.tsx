import { useEffect, useState } from "react";
import {
  ImageOff,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import type { CartItem } from "../cartTypes";

type CartDrawerProps = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function CartDrawer({
  open,
  items,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
}: CartDrawerProps) {
  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const subtotal = items.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0,
  );

  return (
    <div
      className={`fixed inset-0 z-50 ${
        open
          ? "pointer-events-auto"
          : "pointer-events-none"
      }`}
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Fechar sacola"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={`absolute inset-0 bg-stone-950/55 backdrop-blur-[1px] transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-hidden={!open}
        aria-labelledby="cart-title"
        inert={!open}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[#fffdfb] shadow-2xl transition-transform duration-500 ease-in-out ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* Cabeçalho */}
        <div className="flex min-h-18 items-center justify-between border-b border-stone-200 bg-white px-5">
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

              {items.length > 0 && (
                <p className="mt-0.5 text-xs text-stone-500">
                  {items.reduce(
                    (total, item) =>
                      total + item.quantity,
                    0,
                  )}{" "}
                  {items.reduce(
                    (total, item) =>
                      total + item.quantity,
                    0,
                  ) === 1
                    ? "item"
                    : "itens"}
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

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
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
            <div className="space-y-3 p-4 sm:p-5">
              {items.map((item) => (
                <CartProduct
                  key={item.id}
                  item={item}
                  onIncrease={onIncrease}
                  onDecrease={onDecrease}
                  onRemove={onRemove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="shrink-0 border-t border-stone-200 bg-white p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-stone-500">
                Subtotal
              </span>

              <p className="mt-1 text-xs text-stone-400">
                Valores dos produtos
              </p>
            </div>

            <strong className="text-xl font-black text-stone-950">
              {currency.format(subtotal)}
            </strong>
          </div>

          <div className="my-4 h-px bg-stone-100" />

          <p className="text-xs leading-relaxed text-stone-500">
            Entrega e pagamento serão definidos no
            fechamento do pedido.
          </p>

          <button
            type="button"
            disabled={items.length === 0}
            className="
              mt-5
              inline-flex
              min-h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-orange-700
              px-5
              py-3
              text-sm
              font-black
              text-white
              shadow-md
              shadow-orange-900/10
              transition-all
              duration-200
              hover:bg-orange-800
              active:scale-[0.99]
              disabled:cursor-not-allowed
              disabled:bg-stone-300
              disabled:shadow-none
              motion-reduce:transform-none
            "
          >
            Continuar pedido
          </button>
        </div>
      </aside>
    </div>
  );
}

type CartProductProps = {
  item: CartItem;
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

function CartProduct({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartProductProps) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const { product, quantity, notes } = item;

  const showImage =
    Boolean(product.image) && !imageFailed;

  const total = product.price * quantity;

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex gap-3 p-3">
        {/* Imagem */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-orange-50">
          {showImage ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-orange-50 to-amber-100/60 text-orange-300">
              <ImageOff
                size={22}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-black leading-snug text-stone-900">
                {product.name}
              </h3>

              <p className="mt-1 text-xs font-semibold text-orange-700">
                {currency.format(product.price)} cada
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

      {/* Observação */}
      {notes && (
        <div className="mx-3 rounded-xl bg-orange-50 px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-orange-700">
            Observação
          </p>

          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            {notes}
          </p>
        </div>
      )}

      {/* Quantidade e total */}
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
            aria-label={`Aumentar quantidade de ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 transition hover:bg-white hover:text-orange-700"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="text-right">
          <span className="block text-[11px] text-stone-400">
            Total
          </span>

          <strong className="text-sm font-black text-stone-900">
            {currency.format(total)}
          </strong>
        </div>
      </div>
    </article>
  );
}
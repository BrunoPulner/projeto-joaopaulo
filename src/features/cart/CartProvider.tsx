import { useState } from "react";
import type { ReactNode } from "react";

import { CartContext } from "./CartContext";
import type {
  AddCartItemInput,
  CartItem,
} from "./cartTypes";

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  function normalizeNotes(notes?: string) {
    return notes?.trim() ?? "";
  }

  function createItemId(
    productId: string,
    notes: string,
  ) {
    const normalizedNotes = notes
      .trim()
      .toLocaleLowerCase("pt-BR");

    return `${productId}::${normalizedNotes}`;
  }

  function addItem({
    product,
    quantity,
    notes,
  }: AddCartItemInput) {
    const normalizedNotes = normalizeNotes(notes);

    const itemId = createItemId(
      product.id,
      normalizedNotes,
    );

    setItems((current) => {
      const existingItem = current.find(
        (item) => item.id === itemId,
      );

      if (existingItem) {
        return current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity:
                  item.quantity + quantity,
              }
            : item,
        );
      }

      const newItem: CartItem = {
        id: itemId,
        product,
        quantity,
        notes: normalizedNotes,
      };

      return [...current, newItem];
    });
  }

  function increase(itemId: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decrease(itemId: string) {
    setItems((current) =>
      current
        .map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function remove(itemId: string) {
    setItems((current) =>
      current.filter(
        (item) => item.id !== itemId,
      ),
    );
  }

  function openCart() {
    setOpen(true);
  }

  function closeCart() {
    setOpen(false);
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        open,
        openCart,
        closeCart,
        addItem,
        increase,
        decrease,
        remove,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
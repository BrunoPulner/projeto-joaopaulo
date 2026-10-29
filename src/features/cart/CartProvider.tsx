
import { useState } from "react";
import type { ReactNode } from "react";

import { CartContext } from "./CartContext";

import type {
  AddCartItemInput,
  CartItem,
  CartProduct,
  CartAddon,
  CartPizzaConfiguration,
} from "./cartTypes";

// ============================================
// UTILITÁRIOS
// ============================================

function normalizeNotes(notes?: string): string {
  return notes?.trim() ?? "";
}

function normalizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.max(0, Math.floor(quantity));
}

function getStockLimit(
  product: CartProduct,
): number | null {
  if (!("stockQuantity" in product)) {
    return null;
  }

  return product.stockQuantity;
}

// ============================================
// IDENTIFICAÇÃO DOS ADICIONAIS
// ============================================

function getAddonsSignature(
  addons: CartAddon[] = [],
): string {
  return JSON.stringify(
    [...addons]
      .map((addon) => ({
        id: addon.id,
        quantity: addon.quantity,
      }))
      .sort((a, b) => a.id - b.id),
  );
}


function getRemovedIngredientsSignature(
  ingredients: AddCartItemInput["removedIngredients"] = [],
): string {
  return JSON.stringify(
    [...ingredients]
      .map((ingredient) => ingredient.id)
      .sort((a, b) => a - b),
  );
}

// ============================================
// IDENTIFICAÇÃO DA PIZZA
// ============================================

function getPizzaSignature(
  pizza?: CartPizzaConfiguration,
): string {
  if (!pizza) return "";

  const flavorIds = pizza.flavors
    .map((flavor) => flavor.id)
    .sort((a, b) => a - b);

  const addonIds = pizza.addons
    .map((addon) => addon.id)
    .sort((a, b) => a - b);

  return JSON.stringify({
    sizeId: pizza.size.id,
    flavorIds,
    addonIds,
  });
}

// ============================================
// IDENTIFICADOR ÚNICO DO ITEM
// ============================================

function createItemId(
  input: AddCartItemInput,
  notes: string,
): string {
  const {
    product,
    type = "PRODUCT",
    addons,
    pizza,
    removedIngredients,
  } = input;

  const normalizedNotes = notes
    .toLocaleLowerCase("pt-BR");

  return JSON.stringify({
    productId: product.id,
    type,
    notes: normalizedNotes,
    addons: getAddonsSignature(addons),
    pizza: getPizzaSignature(pizza),
    removedIngredients: getRemovedIngredientsSignature(
  removedIngredients,
),
  });
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  const [open, setOpen] = useState(false);

  // ==========================================
  // CONTADOR DE ITENS
  // ==========================================

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  // ==========================================
  // CONTROLE DE ESTOQUE
  // ==========================================

  function getAvailableQuantity(
    currentItems: CartItem[],
    product: CartProduct,
  ): number | null {
    const stockLimit = getStockLimit(product);

    if (stockLimit === null) {
      return null;
    }

    const quantityInCart = currentItems.reduce(
      (total, item) => {
        if (
          item.product.id !== product.id
        ) {
          return total;
        }

        return total + item.quantity;
      },
      0,
    );

    return Math.max(
      0,
      stockLimit - quantityInCart,
    );
  }

  // ==========================================
  // ADICIONAR ITEM
  // ==========================================

  function addItem(input: AddCartItemInput) {
    const {
      product,
      quantity,
      type = "PRODUCT",
      unitPriceCents,
      addons,
      pizza,
      removedIngredients,
    } = input;

    const requestedQuantity =
      normalizeQuantity(quantity);

    if (requestedQuantity <= 0) {
      return;
    }

    const normalizedNotes = normalizeNotes(
      input.notes,
    );

    const itemId = createItemId(
      input,
      normalizedNotes,
    );

    setItems((current) => {
      const availableQuantity =
        getAvailableQuantity(
          current,
          product,
        );

      const quantityToAdd =
        availableQuantity === null
          ? requestedQuantity
          : Math.min(
              requestedQuantity,
              availableQuantity,
            );

      if (quantityToAdd <= 0) {
        return current;
      }

      const existingItem = current.find(
        (item) => item.id === itemId,
      );

      if (existingItem) {
        return current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity:
                  item.quantity + quantityToAdd,
              }
            : item,
        );
      }

      const newItem: CartItem = {
        id: itemId,
        product,
        quantity: quantityToAdd,
        notes: normalizedNotes,
        type,
        unitPriceCents,
        addons,
        pizza,
        removedIngredients: removedIngredients
  ? removedIngredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
    }))
  : [],
      };

      return [...current, newItem];
    });
  }

  // ==========================================
  // AUMENTAR QUANTIDADE
  // ==========================================

  function increase(itemId: string) {
    setItems((current) => {
      const targetItem = current.find(
        (item) => item.id === itemId,
      );

      if (!targetItem) {
        return current;
      }

      const availableQuantity =
        getAvailableQuantity(
          current,
          targetItem.product,
        );

      if (
        availableQuantity !== null &&
        availableQuantity <= 0
      ) {
        return current;
      }

      return current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      );
    });
  }

  // ==========================================
  // DIMINUIR QUANTIDADE
  // ==========================================

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

  // ==========================================
  // REMOVER ITEM
  // ==========================================

  function remove(itemId: string) {
    setItems((current) =>
      current.filter(
        (item) => item.id !== itemId,
      ),
    );
  }

  // ==========================================
  // ABRIR SACOLA
  // ==========================================

  function openCart() {
    setOpen(true);
  }

  // ==========================================
  // FECHAR SACOLA
  // ==========================================

  function closeCart() {
    setOpen(false);
  }

  // ==========================================
  // CONTEXTO
  // ==========================================

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

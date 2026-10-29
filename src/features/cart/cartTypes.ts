
import type { Product } from "../catalog/catalogData";

import type { CatalogProduct } from "../catalog/types/catalog.types";

import type { RemovedIngredient } from "../catalog/api/product-ingredients.api";

// ============================================
// TIPOS DE PRODUTOS
// ============================================

// Compatibilidade com o catálogo antigo
// e com os produtos reais da API.
export type CartProduct =
  | Product
  | CatalogProduct;

// ============================================
// ADICIONAIS DE PRODUTOS
// ============================================

export type CartAddon = {
  id: number;
  name: string;
  priceCents: number;
  quantity: number;
};

// ============================================
// CONFIGURAÇÃO DE PIZZA
// ============================================

export type CartPizzaSize = {
  id: number;
  name: string;
  slices: number;
  basePriceCents: number;
};

export type CartPizzaFlavor = {
  id: number;
  name: string;
  additionalPriceCents: number;
  isPremium: boolean;
};

export type CartPizzaAddon = {
  id: number;
  name: string;
  priceCents: number;
};

export type CartPizzaConfiguration = {
  size: CartPizzaSize;
  flavors: CartPizzaFlavor[];
  addons: CartPizzaAddon[];
};

// ============================================
// ITEM DO CARRINHO
// ============================================

export type CartItem = {
  // Identificador único da configuração
  id: string;

  // Produto de origem
  product: CartProduct;

  // Tipo de item
  type?: "PRODUCT" | "PIZZA";

  // Quantidade selecionada
  quantity: number;

  // Observações do cliente
  notes: string;

  // Preço unitário final, em centavos.
  // Inclui adicionais e personalizações.
  unitPriceCents?: number;

  // Adicionais de produtos convencionais
  addons?: CartAddon[];

  // Configuração exclusiva de pizza
  pizza?: CartPizzaConfiguration;

  removedIngredients?: RemovedIngredient[];
};

// ============================================
// ENTRADA PARA ADICIONAR AO CARRINHO
// ============================================

export type AddCartItemInput = {
  product: CartProduct;

  quantity: number;

  notes?: string;

  type?: "PRODUCT" | "PIZZA";

  unitPriceCents?: number;

  addons?: CartAddon[];

  pizza?: CartPizzaConfiguration;

  removedIngredients?: RemovedIngredient[];
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Retorna o preço base do produto
// independentemente do modelo utilizado.
export function getCartProductPriceCents(
  product: CartProduct,
): number {
  if ("priceCents" in product) {
    return product.priceCents;
  }

  return Math.round(product.price * 100);
}

// Retorna o preço unitário efetivo
// do item, incluindo personalizações.
export function getCartItemUnitPriceCents(
  item: CartItem,
): number {
  return (
    item.unitPriceCents ??
    getCartProductPriceCents(item.product)
  );
}

// Retorna o total do item em centavos.
export function getCartItemTotalCents(
  item: CartItem,
): number {
  return (
    getCartItemUnitPriceCents(item) *
    item.quantity
  );
}

// Retorna o subtotal completo da sacola.
export function getCartSubtotalCents(
  items: CartItem[],
): number {
  return items.reduce(
    (total, item) =>
      total + getCartItemTotalCents(item),
    0,
  );
}

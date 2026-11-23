
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

  // Ingredientes removidos especificamente deste sabor.
  removedIngredients?: RemovedIngredient[];
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
  // Identificador único da configuração.
  id: string;

  // Produto de origem.
  product: CartProduct;

  // Tipo de item.
  type?: "PRODUCT" | "PIZZA";

  // Quantidade selecionada.
  quantity: number;

  // Observações do cliente.
  notes: string;

  // Preço unitário final, em centavos.
  // Inclui adicionais e personalizações.
  unitPriceCents?: number;

  // Preço unitário original antes da promoção.
  // Inclui adicionais e personalizações.
  originalUnitPriceCents?: number;

  // ID da promoção aplicada.
  // Opcional para produtos sem desconto.
  promotionId?: number;

  // Adicionais de produtos convencionais.
  addons?: CartAddon[];

  // Configuração exclusiva de pizza.
  pizza?: CartPizzaConfiguration;

  // Ingredientes removidos do produto.
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

  // Preço unitário final.
  unitPriceCents?: number;

  // Preço unitário antes da promoção.
  originalUnitPriceCents?: number;

  // Identificador da promoção aplicada.
  promotionId?: number;

  addons?: CartAddon[];

  pizza?: CartPizzaConfiguration;

  removedIngredients?: RemovedIngredient[];
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Retorna o preço base do produto,
// independentemente do modelo utilizado.
export function getCartProductPriceCents(
  product: CartProduct,
): number {
  if ("priceCents" in product) {
    return product.priceCents;
  }

  return Math.round(product.price * 100);
}

// ============================================
// PREÇO UNITÁRIO EFETIVO
// ============================================

// Retorna o preço unitário final do item,
// incluindo promoções e personalizações.
//
// O valor armazenado é uma estimativa do
// frontend. O backend recalcula o preço
// ao confirmar o pedido.
export function getCartItemUnitPriceCents(
  item: CartItem,
): number {
  return (
    item.unitPriceCents ??
    getCartProductPriceCents(item.product)
  );
}

// ============================================
// PREÇO ORIGINAL DO ITEM
// ============================================

// Retorna o preço unitário anterior à promoção.
//
// Para itens antigos que não possuem
// originalUnitPriceCents, utiliza o preço
// unitário disponível como alternativa.
export function getCartItemOriginalPriceCents(
  item: CartItem,
): number {
  return (
    item.originalUnitPriceCents ??
    getCartItemUnitPriceCents(item)
  );
}

// ============================================
// ECONOMIA UNITÁRIA
// ============================================

// Calcula a economia por unidade,
// sem permitir valores negativos.
export function getCartItemDiscountCents(
  item: CartItem,
): number {
  const originalPrice =
    getCartItemOriginalPriceCents(item);

  const finalPrice =
    getCartItemUnitPriceCents(item);

  return Math.max(
    0,
    originalPrice - finalPrice,
  );
}

// ============================================
// TOTAL DO ITEM
// ============================================

// Retorna o total final do item,
// considerando a quantidade.
export function getCartItemTotalCents(
  item: CartItem,
): number {
  return (
    getCartItemUnitPriceCents(item) *
    item.quantity
  );
}

// ============================================
// ECONOMIA TOTAL DO ITEM
// ============================================

export function getCartItemTotalDiscountCents(
  item: CartItem,
): number {
  return (
    getCartItemDiscountCents(item) *
    item.quantity
  );
}

// ============================================
// SUBTOTAL DA SACOLA
// ============================================

// Retorna o subtotal dos itens com
// os preços armazenados no carrinho.
export function getCartSubtotalCents(
  items: CartItem[],
): number {
  return items.reduce(
    (total, item) =>
      total + getCartItemTotalCents(item),
    0,
  );
}

// ============================================
// ECONOMIA TOTAL DA SACOLA
// ============================================

// Soma a economia de todos os itens
// que possuem preço original informado.
export function getCartTotalDiscountCents(
  items: CartItem[],
): number {
  return items.reduce(
    (total, item) =>
      total + getCartItemTotalDiscountCents(item),
    0,
  );
}

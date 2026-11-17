
/**
 * Espetinhos João Paulo
 * Tipagens do módulo de pedidos
 */

// ============================================
// STATUS DOS PEDIDOS
// ============================================

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus =
  (typeof ORDER_STATUSES)[number];

// ============================================
// PAGAMENTO
// ============================================

export const PAYMENT_STATUSES = [
  "NOT_PROCESSED",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "UNDEFINED",
  "ONLINE",
  "CASH",
  "CARD_ON_DELIVERY",
  "PIX_ON_DELIVERY",
] as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[number];

// ============================================
// ENTREGA E RETIRADA
// ============================================

export const FULFILLMENT_TYPES = [
  "DELIVERY",
  "PICKUP",
] as const;

export type FulfillmentType =
  (typeof FULFILLMENT_TYPES)[number];

export interface OrderAddress {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  city: string;
  state: string;

  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// ============================================
// ADICIONAIS
// ============================================

export interface OrderAddonInput {
  id: number;
  quantity: number;
}

export interface OrderAddonSnapshot {
  id: number;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

// ============================================
// INGREDIENTES REMOVIDOS
// ============================================

export interface OrderRemovedIngredientSnapshot {
  id: number;
  name: string;
}

// ============================================
// PERSONALIZAÇÕES DOS SABORES
// ============================================

export interface OrderPizzaFlavorCustomizationInput {
  flavorId: number;
  removedIngredientIds: number[];
}

// ============================================
// CONFIGURAÇÃO DA PIZZA - ENTRADA
// ============================================

export interface OrderPizzaInput {
  sizeId: number;
  flavorIds: number[];
  addonIds: number[];

  flavorCustomizations?:
    OrderPizzaFlavorCustomizationInput[];
}

// ============================================
// CONFIGURAÇÃO DA PIZZA - SNAPSHOT
// ============================================

export interface OrderPizzaFlavorSnapshot {
  id: number;
  name: string;
  additionalPriceCents: number;
  isPremium: boolean;
  premiumAdditionalCents: number;

  removedIngredients:
    OrderRemovedIngredientSnapshot[];
}

export interface OrderPizzaSnapshot {
  size: {
    id: number;
    name: string;
    basePriceCents: number;
  };

  flavors: OrderPizzaFlavorSnapshot[];

  addons: {
    id: number;
    name: string;
    priceCents: number;
  }[];
}

// ============================================
// ITEM DO PEDIDO - ENTRADA
// ============================================

export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
  notes: string;

  type: "PRODUCT" | "PIZZA";

  addons?: OrderAddonInput[];

  pizza?: OrderPizzaInput;

  removedIngredientIds?: number[];
}

// ============================================
// CRIAÇÃO DO PEDIDO
// ============================================

export interface CreateOrderInput {
  idempotencyKey: string;

  fulfillmentType: FulfillmentType;

  deliveryAddress?: OrderAddress;

  paymentMethod: PaymentMethod;

  notes?: string;

  items: CreateOrderItemInput[];
}

// ============================================
// ITEM DO PEDIDO - SNAPSHOT
// ============================================

export interface OrderItem {
  id: number;
  orderId: number;

  productId: number | null;
  productName: string;
  productImageUrl: string | null;

  type: "PRODUCT" | "PIZZA";

  quantity: number;
  notes: string;

  unitPriceCents: number;
  totalPriceCents: number;

  addons: OrderAddonSnapshot[];

  pizza: OrderPizzaSnapshot | null;

  // Ingredientes removidos de produtos comuns.
  // Para pizzas, ficam dentro de pizza.flavors.
  removedIngredients:
    OrderRemovedIngredientSnapshot[];
}

// ============================================
// PEDIDO COMPLETO
// ============================================

export interface Order {
  id: number;
  orderNumber: string;
  idempotencyKey: string;

  requestHash?: string | null;

  customerId: string;
  customerName: string;
  customerEmail: string;

  status: OrderStatus;

  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  fulfillmentType: FulfillmentType;

  deliveryAddress: OrderAddress | null;

  notes: string;

  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;

  items: OrderItem[];

  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
}

// ============================================
// ATUALIZAÇÃO DE STATUS
// ============================================

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

/** Espetinhos João Paulo - Tipagens de pedidos */
export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PAYMENT_STATUSES = ["NOT_PROCESSED", "PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_METHODS = ["UNDEFINED", "ONLINE", "CASH", "CARD_ON_DELIVERY", "PIX_ON_DELIVERY"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const FULFILLMENT_TYPES = ["DELIVERY", "PICKUP"] as const;
export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number];
export interface OrderAddress { street: string; number: string; neighborhood: string; complement: string; city: string; state: string; coordinates: { latitude: number; longitude: number }; }
export interface OrderAddonInput { id: number; quantity: number; }
export interface OrderPizzaInput { sizeId: number; flavorIds: number[]; addonIds: number[]; }
export interface CreateOrderItemInput { productId: number; quantity: number; notes: string; type: "PRODUCT" | "PIZZA"; addons?: OrderAddonInput[]; pizza?: OrderPizzaInput; removedIngredientIds?: number[]; }
export interface CreateOrderInput { idempotencyKey: string; fulfillmentType: FulfillmentType; deliveryAddress?: OrderAddress; paymentMethod: PaymentMethod; notes?: string; items: CreateOrderItemInput[]; }
export interface OrderAddonSnapshot { id: number; name: string; quantity: number; unitPriceCents: number; }
export interface OrderPizzaSnapshot {
  size: { id: number; name: string; basePriceCents: number };
  flavors: { id: number; name: string; additionalPriceCents: number; isPremium: boolean; premiumAdditionalCents: number }[];
  addons: { id: number; name: string; priceCents: number }[];
}
export interface OrderRemovedIngredientSnapshot { id: number; name: string; }
export interface OrderItem { id: number; orderId: number; productId: number | null; productName: string; productImageUrl: string | null; type: "PRODUCT" | "PIZZA"; quantity: number; notes: string; unitPriceCents: number; totalPriceCents: number; addons: OrderAddonSnapshot[]; pizza: OrderPizzaSnapshot | null; removedIngredients: OrderRemovedIngredientSnapshot[]; }
export interface Order { id: number; orderNumber: string; idempotencyKey: string; requestHash?: string | null; customerId: string; customerName: string; customerEmail: string; status: OrderStatus; paymentStatus: PaymentStatus; paymentMethod: PaymentMethod; fulfillmentType: FulfillmentType; deliveryAddress: OrderAddress | null; notes: string; subtotalCents: number; deliveryFeeCents: number; totalCents: number; items: OrderItem[]; createdAt: Date; updatedAt: Date; cancelledAt: Date | null; }
export interface UpdateOrderStatusInput { status: OrderStatus; }


import type { CartItem } from "../cartTypes";
import type { DeliveryAddress } from "../delivery/deliveryAddress.types";

// ============================================
// CONFIGURAÇÃO DA API
// ============================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

const ORDERS_URL = `${API_BASE_URL}/api/orders`;

// ============================================
// TIPAGENS DO PEDIDO
// ============================================

export type OrderFulfillmentType =
  | "DELIVERY"
  | "PICKUP";

export type OrderPaymentMethod =
  | "UNDEFINED"
  | "ONLINE"
  | "CASH"
  | "CARD_ON_DELIVERY"
  | "PIX_ON_DELIVERY";

export type CreateOrderItemPayload = {
  productId: number;
  quantity: number;
  notes: string;
  type: "PRODUCT" | "PIZZA";

  addons?: {
    id: number;
    quantity: number;
  }[];

  pizza?: {
    sizeId: number;
    flavorIds: number[];
    addonIds: number[];
  };

  removedIngredientIds?: number[];
};

export type CreateOrderPayload = {
  idempotencyKey: string;
  fulfillmentType: OrderFulfillmentType;
  deliveryAddress?: DeliveryAddress;
  paymentMethod: OrderPaymentMethod;
  notes: string;
  items: CreateOrderItemPayload[];
};

export type CreateOrderOptions = {
  items: CartItem[];
  fulfillmentType: OrderFulfillmentType;
  deliveryAddress?: DeliveryAddress;
  paymentMethod?: OrderPaymentMethod;
  notes?: string;
  idempotencyKey: string;
};

// ============================================
// RESPOSTA DA API
// ============================================


export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export type OrderAddonSnapshot = {
  id: number;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export type OrderPizzaSnapshot = {
  size: {
    id: number;
    name: string;
    basePriceCents: number;
  };
  flavors: {
    id: number;
    name: string;
    additionalPriceCents: number;
    isPremium: boolean;
    premiumAdditionalCents: number;
  }[];
  addons: {
    id: number;
    name: string;
    priceCents: number;
  }[];
};

export type OrderItemSnapshot = {
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
  removedIngredients: {
    id: number;
    name: string;
  }[];
};

export type CreatedOrder = {
  id: number;
  orderNumber: string;
  idempotencyKey: string;
  customerId: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentType: OrderFulfillmentType;
  deliveryAddress: DeliveryAddress | null;
  notes: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  items: OrderItemSnapshot[];
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
};


type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

// ============================================
// ERROS DA API
// ============================================

export class OrdersApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OrdersApiError";
    this.status = status;
  }
}

// ============================================
// CONVERTER ITEM DO CARRINHO
// ============================================

export function cartItemToOrderItem(
  item: CartItem,
): CreateOrderItemPayload {
  const productId = Number(item.product.id);

  if (
    !Number.isSafeInteger(productId) ||
    productId <= 0
  ) {
    throw new Error(
      "Um produto do carrinho possui ID inválido.",
    );
  }

  if (
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > 99
  ) {
    throw new Error(
      "A quantidade de um item é inválida.",
    );
  }

  const type = item.type ?? "PRODUCT";

  const base: CreateOrderItemPayload = {
    productId,
    quantity: item.quantity,
    notes: item.notes ?? "",
    type,
  };

  // ==========================================
  // PIZZA PERSONALIZADA
  // ==========================================

  if (type === "PIZZA") {
    if (!item.pizza) {
      throw new Error(
        "A pizza não possui uma configuração válida.",
      );
    }

    return {
      ...base,
      pizza: {
        sizeId: item.pizza.size.id,
        flavorIds: item.pizza.flavors.map(
          (flavor) => flavor.id,
        ),
        addonIds: item.pizza.addons.map(
          (addon) => addon.id,
        ),
      },
    };
  }

  // ==========================================
  // PRODUTO CONVENCIONAL
  // ==========================================

  return {
    ...base,
    addons: (item.addons ?? []).map(
      (addon) => ({
        id: addon.id,
        quantity: addon.quantity,
      }),
    ),
    removedIngredientIds: (
      item.removedIngredients ?? []
    ).map((ingredient) => ingredient.id),
  };
}

// ============================================
// MONTAR PEDIDO
// ============================================

export function buildCreateOrderPayload(
  options: CreateOrderOptions,
): CreateOrderPayload {
  if (options.items.length === 0) {
    throw new Error(
      "Adicione pelo menos um produto ao carrinho.",
    );
  }

  if (
    options.fulfillmentType === "DELIVERY" &&
    !options.deliveryAddress
  ) {
    throw new Error(
      "Confirme o endereço de entrega.",
    );
  }

  return {
    idempotencyKey: options.idempotencyKey,
    fulfillmentType: options.fulfillmentType,

    ...(options.fulfillmentType === "DELIVERY"
      ? {
          deliveryAddress:
            options.deliveryAddress,
        }
      : {}),

    paymentMethod:
      options.paymentMethod ?? "UNDEFINED",

    notes: options.notes?.trim() ?? "",

    items: options.items.map(
      cartItemToOrderItem,
    ),
  };
}

// ============================================
// INTERPRETAR RESPOSTA
// ============================================

async function parseOrdersResponse<T>(
  response: Response,
): Promise<T> {
  let result: ApiResponse<T>;

  try {
    result =
      (await response.json()) as ApiResponse<T>;
  } catch {
    throw new OrdersApiError(
      "O servidor retornou uma resposta inválida.",
      response.status,
    );
  }

  if (!response.ok || !result.success) {
    const validationMessage = result.errors
      ?.map((error) => error.message)
      .join(" ");

    throw new OrdersApiError(
      validationMessage ||
        result.message ||
        "Não foi possível processar o pedido.",
      response.status,
    );
  }

  if (result.data === undefined) {
    throw new OrdersApiError(
      "A API não retornou os dados do pedido.",
      response.status,
    );
  }

  return result.data;
}

// ============================================
// CRIAR PEDIDO
// ============================================

export async function createOrder(
  options: CreateOrderOptions,
  signal?: AbortSignal,
): Promise<CreatedOrder> {
  const payload =
    buildCreateOrderPayload(options);

  let response: Response;

  try {
    response = await fetch(ORDERS_URL, {
      method: "POST",
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw error;
    }

    throw new OrdersApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      0,
    );
  }

  return parseOrdersResponse<CreatedOrder>(
    response,
  );
}

// ============================================
// LISTAR PEDIDOS DO CLIENTE
// ============================================


export async function getMyOrders(
  signal?: AbortSignal,
): Promise<CreatedOrder[]> {
  const response = await fetch(
    `${ORDERS_URL}/my`,
    {
      method: "GET",
      credentials: "include",
      signal,
    },
  );

  return parseOrdersResponse<CreatedOrder[]>(
    response,
  );
}


// ============================================
// CONSULTAR PEDIDO
// ============================================

export async function getMyOrderById(
  orderId: number,
  signal?: AbortSignal,
): Promise<CreatedOrder> {
  const response = await fetch(
    `${ORDERS_URL}/${orderId}`,
    {
      method: "GET",
      credentials: "include",
      signal,
    },
  );

  return parseOrdersResponse<CreatedOrder>(
    response,
  );
}


export async function cancelMyOrder(
  orderId: number,
): Promise<CreatedOrder> {
  let response: Response;

  try {
    response = await fetch(
      `${ORDERS_URL}/${orderId}/cancel`,
      {
        method: "PATCH",
        credentials: "include",
      },
    );
  } catch {
    throw new OrdersApiError(
      "Não foi possível conectar ao servidor para cancelar o pedido.",
      0,
    );
  }

  return parseOrdersResponse<CreatedOrder>(
    response,
  );
}

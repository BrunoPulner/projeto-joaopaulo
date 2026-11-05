
 // ============================================
 // ESPETINHOS JOÃO PAULO
 // API ADMINISTRATIVA DE PEDIDOS
 // ============================================

 // ============================================
 // CONFIGURAÇÃO DA API
 // ============================================

 const API_BASE_URL = (
   import.meta.env.VITE_API_URL ??
   "http://localhost:3000"
 ).replace(/\/$/, "");

 const ADMIN_ORDERS_URL =
   `${API_BASE_URL}/api/admin/orders`;

 // ============================================
 // STATUS DOS PEDIDOS
 // ============================================

 export type AdminOrderStatus =
   | "PENDING"
   | "CONFIRMED"
   | "PREPARING"
   | "READY"
   | "OUT_FOR_DELIVERY"
   | "COMPLETED"
   | "CANCELLED";

 export type AdminPaymentStatus =
   | "NOT_PROCESSED"
   | "PENDING"
   | "PAID"
   | "FAILED"
   | "REFUNDED";

 export type AdminPaymentMethod =
   | "UNDEFINED"
   | "ONLINE"
   | "CASH"
   | "CARD_ON_DELIVERY"
   | "PIX_ON_DELIVERY";

 export type AdminFulfillmentType =
   | "DELIVERY"
   | "PICKUP";

 // ============================================
 // ENDEREÇO DE ENTREGA
 // ============================================

 export type AdminOrderAddress = {
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
 };

 // ============================================
 // ADICIONAIS CONVENCIONAIS
 // ============================================

 export type AdminOrderAddon = {
   id: number;
   name: string;
   quantity: number;
   unitPriceCents: number;
 };

 // ============================================
 // PIZZA PERSONALIZADA
 // ============================================

 export type AdminOrderPizza = {
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

 // ============================================
 // INGREDIENTES REMOVIDOS
 // ============================================

 export type AdminOrderRemovedIngredient = {
   id: number;
   name: string;
 };

 // ============================================
 // ITEM DO PEDIDO
 // ============================================

 export type AdminOrderItem = {
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

   addons: AdminOrderAddon[];
   pizza: AdminOrderPizza | null;

   removedIngredients:
     AdminOrderRemovedIngredient[];
 };

 // ============================================
 // PEDIDO COMPLETO
 // ============================================

 export type AdminOrder = {
   id: number;
   orderNumber: string;
   idempotencyKey: string;

   customerId: string;
   customerName: string;
   customerEmail: string;

   status: AdminOrderStatus;
   paymentStatus: AdminPaymentStatus;
   paymentMethod: AdminPaymentMethod;

   fulfillmentType: AdminFulfillmentType;
   deliveryAddress: AdminOrderAddress | null;

   notes: string;

   subtotalCents: number;
   deliveryFeeCents: number;
   totalCents: number;

   items: AdminOrderItem[];

   createdAt: string;
   updatedAt: string;
   cancelledAt: string | null;
 };

 // ============================================
 // RESPOSTA PADRÃO DA API
 // ============================================

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
 // ERRO PERSONALIZADO
 // ============================================

 export class AdminOrdersApiError extends Error {
   readonly status: number;

   constructor(
     message: string,
     status: number,
   ) {
     super(message);

     this.name = "AdminOrdersApiError";
     this.status = status;
   }
 }

 // ============================================
 // TRATAMENTO DAS RESPOSTAS
 // ============================================

 async function parseApiResponse<T>(
   response: Response,
 ): Promise<T> {
   let result: ApiResponse<T>;

   try {
     result =
       (await response.json()) as ApiResponse<T>;
   } catch {
     throw new AdminOrdersApiError(
       "O servidor retornou uma resposta inválida.",
       response.status,
     );
   }

   if (!response.ok || !result.success) {
     const validationErrors = result.errors
       ?.map((error) => error.message)
       .join(" ");

     let fallbackMessage =
       "Não foi possível processar a solicitação.";

     if (response.status === 401) {
       fallbackMessage =
         "Sua sessão expirou. Entre novamente.";
     }

     if (response.status === 403) {
       fallbackMessage =
         "Você não possui permissão para gerenciar pedidos.";
     }

     if (response.status === 404) {
       fallbackMessage =
         "Pedido não encontrado.";
     }

     throw new AdminOrdersApiError(
       validationErrors ||
         result.message ||
         fallbackMessage,
       response.status,
     );
   }

   if (result.data === undefined) {
     throw new AdminOrdersApiError(
       "A API não retornou os dados solicitados.",
       response.status,
     );
   }

   return result.data;
 }

 // ============================================
 // REQUISIÇÃO AUTENTICADA
 // ============================================

 async function adminOrdersRequest<T>(
   endpoint: string,
   options: RequestInit = {},
 ): Promise<T> {
   let response: Response;

   try {
     response = await fetch(
       `${ADMIN_ORDERS_URL}${endpoint}`,
       {
         ...options,

         credentials: "include",

         headers: {
           "Content-Type": "application/json",
           ...options.headers,
         },
       },
     );
   } catch (error) {
     if (
       error instanceof DOMException &&
       error.name === "AbortError"
     ) {
       throw error;
     }

     throw new AdminOrdersApiError(
       "Não foi possível conectar ao servidor.",
       0,
     );
   }

   return parseApiResponse<T>(response);
 }

 // ============================================
 // LISTAR PEDIDOS
 // GET /api/admin/orders
 // ============================================

 export async function getAdminOrders(
   signal?: AbortSignal,
 ): Promise<AdminOrder[]> {
   return adminOrdersRequest<AdminOrder[]>(
     "",
     {
       method: "GET",
       signal,
     },
   );
 }

 // ============================================
 // CONSULTAR PEDIDO POR ID
 // GET /api/admin/orders/:id
 // ============================================

 export async function getAdminOrderById(
   orderId: number,
   signal?: AbortSignal,
 ): Promise<AdminOrder> {
   if (
     !Number.isSafeInteger(orderId) ||
     orderId <= 0
   ) {
     throw new Error(
       "O ID do pedido é inválido.",
     );
   }

   return adminOrdersRequest<AdminOrder>(
     `/${orderId}`,
     {
       method: "GET",
       signal,
     },
   );
 }

 // ============================================
 // ATUALIZAR STATUS DO PEDIDO
 // PATCH /api/admin/orders/:id/status
 // ============================================

 export async function updateAdminOrderStatus(
   orderId: number,
   status: AdminOrderStatus,
   signal?: AbortSignal,
 ): Promise<AdminOrder> {
   if (
     !Number.isSafeInteger(orderId) ||
     orderId <= 0
   ) {
     throw new Error(
       "O ID do pedido é inválido.",
     );
   }

   return adminOrdersRequest<AdminOrder>(
     `/${orderId}/status`,
     {
       method: "PATCH",

       body: JSON.stringify({
         status,
       }),

       signal,
     },
   );
 }

 // ============================================
 // FORMATAR PREÇO
 // ============================================

 export function formatOrderPrice(
   cents: number,
 ): string {
   return (cents / 100).toLocaleString(
     "pt-BR",
     {
       style: "currency",
       currency: "BRL",
     },
   );
 }

 // ============================================
 // FORMATAR DATA
 // ============================================

 export function formatOrderDate(
   date: string,
 ): string {
   return new Intl.DateTimeFormat(
     "pt-BR",
     {
       day: "2-digit",
       month: "2-digit",
       year: "numeric",
       hour: "2-digit",
       minute: "2-digit",
     },
   ).format(new Date(date));
 }

 // ============================================
 // LABELS DOS STATUS
 // ============================================

 export const ORDER_STATUS_LABELS:
   Record<AdminOrderStatus, string> = {
     PENDING: "Pendente",
     CONFIRMED: "Confirmado",
     PREPARING: "Em preparo",
     READY: "Pronto",
     OUT_FOR_DELIVERY: "Saiu para entrega",
     COMPLETED: "Concluído",
     CANCELLED: "Cancelado",
   };

 export const PAYMENT_STATUS_LABELS:
   Record<AdminPaymentStatus, string> = {
     NOT_PROCESSED: "Não processado",
     PENDING: "Pendente",
     PAID: "Pago",
     FAILED: "Falhou",
     REFUNDED: "Reembolsado",
   };

 export const FULFILLMENT_TYPE_LABELS:
   Record<AdminFulfillmentType, string> = {
     DELIVERY: "Entrega",
     PICKUP: "Retirada",
   };

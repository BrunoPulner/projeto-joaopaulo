
import { z } from "zod";

import {
  FULFILLMENT_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from "./orders.types.js";

// ============================================
// UTILITÁRIOS
// ============================================

const positiveId = z.number().int().positive();

const notesSchema = z
  .string()
  .trim()
  .max(1000, "Observação muito longa.");

// ============================================
// ENDEREÇO
// ============================================

export const orderAddressSchema = z
  .object({
    street: z.string().trim().min(2).max(150),
    number: z.string().trim().min(1).max(20),
    neighborhood: z.string().trim().min(2).max(100),
    complement: z.string().trim().max(200),
    city: z.literal("Rebouças"),
    state: z.literal("PR"),

    coordinates: z
      .object({
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
      })
      .strict(),
  })
  .strict();

// ============================================
// ADICIONAIS CONVENCIONAIS
// ============================================

export const orderAddonSchema = z
  .object({
    id: positiveId,
    quantity: z.number().int().min(1).max(50),
  })
  .strict();

// ============================================
// CONFIGURAÇÃO DA PIZZA
// ============================================

export const orderPizzaSchema = z
  .object({
    sizeId: positiveId,

    flavorIds: z
      .array(positiveId)
      .min(1, "Selecione pelo menos um sabor.")
      .max(2, "Selecione no máximo dois sabores.")
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Não repita sabores.",
      ),

    addonIds: z
      .array(positiveId)
      .max(30, "Limite de adicionais excedido.")
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Não repita adicionais.",
      ),
  })
  .strict();

// ============================================
// ITEM DO PEDIDO
// ============================================

export const createOrderItemSchema = z
  .object({
    productId: positiveId,

    quantity: z.number().int().min(1).max(99),

    notes: notesSchema.default(""),

    type: z.enum(["PRODUCT", "PIZZA"]),

    addons: z
      .array(orderAddonSchema)
      .max(30)
      .optional(),

    pizza: orderPizzaSchema.optional(),

    removedIngredientIds: z
      .array(positiveId)
      .max(100)
      .optional(),
  })
  .strict()
  .superRefine((item, ctx) => {
    // ========================================
    // PIZZAS PERSONALIZADAS
    // ========================================

    if (item.type === "PIZZA") {
      if (!item.pizza) {
        ctx.addIssue({
          code: "custom",
          path: ["pizza"],
          message: "Informe a configuração da pizza.",
        });
      }

      if (item.addons && item.addons.length > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["addons"],
          message:
            "Adicionais de pizza devem ser informados em pizza.addonIds.",
        });
      }

      if (
        item.removedIngredientIds &&
        item.removedIngredientIds.length > 0
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["removedIngredientIds"],
          message:
            "A remoção de ingredientes para pizzas ainda não está disponível.",
        });
      }
    }

    // ========================================
    // PRODUTOS CONVENCIONAIS
    // ========================================

    if (item.type === "PRODUCT" && item.pizza) {
      ctx.addIssue({
        code: "custom",
        path: ["pizza"],
        message:
          "Produto comum não aceita configuração de pizza.",
      });
    }

    // ========================================
    // ADICIONAIS DUPLICADOS
    // ========================================

    if (
      item.addons &&
      new Set(item.addons.map((addon) => addon.id)).size !==
        item.addons.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["addons"],
        message: "Não repita adicionais.",
      });
    }

    // ========================================
    // INGREDIENTES DUPLICADOS
    // ========================================

    if (
      item.removedIngredientIds &&
      new Set(item.removedIngredientIds).size !==
        item.removedIngredientIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["removedIngredientIds"],
        message: "Não repita ingredientes.",
      });
    }
  });

// ============================================
// CRIAR PEDIDO
// ============================================

export const createOrderSchema = z
  .object({
    idempotencyKey: z.uuid(),

    fulfillmentType: z.enum(FULFILLMENT_TYPES),

    deliveryAddress: orderAddressSchema.optional(),

    // O pagamento ainda não é processado.
    paymentMethod: z
      .enum(PAYMENT_METHODS)
      .default("UNDEFINED"),

    notes: notesSchema.default(""),

    items: z
      .array(createOrderItemSchema)
      .min(1, "Adicione pelo menos um produto.")
      .max(100, "Limite de itens excedido."),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.fulfillmentType === "DELIVERY" &&
      !data.deliveryAddress
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryAddress"],
        message: "Informe o endereço de entrega.",
      });
    }

    if (
      data.fulfillmentType === "PICKUP" &&
      data.deliveryAddress
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryAddress"],
        message: "Retirada não precisa de endereço.",
      });
    }
  });

// ============================================
// ATUALIZAR STATUS
// ============================================

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
  })
  .strict();

// ============================================
// VALIDAR ID DA URL
// ============================================

export const orderIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(2_147_483_647);

// ============================================
// TIPOS INFERIDOS
// ============================================

export type CreateOrderPayload = z.infer<
  typeof createOrderSchema
>;

export type CreateOrderItemPayload = z.infer<
  typeof createOrderItemSchema
>;

export type UpdateOrderStatusPayload = z.infer<
  typeof updateOrderStatusSchema
>;

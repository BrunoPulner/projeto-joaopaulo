
import { z } from "zod";

import {
  PROMOTION_TARGET_TYPES,
} from "./promotions.types.js";

// ============================================
// CAMPOS COMPARTILHADOS
// ============================================

const promotionBaseFields = {
  name: z.string().trim().min(2).max(120),

  promotionalPriceCents: z
    .number()
    .int()
    .positive(),

  isActive: z.boolean().optional(),

  startsAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .optional(),

  endsAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .optional(),
};

// ============================================
// VALIDAÇÃO DO PERÍODO
// ============================================

function validatePromotionDates(
  data: {
    startsAt?: string | null;
    endsAt?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (
    data.startsAt &&
    data.endsAt &&
    new Date(data.endsAt).getTime() <=
      new Date(data.startsAt).getTime()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["endsAt"],
      message:
        "A data de término deve ser posterior à data de início.",
    });
  }
}

// ============================================
// CADASTRO DE PROMOÇÃO INDIVIDUAL
// ============================================

export const createPromotionSchema = z
  .discriminatedUnion("targetType", [
    z.strictObject({
      ...promotionBaseFields,

      targetType: z.literal(
        PROMOTION_TARGET_TYPES[0],
      ),

      productId: z
        .number()
        .int()
        .positive(),
    }),

    z.strictObject({
      ...promotionBaseFields,

      targetType: z.literal(
        PROMOTION_TARGET_TYPES[1],
      ),

      pizzaFlavorId: z
        .number()
        .int()
        .positive(),
    }),
  ])
  .superRefine(validatePromotionDates);

// ============================================
// ATUALIZAÇÃO DE PROMOÇÃO INDIVIDUAL
// ============================================

export const updatePromotionSchema = z
  .strictObject(promotionBaseFields)
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message:
        "Informe pelo menos um campo para atualizar.",
    },
  )
  .superRefine(validatePromotionDates);

// ============================================
// IDS DOS SABORES DE PIZZA
// ============================================

const pizzaFlavorIdsSchema = z
  .array(
    z.number().int().positive(),
  )
  .min(
    1,
    "Selecione pelo menos um sabor de pizza.",
  )
  .max(
    100,
    "O limite é de 100 sabores por oferta.",
  )
  .refine(
    (ids) => new Set(ids).size === ids.length,
    {
      message:
        "Não é permitido selecionar o mesmo sabor mais de uma vez.",
    },
  );

// ============================================
// CADASTRO DE OFERTA AGRUPADA
// ============================================

/**
 * Uma oferta agrupada representa uma única
 * campanha administrativa que pode conter
 * diversos sabores de pizza.
 *
 * Exemplo:
 * Terça da Pizza
 * Sabores: Calabresa, Crocante
 * Preço: R$ 25,00
 */

export const createPromotionGroupSchema = z
  .strictObject({
    ...promotionBaseFields,

    targetType: z.literal("PIZZA_FLAVOR"),

    pizzaFlavorIds: pizzaFlavorIdsSchema,
  })
  .superRefine(validatePromotionDates);

// ============================================
// ATUALIZAÇÃO DE OFERTA AGRUPADA
// ============================================

/**
 * Permite atualizar:
 *
 * - Nome da oferta
 * - Preço promocional
 * - Status de ativação
 * - Data de início
 * - Data de término
 * - Sabores participantes
 *
 * A lista de sabores, quando informada,
 * substitui a lista anterior.
 */

export const updatePromotionGroupSchema = z
  .strictObject({
    ...promotionBaseFields,

    pizzaFlavorIds:
      pizzaFlavorIdsSchema.optional(),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message:
        "Informe pelo menos um campo para atualizar a oferta.",
    },
  )
  .superRefine(validatePromotionDates);

// ============================================
// PARÂMETROS DAS ROTAS
// ============================================

export const promotionIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive(),
});

export const promotionGroupIdParamsSchema =
  z.object({
    id: z.coerce
      .number()
      .int()
      .positive(),
  });

// ============================================
// TIPOS INFERIDOS
// ============================================

export type CreatePromotionSchemaInput =
  z.infer<typeof createPromotionSchema>;

export type UpdatePromotionSchemaInput =
  z.infer<typeof updatePromotionSchema>;

export type CreatePromotionGroupSchemaInput =
  z.infer<typeof createPromotionGroupSchema>;

export type UpdatePromotionGroupSchemaInput =
  z.infer<typeof updatePromotionGroupSchema>;

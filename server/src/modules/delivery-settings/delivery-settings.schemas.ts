
import { z } from "zod";

// ============================================
// VALIDAÇÕES AUXILIARES
// ============================================

// Valores monetários são armazenados em centavos.
// Exemplo: R$ 8,00 = 800.
const moneyCentsSchema = z
  .number()
  .int("O valor deve ser um número inteiro em centavos.")
  .min(0, "O valor não pode ser negativo.")
  .max(1_000_000, "O valor informado é muito alto.");

// Telefone de contato do restaurante.
// Pode ser informado com ou sem formatação.
const contactPhoneSchema = z
  .string()
  .trim()
  .max(30, "O telefone deve ter no máximo 30 caracteres.")
  .refine(
    (value) => {
      if (value === "") return true;

      const digits = value.replace(/\D/g, "");

      return digits.length >= 10 && digits.length <= 13;
    },
    "Informe um telefone válido com DDD.",
  )
  .nullable();

// ============================================
// CONFIGURAÇÕES DE ENTREGA
// ============================================

export const updateDeliverySettingsSchema = z
  .object({
    fixedFeeCents: moneyCentsSchema.optional(),

    isEnabled: z.boolean().optional(),

    contactPhone: contactPhoneSchema.optional(),

    unavailableMessage: z
      .string()
      .trim()
      .min(5, "A mensagem deve ter pelo menos 5 caracteres.")
      .max(300, "A mensagem deve ter no máximo 300 caracteres.")
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Informe pelo menos um campo para atualizar.",
  );

// ============================================
// COORDENADAS GEOGRÁFICAS
// ============================================

// GeoJSON utiliza a ordem:
// [longitude, latitude]
//
// Atenção:
// Google Maps normalmente trabalha com:
// { lat, lng }
//
// Ao salvar no banco, converter para:
// [lng, lat]

const coordinateSchema = z.tuple([
  z.number().finite().min(-180).max(180),
  z.number().finite().min(-90).max(90),
]);

// ============================================
// VALIDAÇÃO DO PERÍMETRO
// ============================================

const polygonRingSchema = z
  .array(coordinateSchema)
  .min(
    4,
    "O perímetro precisa ter pelo menos três pontos.",
  )
  .max(
    501,
    "O perímetro excedeu o limite de pontos.",
  )
  .superRefine((points, ctx) => {
    if (points.length < 4) return;

    const first = points[0];
    const last = points[points.length - 1];

    if (!first || !last) return;

    // ========================================
    // 1. VERIFICAR FECHAMENTO DO POLÍGONO
    // ========================================

    // No GeoJSON, o último ponto precisa
    // repetir exatamente o primeiro.

    const isClosed =
      first[0] === last[0] &&
      first[1] === last[1];

    if (!isClosed) {
      ctx.addIssue({
        code: "custom",
        message:
          "O perímetro deve estar fechado: o último ponto deve repetir o primeiro.",
      });
    }

    // ========================================
    // 2. VERIFICAR VÉRTICES DIFERENTES
    // ========================================

    // Desconsideramos o último ponto,
    // pois ele repete o primeiro.

    const uniquePoints = new Set(
      points
        .slice(0, -1)
        .map(
          ([longitude, latitude]) =>
            `${longitude},${latitude}`,
        ),
    );

    if (uniquePoints.size < 3) {
      ctx.addIssue({
        code: "custom",
        message:
          "O perímetro precisa ter pelo menos três pontos diferentes.",
      });
    }
  });

// ============================================
// POLÍGONO GEOJSON
// ============================================

// Inicialmente permitiremos apenas um anel
// externo por área.
//
// Não trabalharemos com polígonos
// contendo buracos.

export const deliveryPolygonSchema = z
  .object({
    type: z.literal("Polygon"),

    coordinates: z.tuple([
      polygonRingSchema,
    ]),
  })
  .strict();

// ============================================
// CADASTRO DA ÁREA DE ENTREGA
// ============================================

export const createDeliveryZoneSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Informe o nome da área.")
      .max(
        100,
        "O nome deve ter no máximo 100 caracteres.",
      )
      .default("Zona urbana de Rebouças"),

    polygon: deliveryPolygonSchema,

    isActive: z.boolean().default(true),
  })
  .strict();

// ============================================
// ATUALIZAÇÃO DA ÁREA DE ENTREGA
// ============================================

export const updateDeliveryZoneSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Informe o nome da área.")
      .max(
        100,
        "O nome deve ter no máximo 100 caracteres.",
      )
      .optional(),

    polygon: deliveryPolygonSchema.optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Informe pelo menos um campo para atualizar.",
  );

// ============================================
// VALIDAÇÃO DE LOCALIZAÇÃO DO CLIENTE
// ============================================

// Recebe coordenadas do endereço
// selecionado pelo cliente.
//
// O backend utilizará essas coordenadas
// para verificar se estão dentro de
// alguma área de entrega ativa.

export const validateDeliveryLocationSchema = z
  .object({
    latitude: z
      .number()
      .finite()
      .min(-90)
      .max(90),

    longitude: z
      .number()
      .finite()
      .min(-180)
      .max(180),
  })
  .strict();

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export type UpdateDeliverySettingsInput = z.infer<
  typeof updateDeliverySettingsSchema
>;

export type DeliveryPolygon = z.infer<
  typeof deliveryPolygonSchema
>;

export type CreateDeliveryZoneInput = z.infer<
  typeof createDeliveryZoneSchema
>;

export type UpdateDeliveryZoneInput = z.infer<
  typeof updateDeliveryZoneSchema
>;

export type ValidateDeliveryLocationInput = z.infer<
  typeof validateDeliveryLocationSchema
>;

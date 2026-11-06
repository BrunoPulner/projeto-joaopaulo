
import { z } from "zod";

// ============================================
// VALIDAÇÃO DO ENDEREÇO
// ============================================

export const customerAddressSchema = z
  .object({
    street: z
      .string()
      .trim()
      .min(1, "Informe a rua.")
      .max(200),

    number: z
      .string()
      .trim()
      .min(1, "Informe o número.")
      .max(30),

    neighborhood: z
      .string()
      .trim()
      .min(1, "Informe o bairro.")
      .max(150),

    complement: z
      .string()
      .trim()
      .max(300)
      .default(""),

    city: z.literal("Rebouças"),

    state: z.literal("PR"),

    coordinates: z.object({
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
    }),
  })
  .strict();

// ============================================
// VALIDAÇÃO DO PERFIL
// ============================================

export const updateCustomerProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe seu nome.")
      .max(30, "O nome deve ter no máximo 30 caracteres."),

    phone: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          /^\d{11}$/.test(value.replace(/\D/g, "")),
        "Informe um celular válido com DDD.",
      )
      .transform((value) =>
        value.replace(/\D/g, ""),
      ),

    address: customerAddressSchema.nullable(),

    // URL de foto já enviada ao armazenamento.
    // Não permite imagens Base64 no banco.
    photoUrl: z
      .union([
        z.url({
          protocol: /^https?$/,
        }),
        z.literal(""),
      ])
      .nullable(),
  })
  .strict();

// ============================================
// TIPAGENS INFERIDAS DO ZOD
// ============================================

export type CustomerAddressInput = z.infer<
  typeof customerAddressSchema
>;

export type UpdateCustomerProfileInput = z.output<
  typeof updateCustomerProfileSchema
>;

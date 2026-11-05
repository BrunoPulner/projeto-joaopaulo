
import { z } from "zod";

// ============================================
// CONSTANTES DE VALIDAÇÃO
// ============================================

export const ADMIN_CUSTOMER_NAME_MAX_LENGTH = 100;

export const ADMIN_CUSTOMER_BLOCK_REASON_MAX_LENGTH = 500;

// ============================================
// VALIDAR ID DO CLIENTE
// ============================================

export const adminCustomerIdParamsSchema = z.object({
  id: z
    .string({
      error: "O ID do cliente é obrigatório.",
    })
    .trim()
    .min(1, "O ID do cliente é obrigatório."),
});

// ============================================
// ATUALIZAR NOME DO CLIENTE
// ============================================

export const updateAdminCustomerNameSchema = z.object({
  displayName: z
    .string({
      error: "O nome deve ser um texto válido.",
    })
    .trim()
    .max(
      ADMIN_CUSTOMER_NAME_MAX_LENGTH,
      `O nome deve ter no máximo ${ADMIN_CUSTOMER_NAME_MAX_LENGTH} caracteres.`,
    )
    .nullable(),
});

// ============================================
// BLOQUEAR CLIENTE
// ============================================

export const blockAdminCustomerSchema = z.object({
  reason: z
    .string({
      error: "O motivo do bloqueio deve ser um texto válido.",
    })
    .trim()
    .max(
      ADMIN_CUSTOMER_BLOCK_REASON_MAX_LENGTH,
      `O motivo deve ter no máximo ${ADMIN_CUSTOMER_BLOCK_REASON_MAX_LENGTH} caracteres.`,
    )
    .nullable()
    .optional(),
});

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export type AdminCustomerIdParams = z.infer<
  typeof adminCustomerIdParamsSchema
>;

export type UpdateAdminCustomerNameInput = z.infer<
  typeof updateAdminCustomerNameSchema
>;

export type BlockAdminCustomerInput = z.infer<
  typeof blockAdminCustomerSchema
>;

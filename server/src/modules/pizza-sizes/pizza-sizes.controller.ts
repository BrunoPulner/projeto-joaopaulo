
import type { RequestHandler } from "express";
import { z } from "zod";

import {
  PizzaSizeError,
  createPizzaSize,
  deactivatePizzaSize,
  findPizzaSizeById,
  listAdminPizzaSizes,
  listPublicPizzaSizes,
  reactivatePizzaSize,
  setPizzaSizeAvailability,
  updatePizzaSize,
} from "./pizza-sizes.service.js";

const MAX_INT = 2_147_483_647;

const idSchema = z.coerce.number().int().min(1).max(MAX_INT);

const priceSchema = z.number().int().min(1).max(MAX_INT);

const pizzaSizeBaseSchema = z.object({
  name: z.string().trim().min(2).max(100),

  slug: z.string().trim().max(100).optional(),

  description: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional(),

  imageUrl: z
    .string()
    .trim()
    .max(2048)
    .nullable()
    .optional(),

  slices: z.number().int().min(1).max(100),

  diameterCm: z
    .number()
    .int()
    .min(1)
    .max(200)
    .nullable()
    .optional(),

  basePriceCents: priceSchema,

  maxFlavors: z.number().int().min(1).max(2).optional(),

  isActive: z.boolean().optional(),

  isAvailable: z.boolean().optional(),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .max(MAX_INT)
    .optional(),
}).strict();

const pizzaSizeUpdateSchema = pizzaSizeBaseSchema.partial();

const availabilitySchema = z.object({
  isAvailable: z.boolean(),
}).strict();

function errorResponse(
  error: unknown,
  res: Parameters<RequestHandler>[1],
): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      message: "Dados inválidos.",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof PizzaSizeError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  const pgError = error as {
    code?: string;
  } | null;

  if (pgError?.code === "23505") {
    res.status(409).json({
      message: "Este tamanho de pizza já está cadastrado.",
    });
    return;
  }

  if (pgError?.code === "23503") {
    res.status(400).json({
      message: "Relacionamento inválido no banco de dados.",
    });
    return;
  }

  if (
    pgError?.code === "23514" ||
    pgError?.code === "22P02" ||
    pgError?.code === "22003"
  ) {
    res.status(400).json({
      message: "Os dados informados não são válidos para o banco.",
    });
    return;
  }

  console.error("Erro na API de tamanhos de pizza:", error);

  res.status(500).json({
    message: "Erro interno ao processar o tamanho de pizza.",
  });
}

// ============================================
// LISTAGEM PÚBLICA
// ============================================

export const listPublicPizzaSizesHandler: RequestHandler =
  async (_req, res) => {
    try {
      const sizes = await listPublicPizzaSizes();

      res.json(sizes);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// LISTAGEM ADMINISTRATIVA
// ============================================

export const listAdminPizzaSizesHandler: RequestHandler =
  async (_req, res) => {
    try {
      const sizes = await listAdminPizzaSizes();

      res.json(sizes);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// CONSULTAR TAMANHO POR ID
// ============================================

export const getAdminPizzaSizeHandler: RequestHandler =
  async (req, res) => {
    try {
      const id = idSchema.parse(req.params.id);

      const size = await findPizzaSizeById(id);

      if (!size) {
        res.status(404).json({
          message: "Tamanho de pizza não encontrado.",
        });
        return;
      }

      res.json(size);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// CADASTRAR TAMANHO
// ============================================

export const createPizzaSizeHandler: RequestHandler =
  async (req, res) => {
    try {
      const input = pizzaSizeBaseSchema.parse(req.body);

      const size = await createPizzaSize(input);

      res.status(201).json(size);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// EDITAR TAMANHO
// ============================================

export const updatePizzaSizeHandler: RequestHandler =
  async (req, res) => {
    try {
      const id = idSchema.parse(req.params.id);

      const input = pizzaSizeUpdateSchema.parse(req.body);

      if (Object.keys(input).length === 0) {
        res.status(400).json({
          message: "Informe ao menos um campo para atualizar.",
        });
        return;
      }

      const size = await updatePizzaSize(id, input);

      res.json(size);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// DESATIVAR TAMANHO
// ============================================

export const deactivatePizzaSizeHandler: RequestHandler =
  async (req, res) => {
    try {
      const id = idSchema.parse(req.params.id);

      const size = await deactivatePizzaSize(id);

      res.json(size);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// REATIVAR TAMANHO
// ============================================

export const reactivatePizzaSizeHandler: RequestHandler =
  async (req, res) => {
    try {
      const id = idSchema.parse(req.params.id);

      const size = await reactivatePizzaSize(id);

      res.json(size);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// ALTERAR DISPONIBILIDADE
// ============================================

export const setPizzaSizeAvailabilityHandler: RequestHandler =
  async (req, res) => {
    try {
      const id = idSchema.parse(req.params.id);

      const input = availabilitySchema.parse(req.body);

      const size = await setPizzaSizeAvailability(
        id,
        input.isAvailable,
      );

      res.json(size);
    } catch (error) {
      errorResponse(error, res);
    }
  };

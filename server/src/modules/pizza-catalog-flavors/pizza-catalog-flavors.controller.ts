
import type { RequestHandler } from "express";
import { z } from "zod";

import {
  PizzaCatalogFlavorError,
  createCatalogPizzaFlavor,
  deactivateCatalogPizzaFlavor,
  findCatalogPizzaFlavorById,
  listAdminCatalogPizzaFlavors,
  listPublicCatalogPizzaFlavors,
  reactivateCatalogPizzaFlavor,
  updateCatalogPizzaFlavor,
} from "./pizza-catalog-flavors.service.js";

// ============================================
// CONFIGURAÇÕES E VALIDAÇÕES
// ============================================

const MAX_INT = 2_147_483_647;

const idSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_INT);

const priceSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_INT);

const sortOrderSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_INT);

const sizeIdsSchema = z
  .array(idSchema)
  .max(100)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Não informe tamanhos duplicados.",
  );

// ============================================
// SCHEMA DE CADASTRO
// ============================================

const catalogFlavorBaseSchema = z
  .object({
    subcategoryId: idSchema,

    name: z
      .string()
      .trim()
      .min(2)
      .max(150),

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

    additionalPriceCents: priceSchema,

    isPremium: z.boolean().optional(),

    premiumAdditionalCents: priceSchema.optional(),

    allSizes: z.boolean().optional(),

    sizeIds: sizeIdsSchema.optional(),

    isActive: z.boolean().optional(),

    sortOrder: sortOrderSchema.optional(),
  })
  .strict();

// ============================================
// VALIDAÇÃO COMBINADA DO CADASTRO
// ============================================

const catalogFlavorCreateSchema =
  catalogFlavorBaseSchema.superRefine(
    (data, context) => {
      const allSizes = data.allSizes ?? true;
      const sizeIds = data.sizeIds ?? [];

      if (!allSizes && sizeIds.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["sizeIds"],
          message:
            "Selecione ao menos um tamanho quando allSizes for false.",
        });
      }

      if (allSizes && sizeIds.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["sizeIds"],
          message:
            "Não informe sizeIds quando allSizes for true.",
        });
      }

      if (
        data.isPremium !== true &&
        (data.premiumAdditionalCents ?? 0) > 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["premiumAdditionalCents"],
          message:
            "O acréscimo nobre exige isPremium: true.",
        });
      }
    },
  );

// ============================================
// SCHEMA DE EDIÇÃO
// ============================================

// A edição utiliza partial(), permitindo atualizar
// apenas os campos enviados.
//
// Validações que dependem do estado atual do sabor
// continuam sendo feitas pelo service.
const catalogFlavorUpdateSchema =
  catalogFlavorBaseSchema.partial();

// ============================================
// FILTROS DA LISTAGEM PÚBLICA
// ============================================

const publicQuerySchema = z
  .object({
    subcategoryId: idSchema.optional(),
    sizeId: idSchema.optional(),
  })
  .strict();

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function errorResponse(
  error: unknown,
  res: Parameters<RequestHandler>[1],
): void {
  // Erros de validação Zod
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

  // Erros de negócio do service
  if (error instanceof PizzaCatalogFlavorError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  // Erros PostgreSQL
  const pgError = error as {
    code?: string;
    constraint?: string;
  } | null;

  if (pgError?.code === "23505") {
    res.status(409).json({
      message:
        "Já existe um sabor com esse nome nessa subcategoria.",
    });
    return;
  }

  if (pgError?.code === "23503") {
    res.status(400).json({
      message:
        "Subcategoria ou tamanho relacionado não encontrado.",
    });
    return;
  }

  if (
    pgError?.code === "23514" ||
    pgError?.code === "22P02" ||
    pgError?.code === "22003"
  ) {
    res.status(400).json({
      message:
        "Os dados informados não são válidos para o banco.",
    });
    return;
  }

  console.error(
    "Erro na API do catálogo de sabores de pizza:",
    error,
  );

  res.status(500).json({
    message:
      "Erro interno ao processar o sabor de pizza.",
  });
}

// ============================================
// LISTAGEM PÚBLICA
// ============================================

// GET /api/pizza-catalog-flavors
//
// Filtros opcionais:
// ?subcategoryId=5
// ?subcategoryId=6
// ?sizeId=1
// ?subcategoryId=5&sizeId=1

export const listPublicCatalogPizzaFlavorsHandler:
  RequestHandler = async (req, res) => {
    try {
      const filters = publicQuerySchema.parse(
        req.query,
      );

      const flavors =
        await listPublicCatalogPizzaFlavors(
          filters,
        );

      res.json(flavors);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// LISTAGEM ADMINISTRATIVA
// ============================================

// GET /api/pizza-catalog-flavors/admin

export const listAdminCatalogPizzaFlavorsHandler:
  RequestHandler = async (_req, res) => {
    try {
      const flavors =
        await listAdminCatalogPizzaFlavors();

      res.json(flavors);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// CONSULTAR SABOR POR ID
// ============================================

// GET /api/pizza-catalog-flavors/admin/:id

export const getAdminCatalogPizzaFlavorHandler:
  RequestHandler = async (req, res) => {
    try {
      const id = idSchema.parse(
        req.params.id,
      );

      const flavor =
        await findCatalogPizzaFlavorById(id);

      if (!flavor) {
        res.status(404).json({
          message: "Sabor de pizza não encontrado.",
        });
        return;
      }

      res.json(flavor);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// CADASTRAR SABOR
// ============================================

// POST /api/pizza-catalog-flavors/admin

export const createCatalogPizzaFlavorHandler:
  RequestHandler = async (req, res) => {
    try {
      const input =
        catalogFlavorCreateSchema.parse(
          req.body,
        );

      const flavor =
        await createCatalogPizzaFlavor(
          input,
        );

      res.status(201).json(flavor);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// EDITAR SABOR
// ============================================

// PATCH /api/pizza-catalog-flavors/admin/:id

export const updateCatalogPizzaFlavorHandler:
  RequestHandler = async (req, res) => {
    try {
      const id = idSchema.parse(
        req.params.id,
      );

      const input =
        catalogFlavorUpdateSchema.parse(
          req.body,
        );

      if (Object.keys(input).length === 0) {
        res.status(400).json({
          message:
            "Informe ao menos um campo para atualizar.",
        });
        return;
      }

      const flavor =
        await updateCatalogPizzaFlavor(
          id,
          input,
        );

      res.json(flavor);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// DESATIVAR SABOR
// ============================================

// DELETE /api/pizza-catalog-flavors/admin/:id

export const deactivateCatalogPizzaFlavorHandler:
  RequestHandler = async (req, res) => {
    try {
      const id = idSchema.parse(
        req.params.id,
      );

      const flavor =
        await deactivateCatalogPizzaFlavor(
          id,
        );

      res.json(flavor);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// REATIVAR SABOR
// ============================================

// PATCH /api/pizza-catalog-flavors/admin/:id/reactivate

export const reactivateCatalogPizzaFlavorHandler:
  RequestHandler = async (req, res) => {
    try {
      const id = idSchema.parse(
        req.params.id,
      );

      const flavor =
        await reactivateCatalogPizzaFlavor(
          id,
        );

      res.json(flavor);
    } catch (error) {
      errorResponse(error, res);
    }
  };

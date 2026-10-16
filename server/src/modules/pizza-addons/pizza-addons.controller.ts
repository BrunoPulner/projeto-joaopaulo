
import type { RequestHandler } from "express";
import { z } from "zod";

import {
  PizzaAddonError,
  linkFlavorPizzaAddonsBulk,
  linkSubcategoryPizzaAddonsBulk,
  listFlavorPizzaAddons,
  listSubcategoryPizzaAddons,
  unlinkFlavorPizzaAddon,
  unlinkSubcategoryPizzaAddon,
} from "./pizza-addons.service.js";

// ============================================
// CONFIGURAÇÕES
// ============================================

const MAX_INT = 2_147_483_647;

// ============================================
// VALIDAÇÕES
// ============================================

const idSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_INT);

const idsSchema = z
  .array(z.number().int().min(1).max(MAX_INT))
  .min(1)
  .max(100)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    {
      message: "Não informe IDs duplicados.",
    },
  );

const sortOrderSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_INT);

// ============================================
// SCHEMA - VÍNCULO POR SUBCATEGORIA
// ============================================

const subcategoryBulkSchema = z
  .object({
    subcategoryIds: idsSchema,
    addonIds: idsSchema,
    sortOrder: sortOrderSchema.optional(),
  })
  .strict();

// ============================================
// SCHEMA - VÍNCULO POR SABOR
// ============================================

const flavorBulkSchema = z
  .object({
    flavorIds: idsSchema,
    addonIds: idsSchema,
    sortOrder: sortOrderSchema.optional(),
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

  // Erros de negócio
  if (error instanceof PizzaAddonError) {
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
      message: "Este vínculo já está cadastrado.",
    });
    return;
  }

  if (pgError?.code === "23503") {
    res.status(400).json({
      message:
        "Adicional, sabor ou subcategoria não encontrado.",
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
    "Erro na API de adicionais de pizza:",
    error,
  );

  res.status(500).json({
    message:
      "Erro interno ao processar os adicionais de pizza.",
  });
}

// ============================================
// LISTAR ADICIONAIS POR SUBCATEGORIA
// ============================================

// GET /api/pizza-addons/subcategory/:subcategoryId
//
// Público: retorna somente adicionais ativos.

export const listPublicSubcategoryPizzaAddonsHandler:
  RequestHandler = async (req, res) => {
    try {
      const subcategoryId = idSchema.parse(
        req.params.subcategoryId,
      );

      const addons = await listSubcategoryPizzaAddons(
        subcategoryId,
        false,
      );

      res.json(addons);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// LISTAR ADICIONAIS POR SABOR
// ============================================

// GET /api/pizza-addons/flavor/:flavorId
//
// Público: retorna somente adicionais ativos.

export const listPublicFlavorPizzaAddonsHandler:
  RequestHandler = async (req, res) => {
    try {
      const flavorId = idSchema.parse(
        req.params.flavorId,
      );

      const addons = await listFlavorPizzaAddons(
        flavorId,
        false,
      );

      res.json(addons);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// LISTAGEM ADMIN - SUBCATEGORIA
// ============================================

// GET /api/pizza-addons/admin/subcategory/:subcategoryId
//
// Inclui vínculos e adicionais desativados.

export const listAdminSubcategoryPizzaAddonsHandler:
  RequestHandler = async (req, res) => {
    try {
      const subcategoryId = idSchema.parse(
        req.params.subcategoryId,
      );

      const addons = await listSubcategoryPizzaAddons(
        subcategoryId,
        true,
      );

      res.json(addons);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// LISTAGEM ADMIN - SABOR
// ============================================

// GET /api/pizza-addons/admin/flavor/:flavorId
//
// Inclui vínculos e adicionais desativados.

export const listAdminFlavorPizzaAddonsHandler:
  RequestHandler = async (req, res) => {
    try {
      const flavorId = idSchema.parse(
        req.params.flavorId,
      );

      const addons = await listFlavorPizzaAddons(
        flavorId,
        true,
      );

      res.json(addons);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// VINCULAR ADICIONAIS A SUBCATEGORIAS
// ============================================

// POST /api/pizza-addons/admin/subcategories/bulk

export const linkSubcategoryPizzaAddonsBulkHandler:
  RequestHandler = async (req, res) => {
    try {
      const input = subcategoryBulkSchema.parse(
        req.body,
      );

      const result =
        await linkSubcategoryPizzaAddonsBulk(
          input,
        );

      res.json(result);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// VINCULAR ADICIONAIS A SABORES
// ============================================

// POST /api/pizza-addons/admin/flavors/bulk

export const linkFlavorPizzaAddonsBulkHandler:
  RequestHandler = async (req, res) => {
    try {
      const input = flavorBulkSchema.parse(
        req.body,
      );

      const result =
        await linkFlavorPizzaAddonsBulk(
          input,
        );

      res.json(result);
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// DESVINCULAR ADICIONAL DE SUBCATEGORIA
// ============================================

// DELETE /api/pizza-addons/admin/subcategory/:subcategoryId/addons/:addonId

export const unlinkSubcategoryPizzaAddonHandler:
  RequestHandler = async (req, res) => {
    try {
      const subcategoryId = idSchema.parse(
        req.params.subcategoryId,
      );

      const addonId = idSchema.parse(
        req.params.addonId,
      );

      const unlinked =
        await unlinkSubcategoryPizzaAddon(
          subcategoryId,
          addonId,
        );

      if (!unlinked) {
        res.status(404).json({
          message:
            "Vínculo ativo não encontrado.",
        });
        return;
      }

      res.json({
        message:
          "Adicional desvinculado da subcategoria.",
      });
    } catch (error) {
      errorResponse(error, res);
    }
  };

// ============================================
// DESVINCULAR ADICIONAL DE SABOR
// ============================================

// DELETE /api/pizza-addons/admin/flavor/:flavorId/addons/:addonId

export const unlinkFlavorPizzaAddonHandler:
  RequestHandler = async (req, res) => {
    try {
      const flavorId = idSchema.parse(
        req.params.flavorId,
      );

      const addonId = idSchema.parse(
        req.params.addonId,
      );

      const unlinked =
        await unlinkFlavorPizzaAddon(
          flavorId,
          addonId,
        );

      if (!unlinked) {
        res.status(404).json({
          message:
            "Vínculo ativo não encontrado.",
        });
        return;
      }

      res.json({
        message:
          "Adicional desvinculado do sabor.",
      });
    } catch (error) {
      errorResponse(error, res);
    }
  };

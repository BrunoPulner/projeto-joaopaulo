
import type { RequestHandler } from "express";
import { z } from "zod";

import {
  ProductAddonValidationError,
  disableProductAddon,
  editProductAddon,
  findProductAddonById,
  findProductAddons,
  insertProductAddon,
} from "./product-addon.service.js";

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const idSchema = z.number().int().positive().max(2147483647);

const createProductAddonSchema = z.object({
  productId: idSchema,

  addonId: idSchema,

  isActive: z.boolean().optional(),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .max(2147483647)
    .optional(),
});

const updateProductAddonSchema = z.object({
  isActive: z.boolean().optional(),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .max(2147483647)
    .optional(),
});

// ============================================
// VALIDAR IDs DAS ROTAS
// ============================================

function parseId(
  value: string | string[] | undefined,
): number | null {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const id = Number(value);

  if (
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return null;
  }

  return id;
}

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function handleError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof ProductAddonValidationError) {
    return {
      status: 400,
      message: error.message,
    };
  }

  const dbError = error as {
    code?: string;
    constraint?: string;
  } | null;

  if (dbError?.code === "23505") {
    return {
      status: 409,
      message:
        "Este adicional já está vinculado ao produto.",
    };
  }

  if (dbError?.code === "23503") {
    return {
      status: 400,
      message:
        "Produto ou adicional inválido para este vínculo.",
    };
  }

  if (dbError?.code === "23514") {
    return {
      status: 400,
      message:
        "Os dados não atendem às regras do banco de dados.",
    };
  }

  console.error(
    "Erro na API de adicionais por produto:",
    error,
  );

  return {
    status: 500,
    message:
      "Erro interno ao processar adicional do produto.",
  };
}

// ============================================
// LISTAR ADICIONAIS PÚBLICOS DE UM PRODUTO
// GET /api/products/:productId/addons
// ============================================

export const listProductAddons: RequestHandler = async (
  req,
  res,
) => {
  const productId = parseId(req.params.productId);

  if (productId === null) {
    res.status(400).json({
      message: "ID do produto inválido.",
    });
    return;
  }

  try {
    const addons = await findProductAddons(
      productId,
      false,
    );

    res.status(200).json(addons);
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// LISTAR ADICIONAIS DO PRODUTO NO ADMIN
// GET /api/admin/product-addons/product/:productId
// ============================================

export const listAdminProductAddons: RequestHandler =
  async (req, res) => {
    const productId = parseId(req.params.productId);

    if (productId === null) {
      res.status(400).json({
        message: "ID do produto inválido.",
      });
      return;
    }

    try {
      const addons = await findProductAddons(
        productId,
        true,
      );

      res.status(200).json(addons);
    } catch (error) {
      const result = handleError(error);

      res.status(result.status).json({
        message: result.message,
      });
    }
  };

// ============================================
// CONSULTAR VÍNCULO POR ID (ADMIN)
// GET /api/admin/product-addons/:id
// ============================================

export const getProductAddonById: RequestHandler =
  async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
      res.status(400).json({
        message: "ID do vínculo inválido.",
      });
      return;
    }

    try {
      const productAddon =
        await findProductAddonById(id);

      if (!productAddon) {
        res.status(404).json({
          message: "Vínculo não encontrado.",
        });
        return;
      }

      res.status(200).json(productAddon);
    } catch (error) {
      const result = handleError(error);

      res.status(result.status).json({
        message: result.message,
      });
    }
  };

// ============================================
// VINCULAR ADICIONAL AO PRODUTO (ADMIN)
// POST /api/admin/product-addons
// ============================================

export const createProductAddon: RequestHandler =
  async (req, res) => {
    const parsed = createProductAddonSchema.safeParse(
      req.body,
    );

    if (!parsed.success) {
      res.status(400).json({
        message:
          "Dados inválidos para vincular adicional ao produto.",
        errors: z.flattenError(parsed.error),
      });
      return;
    }

    try {
      const productAddon = await insertProductAddon(
        parsed.data,
      );

      res.status(201).json({
        message:
          "Adicional vinculado ao produto com sucesso.",
        productAddon,
      });
    } catch (error) {
      const result = handleError(error);

      res.status(result.status).json({
        message: result.message,
      });
    }
  };

// ============================================
// ATUALIZAR VÍNCULO (ADMIN)
// PATCH /api/admin/product-addons/:id
// ============================================

export const updateProductAddon: RequestHandler =
  async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
      res.status(400).json({
        message: "ID do vínculo inválido.",
      });
      return;
    }

    const parsed = updateProductAddonSchema.safeParse(
      req.body,
    );

    if (!parsed.success) {
      res.status(400).json({
        message:
          "Dados inválidos para atualizar o vínculo.",
        errors: z.flattenError(parsed.error),
      });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({
        message:
          "Informe pelo menos um campo para atualizar.",
      });
      return;
    }

    try {
      const productAddon = await editProductAddon(
        id,
        parsed.data,
      );

      if (!productAddon) {
        res.status(404).json({
          message: "Vínculo não encontrado.",
        });
        return;
      }

      res.status(200).json({
        message: "Vínculo atualizado com sucesso.",
        productAddon,
      });
    } catch (error) {
      const result = handleError(error);

      res.status(result.status).json({
        message: result.message,
      });
    }
  };

// ============================================
// DESATIVAR VÍNCULO (ADMIN)
// DELETE /api/admin/product-addons/:id
// ============================================

export const deactivateProductAddon: RequestHandler =
  async (req, res) => {
    const id = parseId(req.params.id);

    if (id === null) {
      res.status(400).json({
        message: "ID do vínculo inválido.",
      });
      return;
    }

    try {
      const productAddon = await disableProductAddon(
        id,
      );

      if (!productAddon) {
        res.status(404).json({
          message: "Vínculo não encontrado.",
        });
        return;
      }

      res.status(200).json({
        message:
          "Adicional desvinculado do produto com sucesso.",
        productAddon,
      });
    } catch (error) {
      const result = handleError(error);

      res.status(result.status).json({
        message: result.message,
      });
    }
  };

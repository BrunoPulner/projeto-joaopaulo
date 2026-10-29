
import type { Request, Response } from "express";
import { z } from "zod";

import {
  productExists,
  listProductIngredients,
  createProductIngredient,
  updateProductIngredient,
  deleteProductIngredient,
} from "./product-ingredients.service.js";

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

// ID recebido pela URL
const idSchema = z.coerce.number().int().positive();

// Cadastro de ingrediente
const createIngredientSchema = z.object({
  name: z.string().trim().min(1).max(120),

  isRemovable: z.boolean().optional(),

  sortOrder: z.number().int().min(0).optional(),
}).strict();

// Atualização de ingrediente
const updateIngredientSchema =
  createIngredientSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Informe ao menos um campo para atualizar.",
    },
  );

// ============================================
// LISTAR INGREDIENTES DO PRODUTO
// GET /api/products/:id/ingredients
// ============================================

export async function getProductIngredients(
  req: Request,
  res: Response,
): Promise<void> {
  const parsedId = idSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    res.status(400).json({
      error: "ID do produto inválido.",
    });
    return;
  }

  try {
    const productId = parsedId.data;

    const exists = await productExists(productId);

    if (!exists) {
      res.status(404).json({
        error: "Produto não encontrado.",
      });
      return;
    }

    const ingredients =
      await listProductIngredients(productId);

    res.status(200).json(ingredients);
  } catch (error) {
    console.error(
      "[PRODUCT INGREDIENTS] Erro ao listar:",
      error,
    );

    res.status(500).json({
      error: "Erro ao buscar ingredientes.",
    });
  }
}

// ============================================
// CADASTRAR INGREDIENTE
// POST /api/products/:id/ingredients
// ============================================

export async function postProductIngredient(
  req: Request,
  res: Response,
): Promise<void> {
  const parsedId = idSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    res.status(400).json({
      error: "ID do produto inválido.",
    });
    return;
  }

  const parsedBody =
    createIngredientSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      error: "Dados do ingrediente inválidos.",
      details: z.flattenError(parsedBody.error),
    });
    return;
  }

  try {
    const ingredient =
      await createProductIngredient({
        productId: parsedId.data,
        ...parsedBody.data,
      });

    res.status(201).json(ingredient);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Produto não encontrado."
    ) {
      res.status(404).json({
        error: error.message,
      });
      return;
    }

    console.error(
      "[PRODUCT INGREDIENTS] Erro ao cadastrar:",
      error,
    );

    res.status(500).json({
      error: "Erro ao cadastrar ingrediente.",
    });
  }
}

// ============================================
// ATUALIZAR INGREDIENTE
// PATCH /api/product-ingredients/:id
// ============================================

export async function patchProductIngredient(
  req: Request,
  res: Response,
): Promise<void> {
  const parsedId = idSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    res.status(400).json({
      error: "ID do ingrediente inválido.",
    });
    return;
  }

  const parsedBody =
    updateIngredientSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      error: "Dados de atualização inválidos.",
      details: z.flattenError(parsedBody.error),
    });
    return;
  }

  try {
    const ingredient =
      await updateProductIngredient(
        parsedId.data,
        parsedBody.data,
      );

    if (!ingredient) {
      res.status(404).json({
        error: "Ingrediente não encontrado.",
      });
      return;
    }

    res.status(200).json(ingredient);
  } catch (error) {
    console.error(
      "[PRODUCT INGREDIENTS] Erro ao atualizar:",
      error,
    );

    res.status(500).json({
      error: "Erro ao atualizar ingrediente.",
    });
  }
}

// ============================================
// EXCLUIR INGREDIENTE
// DELETE /api/product-ingredients/:id
// ============================================

export async function removeProductIngredient(
  req: Request,
  res: Response,
): Promise<void> {
  const parsedId = idSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    res.status(400).json({
      error: "ID do ingrediente inválido.",
    });
    return;
  }

  try {
    const deleted =
      await deleteProductIngredient(parsedId.data);

    if (!deleted) {
      res.status(404).json({
        error: "Ingrediente não encontrado.",
      });
      return;
    }

    res.status(200).json({
      message: "Ingrediente excluído com sucesso.",
    });
  } catch (error) {
    console.error(
      "[PRODUCT INGREDIENTS] Erro ao excluir:",
      error,
    );

    res.status(500).json({
      error: "Erro ao excluir ingrediente.",
    });
  }
}

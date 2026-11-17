
import type { Request, Response } from "express";

import {
  pizzaFlavorExists,
  listPizzaFlavorIngredients,
  createPizzaFlavorIngredient,
  updatePizzaFlavorIngredient,
  deletePizzaFlavorIngredient,
  type PizzaFlavorIngredientInput,
  type PizzaFlavorIngredientUpdateInput,
} from "./pizza-flavor-ingredients.service.js";

// ============================================
// VALIDAÇÕES AUXILIARES
// ============================================

const MAX_ID = 2147483647;

function parseId(value: unknown): number | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  if (
    !Number.isSafeInteger(id) ||
    id > MAX_ID
  ) {
    return null;
  }

  return id;
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateIngredientBody(
  body: unknown,
  partial = false,
):
  | {
      success: true;
      data: PizzaFlavorIngredientUpdateInput;
    }
  | {
      success: false;
      message: string;
    } {
  if (!isObject(body)) {
    return {
      success: false,
      message: "Informe os dados do ingrediente.",
    };
  }

  const allowedFields = [
    "name",
    "isRemovable",
    "sortOrder",
  ];

  const keys = Object.keys(body);

  if (
    keys.some(
      (key) => !allowedFields.includes(key),
    )
  ) {
    return {
      success: false,
      message: "Existem campos não permitidos.",
    };
  }

  if (partial && keys.length === 0) {
    return {
      success: false,
      message: "Informe ao menos um campo.",
    };
  }

  const data: PizzaFlavorIngredientUpdateInput = {};

  // ==========================================
  // NOME
  // ==========================================

  if (body.name !== undefined) {
    if (typeof body.name !== "string") {
      return {
        success: false,
        message: "O nome deve ser um texto.",
      };
    }

    const name = body.name.trim();

    if (!name || name.length > 120) {
      return {
        success: false,
        message:
          "O nome deve conter entre 1 e 120 caracteres.",
      };
    }

    data.name = name;
  } else if (!partial) {
    return {
      success: false,
      message: "Informe o nome do ingrediente.",
    };
  }

  // ==========================================
  // PERMISSÃO DE REMOÇÃO
  // ==========================================

  if (body.isRemovable !== undefined) {
    if (typeof body.isRemovable !== "boolean") {
      return {
        success: false,
        message:
          "isRemovable deve ser verdadeiro ou falso.",
      };
    }

    data.isRemovable = body.isRemovable;
  }

  // ==========================================
  // ORDEM
  // ==========================================

  if (body.sortOrder !== undefined) {
    if (
      typeof body.sortOrder !== "number" ||
      !Number.isInteger(body.sortOrder) ||
      body.sortOrder < 0 ||
      body.sortOrder > MAX_ID
    ) {
      return {
        success: false,
        message:
          "sortOrder deve ser um inteiro não negativo válido.",
      };
    }

    data.sortOrder = body.sortOrder;
  }

  return {
    success: true,
    data,
  };
}

// ============================================
// LISTAR INGREDIENTES DO SABOR
// GET /api/pizza-catalog-flavors/:id/ingredients
// ============================================

export async function getPizzaFlavorIngredients(
  req: Request,
  res: Response,
): Promise<void> {
  const pizzaFlavorId = parseId(req.params.id);

  if (pizzaFlavorId === null) {
    res.status(400).json({
      message: "Identificador do sabor inválido.",
    });
    return;
  }

  try {
    const exists = await pizzaFlavorExists(
      pizzaFlavorId,
    );

    if (!exists) {
      res.status(404).json({
        message: "Sabor de pizza não encontrado.",
      });
      return;
    }

    const ingredients =
      await listPizzaFlavorIngredients(
        pizzaFlavorId,
      );

    res.status(200).json(ingredients);
  } catch (error) {
    console.error(
      "[PizzaFlavorIngredients] Erro ao listar:",
      error,
    );

    res.status(500).json({
      message:
        "Não foi possível carregar os ingredientes do sabor.",
    });
  }
}

// ============================================
// CADASTRAR INGREDIENTE
// POST /api/pizza-catalog-flavors/:id/ingredients
// ============================================

export async function postPizzaFlavorIngredient(
  req: Request,
  res: Response,
): Promise<void> {
  const pizzaFlavorId = parseId(req.params.id);

  if (pizzaFlavorId === null) {
    res.status(400).json({
      message: "Identificador do sabor inválido.",
    });
    return;
  }

  const validation = validateIngredientBody(
    req.body,
  );

  if (!validation.success) {
    res.status(400).json({
      message: validation.message,
    });
    return;
  }

  try {
    const input: PizzaFlavorIngredientInput = {
      pizzaFlavorId,
      name: validation.data.name!,
      isRemovable:
        validation.data.isRemovable ?? true,
      sortOrder: validation.data.sortOrder ?? 0,
    };

    const ingredient =
      await createPizzaFlavorIngredient(input);

    res.status(201).json(ingredient);
  } catch (error) {
    console.error(
      "[PizzaFlavorIngredients] Erro ao cadastrar:",
      error,
    );

    if (
      error instanceof Error &&
      error.message.includes("não existe")
    ) {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      message:
        "Não foi possível cadastrar o ingrediente.",
    });
  }
}

// ============================================
// ATUALIZAR INGREDIENTE
// PATCH /api/pizza-flavor-ingredients/:id
// ============================================

export async function patchPizzaFlavorIngredient(
  req: Request,
  res: Response,
): Promise<void> {
  const ingredientId = parseId(req.params.id);

  if (ingredientId === null) {
    res.status(400).json({
      message:
        "Identificador do ingrediente inválido.",
    });
    return;
  }

  const validation = validateIngredientBody(
    req.body,
    true,
  );

  if (!validation.success) {
    res.status(400).json({
      message: validation.message,
    });
    return;
  }

  try {
    const ingredient =
      await updatePizzaFlavorIngredient(
        ingredientId,
        validation.data,
      );

    if (!ingredient) {
      res.status(404).json({
        message: "Ingrediente não encontrado.",
      });
      return;
    }

    res.status(200).json(ingredient);
  } catch (error) {
    console.error(
      "[PizzaFlavorIngredients] Erro ao atualizar:",
      error,
    );

    res.status(500).json({
      message:
        "Não foi possível atualizar o ingrediente.",
    });
  }
}

// ============================================
// EXCLUIR INGREDIENTE
// DELETE /api/pizza-flavor-ingredients/:id
// ============================================

export async function removePizzaFlavorIngredient(
  req: Request,
  res: Response,
): Promise<void> {
  const ingredientId = parseId(req.params.id);

  if (ingredientId === null) {
    res.status(400).json({
      message:
        "Identificador do ingrediente inválido.",
    });
    return;
  }

  try {
    const deleted =
      await deletePizzaFlavorIngredient(
        ingredientId,
      );

    if (!deleted) {
      res.status(404).json({
        message: "Ingrediente não encontrado.",
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error(
      "[PizzaFlavorIngredients] Erro ao excluir:",
      error,
    );

    res.status(500).json({
      message:
        "Não foi possível excluir o ingrediente.",
    });
  }
}

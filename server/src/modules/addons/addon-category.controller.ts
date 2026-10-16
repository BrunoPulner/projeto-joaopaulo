
import type { RequestHandler } from "express";
import { z } from "zod";

import { AddonSubcategoryError } from "./addon-subcategory.service.js";

import {
  findAddonCategoryLinks,
  replaceAddonCategoryLinks,
} from "./addon-category.service.js";

// Validação do ID do adicional
const idSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(2147483647);

// Validação das categorias enviadas pelo frontend
const updateLinksSchema = z.object({
  categoryIds: z.array(
    z.number().int().positive().max(2147483647),
  ),
});

// Tratamento centralizado dos erros
function handleError(
  error: unknown,
  res: Parameters<RequestHandler>[1],
) {
  if (error instanceof AddonSubcategoryError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  console.error(
    "Erro ao gerenciar categorias do adicional:",
    error,
  );

  res.status(500).json({
    message: "Erro interno ao gerenciar categorias.",
  });
}

// GET /api/addons/admin/:id/categories
// Retorna todas as associações de categoria do adicional.
export const getAddonCategories: RequestHandler = async (
  req,
  res,
) => {
  const parsedId = idSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    res.status(400).json({
      message: "ID do adicional inválido.",
    });
    return;
  }

  try {
    const links = await findAddonCategoryLinks(
      parsedId.data,
    );

    res.status(200).json({
      links,
    });
  } catch (error) {
    handleError(error, res);
  }
};

// PUT /api/addons/admin/:id/categories
// Substitui os vínculos editáveis por categoria inteira.
export const putAddonCategories: RequestHandler = async (
  req,
  res,
) => {
  const parsedId = idSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    res.status(400).json({
      message: "ID do adicional inválido.",
    });
    return;
  }

  const parsedBody = updateLinksSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      message: "Lista de categorias inválida.",
      errors: z.flattenError(parsedBody.error),
    });
    return;
  }

  try {
    const links = await replaceAddonCategoryLinks(
      parsedId.data,
      parsedBody.data.categoryIds,
    );

    res.status(200).json({
      message: "Categorias vinculadas com sucesso.",
      links,
    });
  } catch (error) {
    handleError(error, res);
  }
};

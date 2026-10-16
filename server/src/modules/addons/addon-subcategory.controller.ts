
import type { RequestHandler } from "express";
import { z } from "zod";

import {
  AddonSubcategoryError,
  findAddonSubcategoryLinks,
  replaceAddonSubcategoryLinks,
} from "./addon-subcategory.service.js";

const idSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(2147483647);

const updateLinksSchema = z.object({
  subcategoryIds: z.array(
    z.number().int().positive().max(2147483647),
  ),
});

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
    "Erro ao gerenciar subcategorias do adicional:",
    error,
  );

  res.status(500).json({
    message: "Erro interno ao gerenciar subcategorias.",
  });
}

// GET /api/addons/admin/:id/subcategories
export const getAddonSubcategories: RequestHandler = async (
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
    const links = await findAddonSubcategoryLinks(
      parsedId.data,
    );

    res.status(200).json({ links });
  } catch (error) {
    handleError(error, res);
  }
};

// PUT /api/addons/admin/:id/subcategories
export const putAddonSubcategories: RequestHandler = async (
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
      message: "Lista de subcategorias inválida.",
      errors: z.flattenError(parsedBody.error),
    });
    return;
  }

  try {
    const links = await replaceAddonSubcategoryLinks(
      parsedId.data,
      parsedBody.data.subcategoryIds,
    );

    res.status(200).json({
      message: "Subcategorias atualizadas com sucesso.",
      links,
    });
  } catch (error) {
    handleError(error, res);
  }
};

// Alias para compatibilidade com possíveis imports existentes.
export const updateAddonSubcategories =
  putAddonSubcategories;

export const saveAddonSubcategories =
  putAddonSubcategories;

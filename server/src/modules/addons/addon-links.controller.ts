
import type { RequestHandler } from "express";
import { z } from "zod";

import { AddonSubcategoryError } from "./addon-subcategory.service.js";

import { replaceAddonLinks } from "./addon-links.service.js";

// ============================================
// VALIDAÇÕES
// ============================================

const idSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(2147483647);

const updateLinksSchema = z.object({
  categoryIds: z.array(
    z.number().int().positive().max(2147483647),
  ),

  subcategoryIds: z.array(
    z.number().int().positive().max(2147483647),
  ),
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

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
    "Erro ao salvar vínculos do adicional:",
    error,
  );

  res.status(500).json({
    message: "Erro interno ao salvar vínculos do adicional.",
  });
}

// ============================================
// SALVAR VÍNCULOS UNIFICADOS
// ============================================

// PUT /api/addons/admin/:id/links
export const putAddonLinks: RequestHandler = async (
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
      message: "Dados de vinculação inválidos.",
      errors: z.flattenError(parsedBody.error),
    });
    return;
  }

  try {
    const result = await replaceAddonLinks(
      parsedId.data,
      {
        categoryIds: parsedBody.data.categoryIds,
        subcategoryIds: parsedBody.data.subcategoryIds,
      },
    );

    res.status(200).json({
      message: "Vínculos atualizados com sucesso.",
      ...result,
    });
  } catch (error) {
    handleError(error, res);
  }
};

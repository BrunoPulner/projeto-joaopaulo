
import type { RequestHandler } from "express";
import { z } from "zod";

import {
  disableSubcategory,
  editSubcategory,
  findAllSubcategories,
  insertSubcategory,
} from "./subcategories.service.js";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug inválido.",
  );

const createSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(2).max(100),
  slug: slugSchema.optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = createSchema
  .omit({ categoryId: true })
  .partial();

function generateSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseId(value: string | string[] | undefined) {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id <= 2147483647
    ? id
    : null;
}

function handleError(error: unknown) {
  const databaseError = error as {
    code?: string;
    constraint?: string;
  };

  if (databaseError.code === "23505") {
    return {
      status: 409,
      message:
        "Essa subcategoria já existe nesta categoria.",
    };
  }

  if (databaseError.code === "23503") {
    return {
      status: 400,
      message: "Categoria principal não encontrada.",
    };
  }

  console.error("Erro na API de subcategorias:", error);

  return {
    status: 500,
    message: "Erro interno ao processar a subcategoria.",
  };
}

// LISTAGEM PÚBLICA
export const listSubcategories: RequestHandler = async (
  req,
  res,
) => {
  try {
    const categoryIdParam = req.query.categoryId;

    const categoryId =
      typeof categoryIdParam === "string"
        ? parseId(categoryIdParam)
        : undefined;

    if (
      categoryIdParam !== undefined &&
      (categoryId === null || categoryId === undefined)
    ) {
      res.status(400).json({
        message: "categoryId inválido.",
      });
      return;
    }

   const subcategories = await findAllSubcategories(
  categoryId ?? undefined,
  false,
);

    res.status(200).json(subcategories);
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({
      message: result.message,
    });
  }
};

// LISTAGEM ADMINISTRATIVA
export const listAdminSubcategories: RequestHandler = async (
  req,
  res,
) => {
  try {
    const categoryIdParam = req.query.categoryId;

    const categoryId =
      typeof categoryIdParam === "string"
        ? parseId(categoryIdParam)
        : undefined;

    if (
      categoryIdParam !== undefined &&
      (categoryId === null || categoryId === undefined)
    ) {
      res.status(400).json({
        message: "categoryId inválido.",
      });
      return;
    }

    const subcategories = await findAllSubcategories(
  categoryId ?? undefined,
  true,
);

    res.status(200).json(subcategories);
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({
      message: result.message,
    });
  }
};

// CADASTRAR
export const createSubcategory: RequestHandler = async (
  req,
  res,
) => {
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Dados inválidos.",
      errors: z.flattenError(parsed.error),
    });
    return;
  }

  const slug =
    parsed.data.slug ?? generateSlug(parsed.data.name);

  if (!slug) {
    res.status(400).json({
      message: "Slug inválido.",
    });
    return;
  }

  try {
    const subcategory = await insertSubcategory({
      ...parsed.data,
      slug,
    });

    res.status(201).json(subcategory);
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({
      message: result.message,
    });
  }
};

// EDITAR / REATIVAR
export const updateSubcategory: RequestHandler = async (
  req,
  res,
) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: "ID inválido.",
    });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Dados inválidos.",
      errors: z.flattenError(parsed.error),
    });
    return;
  }

  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({
      message: "Informe pelo menos um campo para atualizar.",
    });
    return;
  }

  try {
    const subcategory = await editSubcategory(
      id,
      parsed.data,
    );

    if (!subcategory) {
      res.status(404).json({
        message: "Subcategoria não encontrada.",
      });
      return;
    }

    res.status(200).json(subcategory);
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({
      message: result.message,
    });
  }
};

// DESATIVAR
export const deactivateSubcategory: RequestHandler = async (
  req,
  res,
) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: "ID inválido.",
    });
    return;
  }

  try {
    const subcategory = await disableSubcategory(id);

    if (!subcategory) {
      res.status(404).json({
        message: "Subcategoria não encontrada.",
      });
      return;
    }

    res.status(200).json({
      message: "Subcategoria desativada com sucesso.",
      subcategory,
    });
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({
      message: result.message,
    });
  }
};

import type { RequestHandler } from "express";
import { z } from "zod";

import {
  disableCategory,
  editCategory,
  findAllCategories,
  insertCategory,
} from "./categories.service.js";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug deve conter letras minúsculas, números e hífens.",
    )
    .optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.url().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = categorySchema.partial();

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
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
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

  if (
    databaseError.code === "23505" &&
    databaseError.constraint === "Category_slug_key"
  ) {
    return {
      status: 409,
      message: "Já existe uma categoria com esse slug.",
    };
  }

  console.error("Erro na API de categorias:", error);

  return {
    status: 500,
    message: "Erro interno ao processar a categoria.",
  };
}

export const listCategories: RequestHandler = async (_req, res) => {
  try {
    const categories = await findAllCategories(false);
    res.status(200).json(categories);
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({ message: result.message });
  }
};

export const listAdminCategories: RequestHandler = async (_req, res) => {
  try {
    const categories = await findAllCategories(true);
    res.status(200).json(categories);
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({ message: result.message });
  }
};

export const createCategory: RequestHandler = async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Dados inválidos.",
      errors: z.flattenError(parsed.error),
    });
    return;
  }

  const slug = parsed.data.slug ?? generateSlug(parsed.data.name);

  if (!slug) {
    res.status(400).json({ message: "Slug inválido." });
    return;
  }

  try {
    const category = await insertCategory({
      ...parsed.data,
      slug,
    });

    res.status(201).json(category);
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({ message: result.message });
  }
};

export const updateCategory: RequestHandler = async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({ message: "ID inválido." });
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
    const category = await editCategory(id, parsed.data);

    if (!category) {
      res.status(404).json({ message: "Categoria não encontrada." });
      return;
    }

    res.status(200).json(category);
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({ message: result.message });
  }
};

export const deactivateCategory: RequestHandler = async (req, res) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({ message: "ID inválido." });
    return;
  }

  try {
    const category = await disableCategory(id);

    if (!category) {
      res.status(404).json({ message: "Categoria não encontrada." });
      return;
    }

    res.status(200).json({
      message: "Categoria desativada com sucesso.",
      category,
    });
  } catch (error) {
    const result = handleError(error);
    res.status(result.status).json({ message: result.message });
  }
};
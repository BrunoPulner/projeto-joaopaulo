
import type { RequestHandler } from "express";
import { z } from "zod";

import {
  disableProduct,
  editProduct,
  findAllProducts,
  findProductById,
  insertProduct,
  validateProductRelations,
  type ProductUpdateInput,
} from "./product.service.js";

// ============================================
// SCHEMA DE VALIDAÇÃO
// ============================================

const productSchema = z.object({
  categoryId: z.number().int().positive(),

  subcategoryId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  name: z.string().trim().min(2).max(100),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),

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

  priceCents: z.number().int().min(0),

  // ==========================================
  // CONTROLE DE ESTOQUE
  // ==========================================

  // Bebidas: número inteiro >= 0.
  // Outros produtos: null ou campo omitido.
  //
  // A obrigatoriedade para bebidas é
  // verificada no product.service.ts,
  // pois depende da categoria cadastrada.
  stockQuantity: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional(),

  // ==========================================
  // CONTROLE ADMINISTRATIVO
  // ==========================================

  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),

  sortOrder: z.number().int().min(0).optional(),

  // ==========================================
  // CONFIGURAÇÕES DE PRODUTOS
  // ==========================================

  allowsFlavors: z.boolean().optional(),

  maxFlavors: z
    .number()
    .int()
    .min(1)
    .max(2)
    .optional(),

  pricingType: z
    .enum(["FIXED", "PIZZA_CUSTOM"])
    .optional(),

  pizzaSlices: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  allowsAddons: z.boolean().optional(),
});

const updateSchema = productSchema.partial();

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function generateSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  return Number.isSafeInteger(id) && id <= 2147483647
    ? id
    : null;
}

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function handleError(error: unknown) {
  const dbError = error as {
    code?: string;
    constraint?: string;
  };

  // Slug duplicado
  if (dbError.code === "23505") {
    return {
      status: 409,
      message:
        "Já existe um produto com esse identificador (slug).",
    };
  }

  // Chave estrangeira inválida
  if (dbError.code === "23503") {
    return {
      status: 400,
      message:
        "Categoria ou subcategoria inválida.",
    };
  }

  // Restrição de estoque do PostgreSQL
  if (
    dbError.code === "23514" &&
    dbError.constraint === "Product_stockQuantity_check"
  ) {
    return {
      status: 400,
      message:
        "A quantidade em estoque não pode ser negativa.",
    };
  }

  // Validação de estoque no serviço
  if (
    error instanceof Error &&
    error.message ===
      "Informe uma quantidade de estoque válida para a bebida."
  ) {
    return {
      status: 400,
      message: error.message,
    };
  }

  // Categoria inexistente ou desativada
  if (
    error instanceof Error &&
    error.message ===
      "Categoria inexistente ou desativada."
  ) {
    return {
      status: 400,
      message: error.message,
    };
  }

  console.error("Erro na API de produtos:", error);

  return {
    status: 500,
    message: "Erro interno ao processar produto.",
  };
}

// ============================================
// LISTAGEM PÚBLICA
// ============================================

export const listProducts: RequestHandler = async (
  _req,
  res,
) => {
  try {
    const products = await findAllProducts(false);

    res.status(200).json(products);
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// LISTAGEM ADMINISTRATIVA
// ============================================

export const listAdminProducts: RequestHandler = async (
  _req,
  res,
) => {
  try {
    const products = await findAllProducts(true);

    res.status(200).json(products);
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// CADASTRAR PRODUTO
// ============================================

export const createProduct: RequestHandler = async (
  req,
  res,
) => {
  const parsed = productSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Dados inválidos.",
      errors: z.flattenError(parsed.error),
    });
    return;
  }

  const slug =
    parsed.data.slug ??
    generateSlug(parsed.data.name);

  if (!slug) {
    res.status(400).json({
      message: "Slug inválido.",
    });
    return;
  }

  try {
    const relationError =
      await validateProductRelations(
        parsed.data.categoryId,
        parsed.data.subcategoryId,
      );

    if (relationError) {
      res.status(400).json({
        message: relationError,
      });
      return;
    }

    const product = await insertProduct({
      ...parsed.data,
      slug,
    });

    res.status(201).json(product);
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// ATUALIZAR PRODUTO
// ============================================

export const updateProduct: RequestHandler = async (
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
      message:
        "Informe pelo menos um campo para atualizar.",
    });
    return;
  }

  try {
    const current = await findProductById(id);

    if (!current) {
      res.status(404).json({
        message: "Produto não encontrado.",
      });
      return;
    }

    const input: ProductUpdateInput = {
      ...parsed.data,
    };

    if (
      input.name &&
      input.slug === undefined
    ) {
      input.slug = generateSlug(input.name);
    }

    const categoryId =
      input.categoryId ?? current.categoryId;

    const subcategoryId =
      input.subcategoryId !== undefined
        ? input.subcategoryId
        : current.subcategoryId;

    const relationError =
      await validateProductRelations(
        categoryId,
        subcategoryId,
      );

    if (relationError) {
      res.status(400).json({
        message: relationError,
      });
      return;
    }

    const product = await editProduct(
      id,
      input,
    );

    res.status(200).json(product);
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// DESATIVAR PRODUTO
// ============================================

export const deactivateProduct: RequestHandler = async (
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
    const product = await disableProduct(id);

    if (!product) {
      res.status(404).json({
        message: "Produto não encontrado.",
      });
      return;
    }

    res.status(200).json({
      message: "Produto desativado com sucesso.",
      product,
    });
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

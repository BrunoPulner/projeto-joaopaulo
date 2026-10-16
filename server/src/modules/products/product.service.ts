
import { pool } from "../../lib/db.js";

// ============================================
// TIPOS
// ============================================

export type ProductPricingType =
  | "FIXED"
  | "PIZZA_CUSTOM";

export interface Product {
  id: number;
  categoryId: number;
  subcategoryId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  pricingType: ProductPricingType;
  pizzaSlices: number | null;
  allowsFlavors: boolean;
  maxFlavors: number;
  allowsAddons: boolean;

  // Estoque exclusivo para bebidas
  stockQuantity: number | null;

  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductInput {
  categoryId: number;
  subcategoryId?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
  pricingType?: ProductPricingType;
  pizzaSlices?: number | null;
  allowsFlavors?: boolean;
  maxFlavors?: number;
  allowsAddons?: boolean;

  // Obrigatório para bebidas, null para outros produtos
  stockQuantity?: number | null;

  isActive?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}

export type ProductUpdateInput = Partial<ProductInput>;

export interface ProductConfiguration {
  pricingType: ProductPricingType;
  pizzaSlices: number | null;
  allowsFlavors: boolean;
  maxFlavors: number;
  allowsAddons: boolean;

  // Indica se a categoria controla estoque
  controlsStock: boolean;
}

const fields = `
  id,
  "categoryId",
  "subcategoryId",
  name,
  slug,
  description,
  "imageUrl",
  "priceCents",
  "pricingType",
  "pizzaSlices",
  "allowsFlavors",
  "maxFlavors",
  "allowsAddons",
  "stockQuantity",
  "isActive",
  "isAvailable",
  "isFeatured",
  "sortOrder",
  "createdAt",
  "updatedAt"
`;

// ============================================
// CONSULTAS
// ============================================

export async function findAllProducts(
  includeInactive = false,
): Promise<Product[]> {
  const result = await pool.query<Product>(
    `
      SELECT ${fields}
      FROM public."Product"
      WHERE ($1::boolean OR "isActive" = true)
      ORDER BY "sortOrder" ASC, name ASC
    `,
    [includeInactive],
  );

  return result.rows;
}

export async function findProductById(
  id: number,
): Promise<Product | null> {
  const result = await pool.query<Product>(
    `
      SELECT ${fields}
      FROM public."Product"
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

// ============================================
// VALIDAR CATEGORIA E SUBCATEGORIA
// ============================================

export async function validateProductRelations(
  categoryId: number,
  subcategoryId: number | null | undefined,
): Promise<string | null> {
  const category = await pool.query<{
    id: number;
    isActive: boolean;
  }>(
    `
      SELECT id, "isActive"
      FROM public."Category"
      WHERE id = $1
    `,
    [categoryId],
  );

  if (!category.rows[0]?.isActive) {
    return "Categoria inexistente ou desativada.";
  }

  const subcategories = await pool.query<{
    id: number;
    isActive: boolean;
  }>(
    `
      SELECT id, "isActive"
      FROM public."Subcategory"
      WHERE "categoryId" = $1
    `,
    [categoryId],
  );

  const active = subcategories.rows.filter(
    (item) => item.isActive,
  );

  if (subcategoryId == null) {
    if (active.length > 0) {
      return "Selecione uma subcategoria para este produto.";
    }

    return null;
  }

  if (!active.some((item) => item.id === subcategoryId)) {
    return "Subcategoria inválida ou não pertence à categoria.";
  }

  return null;
}

// ============================================
// REGRAS DE CONFIGURAÇÃO POR CATEGORIA
// ============================================

export async function resolveProductConfiguration(
  categoryId: number,
  requestedAllowsAddons?: boolean,
): Promise<ProductConfiguration> {
  const result = await pool.query<{
    slug: string;
  }>(
    `
      SELECT slug
      FROM public."Category"
      WHERE id = $1 AND "isActive" = true
      LIMIT 1
    `,
    [categoryId],
  );

  const category = result.rows[0];

  if (!category) {
    throw new Error(
      "Categoria inexistente ou desativada.",
    );
  }

  const slug = category.slug.toLowerCase();

  // Pizzas
  if (slug === "pizzas" || slug === "pizza") {
    return {
      pricingType: "PIZZA_CUSTOM",
      pizzaSlices: 8,
      allowsFlavors: true,
      maxFlavors: 2,
      allowsAddons: requestedAllowsAddons ?? true,
      controlsStock: false,
    };
  }

  // Bebidas: preço fixo e controle de estoque
  if (slug === "bebidas" || slug === "bebida") {
    return {
      pricingType: "FIXED",
      pizzaSlices: null,
      allowsFlavors: false,
      maxFlavors: 1,
      allowsAddons: false,
      controlsStock: true,
    };
  }

  // Espetinhos: sem adicionais e sem estoque
  if (slug === "espetinhos" || slug === "espetinho") {
    return {
      pricingType: "FIXED",
      pizzaSlices: null,
      allowsFlavors: false,
      maxFlavors: 1,
      allowsAddons: false,
      controlsStock: false,
    };
  }

  // Lanches, pastéis, crepes e demais categorias
  return {
    pricingType: "FIXED",
    pizzaSlices: null,
    allowsFlavors: false,
    maxFlavors: 1,
    allowsAddons: requestedAllowsAddons ?? false,
    controlsStock: false,
  };
}

// ============================================
// VALIDAR QUANTIDADE DE ESTOQUE
// ============================================

function validateStockQuantity(
  quantity: number | null | undefined,
): void {
  if (
    typeof quantity !== "number" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0
  ) {
    throw new Error(
      "Informe uma quantidade de estoque válida para a bebida.",
    );
  }
}

// ============================================
// CADASTRAR PRODUTO
// ============================================

export async function insertProduct(
  input: ProductInput,
): Promise<Product> {
  const configuration =
    await resolveProductConfiguration(
      input.categoryId,
      input.allowsAddons,
    );

  let stockQuantity: number | null = null;

  if (configuration.controlsStock) {
    validateStockQuantity(input.stockQuantity);
    stockQuantity = input.stockQuantity!;
  }

  const result = await pool.query<Product>(
    `
      INSERT INTO public."Product" (
        "categoryId",
        "subcategoryId",
        name,
        slug,
        description,
        "imageUrl",
        "priceCents",
        "pricingType",
        "pizzaSlices",
        "allowsFlavors",
        "maxFlavors",
        "allowsAddons",
        "stockQuantity",
        "isActive",
        "isAvailable",
        "isFeatured",
        "sortOrder",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, NOW()
      )
      RETURNING ${fields}
    `,
    [
      input.categoryId,
      input.subcategoryId ?? null,
      input.name,
      input.slug,
      input.description ?? null,
      input.imageUrl ?? null,
      input.priceCents,
      configuration.pricingType,
      configuration.pizzaSlices,
      configuration.allowsFlavors,
      configuration.maxFlavors,
      configuration.allowsAddons,
      stockQuantity,
      input.isActive ?? true,
      input.isAvailable ?? true,
      input.isFeatured ?? false,
      input.sortOrder ?? 0,
    ],
  );

  return result.rows[0]!;
}

// ============================================
// ATUALIZAR PRODUTO
// ============================================

export async function editProduct(
  id: number,
  input: ProductUpdateInput,
): Promise<Product | null> {
  const current = await findProductById(id);

  if (!current) {
    return null;
  }

  const categoryId =
    input.categoryId ?? current.categoryId;

  const allowsAddons =
    input.allowsAddons ?? current.allowsAddons;

  const configuration =
    await resolveProductConfiguration(
      categoryId,
      allowsAddons,
    );

  let stockQuantity: number | null = null;

  if (configuration.controlsStock) {
    stockQuantity =
      input.stockQuantity !== undefined
        ? input.stockQuantity
        : current.stockQuantity;

    validateStockQuantity(stockQuantity);
  }

  const allowedFields = [
    "categoryId",
    "subcategoryId",
    "name",
    "slug",
    "description",
    "imageUrl",
    "priceCents",
    "isActive",
    "isAvailable",
    "isFeatured",
    "sortOrder",
  ] as const;

  const entries: Array<
    readonly [string, unknown]
  > = allowedFields
    .filter((key) => input[key] !== undefined)
    .map((key) => [key, input[key]] as const);

  entries.push(
    ["pricingType", configuration.pricingType],
    ["pizzaSlices", configuration.pizzaSlices],
    ["allowsFlavors", configuration.allowsFlavors],
    ["maxFlavors", configuration.maxFlavors],
    ["allowsAddons", configuration.allowsAddons],
    ["stockQuantity", stockQuantity],
  );

  const assignments = entries.map(
    ([key], index) => `"${key}" = $${index + 2}`,
  );

  const values = entries.map(([, value]) => value);

  const result = await pool.query<Product>(
    `
      UPDATE public."Product"
      SET
        ${assignments.join(", ")},
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING ${fields}
    `,
    [id, ...values],
  );

  return result.rows[0] ?? null;
}

// ============================================
// DESATIVAR PRODUTO
// ============================================

export async function disableProduct(
  id: number,
): Promise<Product | null> {
  return editProduct(id, {
    isActive: false,
  });
}

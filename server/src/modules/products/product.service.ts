
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
});

export interface Product {
  id: number;
  categoryId: number;
  subcategoryId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  allowsFlavors: boolean;
  maxFlavors: number;
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
  isActive?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  allowsFlavors?: boolean;
  maxFlavors?: number;
}

export type ProductUpdateInput = Partial<ProductInput>;

const fields = `
  id, "categoryId", "subcategoryId",
  name, slug, description, "imageUrl",
  "priceCents", "isActive", "isAvailable",
  "isFeatured", "sortOrder", "allowsFlavors",
  "maxFlavors", "createdAt", "updatedAt"
`;

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

export async function insertProduct(
  input: ProductInput,
): Promise<Product> {
  const result = await pool.query<Product>(
    `
      INSERT INTO public."Product" (
        "categoryId", "subcategoryId",
        name, slug, description, "imageUrl",
        "priceCents", "isActive", "isAvailable",
        "isFeatured", "sortOrder",
        "allowsFlavors", "maxFlavors",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, NOW()
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
      input.isActive ?? true,
      input.isAvailable ?? true,
      input.isFeatured ?? false,
      input.sortOrder ?? 0,
      input.allowsFlavors ?? false,
      input.maxFlavors ?? 1,
    ],
  );

  return result.rows[0]!;
}

export async function editProduct(
  id: number,
  input: ProductUpdateInput,
): Promise<Product | null> {
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
    "allowsFlavors",
    "maxFlavors",
  ] as const;

  const entries = allowedFields
    .filter((key) => input[key] !== undefined)
    .map((key) => [key, input[key]] as const);

  if (entries.length === 0) {
    return findProductById(id);
  }

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

export async function disableProduct(
  id: number,
): Promise<Product | null> {
  return editProduct(id, { isActive: false });
}

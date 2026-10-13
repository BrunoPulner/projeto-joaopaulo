import "dotenv/config";

import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não configurada.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 5,
});

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export type CategoryUpdateInput = Partial<CategoryInput>;

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const fields = `
  id,
  name,
  slug,
  description,
  "imageUrl",
  "isActive",
  "sortOrder",
  "createdAt",
  "updatedAt"
`;

export async function findAllCategories(
  includeInactive = false,
): Promise<Category[]> {
  const result = await pool.query<Category>(
    `
      SELECT ${fields}
      FROM public."Category"
      WHERE ($1::boolean = true OR "isActive" = true)
      ORDER BY "sortOrder" ASC, name ASC
    `,
    [includeInactive],
  );

  return result.rows;
}

export async function findCategoryById(
  id: number,
): Promise<Category | null> {
  const result = await pool.query<Category>(
    `
      SELECT ${fields}
      FROM public."Category"
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function insertCategory(
  input: CategoryInput,
): Promise<Category> {
  const result = await pool.query<Category>(
    `
      INSERT INTO public."Category" (
        name,
        slug,
        description,
        "imageUrl",
        "isActive",
        "sortOrder",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING ${fields}
    `,
    [
      input.name,
      input.slug,
      input.description ?? null,
      input.imageUrl ?? null,
      input.isActive ?? true,
      input.sortOrder ?? 0,
    ],
  );

  const category = result.rows[0];

  if (!category) {
    throw new Error(
      "Não foi possível recuperar a categoria após o cadastro.",
    );
  }

  return category;
}

export async function editCategory(
  id: number,
  input: CategoryUpdateInput,
): Promise<Category | null> {
  const allowedFields = [
    "name",
    "slug",
    "description",
    "imageUrl",
    "isActive",
    "sortOrder",
  ] as const;

  const entries = allowedFields
    .filter((key) => input[key] !== undefined)
    .map((key) => [key, input[key]] as const);

  if (entries.length === 0) {
    return findCategoryById(id);
  }

  const assignments = entries.map(
    ([key], index) => `"${key}" = $${index + 2}`,
  );

  const values = entries.map(([, value]) => value);

  const result = await pool.query<Category>(
    `
      UPDATE public."Category"
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

export async function disableCategory(
  id: number,
): Promise<Category | null> {
  return editCategory(id, { isActive: false });
}
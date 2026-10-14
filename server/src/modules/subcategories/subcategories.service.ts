
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

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubcategoryInput {
  categoryId: number;
  name: string;
  slug: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type SubcategoryUpdateInput = Partial<
  Omit<SubcategoryInput, "categoryId">
>;

const fields = `
  id,
  "categoryId",
  name,
  slug,
  "isActive",
  "sortOrder",
  "createdAt",
  "updatedAt"
`;

// LISTAR SUBCATEGORIAS
export async function findAllSubcategories(
  categoryId?: number,
  includeInactive = false,
): Promise<Subcategory[]> {
  const result = await pool.query<Subcategory>(
    `
      SELECT ${fields}
      FROM public."Subcategory"
      WHERE
        ($1::integer IS NULL OR "categoryId" = $1)
        AND ($2::boolean = true OR "isActive" = true)
      ORDER BY "sortOrder" ASC, name ASC
    `,
    [categoryId ?? null, includeInactive],
  );

  return result.rows;
}

// BUSCAR POR ID
export async function findSubcategoryById(
  id: number,
): Promise<Subcategory | null> {
  const result = await pool.query<Subcategory>(
    `
      SELECT ${fields}
      FROM public."Subcategory"
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

// CRIAR SUBCATEGORIA
export async function insertSubcategory(
  input: SubcategoryInput,
): Promise<Subcategory> {
  const result = await pool.query<Subcategory>(
    `
      INSERT INTO public."Subcategory" (
        "categoryId",
        name,
        slug,
        "isActive",
        "sortOrder",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING ${fields}
    `,
    [
      input.categoryId,
      input.name,
      input.slug,
      input.isActive ?? true,
      input.sortOrder ?? 0,
    ],
  );

  const subcategory = result.rows[0];

  if (!subcategory) {
    throw new Error(
      "Não foi possível recuperar a subcategoria após o cadastro.",
    );
  }

  return subcategory;
}

// EDITAR SUBCATEGORIA
export async function editSubcategory(
  id: number,
  input: SubcategoryUpdateInput,
): Promise<Subcategory | null> {
  const allowedFields = [
    "name",
    "slug",
    "isActive",
    "sortOrder",
  ] as const;

  const entries = allowedFields
    .filter((key) => input[key] !== undefined)
    .map((key) => [key, input[key]] as const);

  if (entries.length === 0) {
    return findSubcategoryById(id);
  }

  const assignments = entries.map(
    ([key], index) => `"${key}" = $${index + 2}`,
  );

  const values = entries.map(([, value]) => value);

  const result = await pool.query<Subcategory>(
    `
      UPDATE public."Subcategory"
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

// DESATIVAR SUBCATEGORIA
export async function disableSubcategory(
  id: number,
): Promise<Subcategory | null> {
  return editSubcategory(id, {
    isActive: false,
  });
}

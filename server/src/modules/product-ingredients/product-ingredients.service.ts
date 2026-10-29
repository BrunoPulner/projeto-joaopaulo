
import { pool } from "../../lib/db.js";

// ============================================
// TIPOS
// ============================================

export interface ProductIngredient {
  id: number;
  productId: number;
  name: string;
  isRemovable: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface ProductIngredientInput {
  productId: number;
  name: string;
  isRemovable?: boolean;
  sortOrder?: number;
}

export interface ProductIngredientUpdateInput {
  name?: string;
  isRemovable?: boolean;
  sortOrder?: number;
}

// ============================================
// CAMPOS SQL
// ============================================

const ingredientFields = `
  id,
  "productId",
  name,
  "isRemovable",
  "sortOrder",
  "createdAt"
`;

// ============================================
// VERIFICAR SE PRODUTO EXISTE
// ============================================

export async function productExists(
  productId: number,
): Promise<boolean> {
  const result = await pool.query(
    `
      SELECT 1
      FROM public."Product"
      WHERE id = $1
      LIMIT 1
    `,
    [productId],
  );

  return (result.rowCount ?? 0) > 0;
}

// ============================================
// LISTAR INGREDIENTES DE UM PRODUTO
// ============================================

export async function listProductIngredients(
  productId: number,
): Promise<ProductIngredient[]> {
  const result = await pool.query<ProductIngredient>(
    `
      SELECT ${ingredientFields}
      FROM public."ProductIngredient"
      WHERE "productId" = $1
      ORDER BY "sortOrder" ASC, id ASC
    `,
    [productId],
  );

  return result.rows;
}

// ============================================
// BUSCAR INGREDIENTE PELO ID
// ============================================

export async function findProductIngredientById(
  id: number,
): Promise<ProductIngredient | null> {
  const result = await pool.query<ProductIngredient>(
    `
      SELECT ${ingredientFields}
      FROM public."ProductIngredient"
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

// ============================================
// CADASTRAR INGREDIENTE
// ============================================

export async function createProductIngredient(
  input: ProductIngredientInput,
): Promise<ProductIngredient> {
  const name = input.name.trim();

  if (!name) {
    throw new Error(
      "Informe o nome do ingrediente.",
    );
  }

  if (name.length > 120) {
    throw new Error(
      "O nome deve ter no máximo 120 caracteres.",
    );
  }

  const exists = await productExists(input.productId);

  if (!exists) {
    throw new Error(
      "Produto não encontrado.",
    );
  }

  const result = await pool.query<ProductIngredient>(
    `
      INSERT INTO public."ProductIngredient" (
        "productId",
        name,
        "isRemovable",
        "sortOrder"
      )
      VALUES ($1, $2, $3, $4)
      RETURNING ${ingredientFields}
    `,
    [
      input.productId,
      name,
      input.isRemovable ?? true,
      input.sortOrder ?? 0,
    ],
  );

  return result.rows[0]!;
}

// ============================================
// ATUALIZAR INGREDIENTE
// ============================================

export async function updateProductIngredient(
  id: number,
  input: ProductIngredientUpdateInput,
): Promise<ProductIngredient | null> {
  const existing =
    await findProductIngredientById(id);

  if (!existing) {
    return null;
  }

  const name =
    input.name !== undefined
      ? input.name.trim()
      : existing.name;

  if (!name || name.length > 120) {
    throw new Error(
      "Informe um nome válido de até 120 caracteres.",
    );
  }

  const result = await pool.query<ProductIngredient>(
    `
      UPDATE public."ProductIngredient"
      SET
        name = $2,
        "isRemovable" = $3,
        "sortOrder" = $4
      WHERE id = $1
      RETURNING ${ingredientFields}
    `,
    [
      id,
      name,
      input.isRemovable ?? existing.isRemovable,
      input.sortOrder ?? existing.sortOrder,
    ],
  );

  return result.rows[0] ?? null;
}

// ============================================
// EXCLUIR INGREDIENTE
// ============================================

export async function deleteProductIngredient(
  id: number,
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM public."ProductIngredient"
      WHERE id = $1
    `,
    [id],
  );

  return (result.rowCount ?? 0) > 0;
}

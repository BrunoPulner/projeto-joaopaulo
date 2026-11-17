
import { pool } from "../../lib/db.js";

// ============================================
// TIPOS
// ============================================

export interface PizzaFlavorIngredient {
  id: number;
  pizzaFlavorId: number;
  name: string;
  isRemovable: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface PizzaFlavorIngredientInput {
  pizzaFlavorId: number;
  name: string;
  isRemovable?: boolean;
  sortOrder?: number;
}

export interface PizzaFlavorIngredientUpdateInput {
  name?: string;
  isRemovable?: boolean;
  sortOrder?: number;
}

// ============================================
// VALIDAÇÕES
// ============================================

function validateId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador inválido.");
  }
}

function validateName(name: string): string {
  const normalized = name.trim();

  if (!normalized || normalized.length > 120) {
    throw new Error(
      "O nome deve conter entre 1 e 120 caracteres.",
    );
  }

  return normalized;
}

function validateSortOrder(value: number): void {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > 2147483647
  ) {
    throw new Error(
      "A ordem deve ser um inteiro não negativo válido.",
    );
  }
}

// ============================================
// CAMPOS SQL
// ============================================

const ingredientFields = `
  id,
  "pizzaFlavorId",
  name,
  "isRemovable",
  "sortOrder",
  "createdAt"
`;

// ============================================
// VERIFICAR SE O SABOR EXISTE
// ============================================

export async function pizzaFlavorExists(
  pizzaFlavorId: number,
): Promise<boolean> {
  validateId(pizzaFlavorId);

  const result = await pool.query(
    `
      SELECT 1
      FROM public."PizzaFlavor"
      WHERE id = $1
      LIMIT 1
    `,
    [pizzaFlavorId],
  );

  return (result.rowCount ?? 0) > 0;
}

// ============================================
// LISTAR INGREDIENTES DE UM SABOR
// ============================================

export async function listPizzaFlavorIngredients(
  pizzaFlavorId: number,
): Promise<PizzaFlavorIngredient[]> {
  validateId(pizzaFlavorId);

  const result =
    await pool.query<PizzaFlavorIngredient>(
      `
        SELECT ${ingredientFields}
        FROM public."PizzaFlavorIngredient"
        WHERE "pizzaFlavorId" = $1
        ORDER BY "sortOrder" ASC, id ASC
      `,
      [pizzaFlavorId],
    );

  return result.rows;
}

// ============================================
// BUSCAR INGREDIENTE PELO ID
// ============================================

export async function findPizzaFlavorIngredientById(
  id: number,
): Promise<PizzaFlavorIngredient | null> {
  validateId(id);

  const result =
    await pool.query<PizzaFlavorIngredient>(
      `
        SELECT ${ingredientFields}
        FROM public."PizzaFlavorIngredient"
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

export async function createPizzaFlavorIngredient(
  input: PizzaFlavorIngredientInput,
): Promise<PizzaFlavorIngredient> {
  validateId(input.pizzaFlavorId);

  const name = validateName(input.name);
  const sortOrder = input.sortOrder ?? 0;

  validateSortOrder(sortOrder);

  const exists = await pizzaFlavorExists(
    input.pizzaFlavorId,
  );

  if (!exists) {
    throw new Error(
      "O sabor de pizza informado não existe.",
    );
  }

  const result =
    await pool.query<PizzaFlavorIngredient>(
      `
        INSERT INTO public."PizzaFlavorIngredient" (
          "pizzaFlavorId",
          name,
          "isRemovable",
          "sortOrder"
        )
        VALUES ($1, $2, $3, $4)
        RETURNING ${ingredientFields}
      `,
      [
        input.pizzaFlavorId,
        name,
        input.isRemovable ?? true,
        sortOrder,
      ],
    );

  return result.rows[0]!;
}

// ============================================
// ATUALIZAR INGREDIENTE
// ============================================

export async function updatePizzaFlavorIngredient(
  id: number,
  input: PizzaFlavorIngredientUpdateInput,
): Promise<PizzaFlavorIngredient | null> {
  validateId(id);

  const existing =
    await findPizzaFlavorIngredientById(id);

  if (!existing) {
    return null;
  }

  const name =
    input.name !== undefined
      ? validateName(input.name)
      : existing.name;

  const sortOrder =
    input.sortOrder ?? existing.sortOrder;

  validateSortOrder(sortOrder);

  const result =
    await pool.query<PizzaFlavorIngredient>(
      `
        UPDATE public."PizzaFlavorIngredient"
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
        sortOrder,
      ],
    );

  return result.rows[0] ?? null;
}

// ============================================
// EXCLUIR INGREDIENTE
// ============================================

export async function deletePizzaFlavorIngredient(
  id: number,
): Promise<boolean> {
  validateId(id);

  const result = await pool.query(
    `
      DELETE FROM public."PizzaFlavorIngredient"
      WHERE id = $1
    `,
    [id],
  );

  return (result.rowCount ?? 0) > 0;
}

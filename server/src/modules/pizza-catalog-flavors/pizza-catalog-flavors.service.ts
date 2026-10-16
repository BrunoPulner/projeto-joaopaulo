
import { pool } from "../../lib/db.js";
import type { PoolClient } from "pg";

const MAX_INT = 2_147_483_647;

export interface CatalogPizzaFlavor {
  id: number;
  subcategoryId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  additionalPriceCents: number;
  isPremium: boolean;
  premiumAdditionalCents: number;
  allSizes: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogPizzaFlavorInput {
  subcategoryId: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  additionalPriceCents: number;
  isPremium?: boolean;
  premiumAdditionalCents?: number;
  allSizes?: boolean;
  sizeIds?: number[];
  isActive?: boolean;
  sortOrder?: number;
}

export type CatalogPizzaFlavorUpdateInput =
  Partial<CatalogPizzaFlavorInput>;

export interface CatalogPizzaFlavorWithSizes
  extends CatalogPizzaFlavor {
  sizeIds: number[];
}

export class PizzaCatalogFlavorError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "PizzaCatalogFlavorError";
  }
}

const fields = `
  f.id,
  f."subcategoryId",
  f.name,
  f.description,
  f."imageUrl",
  f."additionalPriceCents",
  f."isPremium",
  f."premiumAdditionalCents",
  f."allSizes",
  f."isActive",
  f."sortOrder",
  f."createdAt",
  f."updatedAt"
`;

function positiveId(value: number, field: string): void {
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_INT
  ) {
    throw new PizzaCatalogFlavorError(
      `${field} inválido.`,
    );
  }
}

function nonnegativeInt(
  value: number,
  field: string,
): void {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_INT
  ) {
    throw new PizzaCatalogFlavorError(
      `${field} deve ser um inteiro não negativo.`,
    );
  }
}

function normalizeSizeIds(
  ids: number[] | undefined,
): number[] {
  if (ids === undefined) return [];

  if (!Array.isArray(ids) || ids.length > 100) {
    throw new PizzaCatalogFlavorError(
      "Informe no máximo 100 tamanhos.",
    );
  }

  const unique = [...new Set(ids)];

  unique.forEach((id) => positiveId(id, "Tamanho"));

  return unique;
}

function validateFlavor(
  input: CatalogPizzaFlavorInput,
): void {
  positiveId(input.subcategoryId, "Subcategoria");

  if (
    typeof input.name !== "string" ||
    input.name.trim().length < 2 ||
    input.name.trim().length > 150
  ) {
    throw new PizzaCatalogFlavorError(
      "O nome do sabor deve ter entre 2 e 150 caracteres.",
    );
  }

  if (
    input.description != null &&
    (
      typeof input.description !== "string" ||
      input.description.length > 2000
    )
  ) {
    throw new PizzaCatalogFlavorError(
      "Descrição inválida.",
    );
  }

  if (
    input.imageUrl != null &&
    (
      typeof input.imageUrl !== "string" ||
      input.imageUrl.length > 2048
    )
  ) {
    throw new PizzaCatalogFlavorError(
      "URL da imagem inválida.",
    );
  }

  nonnegativeInt(
    input.additionalPriceCents,
    "Acréscimo do sabor",
  );

  nonnegativeInt(
    input.premiumAdditionalCents ?? 0,
    "Acréscimo nobre",
  );

  nonnegativeInt(
    input.sortOrder ?? 0,
    "Ordem de exibição",
  );

  if (
    input.isPremium !== undefined &&
    typeof input.isPremium !== "boolean"
  ) {
    throw new PizzaCatalogFlavorError(
      "Indicador de sabor nobre inválido.",
    );
  }

  if (
    input.allSizes !== undefined &&
    typeof input.allSizes !== "boolean"
  ) {
    throw new PizzaCatalogFlavorError(
      "Disponibilidade por tamanho inválida.",
    );
  }

  if (
    input.isActive !== undefined &&
    typeof input.isActive !== "boolean"
  ) {
    throw new PizzaCatalogFlavorError(
      "Status inválido.",
    );
  }

  if (
    !input.isPremium &&
    (input.premiumAdditionalCents ?? 0) > 0
  ) {
    throw new PizzaCatalogFlavorError(
      "Sabores comuns não podem ter acréscimo nobre.",
    );
  }

  const sizeIds = normalizeSizeIds(input.sizeIds);

  if (
    input.allSizes === false &&
    sizeIds.length === 0
  ) {
    throw new PizzaCatalogFlavorError(
      "Selecione ao menos um tamanho.",
    );
  }

  if (
    input.allSizes !== false &&
    sizeIds.length > 0
  ) {
    throw new PizzaCatalogFlavorError(
      "Para selecionar tamanhos específicos, use allSizes: false.",
    );
  }
}

async function assertPizzaSubcategory(
  client: PoolClient,
  subcategoryId: number,
): Promise<void> {
  const result = await client.query(`
    SELECT s.id
    FROM public."Subcategory" s
    JOIN public."Category" c
      ON c.id = s."categoryId"
    WHERE s.id = $1
      AND c.slug IN ('pizza', 'pizzas')
      AND s.slug IN ('salgadas', 'doces')
  `, [subcategoryId]);

  if (!result.rows[0]) {
    throw new PizzaCatalogFlavorError(
      "Selecione a subcategoria Salgadas ou Doces de Pizzas.",
    );
  }
}

async function assertSizes(
  client: PoolClient,
  sizeIds: number[],
): Promise<void> {
  if (sizeIds.length === 0) return;

  const result = await client.query(`
    SELECT id
    FROM public."PizzaSize"
    WHERE id = ANY($1::int[])
  `, [sizeIds]);

  if (result.rows.length !== sizeIds.length) {
    throw new PizzaCatalogFlavorError(
      "Um ou mais tamanhos não existem.",
      404,
    );
  }
}

async function replaceSizeLinks(
  client: PoolClient,
  flavorId: number,
  sizeIds: number[],
): Promise<void> {
  await client.query(`
    UPDATE public."PizzaFlavorSize"
    SET "isActive" = false
    WHERE "pizzaFlavorId" = $1
  `, [flavorId]);

  if (sizeIds.length === 0) return;

  await client.query(`
    INSERT INTO public."PizzaFlavorSize" (
      "pizzaFlavorId",
      "pizzaSizeId",
      "isActive"
    )
    SELECT $1, unnest($2::int[]), true
    ON CONFLICT ("pizzaFlavorId", "pizzaSizeId")
    DO UPDATE SET "isActive" = true
  `, [flavorId, sizeIds]);
}

async function findWithSizes(
  client: PoolClient,
  id: number,
): Promise<CatalogPizzaFlavorWithSizes | null> {
  const result =
    await client.query<CatalogPizzaFlavorWithSizes>(`
      SELECT
        ${fields},
        COALESCE(
          (
            SELECT array_agg(
              fs."pizzaSizeId"
              ORDER BY fs."pizzaSizeId"
            )
            FROM public."PizzaFlavorSize" fs
            WHERE fs."pizzaFlavorId" = f.id
              AND fs."isActive" = true
          ),
          ARRAY[]::integer[]
        ) AS "sizeIds"
      FROM public."PizzaFlavor" f
      WHERE f.id = $1
    `, [id]);

  return result.rows[0] ?? null;
}

function handleDatabaseError(error: unknown): never {
  if (error instanceof PizzaCatalogFlavorError) {
    throw error;
  }

  const pgError = error as { code?: string } | null;

  if (pgError?.code === "23505") {
    throw new PizzaCatalogFlavorError(
      "Já existe um sabor com esse nome nessa subcategoria.",
      409,
    );
  }

  if (pgError?.code === "23503") {
    throw new PizzaCatalogFlavorError(
      "Subcategoria ou tamanho relacionado não encontrado.",
    );
  }

  if (
    pgError?.code === "23514" ||
    pgError?.code === "22P02" ||
    pgError?.code === "22003"
  ) {
    throw new PizzaCatalogFlavorError(
      "Dados inválidos para o banco.",
    );
  }

  throw error;
}

// ============================================
// LISTAGEM PÚBLICA
// ============================================

export async function listPublicCatalogPizzaFlavors(
  options: {
    subcategoryId?: number;
    sizeId?: number;
  } = {},
): Promise<CatalogPizzaFlavor[]> {
  if (options.subcategoryId !== undefined) {
    positiveId(options.subcategoryId, "Subcategoria");
  }

  if (options.sizeId !== undefined) {
    positiveId(options.sizeId, "Tamanho");
  }

  const result = await pool.query<CatalogPizzaFlavor>(`
    SELECT ${fields}
    FROM public."PizzaFlavor" f

    JOIN public."Subcategory" s
      ON s.id = f."subcategoryId"

    JOIN public."Category" c
      ON c.id = s."categoryId"

    WHERE f."isActive" = true
      AND c.slug IN ('pizza', 'pizzas')

      AND (
        $1::int IS NULL
        OR f."subcategoryId" = $1
      )

      AND (
        $2::int IS NULL
        OR (
          EXISTS (
            SELECT 1
            FROM public."PizzaSize" ps
            WHERE ps.id = $2
              AND ps."isActive" = true
              AND ps."isAvailable" = true
          )
          AND (
            f."allSizes" = true
            OR EXISTS (
              SELECT 1
              FROM public."PizzaFlavorSize" fs
              WHERE fs."pizzaFlavorId" = f.id
                AND fs."pizzaSizeId" = $2
                AND fs."isActive" = true
            )
          )
        )
      )

    ORDER BY f."sortOrder" ASC, f.name ASC
  `, [
    options.subcategoryId ?? null,
    options.sizeId ?? null,
  ]);

  return result.rows;
}

// ============================================
// LISTAGEM ADMINISTRATIVA
// ============================================

export async function listAdminCatalogPizzaFlavors():
  Promise<CatalogPizzaFlavorWithSizes[]> {
  const result =
    await pool.query<CatalogPizzaFlavorWithSizes>(`
      SELECT
        ${fields},
        COALESCE(
          (
            SELECT array_agg(
              fs."pizzaSizeId"
              ORDER BY fs."pizzaSizeId"
            )
            FROM public."PizzaFlavorSize" fs
            WHERE fs."pizzaFlavorId" = f.id
              AND fs."isActive" = true
          ),
          ARRAY[]::integer[]
        ) AS "sizeIds"
      FROM public."PizzaFlavor" f
      ORDER BY f."sortOrder" ASC, f.name ASC
    `);

  return result.rows;
}

// ============================================
// CONSULTAR SABOR POR ID
// ============================================

export async function findCatalogPizzaFlavorById(
  id: number,
): Promise<CatalogPizzaFlavorWithSizes | null> {
  positiveId(id, "Sabor");

  const client = await pool.connect();

  try {
    return await findWithSizes(client, id);
  } finally {
    client.release();
  }
}

// ============================================
// CADASTRAR SABOR
// ============================================

export async function createCatalogPizzaFlavor(
  input: CatalogPizzaFlavorInput,
): Promise<CatalogPizzaFlavorWithSizes> {
  const data: CatalogPizzaFlavorInput = {
    ...input,
    name: input.name?.trim(),
    description: input.description?.trim() || null,
    imageUrl: input.imageUrl?.trim() || null,
    isPremium: input.isPremium ?? false,
    premiumAdditionalCents: input.isPremium
      ? (input.premiumAdditionalCents ?? 0)
      : 0,
    allSizes: input.allSizes ?? true,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
  };

  validateFlavor(data);

  const sizeIds = normalizeSizeIds(data.sizeIds);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await assertPizzaSubcategory(
      client,
      data.subcategoryId,
    );

    await assertSizes(client, sizeIds);

    const result = await client.query<{ id: number }>(`
      INSERT INTO public."PizzaFlavor" (
        "subcategoryId",
        name,
        description,
        "imageUrl",
        "additionalPriceCents",
        "isPremium",
        "premiumAdditionalCents",
        "allSizes",
        "isActive",
        "sortOrder",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, NOW()
      )
      RETURNING id
    `, [
      data.subcategoryId,
      data.name,
      data.description,
      data.imageUrl,
      data.additionalPriceCents,
      data.isPremium,
      data.premiumAdditionalCents,
      data.allSizes,
      data.isActive,
      data.sortOrder,
    ]);

    const id = result.rows[0]!.id;

    if (!data.allSizes) {
      await replaceSizeLinks(client, id, sizeIds);
    }

    const created = await findWithSizes(client, id);

    await client.query("COMMIT");

    return created!;
  } catch (error) {
    await client.query("ROLLBACK");
    return handleDatabaseError(error);
  } finally {
    client.release();
  }
}

// ============================================
// EDITAR SABOR
// ============================================

export async function updateCatalogPizzaFlavor(
  id: number,
  patch: CatalogPizzaFlavorUpdateInput,
): Promise<CatalogPizzaFlavorWithSizes> {
  positiveId(id, "Sabor");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const locked = await client.query(`
      SELECT id
      FROM public."PizzaFlavor"
      WHERE id = $1
      FOR UPDATE
    `, [id]);

    if (!locked.rows[0]) {
      throw new PizzaCatalogFlavorError(
        "Sabor não encontrado.",
        404,
      );
    }

    const current = await findWithSizes(client, id);

    if (!current) {
      throw new PizzaCatalogFlavorError(
        "Sabor não encontrado.",
        404,
      );
    }

    const allSizes = patch.allSizes ?? current.allSizes;

    const sizeIds = patch.sizeIds !== undefined
      ? patch.sizeIds
      : current.sizeIds;

    const isPremium = patch.isPremium ?? current.isPremium;

    const next: CatalogPizzaFlavorInput = {
      subcategoryId:
        patch.subcategoryId ?? current.subcategoryId,

      name: patch.name ?? current.name,

      description: patch.description === undefined
        ? current.description
        : patch.description,

      imageUrl: patch.imageUrl === undefined
        ? current.imageUrl
        : patch.imageUrl,

      additionalPriceCents:
        patch.additionalPriceCents ??
        current.additionalPriceCents,

      isPremium,

      premiumAdditionalCents: isPremium
        ? (
          patch.premiumAdditionalCents ??
          current.premiumAdditionalCents
        )
        : 0,

      allSizes,

      sizeIds: allSizes ? [] : sizeIds,

      isActive: patch.isActive ?? current.isActive,

      sortOrder: patch.sortOrder ?? current.sortOrder,
    };

    next.name = next.name?.trim();
    next.description = next.description?.trim() || null;
    next.imageUrl = next.imageUrl?.trim() || null;

    validateFlavor(next);

    await assertPizzaSubcategory(
      client,
      next.subcategoryId,
    );

    const validatedSizeIds =
      normalizeSizeIds(next.sizeIds);

    await assertSizes(client, validatedSizeIds);

    await client.query(`
      UPDATE public."PizzaFlavor"
      SET
        "subcategoryId" = $2,
        name = $3,
        description = $4,
        "imageUrl" = $5,
        "additionalPriceCents" = $6,
        "isPremium" = $7,
        "premiumAdditionalCents" = $8,
        "allSizes" = $9,
        "isActive" = $10,
        "sortOrder" = $11,
        "updatedAt" = NOW()
      WHERE id = $1
    `, [
      id,
      next.subcategoryId,
      next.name,
      next.description,
      next.imageUrl,
      next.additionalPriceCents,
      next.isPremium,
      next.premiumAdditionalCents,
      next.allSizes,
      next.isActive,
      next.sortOrder,
    ]);

    await replaceSizeLinks(
      client,
      id,
      validatedSizeIds,
    );

    const updated = await findWithSizes(client, id);

    await client.query("COMMIT");

    return updated!;
  } catch (error) {
    await client.query("ROLLBACK");
    return handleDatabaseError(error);
  } finally {
    client.release();
  }
}

// ============================================
// DESATIVAR SABOR
// ============================================

export async function deactivateCatalogPizzaFlavor(
  id: number,
): Promise<CatalogPizzaFlavorWithSizes> {
  return updateCatalogPizzaFlavor(id, {
    isActive: false,
  });
}

// ============================================
// REATIVAR SABOR
// ============================================

export async function reactivateCatalogPizzaFlavor(
  id: number,
): Promise<CatalogPizzaFlavorWithSizes> {
  return updateCatalogPizzaFlavor(id, {
    isActive: true,
  });
}

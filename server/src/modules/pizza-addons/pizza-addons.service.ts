
import { pool } from "../../lib/db.js";
import type { PoolClient } from "pg";

// ============================================
// TIPOS
// ============================================

export interface PizzaAddon {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  linkId: number;
  linkIsActive: boolean;
  sortOrder: number;
}

export interface AddonSubcategoryLink {
  id: number;
  addonId: number;
  subcategoryId: number;
  isActive: boolean;
  sortOrder: number;
}

export interface PizzaFlavorAddonLink {
  id: number;
  pizzaFlavorId: number;
  addonId: number;
  isActive: boolean;
  sortOrder: number;
}

export interface BulkSubcategoryAddonInput {
  subcategoryIds: number[];
  addonIds: number[];
  sortOrder?: number;
}

export interface BulkFlavorAddonInput {
  flavorIds: number[];
  addonIds: number[];
  sortOrder?: number;
}

export interface BulkLinkResult {
  linked: number;
  message: string;
}

export class PizzaAddonError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "PizzaAddonError";
  }
}

const MAX_INT = 2_147_483_647;

// ============================================
// VALIDAÇÕES
// ============================================

function validateId(
  value: number,
  field: string,
): void {
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_INT
  ) {
    throw new PizzaAddonError(
      `${field} inválido.`,
    );
  }
}

function validateSortOrder(value: number): void {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_INT
  ) {
    throw new PizzaAddonError(
      "Ordem de exibição inválida.",
    );
  }
}

function normalizeIds(
  ids: number[],
  field: string,
): number[] {
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 100
  ) {
    throw new PizzaAddonError(
      `${field}: informe entre 1 e 100 IDs.`,
    );
  }

  const unique = [...new Set(ids)];

  unique.forEach((id) =>
    validateId(id, field),
  );

  return unique;
}

// ============================================
// VERIFICAR SUBCATEGORIAS DE PIZZAS
// ============================================

async function assertPizzaSubcategories(
  client: PoolClient,
  ids: number[],
): Promise<void> {
  const result = await client.query(
    `
      SELECT s.id
      FROM public."Subcategory" s
      JOIN public."Category" c
        ON c.id = s."categoryId"
      WHERE s.id = ANY($1::int[])
        AND c.slug IN ('pizza', 'pizzas')
        AND s.slug IN ('salgadas', 'doces')
    `,
    [ids],
  );

  if (result.rows.length !== ids.length) {
    throw new PizzaAddonError(
      "Uma ou mais subcategorias não pertencem às pizzas.",
    );
  }
}

// ============================================
// VERIFICAR SABORES
// ============================================

async function assertPizzaFlavors(
  client: PoolClient,
  ids: number[],
): Promise<void> {
  const result = await client.query(
    `
      SELECT f.id
      FROM public."PizzaFlavor" f
      JOIN public."Subcategory" s
        ON s.id = f."subcategoryId"
      JOIN public."Category" c
        ON c.id = s."categoryId"
      WHERE f.id = ANY($1::int[])
        AND c.slug IN ('pizza', 'pizzas')
        AND s.slug IN ('salgadas', 'doces')
    `,
    [ids],
  );

  if (result.rows.length !== ids.length) {
    throw new PizzaAddonError(
      "Um ou mais sabores não pertencem ao catálogo de pizzas.",
    );
  }
}

// ============================================
// VERIFICAR ADICIONAIS
// ============================================

async function assertAddons(
  client: PoolClient,
  ids: number[],
): Promise<void> {
  const result = await client.query(
    `
      SELECT id
      FROM public."Addon"
      WHERE id = ANY($1::int[])
    `,
    [ids],
  );

  if (result.rows.length !== ids.length) {
    throw new PizzaAddonError(
      "Um ou mais adicionais não foram encontrados.",
      404,
    );
  }
}

// ============================================
// TRATAMENTO DE ERROS DO BANCO
// ============================================

function handleDatabaseError(error: unknown): never {
  if (error instanceof PizzaAddonError) {
    throw error;
  }

  const pgError = error as {
    code?: string;
  } | null;

  if (pgError?.code === "23505") {
    throw new PizzaAddonError(
      "O vínculo já está cadastrado.",
      409,
    );
  }

  if (pgError?.code === "23503") {
    throw new PizzaAddonError(
      "Adicional, sabor ou subcategoria não encontrado.",
    );
  }

  if (
    pgError?.code === "23514" ||
    pgError?.code === "22P02" ||
    pgError?.code === "22003"
  ) {
    throw new PizzaAddonError(
      "Dados inválidos para o banco.",
    );
  }

  throw error;
}

// ============================================
// LISTAR ADICIONAIS POR SUBCATEGORIA
// ============================================

export async function listSubcategoryPizzaAddons(
  subcategoryId: number,
  includeInactive = false,
): Promise<PizzaAddon[]> {
  validateId(subcategoryId, "Subcategoria");

  const result = await pool.query<PizzaAddon>(
    `
      SELECT
        a.id,
        a.name,
        a.description,
        a."imageUrl",
        a."priceCents",
        a."isActive",
        l.id AS "linkId",
        l."isActive" AS "linkIsActive",
        l."sortOrder"
      FROM public."AddonSubcategory" l
      JOIN public."Addon" a
        ON a.id = l."addonId"
      JOIN public."Subcategory" s
        ON s.id = l."subcategoryId"
      JOIN public."Category" c
        ON c.id = s."categoryId"
      WHERE l."subcategoryId" = $1
        AND c.slug IN ('pizza', 'pizzas')
        AND s.slug IN ('salgadas', 'doces')
        AND (
          $2::boolean
          OR (
            l."isActive" = true
            AND a."isActive" = true
          )
        )
      ORDER BY l."sortOrder", a.name
    `,
    [subcategoryId, includeInactive],
  );

  return result.rows;
}

// ============================================
// LISTAR ADICIONAIS POR SABOR
// ============================================

export async function listFlavorPizzaAddons(
  flavorId: number,
  includeInactive = false,
): Promise<PizzaAddon[]> {
  validateId(flavorId, "Sabor");

  const result = await pool.query<PizzaAddon>(
    `
      SELECT
        a.id,
        a.name,
        a.description,
        a."imageUrl",
        a."priceCents",
        a."isActive",
        l.id AS "linkId",
        l."isActive" AS "linkIsActive",
        l."sortOrder"
      FROM public."PizzaFlavorAddon" l
      JOIN public."Addon" a
        ON a.id = l."addonId"
      JOIN public."PizzaFlavor" f
        ON f.id = l."pizzaFlavorId"
      JOIN public."Subcategory" s
        ON s.id = f."subcategoryId"
      JOIN public."Category" c
        ON c.id = s."categoryId"
      WHERE l."pizzaFlavorId" = $1
        AND c.slug IN ('pizza', 'pizzas')
        AND s.slug IN ('salgadas', 'doces')
        AND (
          $2::boolean
          OR (
            l."isActive" = true
            AND a."isActive" = true
            AND f."isActive" = true
          )
        )
      ORDER BY l."sortOrder", a.name
    `,
    [flavorId, includeInactive],
  );

  return result.rows;
}

// ============================================
// VINCULAR ADICIONAIS A SUBCATEGORIAS
// ============================================

export async function linkSubcategoryPizzaAddonsBulk(
  input: BulkSubcategoryAddonInput,
): Promise<BulkLinkResult> {
  const subcategoryIds = normalizeIds(
    input.subcategoryIds,
    "Subcategorias",
  );

  const addonIds = normalizeIds(
    input.addonIds,
    "Adicionais",
  );

  const sortOrder = input.sortOrder ?? 0;
  validateSortOrder(sortOrder);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await assertPizzaSubcategories(
      client,
      subcategoryIds,
    );

    await assertAddons(client, addonIds);

    const result = await client.query(
      `
        INSERT INTO public."AddonSubcategory" (
          "addonId",
          "subcategoryId",
          "isActive",
          "sortOrder"
        )
        SELECT
          a.id,
          s.id,
          true,
          $3
        FROM unnest($1::int[]) AS a(id)
        CROSS JOIN unnest($2::int[]) AS s(id)
        ON CONFLICT ("addonId", "subcategoryId")
        DO UPDATE SET
          "isActive" = true,
          "sortOrder" = EXCLUDED."sortOrder"
        RETURNING id
      `,
      [addonIds, subcategoryIds, sortOrder],
    );

    await client.query("COMMIT");

    return {
      linked: result.rowCount ?? 0,
      message:
        "Adicionais vinculados às subcategorias.",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    return handleDatabaseError(error);
  } finally {
    client.release();
  }
}

// ============================================
// VINCULAR ADICIONAIS A SABORES
// ============================================

export async function linkFlavorPizzaAddonsBulk(
  input: BulkFlavorAddonInput,
): Promise<BulkLinkResult> {
  const flavorIds = normalizeIds(
    input.flavorIds,
    "Sabores",
  );

  const addonIds = normalizeIds(
    input.addonIds,
    "Adicionais",
  );

  const sortOrder = input.sortOrder ?? 0;
  validateSortOrder(sortOrder);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await assertPizzaFlavors(client, flavorIds);
    await assertAddons(client, addonIds);

    const result = await client.query(
      `
        INSERT INTO public."PizzaFlavorAddon" (
          "pizzaFlavorId",
          "addonId",
          "isActive",
          "sortOrder"
        )
        SELECT
          f.id,
          a.id,
          true,
          $3
        FROM unnest($1::int[]) AS f(id)
        CROSS JOIN unnest($2::int[]) AS a(id)
        ON CONFLICT ("pizzaFlavorId", "addonId")
        DO UPDATE SET
          "isActive" = true,
          "sortOrder" = EXCLUDED."sortOrder"
        RETURNING id
      `,
      [flavorIds, addonIds, sortOrder],
    );

    await client.query("COMMIT");

    return {
      linked: result.rowCount ?? 0,
      message:
        "Adicionais vinculados aos sabores.",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    return handleDatabaseError(error);
  } finally {
    client.release();
  }
}

// ============================================
// DESVINCULAR ADICIONAL DE SUBCATEGORIA
// ============================================

export async function unlinkSubcategoryPizzaAddon(
  subcategoryId: number,
  addonId: number,
): Promise<boolean> {
  validateId(subcategoryId, "Subcategoria");
  validateId(addonId, "Adicional");

  const result = await pool.query(
    `
      UPDATE public."AddonSubcategory"
      SET "isActive" = false
      WHERE "subcategoryId" = $1
        AND "addonId" = $2
        AND "isActive" = true
      RETURNING id
    `,
    [subcategoryId, addonId],
  );

  return (result.rowCount ?? 0) > 0;
}

// ============================================
// DESVINCULAR ADICIONAL DE SABOR
// ============================================

export async function unlinkFlavorPizzaAddon(
  flavorId: number,
  addonId: number,
): Promise<boolean> {
  validateId(flavorId, "Sabor");
  validateId(addonId, "Adicional");

  const result = await pool.query(
    `
      UPDATE public."PizzaFlavorAddon"
      SET "isActive" = false
      WHERE "pizzaFlavorId" = $1
        AND "addonId" = $2
        AND "isActive" = true
      RETURNING id
    `,
    [flavorId, addonId],
  );

  return (result.rowCount ?? 0) > 0;
}

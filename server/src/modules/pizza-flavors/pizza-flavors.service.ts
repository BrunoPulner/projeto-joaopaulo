import { pool } from "../../lib/db.js";
import type { PoolClient } from "pg";

export type PizzaFlavorType = "SAVORY" | "SWEET";

export interface PizzaFlavor {
  id: number;
  productId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  flavorType: PizzaFlavorType;
  additionalPriceCents: number;
  isPremium: boolean;
  premiumAdditionalCents: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PizzaFlavorInput {
  productId: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  flavorType: PizzaFlavorType;
  additionalPriceCents: number;
  isPremium?: boolean;
  premiumAdditionalCents?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export type PizzaFlavorUpdateInput = Partial<Omit<PizzaFlavorInput, "productId">>;

export interface FlavorAddon {
  id: number;
  productFlavorId: number;
  addonId: number;
  isActive: boolean;
  sortOrder: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  addonIsActive: boolean;
}

export class PizzaFlavorError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "PizzaFlavorError";
  }
}

const flavorFields = `
  id, "productId", name, description, "imageUrl", "flavorType",
  "additionalPriceCents", "isPremium", "premiumAdditionalCents",
  "isActive", "sortOrder", "createdAt", "updatedAt"
`;

const MAX_INTEGER = 2147483647;

function requirePositiveId(id: number, field: string): void {
  if (!Number.isInteger(id) || id < 1 || id > MAX_INTEGER) {
    throw new PizzaFlavorError(`${field} inválido.`);
  }
}

function requireNonnegativeInt(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_INTEGER) {
    throw new PizzaFlavorError(`${field} deve ser um inteiro não negativo.`);
  }
}

function validateFlavor(data: PizzaFlavorInput): void {
  requirePositiveId(data.productId, "Produto");
  if (data.name.trim().length < 2 || data.name.trim().length > 150) {
    throw new PizzaFlavorError("O nome do sabor deve ter entre 2 e 150 caracteres.");
  }
  if (data.flavorType !== "SAVORY" && data.flavorType !== "SWEET") {
    throw new PizzaFlavorError("Tipo de sabor inválido.");
  }
  requireNonnegativeInt(data.additionalPriceCents, "Acréscimo do sabor");
  requireNonnegativeInt(data.premiumAdditionalCents ?? 0, "Acréscimo nobre");
  requireNonnegativeInt(data.sortOrder ?? 0, "Ordem");
  if (!data.isPremium && (data.premiumAdditionalCents ?? 0) !== 0) {
    throw new PizzaFlavorError("Sabores comuns não podem ter acréscimo nobre.");
  }
}

async function assertPizza(client: PoolClient, productId: number): Promise<void> {
  requirePositiveId(productId, "Produto");
  const result = await client.query<{ pricingType: string; slug: string }>(`
    SELECT p."pricingType", c.slug
    FROM public."Product" p
    JOIN public."Category" c ON c.id = p."categoryId"
    WHERE p.id = $1
  `, [productId]);
  const product = result.rows[0];
  if (!product) throw new PizzaFlavorError("Pizza não encontrada.", 404);
  if (product.pricingType !== "PIZZA_CUSTOM" || !["pizza", "pizzas"].includes(product.slug.toLowerCase())) {
    throw new PizzaFlavorError("Os sabores só podem ser cadastrados em produtos da categoria pizzas.");
  }
}

async function getFlavor(client: PoolClient, id: number): Promise<PizzaFlavor> {
  requirePositiveId(id, "Sabor");
  const result = await client.query<PizzaFlavor>(`
    SELECT ${flavorFields} FROM public."ProductFlavor" WHERE id = $1
  `, [id]);
  if (!result.rows[0]) throw new PizzaFlavorError("Sabor não encontrado.", 404);
  return result.rows[0];
}

export async function listPizzaFlavors(productId: number, includeInactive = false): Promise<PizzaFlavor[]> {
  const client = await pool.connect();
  try {
    await assertPizza(client, productId);
    const result = await client.query<PizzaFlavor>(`
      SELECT ${flavorFields}
      FROM public."ProductFlavor"
      WHERE "productId" = $1 AND ($2::boolean OR "isActive" = true)
      ORDER BY "sortOrder" ASC, name ASC
    `, [productId, includeInactive]);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function findPizzaFlavorById(id: number): Promise<PizzaFlavor | null> {
  requirePositiveId(id, "Sabor");
  const result = await pool.query<PizzaFlavor>(`
    SELECT ${flavorFields} FROM public."ProductFlavor" WHERE id = $1
  `, [id]);
  return result.rows[0] ?? null;
}

export async function createPizzaFlavor(input: PizzaFlavorInput): Promise<PizzaFlavor> {
  validateFlavor(input);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await assertPizza(client, input.productId);
    const result = await client.query<PizzaFlavor>(`
      INSERT INTO public."ProductFlavor" (
        "productId", name, description, "imageUrl", "flavorType",
        "additionalPriceCents", "isPremium", "premiumAdditionalCents",
        "isActive", "sortOrder", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      RETURNING ${flavorFields}
    `, [
      input.productId, input.name.trim(), input.description ?? null,
      input.imageUrl ?? null, input.flavorType, input.additionalPriceCents,
      input.isPremium ?? false, input.isPremium ? (input.premiumAdditionalCents ?? 0) : 0,
      input.isActive ?? true, input.sortOrder ?? 0,
    ]);
    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updatePizzaFlavor(id: number, patch: PizzaFlavorUpdateInput): Promise<PizzaFlavor> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await getFlavor(client, id);
    const next: PizzaFlavorInput = {
      productId: current.productId,
      name: patch.name ?? current.name,
      description: patch.description === undefined ? current.description : patch.description,
      imageUrl: patch.imageUrl === undefined ? current.imageUrl : patch.imageUrl,
      flavorType: patch.flavorType ?? current.flavorType,
      additionalPriceCents: patch.additionalPriceCents ?? current.additionalPriceCents,
      isPremium: patch.isPremium ?? current.isPremium,
      premiumAdditionalCents: patch.isPremium === false ? 0 : (patch.premiumAdditionalCents ?? current.premiumAdditionalCents),
      isActive: patch.isActive ?? current.isActive,
      sortOrder: patch.sortOrder ?? current.sortOrder,
    };
    validateFlavor(next);
    const result = await client.query<PizzaFlavor>(`
      UPDATE public."ProductFlavor"
      SET name=$2, description=$3, "imageUrl"=$4, "flavorType"=$5,
          "additionalPriceCents"=$6, "isPremium"=$7, "premiumAdditionalCents"=$8,
          "isActive"=$9, "sortOrder"=$10, "updatedAt"=NOW()
      WHERE id=$1 RETURNING ${flavorFields}
    `, [
      id, next.name.trim(), next.description, next.imageUrl, next.flavorType,
      next.additionalPriceCents, next.isPremium, next.premiumAdditionalCents,
      next.isActive, next.sortOrder,
    ]);
    await client.query("COMMIT");
    return result.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deactivatePizzaFlavor(id: number): Promise<PizzaFlavor> {
  return updatePizzaFlavor(id, { isActive: false });
}

export async function listFlavorAddons(flavorId: number, includeInactive = false): Promise<FlavorAddon[]> {
  requirePositiveId(flavorId, "Sabor");
  const result = await pool.query<FlavorAddon>(`
    SELECT fa.id, fa."productFlavorId", fa."addonId", fa."isActive", fa."sortOrder",
           a.name, a.description, a."imageUrl", a."priceCents", a."isActive" AS "addonIsActive"
    FROM public."ProductFlavorAddon" fa
    JOIN public."Addon" a ON a.id = fa."addonId"
    WHERE fa."productFlavorId" = $1
      AND ($2::boolean OR (fa."isActive" = true AND a."isActive" = true))
    ORDER BY fa."sortOrder" ASC, a.name ASC
  `, [flavorId, includeInactive]);
  return result.rows;
}

export interface BulkFlavorAddonsInput {
  flavorIds: number[];
  addonIds: number[];
}

export async function linkFlavorAddonsBulk(input: BulkFlavorAddonsInput): Promise<{ linked: number }> {
  const flavorIds = [...new Set(input.flavorIds)];
  const addonIds = [...new Set(input.addonIds)];
  if (!flavorIds.length || !addonIds.length || flavorIds.length > 100 || addonIds.length > 100) {
    throw new PizzaFlavorError("Selecione entre 1 e 100 sabores e adicionais.");
  }
  flavorIds.forEach((id) => requirePositiveId(id, "Sabor"));
  addonIds.forEach((id) => requirePositiveId(id, "Adicional"));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const flavors = await client.query<{ id: number; productId: number; categoryId: number; flavorType: PizzaFlavorType }>(`
      SELECT f.id, f."productId", p."categoryId", f."flavorType"
      FROM public."ProductFlavor" f
      JOIN public."Product" p ON p.id = f."productId"
      WHERE f.id = ANY($1::int[]) AND f."isActive" = true
      FOR UPDATE OF f
    `, [flavorIds]);
    if (flavors.rowCount !== flavorIds.length) {
      throw new PizzaFlavorError("Um ou mais sabores não existem ou estão desativados.");
    }
    const addons = await client.query<{ id: number }>(`
      SELECT id FROM public."Addon"
      WHERE id = ANY($1::int[]) AND "isActive" = true
    `, [addonIds]);
    if (addons.rowCount !== addonIds.length) {
      throw new PizzaFlavorError("Um ou mais adicionais não existem ou estão desativados.");
    }
    const categoryIds = [...new Set(flavors.rows.map((row) => row.categoryId))];
    const allowed = await client.query<{ addonId: number; categoryId: number }>(`
      SELECT "addonId", "categoryId"
      FROM public."AddonCategory"
      WHERE "addonId" = ANY($1::int[]) AND "categoryId" = ANY($2::int[])
    `, [addonIds, categoryIds]);
    const allowedPairs = new Set(allowed.rows.map((row) => `${row.addonId}:${row.categoryId}`));
    for (const flavor of flavors.rows) {
      for (const addonId of addonIds) {
        if (!allowedPairs.has(`${addonId}:${flavor.categoryId}`)) {
          throw new PizzaFlavorError(`O adicional ${addonId} não está habilitado para a categoria da pizza.`);
        }
      }
    }
    const result = await client.query(`
      INSERT INTO public."ProductFlavorAddon" ("productFlavorId", "addonId", "isActive")
      SELECT f.id, a.id, true
      FROM unnest($1::int[]) AS f(id)
      CROSS JOIN unnest($2::int[]) AS a(id)
      ON CONFLICT ("productFlavorId", "addonId")
      DO UPDATE SET "isActive" = true
    `, [flavorIds, addonIds]);
    await client.query("COMMIT");
    return { linked: result.rowCount ?? 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function unlinkFlavorAddon(flavorId: number, addonId: number): Promise<boolean> {
  requirePositiveId(flavorId, "Sabor");
  requirePositiveId(addonId, "Adicional");
  const result = await pool.query(`
    UPDATE public."ProductFlavorAddon"
    SET "isActive" = false
    WHERE "productFlavorId" = $1 AND "addonId" = $2 AND "isActive" = true
  `, [flavorId, addonId]);
  return (result.rowCount ?? 0) > 0;
}

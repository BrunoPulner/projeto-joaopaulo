
import { pool } from "../../lib/db.js";

export interface PizzaSize {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  slices: number;
  diameterCm: number | null;
  basePriceCents: number;
  maxFlavors: number;
  isActive: boolean;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PizzaSizeInput {
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  slices: number;
  diameterCm?: number | null;
  basePriceCents: number;
  maxFlavors?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
}

export type PizzaSizeUpdateInput = Partial<PizzaSizeInput>;

export class PizzaSizeError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "PizzaSizeError";
  }
}

const MAX_INTEGER = 2147483647;

const sizeFields = `
  id,
  name,
  slug,
  description,
  "imageUrl",
  slices,
  "diameterCm",
  "basePriceCents",
  "maxFlavors",
  "isActive",
  "isAvailable",
  "sortOrder",
  "createdAt",
  "updatedAt"
`;

function requirePositiveId(id: number): void {
  if (!Number.isInteger(id) || id < 1 || id > MAX_INTEGER) {
    throw new PizzaSizeError("ID do tamanho inválido.");
  }
}

function requireInteger(
  value: number,
  field: string,
  min: number,
  max = MAX_INTEGER,
): void {
  if (
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new PizzaSizeError(
      `${field} deve ser um número inteiro entre ${min} e ${max}.`,
    );
  }
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const text = value?.trim();
  return text || null;
}

function validateSize(input: PizzaSizeInput): void {
  if (
    typeof input.name !== "string" ||
    input.name.trim().length < 2 ||
    input.name.trim().length > 100
  ) {
    throw new PizzaSizeError(
      "O nome do tamanho deve ter entre 2 e 100 caracteres.",
    );
  }

  if (!input.slug || input.slug.length > 100) {
    throw new PizzaSizeError("Slug do tamanho inválido.");
  }

  if (
    input.description != null &&
    input.description.length > 2000
  ) {
    throw new PizzaSizeError(
      "A descrição deve ter no máximo 2000 caracteres.",
    );
  }

  if (
    input.imageUrl != null &&
    input.imageUrl.trim() !== "" &&
    !input.imageUrl.startsWith("/") &&
    !/^https?:\/\//i.test(input.imageUrl)
  ) {
    throw new PizzaSizeError("URL da imagem inválida.");
  }

  requireInteger(input.slices, "Quantidade de fatias", 1, 100);

  if (input.diameterCm != null) {
    requireInteger(input.diameterCm, "Diâmetro", 1, 200);
  }

  requireInteger(
    input.basePriceCents,
    "Preço-base",
    1,
  );

  requireInteger(
    input.maxFlavors ?? 2,
    "Máximo de sabores",
    1,
    2,
  );

  requireInteger(
    input.sortOrder ?? 0,
    "Ordem de exibição",
    0,
  );

  if (
    input.isActive !== undefined &&
    typeof input.isActive !== "boolean"
  ) {
    throw new PizzaSizeError("Status ativo inválido.");
  }

  if (
    input.isAvailable !== undefined &&
    typeof input.isAvailable !== "boolean"
  ) {
    throw new PizzaSizeError("Disponibilidade inválida.");
  }
}

function prepareInput(input: PizzaSizeInput): PizzaSizeInput {
  const name =
    typeof input.name === "string"
      ? input.name.trim().replace(/\s+/g, " ")
      : "";

  const slug = normalizeSlug(input.slug || name);

  const prepared: PizzaSizeInput = {
    ...input,
    name,
    slug,
    description: normalizeOptionalText(input.description),
    imageUrl: normalizeOptionalText(input.imageUrl),
    diameterCm: input.diameterCm ?? null,
    maxFlavors: input.maxFlavors ?? 2,
    isActive: input.isActive ?? true,
    isAvailable: input.isAvailable ?? true,
    sortOrder: input.sortOrder ?? 0,
  };

  validateSize(prepared);

  return prepared;
}

function handleDatabaseError(error: unknown): never {
  if (
    error instanceof PizzaSizeError
  ) {
    throw error;
  }

  const databaseError = error as {
    code?: string;
    constraint?: string;
  };

  if (databaseError.code === "23505") {
    throw new PizzaSizeError(
      "Já existe um tamanho de pizza com esse identificador.",
      409,
    );
  }

  if (databaseError.code === "23514") {
    throw new PizzaSizeError(
      "Os dados do tamanho não atendem às regras do banco.",
      400,
    );
  }

  throw error;
}

// ============================================
// LISTAGEM PÚBLICA
// ============================================

export async function listPublicPizzaSizes(): Promise<PizzaSize[]> {
  const result = await pool.query<PizzaSize>(`
    SELECT ${sizeFields}
    FROM public."PizzaSize"
    WHERE "isActive" = true
      AND "isAvailable" = true
    ORDER BY "sortOrder" ASC, "basePriceCents" ASC, name ASC
  `);

  return result.rows;
}

// ============================================
// LISTAGEM ADMINISTRATIVA
// ============================================

export async function listAdminPizzaSizes(): Promise<PizzaSize[]> {
  const result = await pool.query<PizzaSize>(`
    SELECT ${sizeFields}
    FROM public."PizzaSize"
    ORDER BY "sortOrder" ASC, "basePriceCents" ASC, id ASC
  `);

  return result.rows;
}

// ============================================
// CONSULTAR TAMANHO
// ============================================

export async function findPizzaSizeById(
  id: number,
): Promise<PizzaSize | null> {
  requirePositiveId(id);

  const result = await pool.query<PizzaSize>(`
    SELECT ${sizeFields}
    FROM public."PizzaSize"
    WHERE id = $1
  `, [id]);

  return result.rows[0] ?? null;
}

// ============================================
// CADASTRAR TAMANHO
// ============================================

export async function createPizzaSize(
  input: PizzaSizeInput,
): Promise<PizzaSize> {
  const data = prepareInput(input);

  try {
    const result = await pool.query<PizzaSize>(`
      INSERT INTO public."PizzaSize" (
        name,
        slug,
        description,
        "imageUrl",
        slices,
        "diameterCm",
        "basePriceCents",
        "maxFlavors",
        "isActive",
        "isAvailable",
        "sortOrder",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, NOW()
      )
      RETURNING ${sizeFields}
    `, [
      data.name,
      data.slug,
      data.description,
      data.imageUrl,
      data.slices,
      data.diameterCm,
      data.basePriceCents,
      data.maxFlavors,
      data.isActive,
      data.isAvailable,
      data.sortOrder,
    ]);

    return result.rows[0]!;
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// ============================================
// EDITAR TAMANHO
// ============================================

export async function updatePizzaSize(
  id: number,
  patch: PizzaSizeUpdateInput,
): Promise<PizzaSize> {
  requirePositiveId(id);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query<PizzaSize>(`
      SELECT ${sizeFields}
      FROM public."PizzaSize"
      WHERE id = $1
      FOR UPDATE
    `, [id]);

    const current = currentResult.rows[0];

    if (!current) {
      throw new PizzaSizeError(
        "Tamanho de pizza não encontrado.",
        404,
      );
    }

    const next = prepareInput({
      name: patch.name ?? current.name,
      slug: patch.slug ?? current.slug,
      description:
        patch.description === undefined
          ? current.description
          : patch.description,
      imageUrl:
        patch.imageUrl === undefined
          ? current.imageUrl
          : patch.imageUrl,
      slices: patch.slices ?? current.slices,
      diameterCm:
        patch.diameterCm === undefined
          ? current.diameterCm
          : patch.diameterCm,
      basePriceCents:
        patch.basePriceCents ?? current.basePriceCents,
      maxFlavors:
        patch.maxFlavors ?? current.maxFlavors,
      isActive:
        patch.isActive ?? current.isActive,
      isAvailable:
        patch.isAvailable ?? current.isAvailable,
      sortOrder:
        patch.sortOrder ?? current.sortOrder,
    });

    const result = await client.query<PizzaSize>(`
      UPDATE public."PizzaSize"
      SET
        name = $2,
        slug = $3,
        description = $4,
        "imageUrl" = $5,
        slices = $6,
        "diameterCm" = $7,
        "basePriceCents" = $8,
        "maxFlavors" = $9,
        "isActive" = $10,
        "isAvailable" = $11,
        "sortOrder" = $12,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING ${sizeFields}
    `, [
      id,
      next.name,
      next.slug,
      next.description,
      next.imageUrl,
      next.slices,
      next.diameterCm,
      next.basePriceCents,
      next.maxFlavors,
      next.isActive,
      next.isAvailable,
      next.sortOrder,
    ]);

    await client.query("COMMIT");

    return result.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    return handleDatabaseError(error);
  } finally {
    client.release();
  }
}

// ============================================
// DESATIVAR TAMANHO
// ============================================

export async function deactivatePizzaSize(
  id: number,
): Promise<PizzaSize> {
  return updatePizzaSize(id, {
    isActive: false,
  });
}

// ============================================
// REATIVAR TAMANHO
// ============================================

export async function reactivatePizzaSize(
  id: number,
): Promise<PizzaSize> {
  return updatePizzaSize(id, {
    isActive: true,
  });
}

// ============================================
// ALTERAR DISPONIBILIDADE
// ============================================

export async function setPizzaSizeAvailability(
  id: number,
  isAvailable: boolean,
): Promise<PizzaSize> {
  if (typeof isAvailable !== "boolean") {
    throw new PizzaSizeError(
      "Disponibilidade inválida.",
    );
  }

  return updatePizzaSize(id, {
    isAvailable,
  });
}

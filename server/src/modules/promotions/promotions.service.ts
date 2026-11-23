
import type { PoolClient } from "pg";

import { pool } from "../../lib/db.js";

import type {
  CreatePromotionInput,
  CreatePromotionGroupInput,
  UpdatePromotionGroupInput,
  AdminPromotionGroup,
  Promotion,
  PublicPromotion,
  UpdatePromotionInput,
} from "./promotions.types.js";

// ============================================
// ERROS DE NEGÓCIO
// ============================================

export class PromotionServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "PromotionServiceError";
  }
}

// ============================================
// CONSTANTES
// ============================================

const MAX_INTEGER = 2_147_483_647;

const promotionFields = `
  id,
  name,
  "targetType",
  "productId",
  "pizzaFlavorId",
  "groupId",
  "promotionalPriceCents",
  "isActive",
  "startsAt",
  "endsAt",
  "createdAt",
  "updatedAt"
`;

// ============================================
// VALIDAÇÕES
// ============================================

function assertId(id: number): void {
  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    id > MAX_INTEGER
  ) {
    throw new PromotionServiceError(
      "Identificador inválido.",
    );
  }
}

function assertPrice(price: number): void {
  if (
    !Number.isSafeInteger(price) ||
    price <= 0 ||
    price > MAX_INTEGER
  ) {
    throw new PromotionServiceError(
      "O preço promocional deve ser um valor positivo em centavos.",
    );
  }
}

function validateDates(
  startsAt: string | Date | null,
  endsAt: string | Date | null,
): void {
  const start = startsAt
    ? new Date(startsAt).getTime()
    : null;

  const end = endsAt
    ? new Date(endsAt).getTime()
    : null;

  if (
    (start !== null && !Number.isFinite(start)) ||
    (end !== null && !Number.isFinite(end))
  ) {
    throw new PromotionServiceError(
      "Período da promoção inválido.",
    );
  }

  if (
    start !== null &&
    end !== null &&
    end <= start
  ) {
    throw new PromotionServiceError(
      "A data de término deve ser posterior à data de início.",
    );
  }
}

// ============================================
// TRATAMENTO DE ERROS DO POSTGRES
// ============================================

function handleDatabaseError(error: unknown): never {
  const dbError = error as {
    code?: string;
    constraint?: string;
  };

  if (dbError.code === "23505") {
    throw new PromotionServiceError(
      "Já existe uma promoção ativa para este produto ou sabor. Desative a promoção anterior antes de ativar outra.",
      409,
    );
  }

  if (dbError.code === "23503") {
    throw new PromotionServiceError(
      "O produto ou sabor vinculado não existe.",
      404,
    );
  }

  if (dbError.code === "23514") {
    throw new PromotionServiceError(
      "Os dados da promoção violam uma regra do banco de dados.",
    );
  }

  throw error;
}

// ============================================
// BUSCAR PROMOÇÃO POR ID
// ============================================

async function getPromotion(
  client: PoolClient,
  id: number,
  lock = false,
): Promise<Promotion> {
  assertId(id);

  const result = await client.query<Promotion>(
    `
    SELECT ${promotionFields}
    FROM public."Promotion"
    WHERE id = $1
    ${lock ? "FOR UPDATE" : ""}
    `,
    [id],
  );

  const promotion = result.rows[0];

  if (!promotion) {
    throw new PromotionServiceError(
      "Promoção não encontrada.",
      404,
    );
  }

  return promotion;
}

export async function findPromotionById(
  id: number,
): Promise<Promotion | null> {
  assertId(id);

  const result = await pool.query<Promotion>(
    `
    SELECT ${promotionFields}
    FROM public."Promotion"
    WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

// ============================================
// VALIDAR PRODUTO OU SABOR
// ============================================

async function validatePromotionTarget(
  client: PoolClient,
  input: CreatePromotionInput,
): Promise<void> {
  if (input.targetType === "PRODUCT") {
    assertId(input.productId);

    const result = await client.query<{
      pricingType: string;
    }>(
      `
      SELECT "pricingType"
      FROM public."Product"
      WHERE id = $1
      `,
      [input.productId],
    );

    const product = result.rows[0];

    if (!product) {
      throw new PromotionServiceError(
        "Produto não encontrado.",
        404,
      );
    }

    if (product.pricingType !== "FIXED") {
      throw new PromotionServiceError(
        "Promoções de produtos convencionais exigem um produto com preço fixo.",
      );
    }

    return;
  }

  assertId(input.pizzaFlavorId);

  const result = await client.query<{
    id: number;
  }>(
    `
    SELECT id
    FROM public."PizzaFlavor"
    WHERE id = $1
    `,
    [input.pizzaFlavorId],
  );

  if (!result.rows[0]) {
    throw new PromotionServiceError(
      "Sabor de pizza não encontrado.",
      404,
    );
  }
}

// ============================================
// LISTAR TODAS AS PROMOÇÕES - ADMIN
// ============================================

export async function listPromotions(): Promise<
  Promotion[]
> {
  const result = await pool.query<Promotion>(
    `
    SELECT ${promotionFields}
    FROM public."Promotion"
    ORDER BY "createdAt" DESC, id DESC
    `,
  );

  return result.rows;
}

// ============================================
// LISTAR PROMOÇÕES VÁLIDAS - PÚBLICO
// ============================================

export async function listActivePromotions(): Promise<
  PublicPromotion[]
> {
  const result = await pool.query<PublicPromotion>(
    `
    SELECT
      p.id,
      p.name,
      p."targetType",
      p."productId",
      p."pizzaFlavorId",
      p."promotionalPriceCents",
      p."startsAt",
      p."endsAt"
    FROM public."Promotion" p
    LEFT JOIN public."Product" product
      ON product.id = p."productId"
    LEFT JOIN public."PizzaFlavor" flavor
      ON flavor.id = p."pizzaFlavorId"
    WHERE p."isActive" = TRUE
      AND (
        p."startsAt" IS NULL
        OR p."startsAt" <= NOW()
      )
      AND (
        p."endsAt" IS NULL
        OR p."endsAt" > NOW()
      )
      AND (
        (
          p."targetType" = 'PRODUCT'
          AND product."isActive" = TRUE
          AND product."isAvailable" = TRUE
          AND product."pricingType" = 'FIXED'
        )
        OR
        (
          p."targetType" = 'PIZZA_FLAVOR'
          AND flavor."isActive" = TRUE
          AND EXISTS (
            SELECT 1
            FROM public."PizzaSize" size
            WHERE LOWER(size.name) = 'grande'
              AND size."isActive" = TRUE
              AND size."isAvailable" = TRUE
          )
        )
      )
    ORDER BY p."createdAt" DESC
    `,
  );

  return result.rows;
}

// ============================================
// CRIAR PROMOÇÃO
// ============================================

export async function createPromotion(
  input: CreatePromotionInput,
): Promise<Promotion> {
  assertPrice(input.promotionalPriceCents);

  validateDates(
    input.startsAt ?? null,
    input.endsAt ?? null,
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await validatePromotionTarget(client, input);

    const result = await client.query<Promotion>(
      `
      INSERT INTO public."Promotion" (
        name,
        "targetType",
        "productId",
        "pizzaFlavorId",
        "promotionalPriceCents",
        "isActive",
        "startsAt",
        "endsAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      )
      RETURNING ${promotionFields}
      `,
      [
        input.name.trim(),
        input.targetType,
        input.targetType === "PRODUCT"
          ? input.productId
          : null,
        input.targetType === "PIZZA_FLAVOR"
          ? input.pizzaFlavorId
          : null,
        input.promotionalPriceCents,
        input.isActive ?? true,
        input.startsAt ?? null,
        input.endsAt ?? null,
      ],
    );

    await client.query("COMMIT");

    return result.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    handleDatabaseError(error);
  } finally {
    client.release();
  }
}

// ============================================
// ATUALIZAR PROMOÇÃO
// ============================================

export async function updatePromotion(
  id: number,
  patch: UpdatePromotionInput,
): Promise<Promotion> {
  assertId(id);

  if (Object.keys(patch).length === 0) {
    throw new PromotionServiceError(
      "Informe pelo menos um campo para atualizar.",
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await getPromotion(
      client,
      id,
      true,
    );

    if (current.groupId !== null) {
      throw new PromotionServiceError(
        "Esta promoção pertence a uma oferta agrupada. Edite a oferta pelo gerenciamento de grupos.",
        409,
      );
    }

    const name = patch.name ?? current.name;

    const promotionalPriceCents =
      patch.promotionalPriceCents ??
      current.promotionalPriceCents;

    const isActive =
      patch.isActive ?? current.isActive;

    const startsAt =
      patch.startsAt === undefined
        ? current.startsAt
        : patch.startsAt;

    const endsAt =
      patch.endsAt === undefined
        ? current.endsAt
        : patch.endsAt;

    if (
      name.trim().length < 2 ||
      name.trim().length > 120
    ) {
      throw new PromotionServiceError(
        "O nome deve ter entre 2 e 120 caracteres.",
      );
    }

    assertPrice(promotionalPriceCents);

    validateDates(startsAt, endsAt);

    const result = await client.query<Promotion>(
      `
      UPDATE public."Promotion"
      SET
        name = $2,
        "promotionalPriceCents" = $3,
        "isActive" = $4,
        "startsAt" = $5,
        "endsAt" = $6,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING ${promotionFields}
      `,
      [
        id,
        name.trim(),
        promotionalPriceCents,
        isActive,
        startsAt,
        endsAt,
      ],
    );

    await client.query("COMMIT");

    return result.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    handleDatabaseError(error);
  } finally {
    client.release();
  }
}

// ============================================
// DESATIVAR PROMOÇÃO
// ============================================

export async function deactivatePromotion(
  id: number,
): Promise<Promotion> {
  return updatePromotion(id, {
    isActive: false,
  });
}

// ============================================
// BUSCAR PREÇO PROMOCIONAL VÁLIDO
// ============================================

export async function findActivePromotionPrice(
  client: PoolClient,
  targetType: "PRODUCT" | "PIZZA_FLAVOR",
  targetId: number,
): Promise<number | null> {
  assertId(targetId);

  const column =
    targetType === "PRODUCT"
      ? '"productId"'
      : '"pizzaFlavorId"';

  const result = await client.query<{
    promotionalPriceCents: number;
  }>(
    `
    SELECT "promotionalPriceCents"
    FROM public."Promotion"
    WHERE "targetType" = $1
      AND ${column} = $2
      AND "isActive" = TRUE
      AND (
        "startsAt" IS NULL
        OR "startsAt" <= NOW()
      )
      AND (
        "endsAt" IS NULL
        OR "endsAt" > NOW()
      )
    LIMIT 1
    `,
    [targetType, targetId],
  );

  return result.rows[0]?.promotionalPriceCents ?? null;
}

// ============================================
// OFERTAS AGRUPADAS — PIZZAS
// ============================================

const groupFields = `
  g.id,
  g.name,
  g."createdAt",
  g."updatedAt"
`;

type GroupRow = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type GroupPromotionRow = {
  groupId: number;
  pizzaFlavorId: number;
  promotionalPriceCents: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

function validateGroupInput(
  input: CreatePromotionGroupInput | UpdatePromotionGroupInput,
): void {
  if (input.name !== undefined) {
    if (input.name.trim().length < 2 || input.name.trim().length > 120) {
      throw new PromotionServiceError("O nome deve ter entre 2 e 120 caracteres.");
    }
  }
  if (input.promotionalPriceCents !== undefined) {
    assertPrice(input.promotionalPriceCents);
  }
  if (input.pizzaFlavorIds !== undefined) {
    if (
      input.pizzaFlavorIds.length === 0 ||
      input.pizzaFlavorIds.length > 100 ||
      new Set(input.pizzaFlavorIds).size !== input.pizzaFlavorIds.length
    ) {
      throw new PromotionServiceError("Selecione de 1 a 100 sabores distintos.");
    }
    input.pizzaFlavorIds.forEach(assertId);
  }
  validateDates(input.startsAt ?? null, input.endsAt ?? null);
}

async function validateGroupFlavors(
  client: PoolClient,
  ids: number[],
): Promise<void> {
  const result = await client.query<{ id: number }>(
    `SELECT id FROM public."PizzaFlavor"
     WHERE id = ANY($1::integer[]) AND "isActive" = TRUE
     FOR SHARE`,
    [ids],
  );
  if (result.rowCount !== ids.length) {
    throw new PromotionServiceError(
      "Um ou mais sabores selecionados não existem ou estão inativos.",
      400,
    );
  }
}

async function getGroup(
  client: PoolClient,
  id: number,
  lock = false,
): Promise<GroupRow> {
  assertId(id);
  const result = await client.query<GroupRow>(
    `SELECT ${groupFields}
     FROM public."PromotionGroup" g
     WHERE g.id = $1
     ${lock ? "FOR UPDATE" : ""}`,
    [id],
  );
  if (!result.rows[0]) {
    throw new PromotionServiceError("Oferta agrupada não encontrada.", 404);
  }
  return result.rows[0];
}

async function getGroupPromotionRows(
  client: PoolClient,
  groupId: number,
): Promise<GroupPromotionRow[]> {
  const result = await client.query<GroupPromotionRow>(
    `SELECT "groupId", "pizzaFlavorId", "promotionalPriceCents",
            "isActive", "startsAt", "endsAt"
     FROM public."Promotion"
     WHERE "groupId" = $1 AND "targetType" = 'PIZZA_FLAVOR'
     ORDER BY id`,
    [groupId],
  );
  return result.rows;
}

async function buildAdminGroup(
  client: PoolClient,
  group: GroupRow,
): Promise<AdminPromotionGroup> {
  const rows = await getGroupPromotionRows(client, group.id);
  const first = rows[0];
  return {
    id: group.id,
    name: group.name,
    targetType: "PIZZA_FLAVOR",
    pizzaFlavorIds: rows.map((row) => row.pizzaFlavorId),
    promotionalPriceCents: first?.promotionalPriceCents ?? 0,
    isActive: first?.isActive ?? false,
    startsAt: first?.startsAt ?? null,
    endsAt: first?.endsAt ?? null,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

export async function listPromotionGroups(): Promise<AdminPromotionGroup[]> {
  const client = await pool.connect();
  try {
    const groups = await client.query<GroupRow>(
      `SELECT ${groupFields}
       FROM public."PromotionGroup" g
       ORDER BY g."createdAt" DESC, g.id DESC`,
    );
    return await Promise.all(
      groups.rows.map((group) => buildAdminGroup(client, group)),
    );
  } finally {
    client.release();
  }
}

export async function findPromotionGroupById(
  id: number,
): Promise<AdminPromotionGroup | null> {
  assertId(id);
  const client = await pool.connect();
  try {
    const result = await client.query<GroupRow>(
      `SELECT ${groupFields}
       FROM public."PromotionGroup" g WHERE g.id = $1`,
      [id],
    );
    return result.rows[0]
      ? await buildAdminGroup(client, result.rows[0])
      : null;
  } finally {
    client.release();
  }
}

/**
 * Sincroniza sabores em uma transação.
 * Promoções antigas sem grupo podem ser incorporadas, desde que
 * não pertençam a outra oferta. Nunca cria duas promoções ativas
 * para o mesmo sabor.
 */
async function syncGroupFlavors(
  client: PoolClient,
  groupId: number,
  input: {
    name: string;
    pizzaFlavorIds: number[];
    promotionalPriceCents: number;
    isActive: boolean;
    startsAt: string | Date | null;
    endsAt: string | Date | null;
  },
): Promise<void> {
  const { pizzaFlavorIds: ids } = input;
  await validateGroupFlavors(client, ids);

  // Bloqueia os registros do grupo e de todos os sabores desejados.
  const current = await client.query<{
    id: number;
    groupId: number | null;
    pizzaFlavorId: number;
    isActive: boolean;
  }>(
    `SELECT id, "groupId", "pizzaFlavorId", "isActive"
     FROM public."Promotion"
     WHERE "targetType" = 'PIZZA_FLAVOR'
       AND ("groupId" = $1 OR "pizzaFlavorId" = ANY($2::integer[]))
     FOR UPDATE`,
    [groupId, ids],
  );

  const wanted = new Set(ids);

  // Desativa sabores removidos antes de ativar os novos.
  await client.query(
    `UPDATE public."Promotion"
     SET "isActive" = FALSE, "groupId" = NULL, "updatedAt" = NOW()
     WHERE "groupId" = $1
       AND "targetType" = 'PIZZA_FLAVOR'
       AND NOT ("pizzaFlavorId" = ANY($2::integer[]))`,
    [groupId, ids],
  );

  for (const flavorId of wanted) {
    const matching = current.rows.filter(
      (row) => row.pizzaFlavorId === flavorId,
    );
    const belonging = matching.find((row) => row.groupId === groupId);
    const conflicting = matching.find(
      (row) => row.groupId !== null && row.groupId !== groupId,
    );
    if (conflicting) {
      throw new PromotionServiceError(
        `O sabor #${flavorId} já pertence a outra oferta agrupada.`,
        409,
      );
    }
    const activeUngrouped = matching.find(
      (row) => row.groupId === null && row.isActive,
    );
    const reusable = belonging ?? activeUngrouped;

    if (reusable) {
      await client.query(
        `UPDATE public."Promotion"
         SET name = $2, "groupId" = $3, "promotionalPriceCents" = $4,
             "isActive" = $5, "startsAt" = $6, "endsAt" = $7,
             "updatedAt" = NOW()
         WHERE id = $1`,
        [
          reusable.id, input.name, groupId,
          input.promotionalPriceCents, input.isActive,
          input.startsAt, input.endsAt,
        ],
      );
    } else {
      await client.query(
        `INSERT INTO public."Promotion" (
           name, "targetType", "productId", "pizzaFlavorId", "groupId",
           "promotionalPriceCents", "isActive", "startsAt", "endsAt", "updatedAt"
         ) VALUES ($1, 'PIZZA_FLAVOR', NULL, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          input.name, flavorId, groupId,
          input.promotionalPriceCents, input.isActive,
          input.startsAt, input.endsAt,
        ],
      );
    }
  }
}

export async function createPromotionGroup(
  input: CreatePromotionGroupInput,
): Promise<AdminPromotionGroup> {
  validateGroupInput(input);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<GroupRow>(
      `INSERT INTO public."PromotionGroup" (name, "updatedAt")
       VALUES ($1, NOW())
       RETURNING id, name, "createdAt", "updatedAt"`,
      [input.name.trim()],
    );
    const group = inserted.rows[0]!;
    await syncGroupFlavors(client, group.id, {
      name: group.name,
      pizzaFlavorIds: input.pizzaFlavorIds,
      promotionalPriceCents: input.promotionalPriceCents,
      isActive: input.isActive ?? true,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    });
    const result = await buildAdminGroup(client, group);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    handleDatabaseError(error);
  } finally {
    client.release();
  }
}

export async function updatePromotionGroup(
  id: number,
  patch: UpdatePromotionGroupInput,
): Promise<AdminPromotionGroup> {
  assertId(id);
  if (Object.keys(patch).length === 0) {
    throw new PromotionServiceError("Informe pelo menos um campo para atualizar.");
  }
  validateGroupInput(patch);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const group = await getGroup(client, id, true);
    const previous = await buildAdminGroup(client, group);
    const name = patch.name?.trim() ?? previous.name;
    const promotionalPriceCents =
      patch.promotionalPriceCents ?? previous.promotionalPriceCents;
    const isActive = patch.isActive ?? previous.isActive;
    const startsAt = patch.startsAt === undefined
      ? previous.startsAt : patch.startsAt;
    const endsAt = patch.endsAt === undefined
      ? previous.endsAt : patch.endsAt;
    validateDates(startsAt, endsAt);
    assertPrice(promotionalPriceCents);
    const pizzaFlavorIds = patch.pizzaFlavorIds ?? previous.pizzaFlavorIds;
    if (!pizzaFlavorIds.length) {
      throw new PromotionServiceError("A oferta deve possuir pelo menos um sabor.");
    }

    await client.query(
      `UPDATE public."PromotionGroup"
       SET name = $2, "updatedAt" = NOW()
       WHERE id = $1`,
      [id, name],
    );
    await syncGroupFlavors(client, id, {
      name, pizzaFlavorIds, promotionalPriceCents, isActive, startsAt, endsAt,
    });
    const result = await buildAdminGroup(
      client, await getGroup(client, id),
    );
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    handleDatabaseError(error);
  } finally {
    client.release();
  }
}

export async function deactivatePromotionGroup(
  id: number,
): Promise<AdminPromotionGroup> {
  return updatePromotionGroup(id, { isActive: false });
}

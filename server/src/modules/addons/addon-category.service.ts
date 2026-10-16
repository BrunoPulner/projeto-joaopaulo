
import { pool } from "../../lib/db.js";
import { AddonSubcategoryError } from "./addon-subcategory.service.js";

export interface AddonCategoryLink {
  id: number;
  addonId: number;
  categoryId: number;
  isActive: boolean;
  sortOrder: number;
}

export async function findAddonCategoryLinks(
  addonId: number,
): Promise<AddonCategoryLink[]> {
  const result = await pool.query<AddonCategoryLink>(
    `
      SELECT
        id,
        "addonId",
        "categoryId",
        "isActive",
        "sortOrder"
      FROM public."AddonCategory"
      WHERE "addonId" = $1
      ORDER BY "sortOrder", "categoryId"
    `,
    [addonId],
  );

  return result.rows;
}

export async function replaceAddonCategoryLinks(
  addonId: number,
  categoryIds: number[],
): Promise<AddonCategoryLink[]> {
  const uniqueIds = [...new Set(categoryIds)];
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const addon = await client.query(
      `
        SELECT id
        FROM public."Addon"
        WHERE id = $1
        FOR UPDATE
      `,
      [addonId],
    );

    if (addon.rowCount === 0) {
      throw new AddonSubcategoryError(
        "Adicional não encontrado.",
        404,
      );
    }

    // Valida as categorias selecionadas.
    if (uniqueIds.length > 0) {
      const valid = await client.query<{ id: number }>(
        `
          SELECT id
          FROM public."Category"
          WHERE id = ANY($1::int[])
            AND "isActive" = true
            AND LOWER(slug) NOT IN (
              'pizza',
              'pizzas',
              'lanche',
              'lanches'
            )
        `,
        [uniqueIds],
      );

      if (valid.rows.length !== uniqueIds.length) {
        throw new AddonSubcategoryError(
          "Uma ou mais categorias são inválidas, " +
            "estão desativadas ou não permitem adicionais.",
        );
      }
    }

    // Preserva vínculos antigos de pizzas e lanches.
    await client.query(
      `
        UPDATE public."AddonCategory" ac
        SET "isActive" = false
        FROM public."Category" c
        WHERE ac."categoryId" = c.id
          AND ac."addonId" = $1
          AND LOWER(c.slug) NOT IN (
            'pizza',
            'pizzas',
            'lanche',
            'lanches'
          )
          AND NOT (
            ac."categoryId" = ANY($2::int[])
          )
      `,
      [addonId, uniqueIds],
    );

    // Insere novos vínculos ou reativa os existentes.
    if (uniqueIds.length > 0) {
      await client.query(
        `
          INSERT INTO public."AddonCategory" (
            "addonId",
            "categoryId",
            "isActive",
            "sortOrder"
          )
          SELECT
            $1,
            ids.id,
            true,
            0
          FROM unnest($2::int[]) AS ids(id)
          ON CONFLICT ("addonId", "categoryId")
          DO UPDATE SET "isActive" = true
        `,
        [addonId, uniqueIds],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return findAddonCategoryLinks(addonId);
}

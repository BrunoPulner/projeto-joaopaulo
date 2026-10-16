
import { pool } from "../../lib/db.js";

export interface AddonSubcategoryLink {
  id: number;
  addonId: number;
  subcategoryId: number;
  isActive: boolean;
  sortOrder: number;
}

export class AddonSubcategoryError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "AddonSubcategoryError";
  }
}

export async function findAddonSubcategoryLinks(
  addonId: number,
): Promise<AddonSubcategoryLink[]> {
  const result = await pool.query<AddonSubcategoryLink>(
    `
      SELECT
        id,
        "addonId",
        "subcategoryId",
        "isActive",
        "sortOrder"
      FROM public."AddonSubcategory"
      WHERE "addonId" = $1
      ORDER BY "sortOrder", "subcategoryId"
    `,
    [addonId],
  );

  return result.rows;
}

export async function replaceAddonSubcategoryLinks(
  addonId: number,
  subcategoryIds: number[],
): Promise<AddonSubcategoryLink[]> {
  const uniqueIds = [...new Set(subcategoryIds)];
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

    if (uniqueIds.length > 0) {
      const valid = await client.query<{ id: number }>(
        `
          SELECT s.id
          FROM public."Subcategory" s
          INNER JOIN public."Category" c
            ON c.id = s."categoryId"
          WHERE s.id = ANY($1::int[])
            AND s."isActive" = true
            AND c."isActive" = true
            AND LOWER(c.slug) NOT IN (
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
          "Uma ou mais subcategorias são inválidas, " +
            "estão desativadas ou não permitem adicionais.",
        );
      }
    }

    // Preserva vínculos de pizzas e lanches.
    await client.query(
      `
        UPDATE public."AddonSubcategory" ads
        SET "isActive" = false
        FROM public."Subcategory" s
        INNER JOIN public."Category" c
          ON c.id = s."categoryId"
        WHERE ads."subcategoryId" = s.id
          AND ads."addonId" = $1
          AND LOWER(c.slug) NOT IN (
            'pizza',
            'pizzas',
            'lanche',
            'lanches'
          )
          AND NOT (
            ads."subcategoryId" = ANY($2::int[])
          )
      `,
      [addonId, uniqueIds],
    );

    if (uniqueIds.length > 0) {
      await client.query(
        `
          INSERT INTO public."AddonSubcategory" (
            "addonId",
            "subcategoryId",
            "isActive",
            "sortOrder"
          )
          SELECT
            $1,
            ids.id,
            true,
            0
          FROM unnest($2::int[]) AS ids(id)
          ON CONFLICT ("addonId", "subcategoryId")
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

  return findAddonSubcategoryLinks(addonId);
}

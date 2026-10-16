
import { pool } from "../../lib/db.js";

import {
  AddonSubcategoryError,
  findAddonSubcategoryLinks,
} from "./addon-subcategory.service.js";

import {
  findAddonCategoryLinks,
} from "./addon-category.service.js";

// ============================================
// TIPOS
// ============================================

export interface ReplaceAddonLinksInput {
  categoryIds: number[];
  subcategoryIds: number[];
}

// ============================================
// SALVAR VÍNCULOS EM UMA TRANSAÇÃO
// ============================================

export async function replaceAddonLinks(
  addonId: number,
  input: ReplaceAddonLinksInput,
) {
  const categoryIds = [...new Set(input.categoryIds)];
  const subcategoryIds = [...new Set(input.subcategoryIds)];

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Bloqueia o adicional durante a atualização.
    const addonResult = await client.query(
      `
        SELECT id
        FROM public."Addon"
        WHERE id = $1
        FOR UPDATE
      `,
      [addonId],
    );

    if (addonResult.rowCount === 0) {
      throw new AddonSubcategoryError(
        "Adicional não encontrado.",
        404,
      );
    }

    // ========================================
    // VALIDAR CATEGORIAS
    // ========================================

    if (categoryIds.length > 0) {
      const validCategories = await client.query<{
        id: number;
      }>(
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
        [categoryIds],
      );

      if (validCategories.rows.length !== categoryIds.length) {
        throw new AddonSubcategoryError(
          "Uma ou mais categorias são inválidas, estão desativadas ou não permitem adicionais.",
        );
      }
    }

    // ========================================
    // VALIDAR SUBCATEGORIAS
    // ========================================

    if (subcategoryIds.length > 0) {
      const validSubcategories = await client.query<{
        id: number;
      }>(
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
        [subcategoryIds],
      );

      if (
        validSubcategories.rows.length !==
        subcategoryIds.length
      ) {
        throw new AddonSubcategoryError(
          "Uma ou mais subcategorias são inválidas, estão desativadas ou não permitem adicionais.",
        );
      }
    }

    // ========================================
    // DESATIVAR CATEGORIAS DESMARCADAS
    // ========================================

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
      [addonId, categoryIds],
    );

    // ========================================
    // ATIVAR CATEGORIAS SELECIONADAS
    // ========================================

    if (categoryIds.length > 0) {
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
          DO UPDATE SET
            "isActive" = true
        `,
        [addonId, categoryIds],
      );
    }

    // ========================================
    // DESATIVAR SUBCATEGORIAS DESMARCADAS
    // ========================================

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
      [addonId, subcategoryIds],
    );

    // ========================================
    // ATIVAR SUBCATEGORIAS SELECIONADAS
    // ========================================

    if (subcategoryIds.length > 0) {
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
          DO UPDATE SET
            "isActive" = true
        `,
        [addonId, subcategoryIds],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  // Retorna os vínculos atualizados.
  const [categoryLinks, subcategoryLinks] =
    await Promise.all([
      findAddonCategoryLinks(addonId),
      findAddonSubcategoryLinks(addonId),
    ]);

  return {
    categoryLinks,
    subcategoryLinks,
  };
}


import { pool } from "../../lib/db.js";

// ============================================
// TIPOS
// ============================================

export interface ProductAddon {
  id: number;
  productId: number;
  addonId: number;

  isActive: boolean;
  sortOrder: number;

  // Dados do adicional
  addonName: string;
  addonDescription: string | null;
  addonImageUrl: string | null;
  addonPriceCents: number;
  addonIsActive: boolean;
}

export interface ProductAddonInput {
  productId: number;
  addonId: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ProductAddonUpdateInput {
  isActive?: boolean;
  sortOrder?: number;
}

export class ProductAddonValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductAddonValidationError";
  }
}

// ============================================
// CAMPOS DA CONSULTA
// ============================================

const fields = `
  pa.id,
  pa."productId",
  pa."addonId",
  pa."isActive",
  pa."sortOrder",

  a.name AS "addonName",
  a.description AS "addonDescription",
  a."imageUrl" AS "addonImageUrl",
  a."priceCents" AS "addonPriceCents",
  a."isActive" AS "addonIsActive"
`;

// ============================================
// LISTAR ADICIONAIS DE UM PRODUTO
// ============================================

export async function findProductAddons(
  productId: number,
  includeInactive = false,
): Promise<ProductAddon[]> {
  const result = await pool.query<ProductAddon>(
    `
      SELECT ${fields}
      FROM public."ProductAddon" pa

      INNER JOIN public."Addon" a
        ON a.id = pa."addonId"

      WHERE pa."productId" = $1
        AND (
          $2::boolean = true
          OR (
            pa."isActive" = true
            AND a."isActive" = true
          )
        )

      ORDER BY pa."sortOrder" ASC, a.name ASC
    `,
    [productId, includeInactive],
  );

  return result.rows;
}

// ============================================
// ADICIONAIS EFETIVOS DO PRODUTO
// Herança da subcategoria + restrições individuais
// ============================================


export async function findEffectiveProductAddons(
  productId: number,
): Promise<ProductAddon[]> {
  const result = await pool.query<ProductAddon>(
    `
      WITH product_context AS (
        SELECT
          p.id AS "productId",
          p."categoryId",
          p."subcategoryId"
        FROM public."Product" p
        INNER JOIN public."Category" c
          ON c.id = p."categoryId"
        WHERE p.id = $1
          AND p."isActive" = true
          AND p."isAvailable" = true
          AND p."allowsAddons" = true
          AND c."isActive" = true
          AND LOWER(c.slug) NOT IN (
            'pizza',
            'pizzas',
            'lanche',
            'lanches'
          )
      ),

      inherited_addons AS (
        -- Adicionais vinculados à categoria inteira
        SELECT
          ac."addonId",
          ac."sortOrder"
        FROM product_context pc
        INNER JOIN public."AddonCategory" ac
          ON ac."categoryId" = pc."categoryId"
          AND ac."isActive" = true

        UNION ALL

        -- Adicionais vinculados à subcategoria
        SELECT
          ads."addonId",
          ads."sortOrder"
        FROM product_context pc
        INNER JOIN public."AddonSubcategory" ads
          ON ads."subcategoryId" = pc."subcategoryId"
          AND ads."isActive" = true
        INNER JOIN public."Subcategory" s
          ON s.id = ads."subcategoryId"
          AND s."categoryId" = pc."categoryId"
          AND s."isActive" = true
      ),

      deduplicated_addons AS (
        -- Um único registro por adicional
        SELECT
          "addonId",
          MIN("sortOrder") AS "sortOrder"
        FROM inherited_addons
        GROUP BY "addonId"
      )

      SELECT
        COALESCE(pa.id, 0) AS id,
        pc."productId",
        a.id AS "addonId",

        COALESCE(pa."isActive", true) AS "isActive",

        COALESCE(
          pa."sortOrder",
          da."sortOrder",
          0
        ) AS "sortOrder",

        a.name AS "addonName",
        a.description AS "addonDescription",
        a."imageUrl" AS "addonImageUrl",
        a."priceCents" AS "addonPriceCents",
        a."isActive" AS "addonIsActive"

      FROM product_context pc

      INNER JOIN deduplicated_addons da
        ON true

      INNER JOIN public."Addon" a
        ON a.id = da."addonId"
        AND a."isActive" = true

      LEFT JOIN public."ProductAddon" pa
        ON pa."productId" = pc."productId"
        AND pa."addonId" = a.id

      WHERE COALESCE(pa."isActive", true) = true

      ORDER BY
        COALESCE(
          pa."sortOrder",
          da."sortOrder",
          0
        ) ASC,
        a.name ASC
    `,
    [productId],
  );

  return result.rows;
}


// ============================================
// BUSCAR VÍNCULO POR ID
// ============================================

export async function findProductAddonById(
  id: number,
): Promise<ProductAddon | null> {
  const result = await pool.query<ProductAddon>(
    `
      SELECT ${fields}
      FROM public."ProductAddon" pa

      INNER JOIN public."Addon" a
        ON a.id = pa."addonId"

      WHERE pa.id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

// ============================================
// VALIDAR PRODUTO E ADICIONAL
// ============================================

export async function validateProductAddon(
  productId: number,
  addonId: number,
): Promise<void> {
  const productResult = await pool.query<{
    id: number;
    categoryId: number;
    allowsAddons: boolean;
    isActive: boolean;
    categorySlug: string;
  }>(
    `
      SELECT
        p.id,
        p."categoryId",
        p."allowsAddons",
        p."isActive",
        c.slug AS "categorySlug"

      FROM public."Product" p

      INNER JOIN public."Category" c
        ON c.id = p."categoryId"

      WHERE p.id = $1
      LIMIT 1
    `,
    [productId],
  );

  const product = productResult.rows[0];

  if (!product) {
    throw new ProductAddonValidationError(
      "Produto não encontrado.",
    );
  }

  if (!product.isActive) {
    throw new ProductAddonValidationError(
      "Não é possível vincular adicionais a um produto desativado.",
    );
  }

  const categorySlug = product.categorySlug.toLowerCase();

// Lanches ficam fora desta etapa de configuração.
// As demais categorias dependem de allowsAddons.
if (
  categorySlug === "lanches" ||
  categorySlug === "lanche"
) {
  throw new ProductAddonValidationError(
    "Os adicionais para lanches ainda não estão habilitados.",
  );
}

  if (!product.allowsAddons) {
    throw new ProductAddonValidationError(
      "Este produto não está configurado para permitir adicionais.",
    );
  }

  const addonResult = await pool.query<{
    id: number;
    isActive: boolean;
  }>(
    `
      SELECT id, "isActive"
      FROM public."Addon"
      WHERE id = $1
      LIMIT 1
    `,
    [addonId],
  );

  const addon = addonResult.rows[0];

  if (!addon) {
    throw new ProductAddonValidationError(
      "Adicional não encontrado.",
    );
  }

  if (!addon.isActive) {
    throw new ProductAddonValidationError(
      "Não é possível vincular um adicional desativado.",
    );
  }
}

// ============================================
// CRIAR VÍNCULO
// ============================================

export async function insertProductAddon(
  input: ProductAddonInput,
): Promise<ProductAddon> {
  await validateProductAddon(
    input.productId,
    input.addonId,
  );

  const result = await pool.query<{ id: number }>(
    `
      INSERT INTO public."ProductAddon" (
        "productId",
        "addonId",
        "isActive",
        "sortOrder"
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [
      input.productId,
      input.addonId,
      input.isActive ?? true,
      input.sortOrder ?? 0,
    ],
  );

  const id = result.rows[0]!.id;
  const created = await findProductAddonById(id);

  if (!created) {
    throw new Error(
      "Não foi possível recuperar o vínculo criado.",
    );
  }

  return created;
}

// ============================================
// ATUALIZAR VÍNCULO
// ============================================

export async function editProductAddon(
  id: number,
  input: ProductAddonUpdateInput,
): Promise<ProductAddon | null> {
  const current = await findProductAddonById(id);

  if (!current) {
    return null;
  }

  // Revalida antes de reativar o vínculo
  if (input.isActive === true) {
    await validateProductAddon(
      current.productId,
      current.addonId,
    );
  }

  const entries = Object.entries(input).filter(
    ([key, value]) =>
      ["isActive", "sortOrder"].includes(key) &&
      value !== undefined,
  );

  if (entries.length === 0) {
    return current;
  }

  const assignments = entries.map(
    ([key], index) => `"${key}" = $${index + 2}`,
  );

  const values = entries.map(([, value]) => value);

  await pool.query(
    `
      UPDATE public."ProductAddon"
      SET ${assignments.join(", ")}
      WHERE id = $1
    `,
    [id, ...values],
  );

  return findProductAddonById(id);
}

// ============================================
// DESATIVAR VÍNCULO
// ============================================

export async function disableProductAddon(
  id: number,
): Promise<ProductAddon | null> {
  return editProductAddon(id, {
    isActive: false,
  });
}

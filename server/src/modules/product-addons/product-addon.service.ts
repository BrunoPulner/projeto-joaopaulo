
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

  if (
    categorySlug === "espetinhos" ||
    categorySlug === "espetinho" ||
    categorySlug === "bebidas" ||
    categorySlug === "bebida"
  ) {
    throw new ProductAddonValidationError(
      "Esta categoria não permite adicionais.",
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


import { pool } from "../../lib/db.js";

// ============================================
// TIPOS
// ============================================

export interface Addon {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddonInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
  isActive?: boolean;
}

export type AddonUpdateInput = Partial<AddonInput>;

// ============================================
// CAMPOS RETORNADOS
// ============================================

const fields = `
  id,
  name,
  description,
  "imageUrl",
  "priceCents",
  "isActive",
  "createdAt",
  "updatedAt"
`;

// ============================================
// LISTAR ADICIONAIS
// ============================================

export async function findAllAddons(
  includeInactive = false,
): Promise<Addon[]> {
  const result = await pool.query<Addon>(
    `
      SELECT ${fields}
      FROM public."Addon"
      WHERE ($1::boolean OR "isActive" = true)
      ORDER BY name ASC
    `,
    [includeInactive],
  );

  return result.rows;
}

// ============================================
// BUSCAR ADICIONAL POR ID
// ============================================

export async function findAddonById(
  id: number,
): Promise<Addon | null> {
  const result = await pool.query<Addon>(
    `
      SELECT ${fields}
      FROM public."Addon"
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

// ============================================
// CADASTRAR ADICIONAL
// ============================================

export async function insertAddon(
  input: AddonInput,
): Promise<Addon> {
  const result = await pool.query<Addon>(
    `
      INSERT INTO public."Addon" (
        name,
        description,
        "imageUrl",
        "priceCents",
        "isActive",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING ${fields}
    `,
    [
      input.name,
      input.description ?? null,
      input.imageUrl ?? null,
      input.priceCents,
      input.isActive ?? true,
    ],
  );

  return result.rows[0]!;
}

// ============================================
// ATUALIZAR ADICIONAL
// ============================================

export async function editAddon(
  id: number,
  input: AddonUpdateInput,
): Promise<Addon | null> {
  const allowedFields = [
    "name",
    "description",
    "imageUrl",
    "priceCents",
    "isActive",
  ] as const;

  const entries = allowedFields
    .filter((key) => input[key] !== undefined)
    .map((key) => [key, input[key]] as const);

  if (entries.length === 0) {
    return findAddonById(id);
  }

  const assignments = entries.map(
    ([key], index) => `"${key}" = $${index + 2}`,
  );

  const values = entries.map(([, value]) => value);

  const result = await pool.query<Addon>(
    `
      UPDATE public."Addon"
      SET
        ${assignments.join(", ")},
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING ${fields}
    `,
    [id, ...values],
  );

  return result.rows[0] ?? null;
}

// ============================================
// DESATIVAR ADICIONAL
// ============================================

export async function disableAddon(
  id: number,
): Promise<Addon | null> {
  return editAddon(id, {
    isActive: false,
  });
}

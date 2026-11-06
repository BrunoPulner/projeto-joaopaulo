
import { pool } from "../lib/db.js";

import type {
  UpdateCustomerProfileInput,
} from "../schemas/customer-profile.schema.js";

// ============================================
// TIPAGENS
// ============================================

export type CustomerProfileAddress = {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  city: "Rebouças";
  state: "PR";
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export type CustomerProfile = {
  userId: string;
  name: string;
  photoUrl: string | null;
  phone: string;
  address: CustomerProfileAddress | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type CustomerProfileRow = {
  userId: string;
  name: string | null;
  photoUrl: string | null;
  phone: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  complement: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type AuthUserRow = {
  id: string;
  name: string;
  image: string | null;
};

// ============================================
// ERROS
// ============================================

export class CustomerProfileNotFoundError
  extends Error {
  constructor() {
    super("Cliente não encontrado.");
    this.name = "CustomerProfileNotFoundError";
  }
}

// ============================================
// CONSULTAS SQL
// ============================================

const PROFILE_FIELDS = `
  "userId",
  name,
  "photoUrl",
  phone,
  street,
  number,
  neighborhood,
  complement,
  city,
  state,
  latitude,
  longitude,
  "createdAt",
  "updatedAt"
`;

// ============================================
// CONVERTER LINHA DO BANCO
// ============================================

function mapCustomerProfile(
  row: CustomerProfileRow,
  authUser: AuthUserRow,
): CustomerProfile {
  const hasAddress =
    Boolean(row.street) &&
    Boolean(row.number) &&
    Boolean(row.neighborhood) &&
    row.city === "Rebouças" &&
    row.state === "PR" &&
    row.latitude !== null &&
    row.longitude !== null &&
    Number.isFinite(row.latitude) &&
    Number.isFinite(row.longitude);

  const address: CustomerProfileAddress | null =
    hasAddress
      ? {
          street: row.street!,
          number: row.number!,
          neighborhood: row.neighborhood!,
          complement: row.complement ?? "",
          city: "Rebouças",
          state: "PR",
          coordinates: {
            latitude: row.latitude!,
            longitude: row.longitude!,
          },
        }
      : null;

  return {
    userId: row.userId,
    name: row.name?.trim() || authUser.name,
    photoUrl: row.photoUrl || authUser.image,
    phone: row.phone ?? "",
    address,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ============================================
// BUSCAR USUÁRIO AUTENTICADO
// ============================================

async function findCustomerUser(
  userId: string,
): Promise<AuthUserRow> {
  const result = await pool.query<AuthUserRow>(
    `
      SELECT
        id,
        name,
        image
      FROM public."user"
      WHERE id = $1
        AND role = 'CUSTOMER'
      LIMIT 1
    `,
    [userId],
  );

  const user = result.rows[0];

  if (!user) {
    throw new CustomerProfileNotFoundError();
  }

  return user;
}

// ============================================
// CONSULTAR PERFIL
// ============================================

export async function getCustomerProfile(
  userId: string,
): Promise<CustomerProfile> {
  const authUser = await findCustomerUser(userId);

  const result = await pool.query<CustomerProfileRow>(
    `
      SELECT ${PROFILE_FIELDS}
      FROM public."CustomerProfile"
      WHERE "userId" = $1
      LIMIT 1
    `,
    [userId],
  );

  const profile = result.rows[0];

  // Cliente recém-cadastrado:
  // retorna o perfil padrão sem criar registro.
  if (!profile) {
    return {
      userId,
      name: authUser.name,
      photoUrl: authUser.image,
      phone: "",
      address: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  return mapCustomerProfile(profile, authUser);
}

// ============================================
// SALVAR PERFIL
// ============================================

export async function saveCustomerProfile(
  userId: string,
  data: UpdateCustomerProfileInput,
): Promise<CustomerProfile> {
  const authUser = await findCustomerUser(userId);

  const address = data.address;

  const result = await pool.query<CustomerProfileRow>(
    `
      INSERT INTO public."CustomerProfile" (
        "userId",
        name,
        "photoUrl",
        phone,
        street,
        number,
        neighborhood,
        complement,
        city,
        state,
        latitude,
        longitude
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12
      )

      ON CONFLICT ("userId")
      DO UPDATE SET
        name = EXCLUDED.name,
        "photoUrl" = EXCLUDED."photoUrl",
        phone = EXCLUDED.phone,
        street = EXCLUDED.street,
        number = EXCLUDED.number,
        neighborhood = EXCLUDED.neighborhood,
        complement = EXCLUDED.complement,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        "updatedAt" = NOW()

      RETURNING ${PROFILE_FIELDS}
    `,
    [
      userId,
      data.name,
      data.photoUrl || null,
      data.phone || null,
      address?.street ?? null,
      address?.number ?? null,
      address?.neighborhood ?? null,
      address?.complement ?? null,
      address?.city ?? null,
      address?.state ?? null,
      address?.coordinates.latitude ?? null,
      address?.coordinates.longitude ?? null,
    ],
  );

  const saved = result.rows[0];

  if (!saved) {
    throw new Error(
      "Não foi possível salvar o perfil do cliente.",
    );
  }

  return mapCustomerProfile(saved, authUser);
}

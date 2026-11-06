
import { pool } from "../lib/db.js";

// ============================================
// TIPAGENS
// ============================================

export type AdminCustomer = {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  ordersBlocked: boolean;
  blockedAt: Date | null;
  blockedReason: string | null;
};


export type AdminCustomerAddress = {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  city: string;
  state: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export type AdminCustomerDetails = AdminCustomer & {
  phone: string | null;
  address: AdminCustomerAddress | null;
};

type AdminCustomerDetailsRow = AdminCustomer & {
  phone: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  complement: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};


export type AdminCustomerStats = {
  total: number;
  enabled: number;
  blocked: number;
};

export class CustomerNotFoundError extends Error {
  constructor() {
    super("Cliente não encontrado.");
    this.name = "CustomerNotFoundError";
  }
}

// ============================================
// CAMPOS RETORNADOS NAS CONSULTAS
// ============================================

const CUSTOMER_FIELDS = `
  id,
  name,
  "displayName",
  email,
  image,
  "createdAt",
  "ordersBlocked",
  "blockedAt",
  "blockedReason"
`;

// ============================================
// LISTAR CLIENTES
// ============================================

export async function listAdminCustomers():
  Promise<AdminCustomer[]> {
  const result = await pool.query<AdminCustomer>(
    `
    SELECT ${CUSTOMER_FIELDS}
    FROM public."user"
    WHERE role = 'CUSTOMER'
    ORDER BY "createdAt" DESC
    `,
  );

  return result.rows;
}

// ============================================
// CONSULTAR CLIENTE POR ID
// ============================================


export async function getAdminCustomerById(
  customerId: string,
): Promise<AdminCustomerDetails> {
  const result =
    await pool.query<AdminCustomerDetailsRow>(
      `
      SELECT
        u.id,
        u.name,
        u."displayName",
        u.email,
        u.image,
        u."createdAt",
        u."ordersBlocked",
        u."blockedAt",
        u."blockedReason",

        cp.phone,
        cp.street,
        cp.number,
        cp.neighborhood,
        cp.complement,
        cp.city,
        cp.state,
        cp.latitude,
        cp.longitude

      FROM public."user" AS u

      LEFT JOIN public."CustomerProfile" AS cp
        ON cp."userId" = u.id

      WHERE u.id = $1
        AND u.role = 'CUSTOMER'

      LIMIT 1
      `,
      [customerId],
    );

  const customer = result.rows[0];

  if (!customer) {
    throw new CustomerNotFoundError();
  }

  const hasAddress =
    Boolean(customer.street) &&
    Boolean(customer.number) &&
    Boolean(customer.neighborhood) &&
    Boolean(customer.city) &&
    Boolean(customer.state) &&
    customer.latitude !== null &&
    customer.longitude !== null &&
    Number.isFinite(customer.latitude) &&
    Number.isFinite(customer.longitude);

  const address: AdminCustomerAddress | null =
    hasAddress
      ? {
          street: customer.street!,
          number: customer.number!,
          neighborhood: customer.neighborhood!,
          complement: customer.complement ?? "",
          city: customer.city!,
          state: customer.state!,
          coordinates: {
            latitude: customer.latitude!,
            longitude: customer.longitude!,
          },
        }
      : null;

  return {
    id: customer.id,
    name: customer.name,
    displayName: customer.displayName,
    email: customer.email,
    image: customer.image,
    createdAt: customer.createdAt,
    ordersBlocked: customer.ordersBlocked,
    blockedAt: customer.blockedAt,
    blockedReason: customer.blockedReason,

    phone: customer.phone,
    address,
  };
}


// ============================================
// INDICADORES DE CLIENTES
// ============================================

export async function getAdminCustomerStats():
  Promise<AdminCustomerStats> {
  const result = await pool.query<{
    total: number;
    enabled: number;
    blocked: number;
  }>(
    `
    SELECT
      COUNT(*)::int AS total,

      COUNT(*) FILTER (
        WHERE "ordersBlocked" = FALSE
      )::int AS enabled,

      COUNT(*) FILTER (
        WHERE "ordersBlocked" = TRUE
      )::int AS blocked

    FROM public."user"
    WHERE role = 'CUSTOMER'
    `,
  );

  return result.rows[0] ?? {
    total: 0,
    enabled: 0,
    blocked: 0,
  };
}

// ============================================
// ALTERAR NOME EXIBIDO NO RESTAURANTE
// ============================================

export async function updateAdminCustomerName(
  customerId: string,
  displayName: string | null,
): Promise<AdminCustomer> {
  const normalizedName =
    displayName?.trim() || null;

  if (
    normalizedName !== null &&
    normalizedName.length > 100
  ) {
    throw new Error(
      "O nome deve ter no máximo 100 caracteres.",
    );
  }

  const result = await pool.query<AdminCustomer>(
    `
    UPDATE public."user"
    SET
      "displayName" = $2,
      "updatedAt" = NOW()
    WHERE id = $1
      AND role = 'CUSTOMER'
    RETURNING ${CUSTOMER_FIELDS}
    `,
    [customerId, normalizedName],
  );

  const customer = result.rows[0];

  if (!customer) {
    throw new CustomerNotFoundError();
  }

  return customer;
}

// ============================================
// BLOQUEAR CLIENTE
// ============================================

export async function blockAdminCustomer(
  customerId: string,
  reason: string | null,
): Promise<AdminCustomer> {
  const normalizedReason =
    reason?.trim() || null;

  if (
    normalizedReason !== null &&
    normalizedReason.length > 500
  ) {
    throw new Error(
      "O motivo deve ter no máximo 500 caracteres.",
    );
  }

  const result = await pool.query<AdminCustomer>(
    `
    UPDATE public."user"
    SET
      "ordersBlocked" = TRUE,
      "blockedAt" = CASE
        WHEN "ordersBlocked" = FALSE
          THEN NOW()
        ELSE "blockedAt"
      END,
      "blockedReason" = $2,
      "updatedAt" = NOW()
    WHERE id = $1
      AND role = 'CUSTOMER'
    RETURNING ${CUSTOMER_FIELDS}
    `,
    [customerId, normalizedReason],
  );

  const customer = result.rows[0];

  if (!customer) {
    throw new CustomerNotFoundError();
  }

  return customer;
}

// ============================================
// DESBLOQUEAR CLIENTE
// ============================================

export async function unblockAdminCustomer(
  customerId: string,
): Promise<AdminCustomer> {
  const result = await pool.query<AdminCustomer>(
    `
    UPDATE public."user"
    SET
      "ordersBlocked" = FALSE,
      "blockedAt" = NULL,
      "blockedReason" = NULL,
      "updatedAt" = NOW()
    WHERE id = $1
      AND role = 'CUSTOMER'
    RETURNING ${CUSTOMER_FIELDS}
    `,
    [customerId],
  );

  const customer = result.rows[0];

  if (!customer) {
    throw new CustomerNotFoundError();
  }

  return customer;
}

// ============================================
// VERIFICAR PERMISSÃO PARA REALIZAR PEDIDOS
// ============================================

export async function isCustomerOrdersBlocked(
  customerId: string,
): Promise<boolean> {
  const result = await pool.query<{
    ordersBlocked: boolean;
  }>(
    `
    SELECT "ordersBlocked"
    FROM public."user"
    WHERE id = $1
      AND role = 'CUSTOMER'
    LIMIT 1
    `,
    [customerId],
  );

  // Não autoriza pedidos para usuários inexistentes
  // ou que não sejam clientes.
  return result.rows[0]?.ordersBlocked ?? true;
}

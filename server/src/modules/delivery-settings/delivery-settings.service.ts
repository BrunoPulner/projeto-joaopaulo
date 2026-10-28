import { pool } from "../../lib/db.js";

import type {
  CreateDeliveryZoneInput,
  DeliveryPolygon,
  UpdateDeliverySettingsInput,
  UpdateDeliveryZoneInput,
  ValidateDeliveryLocationInput,
} from "./delivery-settings.schemas.js";

// ============================================
// TIPOS RETORNADOS PELO BANCO
// ============================================

export interface DeliverySettings {
  id: number;
  fixedFeeCents: number;
  isEnabled: boolean;
  contactPhone: string | null;
  unavailableMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryZone {
  id: number;
  name: string;
  polygon: DeliveryPolygon;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryAvailability {
  available: boolean;
  reason: "AVAILABLE" | "DELIVERY_DISABLED" | "OUTSIDE_DELIVERY_AREA" | "ZONE_NOT_CONFIGURED";
  feeCents: number | null;
  contactPhone: string | null;
  message: string | null;
}

const settingsFields = `
  id,
  "fixedFeeCents",
  "isEnabled",
  "contactPhone",
  "unavailableMessage",
  "createdAt",
  "updatedAt"
`;

const zoneFields = `
  id,
  name,
  polygon,
  "isActive",
  "createdAt",
  "updatedAt"
`;

// Usaremos apenas a configuração de ID 1.
// A tabela será inicializada por uma migração/seed controlada.
const SETTINGS_ID = 1;

// ============================================
// CONFIGURAÇÕES DE ENTREGA
// ============================================

export async function getDeliverySettings(): Promise<DeliverySettings | null> {
  const result = await pool.query<DeliverySettings>(
    `SELECT ${settingsFields}
     FROM public."DeliverySettings"
     WHERE id = $1
     LIMIT 1`,
    [SETTINGS_ID],
  );

  return result.rows[0] ?? null;
}

export async function updateDeliverySettings(
  input: UpdateDeliverySettingsInput,
): Promise<DeliverySettings | null> {
  const allowedFields = [
    "fixedFeeCents",
    "isEnabled",
    "contactPhone",
    "unavailableMessage",
  ] as const;

  const entries = allowedFields
    .filter((key) => input[key] !== undefined)
    .map((key) => [key, input[key]] as const);

  if (entries.length === 0) {
    return getDeliverySettings();
  }

  const assignments = entries.map(
    ([key], index) => `"${key}" = $${index + 2}`,
  );
  const values = entries.map(([, value]) => value);

  const result = await pool.query<DeliverySettings>(
    `UPDATE public."DeliverySettings"
     SET ${assignments.join(", ")}, "updatedAt" = NOW()
     WHERE id = $1
     RETURNING ${settingsFields}`,
    [SETTINGS_ID, ...values],
  );

  return result.rows[0] ?? null;
}

// ============================================
// ÁREAS DE ENTREGA
// ============================================

export async function listDeliveryZones(
  includeInactive = false,
): Promise<DeliveryZone[]> {
  const result = await pool.query<DeliveryZone>(
    `SELECT ${zoneFields}
     FROM public."DeliveryZone"
     WHERE ($1::boolean = TRUE OR "isActive" = TRUE)
     ORDER BY id ASC`,
    [includeInactive],
  );

  return result.rows;
}

export async function getDeliveryZoneById(
  id: number,
): Promise<DeliveryZone | null> {
  const result = await pool.query<DeliveryZone>(
    `SELECT ${zoneFields}
     FROM public."DeliveryZone"
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function createDeliveryZone(
  input: CreateDeliveryZoneInput,
): Promise<DeliveryZone> {
  const result = await pool.query<DeliveryZone>(
    `INSERT INTO public."DeliveryZone" (
       name, polygon, "isActive", "updatedAt"
     )
     VALUES ($1, $2::jsonb, $3, NOW())
     RETURNING ${zoneFields}`,
    [input.name, JSON.stringify(input.polygon), input.isActive],
  );

  const zone = result.rows[0];
  if (!zone) {
    throw new Error("Não foi possível recuperar a área de entrega cadastrada.");
  }

  return zone;
}

export async function updateDeliveryZone(
  id: number,
  input: UpdateDeliveryZoneInput,
): Promise<DeliveryZone | null> {
  const allowedFields = ["name", "polygon", "isActive"] as const;
  const entries = allowedFields
    .filter((key) => input[key] !== undefined)
    .map((key) => [key, input[key]] as const);

  if (entries.length === 0) {
    return getDeliveryZoneById(id);
  }

  const assignments = entries.map(([key], index) =>
    key === "polygon"
      ? `"polygon" = $${index + 2}::jsonb`
      : `"${key}" = $${index + 2}`,
  );

  const values = entries.map(([key, value]) =>
    key === "polygon" ? JSON.stringify(value) : value,
  );

  const result = await pool.query<DeliveryZone>(
    `UPDATE public."DeliveryZone"
     SET ${assignments.join(", ")}, "updatedAt" = NOW()
     WHERE id = $1
     RETURNING ${zoneFields}`,
    [id, ...values],
  );

  return result.rows[0] ?? null;
}

export async function deactivateDeliveryZone(
  id: number,
): Promise<DeliveryZone | null> {
  return updateDeliveryZone(id, { isActive: false });
}

// ============================================
// VERIFICAÇÃO GEOGRÁFICA
// ============================================

// Teste de ponto dentro do polígono (ray casting).
// Para uma área urbana pequena, é suficiente e leve.
// Longitude = eixo X; latitude = eixo Y.
// Pontos na borda são considerados dentro.
function pointOnSegment(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): boolean {
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  if (Math.abs(cross) > 1e-10) return false;

  const dot = (x - x1) * (x - x2) + (y - y1) * (y - y2);
  return dot <= 1e-10;
}

export function isPointInsideDeliveryPolygon(
  location: ValidateDeliveryLocationInput,
  polygon: DeliveryPolygon,
): boolean {
  const ring = polygon.coordinates[0];
  if (!ring || ring.length < 4) return false;

  const x = location.longitude;
  const y = location.latitude;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i++) {
    const current = ring[i];
    const previous = ring[j];
    if (!current || !previous) continue;

    const [xi, yi] = current;
    const [xj, yj] = previous;

    if (pointOnSegment(x, y, xi, yi, xj, yj)) return true;

    const intersects =
      (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

// ============================================
// DISPONIBILIDADE E VALOR FIXO DO FRETE
// ============================================

export async function checkDeliveryAvailability(
  location: ValidateDeliveryLocationInput,
): Promise<DeliveryAvailability> {
  const settings = await getDeliverySettings();

  if (!settings || !settings.isEnabled) {
    return {
      available: false,
      reason: "DELIVERY_DISABLED",
      feeCents: null,
      contactPhone: settings?.contactPhone ?? null,
      message: "Entregas temporariamente indisponíveis.",
    };
  }

  const zones = await listDeliveryZones();

  if (zones.length === 0) {
    return {
      available: false,
      reason: "ZONE_NOT_CONFIGURED",
      feeCents: null,
      contactPhone: settings.contactPhone,
      message: "Área de entrega ainda não configurada.",
    };
  }

  const withinArea = zones.some((zone) =>
    isPointInsideDeliveryPolygon(location, zone.polygon),
  );

  if (!withinArea) {
    return {
      available: false,
      reason: "OUTSIDE_DELIVERY_AREA",
      feeCents: null,
      contactPhone: settings.contactPhone,
      message: settings.unavailableMessage,
    };
  }

  return {
    available: true,
    reason: "AVAILABLE",
    feeCents: settings.fixedFeeCents,
    contactPhone: settings.contactPhone,
    message: null,
  };
}

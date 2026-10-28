
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

// ============================================
// ENDPOINTS
// ============================================

const DELIVERY_ADMIN_URL =
  `${API_BASE_URL}/api/admin/delivery-settings`;

const DELIVERY_AVAILABILITY_URL =
  `${API_BASE_URL}/api/delivery/availability`;

// ============================================
// TIPOS - CONFIGURAÇÕES DE ENTREGA
// ============================================

export type DeliverySettings = {
  id: number;
  fixedFeeCents: number;
  isEnabled: boolean;
  contactPhone: string | null;
  unavailableMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateDeliverySettingsInput = {
  fixedFeeCents?: number;
  isEnabled?: boolean;
  contactPhone?: string | null;
  unavailableMessage?: string;
};

// ============================================
// TIPOS - COORDENADAS GEOGRÁFICAS
// ============================================

// GeoJSON utiliza:
// [longitude, latitude]
//
// Google Maps utiliza:
// { lat, lng }
//
// A conversão será realizada no componente
// responsável pelo mapa.

export type DeliveryCoordinate = [
  longitude: number,
  latitude: number,
];

export type DeliveryPolygon = {
  type: "Polygon";
  coordinates: [DeliveryCoordinate[]];
};

// ============================================
// TIPOS - ÁREAS DE ENTREGA
// ============================================

export type DeliveryZone = {
  id: number;
  name: string;
  polygon: DeliveryPolygon;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateDeliveryZoneInput = {
  name?: string;
  polygon: DeliveryPolygon;
  isActive?: boolean;
};

export type UpdateDeliveryZoneInput = {
  name?: string;
  polygon?: DeliveryPolygon;
  isActive?: boolean;
};

// ============================================
// TIPOS - DISPONIBILIDADE DE ENTREGA
// ============================================

export type DeliveryLocationInput = {
  latitude: number;
  longitude: number;
};

export type DeliveryAvailabilityReason =
  | "AVAILABLE"
  | "DELIVERY_DISABLED"
  | "OUTSIDE_DELIVERY_AREA"
  | "ZONE_NOT_CONFIGURED";

export type DeliveryAvailability = {
  available: boolean;
  reason: DeliveryAvailabilityReason;
  feeCents: number | null;
  contactPhone: string | null;
  message: string | null;
};

// ============================================
// RESPOSTA PADRÃO DA API
// ============================================

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

// ============================================
// TRATAMENTO DE RESPOSTAS
// ============================================

async function parseApiResponse<T>(
  response: Response,
): Promise<T> {
  let result: ApiResponse<T>;

  try {
    result =
      (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(
      "O servidor retornou uma resposta inválida.",
    );
  }

  if (!response.ok || !result.success) {
    const validationErrors = result.errors
      ?.map((error) => error.message)
      .join(" ");

    throw new Error(
      validationErrors ||
        result.message ||
        "Não foi possível concluir a operação.",
    );
  }

  if (result.data === undefined) {
    throw new Error(
      "A API retornou uma resposta sem dados.",
    );
  }

  return result.data;
}

// ============================================
// REQUISIÇÃO PADRÃO
// ============================================

// Centraliza:
// - Cookies de autenticação
// - Headers JSON
// - Tratamento de erros
// - Métodos HTTP

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (
    options.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  return parseApiResponse<T>(response);
}

// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================

// GET /api/admin/delivery-settings

export async function getDeliverySettings():
  Promise<DeliverySettings> {
  return apiRequest<DeliverySettings>(
    DELIVERY_ADMIN_URL,
    {
      method: "GET",
    },
  );
}

// PATCH /api/admin/delivery-settings

export async function updateDeliverySettings(
  input: UpdateDeliverySettingsInput,
): Promise<DeliverySettings> {
  return apiRequest<DeliverySettings>(
    DELIVERY_ADMIN_URL,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

// ============================================
// LISTAR ÁREAS DE ENTREGA
// ============================================

// GET /api/admin/delivery-settings/zones
//
// Retorna todas as áreas cadastradas,
// incluindo as desativadas.

export async function getDeliveryZones():
  Promise<DeliveryZone[]> {
  return apiRequest<DeliveryZone[]>(
    `${DELIVERY_ADMIN_URL}/zones`,
    {
      method: "GET",
    },
  );
}

// ============================================
// CONSULTAR ÁREA ESPECÍFICA
// ============================================

// GET /api/admin/delivery-settings/zones/:id

export async function getDeliveryZoneById(
  id: number,
): Promise<DeliveryZone> {
  return apiRequest<DeliveryZone>(
    `${DELIVERY_ADMIN_URL}/zones/${id}`,
    {
      method: "GET",
    },
  );
}

// ============================================
// CADASTRAR ÁREA DE ENTREGA
// ============================================

// POST /api/admin/delivery-settings/zones
//
// Recebe o polígono desenhado no mapa
// e salva no banco PostgreSQL.

export async function createDeliveryZone(
  input: CreateDeliveryZoneInput,
): Promise<DeliveryZone> {
  return apiRequest<DeliveryZone>(
    `${DELIVERY_ADMIN_URL}/zones`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

// ============================================
// ATUALIZAR ÁREA DE ENTREGA
// ============================================

// PATCH /api/admin/delivery-settings/zones/:id
//
// Permite alterar:
// - Nome
// - Polígono
// - Situação ativa/inativa

export async function updateDeliveryZone(
  id: number,
  input: UpdateDeliveryZoneInput,
): Promise<DeliveryZone> {
  return apiRequest<DeliveryZone>(
    `${DELIVERY_ADMIN_URL}/zones/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

// ============================================
// DESATIVAR ÁREA DE ENTREGA
// ============================================

// DELETE /api/admin/delivery-settings/zones/:id
//
// O backend não exclui definitivamente.
// Apenas altera isActive para false.

export async function deactivateDeliveryZone(
  id: number,
): Promise<DeliveryZone> {
  return apiRequest<DeliveryZone>(
    `${DELIVERY_ADMIN_URL}/zones/${id}`,
    {
      method: "DELETE",
    },
  );
}

// ============================================
// REATIVAR ÁREA DE ENTREGA
// ============================================

// Utiliza PATCH para restaurar
// uma área anteriormente desativada.

export async function reactivateDeliveryZone(
  id: number,
): Promise<DeliveryZone> {
  return updateDeliveryZone(id, {
    isActive: true,
  });
}

// ============================================
// VERIFICAR DISPONIBILIDADE DE ENTREGA
// ============================================

// POST /api/delivery/availability
//
// Rota pública.
//
// Recebe coordenadas e verifica se estão
// dentro de alguma área ativa.
//
// IMPORTANTE:
// Esta consulta é apenas informativa.
// O checkout deverá revalidar a localização
// e calcular o valor final no servidor.

export async function checkDeliveryAvailability(
  location: DeliveryLocationInput,
): Promise<DeliveryAvailability> {
  return apiRequest<DeliveryAvailability>(
    DELIVERY_AVAILABILITY_URL,
    {
      method: "POST",
      body: JSON.stringify(location),
    },
  );
}

// ============================================
// FUNÇÕES AUXILIARES - GEOJSON
// ============================================

// Converte coordenadas do Google Maps
// para o formato GeoJSON.
//
// O primeiro ponto é repetido ao final
// para fechar o polígono.

export function createDeliveryPolygon(
  points: Array<{
    lat: number;
    lng: number;
  }>,
): DeliveryPolygon {
  if (points.length < 3) {
    throw new Error(
      "Selecione pelo menos três pontos no mapa.",
    );
  }

  const coordinates: DeliveryCoordinate[] =
    points.map((point) => [
      point.lng,
      point.lat,
    ]);

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  if (!first || !last) {
    throw new Error(
      "Não foi possível gerar o perímetro.",
    );
  }

  // Fecha o polígono se necessário.
  if (
    first[0] !== last[0] ||
    first[1] !== last[1]
  ) {
    coordinates.push([...first]);
  }

  return {
    type: "Polygon",
    coordinates: [coordinates],
  };
}

// ============================================
// FUNÇÕES AUXILIARES - GOOGLE MAPS
// ============================================

// Converte um polígono salvo no banco
// para coordenadas utilizadas pelo mapa.
//
// Remove o último ponto repetido,
// pois o Google Maps fecha visualmente
// o polígono.

export function polygonToMapPoints(
  polygon: DeliveryPolygon,
): Array<{
  lat: number;
  lng: number;
}> {
  const coordinates =
    polygon.coordinates[0] ?? [];

  const points = coordinates.map(
    ([longitude, latitude]) => ({
      lat: latitude,
      lng: longitude,
    }),
  );

  if (points.length > 1) {
    const first = points[0];
    const last = points[points.length - 1];

    if (
      first &&
      last &&
      first.lat === last.lat &&
      first.lng === last.lng
    ) {
      points.pop();
    }
  }

  return points;
}

// ============================================
// FUNÇÕES AUXILIARES - MOEDA
// ============================================

export function formatDeliveryFee(
  feeCents: number,
): string {
  return (feeCents / 100).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

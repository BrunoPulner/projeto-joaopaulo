
import type {
  DeliveryAvailability,
  DeliveryCoordinates,
} from "../deliveryAddress.types";

// ============================================
// CONFIGURAÇÕES DA API
// ============================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

const DELIVERY_AVAILABILITY_URL =
  `${API_BASE_URL}/api/delivery/availability`;

// ============================================
// TIPAGEM DA RESPOSTA
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
// VALIDAÇÃO DAS COORDENADAS
// ============================================

function validateCoordinates(
  coordinates: DeliveryCoordinates,
): void {
  const { latitude, longitude } = coordinates;

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "A latitude informada é inválida.",
    );
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "A longitude informada é inválida.",
    );
  }
}

// ============================================
// TRATAMENTO DA RESPOSTA
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
        `Não foi possível consultar a entrega (${response.status}).`,
    );
  }

  if (result.data === undefined) {
    throw new Error(
      "A API não retornou os dados da entrega.",
    );
  }

  return result.data;
}

// ============================================
// CONSULTAR DISPONIBILIDADE
// ============================================

export async function checkDeliveryAvailability(
  coordinates: DeliveryCoordinates,
  signal?: AbortSignal,
): Promise<DeliveryAvailability> {
  validateCoordinates(coordinates);

  const response = await fetch(
    DELIVERY_AVAILABILITY_URL,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }),

      signal,
    },
  );

  return parseApiResponse<DeliveryAvailability>(
    response,
  );
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Formata a taxa de entrega para reais.
export function formatDeliveryFee(
  feeCents: number | null,
): string {
  if (feeCents === null) {
    return "A calcular";
  }

  return (feeCents / 100).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

// Retorna uma mensagem amigável para o cliente.
export function getDeliveryAvailabilityMessage(
  availability: DeliveryAvailability,
): string {
  if (availability.available) {
    return "Boa notícia! Realizamos entregas neste endereço.";
  }

  if (availability.message?.trim()) {
    return availability.message;
  }

  switch (availability.reason) {
    case "DELIVERY_DISABLED":
      return "As entregas estão temporariamente desativadas.";

    case "OUTSIDE_DELIVERY_AREA":
      return "Este endereço está fora da nossa área de entrega.";

    case "ZONE_NOT_CONFIGURED":
    case "NO_ACTIVE_ZONES":
      return "Ainda não temos uma área de entrega disponível.";

    default:
      return "Não foi possível confirmar a disponibilidade de entrega.";
  }
}

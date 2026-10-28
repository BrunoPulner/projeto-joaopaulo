
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

// ============================================
// TIPOS
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
  const result = (await response.json()) as ApiResponse<T>;

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
    throw new Error("A API retornou uma resposta sem dados.");
  }

  return result.data;
}

// ============================================
// CONSULTAR CONFIGURAÇÕES
// ============================================

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/delivery-settings`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return parseApiResponse<DeliverySettings>(response);
}

// ============================================
// ATUALIZAR CONFIGURAÇÕES
// ============================================

export async function updateDeliverySettings(
  input: UpdateDeliverySettingsInput,
): Promise<DeliverySettings> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/delivery-settings`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return parseApiResponse<DeliverySettings>(response);
}


import type {
  DeliveryAddress,
} from "../../cart/delivery/deliveryAddress.types";

// ============================================
// CONFIGURAÇÃO DA API
// ============================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

const CUSTOMER_PROFILE_URL =
  `${API_BASE_URL}/api/customer/profile`;

// ============================================
// TIPAGENS
// ============================================

export type CustomerProfile = {
  userId: string;
  name: string;
  photoUrl: string | null;
  phone: string;
  address: DeliveryAddress | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SaveCustomerProfileInput = {
  name: string;
  phone: string;
  photoUrl: string | null;
  address: DeliveryAddress | null;
};

type ApiValidationError = {
  field: string;
  message: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ApiValidationError[];
};

// ============================================
// ERROS DA API
// ============================================

export class CustomerProfileApiError extends Error {
  readonly status: number;
  readonly errors: ApiValidationError[];

  constructor(
    message: string,
    status: number,
    errors: ApiValidationError[] = [],
  ) {
    super(message);

    this.name = "CustomerProfileApiError";
    this.status = status;
    this.errors = errors;
  }
}

// ============================================
// INTERPRETAR RESPOSTA DO SERVIDOR
// ============================================

async function parseApiResponse<T>(
  response: Response,
): Promise<T> {
  let result: ApiResponse<T>;

  try {
    result =
      (await response.json()) as ApiResponse<T>;
  } catch {
    throw new CustomerProfileApiError(
      "O servidor retornou uma resposta inválida.",
      response.status,
    );
  }

  if (!response.ok || !result.success) {
    let fallbackMessage =
      "Não foi possível processar a solicitação.";

    if (response.status === 401) {
      fallbackMessage =
        "Sua sessão expirou. Entre novamente.";
    }

    if (response.status === 403) {
      fallbackMessage =
        "Você não possui permissão para acessar este perfil.";
    }

    if (response.status === 404) {
      fallbackMessage =
        "Perfil do cliente não encontrado.";
    }

    const validationMessage = result.errors
      ?.map((error) => error.message)
      .join(" ");

    throw new CustomerProfileApiError(
      validationMessage ||
        result.message ||
        fallbackMessage,
      response.status,
      result.errors ?? [],
    );
  }

  if (result.data === undefined) {
    throw new CustomerProfileApiError(
      "A API não retornou os dados solicitados.",
      response.status,
    );
  }

  return result.data;
}

// ============================================
// REQUISIÇÃO AUTENTICADA
// ============================================

async function customerProfileRequest<T>(
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(
      CUSTOMER_PROFILE_URL,
      {
        ...options,

        // Envia o cookie de sessão Better Auth.
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
    );
  } catch (error) {
    // Permite cancelar requisições ao
    // desmontar componentes React.
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw error;
    }

    throw new CustomerProfileApiError(
      "Não foi possível conectar ao servidor.",
      0,
    );
  }

  return parseApiResponse<T>(response);
}

// ============================================
// CONSULTAR PERFIL
// ============================================

// GET /api/customer/profile

export async function getCustomerProfile(
  signal?: AbortSignal,
): Promise<CustomerProfile> {
  return customerProfileRequest<CustomerProfile>({
    method: "GET",
    signal,
  });
}

// ============================================
// SALVAR PERFIL
// ============================================

// PUT /api/customer/profile

export async function saveCustomerProfile(
  input: SaveCustomerProfileInput,
): Promise<CustomerProfile> {
  const normalizedName = input.name.trim();

  const normalizedPhone = input.phone.replace(
    /\D/g,
    "",
  );

  return customerProfileRequest<CustomerProfile>({
    method: "PUT",

    body: JSON.stringify({
      name: normalizedName,
      phone: normalizedPhone,
      photoUrl: input.photoUrl,
      address: input.address,
    }),
  });
}

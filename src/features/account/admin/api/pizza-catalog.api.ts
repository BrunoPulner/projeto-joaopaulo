
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const MAX_INT = 2147483647;

// ============================================
// TIPOS COMPARTILHADOS
// ============================================

export interface PizzaSize {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  slices: number;
  diameterCm: number | null;
  basePriceCents: number;
  maxFlavors: number;
  isActive: boolean;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PizzaFlavor {
  id: number;
  subcategoryId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  additionalPriceCents: number;
  isPremium: boolean;
  premiumAdditionalCents: number;
  allSizes: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PizzaAddon {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  linkId: number;
  linkIsActive: boolean;
  sortOrder: number;
}

// ============================================
// PAYLOADS - TAMANHOS
// ============================================

export interface PizzaSizePayload {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  slices: number;
  diameterCm?: number | null;
  basePriceCents: number;
  maxFlavors: number;
  isActive?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
}

export type PizzaSizeUpdatePayload =
  Partial<PizzaSizePayload>;

// ============================================
// PAYLOADS - SABORES
// ============================================

export interface PizzaFlavorPayload {
  subcategoryId: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  additionalPriceCents: number;
  isPremium: boolean;
  premiumAdditionalCents: number;
  allSizes: boolean;
  sizeIds?: number[];
  isActive?: boolean;
  sortOrder?: number;
}

export type PizzaFlavorUpdatePayload =
  Partial<PizzaFlavorPayload>;

// ============================================
// PAYLOADS - VÍNCULOS
// ============================================

export interface BulkSubcategoryAddonsPayload {
  subcategoryIds: number[];
  addonIds: number[];
  sortOrder?: number;
}

export interface BulkFlavorAddonsPayload {
  flavorIds: number[];
  addonIds: number[];
  sortOrder?: number;
}

export interface BulkLinkResult {
  linked: number;
  message: string;
}

// ============================================
// FILTROS
// ============================================

export interface PizzaFlavorFilters {
  subcategoryId?: number;
  sizeId?: number;
}

// ============================================
// CLIENTE HTTP
// ============================================

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers,
    },
  );

  const rawText = await response.text();

  let data: unknown = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      if (!response.ok) {
        throw new Error(
          `Erro HTTP ${response.status}: resposta inválida do servidor.`,
        );
      }

      throw new Error(
        "O servidor retornou uma resposta inesperada.",
      );
    }
  }

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}.`;

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      message = data.message;
    }

    if (response.status === 401) {
      message = "Sua sessão expirou. Faça login novamente.";
    }

    if (response.status === 403) {
      message =
        "Você não possui permissão para realizar esta operação.";
    }

    throw new Error(message);
  }

  return data as T;
}

function jsonOptions(
  method: "POST" | "PATCH" | "PUT",
  body: unknown,
): RequestInit {
  return {
    method,
    body: JSON.stringify(body),
  };
}

function assertId(id: number): number {
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    id > MAX_INT
  ) {
    throw new Error("Identificador inválido.");
  }

  return id;
}


function queryString(filters: PizzaFlavorFilters): string {
  const params = new URLSearchParams();

  if (filters.subcategoryId !== undefined) {
    params.set(
      "subcategoryId",
      String(assertId(filters.subcategoryId)),
    );
  }

  if (filters.sizeId !== undefined) {
    params.set(
      "sizeId",
      String(assertId(filters.sizeId)),
    );
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}


// ============================================
// API - TAMANHOS DE PIZZA
// ============================================

export const pizzaSizesApi = {
  listPublic(): Promise<PizzaSize[]> {
    return apiRequest<PizzaSize[]>(
      "/api/pizza-sizes",
    );
  },

  listAdmin(): Promise<PizzaSize[]> {
    return apiRequest<PizzaSize[]>(
      "/api/pizza-sizes/admin",
    );
  },

  getAdmin(id: number): Promise<PizzaSize> {
    return apiRequest<PizzaSize>(
      `/api/pizza-sizes/admin/${assertId(id)}`,
    );
  },

  create(
    payload: PizzaSizePayload,
  ): Promise<PizzaSize> {
    return apiRequest<PizzaSize>(
      "/api/pizza-sizes/admin",
      jsonOptions("POST", payload),
    );
  },

  update(
    id: number,
    payload: PizzaSizeUpdatePayload,
  ): Promise<PizzaSize> {
    return apiRequest<PizzaSize>(
      `/api/pizza-sizes/admin/${assertId(id)}`,
      jsonOptions("PATCH", payload),
    );
  },

  deactivate(id: number): Promise<unknown> {
    return apiRequest(
      `/api/pizza-sizes/admin/${assertId(id)}`,
      { method: "DELETE" },
    );
  },

  reactivate(id: number): Promise<unknown> {
    return apiRequest(
      `/api/pizza-sizes/admin/${assertId(id)}/reactivate`,
      { method: "PATCH" },
    );
  },

  setAvailability(
    id: number,
    isAvailable: boolean,
  ): Promise<unknown> {
    return apiRequest(
      `/api/pizza-sizes/admin/${assertId(id)}/availability`,
      jsonOptions("PATCH", { isAvailable }),
    );
  },
};

// ============================================
// API - SABORES DE PIZZA
// ============================================

export const pizzaFlavorsApi = {
  listPublic(
    filters: PizzaFlavorFilters = {},
  ): Promise<PizzaFlavor[]> {
    return apiRequest<PizzaFlavor[]>(
      `/api/pizza-catalog-flavors${queryString(filters)}`,
    );
  },

  listAdmin(
    filters: PizzaFlavorFilters = {},
  ): Promise<PizzaFlavor[]> {
    return apiRequest<PizzaFlavor[]>(
      `/api/pizza-catalog-flavors/admin${queryString(filters)}`,
    );
  },

  getAdmin(id: number): Promise<PizzaFlavor> {
    return apiRequest<PizzaFlavor>(
      `/api/pizza-catalog-flavors/admin/${assertId(id)}`,
    );
  },

  create(
    payload: PizzaFlavorPayload,
  ): Promise<PizzaFlavor> {
    return apiRequest<PizzaFlavor>(
      "/api/pizza-catalog-flavors/admin",
      jsonOptions("POST", payload),
    );
  },

  update(
    id: number,
    payload: PizzaFlavorUpdatePayload,
  ): Promise<PizzaFlavor> {
    return apiRequest<PizzaFlavor>(
      `/api/pizza-catalog-flavors/admin/${assertId(id)}`,
      jsonOptions("PATCH", payload),
    );
  },

  deactivate(id: number): Promise<unknown> {
    return apiRequest(
      `/api/pizza-catalog-flavors/admin/${assertId(id)}`,
      { method: "DELETE" },
    );
  },

  reactivate(id: number): Promise<unknown> {
    return apiRequest(
      `/api/pizza-catalog-flavors/admin/${assertId(id)}/reactivate`,
      { method: "PATCH" },
    );
  },
};

// ============================================
// API - ADICIONAIS DE PIZZA
// ============================================

export const pizzaAddonsApi = {
  // ------------------------------------------
  // CONSULTAS PÚBLICAS
  // ------------------------------------------

  listBySubcategory(
    subcategoryId: number,
  ): Promise<PizzaAddon[]> {
    return apiRequest<PizzaAddon[]>(
      `/api/pizza-addons/subcategory/${assertId(subcategoryId)}`,
    );
  },

  listByFlavor(
    flavorId: number,
  ): Promise<PizzaAddon[]> {
    return apiRequest<PizzaAddon[]>(
      `/api/pizza-addons/flavor/${assertId(flavorId)}`,
    );
  },

  // ------------------------------------------
  // CONSULTAS ADMINISTRATIVAS
  // ------------------------------------------

  listAdminBySubcategory(
    subcategoryId: number,
  ): Promise<PizzaAddon[]> {
    return apiRequest<PizzaAddon[]>(
      `/api/pizza-addons/admin/subcategory/${assertId(subcategoryId)}`,
    );
  },

  listAdminByFlavor(
    flavorId: number,
  ): Promise<PizzaAddon[]> {
    return apiRequest<PizzaAddon[]>(
      `/api/pizza-addons/admin/flavor/${assertId(flavorId)}`,
    );
  },

  // ------------------------------------------
  // VINCULAR ADICIONAIS
  // ------------------------------------------

  linkSubcategories(
    payload: BulkSubcategoryAddonsPayload,
  ): Promise<BulkLinkResult> {
    return apiRequest<BulkLinkResult>(
      "/api/pizza-addons/admin/subcategories/bulk",
      jsonOptions("POST", payload),
    );
  },

  linkFlavors(
    payload: BulkFlavorAddonsPayload,
  ): Promise<BulkLinkResult> {
    return apiRequest<BulkLinkResult>(
      "/api/pizza-addons/admin/flavors/bulk",
      jsonOptions("POST", payload),
    );
  },

  // ------------------------------------------
  // DESVINCULAR ADICIONAIS
  // ------------------------------------------

  unlinkSubcategory(
    subcategoryId: number,
    addonId: number,
  ): Promise<unknown> {
    return apiRequest(
      `/api/pizza-addons/admin/subcategory/${assertId(subcategoryId)}/addons/${assertId(addonId)}`,
      { method: "DELETE" },
    );
  },

  unlinkFlavor(
    flavorId: number,
    addonId: number,
  ): Promise<unknown> {
    return apiRequest(
      `/api/pizza-addons/admin/flavor/${assertId(flavorId)}/addons/${assertId(addonId)}`,
      { method: "DELETE" },
    );
  },
};

// ============================================
// EXPORTAÇÃO CENTRALIZADA
// ============================================

export const pizzaCatalogApi = {
  sizes: pizzaSizesApi,
  flavors: pizzaFlavorsApi,
  addons: pizzaAddonsApi,
};

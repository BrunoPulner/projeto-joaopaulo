
const API_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

// ============================================
// TIPOS DE PRECIFICAÇÃO
// ============================================

export type ProductPricingType =
  | "FIXED"
  | "PIZZA_CUSTOM";

// ============================================
// PRODUTOS
// ============================================

export interface AdminProduct {
  id: number;
  categoryId: number;
  subcategoryId: number | null;

  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;

  priceCents: number;

  pricingType: ProductPricingType;
  pizzaSlices: number | null;

  allowsFlavors: boolean;
  maxFlavors: number;
  allowsAddons: boolean;

  // Controle de estoque exclusivo para bebidas.
  // null indica produto sem controle de estoque.
  stockQuantity: number | null;

  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;

  createdAt: string;
  updatedAt: string;
}

export interface ProductPayload {
  categoryId: number;
  subcategoryId: number | null;

  name: string;
  description: string | null;
  imageUrl: string | null;

  priceCents: number;

  pricingType?: ProductPricingType;
  pizzaSlices?: number | null;

  allowsFlavors?: boolean;
  maxFlavors?: number;
  allowsAddons?: boolean;

  // Obrigatório para bebidas na validação do backend.
  // Para outras categorias, utilizar null.
  stockQuantity?: number | null;

  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

// ============================================
// CATEGORIAS
// ============================================

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface AdminSubcategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  isActive: boolean;
}

// ============================================
// ADICIONAIS
// ============================================

export interface AdminAddon {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;

  priceCents: number;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface AddonPayload {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
  isActive?: boolean;
}

// ============================================
// ADICIONAIS VINCULADOS A PRODUTOS
// ============================================

export interface AdminProductAddon {
  id: number;
  productId: number;
  addonId: number;

  isActive: boolean;
  sortOrder: number;

  addonName: string;
  addonDescription: string | null;
  addonImageUrl: string | null;
  addonPriceCents: number;
  addonIsActive: boolean;
}

export interface ProductAddonPayload {
  productId: number;
  addonId: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ProductAddonUpdatePayload {
  isActive?: boolean;
  sortOrder?: number;
}

// ============================================
// SABORES DE PIZZA
// ============================================

export interface AdminProductFlavor {
  id: number;
  productId: number;

  name: string;
  description: string | null;

  additionalPriceCents: number;
  isPremium: boolean;
  premiumAdditionalCents: number;

  isActive: boolean;
  sortOrder: number;
}

export interface ProductFlavorPayload {
  productId: number;
  name: string;
  description?: string | null;

  additionalPriceCents: number;
  isPremium?: boolean;
  premiumAdditionalCents?: number;

  isActive?: boolean;
  sortOrder?: number;
}

// ============================================
// RESPOSTAS DA API
// ============================================

interface ApiMessage {
  message: string;
}

export interface AddonResponse extends ApiMessage {
  addon: AdminAddon;
}

export interface ProductAddonResponse extends ApiMessage {
  productAddon: AdminProductAddon;
}

export interface ProductDeactivateResponse
  extends ApiMessage {
  product: AdminProduct;
}

// ============================================
// FUNÇÃO CENTRAL DE REQUISIÇÕES
// ============================================

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",

    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const data: unknown = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Erro HTTP ${response.status}.`;

    throw new Error(message);
  }

  return data as T;
}

// ============================================
// API DE PRODUTOS
// ============================================

export const productsApi = {
  listAdmin: () =>
    request<AdminProduct[]>("/api/products/admin"),

  listCategories: () =>
    request<AdminCategory[]>(
      "/api/categories?includeInactive=true",
    ),

  listSubcategories: () =>
    request<AdminSubcategory[]>(
      "/api/subcategories/admin",
    ),

  create: (payload: ProductPayload) =>
    request<AdminProduct>("/api/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (
    id: number,
    payload: Partial<ProductPayload>,
  ) =>
    request<AdminProduct>(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deactivate: (id: number) =>
    request<ProductDeactivateResponse>(
      `/api/products/${id}`,
      {
        method: "DELETE",
      },
    ),

  // ==========================================
  // ADICIONAIS
  // ==========================================

  addons: {
    list: () =>
      request<AdminAddon[]>("/api/addons"),

    listAdmin: () =>
      request<AdminAddon[]>("/api/addons/admin"),

    getById: (id: number) =>
      request<AdminAddon>(`/api/addons/${id}`),

    create: (payload: AddonPayload) =>
      request<AddonResponse>("/api/addons", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    update: (
      id: number,
      payload: Partial<AddonPayload>,
    ) =>
      request<AddonResponse>(`/api/addons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    deactivate: (id: number) =>
      request<AddonResponse>(`/api/addons/${id}`, {
        method: "DELETE",
      }),
  },

  // ==========================================
  // ADICIONAIS VINCULADOS A PRODUTOS
  // ==========================================

  productAddons: {
    list: (productId: number) =>
      request<AdminProductAddon[]>(
        `/api/products/${productId}/addons`,
      ),

    listAdmin: (productId: number) =>
      request<AdminProductAddon[]>(
        `/api/admin/product-addons/product/${productId}`,
      ),

    getById: (id: number) =>
      request<AdminProductAddon>(
        `/api/admin/product-addons/${id}`,
      ),

    create: (payload: ProductAddonPayload) =>
      request<ProductAddonResponse>(
        "/api/admin/product-addons",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      ),

    update: (
      id: number,
      payload: ProductAddonUpdatePayload,
    ) =>
      request<ProductAddonResponse>(
        `/api/admin/product-addons/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      ),

    deactivate: (id: number) =>
      request<ProductAddonResponse>(
        `/api/admin/product-addons/${id}`,
        {
          method: "DELETE",
        },
      ),
  },
};

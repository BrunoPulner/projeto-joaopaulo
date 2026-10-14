const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export interface AdminProduct {
  id: number;
  categoryId: number;
  subcategoryId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  allowsFlavors: boolean;
  maxFlavors: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface ProductPayload {
  categoryId: number;
  subcategoryId: number | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  allowsFlavors: boolean;
  maxFlavors: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message
      : `Erro HTTP ${response.status}.`;
    throw new Error(message);
  }
  return data as T;
}

export const productsApi = {
  listAdmin: () => request<AdminProduct[]>("/api/products/admin"),
  listCategories: () => request<AdminCategory[]>("/api/categories?includeInactive=true"),
  listSubcategories: () => request<AdminSubcategory[]>("/api/subcategories/admin"),
  create: (payload: ProductPayload) => request<AdminProduct>("/api/products", {
    method: "POST", body: JSON.stringify(payload),
  }),
  update: (id: number, payload: Partial<ProductPayload>) => request<AdminProduct>(`/api/products/${id}`, {
    method: "PATCH", body: JSON.stringify(payload),
  }),
  deactivate: (id: number) => request<{ message: string; product: AdminProduct }>(`/api/products/${id}`, {
    method: "DELETE",
  }),
};

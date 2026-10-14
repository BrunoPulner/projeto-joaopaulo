
const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

type CategoryPayload = {
  name?: string;
  isActive?: boolean;
};

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

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Erro na requisição (${response.status}).`;

    throw new Error(message);
  }

  return data as T;
}

export const categoriesApi = {
  listAdmin() {
    return request<AdminCategory[]>("/api/categories/admin");
  },

  create(name: string) {
    return request<AdminCategory>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  update(id: number, payload: CategoryPayload) {
    return request<AdminCategory>(`/api/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deactivate(id: number) {
    return request<{
      message: string;
      category: AdminCategory;
    }>(`/api/categories/${id}`, {
      method: "DELETE",
    });
  },
};

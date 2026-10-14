
const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export interface AdminSubcategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

type SubcategoryPayload = {
  name?: string;
  isActive?: boolean;
  sortOrder?: number;
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

export const subcategoriesApi = {
  listAdmin(categoryId?: number) {
    const query =
      categoryId !== undefined
        ? `?categoryId=${categoryId}`
        : "";

    return request<AdminSubcategory[]>(
      `/api/subcategories/admin${query}`,
    );
  },

  listPublic(categoryId?: number) {
    const query =
      categoryId !== undefined
        ? `?categoryId=${categoryId}`
        : "";

    return request<AdminSubcategory[]>(
      `/api/subcategories${query}`,
    );
  },

  create(categoryId: number, name: string) {
    return request<AdminSubcategory>(
      "/api/subcategories",
      {
        method: "POST",
        body: JSON.stringify({
          categoryId,
          name,
        }),
      },
    );
  },

  update(id: number, payload: SubcategoryPayload) {
    return request<AdminSubcategory>(
      `/api/subcategories/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },

  deactivate(id: number) {
    return request<{
      message: string;
      subcategory: AdminSubcategory;
    }>(`/api/subcategories/${id}`, {
      method: "DELETE",
    });
  },
};

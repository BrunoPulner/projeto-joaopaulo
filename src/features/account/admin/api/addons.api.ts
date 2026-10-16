
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

// ============================================
// TIPOS
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

// ============================================
// TRATAMENTO DA RESPOSTA
// ============================================

function extractAddonList(data: unknown): AdminAddon[] {
  if (Array.isArray(data)) {
    return data as AdminAddon[];
  }

  if (data && typeof data === "object") {
    if (
      "addons" in data &&
      Array.isArray(data.addons)
    ) {
      return data.addons as AdminAddon[];
    }

    if (
      "data" in data &&
      Array.isArray(data.data)
    ) {
      return data.data as AdminAddon[];
    }
  }

  throw new Error(
    "A API retornou um formato inesperado para os adicionais.",
  );
}

// ============================================
// API
// ============================================

export const adminAddonsApi = {
  async list(): Promise<AdminAddon[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/addons/admin`,
      {
        method: "GET",
        credentials: "include",
      },
    );

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

    return extractAddonList(data);
  },
};

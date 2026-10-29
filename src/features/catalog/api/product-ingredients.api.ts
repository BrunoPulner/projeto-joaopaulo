
 // ============================================
 // CONFIGURAÇÃO DA API
 // ============================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

// ============================================
// TIPAGEM DOS INGREDIENTES
// ============================================

export interface CatalogProductIngredient {
  id: number;
  productId: number;
  name: string;
  isRemovable: boolean;
  sortOrder: number;
  createdAt: string;
}

// ============================================
// TIPAGEM DA PERSONALIZAÇÃO
// ============================================

export interface RemovedIngredient {
  id: number;
  name: string;
}

// ============================================
// FUNÇÃO PARA BUSCAR INGREDIENTES
// ============================================

export async function getProductIngredients(
  productId: number,
  signal?: AbortSignal,
): Promise<CatalogProductIngredient[]> {
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    throw new Error("Identificador do produto inválido.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}/ingredients`,
    {
      method: "GET",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Não foi possível carregar os ingredientes (${response.status}).`,
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "A API retornou uma lista de ingredientes inválida.",
    );
  }

  return (data as CatalogProductIngredient[]).sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.id - b.id,
  );
}

// ============================================
// CONVERTER INGREDIENTES REMOVIDOS
// ============================================

export function getRemovedIngredients(
  ingredients: CatalogProductIngredient[],
  removedIds: number[],
): RemovedIngredient[] {
  const removedSet = new Set(removedIds);

  return ingredients
    .filter(
      (ingredient) =>
        ingredient.isRemovable &&
        removedSet.has(ingredient.id),
    )
    .map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
    }));
}

// ============================================
// GERAR RESUMO DA PERSONALIZAÇÃO
// ============================================

export function formatRemovedIngredients(
  removedIngredients: RemovedIngredient[],
): string {
  if (removedIngredients.length === 0) {
    return "Produto completo";
  }

  return `Sem ${removedIngredients
    .map((ingredient) => ingredient.name)
    .join(", ")}`;
}

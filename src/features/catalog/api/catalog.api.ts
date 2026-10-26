
import type {
  CatalogCategory,
  CatalogSubcategory,
  CatalogProduct,
  CatalogData,
} from "../types/catalog.types";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

// ============================================
// REQUISIÇÃO GENÉRICA
// ============================================

async function getData<T>(
  endpoint: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao carregar ${endpoint} (${response.status})`,
    );
  }

  return (await response.json()) as T;
}

// ============================================
// CATEGORIAS
// ============================================

export async function getCatalogCategories(
  signal?: AbortSignal,
): Promise<CatalogCategory[]> {
  return getData<CatalogCategory[]>(
    "/api/categories",
    signal,
  );
}

// ============================================
// SUBCATEGORIAS
// ============================================

export async function getCatalogSubcategories(
  signal?: AbortSignal,
): Promise<CatalogSubcategory[]> {
  return getData<CatalogSubcategory[]>(
    "/api/subcategories",
    signal,
  );
}

// ============================================
// PRODUTOS
// ============================================

export async function getCatalogProducts(
  signal?: AbortSignal,
): Promise<CatalogProduct[]> {
  return getData<CatalogProduct[]>(
    "/api/products",
    signal,
  );
}

// ============================================
// CATÁLOGO COMPLETO
// ============================================

export async function getCatalogData(
  signal?: AbortSignal,
): Promise<CatalogData> {
  const [
    categories,
    subcategories,
    products,
  ] = await Promise.all([
    getCatalogCategories(signal),
    getCatalogSubcategories(signal),
    getCatalogProducts(signal),
  ]);

  const activeCategories = categories.filter(
    (category) => category.isActive,
  );

  const categoryIds = new Set(
    activeCategories.map((category) => category.id),
  );

  const activeSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.isActive &&
      categoryIds.has(subcategory.categoryId),
  );

  const subcategoryIds = new Set(
    activeSubcategories.map(
      (subcategory) => subcategory.id,
    ),
  );

  const availableProducts = products.filter(
    (product) =>
      product.isActive &&
      product.isAvailable &&
      categoryIds.has(product.categoryId) &&
      (product.subcategoryId === null ||
        subcategoryIds.has(product.subcategoryId)) &&
      (product.stockQuantity === null ||
        product.stockQuantity > 0),
  );

  return {
    categories: activeCategories,
    subcategories: activeSubcategories,
    products: availableProducts,
  };
}

// ============================================
// RESOLVER URL DAS IMAGENS
// ============================================

export function resolveCatalogImageUrl(
  imageUrl: string | null | undefined,
): string | null {
  if (!imageUrl) return null;

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  return `${API_URL}/${
    imageUrl.replace(/^\/+/, "")
  }`;
}

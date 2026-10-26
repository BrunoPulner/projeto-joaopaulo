
export type ProductPricingType =
  | "FIXED"
  | "PIZZA_CUSTOM";

// ============================================
// CATEGORIAS
// ============================================

export interface CatalogCategory {
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

// ============================================
// SUBCATEGORIAS
// ============================================

export interface CatalogSubcategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PRODUTOS
// ============================================

export interface CatalogProduct {
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

  stockQuantity: number | null;

  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// RESPOSTA DO CATÁLOGO
// ============================================

export interface CatalogData {
  categories: CatalogCategory[];
  subcategories: CatalogSubcategory[];
  products: CatalogProduct[];
}

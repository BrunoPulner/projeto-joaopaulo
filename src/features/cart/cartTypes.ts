import type { Product } from "../catalog/catalogData";

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  notes: string;
};

export type AddCartItemInput = {
  product: Product;
  quantity: number;
  notes?: string;
};
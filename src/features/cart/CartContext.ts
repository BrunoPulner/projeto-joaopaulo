import { createContext } from "react";

import type {
  AddCartItemInput,
  CartItem,
} from "./cartTypes";

export type CartContextValue = {
  items: CartItem[];
  itemCount: number;

  open: boolean;

  openCart: () => void;
  closeCart: () => void;

  addItem: (item: AddCartItemInput) => void;

  increase: (itemId: string) => void;
  decrease: (itemId: string) => void;
  remove: (itemId: string) => void;
};

export const CartContext =
  createContext<CartContextValue | null>(null);
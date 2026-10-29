
import { Router } from "express";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

import {
  getProductIngredients,
  postProductIngredient,
  patchProductIngredient,
  removeProductIngredient,
} from "./product-ingredients.controller.js";

// ============================================
// ROUTER
// ============================================

export const productIngredientsRouter = Router();

// ============================================
// ROTAS PÚBLICAS
// ============================================

// Listar ingredientes de um produto
// GET /api/products/:id/ingredients

productIngredientsRouter.get(
  "/products/:id/ingredients",
  getProductIngredients,
);

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// Cadastrar ingrediente em um produto
// POST /api/products/:id/ingredients

productIngredientsRouter.post(
  "/products/:id/ingredients",
  requireAuth,
  requireRole("ADMIN"),
  postProductIngredient,
);

// Atualizar ingrediente
// PATCH /api/product-ingredients/:id

productIngredientsRouter.patch(
  "/product-ingredients/:id",
  requireAuth,
  requireRole("ADMIN"),
  patchProductIngredient,
);

// Excluir ingrediente
// DELETE /api/product-ingredients/:id

productIngredientsRouter.delete(
  "/product-ingredients/:id",
  requireAuth,
  requireRole("ADMIN"),
  removeProductIngredient,
);

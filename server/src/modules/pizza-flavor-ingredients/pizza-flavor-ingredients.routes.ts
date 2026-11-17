
import { Router } from "express";

import {
  getPizzaFlavorIngredients,
  postPizzaFlavorIngredient,
  patchPizzaFlavorIngredient,
  removePizzaFlavorIngredient,
} from "./pizza-flavor-ingredients.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

// ============================================
// ROUTER - INGREDIENTES DOS SABORES DE PIZZA
// ============================================

export const pizzaFlavorIngredientsRouter = Router();

// ============================================
// ROTAS PÚBLICAS
// ============================================

// GET /api/pizza-catalog-flavors/:id/ingredients
//
// Retorna os ingredientes cadastrados
// para um sabor específico de pizza.
//
// Utilizado no modal de detalhes do sabor.

pizzaFlavorIngredientsRouter.get(
  "/pizza-catalog-flavors/:id/ingredients",
  getPizzaFlavorIngredients,
);

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// POST /api/pizza-catalog-flavors/:id/ingredients
//
// Cadastra um ingrediente em um sabor.
//
// Exige autenticação e perfil ADMIN.

pizzaFlavorIngredientsRouter.post(
  "/pizza-catalog-flavors/:id/ingredients",
  requireAuth,
  requireRole("ADMIN"),
  postPizzaFlavorIngredient,
);

// ============================================
// ATUALIZAR INGREDIENTE
// ============================================

// PATCH /api/pizza-flavor-ingredients/:id
//
// Permite atualizar:
// - Nome do ingrediente
// - Permissão para remoção
// - Ordem de exibição

pizzaFlavorIngredientsRouter.patch(
  "/pizza-flavor-ingredients/:id",
  requireAuth,
  requireRole("ADMIN"),
  patchPizzaFlavorIngredient,
);

// ============================================
// EXCLUIR INGREDIENTE
// ============================================

// DELETE /api/pizza-flavor-ingredients/:id
//
// Exclui um ingrediente do sabor.
//
// Não exclui o sabor de pizza.

pizzaFlavorIngredientsRouter.delete(
  "/pizza-flavor-ingredients/:id",
  requireAuth,
  requireRole("ADMIN"),
  removePizzaFlavorIngredient,
);

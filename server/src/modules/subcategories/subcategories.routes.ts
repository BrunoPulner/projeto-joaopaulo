
import { Router } from "express";

import {
  createSubcategory,
  deactivateSubcategory,
  listAdminSubcategories,
  listSubcategories,
  updateSubcategory,
} from "./subcategories.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

export const subcategoriesRouter = Router();

// Listagem pública: somente subcategorias ativas
subcategoriesRouter.get("/", listSubcategories);

// Listagem administrativa: inclui desativadas
subcategoriesRouter.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  listAdminSubcategories,
);

// Criar
subcategoriesRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createSubcategory,
);

// Editar ou reativar
subcategoriesRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateSubcategory,
);

// Desativar
subcategoriesRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deactivateSubcategory,
);

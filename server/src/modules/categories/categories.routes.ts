
import { Router } from "express";

import {
  createCategory,
  deactivateCategory,
  listAdminCategories,
  listCategories,
  updateCategory,
} from "./categories.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  listAdminCategories,
);

// Catálogo público: categorias ativas
categoriesRouter.get("/", listCategories);

// Dashboard: listagem administrativa
categoriesRouter.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  (req, _res, next) => {
    req.query.includeInactive = "true";
    next();
  },
  listCategories,
);

// Criar categoria
categoriesRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createCategory,
);

// Editar categoria
categoriesRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateCategory,
);

// Desativar categoria
categoriesRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deactivateCategory,
);

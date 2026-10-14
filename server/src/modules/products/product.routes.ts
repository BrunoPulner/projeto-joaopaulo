
import { Router } from "express";

import {
  createProduct,
  deactivateProduct,
  listAdminProducts,
  listProducts,
  updateProduct,
} from "./products.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

export const productsRouter = Router();

// Catálogo público
productsRouter.get("/", listProducts);

// Gerenciamento administrativo
productsRouter.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  listAdminProducts,
);

productsRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createProduct,
);

productsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateProduct,
);

productsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deactivateProduct,
);

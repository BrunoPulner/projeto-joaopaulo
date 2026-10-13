import { Router } from "express";
import type { RequestHandler } from "express";

import {
  createCategory,
  deactivateCategory,
  listCategories,
  updateCategory,
} from "./categories.controller.js";

export const categoriesRouter = Router();

const requireAdmin: RequestHandler = (_req, res) => {
  res.status(503).json({
    message:
      "Operação administrativa indisponível até configurar autenticação.",
  });
};

categoriesRouter.get("/", listCategories);

categoriesRouter.post("/", requireAdmin, createCategory);
categoriesRouter.patch("/:id", requireAdmin, updateCategory);
categoriesRouter.delete("/:id", requireAdmin, deactivateCategory);
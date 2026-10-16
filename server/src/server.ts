
import "dotenv/config";

import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./lib/auth.js";

import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { subcategoriesRouter } from "./modules/subcategories/subcategories.routes.js";

import { productsRouter } from "./modules/products/product.routes.js";

import { addonsRouter } from "./modules/addons/addon.routes.js";

import {
  productAddonsAdminRouter,
  productAddonsPublicRouter,
} from "./modules/product-addons/product-addon.routes.js";

import { pizzaFlavorsRouter } from "./modules/pizza-flavors/pizza-flavors.routes.js";

import { uploadsRouter } from "./modules/uploads/uploads.routes.js";
import { productImagesRouter } from "./modules/uploads/productImages.routes.js";
import { pizzaSizesRouter } from "./modules/pizza-sizes/pizza-sizes.routes.js";
import { pizzaCatalogFlavorsRouter } from "./modules/pizza-catalog-flavors/pizza-catalog-flavors.routes.js";
import { pizzaAddonsRouter } from "./modules/pizza-addons/pizza-addons.routes.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

// ============================================
// 1. CONFIGURAÇÃO DO CORS
// ============================================

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// ============================================
// 2. AUTENTICAÇÃO BETTER AUTH
// ============================================

// Registrar antes de express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

// ============================================
// 3. CONFIGURAÇÃO JSON
// ============================================

app.use(express.json());

// ============================================
// 4. VERIFICAÇÃO DA API
// ============================================

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    message: "API Espetinhos João Paulo funcionando.",
  });
});

// ============================================
// 5. CATEGORIAS E SUBCATEGORIAS
// ============================================

app.use("/api/categories", categoriesRouter);

app.use("/api/subcategories", subcategoriesRouter);

// ============================================
// 6. ADICIONAIS
// ============================================

// Cadastro e gerenciamento de adicionais
app.use("/api/addons", addonsRouter);

// Adicionais vinculados aos produtos
app.use("/api/products", productAddonsPublicRouter);

// Administração dos vínculos de adicionais
app.use(
  "/api/admin/product-addons",
  productAddonsAdminRouter,
);

// ============================================
// 7. PRODUTOS
// ============================================

app.use("/api/products", productsRouter);

// ============================================
// 8. SABORES DE PIZZA
// ============================================

// Tamanhos de pizza
app.use("/api/pizza-sizes", pizzaSizesRouter);

// Sabores de pizza (módulo anterior)
app.use("/api/pizza-flavors", pizzaFlavorsRouter);

// Tamanhos de pizza
app.use("/api/pizza-sizes", pizzaSizesRouter);

// Novo catálogo compartilhado de sabores
app.use("/api/pizza-catalog-flavors", pizzaCatalogFlavorsRouter);

// Sabores antigos vinculados a produtos (compatibilidade)
app.use("/api/pizza-flavors", pizzaFlavorsRouter);

// Cadastro, edição, listagem e desativação
// de sabores, além de vínculos de adicionais.
app.use("/api/pizza-flavors", pizzaFlavorsRouter);

// Tamanhos de pizza
app.use("/api/pizza-sizes", pizzaSizesRouter);

// Catálogo compartilhado de sabores
app.use("/api/pizza-catalog-flavors", pizzaCatalogFlavorsRouter);

// Adicionais específicos das pizzas
app.use("/api/pizza-addons", pizzaAddonsRouter);

// API antiga de sabores, mantida por compatibilidade
app.use("/api/pizza-flavors", pizzaFlavorsRouter);

// ============================================
// 9. UPLOADS E IMAGENS
// ============================================

app.use("/api/admin/uploads", uploadsRouter);

app.use("/api/images", productImagesRouter);

// ============================================
// 10. INICIALIZAÇÃO DO SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(
    `🔥 API Espetinhos João Paulo rodando em http://localhost:${PORT}`,
  );
});

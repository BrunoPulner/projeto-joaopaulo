
import "dotenv/config";

import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

// ============================================
// AUTENTICAÇÃO
// ============================================

import { auth } from "./lib/auth.js";

// ============================================
// CATEGORIAS E SUBCATEGORIAS
// ============================================

import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { subcategoriesRouter } from "./modules/subcategories/subcategories.routes.js";

// ============================================
// PRODUTOS
// ============================================

import { productsRouter } from "./modules/products/product.routes.js";

// ============================================
// ADICIONAIS
// ============================================

import { addonsRouter } from "./modules/addons/addon.routes.js";

import {
  productAddonsAdminRouter,
  productAddonsPublicRouter,
} from "./modules/product-addons/product-addon.routes.js";

// ============================================
// PIZZAS
// ============================================

// Modelo anterior: sabores por produto
import { pizzaFlavorsRouter } from "./modules/pizza-flavors/pizza-flavors.routes.js";

// Modelo atual: tamanhos
import { pizzaSizesRouter } from "./modules/pizza-sizes/pizza-sizes.routes.js";

// Modelo atual: catálogo compartilhado de sabores
import { pizzaCatalogFlavorsRouter } from "./modules/pizza-catalog-flavors/pizza-catalog-flavors.routes.js";

// Modelo atual: adicionais de pizza
import { pizzaAddonsRouter } from "./modules/pizza-addons/pizza-addons.routes.js";

// ============================================
// UPLOADS E IMAGENS
// ============================================

import { uploadsRouter } from "./modules/uploads/uploads.routes.js";
import { productImagesRouter } from "./modules/uploads/productImages.routes.js";

// ============================================
// INICIALIZAÇÃO
// ============================================

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

// ============================================
// 1. CORS
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

// Deve permanecer antes de express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

// ============================================
// 3. JSON
// ============================================

app.use(express.json());

// ============================================
// 4. HEALTH CHECK
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
// 6. PRODUTOS
// ============================================

// Listagem pública e gerenciamento administrativo
app.use("/api/products", productsRouter);

// ============================================
// 7. ADICIONAIS
// ============================================

// Cadastro e gerenciamento
app.use("/api/addons", addonsRouter);

// Adicionais disponíveis por produto
app.use("/api/products", productAddonsPublicRouter);

// Gerenciamento dos vínculos
app.use(
  "/api/admin/product-addons",
  productAddonsAdminRouter,
);

// ============================================
// 8. PIZZAS
// ============================================

// Tamanhos cadastrados
app.use("/api/pizza-sizes", pizzaSizesRouter);

// Catálogo compartilhado de sabores
app.use(
  "/api/pizza-catalog-flavors",
  pizzaCatalogFlavorsRouter,
);

// Adicionais de pizzas
app.use("/api/pizza-addons", pizzaAddonsRouter);

// Modelo anterior, mantido para compatibilidade
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

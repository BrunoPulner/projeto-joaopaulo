
import "dotenv/config";

import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./lib/auth.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";

import { subcategoriesRouter } from "./modules/subcategories/subcategories.routes.js";

import { productsRouter } from "./modules/products/product.routes.js";
import { uploadsRouter } from "./modules/uploads/uploads.routes.js";

import { productImagesRouter } from "./modules/uploads/productImages.routes.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

// 1. Configuração do CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// 2. Rotas de autenticação do Better Auth
// IMPORTANTE: registrar antes de express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

// 3. Configuração para receber JSON
app.use(express.json());

// 4. Rota de verificação da API
app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    message: "API Espetinhos João Paulo funcionando.",
  });
});

// 5. Rotas de categorias
app.use("/api/categories", categoriesRouter);

app.use("/api/subcategories", subcategoriesRouter);

app.use("/api/products", productsRouter);

app.use("/api/admin/uploads", uploadsRouter);

app.use("/api/images", productImagesRouter);

// 6. Inicialização do servidor
app.listen(PORT, () => {
  console.log(
    `🔥 API Espetinhos João Paulo rodando em http://localhost:${PORT}`,
  );
});

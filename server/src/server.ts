
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
// ENTREGAS E FRETES
// ============================================

import {
  deliverySettingsAdminRouter,
  deliveryAvailabilityRouter,
} from "./modules/delivery-settings/delivery-settings.routes.js";

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

// ============================================
// 1. CONFIGURAÇÃO DE CORS
// ============================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

// O CORS precisa ser registrado antes
// de todas as rotas da aplicação.
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

// ============================================
// 2. AUTENTICAÇÃO BETTER AUTH
// ============================================

// O Better Auth precisa receber o corpo
// original da requisição.
//
// Por isso, essa rota deve permanecer
// ANTES do express.json().
app.all(
  "/api/auth/*splat",
  toNodeHandler(auth),
);

// ============================================
// 3. PARSERS DE REQUISIÇÃO
// ============================================

// Permite receber JSON nos endpoints.
//
// Exemplo:
// {
//   "latitude": -25.62,
//   "longitude": -50.68
// }
app.use(express.json());

// Permite interpretar formulários URL-encoded.
app.use(
  express.urlencoded({
    extended: true,
  }),
);

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

app.use(
  "/api/categories",
  categoriesRouter,
);

app.use(
  "/api/subcategories",
  subcategoriesRouter,
);

// ============================================
// 6. PRODUTOS
// ============================================

app.use(
  "/api/products",
  productsRouter,
);

// ============================================
// 7. ADICIONAIS
// ============================================

// Cadastro e gerenciamento de adicionais
app.use(
  "/api/addons",
  addonsRouter,
);

// Adicionais disponíveis por produto
app.use(
  "/api/products",
  productAddonsPublicRouter,
);

// Gerenciamento administrativo dos vínculos
app.use(
  "/api/admin/product-addons",
  productAddonsAdminRouter,
);

// ============================================
// 8. PIZZAS
// ============================================

// Tamanhos
app.use(
  "/api/pizza-sizes",
  pizzaSizesRouter,
);

// Catálogo compartilhado de sabores
app.use(
  "/api/pizza-catalog-flavors",
  pizzaCatalogFlavorsRouter,
);

// Adicionais específicos de pizza
app.use(
  "/api/pizza-addons",
  pizzaAddonsRouter,
);

// Modelo anterior, mantido para compatibilidade
app.use(
  "/api/pizza-flavors",
  pizzaFlavorsRouter,
);

// ============================================
// 9. ENTREGAS E FRETES
// ============================================

// Configurações administrativas:
// - Taxa fixa
// - WhatsApp
// - Ativação de entregas
// - Cadastro e edição do perímetro
//
// O router aplica requireAuth e
// requireRole("ADMIN").
app.use(
  "/api/admin/delivery-settings",
  deliverySettingsAdminRouter,
);

// Consulta pública de disponibilidade.
//
// POST /api/delivery/availability
//
// Recebe latitude e longitude e verifica
// se estão dentro do perímetro permitido.
app.use(
  "/api/delivery",
  deliveryAvailabilityRouter,
);

// ============================================
// 10. UPLOADS E IMAGENS
// ============================================

// Upload administrativo
app.use(
  "/api/admin/uploads",
  uploadsRouter,
);

// Imagens públicas dos produtos
app.use(
  "/api/images",
  productImagesRouter,
);

// ============================================
// 11. INICIALIZAÇÃO DO SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(
    `🔥 API Espetinhos João Paulo rodando em http://localhost:${PORT}`,
  );
});

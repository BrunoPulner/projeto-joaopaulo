
import "dotenv/config";

import { betterAuth } from "better-auth";
import { pool } from "../lib/db.js";
import {
  APIError,
  createAuthMiddleware,
} from "better-auth/api";

// =====================================================
// VARIÁVEIS DE AMBIENTE
// =====================================================

const requiredEnv = [
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "FRONTEND_URL",
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(
      `Variável obrigatória ausente: ${key}`,
    );
  }
}




// =====================================================
// CONFIGURAÇÃO DO BETTER AUTH
// =====================================================

export const auth = betterAuth({
  appName: "Espetinhos João Paulo",

  database: pool,

  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,

  // ===================================================
  // ORIGENS AUTORIZADAS
  // ===================================================

  trustedOrigins: [
    process.env.FRONTEND_URL!,
  ],

  // ===================================================
  // CONTAS E VINCULAÇÃO DE PROVEDORES
  // ===================================================

  account: {
    accountLinking: {
      enabled: false,
    },
  },

  // ===================================================
  // LOGIN COM E-MAIL E SENHA
  // EXCLUSIVO PARA ADMINISTRADORES
  // ===================================================

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 12,
  },

  // ===================================================
  // LOGIN GOOGLE
  // UTILIZADO PELOS CLIENTES
  // ===================================================

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // ===================================================
  // PERFIS DOS USUÁRIOS
  // ===================================================

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "CUSTOMER",
        input: false,
      },
    },
  },

  // ===================================================
  // REGRAS DE AUTENTICAÇÃO
  // ===================================================

  hooks: {
    before: createAuthMiddleware(async (ctx) => {

      // -------------------------------------------------
      // BLOQUEAR CADASTRO PÚBLICO COM SENHA
      // -------------------------------------------------

      if (ctx.path === "/sign-up/email") {
        throw new APIError("FORBIDDEN", {
          message:
            "Cadastro por e-mail e senha indisponível.",
        });
      }

      // -------------------------------------------------
      // BLOQUEAR VINCULAÇÃO MANUAL DE PROVEDORES
      // -------------------------------------------------

      if (ctx.path === "/link-social") {
        throw new APIError("FORBIDDEN", {
          message:
            "Vinculação de contas indisponível.",
        });
      }

      // -------------------------------------------------
      // LOGIN POR SENHA SOMENTE PARA ADMIN
      // -------------------------------------------------

      if (ctx.path === "/sign-in/email") {
        const body = ctx.body as
          | { email?: string }
          | undefined;

        const email = body?.email
          ?.trim()
          .toLowerCase();

        if (!email) {
          throw new APIError("UNAUTHORIZED", {
            message: "Credenciais inválidas.",
          });
        }

        const result = await pool.query<{
          role: string;
        }>(
          `
          SELECT role
          FROM public."user"
          WHERE LOWER(email) = $1
          LIMIT 1
          `,
          [email],
        );

        if (result.rows[0]?.role !== "ADMIN") {
          throw new APIError("UNAUTHORIZED", {
            message: "Credenciais inválidas.",
          });
        }
      }
    }),
  },
});

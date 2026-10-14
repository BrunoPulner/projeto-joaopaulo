
import type { RequestHandler } from "express";

import { pool } from "../lib/db.js";

// =====================================================
// PERFIS PERMITIDOS NO SISTEMA
// =====================================================

export type UserRole =
  | "CUSTOMER"
  | "ADMIN"
  | "DELIVERY";

// =====================================================
// MIDDLEWARE DE AUTORIZAÇÃO
// =====================================================

export function requireRole(
  ...allowedRoles: UserRole[]
): RequestHandler {
  return async (_req, res, next) => {
    // -------------------------------------------------
    // USUÁRIO AUTENTICADO PELO BETTER AUTH
    // -------------------------------------------------

    const user = res.locals.authUser as
      | { id: string }
      | undefined;

    if (!user?.id) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado.",
      });

      return;
    }

    try {
      // -------------------------------------------------
      // CONSULTAR PERMISSÃO ATUAL NO NEON
      // -------------------------------------------------

      const result = await pool.query<{
        role: string;
      }>(
        `
        SELECT role
        FROM public."user"
        WHERE id = $1
        LIMIT 1
        `,
        [user.id],
      );

      const role = result.rows[0]?.role;

      // -------------------------------------------------
      // VERIFICAR SE O PERFIL É PERMITIDO
      // -------------------------------------------------

      if (
        !role ||
        !allowedRoles.includes(role as UserRole)
      ) {
        res.status(403).json({
          success: false,
          message:
            "Você não possui permissão para acessar este recurso.",
        });

        return;
      }

      // -------------------------------------------------
      // PROTEÇÃO ADICIONAL PARA ADMINISTRADORES
      // -------------------------------------------------

      if (role === "ADMIN") {
        const accountResult = await pool.query<{
          providerId: string;
        }>(
          `
          SELECT "providerId"
          FROM public.account
          WHERE "userId" = $1
          `,
          [user.id],
        );

        const providers = accountResult.rows.map(
          (account) => account.providerId,
        );

        // A conta ADMIN deve possuir apenas
        // autenticação por credenciais.
        const validAdminAccount =
          providers.length === 1 &&
          providers[0] === "credential";

        if (!validAdminAccount) {
          console.warn(
            "[AUTH] Conta administrativa com provedor inválido.",
            { userId: user.id },
          );

          res.status(403).json({
            success: false,
            message:
              "Método de autenticação não permitido para administradores.",
          });

          return;
        }
      }

      // -------------------------------------------------
      // DISPONIBILIZAR PERMISSÃO VALIDADA
      // -------------------------------------------------

      res.locals.userRole = role;

      next();
    } catch (error) {
      console.error(
        "[AUTH] Erro ao verificar permissão:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Erro interno ao verificar permissões.",
      });
    }
  };
}

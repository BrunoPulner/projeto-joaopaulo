
import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../lib/auth.js";

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =====================================================

export const requireAuth: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    // -------------------------------------------------
    // CONSULTAR SESSÃO NO BETTER AUTH
    // -------------------------------------------------

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    // -------------------------------------------------
    // VERIFICAR SE O USUÁRIO ESTÁ AUTENTICADO
    // -------------------------------------------------

    if (
      !session ||
      !session.user ||
      !session.session
    ) {
      res.status(401).json({
        success: false,
        message: "Você precisa estar autenticado.",
      });

      return;
    }

    // -------------------------------------------------
    // DISPONIBILIZAR DADOS PARA OS PRÓXIMOS MIDDLEWARES
    // -------------------------------------------------

    res.locals.authUser = session.user;

    res.locals.authSession = session.session;

    // -------------------------------------------------
    // CONTINUAR PARA A PRÓXIMA ETAPA
    // -------------------------------------------------

    next();
  } catch (error) {
    console.error(
      "[AUTH] Erro ao validar sessão:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Não foi possível verificar sua autenticação.",
    });
  }
};


import "dotenv/config";

import { Pool } from "pg";
import { auth } from "../lib/auth.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "João Paulo";

async function main() {
  if (!email || !password) {
    throw new Error(
      "Configure ADMIN_EMAIL e ADMIN_PASSWORD no .env.",
    );
  }

  if (password.length < 12) {
    throw new Error(
      "A senha administrativa deve ter pelo menos 12 caracteres.",
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });

  try {
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM public."user"
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email],
    );

    if (existing.rowCount) {
      throw new Error(
        "Este e-mail já possui uma conta. Nenhuma alteração foi realizada.",
      );
    }

    // API interna do servidor: não passa pela
    // rota HTTP pública de cadastro.
    const created = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!created.user?.id) {
      throw new Error("Não foi possível criar o administrador.");
    }

    const result = await pool.query(
      `UPDATE public."user"
       SET role = 'ADMIN'
       WHERE id = $1 AND role = 'CUSTOMER'
       RETURNING id`,
      [created.user.id],
    );

    if (result.rowCount !== 1) {
      throw new Error(
        "Conta criada, mas não foi possível atribuir ADMIN. Verifique o banco antes de executar novamente.",
      );
    }

    console.log("Administrador criado com sucesso.");
    console.log(`E-mail: ${email}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Falha ao criar administrador:", error);
  process.exitCode = 1;
});

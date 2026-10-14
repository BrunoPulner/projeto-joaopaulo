
import "dotenv/config";

import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Variável DATABASE_URL não configurada.",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

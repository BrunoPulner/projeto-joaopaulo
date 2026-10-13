import "dotenv/config";

import postgres from "@prisma/orm-postgres/runtime";

import type { Contract } from "./contract.js";
import contractJson from "./contract.json" with { type: "json" };

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL não foi configurada no arquivo .env.",
  );
}

export const db = postgres<Contract>({
  contractJson,
  url: databaseUrl,
});
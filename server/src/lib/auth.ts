import "dotenv/config";

import { betterAuth } from "better-auth";
import { Pool } from "pg";

const requiredEnv = [
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "BETTER_AUTH_SECRET",
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Variável obrigatória ausente: ${key}`);
  }
}

export const auth = betterAuth({
  appName: "Espetinhos João Paulo",

  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 5,
  }),

  baseURL: process.env.BETTER_AUTH_URL,

  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    process.env.FRONTEND_URL ?? "http://localhost:5173",  "http://localhost:5174",
  ],

  emailAndPassword: {
    enabled: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

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

});
import dotenv from "dotenv";

const rawEnv = process.env.APP_ENV || process.env.NODE_ENV || "development";
const appEnv = rawEnv === "prod" ? "production" : rawEnv;
const envFile = appEnv === "production" ? ".env.prod" : ".env.dev";

dotenv.config({ path: envFile });
dotenv.config();

const isProdEnvironment = appEnv === "production" || appEnv === "prod";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = isProdEnvironment
    ? process.env.DATABASE_URL_PROD
    : process.env.DATABASE_URL_DEV;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "No se encontro DATABASE_URL. Define DATABASE_URL o usa DATABASE_URL_DEV/DATABASE_URL_PROD junto con APP_ENV/NODE_ENV."
  );
}

export const config = {
  appEnv,
  isProdEnvironment,
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT) || 4000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "digifacil-super-secret",
  adminEmail: process.env.ADMIN_EMAIL || "admin@digifacil.lat",
  adminPassword: process.env.ADMIN_PASSWORD || "Digifacil2026!",
};

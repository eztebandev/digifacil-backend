import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 4000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "digifacil-super-secret",
  adminEmail: process.env.ADMIN_EMAIL || "admin@digifacil.lat",
  adminPassword: process.env.ADMIN_PASSWORD || "Digifacil2026!",
};

import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.prod" });
dotenv.config();

// En entornos con poolers (p. ej. PgBouncer), usar DIRECT_URL evita
// conflictos de prepared statements durante seeds/migraciones.
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_PROD) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD;
}

const prisma = new PrismaClient();

const adminEmail = (process.env.ADMIN_EMAIL || "admin@digifacil.lat").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "Digifacil2026!";
const adminUsername = (process.env.ADMIN_USERNAME || adminEmail.split("@")[0] || "admin")
  .trim()
  .toLowerCase();

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    update: {
      username: adminUsername,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log(`Admin seed listo: ${admin.email} (${admin.username})`);
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed de admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

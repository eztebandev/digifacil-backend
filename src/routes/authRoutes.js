import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

function buildToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, username: user.username },
    config.jwtSecret,
    { expiresIn: "8h" }
  );
}

router.post("/login", async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (typeof identifier !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Credenciales invalidas." });
    }

    const normalized = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { username: normalized }],
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Credenciales invalidas." });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales invalidas." });
    }

    return res.json({
      token: buildToken(user),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

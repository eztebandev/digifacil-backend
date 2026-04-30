import jwt from "jsonwebtoken";
import { config } from "../config.js";

function authenticateToken(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token no proporcionado." });
    return null;
  }

  try {
    const token = authHeader.split(" ")[1];
    return jwt.verify(token, config.jwtSecret);
  } catch {
    res.status(401).json({ message: "Token invalido o expirado." });
    return null;
  }
}

export function authenticateAdmin(req, res, next) {
  const payload = authenticateToken(req, res);
  if (!payload) return;
  if (payload.role !== "ADMIN") {
    return res.status(403).json({ message: "No tienes permisos para esta accion." });
  }
  req.user = payload;
  next();
}

export function authenticateUser(req, res, next) {
  const payload = authenticateToken(req, res);
  if (!payload) return;
  req.user = payload;
  next();
}

import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado." });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalido o expirado." });
  }
}

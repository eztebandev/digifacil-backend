import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

export default router;

import { Router } from "express";
import { readJsonFile } from "../utils/fileStore.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const courses = await readJsonFile("courses.json", []);
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

export default router;

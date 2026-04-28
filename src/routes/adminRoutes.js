import { Router } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { config } from "../config.js";
import { authenticateAdmin } from "../middleware/authMiddleware.js";
import { readJsonFile, writeJsonFile } from "../utils/fileStore.js";

const router = Router();

function buildToken() {
  return jwt.sign(
    { role: "admin", email: config.adminEmail },
    config.jwtSecret,
    { expiresIn: "8h" }
  );
}

function validateCredentials(email, password) {
  return email === config.adminEmail && password === config.adminPassword;
}

function validateCoursePayload(payload) {
  const requiredFields = [
    "title",
    "description",
    "level",
    "duration",
    "modality",
    "price",
  ];

  return requiredFields.every(
    (field) => typeof payload[field] === "string" && payload[field].trim().length > 0
  );
}

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!validateCredentials(email, password)) {
    return res.status(401).json({ message: "Credenciales invalidas." });
  }

  return res.json({
    token: buildToken(),
    user: {
      email: config.adminEmail,
      role: "admin",
    },
  });
});

router.get("/courses", authenticateAdmin, async (_req, res, next) => {
  try {
    const courses = await readJsonFile("courses.json", []);
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

router.post("/courses", authenticateAdmin, async (req, res, next) => {
  try {
    if (!validateCoursePayload(req.body)) {
      return res.status(400).json({ message: "Completa todos los campos del curso." });
    }

    const courses = await readJsonFile("courses.json", []);
    const newCourse = {
      id: randomUUID(),
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      level: req.body.level.trim(),
      duration: req.body.duration.trim(),
      modality: req.body.modality.trim(),
      price: req.body.price.trim(),
      highlight: Boolean(req.body.highlight),
    };

    const updatedCourses = [newCourse, ...courses];
    await writeJsonFile("courses.json", updatedCourses);
    res.status(201).json(newCourse);
  } catch (error) {
    next(error);
  }
});

router.put("/courses/:id", authenticateAdmin, async (req, res, next) => {
  try {
    if (!validateCoursePayload(req.body)) {
      return res.status(400).json({ message: "Completa todos los campos del curso." });
    }

    const courses = await readJsonFile("courses.json", []);
    const index = courses.findIndex((course) => course.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: "Curso no encontrado." });
    }

    const updatedCourse = {
      ...courses[index],
      ...req.body,
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      level: req.body.level.trim(),
      duration: req.body.duration.trim(),
      modality: req.body.modality.trim(),
      price: req.body.price.trim(),
      highlight: Boolean(req.body.highlight),
    };

    courses[index] = updatedCourse;
    await writeJsonFile("courses.json", courses);
    res.json(updatedCourse);
  } catch (error) {
    next(error);
  }
});

router.delete("/courses/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const courses = await readJsonFile("courses.json", []);
    const filteredCourses = courses.filter((course) => course.id !== req.params.id);

    if (filteredCourses.length === courses.length) {
      return res.status(404).json({ message: "Curso no encontrado." });
    }

    await writeJsonFile("courses.json", filteredCourses);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

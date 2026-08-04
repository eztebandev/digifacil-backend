import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

const publicCourseSummarySelect = {
  id: true,
  title: true,
  description: true,
  level: true,
  duration: true,
  sessionCount: true,
  hoursPerSession: true,
  modality: true,
  price: true,
  currency: true,
  priceAmount: true,
  imageUrlSquare: true,
  imageUrlHorizontal: true,
  highlight: true,
  categories: {
    select: {
      courseId: true,
      categoryId: true,
      createdAt: true,
      category: true,
    },
  },
};

const publicCourseDetailInclude = {
  categories: {
    include: {
      category: true,
    },
  },
  detail: true,
  syllabusItems: {
    orderBy: {
      session: "asc",
    },
  },
  faqs: {
    orderBy: {
      order: "asc",
    },
  },
  testimonials: {
    orderBy: {
      order: "asc",
    },
  },
};

router.get("/", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        status: "PUBLIC",
      },
      select: publicCourseSummarySelect,
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const course = await prisma.course.findFirst({
      where: {
        id: req.params.id,
        status: "PUBLIC",
      },
      include: publicCourseDetailInclude,
    });
    if (!course) return res.status(404).json({ message: "Curso no encontrado." });
    res.json(course);
  } catch (error) {
    next(error);
  }
});

export default router;

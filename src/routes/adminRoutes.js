import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { authenticateAdmin } from "../middleware/authMiddleware.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

function buildToken() {
  return jwt.sign({ role: "ADMIN", email: config.adminEmail }, config.jwtSecret, { expiresIn: "8h" });
}

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email !== config.adminEmail || password !== config.adminPassword) {
    return res.status(401).json({ message: "Credenciales invalidas." });
  }
  return res.json({ token: buildToken(), user: { email: config.adminEmail, role: "ADMIN" } });
});

router.get("/courses", authenticateAdmin, async (_req, res, next) => {
  try {
    res.json(await prisma.course.findMany({ orderBy: { createdAt: "desc" } }));
  } catch (error) { next(error); }
});

router.post("/courses", authenticateAdmin, async (req, res, next) => {
  try {
    const { title, description, level, highlight } = req.body;
    const modality = req.body.modality || req.body.modalidad;
    const currency = req.body.currency || req.body.moneda;
    const sessionCount = Number(req.body.sessionCount);
    const hoursPerSession = Number(req.body.hoursPerSession);
    const missing = [];
    if (!title) missing.push("title");
    if (!description) missing.push("description");
    if (!level) missing.push("level");
    if (!modality) missing.push("modality");
    if (!currency) missing.push("currency");
    if (!Number.isFinite(sessionCount) || sessionCount < 1) missing.push("sessionCount");
    if (!Number.isFinite(hoursPerSession) || hoursPerSession < 1) missing.push("hoursPerSession");
    if (missing.length) return res.status(400).json({ message: `Completa todos los campos del curso. Faltan: ${missing.join(", ")}` });
    const numericPrice = Number(req.body.priceAmount ?? req.body.price ?? 0);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) return res.status(400).json({ message: "El precio debe ser un numero valido." });
    const course = await prisma.course.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        level: String(level).trim(),
        modality: String(modality).trim(),
        sessionCount,
        hoursPerSession,
        duration: `${sessionCount} sesiones x ${hoursPerSession} horas`,
        currency: String(currency).trim(),
        priceAmount: numericPrice,
        price: `${String(currency).trim()} ${numericPrice}`,
        highlight: Boolean(highlight),
      },
    });
    res.status(201).json(course);
  } catch (error) { next(error); }
});

router.put("/courses/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const { title, description, level, highlight } = req.body;
    const modality = req.body.modality || req.body.modalidad;
    const currency = req.body.currency || req.body.moneda;
    const sessionCount = Number(req.body.sessionCount);
    const hoursPerSession = Number(req.body.hoursPerSession);
    const missing = [];
    if (!title) missing.push("title");
    if (!description) missing.push("description");
    if (!level) missing.push("level");
    if (!modality) missing.push("modality");
    if (!currency) missing.push("currency");
    if (!Number.isFinite(sessionCount) || sessionCount < 1) missing.push("sessionCount");
    if (!Number.isFinite(hoursPerSession) || hoursPerSession < 1) missing.push("hoursPerSession");
    if (missing.length) return res.status(400).json({ message: `Completa todos los campos del curso. Faltan: ${missing.join(", ")}` });
    const numericPrice = Number(req.body.priceAmount ?? req.body.price ?? 0);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) return res.status(400).json({ message: "El precio debe ser un numero valido." });
    const course = await prisma.$transaction(async (tx) => {
      const prev = await tx.course.findUnique({ where: { id: req.params.id } });
      if (!prev) {
        const err = new Error("Curso no encontrado.");
        err.code = "P2025";
        throw err;
      }
      const updated = await tx.course.update({
        where: { id: req.params.id },
        data: {
          title: String(title).trim(),
          description: String(description).trim(),
          level: String(level).trim(),
          modality: String(modality).trim(),
          sessionCount,
          hoursPerSession,
          duration: `${sessionCount} sesiones x ${hoursPerSession} horas`,
          currency: String(currency).trim(),
          priceAmount: numericPrice,
          price: `${String(currency).trim()} ${numericPrice}`,
          highlight: Boolean(highlight),
        },
      });

      const groups = await tx.courseGroup.findMany({
        where: { courseId: req.params.id },
        include: { sessions: { orderBy: { startAt: "asc" } } },
      });

      for (const group of groups) {
        const currentSessions = group.sessions || [];
        if (currentSessions.length < sessionCount) {
          const toCreate = sessionCount - currentSessions.length;
          const base =
            currentSessions[currentSessions.length - 1] ||
            {
              startAt: new Date(),
              endAt: new Date(Date.now() + hoursPerSession * 60 * 60 * 1000),
            };
          const startBase = new Date(base.startAt);
          const endBase = new Date(base.endAt);
          for (let i = 0; i < toCreate; i += 1) {
            const startAt = new Date(startBase);
            startAt.setDate(startAt.getDate() + i + 1);
            const endAt = new Date(endBase);
            endAt.setDate(endAt.getDate() + i + 1);
            await tx.courseSession.create({
              data: {
                groupId: group.id,
                title: `Sesion ${currentSessions.length + i + 1}`,
                description: null,
                startAt,
                endAt,
              },
            });
          }
        } else if (currentSessions.length > sessionCount) {
          const extra = currentSessions.slice(sessionCount);
          await tx.courseSession.deleteMany({ where: { id: { in: extra.map((s) => s.id) } } });
        }
      }
      return updated;
    });
    res.json(course);
  } catch (error) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Curso no encontrado." });
    if (error?.code === "P2002") return res.status(409).json({ message: "Ya existe un curso con esos datos unicos." });
    next(error);
  }
});

router.delete("/courses/:id", authenticateAdmin, async (req, res, next) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) { next(error); }
});

router.get("/users/students", authenticateAdmin, async (_req, res, next) => {
  try {
    const rows = await prisma.studentProfile.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });
    res.json(rows.map((s) => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, phone: s.phone, email: s.user.email, username: s.user.username, userId: s.userId })));
  } catch (error) { next(error); }
});

router.post("/users/students", authenticateAdmin, async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, username, password } = req.body;
    const passwordHash = await bcrypt.hash(String(password), 10);
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: String(email).toLowerCase(), username: String(username).toLowerCase(), passwordHash, role: "STUDENT" } });
      return tx.studentProfile.create({ data: { userId: user.id, firstName: String(firstName), lastName: String(lastName), phone: phone || null }, include: { user: true } });
    });
    res.status(201).json({ id: created.id, firstName: created.firstName, lastName: created.lastName, phone: created.phone, email: created.user.email, username: created.user.username, userId: created.userId });
  } catch (error) { next(error); }
});
router.put("/users/students/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, username, password } = req.body;
    const updated = await prisma.$transaction(async (tx) => {
      const profile = await tx.studentProfile.update({
        where: { id: req.params.id },
        data: { firstName: String(firstName), lastName: String(lastName), phone: phone || null },
      });
      const data = { email: String(email).toLowerCase(), username: String(username).toLowerCase() };
      if (password) data.passwordHash = await bcrypt.hash(String(password), 10);
      const user = await tx.user.update({ where: { id: profile.userId }, data });
      return { profile, user };
    });
    res.json({ id: updated.profile.id, firstName: updated.profile.firstName, lastName: updated.profile.lastName, phone: updated.profile.phone, email: updated.user.email, username: updated.user.username, userId: updated.profile.userId });
  } catch (error) { next(error); }
});
router.delete("/users/students/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: "Alumno no encontrado." });
    await prisma.user.delete({ where: { id: profile.userId } });
    res.status(204).send();
  } catch (error) { next(error); }
});

router.get("/users/teachers", authenticateAdmin, async (_req, res, next) => {
  try {
    const rows = await prisma.teacherProfile.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });
    res.json(rows.map((t) => ({ id: t.id, firstName: t.firstName, lastName: t.lastName, bio: t.bio, email: t.user.email, username: t.user.username, userId: t.userId })));
  } catch (error) { next(error); }
});

router.post("/users/teachers", authenticateAdmin, async (req, res, next) => {
  try {
    const { firstName, lastName, bio, email, username, password } = req.body;
    const passwordHash = await bcrypt.hash(String(password), 10);
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: String(email).toLowerCase(), username: String(username).toLowerCase(), passwordHash, role: "TEACHER" } });
      return tx.teacherProfile.create({ data: { userId: user.id, firstName: String(firstName), lastName: String(lastName), bio: bio || null }, include: { user: true } });
    });
    res.status(201).json({ id: created.id, firstName: created.firstName, lastName: created.lastName, bio: created.bio, email: created.user.email, username: created.user.username, userId: created.userId });
  } catch (error) { next(error); }
});
router.put("/users/teachers/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const { firstName, lastName, bio, email, username, password } = req.body;
    const updated = await prisma.$transaction(async (tx) => {
      const profile = await tx.teacherProfile.update({
        where: { id: req.params.id },
        data: { firstName: String(firstName), lastName: String(lastName), bio: bio || null },
      });
      const data = { email: String(email).toLowerCase(), username: String(username).toLowerCase() };
      if (password) data.passwordHash = await bcrypt.hash(String(password), 10);
      const user = await tx.user.update({ where: { id: profile.userId }, data });
      return { profile, user };
    });
    res.json({ id: updated.profile.id, firstName: updated.profile.firstName, lastName: updated.profile.lastName, bio: updated.profile.bio, email: updated.user.email, username: updated.user.username, userId: updated.profile.userId });
  } catch (error) { next(error); }
});
router.delete("/users/teachers/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const profile = await prisma.teacherProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) return res.status(404).json({ message: "Docente no encontrado." });
    await prisma.user.delete({ where: { id: profile.userId } });
    res.status(204).send();
  } catch (error) { next(error); }
});

router.get("/groups", authenticateAdmin, async (_req, res, next) => {
  try {
    res.json(await prisma.courseGroup.findMany({ include: { course: true, teachers: { include: { teacher: true } }, enrollments: { include: { student: { include: { user: true } } } }, sessions: { include: { materials: true }, orderBy: { startAt: "asc" } } }, orderBy: { createdAt: "desc" } }));
  } catch (error) { next(error); }
});

router.post("/groups", authenticateAdmin, async (req, res, next) => {
  try {
    const { courseId, name, sessions } = req.body;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Curso no encontrado." });
    if (!Array.isArray(sessions) || sessions.length < 1) {
      return res.status(400).json({ message: "Debes registrar al menos 1 sesion para el grupo." });
    }
    if (sessions.length !== Number(course.sessionCount)) {
      return res.status(400).json({ message: `Debes registrar exactamente ${course.sessionCount} sesiones.` });
    }
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.courseGroup.create({ data: { courseId, name, schedule: "" } });
      await tx.courseSession.createMany({
        data: sessions.map((s, i) => ({
          groupId: group.id,
          title: s.title || `Sesion ${i + 1}`,
          startAt: new Date(s.startAt),
          endAt: new Date(s.endAt),
          description: s.description || null,
          meetLink: s.meetLink || null,
          youtubeUrl: s.youtubeUrl || null,
          embedUrl: s.embedUrl || null,
        })),
      });
      return group;
    });
    res.status(201).json(result);
  } catch (error) { next(error); }
});

router.put("/groups/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const { courseId, name, sessions } = req.body;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: "Curso no encontrado." });
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.courseGroup.update({ where: { id: req.params.id }, data: { courseId, name, schedule: "" } });
      if (Array.isArray(sessions) && sessions.length) {
        await tx.courseSession.deleteMany({ where: { groupId: req.params.id } });
        await tx.courseSession.createMany({
          data: sessions.map((s, i) => ({
            groupId: req.params.id,
            title: s.title || `Sesion ${i + 1}`,
            startAt: new Date(s.startAt),
            endAt: new Date(s.endAt),
            description: s.description || null,
            meetLink: s.meetLink || null,
            youtubeUrl: s.youtubeUrl || null,
            embedUrl: s.embedUrl || null,
          })),
        });
      }
      return group;
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.delete("/groups/:id", authenticateAdmin, async (req, res, next) => {
  try { await prisma.courseGroup.delete({ where: { id: req.params.id } }); res.status(204).send(); } catch (error) { next(error); }
});

router.post("/groups/:groupId/assign-teacher", authenticateAdmin, async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ message: "teacherId es requerido." });
    const row = await prisma.teacherGroup.create({ data: { groupId: req.params.groupId, teacherId } });
    res.status(201).json(row);
  } catch (error) {
    if (error?.code === "P2002") return res.status(409).json({ message: "El docente ya esta asignado a este grupo." });
    next(error);
  }
});

router.post("/groups/:groupId/assign-student", authenticateAdmin, async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: "studentId es requerido." });
    const row = await prisma.groupEnrollment.create({ data: { groupId: req.params.groupId, studentId } });
    res.status(201).json(row);
  } catch (error) {
    if (error?.code === "P2002") return res.status(409).json({ message: "El alumno ya esta asignado a este grupo." });
    next(error);
  }
});

router.delete("/groups/:groupId/students/:studentId", authenticateAdmin, async (req, res, next) => {
  try {
    await prisma.groupEnrollment.delete({ where: { studentId_groupId: { studentId: req.params.studentId, groupId: req.params.groupId } } });
    res.status(204).send();
  } catch (error) { next(error); }
});

router.delete("/groups/:groupId/sessions/:sessionId", authenticateAdmin, async (req, res, next) => {
  try {
    await prisma.courseSession.delete({ where: { id: req.params.sessionId } });
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;

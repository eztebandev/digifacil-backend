import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authenticateUser);

router.get("/teacher/dashboard", async (req, res, next) => {
  try {
    if (req.user.role !== "TEACHER") return res.status(403).json({ message: "No tienes permisos para esta accion." });
    const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user.sub }, include: { groups: { include: { group: { include: { course: true, enrollments: { include: { student: { include: { user: true } } } }, sessions: { include: { materials: true }, orderBy: { startAt: "asc" } } } } } } } });
    if (!teacher) return res.status(404).json({ message: "Docente no encontrado." });
    const groups = teacher.groups.map((g) => ({
      ...g.group,
      students: g.group.enrollments.map((e) => ({
        id: e.student.id,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        phone: e.student.phone,
        email: e.student.user?.email || "",
      })),
    }));
    res.json({ teacher: { id: teacher.id, firstName: teacher.firstName, lastName: teacher.lastName }, groups });
  } catch (e) { next(e); }
});

router.get("/student/dashboard", async (req, res, next) => {
  try {
    if (req.user.role !== "STUDENT") return res.status(403).json({ message: "No tienes permisos para esta accion." });
    const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.sub }, include: { enrollments: { include: { certificates: true, group: { include: { course: true, sessions: { include: { materials: true }, orderBy: { startAt: "asc" } }, teachers: { include: { teacher: true } } } } }, orderBy: { createdAt: "desc" } } } });
    if (!student) return res.status(404).json({ message: "Alumno no encontrado." });
    const calendar = student.enrollments.flatMap((en) => en.group.sessions.map((s) => ({ groupId: en.group.id, groupName: en.group.name, courseTitle: en.group.course.title, sessionId: s.id, sessionTitle: s.title, startAt: s.startAt, endAt: s.endAt, meetLink: s.meetLink })));
    res.json({ student: { id: student.id, firstName: student.firstName, lastName: student.lastName }, enrollments: student.enrollments, calendar });
  } catch (e) { next(e); }
});

router.put("/teacher/groups/:groupId/sessions", async (req, res, next) => {
  try {
    if (req.user.role !== "TEACHER") return res.status(403).json({ message: "No tienes permisos para esta accion." });
    const { groupId } = req.params; const { sessions } = req.body;
    if (!Array.isArray(sessions) || sessions.length < 1) return res.status(400).json({ message: "Debes enviar al menos 1 sesion." });
    const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user.sub } });
    const assignment = await prisma.teacherGroup.findUnique({ where: { teacherId_groupId: { teacherId: teacher.id, groupId } } });
    if (!assignment) return res.status(403).json({ message: "No tienes este grupo asignado." });
    const group = await prisma.courseGroup.findUnique({
      where: { id: groupId },
      include: { course: true },
    });
    if (!group) return res.status(404).json({ message: "Grupo no encontrado." });
    if (sessions.length > Number(group.course.sessionCount || 1)) {
      return res.status(400).json({
        message: `Este grupo permite maximo ${group.course.sessionCount} sesiones segun el curso.`,
      });
    }
    await prisma.$transaction(async (tx) => {
      for (const session of sessions) {
        const data = {
          groupId,
          title: session.title,
          description: session.description || null,
          startAt: new Date(session.startAt),
          endAt: new Date(session.endAt),
          meetLink: typeof session.meetLink === "string" ? session.meetLink.trim() : null,
          youtubeUrl: typeof session.youtubeUrl === "string" ? (session.youtubeUrl.trim() || null) : null,
          embedUrl: typeof session.embedUrl === "string" ? (session.embedUrl.trim() || null) : null,
        };
        let sessionId = session.id;
        if (sessionId) await tx.courseSession.update({ where: { id: sessionId }, data });
        else sessionId = (await tx.courseSession.create({ data })).id;
        await tx.sessionMaterial.deleteMany({ where: { sessionId } });
        if (Array.isArray(session.materials) && session.materials.length) await tx.sessionMaterial.createMany({ data: session.materials.filter((m) => m?.title && m?.url && m?.type).map((m) => ({ sessionId, title: m.title, type: m.type, url: m.url })) });
      }
    });
    res.json(await prisma.courseSession.findMany({ where: { groupId }, include: { materials: true }, orderBy: { startAt: "asc" } }));
  } catch (e) { next(e); }
});

router.delete("/teacher/groups/:groupId/sessions/:sessionId", async (req, res, next) => {
  try {
    if (req.user.role !== "TEACHER") return res.status(403).json({ message: "No tienes permisos para esta accion." });
    const { groupId, sessionId } = req.params;
    const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user.sub } });
    const assignment = await prisma.teacherGroup.findUnique({ where: { teacherId_groupId: { teacherId: teacher.id, groupId } } });
    if (!assignment) return res.status(403).json({ message: "No tienes este grupo asignado." });
    const total = await prisma.courseSession.count({ where: { groupId } });
    if (total <= 1) return res.status(400).json({ message: "El grupo debe tener al menos 1 sesion." });
    await prisma.courseSession.delete({ where: { id: sessionId } });
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;

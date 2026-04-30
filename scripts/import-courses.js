import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "../src/lib/prisma.js";

function buildDefaultSession() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start);
  end.setHours(21, 0, 0, 0);
  return {
    title: "Sesion 1",
    description: "Sesion inicial del grupo",
    startAt: start,
    endAt: end,
    meetLink: "https://meet.google.com/abc-defg-hij",
  };
}

async function main() {
  const sourceArg = process.argv[2] || "data/now-courses.json";
  const filePath = resolve(process.cwd(), sourceArg);
  const fileContent = await readFile(filePath, "utf8");
  const parsed = JSON.parse(fileContent);
  const courses = Array.isArray(parsed) ? parsed : [parsed];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        description: course.description,
        level: course.level,
        duration: course.duration,
        modality: course.modality,
        price: course.price,
        highlight: Boolean(course.highlight),
      },
      create: {
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        duration: course.duration,
        modality: course.modality,
        price: course.price,
        highlight: Boolean(course.highlight),
      },
    });

    const groups = Array.isArray(course.groups) && course.groups.length > 0
      ? course.groups
      : [{ id: `${course.id}-grupo-1`, name: "Grupo General", schedule: "Por definir" }];

    for (const group of groups) {
      const createdGroup = await prisma.courseGroup.upsert({
        where: { id: group.id },
        update: { name: group.name, schedule: group.schedule, courseId: course.id },
        create: { id: group.id, name: group.name, schedule: group.schedule, courseId: course.id },
      });

      const sessionsCount = await prisma.courseSession.count({ where: { groupId: createdGroup.id } });
      if (sessionsCount === 0) {
        await prisma.courseSession.create({ data: { ...buildDefaultSession(), groupId: createdGroup.id } });
      }
    }
  }

  console.log(`Cursos y grupos migrados correctamente desde ${sourceArg}`);
}

main()
  .catch((error) => {
    console.error("Error al migrar cursos:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

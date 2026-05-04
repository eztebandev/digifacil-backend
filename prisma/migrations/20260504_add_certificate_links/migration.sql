ALTER TABLE "Certificate"
ADD COLUMN "studentId" TEXT,
ADD COLUMN "groupId" TEXT,
ADD COLUMN "courseId" TEXT;

UPDATE "Certificate" c
SET
  "studentId" = ge."studentId",
  "groupId" = ge."groupId",
  "courseId" = cg."courseId"
FROM "GroupEnrollment" ge
JOIN "CourseGroup" cg ON cg."id" = ge."groupId"
WHERE ge."id" = c."enrollmentId";

ALTER TABLE "Certificate"
ALTER COLUMN "studentId" SET NOT NULL,
ALTER COLUMN "groupId" SET NOT NULL,
ALTER COLUMN "courseId" SET NOT NULL;

ALTER TABLE "Certificate"
ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "Certificate_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CourseGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Certificate_enrollmentId_key" ON "Certificate"("enrollmentId");
CREATE INDEX "Certificate_groupId_idx" ON "Certificate"("groupId");
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");

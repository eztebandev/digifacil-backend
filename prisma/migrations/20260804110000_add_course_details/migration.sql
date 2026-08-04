CREATE TABLE "CourseDetail" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "studentProfile" TEXT,
  "outcomes" TEXT,
  "methodology" TEXT,
  "instructorName" TEXT,
  "instructorBio" TEXT,
  "instructorPhotoUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseDetail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseDetail_courseId_key" ON "CourseDetail"("courseId");

ALTER TABLE "CourseDetail"
ADD CONSTRAINT "CourseDetail_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CourseSyllabusItem" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "session" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseSyllabusItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseSyllabusItem_courseId_idx" ON "CourseSyllabusItem"("courseId");
CREATE UNIQUE INDEX "CourseSyllabusItem_courseId_session_key" ON "CourseSyllabusItem"("courseId", "session");

ALTER TABLE "CourseSyllabusItem"
ADD CONSTRAINT "CourseSyllabusItem_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CourseFaq" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseFaq_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseFaq_courseId_idx" ON "CourseFaq"("courseId");

ALTER TABLE "CourseFaq"
ADD CONSTRAINT "CourseFaq_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CourseTestimonial" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "imageUrl" TEXT,
  "workUrl" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseTestimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseTestimonial_courseId_idx" ON "CourseTestimonial"("courseId");

ALTER TABLE "CourseTestimonial"
ADD CONSTRAINT "CourseTestimonial_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

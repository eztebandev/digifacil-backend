-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('PDF', 'WORD', 'SLIDES');

-- AlterTable
ALTER TABLE "CourseSession" ADD COLUMN     "embedUrl" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;

-- CreateTable
CREATE TABLE "SessionMaterial" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionMaterial_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SessionMaterial" ADD CONSTRAINT "SessionMaterial_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CourseSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

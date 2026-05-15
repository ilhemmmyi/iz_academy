-- CreateTable
CREATE TABLE "LessonComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonComment_lessonId_idx" ON "LessonComment"("lessonId");

-- CreateIndex
CREATE INDEX "LessonComment_authorId_idx" ON "LessonComment"("authorId");

-- CreateIndex
CREATE INDEX "LessonComment_parentId_idx" ON "LessonComment"("parentId");

-- AddForeignKey
ALTER TABLE "LessonComment" ADD CONSTRAINT "LessonComment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonComment" ADD CONSTRAINT "LessonComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonComment" ADD CONSTRAINT "LessonComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LessonComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "LessonLike" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonComment" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonLike_lessonId_userId_key" ON "LessonLike"("lessonId", "userId");

-- CreateIndex
CREATE INDEX "LessonLike_lessonId_idx" ON "LessonLike"("lessonId");

-- CreateIndex
CREATE INDEX "LessonComment_lessonId_idx" ON "LessonComment"("lessonId");

-- CreateIndex
CREATE INDEX "LessonComment_userId_idx" ON "LessonComment"("userId");

-- CreateIndex
CREATE INDEX "LessonComment_parentId_idx" ON "LessonComment"("parentId");

-- AddForeignKey
ALTER TABLE "LessonLike" ADD CONSTRAINT "LessonLike_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonLike" ADD CONSTRAINT "LessonLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonComment" ADD CONSTRAINT "LessonComment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonComment" ADD CONSTRAINT "LessonComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonComment" ADD CONSTRAINT "LessonComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LessonComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

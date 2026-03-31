-- Performance indexes (M-8)
CREATE INDEX IF NOT EXISTS "Course_teacherId_idx" ON "Course"("teacherId");
CREATE INDEX IF NOT EXISTS "Course_isPublished_idx" ON "Course"("isPublished");
CREATE INDEX IF NOT EXISTS "Course_categoryId_idx" ON "Course"("categoryId");
CREATE INDEX IF NOT EXISTS "Question_quizId_idx" ON "Question"("quizId");
CREATE INDEX IF NOT EXISTS "Project_courseId_idx" ON "Project"("courseId");

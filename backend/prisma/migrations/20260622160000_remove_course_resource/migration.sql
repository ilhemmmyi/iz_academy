-- DropTable: CourseResource is removed entirely. Only LessonResource (resources
-- attached to a specific lesson) remains — there is no longer a course-level
-- resource concept.
DROP TABLE IF EXISTS "CourseResource";

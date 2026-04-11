import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createCategorySchema, createCourseSchema } from '../validators/course.validators';

export const courseRouter = Router();

// Static routes must come BEFORE /:id to avoid conflicts
courseRouter.get('/categories', CourseController.getCategories);
courseRouter.post('/categories', authenticate, requireRole('ADMIN'), validate(createCategorySchema), CourseController.createCategory);
courseRouter.put('/categories/:id', authenticate, requireRole('ADMIN'), CourseController.updateCategory);
courseRouter.delete('/categories/:id', authenticate, requireRole('ADMIN'), CourseController.deleteCategory);
courseRouter.get('/admin', authenticate, requireRole('ADMIN', 'TEACHER'), CourseController.getAllAdmin);
courseRouter.get('/mine', authenticate, requireRole('ADMIN', 'TEACHER'), CourseController.getMyCourses);

courseRouter.get('/', CourseController.getAll);
courseRouter.get('/:id', CourseController.getById);
courseRouter.get('/:id/projects', CourseController.getProjects);
courseRouter.get('/:id/project-submissions', authenticate, requireRole('ADMIN', 'TEACHER'), CourseController.getCourseSubmissions);
courseRouter.get('/:id/progress', authenticate, CourseController.getProgress);
courseRouter.get('/:id/reviews', CourseController.getReviews);
courseRouter.post('/:id/reviews', authenticate, CourseController.submitReview);
courseRouter.post('/', authenticate, requireRole('ADMIN', 'TEACHER'), CourseController.create);
courseRouter.put('/:id', authenticate, requireRole('ADMIN', 'TEACHER'), CourseController.update);
courseRouter.patch('/:id/publish', authenticate, requireRole('ADMIN', 'TEACHER'), CourseController.togglePublish);
courseRouter.delete('/:id', authenticate, requireRole('ADMIN'), CourseController.delete);

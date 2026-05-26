/**
 * QuizService — access-expiry enforcement tests.
 *
 * Verifies:
 *   ✅  enrolled student with no expiry can access quiz by lesson
 *   ✅  enrolled student with future expiry can access quiz / submit attempt
 *   ❌  enrolled student with EXPIRED access is blocked (ACCESS_EXPIRED) in getByLesson
 *   ❌  enrolled student with EXPIRED access is blocked (ACCESS_EXPIRED) in submitAttempt
 *   ❌  unenrolled student throws NOT_ENROLLED in both methods
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../config/prisma', () => ({
  prisma: {
    lesson: { findUnique: jest.fn() },
    quiz: { findUnique: jest.fn() },
    lessonProgress: { findUnique: jest.fn(), count: jest.fn() },
    quizAttempt: { create: jest.fn() },
  },
}));

jest.mock('../../models/enrollment.model', () => ({
  EnrollmentModel: { findApproved: jest.fn() },
}));

jest.mock('../../models/lesson.model', () => ({
  LessonModel: { upsertProgress: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../config', () => ({
  config: { quizPassThreshold: 70 },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { prisma } from '../../config/prisma';
import { EnrollmentModel } from '../../models/enrollment.model';
import { QuizService } from '../quiz.service';

const mockFindLesson    = prisma.lesson.findUnique       as jest.Mock;
const mockFindQuiz      = prisma.quiz.findUnique         as jest.Mock;
const mockFindProgress  = prisma.lessonProgress.findUnique as jest.Mock;
const mockCountProgress = prisma.lessonProgress.count    as jest.Mock;
const mockCreateAttempt = prisma.quizAttempt.create      as jest.Mock;
const mockFindApproved  = EnrollmentModel.findApproved   as jest.Mock;

// ── Constants ─────────────────────────────────────────────────────────────────

const LESSON_ID = 'lesson-1';
const QUIZ_ID   = 'quiz-1';
const USER_ID   = 'user-1';
const COURSE_ID = 'course-1';

const fakeLesson = {
  id: LESSON_ID,
  quiz: { id: QUIZ_ID, questions: [] },
  module: { courseId: COURSE_ID },
};

const fakeQuiz = {
  id: QUIZ_ID,
  courseId: COURSE_ID,
  questions: [{ id: 'q1', correctAnswer: 0 }],
  lessons: [{ id: LESSON_ID }],
};

const activeEnrollment  = { status: 'APPROVED', accessExpiresAt: null };
const futureEnrollment  = { status: 'APPROVED', accessExpiresAt: new Date(Date.now() + 86_400_000) };
const expiredEnrollment = { status: 'APPROVED', accessExpiresAt: new Date(Date.now() - 86_400_000) };

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

describe('QuizService.getByLesson() — access expiry', () => {
  it('allows access when enrollment has no expiry', async () => {
    mockFindLesson.mockResolvedValue(fakeLesson);
    mockFindApproved.mockResolvedValue(activeEnrollment);
    mockFindProgress.mockResolvedValue({ completed: true });

    await expect(QuizService.getByLesson(LESSON_ID, USER_ID)).resolves.toBeDefined();
  });

  it('allows access when expiry is in the future', async () => {
    mockFindLesson.mockResolvedValue(fakeLesson);
    mockFindApproved.mockResolvedValue(futureEnrollment);
    mockFindProgress.mockResolvedValue({ completed: true });

    await expect(QuizService.getByLesson(LESSON_ID, USER_ID)).resolves.toBeDefined();
  });

  it('throws ACCESS_EXPIRED when access has expired', async () => {
    mockFindLesson.mockResolvedValue(fakeLesson);
    mockFindApproved.mockResolvedValue(expiredEnrollment);

    await expect(QuizService.getByLesson(LESSON_ID, USER_ID)).rejects.toThrow('ACCESS_EXPIRED');
  });

  it('throws NOT_ENROLLED when no approved enrollment', async () => {
    mockFindLesson.mockResolvedValue(fakeLesson);
    mockFindApproved.mockResolvedValue(null);

    await expect(QuizService.getByLesson(LESSON_ID, USER_ID)).rejects.toThrow('NOT_ENROLLED');
  });
});

describe('QuizService.submitAttempt() — access expiry', () => {
  it('allows submission when enrollment has no expiry', async () => {
    mockFindQuiz.mockResolvedValue(fakeQuiz);
    mockFindApproved.mockResolvedValue(activeEnrollment);
    mockCountProgress.mockResolvedValue(1);
    mockCreateAttempt.mockResolvedValue({ id: 'attempt-1', score: 100, passed: true });

    await expect(QuizService.submitAttempt(QUIZ_ID, USER_ID, { q1: 0 })).resolves.toBeDefined();
    expect(mockCreateAttempt).toHaveBeenCalled();
  });

  it('allows submission when expiry is in the future', async () => {
    mockFindQuiz.mockResolvedValue(fakeQuiz);
    mockFindApproved.mockResolvedValue(futureEnrollment);
    mockCountProgress.mockResolvedValue(1);
    mockCreateAttempt.mockResolvedValue({ id: 'attempt-1', score: 100, passed: true });

    await expect(QuizService.submitAttempt(QUIZ_ID, USER_ID, { q1: 0 })).resolves.toBeDefined();
  });

  it('throws ACCESS_EXPIRED when access has expired — no attempt written', async () => {
    mockFindQuiz.mockResolvedValue(fakeQuiz);
    mockFindApproved.mockResolvedValue(expiredEnrollment);

    await expect(QuizService.submitAttempt(QUIZ_ID, USER_ID, {})).rejects.toThrow('ACCESS_EXPIRED');
    expect(mockCreateAttempt).not.toHaveBeenCalled();
  });

  it('throws NOT_ENROLLED when no approved enrollment — no attempt written', async () => {
    mockFindQuiz.mockResolvedValue(fakeQuiz);
    mockFindApproved.mockResolvedValue(null);

    await expect(QuizService.submitAttempt(QUIZ_ID, USER_ID, {})).rejects.toThrow('NOT_ENROLLED');
    expect(mockCreateAttempt).not.toHaveBeenCalled();
  });
});

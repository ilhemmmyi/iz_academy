import { prisma } from '../config/prisma';
import { SubmissionStatus } from '.prisma/client';

export const ProjectModel = {

  findById: (id: string) =>
    prisma.project.findUnique({ where: { id } }),

  findByCourse: (courseId: string) =>
    prisma.project.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    }),

  findSubmission: (projectId: string, studentId: string) =>
    prisma.projectSubmission.findUnique({
      where: { projectId_studentId: { projectId, studentId } },
    }),

  findSubmissionById: (id: string) =>
    prisma.projectSubmission.findUnique({ where: { id } }),

  upsertSubmission: (data: {
    projectId: string;
    studentId: string;
    courseId: string;
    githubUrl: string;
    comment?: string | null;
  }) =>
    prisma.projectSubmission.upsert({
      where: { projectId_studentId: { projectId: data.projectId, studentId: data.studentId } },
      update: {
        githubUrl: data.githubUrl,
        comment: data.comment ?? null,
        status: 'PENDING',
        feedback: null,
        submittedAt: new Date(),
      },
      create: data,
      include: {
        project: true,
        student: { select: { id: true, name: true, email: true } },
      },
    }),

  updateSubmission: (id: string, status: SubmissionStatus, feedback?: string | null) =>
    prisma.projectSubmission.update({
      where: { id },
      data: { status, feedback: feedback ?? null },
      include: {
        project: { select: { id: true, title: true, courseId: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    }),

  deleteSubmission: (id: string) =>
    prisma.projectSubmission.delete({ where: { id } }),

  findMySubmissions: (studentId: string) =>
    prisma.projectSubmission.findMany({
      where: { studentId },
      include: { project: { select: { id: true, title: true, courseId: true } } },
      orderBy: { submittedAt: 'desc' },
    }),

  findTeacherSubmissions: (courseIds: string[]) =>
    prisma.projectSubmission.findMany({
      where: {
        courseId: { in: courseIds },
        submittedAt: { lte: new Date(Date.now() - 3 * 60 * 1000) },
      },
      include: {
        project: { select: { id: true, title: true } },
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
    }),

  findValidatedSubmission: (studentId: string, courseId: string) =>
    prisma.projectSubmission.findFirst({
      where: { studentId, courseId, status: 'VALIDATED' },
    }),

  /**
   * Mark a submission as admin-approved and record who approved it and when.
   * Only allowed when the teacher has already validated (status === VALIDATED).
   */
  adminApprove: (id: string, adminId: string) =>
    prisma.projectSubmission.update({
      where: { id, status: 'VALIDATED' }, // safety: only works on validated submissions
      data: {
        adminApproved: true,
        adminApprovedAt: new Date(),
        adminApprovedById: adminId,
      },
      include: {
        project: { select: { id: true, title: true, courseId: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    }),

  /**
   * Admin dashboard: all submissions that have been validated by the teacher
   * but not yet approved by an admin.
   */
  findValidatedPendingApproval: () =>
    prisma.projectSubmission.findMany({
      where: { status: 'VALIDATED', adminApproved: false },
      include: {
        project: { select: { id: true, title: true, courseId: true } },
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'asc' }, // oldest first — fairness
    }),

  create: (data: { title: string; description: string; instructions: string; courseId: string }) =>
    prisma.project.create({ data }),

  deleteManyByCourse: (courseId: string) =>
    prisma.project.deleteMany({ where: { courseId } }),
};

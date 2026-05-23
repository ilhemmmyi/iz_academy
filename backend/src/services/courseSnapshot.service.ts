import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

type PrismaTx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export const CourseSnapshotService = {
  /**
   * Serialize the CURRENT live content of a course into a CourseSnapshot row.
   * Call this BEFORE bumping contentVersion so the snapshot captures version N.
   */
  async capture(courseId: string, version: number, tx: PrismaTx): Promise<void> {
    const course = await tx.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          where: { archivedAt: null },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { archivedAt: null },
              orderBy: { order: 'asc' },
              include: {
                quiz: {
                  include: { questions: true },
                },
                lessonResources: true,
              },
            },
          },
        },
        projects: {
          where: { archivedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!course) return;

    await tx.courseSnapshot.create({
      data: {
        courseId,
        version,
        snapshotData: course as unknown as Prisma.InputJsonValue,
      },
    });
  },

  /** Retrieve snapshot for a specific version. Returns null if not found. */
  async getForVersion(courseId: string, version: number) {
    return prisma.courseSnapshot.findUnique({
      where: { courseId_version: { courseId, version } },
    });
  },
};

const LESSON_WEIGHT = 70;
const PROJECT_WEIGHT = 20;
const CERTIFICATE_WEIGHT = 10;

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function getLessonProgressPercentage(params: {
  watchedDuration: number;
  totalDuration: number;
}): number {
  if (params.totalDuration <= 0) return 0;
  return clampPercent((params.watchedDuration / params.totalDuration) * 100);
}

export function getProjectProgressPercentage(projectStatus: string | null | undefined) {
  // Any existing submission, including PENDING, counts as the full project share.
  return projectStatus ? 100 : 0;
}

export function getCertificateProgressPercentage(hasCertificate: boolean): number {
  return hasCertificate ? 100 : 0;
}

export function calculateCourseProgressPercentage(params: {
  lessonProgress: number;
  projectProgress: number;
  certificateProgress: number;
}) {
  const lessonContribution = (clampPercent(params.lessonProgress) / 100) * LESSON_WEIGHT;
  const projectContribution = (clampPercent(params.projectProgress) / 100) * PROJECT_WEIGHT;
  const certificateContribution = (clampPercent(params.certificateProgress) / 100) * CERTIFICATE_WEIGHT;

  return Math.round(lessonContribution + projectContribution + certificateContribution);
}

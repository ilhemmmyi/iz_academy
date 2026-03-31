import { apiClient } from './client';

export interface CommentAuthor {
  id: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatarUrl: string | null;
}

export interface LessonCommentReply {
  id: string;
  content: string;
  authorId: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface LessonComment {
  id: string;
  content: string;
  lessonId: string;
  authorId: string;
  author: CommentAuthor;
  replies: LessonCommentReply[];
  createdAt: string;
  updatedAt: string;
  // teacher course view includes lesson info
  lesson?: { id: string; title: string };
}

export const lessonCommentsApi = {
  getByLesson: (lessonId: string): Promise<LessonComment[]> =>
    apiClient(`/lessons/${lessonId}/comments`),

  create: (lessonId: string, content: string): Promise<LessonComment> =>
    apiClient(`/lessons/${lessonId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  reply: (commentId: string, content: string): Promise<LessonCommentReply> =>
    apiClient(`/lessons/comments/${commentId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  delete: (commentId: string): Promise<{ message: string }> =>
    apiClient(`/lessons/comments/${commentId}`, { method: 'DELETE' }),

  getByCourse: (courseId: string): Promise<LessonComment[]> =>
    apiClient(`/lessons/comments/course/${courseId}`),
};

//src/features/comments/services/commentService.ts

import api from '../../../lib/api';
import { Comment } from '../../../types';

// Types for API requests
interface CreateCommentRequest {
  content: string;
}

interface UpdateCommentRequest {
  content: string;
}

// Comment API service
const commentService = {
  // Get all comments for a task
  getComments: async (projectId: string, taskId: string): Promise<Comment[]> => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/comments`);
    return response.data;
  },

  // Create a new comment
  createComment: async (
    projectId: string,
    taskId: string,
    data: CreateCommentRequest
  ): Promise<Comment> => {
    const response = await api.post(
      `/projects/${projectId}/tasks/${taskId}/comments`,
      data
    );
    return response.data;
  },

  // Update an existing comment
  updateComment: async (
    projectId: string,
    taskId: string,
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<Comment> => {
    const response = await api.patch(
      `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
      data
    );
    return response.data;
  },

  // Delete a comment
  deleteComment: async (
    projectId: string,
    taskId: string,
    commentId: string
  ): Promise<void> => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
  }
};

export default commentService;

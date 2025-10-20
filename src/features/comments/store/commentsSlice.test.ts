// src/features/comments/store/commentsSlice.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import commentsReducer, {
  clearComments,
  optimisticCreateComment,
  optimisticUpdateComment,
  optimisticDeleteComment,
  revertOptimisticCreate,
  revertOptimisticUpdate,
  revertOptimisticDelete,
  fetchComments,
  createCommentAsync,
  updateCommentAsync,
  deleteCommentAsync,
} from './commentsSlice';
import commentService from '../services/commentService';
import { Comment } from '../../../types';

// Mock the comment service
vi.mock('../services/commentService');

describe('commentsSlice', () => {
  let store: ReturnType<typeof configureStore>;

  const createMockComment = (overrides?: Partial<Comment>): Comment => ({
    id: 'comment-1',
    content: 'Test comment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    taskId: 'task-1',
    userId: 'user-1',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    },
    ...overrides,
  });

  beforeEach(() => {
    store = configureStore({
      reducer: {
        comments: commentsReducer,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().comments;

      expect(state).toEqual({
        items: [],
        isLoading: false,
        error: null,
      });
    });
  });

  describe('clearComments reducer', () => {
    it('should clear all comments', () => {
      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [createMockComment(), createMockComment({ id: 'comment-2' })],
            isLoading: false,
            error: null,
          },
        },
      });

      storeWithData.dispatch(clearComments());

      const state = storeWithData.getState().comments;
      expect(state.items).toEqual([]);
    });
  });

  describe('optimisticCreateComment reducer', () => {
    it('should add comment immediately', () => {
      const newComment = createMockComment({ id: 'temp-1', content: 'New comment' });

      store.dispatch(optimisticCreateComment(newComment));

      const state = store.getState().comments;
      expect(state.items).toContainEqual(newComment);
    });
  });

  describe('optimisticUpdateComment reducer', () => {
    it('should update comment immediately', () => {
      const existingComment = createMockComment({ id: 'comment-1', content: 'Old content' });
      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [existingComment],
            isLoading: false,
            error: null,
          },
        },
      });

      storeWithData.dispatch(
        optimisticUpdateComment({
          commentId: 'comment-1',
          content: 'Updated content',
        })
      );

      const state = storeWithData.getState().comments;
      expect(state.items[0].content).toBe('Updated content');
    });

    it('should not update if comment not found', () => {
      const existingComment = createMockComment({ id: 'comment-1' });
      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [existingComment],
            isLoading: false,
            error: null,
          },
        },
      });

      storeWithData.dispatch(
        optimisticUpdateComment({
          commentId: 'non-existent',
          content: 'Updated content',
        })
      );

      const state = storeWithData.getState().comments;
      expect(state.items[0]).toEqual(existingComment);
    });
  });

  describe('optimisticDeleteComment reducer', () => {
    it('should remove comment immediately', () => {
      const comment1 = createMockComment({ id: 'comment-1' });
      const comment2 = createMockComment({ id: 'comment-2' });
      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [comment1, comment2],
            isLoading: false,
            error: null,
          },
        },
      });

      storeWithData.dispatch(optimisticDeleteComment({ commentId: 'comment-1' }));

      const state = storeWithData.getState().comments;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('comment-2');
    });
  });

  describe('revertOptimisticCreate reducer', () => {
    it('should remove optimistically created comment', () => {
      const tempComment = createMockComment({ id: 'temp-1' });
      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [tempComment],
            isLoading: false,
            error: null,
          },
        },
      });

      storeWithData.dispatch(revertOptimisticCreate({ commentId: 'temp-1' }));

      const state = storeWithData.getState().comments;
      expect(state.items).toHaveLength(0);
    });
  });

  describe('revertOptimisticUpdate reducer', () => {
    it('should restore original comment', () => {
      const originalComment = createMockComment({ id: 'comment-1', content: 'Original' });
      const modifiedComment = { ...originalComment, content: 'Modified' };
      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [modifiedComment],
            isLoading: false,
            error: null,
          },
        },
      });

      storeWithData.dispatch(
        revertOptimisticUpdate({
          commentId: 'comment-1',
          originalComment,
        })
      );

      const state = storeWithData.getState().comments;
      expect(state.items[0].content).toBe('Original');
    });
  });

  describe('revertOptimisticDelete reducer', () => {
    it('should restore deleted comment', () => {
      const deletedComment = createMockComment({ id: 'comment-1' });
      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [],
            isLoading: false,
            error: null,
          },
        },
      });

      storeWithData.dispatch(revertOptimisticDelete({ comment: deletedComment }));

      const state = storeWithData.getState().comments;
      expect(state.items).toContainEqual(deletedComment);
    });

    it('should maintain chronological order after restoring', () => {
      const comment1 = createMockComment({
        id: 'comment-1',
        createdAt: '2025-01-01T10:00:00Z',
      });
      const comment3 = createMockComment({
        id: 'comment-3',
        createdAt: '2025-01-01T12:00:00Z',
      });
      const comment2 = createMockComment({
        id: 'comment-2',
        createdAt: '2025-01-01T11:00:00Z',
      });

      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [comment1, comment3],
            isLoading: false,
            error: null,
          },
        },
      });

      storeWithData.dispatch(revertOptimisticDelete({ comment: comment2 }));

      const state = storeWithData.getState().comments;
      expect(state.items[0].id).toBe('comment-1');
      expect(state.items[1].id).toBe('comment-2');
      expect(state.items[2].id).toBe('comment-3');
    });
  });

  describe('fetchComments async thunk', () => {
    it('should set loading state when pending', () => {
      const action = { type: fetchComments.pending.type };
      const state = commentsReducer(undefined, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should set comments when fulfilled', async () => {
      const mockComments = [
        createMockComment({ id: 'comment-1' }),
        createMockComment({ id: 'comment-2' }),
      ];
      vi.mocked(commentService.getComments).mockResolvedValue(mockComments);

      await store.dispatch(fetchComments({ projectId: 'project-1', taskId: 'task-1' }));
      const state = store.getState().comments;

      expect(state.isLoading).toBe(false);
      expect(state.items).toEqual(mockComments);
      expect(state.error).toBe(null);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to fetch comments';
      vi.mocked(commentService.getComments).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(fetchComments({ projectId: 'project-1', taskId: 'task-1' }));
      const state = store.getState().comments;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('createCommentAsync thunk', () => {
    it('should clear error when pending', () => {
      const storeWithError = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [],
            isLoading: false,
            error: 'Previous error',
          },
        },
      });

      const action = { type: createCommentAsync.pending.type };
      const newState = commentsReducer(storeWithError.getState().comments, action);

      expect(newState.error).toBe(null);
    });

    it('should add new comment when fulfilled', async () => {
      const newComment = createMockComment({ id: 'new-comment', content: 'New comment' });
      vi.mocked(commentService.createComment).mockResolvedValue(newComment);

      await store.dispatch(
        createCommentAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          content: 'New comment',
        })
      );

      const state = store.getState().comments;
      expect(state.items).toContainEqual(newComment);
    });

    it('should replace optimistic comment with real one', async () => {
      const optimisticComment = createMockComment({
        id: 'temp-123',
        content: 'Test content',
      });
      const realComment = createMockComment({
        id: 'real-123',
        content: 'Test content',
      });
      vi.mocked(commentService.createComment).mockResolvedValue(realComment);

      const storeWithOptimistic = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [optimisticComment],
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithOptimistic.dispatch(
        createCommentAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          content: 'Test content',
        })
      );

      const state = storeWithOptimistic.getState().comments;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('real-123');
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to create comment';
      vi.mocked(commentService.createComment).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(
        createCommentAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          content: 'New comment',
        })
      );

      const state = store.getState().comments;
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('updateCommentAsync thunk', () => {
    it('should clear error when pending', () => {
      const action = { type: updateCommentAsync.pending.type };
      const stateWithError = {
        items: [],
        isLoading: false,
        error: 'Previous error',
      };
      const newState = commentsReducer(stateWithError, action);

      expect(newState.error).toBe(null);
    });

    it('should update comment when fulfilled', async () => {
      const existingComment = createMockComment({ id: 'comment-1', content: 'Old content' });
      const updatedComment = { ...existingComment, content: 'Updated content' };
      vi.mocked(commentService.updateComment).mockResolvedValue(updatedComment);

      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [existingComment],
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(
        updateCommentAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          commentId: 'comment-1',
          content: 'Updated content',
        })
      );

      const state = storeWithData.getState().comments;
      expect(state.items[0].content).toBe('Updated content');
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to update comment';
      vi.mocked(commentService.updateComment).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(
        updateCommentAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          commentId: 'comment-1',
          content: 'Updated content',
        })
      );

      const state = store.getState().comments;
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('deleteCommentAsync thunk', () => {
    it('should clear error when pending', () => {
      const action = { type: deleteCommentAsync.pending.type };
      const stateWithError = {
        items: [],
        isLoading: false,
        error: 'Previous error',
      };
      const newState = commentsReducer(stateWithError, action);

      expect(newState.error).toBe(null);
    });

    it('should remove comment when fulfilled', async () => {
      const comment1 = createMockComment({ id: 'comment-1' });
      const comment2 = createMockComment({ id: 'comment-2' });
      vi.mocked(commentService.deleteComment).mockResolvedValue(undefined);

      const storeWithData = configureStore({
        reducer: {
          comments: commentsReducer,
        },
        preloadedState: {
          comments: {
            items: [comment1, comment2],
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(
        deleteCommentAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          commentId: 'comment-1',
        })
      );

      const state = storeWithData.getState().comments;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('comment-2');
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to delete comment';
      vi.mocked(commentService.deleteComment).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(
        deleteCommentAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          commentId: 'comment-1',
        })
      );

      const state = store.getState().comments;
      expect(state.error).toBe(errorMessage);
    });
  });
});

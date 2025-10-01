// src/features/comments/store/commentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Comment } from '../../../types';
import commentService from '../services/commentService';

interface CommentsState {
  items: Comment[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  items: [],
  isLoading: false,
  error: null
};

// Async thunks for API operations
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async ({ projectId, taskId }: { projectId: string; taskId: string }, { rejectWithValue }) => {
    try {
      return await commentService.getComments(projectId, taskId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

export const createCommentAsync = createAsyncThunk(
  'comments/createComment',
  async (
    { projectId, taskId, content }: { projectId: string; taskId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      return await commentService.createComment(projectId, taskId, { content });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create comment');
    }
  }
);

export const updateCommentAsync = createAsyncThunk(
  'comments/updateComment',
  async (
    {
      projectId,
      taskId,
      commentId,
      content
    }: {
      projectId: string;
      taskId: string;
      commentId: string;
      content: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await commentService.updateComment(projectId, taskId, commentId, { content });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update comment');
    }
  }
);

export const deleteCommentAsync = createAsyncThunk(
  'comments/deleteComment',
  async (
    { projectId, taskId, commentId }: { projectId: string; taskId: string; commentId: string },
    { rejectWithValue }
  ) => {
    try {
      await commentService.deleteComment(projectId, taskId, commentId);
      return { commentId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

export const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearComments: (state) => {
      state.items = [];
    },

    // Optimistic create for immediate UI update
    optimisticCreateComment: (state, action: PayloadAction<Comment>) => {
      state.items.push(action.payload);
    },

    // Optimistic update for immediate UI update
    optimisticUpdateComment: (
      state,
      action: PayloadAction<{ commentId: string; content: string }>
    ) => {
      const { commentId, content } = action.payload;
      const index = state.items.findIndex((c: Comment) => c.id === commentId);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          content,
          updatedAt: new Date().toISOString()
        };
      }
    },

    // Optimistic delete for immediate UI update
    optimisticDeleteComment: (state, action: PayloadAction<{ commentId: string }>) => {
      state.items = state.items.filter((c: Comment) => c.id !== action.payload.commentId);
    },

    // Revert optimistic updates on failure
    revertOptimisticCreate: (state, action: PayloadAction<{ commentId: string }>) => {
      state.items = state.items.filter((c: Comment) => c.id !== action.payload.commentId);
    },

    revertOptimisticUpdate: (
      state,
      action: PayloadAction<{ commentId: string; originalComment: Comment }>
    ) => {
      const { commentId, originalComment } = action.payload;
      const index = state.items.findIndex((c: Comment) => c.id === commentId);
      if (index !== -1) {
        state.items[index] = originalComment;
      }
    },

    revertOptimisticDelete: (state, action: PayloadAction<{ comment: Comment }>) => {
      state.items.push(action.payload.comment);
      // Re-sort by createdAt to maintain order
      state.items.sort(
        (a: Comment, b: Comment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  },

  extraReducers: (builder) => {
    builder
      // Fetch comments
      .addCase(fetchComments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch comments';
      })

      // Create comment
      .addCase(createCommentAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(createCommentAsync.fulfilled, (state, action) => {
        // Replace optimistic comment with real one or add if not found
        const optimisticIndex = state.items.findIndex(
          (c: Comment) => c.id.startsWith('temp-') && c.content === action.payload.content
        );
        if (optimisticIndex !== -1) {
          state.items[optimisticIndex] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(createCommentAsync.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to create comment';
      })

      // Update comment
      .addCase(updateCommentAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(updateCommentAsync.fulfilled, (state, action) => {
        const index = state.items.findIndex((c: Comment) => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCommentAsync.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to update comment';
      })

      // Delete comment
      .addCase(deleteCommentAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteCommentAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((c: Comment) => c.id !== action.payload.commentId);
      })
      .addCase(deleteCommentAsync.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to delete comment';
      });
  }
});

// Export actions
export const {
  clearComments,
  optimisticCreateComment,
  optimisticUpdateComment,
  optimisticDeleteComment,
  revertOptimisticCreate,
  revertOptimisticUpdate,
  revertOptimisticDelete
} = commentsSlice.actions;

export default commentsSlice.reducer;

// Selectors
const selectCommentsState = (state: any) => state.comments;
export const selectComments = (state: any) => state.comments.items;
export const selectCommentsLoading = (state: any) => state.comments.isLoading;
export const selectCommentsError = (state: any) => state.comments.error;

// Memoized selector for task comments
export const selectTaskComments = createSelector(
  [selectComments, (_state: any, taskId: string) => taskId],
  (comments, taskId) => {
    return comments
      .filter((comment: Comment) => comment.taskId === taskId)
      .sort((a: Comment, b: Comment) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }
);

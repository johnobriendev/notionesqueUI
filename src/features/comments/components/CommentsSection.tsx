// src/features/comments/components/CommentsSection.tsx
import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { ProjectPermissions, Comment } from '../../../types';
import {
  fetchComments,
  createCommentAsync,
  updateCommentAsync,
  deleteCommentAsync,
  selectTaskComments,
  selectCommentsLoading,
  selectCommentsError,
  optimisticCreateComment,
  optimisticUpdateComment,
  optimisticDeleteComment,
  revertOptimisticCreate,
  revertOptimisticUpdate,
  revertOptimisticDelete
} from '../store/commentsSlice';
import { openDeleteCommentModal } from '../../ui/store/uiSlice';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import DeleteCommentModal from './DeleteCommentModal';

interface CommentsSectionProps {
  projectId: string;
  taskId: string;
  permissions: ProjectPermissions;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  projectId,
  taskId,
  permissions
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth0();
  const comments = useAppSelector((state) => selectTaskComments(state, taskId));
  const isLoading = useAppSelector(selectCommentsLoading);
  const error = useAppSelector(selectCommentsError);

  // Fetch comments on mount and when taskId changes
  useEffect(() => {
    dispatch(fetchComments({ projectId, taskId }));
  }, [dispatch, projectId, taskId]);

  // Handle create comment with optimistic update
  const handleCreateComment = async (content: string) => {
    if (!user) return;

    // Create temporary comment for optimistic update
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      taskId,
      userId: user.sub || '',
      user: {
        id: user.sub || '',
        email: user.email || '',
        name: user.name
      }
    };

    // Optimistic update
    dispatch(optimisticCreateComment(tempComment));

    try {
      // API call
      await dispatch(
        createCommentAsync({
          projectId,
          taskId,
          content
        })
      ).unwrap();
    } catch (err) {
      // Revert on failure
      dispatch(revertOptimisticCreate({ commentId: tempComment.id }));
      console.error('Failed to create comment:', err);
    }
  };

  // Handle edit comment with optimistic update
  const handleEditComment = async (commentId: string, content: string) => {
    // Find original comment for potential revert
    const originalComment = comments.find((c: Comment) => c.id === commentId);
    if (!originalComment) return;

    // Optimistic update
    dispatch(optimisticUpdateComment({ commentId, content }));

    try {
      // API call
      await dispatch(
        updateCommentAsync({
          projectId,
          taskId,
          commentId,
          content
        })
      ).unwrap();
    } catch (err) {
      // Revert on failure
      dispatch(revertOptimisticUpdate({ commentId, originalComment }));
      console.error('Failed to update comment:', err);
    }
  };

  // Handle delete comment - open modal
  const handleDeleteComment = (commentId: string) => {
    dispatch(openDeleteCommentModal(commentId));
  };

  // Handle confirmed delete from modal
  const handleConfirmDelete = async (commentId: string) => {
    // Find comment for potential revert
    const comment = comments.find((c: Comment) => c.id === commentId);
    if (!comment) return;

    // Optimistic update
    dispatch(optimisticDeleteComment({ commentId }));

    try {
      // API call
      await dispatch(
        deleteCommentAsync({
          projectId,
          taskId,
          commentId
        })
      ).unwrap();
    } catch (err) {
      // Revert on failure
      dispatch(revertOptimisticDelete({ comment }));
      throw err; // Re-throw to show error in modal
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Comments ({comments.length})
      </h3>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* Add comment form */}
      <div className="mb-4">
        <CommentForm onSubmit={handleCreateComment} permissions={permissions} />
      </div>

      {/* Loading state */}
      {isLoading && comments.length === 0 ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Comments list */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment: Comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  permissions={permissions}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      <DeleteCommentModal onConfirmDelete={handleConfirmDelete} />
    </div>
  );
};

export default CommentsSection;

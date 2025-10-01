// src/features/comments/components/DeleteCommentModal.tsx
import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { closeDeleteCommentModal } from '../../ui/store/uiSlice';

interface DeleteCommentModalProps {
  onConfirmDelete: (commentId: string) => Promise<void>;
}

const DeleteCommentModal: React.FC<DeleteCommentModalProps> = ({ onConfirmDelete }) => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isDeleteCommentModalOpen);
  const deletingCommentId = useAppSelector((state) => state.ui.deletingCommentId);

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close the modal
  const handleClose = () => {
    if (!isDeleting) {
      dispatch(closeDeleteCommentModal());
      setError(null);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      handleClose();
    }
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!deletingCommentId) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirmDelete(deletingCommentId);
      handleClose();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // If modal is closed, don't render anything
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-xs flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Delete Comment</h2>

        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}

        <p className="mb-6 text-gray-700">
          Are you sure you want to delete this comment?
          <br />
          <span className="text-gray-500 text-sm mt-2 block">
            This action cannot be undone.
          </span>
        </p>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-md text-white ${
              isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCommentModal;

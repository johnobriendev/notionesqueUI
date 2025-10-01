// src/features/comments/components/CommentForm.tsx
import React, { useState } from 'react';
import { ProjectPermissions } from '../../../types';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  initialContent?: string;
  submitLabel?: string;
  permissions: ProjectPermissions;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  initialContent = '',
  submitLabel = 'Comment',
  permissions
}) => {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);

  const maxChars = 2000;
  const charCount = content.length;
  const isOverLimit = charCount > maxChars;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (isEmpty) {
      setError('Comment cannot be empty');
      return;
    }

    if (isOverLimit) {
      setError(`Comment is too long (max ${maxChars} characters)`);
      return;
    }

    if (!permissions.canWrite) {
      setError('You need editor or owner access to comment');
      return;
    }

    onSubmit(content.trim());
    setContent(''); // Clear form after submit
  };

  const handleCancel = () => {
    setContent(initialContent);
    setError(null);
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          permissions.canWrite
            ? 'Write a comment...'
            : 'You need editor or owner access to comment'
        }
        disabled={!permissions.canWrite}
        className={`w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 ${
          isOverLimit
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${!permissions.canWrite ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        rows={3}
        aria-label="Comment content"
      />

      {/* Character count */}
      <div className="flex items-center justify-between text-sm">
        <span
          className={`${
            isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'
          }`}
        >
          {charCount}/{maxChars}
        </span>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!permissions.canWrite || isEmpty || isOverLimit}
            className={`px-3 py-1 rounded-md text-white transition-colors ${
              !permissions.canWrite || isEmpty || isOverLimit
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitLabel}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </div>
      )}

      {/* Permission warning */}
      {!permissions.canWrite && (
        <div className="text-sm text-gray-600 italic mt-1">
          You need editor or owner access to comment
        </div>
      )}
    </form>
  );
};

export default CommentForm;

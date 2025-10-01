// src/features/comments/components/CommentItem.tsx
import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Comment, ProjectPermissions } from '../../../types';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: Comment;
  permissions: ProjectPermissions;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  permissions,
  onEdit,
  onDelete
}) => {
  const { user } = useAuth0();
  const [isEditing, setIsEditing] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Check if comment was edited
  const isEdited = comment.updatedAt !== comment.createdAt;

  // Check permissions
  const isOwnComment = user?.email === comment.user.email;
  const canEdit = permissions.canWrite && isOwnComment;
  const canDelete =
    permissions.canWrite && (isOwnComment || permissions.userRole === 'owner');

  const handleEditSubmit = (content: string) => {
    onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="border rounded-md p-4 bg-gray-50">
        <CommentForm
          initialContent={comment.content}
          onSubmit={handleEditSubmit}
          onCancel={handleEditCancel}
          submitLabel="Save"
          permissions={permissions}
        />
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 bg-white hover:bg-gray-50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {comment.user.name || comment.user.email}
            </span>
            {isOwnComment && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                You
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {formatDate(comment.createdAt)}
            {isEdited && <span className="ml-2 italic">(edited)</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-4">
          {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              aria-label="Edit comment"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
              aria-label="Delete comment"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-gray-800 whitespace-pre-wrap break-words">{comment.content}</div>
    </div>
  );
};

export default CommentItem;

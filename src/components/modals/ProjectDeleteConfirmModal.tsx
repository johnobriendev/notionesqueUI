// src/components/modals/ProjectDeleteConfirmModal.tsx
import React, { useState } from 'react';
import { Project } from '../../types';

interface ProjectDeleteConfirmModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: (project: Project) => Promise<void>;
}

const ProjectDeleteConfirmModal: React.FC<ProjectDeleteConfirmModalProps> = ({
  isOpen,
  project,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!project) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(project);
      // Modal will be closed by parent component after successful deletion
    } catch (err) {
      console.error('❌ Project deletion failed:', err);
      setError('Failed to delete project. Please try again.');
      setIsDeleting(false);
    }
  };

  // Reset error when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // If modal is closed, don't render anything
  if (!isOpen || !project) return null;

  return (
    <div 
      className="fixed inset-0  bg-black/10 backdrop-blur-xs flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <svg 
                  className="w-6 h-6 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Project
              </h3>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete the project{' '}
              <span className="font-semibold text-gray-900">"{project.name}"</span>?
            </p>
            <p className="text-sm text-red-600 font-medium">
              This action cannot be undone. All tasks, boards, and project data will be permanently deleted.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`px-4 py-2 text-gray-700 bg-gray-100 rounded-md transition-colors duration-200 ${
              isDeleting 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors duration-200 ${
              isDeleting
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isDeleting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </span>
            ) : (
              'Delete Project'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDeleteConfirmModal;
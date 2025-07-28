// src/components/modals/DeleteConfirmModal.tsx
import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { closeDeleteConfirm } from '../../features/ui/store/uiSlice';
import { selectCurrentProject } from '../../features/projects/store/projectsSlice';
import { executeCommand } from '../../features/commands/store/commandSlice';
import { deleteTaskCommand, bulkDeleteTasksCommand } from '../../features/commands/taskCommands';


const DeleteConfirmModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(state => state.ui.isDeleteConfirmOpen);
  const deletingTaskId = useAppSelector(state => state.ui.deletingTaskId);
  const deletingTaskIds = useAppSelector(state => state.ui.deletingTaskIds);
  const currentProject = useAppSelector(selectCurrentProject);

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if we're deleting multiple tasks
  const isMultiDelete = deletingTaskIds.length > 0;

  // Close the modal
  const handleClose = () => {
    dispatch(closeDeleteConfirm());
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      handleClose();
    }
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!currentProject) {
      setError('No project selected');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      if (isMultiDelete) {
        // 🎯 UPDATED: Use bulkDeleteTasksCommand instead of direct thunk
        console.log('🎯 Creating BULK DELETE command for', deletingTaskIds.length, 'tasks');

        const command = bulkDeleteTasksCommand({
          projectId: currentProject.id,
          taskIds: deletingTaskIds
        });

        await dispatch(executeCommand(command)).unwrap();
        console.log('✅ Bulk delete command executed successfully');

      } else if (deletingTaskId) {
        // 🎯 UPDATED: Use deleteTaskCommand instead of direct thunk
        //console.log('🎯 Creating DELETE command for task:', deletingTaskId);

        const command = deleteTaskCommand({
          projectId: currentProject.id,
          taskId: deletingTaskId
        });

        await dispatch(executeCommand(command)).unwrap();
        //console.log('✅ Delete command executed successfully');
      }

      // Close modal on success
      handleClose();
    } catch (err) {
      console.error('❌ Delete command failed:', err);
      setError('Failed to delete task(s). Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // If modal is closed, don't render anything
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0  bg-black/10 backdrop-blur-xs flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>

        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}

        <p className="mb-6 text-gray-700">
          {isMultiDelete
            ? `Are you sure you want to delete ${deletingTaskIds.length} ${deletingTaskIds.length === 1 ? 'task' : 'tasks'}?`
            : 'Are you sure you want to delete this task?'
          }
          <br />
          {/* <span className="text-red-600 font-medium">This action cannot be undone.</span> */}
        </p>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-md text-white ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
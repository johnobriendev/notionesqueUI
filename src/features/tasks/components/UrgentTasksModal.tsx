// src/features/tasks/components/UrgentTasksModal.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchUrgentTasks,
  selectUrgentTasks,
  selectUrgentTasksLoading,
  selectUrgentTasksError,
  fetchTasks
} from '../store/tasksSlice';
import {
  closeUrgentTasksModal,
  selectIsUrgentTasksModalOpen,
  openTaskDetail,
  setCurrentProjectId
} from '../../ui/store/uiSlice';
import { setCurrentProject } from '../../projects/store/projectsSlice';
import { UrgentTaskWithProject } from '../../../types';

const UrgentTasksModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isOpen = useAppSelector(selectIsUrgentTasksModalOpen);
  const urgentTasks = useAppSelector(selectUrgentTasks);
  const isLoading = useAppSelector(selectUrgentTasksLoading);
  const error = useAppSelector(selectUrgentTasksError);

  // Fetch urgent tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUrgentTasks());
    }
  }, [isOpen, dispatch]);

  // Don't render if not open
  if (!isOpen) return null;

  const handleTaskClick = async (task: UrgentTaskWithProject) => {
    // Close the urgent tasks modal
    dispatch(closeUrgentTasksModal());

    // Set the current project
    dispatch(setCurrentProject({
      id: task.project.id,
      name: task.project.name,
      description: task.project.description,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      userId: '', // Will be populated from backend
      userRole: 'owner', // Placeholder, will be set properly after navigation
      canWrite: true
    }));
    dispatch(setCurrentProjectId(task.projectId));

    // Fetch tasks first, then navigate and open detail view
    await dispatch(fetchTasks(task.projectId));

    // Open the task detail view before navigating
    // This way it will already be open when we land on the project page
    dispatch(openTaskDetail(task.id));

    // Navigate to the project (navigation happens last)
    navigate(`/projects/${task.projectId}`);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      dispatch(closeUrgentTasksModal());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not started':
        return 'bg-gray-100 text-gray-700';
      case 'in progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-xs flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Urgent Tasks
          </h2>
          <button
            onClick={() => dispatch(closeUrgentTasksModal())}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">Error loading urgent tasks</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && urgentTasks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium">No urgent tasks at the moment!</p>
              <p className="text-sm mt-2">Great job staying on top of things.</p>
            </div>
          )}

          {/* Task List */}
          {!isLoading && !error && urgentTasks.length > 0 && (
            <div className="space-y-3">
              {urgentTasks.map((task: UrgentTaskWithProject) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="border rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group"
                >
                  {/* Task Title */}
                  <h3 className="font-medium text-gray-900 mb-2 group-hover:text-blue-600">
                    {task.title}
                  </h3>

                  {/* Project and Status Badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {task.project.name}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  {/* Description Preview */}
                  {task.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Last Updated */}
                  <div className="mt-2 text-xs text-gray-500">
                    Updated {new Date(task.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with count */}
        {!isLoading && !error && urgentTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-600 text-center">
            Showing {urgentTasks.length} urgent {urgentTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UrgentTasksModal;

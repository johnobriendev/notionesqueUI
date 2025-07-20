//src/components/layout/Header.tsx

import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  setViewMode,
  openTaskModal,
  setSearchTerm,
  setFilterStatus,
  setFilterPriority
} from '../../features/ui/store/uiSlice';
import { ViewMode, TaskStatus, TaskPriority } from '../../types';
import HistoryControls from '../../features/ui/components/HistoryControls';
import { useAuth0 } from '@auth0/auth0-react';
import { openTeamModal } from '../../features/ui/store/uiSlice';
import { WriteGuard, InviteGuard } from '../common/PermissionGuard';
import { selectCurrentProject } from '../../features/projects/store/projectsSlice';
import { getProjectPermissions } from '../../lib/permissions';

interface HeaderProps {
  showBackButton?: boolean;
  projectName?: string;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { showBackButton = false, projectName } = props;
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(state => state.ui.viewMode);
  const filterConfig = useAppSelector(state => state.ui.filterConfig);
  const { user, logout, isAuthenticated } = useAuth0();

  const currentProject = useAppSelector(selectCurrentProject);
  const permissions = getProjectPermissions(currentProject);


  // Handle opening team modal
  const handleOpenTeam = () => {
    dispatch(openTeamModal());
  };

  // Handle view mode toggle
  const handleViewModeChange = (mode: ViewMode) => {
    dispatch(setViewMode(mode));
  };

  // Handle opening the create task modal
  const handleCreateTask = () => {
    dispatch(openTaskModal(null)); // null means we're creating a new task
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(e.target.value));
  };

  // Handle status filter changes
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setFilterStatus(e.target.value as TaskStatus | 'all'));
  };

  // Handle priority filter changes
  const handlePriorityFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setFilterPriority(e.target.value as TaskPriority | 'all'));
  };

  // Handle logout
  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center">
            {showBackButton && (
              <button
                onClick={() => {
                  // We'll add navigation logic here later
                  window.history.back();
                }}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Dashboard
              </button>
            )}

            <h1 className="text-3xl font-bold text-gray-900 mr-4">
              {projectName || "Notionesque"}
            </h1>

            {/* Undo/Redo Controls */}
            <WriteGuard>
              <HistoryControls />
            </WriteGuard>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && user && (
              <div className="flex items-center space-x-2">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt="Profile"
                    className="h-8 w-8 rounded-full border border-gray-200"
                  />
                )}
                <span className="text-sm text-gray-700">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Log Out
                </button>
              </div>
            )}


            {/* 🔄 MODIFIED: Create Task button - Only show for users with write permissions */}
            <WriteGuard
              fallback={
                // 🆕 NEW: Show disabled button with tooltip for viewers
                <div className="relative group">
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed transition-colors"
                  >
                    Create Task
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    You don't have permission to create tasks
                  </div>
                </div>
              }
              showFallback={!!currentProject} // Only show fallback if we're in a project
            >
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Task
              </button>
            </WriteGuard>

            {/* 🔄 MODIFIED: Team button - Show for all users but with different permissions */}
            {currentProject && (
              <InviteGuard
                fallback={
                  // 🆕 NEW: Show team button for viewers (read-only access to team info)
                  <button
                    onClick={handleOpenTeam}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Team
                  </button>
                }
                showFallback={true}
              >
                <button
                  onClick={handleOpenTeam}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Team
                </button>
              </InviteGuard>
            )}

            {/* 🆕 NEW: Role indicator for current project */}
            {currentProject && (
              <div className="hidden sm:flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${permissions.userRole === 'owner' ? 'bg-red-100 text-red-800' :
                    permissions.userRole === 'editor' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {permissions.userRole}
                </span>
              </div>
            )}



            <div className="flex space-x-2">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`px-3 py-1 rounded-md ${viewMode === 'list'
                  ? 'bg-gray-200 text-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                List
              </button>
              <button
                onClick={() => handleViewModeChange('kanban')}
                className={`px-3 py-1 rounded-md ${viewMode === 'kanban'
                  ? 'bg-gray-200 text-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Kanban
              </button>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mt-4 flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:space-x-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search tasks..."
              value={filterConfig.searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div className="flex space-x-4">
            <select
              value={filterConfig.status}
              onChange={handleStatusFilterChange}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="not started">Not Started</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filterConfig.priority}
              onChange={handlePriorityFilterChange}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Priorities</option>
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            {currentProject && !permissions.canWrite && (
              <div className="hidden md:flex items-center text-xs text-gray-500 italic">
                Read-only access
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
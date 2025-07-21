//src/components/layout/Header.tsx

import React, { useState } from 'react';
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);


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

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      dispatch(setSearchTerm(''));
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow relative">
      {/* Reduced padding for minimalist design */}
      <div className="max-w-8xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
        {/* Single row layout */}
        <div className="flex items-center justify-between h-12">
          
          {/* Left section - Back button, title, and undo/redo */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900 text-sm whitespace-nowrap"
              >
                ← Back
              </button>
            )}

            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">
              {projectName || "Notionesque"}
            </h1>

            {/* Hide undo/redo on mobile */}
            <WriteGuard>
              <div className="hidden sm:block">
                <HistoryControls />
              </div>
            </WriteGuard>
          </div>

          {/* Center section - Search (expandable on mobile) */}
          <div className="flex items-center mx-4 flex-shrink-0">
            {/* Desktop search - always visible */}
            <div className="hidden md:block">
              <input
                type="text"
                placeholder="Search tasks..."
                value={filterConfig.searchTerm}
                onChange={handleSearchChange}
                className="w-48 lg:w-64 h-8 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Mobile search - expandable */}
            <div className="md:hidden">
              {isSearchExpanded ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={filterConfig.searchTerm}
                    onChange={handleSearchChange}
                    className="w-40 h-8 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={toggleSearch}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={toggleSearch}
                  className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                >
                  🔍
                </button>
              )}
            </div>
          </div>

          {/* Right section - Actions and user */}
          <div className="flex items-center space-x-2">
            
            {/* Desktop actions - visible on larger screens */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* Compact view mode toggle */}
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Board
                </button>
              </div>

              <div className="relative">
                <select
                  value={filterConfig.status}
                  onChange={handleStatusFilterChange}
                  className="h-8 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="not started">Not Started</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={filterConfig.priority}
                  onChange={handlePriorityFilterChange}
                  className="h-8 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Tablet actions - some actions visible */}
            <div className="hidden md:flex lg:hidden items-center space-x-2">
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Board
                </button>
              </div>

              {/* Menu button for filters on tablet */}
              <button
                onClick={toggleMobileMenu}
                className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
              >
                ⋯
              </button>
            </div>

            {/* Mobile hamburger menu */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
              >
                ☰
              </button>
            </div>

            {/* Consistent button heights for main actions */}
            <WriteGuard
              fallback={
                <div className="relative group">
                  <button
                    disabled
                    className="h-8 px-3 bg-gray-300 text-gray-500 text-sm rounded-md cursor-not-allowed"
                  >
                    + Task
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    No permission to create tasks
                  </div>
                </div>
              }
              showFallback={!!currentProject}
            >
              <button
                onClick={handleCreateTask}
                className="h-8 px-3 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                + Task
              </button>
            </WriteGuard>

            {currentProject && (
              <InviteGuard
                fallback={
                  <button
                    onClick={handleOpenTeam}
                    className="h-8 px-3 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Team
                  </button>
                }
                showFallback={true}
              >
                <button
                  onClick={handleOpenTeam}
                  className="h-8 px-3 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                >
                  Team
                </button>
              </InviteGuard>
            )}

            {/* Compact user section */}
            {isAuthenticated && user && (
              <div className="flex items-center space-x-2">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt="Profile"
                    className="h-7 w-7 rounded-full border border-gray-200"
                  />
                )}
                <span className="hidden sm:inline text-sm text-gray-700 max-w-24 truncate">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900 hidden sm:inline"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Compact role indicator */}
            {currentProject && (
              <span className={`hidden xl:inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                permissions.userRole === 'owner' ? 'bg-red-100 text-red-800' :
                permissions.userRole === 'editor' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {permissions.userRole}
              </span>
            )}
          </div>
        </div>

        {/* Mobile/Tablet dropdown menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="px-4 py-3 space-y-3">
              
              {/* Mobile view toggle */}
              <div className="md:hidden">
                <div className="flex bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => {
                      handleViewModeChange('list');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => {
                      handleViewModeChange('kanban');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                      viewMode === 'kanban'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Board View
                  </button>
                </div>
              </div>

              {/* Mobile filters */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterConfig.status}
                    onChange={handleStatusFilterChange}
                    className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="not started">Not Started</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filterConfig.priority}
                    onChange={handlePriorityFilterChange}
                    className="w-full h-8 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Mobile undo/redo */}
              <WriteGuard>
                <div className="sm:hidden pt-2 border-t border-gray-200">
                  <HistoryControls />
                </div>
              </WriteGuard>

              {/* Mobile user actions */}
              {isAuthenticated && user && (
                <div className="sm:hidden pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm text-gray-700">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Mobile read-only indicator */}
              {currentProject && !permissions.canWrite && (
                <div className="text-xs text-gray-500 italic text-center pt-2 border-t border-gray-200">
                  Read-only access • {permissions.userRole}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Click overlay to close mobile menu */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
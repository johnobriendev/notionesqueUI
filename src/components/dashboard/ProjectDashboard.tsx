// src/components/dashboard/ProjectDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { 
  fetchProjects, 
  selectAllProjects, 
  setCurrentProject,
  selectProjectsLoading,
  selectProjectsError,
  createProject,
  updateProject,
  deleteProject,
} from '../../features/projects/projectsSlice';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import DashboardHeader from './DashboardHeader';

// Dashboard component with modern design patterns
const ProjectDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const projects = useAppSelector(selectAllProjects);
  const isLoading = useAppSelector(selectProjectsLoading);
  const error = useAppSelector(selectProjectsError);
  const { isAuthenticated } = useAuth0();

  // State for project form
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  // Fetch projects with delay to ensure auth is ready
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        dispatch(fetchProjects());
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [dispatch, isAuthenticated]);

  // Form handling functions
  const handleOpenCreateForm = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
  };

  const handleOpenEditForm = (project: Project) => {
    setIsEditing(true);
    setIsCreating(false);
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
  };
  
  const handleCloseForm = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
  };
  
  // Project CRUD operations
  const handleCreateProject = () => {
    if (projectName.trim()) {
      dispatch(createProject({ 
        name: projectName.trim(),
        description: projectDescription.trim() || undefined
      }))
        .unwrap()
        .then((newProject) => {
          handleCloseForm();
          // Navigate to the new project
          handleSelectProject(newProject);
        })
        .catch((error) => {
          console.error('Failed to create project:', error);
        });
    }
  };
  
  const handleUpdateProject = () => {
    if (editingProject && projectName.trim()) {
      dispatch(updateProject({
        projectId: editingProject.id,
        updates: {
          name: projectName.trim(),
          description: projectDescription.trim() || undefined
        }
      }))
        .unwrap()
        .then(() => {
          handleCloseForm();
        })
        .catch((error) => {
          console.error('Failed to update project:', error);
        });
    }
  };
  
  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      dispatch(deleteProject(projectId))
        .unwrap()
        .then(() => {
          // Project deleted successfully
        })
        .catch((error) => {
          console.error('Failed to delete project:', error);
        });
    }
  };

  const handleSelectProject = (project: Project) => {
    dispatch(setCurrentProject(project));
    navigate(`/projects/${project.id}`);
  };
  
  // Loading state with improved spinner
  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            {/* Modern loading spinner with pulse effect */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
              <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-l-2 border-r-2 border-blue-300 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state with improved styling
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12 px-6 bg-white rounded-xl shadow-sm border border-red-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Projects</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => dispatch(fetchProjects())}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-sky-50">
      <DashboardHeader />
      
      {/* Main dashboard container with improved spacing */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Dashboard header with redesigned button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          </div>
          
          {!isCreating && !isEditing && (
            <button
              onClick={handleOpenCreateForm}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Project
            </button>
          )}
        </div>
        
        {/* Project Form with modern styling */}
        {(isCreating || isEditing) && (
          <div className="mb-8 p-6 border rounded-xl bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              {isCreating ? 'Create New Project' : 'Edit Project'}
            </h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name*
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  placeholder="Enter project name"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={handleCloseForm}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={isCreating ? handleCreateProject : handleUpdateProject}
                  disabled={!projectName.trim()}
                  className={`px-5 py-2.5 rounded-lg text-white shadow-sm ${
                    projectName.trim() 
                      ? 'bg-blue-600 hover:bg-blue-700 hover:shadow' 
                      : 'bg-blue-300 cursor-not-allowed'
                  }`}
                >
                  {isCreating ? 'Create Project' : 'Update Project'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty state with improved styling */}
        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-6">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">No projects yet</h2>
            <p className="text-gray-500 mb-8">Create your first project to get started</p>
            {!isCreating && (
              <button
                onClick={handleOpenCreateForm}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
              >
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          // Project grid with modern card design - Fixed the height inconsistency issue
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id}
                className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col"
              >
                {/* Card content with consistent height and better spacing */}
                <div className="p-6 flex-grow">
                  <h2 className="text-xl font-semibold mb-2 text-gray-800 line-clamp-1">{project.name}</h2>
                  {/* Content area with fixed height and overflow handling */}
                  <div className="h-20">
                    {project.description ? (
                      <p className="text-gray-600 line-clamp-3">{project.description}</p>
                    ) : (
                      <p className="text-gray-400 italic">No description provided</p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Card footer - Now consistent height regardless of card content */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                  <div className="space-x-3">
                    <button
                      onClick={() => handleOpenEditForm(project)}
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleSelectProject(project)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;



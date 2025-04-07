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


const ProjectDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const projects = useAppSelector(selectAllProjects);
  const isLoading = useAppSelector(selectProjectsLoading);
  const error = useAppSelector(selectProjectsError);
  const { isAuthenticated } = useAuth0();

  
  // State for new project form
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

   // Fetch projects when the component mounts and the user is authenticated
  //  useEffect(() => {
  //   if (isAuthenticated) {
  //     dispatch(fetchProjects());
  //   }
  // }, [dispatch, isAuthenticated]);

  //add small delay to useEffect to fix project loading error
  useEffect(() => {
    if (isAuthenticated) {
      // Add a small delay to ensure auth is fully set up
      const timer = setTimeout(() => {
        dispatch(fetchProjects());
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [dispatch, isAuthenticated]);

   

  // Handle opening the create project form
  const handleOpenCreateForm = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
  };

  // Handle opening the edit project form
  const handleOpenEditForm = (project: Project) => {
    setIsEditing(true);
    setIsCreating(false);
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
  };
  
  // Handle closing the project form
  const handleCloseForm = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
  };
  
  // Handle creating a new project
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
  
  // Handle updating a project
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
  
  // Handle deleting a project
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


  // Handle selecting a project
  const handleSelectProject = (project: Project) => {
    dispatch(setCurrentProject(project));
    navigate(`/projects/${project.id}`);
  };
  
  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-8 text-red-600">
            <p>Error loading projects: {error}</p>
            <button 
              onClick={() => dispatch(fetchProjects())}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          {!isCreating && !isEditing && (
            <button
              onClick={handleOpenCreateForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
          )}
        </div>
        
        {/* Project Form - Create or Edit */}
        {(isCreating || isEditing) && (
          <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              {isCreating ? 'Create New Project' : 'Edit Project'}
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name*
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-4 pt-2">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={isCreating ? handleCreateProject : handleUpdateProject}
                  disabled={!projectName.trim()}
                  className={`px-4 py-2 rounded-md text-white ${
                    projectName.trim() 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-blue-400 cursor-not-allowed'
                  }`}
                >
                  {isCreating ? 'Create Project' : 'Update Project'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <h2 className="text-xl font-medium text-gray-700 mb-2">No projects yet</h2>
            <p className="text-gray-500 mb-6">Create your first project to get started</p>
            {!isCreating && (
              <button
                onClick={handleOpenCreateForm}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id}
                className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">{project.name}</h2>
                  {project.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
                  <div className="space-x-2">
                    <button
                      onClick={() => handleOpenEditForm(project)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                  <button
                    onClick={() => handleSelectProject(project)}
                    className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
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
// src/components/dashboard/ProjectDashboard.tsx
import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { 
  fetchProjects, 
  selectAllProjects, 
  setCurrentProject,
  selectProjectsLoading,
  selectProjectsError,
  createProject
} from '../../features/projects/projectsSlice';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';

const ProjectDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const projects = useAppSelector(selectAllProjects);
  const isLoading = useAppSelector(selectProjectsLoading);
  const error = useAppSelector(selectProjectsError);
  const { isAuthenticated, user } = useAuth0();
  
  // Fetch projects when the component mounts and the user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProjects());
    }
  }, [dispatch, isAuthenticated]);
  
  // Handle selecting a project
  const handleSelectProject = (project: Project) => {
    dispatch(setCurrentProject(project));
    navigate(`/projects/${project.id}`);
  };
  
  // State for new project form
  const [isCreating, setIsCreating] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  
  // Handle creating a new project
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      dispatch(createProject({ name: newProjectName.trim() }))
        .unwrap()
        .then((newProject) => {
          setNewProjectName('');
          setIsCreating(false);
          // Navigate to the new project
          navigate(`/projects/${newProject.id}`);
        })
        .catch((error) => {
          console.error('Failed to create project:', error);
        });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading projects: {error}</p>
        <button 
          onClick={() => dispatch(fetchProjects())}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
        )}
      </div>
      
      {/* New project form */}
      {isCreating && (
        <div className="mb-8 p-4 border rounded-md bg-gray-50">
          <h2 className="text-lg font-medium mb-4">Create New Project</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="flex-grow px-4 py-2 border rounded-md"
              autoFocus
            />
            <button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-medium text-gray-700 mb-2">No projects yet</h2>
          <p className="text-gray-500 mb-6">Create your first project to get started</p>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
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
              onClick={() => handleSelectProject(project)}
              className="border rounded-lg p-6 hover:shadow-md cursor-pointer transition-shadow bg-white"
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-800">{project.name}</h2>
              {project.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                <span>Tasks: {/* You can add task count here later */}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;
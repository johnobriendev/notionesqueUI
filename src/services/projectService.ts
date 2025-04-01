import api from './api';
import { Project } from '../types';

// Types for API requests
interface CreateProjectRequest {
  name: string;
  description?: string;
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

// Project API service
const projectService = {
  // Get all projects for the current user
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },
  
  // Get a single project by ID
  getProject: async (projectId: string): Promise<Project> => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },
  
  // Create a new project
  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },
  
  // Update an existing project
  updateProject: async (projectId: string, updates: UpdateProjectRequest): Promise<Project> => {
    const response = await api.put(`/projects/${projectId}`, updates);
    return response.data;
  },
  
  // Delete a project
  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  }
};

export default projectService;
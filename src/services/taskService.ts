import api from './api';
import { Task, TaskStatus, TaskPriority } from '../types';

// Types for API requests
interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  position?: number;
  customFields?: Record<string, string | number | boolean>;
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  customFields?: Record<string, string | number | boolean>; 
}

// Task API service
const taskService = {
  // Get all tasks for a project
  getTasks: async (projectId: string): Promise<Task[]> => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },
  
  // Get a single task by ID
  getTask: async (projectId: string, taskId: string): Promise<Task> => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },
  
  // Create a new task
  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    // Transform data to match backend expectations
    const payload = {
      ...data,
      // Convert empty string to undefined
      description: data.description === "" ? undefined : data.description,
      // Ensure customFields is included
      customFields: data.customFields || {}
    };
    
    const response = await api.post(`/projects/${data.projectId}/tasks`, payload);
    return response.data;
  },
  
  // Update an existing task
  updateTask: async (projectId: string, taskId: string, updates: UpdateTaskRequest): Promise<Task> => {
    // Transform updates to match backend expectations
    const payload = {
      ...updates,
      // Convert empty string to undefined
      description: updates.description === "" ? undefined : updates.description,
      // Ensure customFields is included if present
      ...(updates.customFields !== undefined && { customFields: updates.customFields })
    };
    
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}`, payload);
    return response.data;
  },
  
  // Delete a task
  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  },
  
  // Delete multiple tasks
  deleteTasks: async (projectId: string, taskIds: string[]): Promise<void> => {
    await api.delete(`/projects/${projectId}/tasks`, { data: { taskIds } });
  },
  
  // Update task priority (with optional destination position)
  updateTaskPriority: async (
    projectId: string, 
    taskId: string, 
    priority: TaskPriority, 
    destinationIndex?: number
  ): Promise<Task> => {
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/priority`, {
      priority,
      destinationIndex
    });
    return response.data;
  },
  
  // Reorder tasks within a priority column
  reorderTasks: async (
    projectId: string, 
    priority: TaskPriority, 
    taskIds: string[]
  ): Promise<void> => {
    const tasks = taskIds.map((id, index) => ({
      id,
      position: index
    }));
    
    await api.put(`/projects/${projectId}/tasks/reorder`, {
      tasks // Send the transformed data structure
    });
  },
  
  // Bulk update multiple tasks
  bulkUpdateTasks: async (
    projectId: string, 
    data:{
      taskIds: string[], 
      updates: Partial<Pick<Task, 'status' | 'priority'>>
    }
    
  ): Promise<void> => {
    await api.put(`/projects/${projectId}/tasks/bulk`, data);
  }
};

export default taskService;
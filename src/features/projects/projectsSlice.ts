import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project, ProjectsState } from '../../types';
import projectService from '../../services/projectService';

// Initial state for the projects slice
const initialState: ProjectsState = {
  items: [],
  currentProject: null,
  isLoading: false,
  error: null
};

// Async thunks for API calls
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      return await projectService.getProjects();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

export const fetchProject = createAsyncThunk(
  'projects/fetchProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getProject(projectId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (data: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      return await projectService.createProject(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async (
    data: { projectId: string; updates: { name?: string; description?: string } },
    { rejectWithValue }
  ) => {
    try {
      return await projectService.updateProject(data.projectId, data.updates);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId);
      return projectId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete project');
    }
  }
);

// Create the projects slice
const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    // Set the current active project
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
      // Also update the UI state if needed (will be handled by a middleware)
    },
    // Clear projects (useful for logout)
    clearProjects: (state) => {
      state.items = [];
      state.currentProject = null;
      state.isLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        
        // If there's no current project but we have projects, set the first one as current
        if (!state.currentProject && action.payload.length > 0) {
          state.currentProject = action.payload[0];
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'An error occurred';
      })
      
      // Fetch single project
      .addCase(fetchProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update in items array if exists
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          state.items.push(action.payload);
        }
        
        // Set as current project
        state.currentProject = action.payload;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'An error occurred';
      })
      
      // Create project
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.push(action.payload);
        state.currentProject = action.payload;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'An error occurred';
      })
      
      // Update project
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update in items array
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        
        // Update current project if it's the one being edited
        if (state.currentProject && state.currentProject.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'An error occurred';
      })
      
      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Remove from items array
        state.items = state.items.filter(p => p.id !== action.payload);
        
        // If it was the current project, set a new current project
        if (state.currentProject && state.currentProject.id === action.payload) {
          state.currentProject = state.items.length > 0 ? state.items[0] : null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'An error occurred';
      });
  }
});

// Export actions and reducer
export const { setCurrentProject, clearProjects } = projectsSlice.actions;
export default projectsSlice.reducer;

// Selectors
export const selectAllProjects = (state: { projects: ProjectsState }) => state.projects.items;
export const selectCurrentProject = (state: { projects: ProjectsState }) => state.projects.currentProject;
export const selectProjectsLoading = (state: { projects: ProjectsState }) => state.projects.isLoading;
export const selectProjectsError = (state: { projects: ProjectsState }) => state.projects.error;
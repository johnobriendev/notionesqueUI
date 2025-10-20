// src/features/projects/store/projectsSlice.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer, {
  setCurrentProject,
  clearProjects,
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
} from './projectsSlice';
import { createMockProject } from '../../../test/utils/testUtils';
import projectService from '../services/projectService';

// Mock the project service
vi.mock('../services/projectService');

describe('projectsSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        projects: projectsReducer,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().projects;

      expect(state).toEqual({
        items: [],
        currentProject: null,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('setCurrentProject reducer', () => {
    it('should set the current project', () => {
      const project = createMockProject({ id: 'project-1', name: 'Test Project' });

      store.dispatch(setCurrentProject(project));

      const state = store.getState().projects;
      expect(state.currentProject).toEqual(project);
    });

    it('should allow setting current project to null', () => {
      const project = createMockProject();
      store.dispatch(setCurrentProject(project));

      store.dispatch(setCurrentProject(null));

      const state = store.getState().projects;
      expect(state.currentProject).toBeNull();
    });
  });

  describe('clearProjects reducer', () => {
    it('should clear all projects and reset state', () => {
      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [createMockProject(), createMockProject({ id: 'project-2' })],
            currentProject: createMockProject(),
            isLoading: true,
            error: 'Some error',
          },
        },
      });

      storeWithData.dispatch(clearProjects());

      const state = storeWithData.getState().projects;
      expect(state).toEqual({
        items: [],
        currentProject: null,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('fetchProjects async thunk', () => {
    it('should set loading state when pending', () => {
      const action = { type: fetchProjects.pending.type };
      const state = projectsReducer(undefined, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should set projects when fulfilled', async () => {
      const mockProjects = [
        createMockProject({ id: 'project-1', name: 'Project 1' }),
        createMockProject({ id: 'project-2', name: 'Project 2' }),
      ];
      vi.mocked(projectService.getProjects).mockResolvedValue(mockProjects);

      await store.dispatch(fetchProjects());
      const state = store.getState().projects;

      expect(state.isLoading).toBe(false);
      expect(state.items).toEqual(mockProjects);
      expect(state.error).toBe(null);
    });

    it('should set first project as current when no current project exists', async () => {
      const mockProjects = [
        createMockProject({ id: 'project-1', name: 'Project 1' }),
        createMockProject({ id: 'project-2', name: 'Project 2' }),
      ];
      vi.mocked(projectService.getProjects).mockResolvedValue(mockProjects);

      await store.dispatch(fetchProjects());
      const state = store.getState().projects;

      expect(state.currentProject).toEqual(mockProjects[0]);
    });

    it('should not override existing current project', async () => {
      const existingProject = createMockProject({ id: 'existing', name: 'Existing' });
      const mockProjects = [
        createMockProject({ id: 'project-1', name: 'Project 1' }),
        createMockProject({ id: 'project-2', name: 'Project 2' }),
      ];
      vi.mocked(projectService.getProjects).mockResolvedValue(mockProjects);

      const storeWithCurrent = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [],
            currentProject: existingProject,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithCurrent.dispatch(fetchProjects());
      const state = storeWithCurrent.getState().projects;

      expect(state.currentProject).toEqual(existingProject);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to fetch projects';
      vi.mocked(projectService.getProjects).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(fetchProjects());
      const state = store.getState().projects;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('fetchProject async thunk', () => {
    it('should set loading state when pending', () => {
      const action = { type: fetchProject.pending.type };
      const state = projectsReducer(undefined, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should add project to items and set as current when fulfilled', async () => {
      const mockProject = createMockProject({ id: 'project-1', name: 'New Project' });
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);

      await store.dispatch(fetchProject('project-1'));
      const state = store.getState().projects;

      expect(state.isLoading).toBe(false);
      expect(state.items).toContainEqual(mockProject);
      expect(state.currentProject).toEqual(mockProject);
    });

    it('should update existing project in items array', async () => {
      const existingProject = createMockProject({ id: 'project-1', name: 'Old Name' });
      const updatedProject = { ...existingProject, name: 'New Name' };
      vi.mocked(projectService.getProject).mockResolvedValue(updatedProject);

      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [existingProject],
            currentProject: null,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(fetchProject('project-1'));
      const state = storeWithData.getState().projects;

      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('New Name');
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to fetch project';
      vi.mocked(projectService.getProject).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(fetchProject('project-1'));
      const state = store.getState().projects;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('createProject async thunk', () => {
    it('should set loading state when pending', () => {
      const action = { type: createProject.pending.type };
      const state = projectsReducer(undefined, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should add new project and set as current when fulfilled', async () => {
      const newProject = createMockProject({ id: 'new-project', name: 'New Project' });
      vi.mocked(projectService.createProject).mockResolvedValue(newProject);

      await store.dispatch(
        createProject({
          name: 'New Project',
          description: 'Test Description',
        })
      );

      const state = store.getState().projects;
      expect(state.isLoading).toBe(false);
      expect(state.items).toContainEqual(newProject);
      expect(state.currentProject).toEqual(newProject);
    });

    it('should add project to existing items', async () => {
      const existingProject = createMockProject({ id: 'existing' });
      const newProject = createMockProject({ id: 'new-project', name: 'New Project' });
      vi.mocked(projectService.createProject).mockResolvedValue(newProject);

      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [existingProject],
            currentProject: existingProject,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(
        createProject({
          name: 'New Project',
        })
      );

      const state = storeWithData.getState().projects;
      expect(state.items).toHaveLength(2);
      expect(state.items).toContainEqual(newProject);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to create project';
      vi.mocked(projectService.createProject).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(
        createProject({
          name: 'New Project',
        })
      );

      const state = store.getState().projects;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('updateProject async thunk', () => {
    it('should set loading state when pending', () => {
      const action = { type: updateProject.pending.type };
      const state = projectsReducer(undefined, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update project in items array when fulfilled', async () => {
      const existingProject = createMockProject({ id: 'project-1', name: 'Old Name' });
      const updatedProject = { ...existingProject, name: 'New Name' };
      vi.mocked(projectService.updateProject).mockResolvedValue(updatedProject);

      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [existingProject],
            currentProject: null,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(
        updateProject({
          projectId: 'project-1',
          updates: { name: 'New Name' },
        })
      );

      const state = storeWithData.getState().projects;
      expect(state.isLoading).toBe(false);
      expect(state.items[0].name).toBe('New Name');
    });

    it('should update current project if it matches', async () => {
      const existingProject = createMockProject({ id: 'project-1', name: 'Old Name' });
      const updatedProject = { ...existingProject, name: 'New Name' };
      vi.mocked(projectService.updateProject).mockResolvedValue(updatedProject);

      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [existingProject],
            currentProject: existingProject,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(
        updateProject({
          projectId: 'project-1',
          updates: { name: 'New Name' },
        })
      );

      const state = storeWithData.getState().projects;
      expect(state.currentProject?.name).toBe('New Name');
    });

    it('should not update current project if different project', async () => {
      const currentProject = createMockProject({ id: 'current', name: 'Current' });
      const otherProject = createMockProject({ id: 'other', name: 'Old Name' });
      const updatedProject = { ...otherProject, name: 'New Name' };
      vi.mocked(projectService.updateProject).mockResolvedValue(updatedProject);

      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [currentProject, otherProject],
            currentProject: currentProject,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(
        updateProject({
          projectId: 'other',
          updates: { name: 'New Name' },
        })
      );

      const state = storeWithData.getState().projects;
      expect(state.currentProject).toEqual(currentProject);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to update project';
      vi.mocked(projectService.updateProject).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(
        updateProject({
          projectId: 'project-1',
          updates: { name: 'New Name' },
        })
      );

      const state = store.getState().projects;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('deleteProject async thunk', () => {
    it('should set loading state when pending', () => {
      const action = { type: deleteProject.pending.type };
      const state = projectsReducer(undefined, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should remove project from items when fulfilled', async () => {
      const project1 = createMockProject({ id: 'project-1' });
      const project2 = createMockProject({ id: 'project-2' });
      vi.mocked(projectService.deleteProject).mockResolvedValue(undefined);

      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [project1, project2],
            currentProject: null,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(deleteProject('project-1'));

      const state = storeWithData.getState().projects;
      expect(state.isLoading).toBe(false);
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('project-2');
    });

    it('should set new current project when deleting current project', async () => {
      const project1 = createMockProject({ id: 'project-1' });
      const project2 = createMockProject({ id: 'project-2' });
      vi.mocked(projectService.deleteProject).mockResolvedValue(undefined);

      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [project1, project2],
            currentProject: project1,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(deleteProject('project-1'));

      const state = storeWithData.getState().projects;
      expect(state.currentProject).toEqual(project2);
    });

    it('should set current project to null when deleting last project', async () => {
      const project = createMockProject({ id: 'project-1' });
      vi.mocked(projectService.deleteProject).mockResolvedValue(undefined);

      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [project],
            currentProject: project,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(deleteProject('project-1'));

      const state = storeWithData.getState().projects;
      expect(state.currentProject).toBeNull();
      expect(state.items).toHaveLength(0);
    });

    it('should not change current project when deleting different project', async () => {
      const currentProject = createMockProject({ id: 'current' });
      const otherProject = createMockProject({ id: 'other' });
      vi.mocked(projectService.deleteProject).mockResolvedValue(undefined);

      const storeWithData = configureStore({
        reducer: {
          projects: projectsReducer,
        },
        preloadedState: {
          projects: {
            items: [currentProject, otherProject],
            currentProject: currentProject,
            isLoading: false,
            error: null,
          },
        },
      });

      await storeWithData.dispatch(deleteProject('other'));

      const state = storeWithData.getState().projects;
      expect(state.currentProject).toEqual(currentProject);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to delete project';
      vi.mocked(projectService.deleteProject).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(deleteProject('project-1'));

      const state = store.getState().projects;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });
});

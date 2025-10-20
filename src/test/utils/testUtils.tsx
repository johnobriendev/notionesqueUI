// src/test/utils/testUtils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import tasksReducer from '../../features/tasks/store/tasksSlice';
import projectsReducer from '../../features/projects/store/projectsSlice';
import collaborationReducer from '../../features/collaboration/store/collaborationSlice';
import commentsReducer from '../../features/comments/store/commentsSlice';
import uiReducer from '../../features/ui/store/uiSlice';
import { Task, Project, TaskStatus, TaskPriority, UserRole } from '../../types';

// Define RootState type based on your actual store
export interface RootState {
  tasks: {
    items: Task[];
    isLoading: boolean;
    error: string | null;
  };
  projects: {
    items: Project[];
    currentProject: Project | null;
    isLoading: boolean;
    error: string | null;
  };
  collaboration: any;
  comments: any;
  ui: any;
}

// Create a custom render function that includes Redux Provider
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>;
  store?: ReturnType<typeof configureStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        tasks: tasksReducer,
        projects: projectsReducer,
        collaboration: collaborationReducer,
        comments: commentsReducer,
        ui: uiReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock factory functions for creating test data
export const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 'test-task-id',
  projectId: 'test-project-id',
  title: 'Test Task',
  description: 'Test Description',
  status: 'not started' as TaskStatus,
  priority: 'medium' as TaskPriority,
  position: 0,
  statusPosition: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customFields: {},
  version: 1,
  updatedBy: 'test@example.com',
  ...overrides,
});

export const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: 'test-project-id',
  name: 'Test Project',
  description: 'Test Description',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'test-user-id',
  userRole: 'owner' as UserRole,
  canWrite: true,
  ...overrides,
});

// Helper to create multiple mock tasks
export const createMockTasks = (count: number, baseOverrides?: Partial<Task>): Task[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockTask({
      id: `task-${index + 1}`,
      title: `Task ${index + 1}`,
      ...baseOverrides,
    })
  );
};

// Helper to create a mock store with initial state
export const createMockStore = (initialState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      tasks: tasksReducer,
      projects: projectsReducer,
      collaboration: collaborationReducer,
      comments: commentsReducer,
      ui: uiReducer,
    },
    preloadedState: initialState as PreloadedState<RootState>,
  });
};

// Wait for async actions to complete
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

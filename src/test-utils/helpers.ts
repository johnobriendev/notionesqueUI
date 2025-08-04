//src/test-utils/helpers.ts

import { configureStore, combineReducers } from '@reduxjs/toolkit'
import tasksReducer from '../features/tasks/store/tasksSlice'
import uiReducer from '../features/ui/store/uiSlice'
import projectsReducer from '../features/projects/store/projectsSlice'
import commandsReducer from '../features/commands/store/commandSlice'
import collaborationReducer from '../features/collaboration/store/collaborationSlice'
import { Task, Project } from '../types'

export const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      tasks: tasksReducer,
      ui: uiReducer,
      projects: projectsReducer,
      commands: commandsReducer,
      collaboration: collaborationReducer,
    },
    preloadedState: initialState,
  })
}

export const mockTask: Task = {
  id: 'task-1',
  projectId: 'project-1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'not started',
  priority: 'medium',
  position: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  version: 1,
  customFields: {},
  updatedBy: 'test@example.com',
}

export const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  description: 'Test Description',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  userId: 'user-1',
  userRole: 'owner',
  canWrite: true,
}
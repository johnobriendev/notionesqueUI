import { createSelector } from '@reduxjs/toolkit';
import { Project } from '../../../types';

// Base selectors
const selectProjectsState = (state: any) => state.projects;

// Simple selectors
export const selectAllProjects = createSelector(
  [selectProjectsState],
  (projectsState) => projectsState.items
);

export const selectCurrentProject = createSelector(
  [selectProjectsState],
  (projectsState) => projectsState.currentProject
);

export const selectProjectsLoading = createSelector(
  [selectProjectsState],
  (projectsState) => projectsState.isLoading
);

export const selectProjectsError = createSelector(
  [selectProjectsState],
  (projectsState) => projectsState.error
);

// Get project by ID
export const selectProjectById = createSelector(
  [selectAllProjects, (state: any, projectId: string) => projectId],
  (projects, projectId) => {
    return projects.find((project: Project) => project.id === projectId);
  }
);

// Get projects count
export const selectProjectsCount = createSelector(
  [selectAllProjects],
  (projects) => projects.length
);
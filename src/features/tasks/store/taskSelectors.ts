import { createSelector } from '@reduxjs/toolkit';
import { Task, TaskPriority } from '../../../types';

// Base selectors for composition
const selectTasksState = (state: any) => state.tasks.present;
const selectTasks = (state: any) => state.tasks.present.items;
const selectCurrentProjectId = (state: any) => state.projects.currentProject?.id;
const selectFilterConfig = (state: any) => state.ui.filterConfig;
const selectSortConfig = (state: any) => state.ui.sortConfig;

// Memoized selector for project tasks
export const selectProjectTasks = createSelector(
  [selectTasks, selectCurrentProjectId],
  (tasks, projectId) => {
    if (!projectId) return [];
    return tasks.filter((task: Task) => task.projectId === projectId);
  }
);

// Memoized selector for filtered tasks
export const selectFilteredTasks = createSelector(
  [selectProjectTasks, selectFilterConfig],
  (tasks, filterConfig) => {
    return tasks.filter((task: Task) => {
      if (filterConfig.status !== 'all' && task.status !== filterConfig.status) {
        return false;
      }
      
      if (filterConfig.priority !== 'all' && task.priority !== filterConfig.priority) {
        return false;
      }
      
      if (filterConfig.searchTerm && 
          !task.title.toLowerCase().includes(filterConfig.searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }
);

// Memoized selector for sorted and filtered tasks (for ListView)
export const selectSortedFilteredTasks = createSelector(
  [selectFilteredTasks, selectSortConfig],
  (tasks, sortConfig) => {
    const { field, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;
    
    return [...tasks].sort((a, b) => {
      if (field === 'createdAt' || field === 'updatedAt') {
        return multiplier * (new Date(a[field]).getTime() - new Date(b[field]).getTime());
      }
      
      if (typeof a[field] === 'string' && typeof b[field] === 'string') {
        return multiplier * a[field].localeCompare(b[field] as string);
      }
      
      return 0;
    });
  }
);

// Memoized selector for tasks grouped by priority (for KanbanView)
export const selectTasksByPriority = createSelector(
  [selectFilteredTasks],
  (tasks: Task[]) => {
    const priorities: TaskPriority[] = ['none', 'low', 'medium', 'high', 'urgent'];
    
    return priorities.reduce((acc, priority) => {
      const priorityTasks = tasks
        .filter((task: Task) => task.priority === priority)
        .sort((a: Task, b: Task) => (a.position || 0) - (b.position || 0));
      
      acc[priority] = priorityTasks;
      return acc;
    }, {} as Record<TaskPriority, Task[]>);
  }
);

// Simple selectors
export const selectTasksLoading = (state: any) => state.tasksMeta.isLoading;
export const selectTasksError = (state: any) => state.tasksMeta.error;
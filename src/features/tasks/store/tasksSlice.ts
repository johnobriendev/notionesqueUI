// src/features/tasks/store/tasksSlice.ts
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import taskService from '../services/taskService';


interface TasksState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
}

// Clean initial state
const initialState: TasksState = {
  items: [],
  isLoading: false,
  error: null
};

// Async thunks for API operations
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await taskService.getTasks(projectId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const createTaskAsync = createAsyncThunk(
  'tasks/createTask',
  async (task: {
    projectId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    position?: number;
    customFields?: Record<string, string | number | boolean>;
    taskId?: string; // For recreating tasks with specific IDs during undo
  }, { getState, rejectWithValue }) => {
    try {
      // Simple position calculation if not provided
      const state = getState() as { tasks: { items: Task[] } };
      const tasks = state.tasks.items;

      const tasksWithSamePriority = tasks.filter(
        t => t.priority === (task.priority || 'low') && t.projectId === task.projectId
      );

      const position = task.position ?? (tasksWithSamePriority.length
        ? Math.max(...tasksWithSamePriority.map(t => t.position || 0)) + 1
        : 0);

      // Clean API call - no more _undoData complexity
      const result = await taskService.createTask({
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status || 'not started',
        priority: task.priority || 'low',
        position,
        customFields: task.customFields,
        ...(task.taskId && { id: task.taskId })
      });

      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTaskAsync = createAsyncThunk(
  'tasks/updateTask',
  async (
    data: {
      projectId: string;
      taskId: string;
      updates: {
        title?: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        position?: number;
        customFields?: Record<string, string | number | boolean>;
      };
      version?: number;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      // Handle priority changes with position calculation
      if (data.updates.priority) {
        const state = getState() as { tasks: { items: Task[] } };
        const tasks = state.tasks.items;
        const currentTask = tasks.find(t => t.id === data.taskId);

        if (currentTask && currentTask.priority !== data.updates.priority && data.updates.position === undefined) {
          const tasksInNewPriority = tasks.filter(
            t => t.priority === data.updates.priority && t.projectId === data.projectId
          );

          const newPosition = tasksInNewPriority.length
            ? Math.max(...tasksInNewPriority.map(t => t.position || 0)) + 1
            : 0;

          data.updates.position = newPosition;
        }
      }

      const result = await taskService.updateTask(data.projectId, data.taskId, {
        ...data.updates,
        ...(data.version && { version: data.version })
      });
      return result;
    } catch (error: any) {
      if (error.response?.status === 409 && error.response?.data?.error === 'VERSION_CONFLICT') {
        return rejectWithValue({
          type: 'VERSION_CONFLICT',
          conflict: error.response.data.conflict,
          message: error.response.data.message
        });
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTask',
  async (data: {
    projectId: string;
    taskId: string;
  }, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(data.projectId, data.taskId);
      return { taskId: data.taskId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const deleteTasksAsync = createAsyncThunk(
  'tasks/deleteTasksAsync',
  async (
    data: {
      projectId: string;
      taskIds: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      await taskService.deleteTasks(data.projectId, data.taskIds);
      return { taskIds: data.taskIds };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tasks');
    }
  }
);

export const updateTaskPriorityAsync = createAsyncThunk(
  'tasks/updateTaskPriority',
  async (
    data: {
      projectId: string;
      taskId: string;
      priority: TaskPriority;
      destinationIndex?: number;
      version?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await taskService.updateTaskPriority(
        data.projectId,
        data.taskId,
        data.priority,
        data.destinationIndex,
        data.version
      );

      return result;
    } catch (error: any) {
      if (error.response?.status === 409 && error.response?.data?.error === 'VERSION_CONFLICT') {
        return rejectWithValue({
          type: 'VERSION_CONFLICT',
          conflict: error.response.data.conflict,
          message: error.response.data.message
        });
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to update task priority');
    }
  }
);

export const updateTaskStatusAsync = createAsyncThunk(
  'tasks/updateTaskStatus',
  async (
    data: {
      projectId: string;
      taskId: string;
      status: TaskStatus;
      destinationIndex?: number;
      version?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await taskService.updateTaskStatus(
        data.projectId,
        data.taskId,
        data.status,
        data.destinationIndex,
        data.version
      );

      return result;
    } catch (error: any) {
      if (error.response?.status === 409 && error.response?.data?.error === 'VERSION_CONFLICT') {
        return rejectWithValue({
          type: 'VERSION_CONFLICT',
          conflict: error.response.data.conflict,
          message: error.response.data.message
        });
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to update task status');
    }
  }
);

export const bulkUpdateTasksAsync = createAsyncThunk(
  'tasks/bulkUpdateTasksAsync',
  async (
    data: {
      projectId: string;
      taskIds: string[];
      updates: Partial<Pick<Task, 'status' | 'priority'>>;
    },
    { rejectWithValue }
  ) => {
    try {
      await taskService.bulkUpdateTasks(data.projectId, {
        taskIds: data.taskIds,
        updates: data.updates
      });

      return {
        taskIds: data.taskIds,
        updates: data.updates
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk update tasks');
    }
  }
);

export const reorderTasksAsync = createAsyncThunk(
  'tasks/reorderTasksAsync',
  async (
    data: {
      projectId: string;
      priority: TaskPriority;
      taskIds: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      await taskService.reorderTasks(
        data.projectId,
        data.priority,
        data.taskIds
      );

      return {
        priority: data.priority,
        taskIds: data.taskIds
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reorder tasks');
    }
  }
);

export const reorderTasksByStatusAsync = createAsyncThunk(
  'tasks/reorderTasksByStatusAsync',
  async (
    data: {
      projectId: string;
      status: TaskStatus;
      taskIds: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      await taskService.reorderTasksByStatus(
        data.projectId,
        data.status,
        data.taskIds
      );

      return {
        status: data.status,
        taskIds: data.taskIds
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reorder tasks by status');
    }
  }
);

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasks: (state) => {
      state.items = [];
    },

    // 🎯 NEW: Optimistic update actions for smooth drag & drop UX
    optimisticUpdateTaskPriority: (state, action: PayloadAction<{
      taskId: string;
      priority: TaskPriority;
      destinationIndex?: number;
    }>) => {
      const { taskId, priority, destinationIndex } = action.payload;
      const taskIndex = state.items.findIndex(t => t.id === taskId);

      if (taskIndex !== -1) {
        // Update the task's priority immediately
        state.items[taskIndex] = {
          ...state.items[taskIndex],
          priority,
          // Calculate position based on destination index if provided
          position: destinationIndex ?? state.items[taskIndex].position,
          updatedAt: new Date().toISOString()
        };
      }
    },

    optimisticUpdateTaskStatus: (state, action: PayloadAction<{
      taskId: string;
      status: TaskStatus;
      destinationIndex?: number;
    }>) => {
      const { taskId, status, destinationIndex } = action.payload;
      const taskIndex = state.items.findIndex(t => t.id === taskId);

      if (taskIndex !== -1) {
        // Update the task's status immediately
        state.items[taskIndex] = {
          ...state.items[taskIndex],
          status,
          // Calculate position based on destination index if provided
          position: destinationIndex ?? state.items[taskIndex].position,
          updatedAt: new Date().toISOString()
        };
      }
    },

    optimisticReorderTasks: (state, action: PayloadAction<{
      priority: TaskPriority;
      taskIds: string[];
    }>) => {
      const { priority, taskIds } = action.payload;

      // Update positions for all tasks in the reordered list
      taskIds.forEach((taskId, index) => {
        const taskIndex = state.items.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          state.items[taskIndex] = {
            ...state.items[taskIndex],
            position: index,
            updatedAt: new Date().toISOString()
          };
        }
      });
    },

    optimisticReorderTasksByStatus: (state, action: PayloadAction<{
      status: TaskStatus;
      taskIds: string[];
    }>) => {
      const { status, taskIds } = action.payload;

      // Update statusPositions for all tasks in the reordered list
      taskIds.forEach((taskId, index) => {
        const taskIndex = state.items.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          state.items[taskIndex] = {
            ...state.items[taskIndex],
            statusPosition: index,
            updatedAt: new Date().toISOString()
          };
        }
      });
    },

    // Revert optimistic updates (in case of failure)
    revertOptimisticUpdate: (state, action: PayloadAction<{
      taskId: string;
      originalTask: Task;
    }>) => {
      const { taskId, originalTask } = action.payload;
      const taskIndex = state.items.findIndex(t => t.id === taskId);

      if (taskIndex !== -1) {
        state.items[taskIndex] = originalTask;
      }
    },

    revertOptimisticReorder: (state, action: PayloadAction<{
      originalTasks: Task[];
    }>) => {
      const { originalTasks } = action.payload;

      // Restore original tasks
      originalTasks.forEach(originalTask => {
        const taskIndex = state.items.findIndex(t => t.id === originalTask.id);
        if (taskIndex !== -1) {
          state.items[taskIndex] = originalTask;
        }
      });
    }
  },

  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch tasks';
      })

      // Create task - simple CRUD operation
      .addCase(createTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.push(action.payload);
      })
      .addCase(createTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to create task';
      })

      // Update task - simple CRUD operation
      .addCase(updateTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update task';
      })

      // Delete task - simple CRUD operation
      .addCase(deleteTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter(task => task.id !== action.payload.taskId);
      })
      .addCase(deleteTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to delete task';
      })

      // Update task priority
      .addCase(updateTaskPriorityAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskPriorityAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTaskPriorityAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update task priority';
      })

      // Update task status
      .addCase(updateTaskStatusAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskStatusAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTaskStatusAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update task status';
      })

      // Bulk update tasks
      .addCase(bulkUpdateTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkUpdateTasksAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskIds, updates } = action.payload;
        state.items = state.items.map(task => {
          if (taskIds.includes(task.id)) {
            return {
              ...task,
              ...updates,
              updatedAt: new Date().toISOString()
            };
          }
          return task;
        });
      })
      .addCase(bulkUpdateTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to bulk update tasks';
      })

      // Reorder tasks
      .addCase(reorderTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reorderTasksAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskIds } = action.payload;
        taskIds.forEach((taskId, index) => {
          const taskIndex = state.items.findIndex(task => task.id === taskId);
          if (taskIndex !== -1) {
            state.items[taskIndex] = {
              ...state.items[taskIndex],
              position: index,
              updatedAt: new Date().toISOString()
            };
          }
        });
      })
      .addCase(reorderTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to reorder tasks';
      })

      // Reorder tasks by status
      .addCase(reorderTasksByStatusAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reorderTasksByStatusAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskIds } = action.payload;
        taskIds.forEach((taskId, index) => {
          const taskIndex = state.items.findIndex(task => task.id === taskId);
          if (taskIndex !== -1) {
            state.items[taskIndex] = {
              ...state.items[taskIndex],
              statusPosition: index,
              updatedAt: new Date().toISOString()
            };
          }
        });
      })
      .addCase(reorderTasksByStatusAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to reorder tasks by status';
      })

      // Delete multiple tasks
      .addCase(deleteTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTasksAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { taskIds } = action.payload;
        state.items = state.items.filter(task => !taskIds.includes(task.id));
      })
      .addCase(deleteTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to delete tasks';
      });
  }
});

// Export actions
export const {
  clearTasks,
  optimisticUpdateTaskPriority,
  optimisticUpdateTaskStatus,
  optimisticReorderTasks,
  optimisticReorderTasksByStatus,
  revertOptimisticUpdate,
  revertOptimisticReorder
} = tasksSlice.actions;

// Export the simple reducer (no more undoable wrapper!)
export default tasksSlice.reducer;

// Simplified selectors - note the state structure change
const selectTasksState = (state: any) => state.tasks; // No more .present!
const selectTasks = (state: any) => state.tasks.items; // Direct access to items
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

// Memoized selector for sorted and filtered tasks
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

// Memoized selector for tasks grouped by priority
export const selectTasksByPriority = createSelector(
  [selectFilteredTasks],
  (tasks: Task[]) => {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

    return priorities.reduce((acc, priority) => {
      const priorityTasks = tasks
        .filter((task: Task) => task.priority === priority)
        .sort((a: Task, b: Task) => (a.position || 0) - (b.position || 0));

      acc[priority] = priorityTasks;
      return acc;
    }, {} as Record<TaskPriority, Task[]>);
  }
);

// Memoized selector for tasks grouped by status
export const selectTasksByStatus = createSelector(
  [selectFilteredTasks],
  (tasks: Task[]) => {
    const statuses: TaskStatus[] = ['not started', 'in progress', 'completed'];

    return statuses.reduce((acc, status) => {
      const statusTasks = tasks
        .filter((task: Task) => task.status === status)
        .sort((a: Task, b: Task) => (a.statusPosition || 0) - (b.statusPosition || 0));

      acc[status] = statusTasks;
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }
);

// Simple loading and error selectors
export const selectTasksLoading = (state: any) => state.tasks.isLoading;
export const selectTasksError = (state: any) => state.tasks.error;
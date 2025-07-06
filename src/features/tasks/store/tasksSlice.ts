// src/features/tasks/tasksSlice.ts
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import undoable, { includeAction } from 'redux-undo';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import taskService from '../services/taskService';

// Define the state structure
interface TasksState {
  items: Task[];
  lastActionUndo?: {
    type: string;
    description: string;
    instructions: any;
  };
}

interface TasksMetaState {
  isLoading: boolean;
  error: string | null;
}

// Initial state for undoable data
const initialTasksState: TasksState = {
  items: []
};

// Initial state for meta data (not undoable)
const initialMetaState: TasksMetaState = {
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
    taskId?: string;
    isUndoOperation?: boolean; // Add this flag
  }, { getState, rejectWithValue }) => {
    try {
      // Calculate position if not provided
      const state = getState() as { tasks: { present: { items: Task[] } } };
      const tasks = state.tasks.present.items;

      const tasksWithSamePriority = tasks.filter(
        t => t.priority === (task.priority || 'none') && t.projectId === task.projectId
      );

      const position = task.position ?? (tasksWithSamePriority.length
        ? Math.max(...tasksWithSamePriority.map(t => t.position || 0)) + 1
        : 0);


      // Make API call
      const apiResult = await taskService.createTask({
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status || 'not started',
        priority: task.priority || 'none',
        position,
        customFields: task.customFields,
        ...(task.taskId && { id: task.taskId })
      });

      return {
        ...apiResult,
        _undoData: {
          operation: 'create',
          projectId: task.projectId
        }
      };
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
      previousTask?: Task;
      updates: {
        title?: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        position?: number;
        customFields?: Record<string, string | number | boolean>;
      };
      isUndoOperation?: boolean; // Add this flag
    },
    { getState, rejectWithValue }
  ) => {
    try {
      let previousTask = data.previousTask;

     if (!previousTask) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        previousTask = state.tasks.present.items.find(t => t.id === data.taskId);
      }

      // Handle priority changes
      if (data.updates.priority) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        const tasks = state.tasks.present.items;
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

      const result = await taskService.updateTask(data.projectId, data.taskId, data.updates);


      return {
        ...result,
        _undoData: {
          operation: 'update',
          previousTask,
          taskId: data.taskId,
          projectId: data.projectId
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

//one task
export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTask',
  async (data: {
    projectId: string;
    taskId: string;
    originalTask?: Task;
    isUndoOperation?: boolean; // Add this flag
  }, { getState, rejectWithValue }) => {
    try {
      let originalTask = data.originalTask;

      if (!originalTask) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        originalTask = state.tasks.present.items.find(t => t.id === data.taskId);
      }

      await taskService.deleteTask(data.projectId, data.taskId);
      return {
        taskId: data.taskId,
        _undoData: {
          operation: 'delete',
          originalTask,
          projectId: data.projectId
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

//multiple tasks
export const deleteTasksAsync = createAsyncThunk(
  'tasks/deleteTasksAsync',
  async (
    data: {
      projectId: string;
      taskIds: string[];
      originalTasks?: Task[];
      isUndoOperation?: boolean; // Add this flag
    },
    { getState, rejectWithValue }
  ) => {
    try {
      let originalTasks = data.originalTasks;
      if (!originalTasks) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        originalTasks = state.tasks.present.items.filter(t => data.taskIds.includes(t.id));
      }

      await taskService.deleteTasks(data.projectId, data.taskIds);
      return {
        taskIds: data.taskIds,
        _undoData: {
          operation: 'bulk_delete',
          originalTasks, // ✅ ALL tasks, not just the first one!
          projectId: data.projectId
        }
      };
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
      previousPriority?: TaskPriority;
      previousPosition?: number;
      destinationIndex?: number;
      isUndoOperation?: boolean; // Add this flag
    },
    { getState, rejectWithValue }
  ) => {
    try {
      // Store previous state for undo if not provided
      if (!data.previousPriority || data.previousPosition === undefined) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        const task = state.tasks.present.items.find(t => t.id === data.taskId);
        if (task) {
          data.previousPriority = task.priority;
          data.previousPosition = task.position;
        }
      }

      const result = await taskService.updateTaskPriority(
        data.projectId,
        data.taskId,
        data.priority,
        data.destinationIndex
      );
      
      return {
        ...result,
        _undoData: {
          operation: 'priority_change',
          previousPriority: data.previousPriority,
          previousPosition: data.previousPosition,
          taskId: data.taskId,
          projectId: data.projectId
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task priority');
    }
  }
);

export const bulkUpdateTasksAsync = createAsyncThunk(
  'tasks/bulkUpdateTasksAsync',
  async (
    data: {
      projectId: string;
      taskIds: string[];
      previousTasks?: Task[];
      updates: Partial<Pick<Task, 'status' | 'priority'>>;
      isUndoOperation?: boolean; // Add this flag
    },
    { getState, rejectWithValue }
  ) => {
    try {
      let previousTasks = data.previousTasks;
      if (!previousTasks) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        previousTasks = state.tasks.present.items.filter(t => 
          data.taskIds.includes(t.id)
        );
      }

      await taskService.bulkUpdateTasks(data.projectId, {
        taskIds: data.taskIds,
        updates: data.updates
      });

      return { 
        taskIds: data.taskIds, 
        updates: data.updates,
        _undoData: {
          operation: 'bulk_update',
          previousTasks, 
          projectId: data.projectId
        }
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
      previousOrder?: string[];
      isUndoOperation?: boolean; // Add this flag
    },
    { getState, rejectWithValue }
  ) => {
    try {
      if (!data.previousOrder) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        const tasksInPriority = state.tasks.present.items
          .filter(t => t.priority === data.priority && t.projectId === data.projectId)
          .sort((a, b) => a.position - b.position);
        data.previousOrder = tasksInPriority.map(t => t.id);
      }

      await taskService.reorderTasks(
        data.projectId,
        data.priority,
        data.taskIds
      );

      return { 
        priority: data.priority, 
        taskIds: data.taskIds,
        _undoData: {
          operation: 'reorder',
          previousOrder: data.previousOrder,
          priority: data.priority,
          projectId: data.projectId
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reorder tasks');
    }
  }
);

// Create the slice
export const tasksSlice = createSlice({
  name: 'tasks',
  initialState: initialTasksState,
  reducers: {
    clearTasks: (state) => {
      state.items = [];
      state.lastActionUndo = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ ONLY fulfilled cases modify task items (undoable)
      // No pending/rejected cases here - they don't affect task data
      
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.items = action.payload;
        // Don't store undo for fetch - it's not an undoable action
      })

      .addCase(createTaskAsync.fulfilled, (state, action) => {
        const { _undoData, ...task } = action.payload;
        state.items.push(task);
        
        // ✅ STORE UNDO INSTRUCTIONS
        state.lastActionUndo = {
          type: 'CREATE_TASK',
          description: `Create task: ${task.title}`,
          instructions: {
            operation: 'delete',
            taskId: task.id,
            projectId: _undoData.projectId
          }
        };
      })

      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        const { _undoData, ...task } = action.payload;
        const index = state.items.findIndex(t => t.id === task.id);
        if (index !== -1) {
          state.items[index] = task;
        }
        
        // ✅ STORE UNDO INSTRUCTIONS
        state.lastActionUndo = {
          type: 'UPDATE_TASK',
          description: `Update task: ${task.title}`,
          instructions: {
            operation: 'update',
            taskId: task.id,
            previousData: _undoData.previousTask,
            projectId: _undoData.projectId
          }
        };
      })

      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        const { taskId, _undoData } = action.payload;
        state.items = state.items.filter(task => task.id !== taskId);
        
        // ✅ STORE UNDO INSTRUCTIONS
        state.lastActionUndo = {
          type: 'DELETE_TASK',
          description: `Delete task: ${_undoData.originalTask?.title || 'Unknown'}`,
          instructions: {
            operation: 'create',
            taskData: _undoData.originalTask,
            projectId: _undoData.projectId
          }
        };
      })

      .addCase(updateTaskPriorityAsync.fulfilled, (state, action) => {
        const { _undoData, ...task } = action.payload;
        const index = state.items.findIndex(t => t.id === task.id);
        if (index !== -1) {
          state.items[index] = task;
        }
        
        // ✅ STORE UNDO INSTRUCTIONS
        state.lastActionUndo = {
          type: 'UPDATE_PRIORITY',
          description: `Change priority: ${task.title}`,
          instructions: {
            operation: 'updatePriority',
            taskId: task.id,
            previousPriority: _undoData.previousPriority,
            previousPosition: _undoData.previousPosition,
            projectId: _undoData.projectId
          }
        };
      })

      .addCase(bulkUpdateTasksAsync.fulfilled, (state, action) => {
        const { taskIds, updates, _undoData } = action.payload;
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
        
        // ✅ STORE UNDO INSTRUCTIONS
        state.lastActionUndo = {
          type: 'BULK_UPDATE',
          description: `Bulk update ${taskIds.length} tasks`,
          instructions: {
            operation: 'bulkUpdate',
            taskIds,
            previousData: _undoData.previousTasks,
            projectId: _undoData.projectId
          }
        };
      })

      .addCase(reorderTasksAsync.fulfilled, (state, action) => {
        const { taskIds, _undoData } = action.payload;
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
        
        // ✅ STORE UNDO INSTRUCTIONS
        state.lastActionUndo = {
          type: 'REORDER',
          description: `Reorder tasks in ${_undoData.priority}`,
          instructions: {
            operation: 'reorder',
            priority: _undoData.priority,
            previousOrder: _undoData.previousOrder,
            projectId: _undoData.projectId
          }
        };
      })

      .addCase(deleteTasksAsync.fulfilled, (state, action) => {
        const { taskIds, _undoData } = action.payload;
        state.items = state.items.filter(task => !taskIds.includes(task.id));
        
        // ✅ STORE UNDO INSTRUCTIONS
        state.lastActionUndo = {
          type: 'BULK_DELETE',
          description: `Delete ${taskIds.length} tasks`,
          instructions: {
            operation: 'bulkCreate',
            tasksData: _undoData.originalTasks,
            projectId: _undoData.projectId
          }
        };
      })
  }
});

// ✅ META SLICE: Handles loading/error states (not undoable)
export const tasksMetaSlice = createSlice({
  name: 'tasksMeta',
  initialState: initialMetaState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // All pending cases
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTaskAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTaskPriorityAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkUpdateTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reorderTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      // All fulfilled cases
      .addCase(fetchTasks.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createTaskAsync.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateTaskAsync.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteTaskAsync.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateTaskPriorityAsync.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(bulkUpdateTasksAsync.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(reorderTasksAsync.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteTasksAsync.fulfilled, (state) => {
        state.isLoading = false;
      })

      // All rejected cases
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch tasks';
      })
      .addCase(createTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to create task';
      })
      .addCase(updateTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update task';
      })
      .addCase(deleteTaskAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to delete task';
      })
      .addCase(updateTaskPriorityAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update task priority';
      })
      .addCase(bulkUpdateTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to bulk update tasks';
      })
      .addCase(reorderTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to reorder tasks';
      })
      .addCase(deleteTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to delete tasks';
      })
  }
});

// Actions to be included in undo history (async thunk fulfilled actions)
const undoableActions = [
  'tasks/createTask/fulfilled',
  'tasks/updateTask/fulfilled',
  'tasks/deleteTask/fulfilled',
  'tasks/deleteTasksAsync/fulfilled',
  'tasks/updateTaskPriorityAsync/fulfilled',
  'tasks/reorderTasksAsync/fulfilled',
  'tasks/bulkUpdateTasksAsync/fulfilled'
];

// Export actions
export const { clearTasks } = tasksSlice.actions;

// Create the undoable reducer
const undoableTasksReducer = undoable(tasksSlice.reducer, {
  filter: (action, currentState, previousHistory) => {
    // ✅ FILTER OUT UNDO OPERATIONS: Don't create undo states for API sync during undo/redo
    if (action.type.includes('/fulfilled') && 
        action.meta && 
        typeof action.meta === 'object' && 
        'arg' in action.meta &&
        action.meta.arg &&
        typeof action.meta.arg === 'object' &&
        'isUndoOperation' in action.meta.arg &&
        action.meta.arg.isUndoOperation === true) {
      console.log('🚫 Filtering out undo operation:', action.type);
      return false;
    }
    
    // ✅ INCLUDE NORMAL OPERATIONS: Regular user actions should create undo states
    const undoableActions = [
      'tasks/createTask/fulfilled',
      'tasks/updateTask/fulfilled', 
      'tasks/deleteTask/fulfilled',
      'tasks/deleteTasksAsync/fulfilled',
      'tasks/updateTaskPriority/fulfilled',
      'tasks/reorderTasksAsync/fulfilled',
      'tasks/bulkUpdateTasksAsync/fulfilled'
    ];
    
    return undoableActions.includes(action.type);
  },
  limit: 20,
  debug: true, // Keep debug on to verify filtering works
  syncFilter: true,
  clearHistoryType: '@@redux-undo/CLEAR_HISTORY'
});

export default undoableTasksReducer;
export const tasksMetaReducer = tasksMetaSlice.reducer;


//  Base selectors for composition
const selectTasksState = (state: any) => state.tasks.present;
const selectTasks = (state: any) => state.tasks.present.items;
const selectCurrentProjectId = (state: any) => state.projects.currentProject?.id;
const selectFilterConfig = (state: any) => state.ui.filterConfig;
const selectSortConfig = (state: any) => state.ui.sortConfig;

//  Memoized selector for project tasks
export const selectProjectTasks = createSelector(
  [selectTasks, selectCurrentProjectId],
  (tasks, projectId) => {
    if (!projectId) return [];
    return tasks.filter((task: Task) => task.projectId === projectId);
  }
);

//  Memoized selector for filtered tasks
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

//  Memoized selector for sorted and filtered tasks (for ListView)
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

//  Memoized selector for tasks grouped by priority (for KanbanView)
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

// selectors
export const selectTasksLoading = (state: any) => state.tasksMeta.isLoading;
export const selectTasksError = (state: any) => state.tasksMeta.error;
export const selectCanUndo = (state: any) => state.tasks.past.length > 0;
export const selectCanRedo = (state: any) => state.tasks.future.length > 0;
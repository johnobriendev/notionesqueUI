// src/features/tasks/tasksSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import undoable, { includeAction } from 'redux-undo';
import { Task, TaskStatus, TaskPriority } from '../../types';
import taskService from '../../services/taskService';

// Define the state structure
interface TasksState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
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
      
      // Create optimistic task immediately
      const optimisticTask: Task = {
        id: crypto.randomUUID(),
        projectId: task.projectId,
        title: task.title,
        description: task.description || '',
        status: task.status || 'not started',
        priority: task.priority || 'none',
        position,
        customFields: task.customFields || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Make API call
      const apiResult = await taskService.createTask({
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status || 'not started',
        priority: task.priority || 'none',
        position,
        customFields: task.customFields
      });
      
      // Return the API result (with real ID) but preserve optimistic timing
      return apiResult;
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
      // Store previous state for undo if not provided
      if (!data.previousTask) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        data.previousTask = state.tasks.present.items.find(t => t.id === data.taskId);
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
      
      return await taskService.updateTask(data.projectId, data.taskId, data.updates);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTask',
  async (data: { 
    projectId: string; 
    taskId: string; 
    originalTask?: Task;
    isUndoOperation?: boolean; // Add this flag
  }, { getState, rejectWithValue }) => {
    try {
      // Store original task for undo if not provided
      if (!data.originalTask) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        data.originalTask = state.tasks.present.items.find(t => t.id === data.taskId);
      }

      await taskService.deleteTask(data.projectId, data.taskId);
      return data.taskId;
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
      originalTasks?: Task[];
      isUndoOperation?: boolean; // Add this flag
    },
    { getState, rejectWithValue }
  ) => {
    try {
      if (!data.originalTasks) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        data.originalTasks = state.tasks.present.items.filter(t => data.taskIds.includes(t.id));
      }

      await taskService.deleteTasks(data.projectId, data.taskIds);
      return data.taskIds;
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

      return await taskService.updateTaskPriority(
        data.projectId,
        data.taskId,
        data.priority,
        data.destinationIndex
      );
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
      if (!data.previousTasks) {
        const state = getState() as { tasks: { present: { items: Task[] } } };
        data.previousTasks = state.tasks.present.items.filter(t => 
          data.taskIds.includes(t.id)
        );
      }

      await taskService.bulkUpdateTasks(data.projectId, {
        taskIds: data.taskIds,
        updates: data.updates
      });
      
      return { taskIds: data.taskIds, updates: data.updates };
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
      return { priority: data.priority, taskIds: data.taskIds };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reorder tasks');
    }
  }
);

// Create the slice
export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Keep clearTasks for utility
    clearTasks: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTasks
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
      
      // createTaskAsync - Optimistic update
      .addCase(createTaskAsync.pending, (state, action) => {
        // Add optimistic task immediately
        const now = new Date().toISOString();
        const { projectId, title, description, status, priority, customFields } = action.meta.arg;
        
        const tasksWithSamePriority = state.items.filter(
          t => t.priority === (priority || 'none') && t.projectId === projectId
        );
        
        const position = tasksWithSamePriority.length 
          ? Math.max(...tasksWithSamePriority.map(t => t.position || 0)) + 1 
          : 0;
        
        const optimisticTask: Task = {
          id: `temp-${Date.now()}`, // Temporary ID
          projectId,
          title,
          description: description || '',
          status: status || 'not started',
          priority: priority || 'none',
          position,
          customFields: customFields || {},
          createdAt: now,
          updatedAt: now
        };
        
        state.items.push(optimisticTask);
      })
      .addCase(createTaskAsync.fulfilled, (state, action) => {
        // Replace optimistic task with real one
        const tempIndex = state.items.findIndex(t => t.id.startsWith('temp-'));
        if (tempIndex !== -1) {
          state.items[tempIndex] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(createTaskAsync.rejected, (state, action) => {
        // Remove optimistic task on failure
        state.items = state.items.filter(t => !t.id.startsWith('temp-'));
        state.error = action.payload as string || 'Failed to create task';
      })
      
      // updateTaskAsync - Optimistic update
      .addCase(updateTaskAsync.pending, (state, action) => {
        const { taskId, updates } = action.meta.arg;
        const index = state.items.findIndex(task => task.id === taskId);
        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...updates,
            updatedAt: new Date().toISOString()
          };
        }
      })
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        const index = state.items.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTaskAsync.rejected, (state, action) => {
        // Revert optimistic update on failure
        const { taskId, previousTask } = action.meta.arg;
        if (previousTask) {
          const index = state.items.findIndex(task => task.id === taskId);
          if (index !== -1) {
            state.items[index] = previousTask;
          }
        }
        state.error = action.payload as string || 'Failed to update task';
      })
      
      // deleteTaskAsync - Optimistic update
      .addCase(deleteTaskAsync.pending, (state, action) => {
        const { taskId } = action.meta.arg;
        state.items = state.items.filter(task => task.id !== taskId);
      })
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        // Already removed optimistically
        state.items = state.items.filter(task => task.id !== action.payload);
      })
      .addCase(deleteTaskAsync.rejected, (state, action) => {
        // Restore task on failure
        const { originalTask } = action.meta.arg;
        if (originalTask) {
          state.items.push(originalTask);
        }
        state.error = action.payload as string || 'Failed to delete task';
      })
      
      // updateTaskPriorityAsync - Optimistic update
      .addCase(updateTaskPriorityAsync.pending, (state, action) => {
        const { taskId, priority, destinationIndex } = action.meta.arg;
        const index = state.items.findIndex(task => task.id === taskId);
        
        if (index !== -1) {
          const oldPriority = state.items[index].priority;
          
          if (oldPriority !== priority) {
            let newPosition;
            const tasksInDestPriority = state.items.filter(t => t.priority === priority);
            
            if (destinationIndex !== undefined && tasksInDestPriority.length > 0) {
              const sortedTasks = [...tasksInDestPriority].sort((a, b) => 
                (a.position || 0) - (b.position || 0)
              );
              
              if (destinationIndex >= sortedTasks.length) {
                const maxPosition = Math.max(...sortedTasks.map(t => t.position || 0));
                newPosition = maxPosition + 1;
              } else {
                const positionAtDrop = sortedTasks[destinationIndex].position || 0;
                
                state.items.forEach(task => {
                  if (
                    task.priority === priority && 
                    task.position !== undefined && 
                    task.position >= positionAtDrop
                  ) {
                    task.position += 1;
                  }
                });
                
                newPosition = positionAtDrop;
              }
            } else {
              newPosition = tasksInDestPriority.length 
                ? Math.max(...tasksInDestPriority.map(t => t.position || 0)) + 1 
                : 0;
            }
            
            state.items[index] = {
              ...state.items[index],
              priority,
              position: newPosition,
              updatedAt: new Date().toISOString()
            };
          }
        }
      })
      .addCase(updateTaskPriorityAsync.fulfilled, (state, action) => {
        const index = state.items.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      // bulkUpdateTasksAsync - Optimistic update
      .addCase(bulkUpdateTasksAsync.pending, (state, action) => {
        const { taskIds, updates } = action.meta.arg;
        
        if (updates.priority) {
          const tasksInDestPriority = state.items.filter(t => t.priority === updates.priority);
          let nextPosition = tasksInDestPriority.length 
            ? Math.max(...tasksInDestPriority.map(t => t.position || 0)) + 1 
            : 0;
            
          state.items = state.items.map(task => {
            if (taskIds.includes(task.id)) {
              const needsNewPosition = updates.priority && task.priority !== updates.priority;
              
              return {
                ...task,
                ...updates,
                position: needsNewPosition ? nextPosition++ : (task.position || 0),
                updatedAt: new Date().toISOString()
              };
            }
            return task;
          });
        } else {
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
        }
      })
      .addCase(bulkUpdateTasksAsync.fulfilled, (state, action) => {
        // State already updated optimistically
      })

      // reorderTasksAsync - Optimistic update
      .addCase(reorderTasksAsync.pending, (state, action) => {
        const { taskIds } = action.meta.arg;
        
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
      .addCase(reorderTasksAsync.fulfilled, (state, action) => {
        // State already updated optimistically
      })

      // deleteTasksAsync - Optimistic update
      .addCase(deleteTasksAsync.pending, (state, action) => {
        const { taskIds } = action.meta.arg;
        state.items = state.items.filter(task => !taskIds.includes(task.id));
      })
      .addCase(deleteTasksAsync.fulfilled, (state, action) => {
        // Already removed optimistically
      })
      .addCase(deleteTasksAsync.rejected, (state, action) => {
        // Restore tasks on failure
        const { originalTasks } = action.meta.arg;
        if (originalTasks) {
          state.items.push(...originalTasks);
        }
        state.error = action.payload as string || 'Failed to delete tasks';
      })
  }
});

// UPDATED: Actions to be included in undo history (async thunk fulfilled actions)
const undoableActions = [
  'tasks/createTask/fulfilled',
  'tasks/updateTask/fulfilled', 
  'tasks/deleteTask/fulfilled',
  'tasks/deleteTasksAsync/fulfilled',
  'tasks/updateTaskPriority/fulfilled',
  'tasks/reorderTasksAsync/fulfilled',
  'tasks/bulkUpdateTasksAsync/fulfilled'
];

// Export actions
export const { clearTasks } = tasksSlice.actions;

// Create the undoable reducer
const undoableTasksReducer = undoable(tasksSlice.reducer, {
  filter: includeAction(undoableActions),
  limit: 20,
  debug: false,
  syncFilter: true,
  clearHistoryType: '@@redux-undo/CLEAR_HISTORY'
});

export default undoableTasksReducer;

// Selectors
export const selectAllTasks = (state: any) => state.tasks.present.items;
export const selectTasksLoading = (state: any) => state.tasks.present.isLoading;
export const selectTasksError = (state: any) => state.tasks.present.error;
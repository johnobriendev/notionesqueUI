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
  async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'position'>, { rejectWithValue }) => {
    try {
      return await taskService.createTask({
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority
      });
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
      updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>
    }, 
    { rejectWithValue }
  ) => {
    try {
      return await taskService.updateTask(data.projectId, data.taskId, data.updates);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTask',
  async (data: { projectId: string; taskId: string }, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(data.projectId, data.taskId);
      return data.taskId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
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
      destinationIndex?: number 
    }, 
    { rejectWithValue }
  ) => {
    try {
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
      updates: Partial<Pick<Task, 'status' | 'priority'>>;
    },
    { rejectWithValue }
  ) => {
    try {
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
    data: { projectId: string; priority: TaskPriority; taskIds: string[] },
    { rejectWithValue }
  ) => {
    try {
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
    // Local reducers for optimistic updates
    addTask: (state, action: PayloadAction<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'position'>>) => {
      // This is now a temporary action that will be replaced by the async version
      const now = new Date().toISOString();
      
      const tasksWithSamePriority = state.items.filter(
        task => task.priority === action.payload.priority
      );
      
      const position = tasksWithSamePriority.length 
        ? Math.max(...tasksWithSamePriority.map(t => t.position || 0)) + 1 
        : 0;
      
      const newTask: Task = {
        ...action.payload,
        id: crypto.randomUUID(), // Using browser's UUID generation
        position,
        createdAt: now,
        updatedAt: now
      };
      
      state.items.push(newTask);
    },
    
    updateTask: (state, action: PayloadAction<{ id: string; updates: Partial<Omit<Task, 'id' | 'createdAt'>> }>) => {
      const { id, updates } = action.payload;
      const index = state.items.findIndex(task => task.id === id);
      
      if (index !== -1) {
        const oldPriority = state.items[index].priority;
        const newPriority = updates.priority;
        
        if (newPriority && newPriority !== oldPriority) {
          const tasksInNewPriority = state.items.filter(t => t.priority === newPriority);
          const newPosition = tasksInNewPriority.length 
            ? Math.max(...tasksInNewPriority.map(t => t.position || 0)) + 1 
            : 0;
          
          updates.position = newPosition;
        }
        
        state.items[index] = {
          ...state.items[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
    },
    
    deleteTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(task => task.id !== action.payload);
    },
    
    deleteTasks: (state, action: PayloadAction<string[]>) => {
      state.items = state.items.filter(task => !action.payload.includes(task.id));
    },
    
    updateTaskPriority: (state, action: PayloadAction<{ id: string; priority: TaskPriority; destinationIndex?: number }>) => {
      const { id, priority, destinationIndex } = action.payload;
      const index = state.items.findIndex(task => task.id === id);
      
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
    },
    
    reorderTasks: (state, action: PayloadAction<{ priority: TaskPriority; taskIds: string[] }>) => {
      const { priority, taskIds } = action.payload;
      
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
    },
    
    clearTasks: (state) => {
      state.items = [];
    },

    bulkUpdateTasks: (state, action: PayloadAction<{ 
      taskIds: string[]; 
      updates: Partial<Pick<Task, 'status' | 'priority'>> 
    }>) => {
      const { taskIds, updates } = action.payload;
      
      // If priority is changing, we need to handle positions
      if (updates.priority) {
        // Get all tasks in the destination priority
        const tasksInDestPriority = state.items.filter(t => t.priority === updates.priority);
        let nextPosition = tasksInDestPriority.length 
          ? Math.max(...tasksInDestPriority.map(t => t.position || 0)) + 1 
          : 0;
          
        // Update each task one by one to maintain proper positions
        state.items = state.items.map(task => {
          if (taskIds.includes(task.id)) {
            // If priority is changing, assign a new position
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
        // No priority change, simpler update
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
    }


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
      
      // createTaskAsync
      .addCase(createTaskAsync.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      
      // updateTaskAsync
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        const index = state.items.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      
      // deleteTaskAsync
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(task => task.id !== action.payload);
      })
      
      // updateTaskPriorityAsync
      .addCase(updateTaskPriorityAsync.fulfilled, (state, action) => {
        const index = state.items.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      .addCase(bulkUpdateTasksAsync.fulfilled, (state, action) => {
        const { taskIds, updates } = action.payload;
        
        // Similar logic to the bulkUpdateTasks reducer
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

      .addCase(reorderTasksAsync.fulfilled, (state, action) => {
        const { priority, taskIds } = action.payload;
        
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

  }
});

// Actions to be included in undo history
const undoableActions = [
  'tasks/addTask',
  'tasks/updateTask',
  'tasks/deleteTask',
  'tasks/deleteTasks',
  'tasks/updateTaskPriority',
  'tasks/reorderTasks',
  'tasks/bulkUpdateTasks'
];

// Export actions
export const { 
  addTask, 
  updateTask, 
  deleteTask, 
  deleteTasks,
  updateTaskPriority,
  reorderTasks,
  bulkUpdateTasks,
  clearTasks
} = tasksSlice.actions;

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
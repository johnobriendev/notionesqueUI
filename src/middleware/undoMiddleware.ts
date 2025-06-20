// src/middleware/undoMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { ActionCreators } from 'redux-undo';
import { 
  createTaskAsync, 
  updateTaskAsync, 
  deleteTaskAsync,
  deleteTasksAsync,
  reorderTasksAsync,
  bulkUpdateTasksAsync,
  updateTaskPriorityAsync
} from '../features/tasks/tasksSlice';
import { Task, TaskPriority } from '../types';

// Explicitly type the action
interface AppAction {
  type: string;
  payload?: any;
  meta?: {
    arg?: any;
  };
}

interface HistoryEntry {
  action: AppAction;
  inverse: AppAction | null;
}

// Initialize history storage
let actionHistory: HistoryEntry[] = [];
let historyIndex = -1;
const MAX_HISTORY = 20;

// Flag to prevent circular dispatching
let isUndoRedoAction = false;

// Create inverse action based on fulfilled async action
const createInverseAction = (action: AppAction): AppAction | null => {
  // For task creation, the inverse is deletion
  if (action.type === createTaskAsync.fulfilled.type) {
    const task = action.payload;
    return deleteTaskAsync({
      projectId: task.projectId,
      taskId: task.id,
      originalTask: task,
      isUndoOperation: true
    }) as any;
  }
  
  // For task deletion, the inverse is creation
  else if (action.type === deleteTaskAsync.fulfilled.type) {
    const originalTask = action.meta?.arg?.originalTask;
    
    if (!originalTask) {
      console.warn('Cannot create inverse action: missing originalTask');
      return null;
    }
    
    return createTaskAsync({
      projectId: originalTask.projectId,
      title: originalTask.title,
      description: originalTask.description,
      status: originalTask.status,
      priority: originalTask.priority,
      position: originalTask.position,
      customFields: originalTask.customFields,
      isUndoOperation: true
    }) as any;
  }
  
  // For bulk task deletion, create individual tasks
  else if (action.type === deleteTasksAsync.fulfilled.type) {
    const originalTasks = action.meta?.arg?.originalTasks;
    
    if (!originalTasks || !originalTasks.length) {
      console.warn('Cannot create inverse action: missing originalTasks');
      return null;
    }
    
    const firstTask = originalTasks[0];
    console.warn(`Bulk delete undo: Only restoring first task of ${originalTasks.length}`);
    
    return createTaskAsync({
      projectId: firstTask.projectId,
      title: firstTask.title,
      description: firstTask.description,
      status: firstTask.status,
      priority: firstTask.priority,
      position: firstTask.position,
      customFields: firstTask.customFields,
      isUndoOperation: true
    }) as any;
  }
  
  // For task updates, the inverse is update with previous values
  else if (action.type === updateTaskAsync.fulfilled.type) {
    const previousTask = action.meta?.arg?.previousTask;
    
    if (!previousTask) {
      console.warn('Cannot create inverse action: missing previousTask');
      return null;
    }
    
    const currentTask = action.payload;
    
    return updateTaskAsync({
      projectId: currentTask.projectId,
      taskId: currentTask.id,
      previousTask: currentTask,
      updates: {
        title: previousTask.title,
        description: previousTask.description,
        status: previousTask.status,
        priority: previousTask.priority,
        position: previousTask.position,
        customFields: previousTask.customFields
      },
      isUndoOperation: true
    }) as any;
  }
  
  // For priority changes
  else if (action.type === updateTaskPriorityAsync.fulfilled.type) {
    const previousPriority = action.meta?.arg?.previousPriority;
    const previousPosition = action.meta?.arg?.previousPosition;
    
    if (!previousPriority) {
      console.warn('Cannot create inverse action: missing previousPriority');
      return null;
    }
    
    const task = action.payload;
    
    return updateTaskPriorityAsync({
      projectId: task.projectId,
      taskId: task.id,
      priority: previousPriority,
      previousPriority: task.priority,
      destinationIndex: previousPosition,
      previousPosition: task.position,
      isUndoOperation: true
    }) as any;
  }
  
  // For bulk updates
  else if (action.type === bulkUpdateTasksAsync.fulfilled.type) {
    const { taskIds, updates } = action.payload;
    const previousTasks = action.meta?.arg?.previousTasks;
    
    if (!previousTasks || !previousTasks.length) {
      console.warn('Cannot create inverse action: missing previousTasks');
      return null;
    }
    
    const inverseUpdates: Partial<Pick<Task, 'status' | 'priority'>> = {};
    
    if (updates.status !== undefined) {
      const firstStatus = previousTasks[0].status;
      const allSameStatus = previousTasks.every((t: any) => t.status === firstStatus);
      if (allSameStatus) {
        inverseUpdates.status = firstStatus;
      }
    }
    
    if (updates.priority !== undefined) {
      const firstPriority = previousTasks[0].priority;
      const allSamePriority = previousTasks.every((t: any) => t.priority === firstPriority);
      if (allSamePriority) {
        inverseUpdates.priority = firstPriority;
      }
    }
    
    if (Object.keys(inverseUpdates).length === 0) {
      console.warn('Cannot create simple inverse action for heterogeneous bulk update');
      return null;
    }
    
    return bulkUpdateTasksAsync({
      projectId: previousTasks[0].projectId,
      taskIds,
      updates: inverseUpdates,
      previousTasks: previousTasks.map((t: any) => ({
        ...t,
        ...(updates.status && { status: updates.status }),
        ...(updates.priority && { priority: updates.priority })
      })),
      isUndoOperation: true
    }) as any;
  }
  
  // For reordering
  else if (action.type === reorderTasksAsync.fulfilled.type) {
    const { priority, taskIds } = action.payload;
    const previousOrder = action.meta?.arg?.previousOrder;
    
    if (!previousOrder) {
      console.warn('Cannot create inverse action: missing previousOrder');
      return null;
    }
    
    return reorderTasksAsync({
      projectId: action.meta?.arg?.projectId,
      priority: priority as TaskPriority,
      taskIds: previousOrder,
      previousOrder: taskIds,
      isUndoOperation: true
    }) as any;
  }
  
  return null;
};

// Explicitly type the middleware to avoid TypeScript issues
export const undoMiddleware: Middleware = (store) => (next) => (action: any) => {
  // Handle undo/redo commands from redux-undo BEFORE processing other actions
  if (action.type === ActionCreators.undo().type) {
    if (historyIndex >= 0) {
      const entry = actionHistory[historyIndex];
      if (entry && entry.inverse) {
        console.log('Dispatching inverse action:', entry.inverse.type);
        
        isUndoRedoAction = true;
        store.dispatch(entry.inverse as any);
        
        setTimeout(() => {
          isUndoRedoAction = false;
        }, 100);
      }
      historyIndex--;
    }
    
    return next(action);
  }
  else if (action.type === ActionCreators.redo().type) {
    if (historyIndex < actionHistory.length - 1) {
      historyIndex++;
      const entry = actionHistory[historyIndex];
      if (entry) {
        console.log('Dispatching redo action:', entry.action.type);
        
        isUndoRedoAction = true;
        
        const redoAction = {
          ...entry.action,
          meta: {
            ...entry.action.meta,
            arg: {
              ...entry.action.meta?.arg,
              isUndoOperation: true
            }
          }
        };
        
        store.dispatch(redoAction as any);
        
        setTimeout(() => {
          isUndoRedoAction = false;
        }, 100);
      }
    }
    
    return next(action);
  }
  
  // Process the action first
  const result = next(action);
  
  // Record actions that modify data (but not if it's an undo/redo operation)
  if (!isUndoRedoAction && 
      !action.meta?.arg?.isUndoOperation &&
      (action.type === createTaskAsync.fulfilled.type ||
       action.type === updateTaskAsync.fulfilled.type ||
       action.type === deleteTaskAsync.fulfilled.type ||
       action.type === deleteTasksAsync.fulfilled.type ||
       action.type === updateTaskPriorityAsync.fulfilled.type ||
       action.type === reorderTasksAsync.fulfilled.type ||
       action.type === bulkUpdateTasksAsync.fulfilled.type)) {
    
    const inverse = createInverseAction(action);
    
    if (historyIndex < actionHistory.length - 1) {
      actionHistory = actionHistory.slice(0, historyIndex + 1);
    }
    
    actionHistory.push({ action: action as any, inverse });
    
    if (actionHistory.length > MAX_HISTORY) {
      actionHistory.shift();
    } else {
      historyIndex++;
    }
    
    console.log('Recorded action for undo/redo:', action.type);
    console.log('Current history index:', historyIndex, 'History length:', actionHistory.length);
  }
  
  return result;
};

// Export function to clear history (for when switching projects)
export const clearUndoHistory = () => {
  actionHistory = [];
  historyIndex = -1;
  console.log('Undo history cleared');
};
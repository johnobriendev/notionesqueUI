import { UndoableCommand } from './types/commandTypes';
import { createTaskAsync, updateTaskAsync, deleteTaskAsync } from '../tasks/store/tasksSlice';
import { Task, TaskStatus, TaskPriority } from '../../types';

// Data interfaces for command parameters
interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  customFields?: Record<string, string | number | boolean>;
}

interface UpdateTaskData {
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
}

interface DeleteTaskData {
  projectId: string;
  taskId: string;
}

// CREATE TASK COMMAND
export const createTaskCommand = (data: CreateTaskData): UndoableCommand => {
  let createdTaskId: string | null = null;

  return {
    type: 'CREATE_TASK',
    description: `Create task: ${data.title}`,
    
    execute: async (dispatch, getState) => {
      console.log('🎯 Executing: Create task', data.title);
      
      const result = await dispatch(createTaskAsync({
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status || 'not started',
        priority: data.priority || 'none',
        position: data.position,
        customFields: data.customFields || {},
        isUndoOperation: false
      })).unwrap();
      
      createdTaskId = result.id;
      console.log('✅ Task created with ID:', createdTaskId);
    },
    
    undo: async (dispatch, getState) => {
      if (!createdTaskId) {
        throw new Error('Cannot undo: No task ID stored');
      }
      
      console.log('↩️ Undoing: Delete created task', createdTaskId);
      
      await dispatch(deleteTaskAsync({
        projectId: data.projectId,
        taskId: createdTaskId,
        isUndoOperation: true
      })).unwrap();
      
      console.log('✅ Task creation undone');
    }
  };
};

// UPDATE TASK COMMAND
export const updateTaskCommand = (data: UpdateTaskData): UndoableCommand => {
  let previousTaskData: Task | null = null;

  return {
    type: 'UPDATE_TASK',
    description: `Update task`,
    
    execute: async (dispatch, getState) => {
      console.log('🎯 Executing: Update task', data.taskId);
      
      // Store current task data before updating
      const state = getState();
      const currentTask = state.tasks.present.items.find((t: Task) => t.id === data.taskId);
      if (currentTask) {
        previousTaskData = { ...currentTask };
      }
      
      await dispatch(updateTaskAsync({
        projectId: data.projectId,
        taskId: data.taskId,
        updates: data.updates,
        isUndoOperation: false
      })).unwrap();
      
      console.log('✅ Task updated');
    },
    
    undo: async (dispatch, getState) => {
      if (!previousTaskData) {
        throw new Error('Cannot undo: No previous task data stored');
      }
      
      console.log('↩️ Undoing: Restore previous task data', data.taskId);
      
      await dispatch(updateTaskAsync({
        projectId: data.projectId,
        taskId: data.taskId,
        updates: {
          title: previousTaskData.title,
          description: previousTaskData.description || undefined,
          status: previousTaskData.status,
          priority: previousTaskData.priority,
          position: previousTaskData.position,
          customFields: previousTaskData.customFields
        },
        isUndoOperation: true
      })).unwrap();
      
      console.log('✅ Task update undone');
    }
  };
};

// DELETE TASK COMMAND
export const deleteTaskCommand = (data: DeleteTaskData): UndoableCommand => {
  let deletedTaskData: Task | null = null;

  return {
    type: 'DELETE_TASK',
    description: `Delete task`,
    
    execute: async (dispatch, getState) => {
      console.log('🎯 Executing: Delete task', data.taskId);
      
      // Store task data before deleting
      const state = getState();
      const taskToDelete = state.tasks.present.items.find((t: Task) => t.id === data.taskId);
      if (taskToDelete) {
        deletedTaskData = { ...taskToDelete };
      }
      
      await dispatch(deleteTaskAsync({
        projectId: data.projectId,
        taskId: data.taskId,
        isUndoOperation: false
      })).unwrap();
      
      console.log('✅ Task deleted');
    },
    
    undo: async (dispatch, getState) => {
      if (!deletedTaskData) {
        throw new Error('Cannot undo: No deleted task data stored');
      }
      
      console.log('↩️ Undoing: Recreate deleted task', deletedTaskData.id);
      
      await dispatch(createTaskAsync({
        projectId: data.projectId,
        title: deletedTaskData.title,
        description: deletedTaskData.description || undefined,
        status: deletedTaskData.status,
        priority: deletedTaskData.priority,
        position: deletedTaskData.position,
        customFields: deletedTaskData.customFields,
        taskId: deletedTaskData.id, // Preserve original ID
        isUndoOperation: true
      })).unwrap();
      
      console.log('✅ Task deletion undone');
    }
  };
};

// Export all commands
export const taskCommands = {
  createTask: createTaskCommand,
  updateTask: updateTaskCommand,
  deleteTask: deleteTaskCommand
};
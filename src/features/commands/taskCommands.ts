// src/features/commands/taskCommands.ts
import { UndoableCommand } from './types/commandTypes';
import {
  createTaskAsync,
  updateTaskAsync,
  deleteTaskAsync,
  deleteTasksAsync,
  bulkUpdateTasksAsync,
  updateTaskPriorityAsync,
  reorderTasksAsync,
  optimisticUpdateTaskPriority,
  optimisticReorderTasks,
  revertOptimisticUpdate,
  revertOptimisticReorder
} from '../tasks/store/tasksSlice'; import { Task, TaskStatus, TaskPriority } from '../../types';
import { AppDispatch } from '../../app/store';
import { showConflictResolution } from '../tasks/hooks/useConflictResolution';


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

interface BulkDeleteTasksData {
  projectId: string;
  taskIds: string[];
}

interface UpdateTaskPriorityData {
  projectId: string;
  taskId: string;
  priority: TaskPriority;
  destinationIndex?: number;
}

interface ReorderTasksData {
  projectId: string;
  priority: TaskPriority;
  taskIds: string[];
}

interface BulkUpdateTasksData {
  projectId: string;
  taskIds: string[];
  updates: Partial<Pick<Task, 'status' | 'priority'>>;
}

// CREATE TASK COMMAND
export const createTaskCommand = (data: CreateTaskData): UndoableCommand => {
  let createdTaskId: string | null = null;

  return {
    type: 'CREATE_TASK',
    description: `Create task: ${data.title}`,

    execute: async (dispatch: AppDispatch, getState) => {
      ////console.log('🎯 Executing: Create task', data.title);

      // Clean API call - no isUndoOperation flag needed anymore
      const result = await dispatch(createTaskAsync({
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status || 'not started',
        priority: data.priority || 'low',
        position: data.position,
        customFields: data.customFields || {}
      })).unwrap();

      createdTaskId = result.id;
      ////console.log('✅ Task created with ID:', createdTaskId);
    },

    undo: async (dispatch: AppDispatch, getState) => {
      if (!createdTaskId) {
        throw new Error('Cannot undo: No task ID stored');
      }

      ////console.log('↩️ Undoing: Delete created task', createdTaskId);

      // Clean API call - no isUndoOperation flag needed
      await dispatch(deleteTaskAsync({
        projectId: data.projectId,
        taskId: createdTaskId
      })).unwrap();

      ////console.log('✅ Task creation undone');
    }
  };
};

// UPDATE TASK COMMAND
export const updateTaskCommand = (data: UpdateTaskData): UndoableCommand => {
  let previousTaskData: Task | null = null;

  return {
    type: 'UPDATE_TASK',
    description: `Update task`,

    execute: async (dispatch: AppDispatch, getState) => {
      console.log('🎯 Executing: Update task', data.taskId);

      // Store current task data before updating
      const state = getState();
      const currentTask = state.tasks.items.find((t: Task) => t.id === data.taskId);
      if (currentTask) {
        previousTaskData = { ...currentTask };
      }

      // 🆕 NEW: Attempt update with version information
      const attemptUpdate = async (retryWithVersion?: number): Promise<void> => {
        try {
          await dispatch(updateTaskAsync({
            projectId: data.projectId,
            taskId: data.taskId,
            updates: data.updates,
            // 🆕 NEW: Pass current version for conflict detection
            version: retryWithVersion || currentTask?.version
          })).unwrap();

          console.log('✅ Task updated');
        } catch (error: any) {
          // 🆕 NEW: Handle version conflicts
          if (error.type === 'VERSION_CONFLICT') {
            console.log('⚠️ Version conflict detected, showing resolution modal');
            
            const result = await showConflictResolution(error.conflict, data.updates);
            
            if (result.resolution === 'keep_mine') {
              // Force update with current version (overwrite their changes)
              await dispatch(updateTaskAsync({
                projectId: data.projectId,
                taskId: data.taskId,
                updates: data.updates,
                version: error.conflict.currentVersion // Use their current version
              })).unwrap();
              
              console.log('✅ Task updated (kept user changes)');
            } else if (result.resolution === 'take_theirs') {
              // Don't update, just refresh our local state with their version
              console.log('✅ Conflict resolved (took their changes)');
              // The task is already updated with their version in Redux
            } else {
              // User cancelled
              throw new Error('Update cancelled by user');
            }
          } else {
            // Re-throw other errors
            throw error;
          }
        }
      };

      await attemptUpdate();
    },

    undo: async (dispatch: AppDispatch, getState) => {
      if (!previousTaskData) {
        throw new Error('Cannot undo: No previous task data stored');
      }

      console.log('↩️ Undoing: Restore previous task data', data.taskId);

      // For undo, we'll force the update (assuming undo should always work)
      const currentState = getState();
      const currentTask = currentState.tasks.items.find((t: Task) => t.id === data.taskId);
      
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
        version: currentTask?.version // Use current version for undo
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

    execute: async (dispatch: AppDispatch, getState) => {
      //console.log('🎯 Executing: Delete task', data.taskId);

      // Store task data before deleting
      const state = getState();
      // Note: Updated to use the new state structure (no .present)
      const taskToDelete = state.tasks.items.find((t: Task) => t.id === data.taskId);
      if (taskToDelete) {
        deletedTaskData = { ...taskToDelete };
      }

      // Clean API call - no isUndoOperation flag needed
      await dispatch(deleteTaskAsync({
        projectId: data.projectId,
        taskId: data.taskId
      })).unwrap();

      //console.log('✅ Task deleted');
    },

    undo: async (dispatch: AppDispatch, getState) => {
      if (!deletedTaskData) {
        throw new Error('Cannot undo: No deleted task data stored');
      }

      //console.log('↩️ Undoing: Recreate deleted task', deletedTaskData.id);

      // Recreate the task with its original ID and all properties
      await dispatch(createTaskAsync({
        projectId: data.projectId,
        title: deletedTaskData.title,
        description: deletedTaskData.description || undefined,
        status: deletedTaskData.status,
        priority: deletedTaskData.priority,
        position: deletedTaskData.position,
        customFields: deletedTaskData.customFields,
        taskId: deletedTaskData.id // Preserve original ID
      })).unwrap();

      //console.log('✅ Task deletion undone');
    }
  };
};


export const bulkDeleteTasksCommand = (data: BulkDeleteTasksData): UndoableCommand => {
  let deletedTasksData: Task[] = [];

  return {
    type: 'BULK_DELETE_TASKS',
    description: `Delete ${data.taskIds.length} tasks`,

    execute: async (dispatch: AppDispatch, getState) => {
      //console.log('🎯 Executing: Bulk delete tasks', data.taskIds.length, 'tasks');

      // Capture all task data before deleting for undo functionality
      const state = getState();
      const tasksToDelete = state.tasks.items.filter((t: Task) => data.taskIds.includes(t.id));

      if (tasksToDelete.length === 0) {
        throw new Error('No tasks found for deletion');
      }

      // Store all deleted tasks data
      deletedTasksData = tasksToDelete.map(task => ({ ...task }));
      //console.log('📝 Stored', deletedTasksData.length, 'deleted tasks data');

      // Execute the bulk deletion
      await dispatch(deleteTasksAsync({
        projectId: data.projectId,
        taskIds: data.taskIds
      })).unwrap();

      //console.log('✅ Bulk delete completed');
    },

    undo: async (dispatch: AppDispatch, getState) => {
      if (deletedTasksData.length === 0) {
        throw new Error('Cannot undo: No deleted tasks data stored');
      }

      //console.log('↩️ Undoing: Recreate', deletedTasksData.length, 'deleted tasks');

      // Recreate all deleted tasks with their original IDs and properties
      for (const taskData of deletedTasksData) {
        await dispatch(createTaskAsync({
          projectId: data.projectId,
          title: taskData.title,
          description: taskData.description || undefined,
          status: taskData.status,
          priority: taskData.priority,
          position: taskData.position,
          customFields: taskData.customFields,
          taskId: taskData.id // Preserve original ID
        })).unwrap();
      }

      //console.log('✅ Bulk delete undone - all tasks recreated');
    }
  };
};


export const updateTaskPriorityCommand = (data: UpdateTaskPriorityData): UndoableCommand => {
  let previousTaskData: Task | null = null;
  let hasOptimisticUpdate = false;

  return {
    type: 'UPDATE_TASK_PRIORITY',
    description: `Move task to ${data.priority} priority`,

    execute: async (dispatch: AppDispatch, getState) => {
      console.log('🎯 Executing: Update task priority', data.taskId, 'to', data.priority);

      // 1. Capture the current state before making changes
      const state = getState();
      const currentTask = state.tasks.items.find((t: Task) => t.id === data.taskId);

      if (currentTask) {
        previousTaskData = { ...currentTask };

        // 2. Apply optimistic update immediately for smooth UX
        dispatch(optimisticUpdateTaskPriority({
          taskId: data.taskId,
          priority: data.priority,
          destinationIndex: data.destinationIndex
        }));
        hasOptimisticUpdate = true;

        // 🆕 NEW: Attempt update with conflict resolution
        const attemptUpdate = async (): Promise<void> => {
          try {
            await dispatch(updateTaskPriorityAsync({
              projectId: data.projectId,
              taskId: data.taskId,
              priority: data.priority,
              destinationIndex: data.destinationIndex,
              version: currentTask.version // Pass current version
            })).unwrap();

            console.log('✅ Task priority updated');
          } catch (error: any) {
            // Handle version conflicts
            if (error.type === 'VERSION_CONFLICT') {
              console.log('⚠️ Priority update conflict detected');
              
              const result = await showConflictResolution(
                error.conflict, 
                { priority: data.priority }
              );
              
              if (result.resolution === 'keep_mine') {
                // Force update with current version
                await dispatch(updateTaskPriorityAsync({
                  projectId: data.projectId,
                  taskId: data.taskId,
                  priority: data.priority,
                  destinationIndex: data.destinationIndex,
                  version: error.conflict.currentVersion
                })).unwrap();
                
                console.log('✅ Task priority updated (kept user changes)');
              } else if (result.resolution === 'take_theirs') {
                // Revert optimistic update and use their changes
                if (hasOptimisticUpdate && previousTaskData) {
                  dispatch(revertOptimisticUpdate({
                    taskId: data.taskId,
                    originalTask: previousTaskData
                  }));
                }
                console.log('✅ Priority conflict resolved (took their changes)');
              } else {
                // User cancelled - revert optimistic update
                if (hasOptimisticUpdate && previousTaskData) {
                  dispatch(revertOptimisticUpdate({
                    taskId: data.taskId,
                    originalTask: previousTaskData
                  }));
                }
                throw new Error('Priority update cancelled by user');
              }
            } else {
              // Revert optimistic update on other failures
              if (hasOptimisticUpdate && previousTaskData) {
                dispatch(revertOptimisticUpdate({
                  taskId: data.taskId,
                  originalTask: previousTaskData
                }));
              }
              throw error;
            }
          }
        };

        await attemptUpdate();
      }
    },

    undo: async (dispatch: AppDispatch, getState) => {
      if (!previousTaskData) {
        throw new Error('Cannot undo: No previous task data stored');
      }

      console.log('↩️ Undoing: Restore task priority', data.taskId, 'to', previousTaskData.priority);

      // Apply optimistic update immediately
      dispatch(optimisticUpdateTaskPriority({
        taskId: data.taskId,
        priority: previousTaskData.priority,
        destinationIndex: previousTaskData.position
      }));

      try {
        const currentState = getState();
        const currentTask = currentState.tasks.items.find((t: Task) => t.id === data.taskId);
        
        // Execute the actual API call with current version
        await dispatch(updateTaskPriorityAsync({
          projectId: data.projectId,
          taskId: data.taskId,
          priority: previousTaskData.priority,
          destinationIndex: previousTaskData.position,
          version: currentTask?.version
        })).unwrap();

        console.log('✅ Task priority update undone');

      } catch (error) {
        // On failure, revert back to the current state
        const currentState = getState();
        const currentTask = currentState.tasks.items.find((t: Task) => t.id === data.taskId);
        if (currentTask) {
          dispatch(revertOptimisticUpdate({
            taskId: data.taskId,
            originalTask: currentTask
          }));
        }
        throw error;
      }
    }
  };
};

// UPDATED: REORDER TASKS COMMAND with optimistic updates
export const reorderTasksCommand = (data: ReorderTasksData): UndoableCommand => {
  let previousTasksOrder: string[] = [];
  let originalTasks: Task[] = [];

  return {
    type: 'REORDER_TASKS',
    description: `Reorder tasks in ${data.priority} priority`,

    execute: async (dispatch: AppDispatch, getState) => {
      //console.log('🎯 Executing: Reorder tasks in priority', data.priority);

      // 1. Capture the current state before making changes
      const state = getState();
      const currentTasks = state.tasks.items
        .filter((t: Task) => t.priority === data.priority && t.projectId === data.projectId)
        .sort((a: Task, b: Task) => (a.position || 0) - (b.position || 0));

      previousTasksOrder = currentTasks.map(t => t.id);
      originalTasks = currentTasks.map(t => ({ ...t })); // Deep copy

      //console.log('📝 Previous order:', previousTasksOrder);
      //console.log('📝 New order:', data.taskIds);

      // 2. Apply optimistic update immediately
      dispatch(optimisticReorderTasks({
        priority: data.priority,
        taskIds: data.taskIds
      }));

      try {
        // 3. Execute the actual API call
        await dispatch(reorderTasksAsync({
          projectId: data.projectId,
          priority: data.priority,
          taskIds: data.taskIds
        })).unwrap();

        //console.log('✅ Tasks reordered');

      } catch (error) {
        // 4. Revert optimistic update on failure
        dispatch(revertOptimisticReorder({
          originalTasks: originalTasks
        }));
        throw error;
      }
    },

    undo: async (dispatch: AppDispatch, getState) => {
      if (previousTasksOrder.length === 0) {
        throw new Error('Cannot undo: No previous order stored');
      }

      //console.log('↩️ Undoing: Restore task order in priority', data.priority);
      //console.log('📝 Restoring order:', previousTasksOrder);

      // Apply optimistic update immediately
      dispatch(optimisticReorderTasks({
        priority: data.priority,
        taskIds: previousTasksOrder
      }));

      try {
        // Execute the actual API call
        await dispatch(reorderTasksAsync({
          projectId: data.projectId,
          priority: data.priority,
          taskIds: previousTasksOrder
        })).unwrap();

        //console.log('✅ Task reorder undone');

      } catch (error) {
        // On failure, revert back to current state
        dispatch(revertOptimisticReorder({
          originalTasks: originalTasks
        }));
        throw error;
      }
    }
  };
};


export const bulkUpdateTasksCommand = (data: BulkUpdateTasksData): UndoableCommand => {
  let previousTasksData: Array<{ id: string; originalData: Pick<Task, 'status' | 'priority'> }> = [];

  return {
    type: 'BULK_UPDATE_TASKS',
    description: `Bulk update ${data.taskIds.length} tasks`,
    
    execute: async (dispatch: AppDispatch, getState) => {
      //console.log('🎯 Executing: Bulk update tasks', data.taskIds.length, 'tasks');
      
      // Capture the original state of all tasks being updated
      const state = getState();
      const tasksToUpdate = state.tasks.items.filter((t: Task) => data.taskIds.includes(t.id));
      
      if (tasksToUpdate.length === 0) {
        throw new Error('No tasks found for bulk update');
      }
      
      // Store original data for undo
      previousTasksData = tasksToUpdate.map(task => ({
        id: task.id,
        originalData: {
          status: task.status,
          priority: task.priority
        }
      }));
      
      //console.log('📝 Stored original data for', previousTasksData.length, 'tasks');
      
      // Execute the bulk update
      await dispatch(bulkUpdateTasksAsync({
        projectId: data.projectId,
        taskIds: data.taskIds,
        updates: data.updates
      })).unwrap();
      
      //console.log('✅ Bulk update completed');
    },
    
    undo: async (dispatch: AppDispatch, getState) => {
      if (previousTasksData.length === 0) {
        throw new Error('Cannot undo: No previous task data stored');
      }
      
      //console.log('↩️ Undoing: Restore original data for', previousTasksData.length, 'tasks');
      
      // Restore each task's original status/priority
      for (const taskData of previousTasksData) {
        await dispatch(bulkUpdateTasksAsync({
          projectId: data.projectId,
          taskIds: [taskData.id],
          updates: taskData.originalData
        })).unwrap();
      }
      
      //console.log('✅ Bulk update undone - all tasks restored');
    }
  };
};

// Export all commands
export const taskCommands = {
  createTask: createTaskCommand,
  updateTask: updateTaskCommand,
  deleteTask: deleteTaskCommand,
  bulkDeleteTasks: bulkDeleteTasksCommand, 
  bulkUpdateTasks: bulkUpdateTasksCommand,
  updateTaskPriority: updateTaskPriorityCommand,
  reorderTasks: reorderTasksCommand
};
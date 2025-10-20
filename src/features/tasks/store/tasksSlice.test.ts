// src/features/tasks/store/tasksSlice.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer, {
  clearTasks,
  optimisticUpdateTaskPriority,
  optimisticUpdateTaskStatus,
  optimisticReorderTasks,
  optimisticReorderTasksByStatus,
  revertOptimisticUpdate,
  revertOptimisticReorder,
  fetchTasks,
  createTaskAsync,
  updateTaskAsync,
  deleteTaskAsync,
  deleteTasksAsync,
  updateTaskPriorityAsync,
  updateTaskStatusAsync,
  bulkUpdateTasksAsync,
  reorderTasksAsync,
  reorderTasksByStatusAsync,
} from './tasksSlice';
import { createMockTask } from '../../../test/utils/testUtils';
import taskService from '../services/taskService';
import { Task } from '../../../types';

// Mock the task service
vi.mock('../services/taskService');

describe('tasksSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        tasks: tasksReducer,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().tasks;

      expect(state).toEqual({
        items: [],
        isLoading: false,
        error: null,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
      });
    });
  });

  describe('clearTasks reducer', () => {
    it('should clear all tasks', () => {
      // Add some tasks first
      const initialState = {
        items: [createMockTask(), createMockTask({ id: 'task-2' })],
        isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
        error: null,
      };

      const newState = tasksReducer(initialState, clearTasks());

      expect(newState.items).toEqual([]);
    });
  });

  describe('optimisticUpdateTaskPriority reducer', () => {
    it('should update task priority immediately', () => {
      const task = createMockTask({ id: 'task-1', priority: 'low' });
      const initialState = {
        items: [task],
        isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
        error: null,
      };

      const newState = tasksReducer(
        initialState,
        optimisticUpdateTaskPriority({
          taskId: 'task-1',
          priority: 'high',
          destinationIndex: 5,
        })
      );

      expect(newState.items[0].priority).toBe('high');
      expect(newState.items[0].position).toBe(5);
    });

    it('should not update if task not found', () => {
      const task = createMockTask({ id: 'task-1' });
      const initialState = {
        items: [task],
        isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
        error: null,
      };

      const newState = tasksReducer(
        initialState,
        optimisticUpdateTaskPriority({
          taskId: 'non-existent',
          priority: 'high',
        })
      );

      expect(newState.items[0]).toEqual(task);
    });
  });

  describe('optimisticUpdateTaskStatus reducer', () => {
    it('should update task status immediately', () => {
      const task = createMockTask({ id: 'task-1', status: 'not started' });
      const initialState = {
        items: [task],
        isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
        error: null,
      };

      const newState = tasksReducer(
        initialState,
        optimisticUpdateTaskStatus({
          taskId: 'task-1',
          status: 'completed',
          destinationIndex: 3,
        })
      );

      expect(newState.items[0].status).toBe('completed');
      expect(newState.items[0].position).toBe(3);
    });
  });

  describe('optimisticReorderTasks reducer', () => {
    it('should reorder tasks with new positions', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: 'high', position: 0 }),
        createMockTask({ id: 'task-2', priority: 'high', position: 1 }),
        createMockTask({ id: 'task-3', priority: 'high', position: 2 }),
      ];
      const initialState = {
        items: tasks,
        isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
        error: null,
      };

      const newState = tasksReducer(
        initialState,
        optimisticReorderTasks({
          priority: 'high',
          taskIds: ['task-3', 'task-1', 'task-2'],
        })
      );

      expect(newState.items.find(t => t.id === 'task-3')?.position).toBe(0);
      expect(newState.items.find(t => t.id === 'task-1')?.position).toBe(1);
      expect(newState.items.find(t => t.id === 'task-2')?.position).toBe(2);
    });
  });

  describe('optimisticReorderTasksByStatus reducer', () => {
    it('should reorder tasks by status with new statusPositions', () => {
      const tasks = [
        createMockTask({ id: 'task-1', status: 'in progress', statusPosition: 0 }),
        createMockTask({ id: 'task-2', status: 'in progress', statusPosition: 1 }),
        createMockTask({ id: 'task-3', status: 'in progress', statusPosition: 2 }),
      ];
      const initialState = {
        items: tasks,
        isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
        error: null,
      };

      const newState = tasksReducer(
        initialState,
        optimisticReorderTasksByStatus({
          status: 'in progress',
          taskIds: ['task-2', 'task-3', 'task-1'],
        })
      );

      expect(newState.items.find(t => t.id === 'task-2')?.statusPosition).toBe(0);
      expect(newState.items.find(t => t.id === 'task-3')?.statusPosition).toBe(1);
      expect(newState.items.find(t => t.id === 'task-1')?.statusPosition).toBe(2);
    });
  });

  describe('revertOptimisticUpdate reducer', () => {
    it('should revert task to original state', () => {
      const originalTask = createMockTask({ id: 'task-1', priority: 'low' });
      const modifiedTask = { ...originalTask, priority: 'high' as const };
      const initialState = {
        items: [modifiedTask],
        isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
        error: null,
      };

      const newState = tasksReducer(
        initialState,
        revertOptimisticUpdate({
          taskId: 'task-1',
          originalTask,
        })
      );

      expect(newState.items[0].priority).toBe('low');
    });
  });

  describe('revertOptimisticReorder reducer', () => {
    it('should revert multiple tasks to original state', () => {
      const originalTasks = [
        createMockTask({ id: 'task-1', position: 0 }),
        createMockTask({ id: 'task-2', position: 1 }),
      ];
      const modifiedTasks = [
        { ...originalTasks[0], position: 5 },
        { ...originalTasks[1], position: 6 },
      ];
      const initialState = {
        items: modifiedTasks,
        isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
        error: null,
      };

      const newState = tasksReducer(
        initialState,
        revertOptimisticReorder({
          originalTasks,
        })
      );

      expect(newState.items[0].position).toBe(0);
      expect(newState.items[1].position).toBe(1);
    });
  });

  describe('fetchTasks async thunk', () => {
    it('should set loading state when pending', () => {
      const action = { type: fetchTasks.pending.type };
      const state = tasksReducer(undefined, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should set tasks when fulfilled', async () => {
      const mockTasks = [createMockTask(), createMockTask({ id: 'task-2' })];
      vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks);

      await store.dispatch(fetchTasks('project-1'));
      const state = store.getState().tasks;

      expect(state.isLoading).toBe(false);
      expect(state.items).toEqual(mockTasks);
      expect(state.error).toBe(null);
    });

    it('should set error when rejected', async () => {
      const errorMessage = 'Failed to fetch tasks';
      vi.mocked(taskService.getTasks).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await store.dispatch(fetchTasks('project-1'));
      const state = store.getState().tasks;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('createTaskAsync thunk', () => {
    it('should add new task when fulfilled', async () => {
      const newTask = createMockTask({ id: 'new-task', title: 'New Task' });
      vi.mocked(taskService.createTask).mockResolvedValue(newTask);

      await store.dispatch(
        createTaskAsync({
          projectId: 'project-1',
          title: 'New Task',
        })
      );

      const state = store.getState().tasks;
      expect(state.items).toContainEqual(newTask);
    });

    it('should calculate position for new task', async () => {
      const existingTasks = [
        createMockTask({ id: 'task-1', projectId: 'project-1', priority: 'high', position: 0 }),
        createMockTask({ id: 'task-2', projectId: 'project-1', priority: 'high', position: 1 }),
      ];

      const newTask = createMockTask({ id: 'new-task', priority: 'high', position: 2 });
      vi.mocked(taskService.createTask).mockResolvedValue(newTask);

      const storeWithTasks = configureStore({
        reducer: {
          tasks: tasksReducer,
        },
        preloadedState: {
          tasks: {
            items: existingTasks,
            isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
            error: null,
          },
        },
      });

      await storeWithTasks.dispatch(
        createTaskAsync({
          projectId: 'project-1',
          title: 'New Task',
          priority: 'high',
        })
      );

      // The thunk calculates position based on existing tasks with same priority
      // Since we have tasks at positions 0 and 1, the next should be 2
      const callArg = vi.mocked(taskService.createTask).mock.calls[0][0];
      expect(callArg.position).toBe(2);
    });
  });

  describe('updateTaskAsync thunk', () => {
    it('should update existing task when fulfilled', async () => {
      const existingTask = createMockTask({ id: 'task-1', title: 'Old Title' });
      const updatedTask = { ...existingTask, title: 'New Title', version: 2 };
      vi.mocked(taskService.updateTask).mockResolvedValue(updatedTask);

      const storeWithTasks = configureStore({
        reducer: {
          tasks: tasksReducer,
        },
        preloadedState: {
          tasks: {
            items: [existingTask],
            isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
            error: null,
          },
        },
      });

      await storeWithTasks.dispatch(
        updateTaskAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          updates: { title: 'New Title' },
        })
      );

      const state = storeWithTasks.getState().tasks;
      expect(state.items[0].title).toBe('New Title');
    });

    it('should handle version conflict error', async () => {
      vi.mocked(taskService.updateTask).mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: 'VERSION_CONFLICT',
            conflict: {
              taskId: 'task-1',
              expectedVersion: 1,
              currentVersion: 2,
            },
            message: 'Version conflict',
          },
        },
      });

      await store.dispatch(
        updateTaskAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          updates: { title: 'New Title' },
        })
      );

      const state = store.getState().tasks;
      // The error is returned from rejectWithValue as an object in this case
      expect(state.error).toBeTruthy();
    });
  });

  describe('deleteTaskAsync thunk', () => {
    it('should remove task when fulfilled', async () => {
      const task1 = createMockTask({ id: 'task-1' });
      const task2 = createMockTask({ id: 'task-2' });

      vi.mocked(taskService.deleteTask).mockResolvedValue(undefined);

      const storeWithTasks = configureStore({
        reducer: {
          tasks: tasksReducer,
        },
        preloadedState: {
          tasks: {
            items: [task1, task2],
            isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
            error: null,
          },
        },
      });

      await storeWithTasks.dispatch(
        deleteTaskAsync({
          projectId: 'project-1',
          taskId: 'task-1',
        })
      );

      const state = storeWithTasks.getState().tasks;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('task-2');
    });
  });

  describe('deleteTasksAsync thunk', () => {
    it('should remove multiple tasks when fulfilled', async () => {
      const tasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
        createMockTask({ id: 'task-3' }),
      ];

      vi.mocked(taskService.deleteTasks).mockResolvedValue(undefined);

      const storeWithTasks = configureStore({
        reducer: {
          tasks: tasksReducer,
        },
        preloadedState: {
          tasks: {
            items: tasks,
            isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
            error: null,
          },
        },
      });

      await storeWithTasks.dispatch(
        deleteTasksAsync({
          projectId: 'project-1',
          taskIds: ['task-1', 'task-3'],
        })
      );

      const state = storeWithTasks.getState().tasks;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('task-2');
    });
  });

  describe('bulkUpdateTasksAsync thunk', () => {
    it('should update multiple tasks when fulfilled', async () => {
      const tasks = [
        createMockTask({ id: 'task-1', status: 'not started' }),
        createMockTask({ id: 'task-2', status: 'not started' }),
        createMockTask({ id: 'task-3', status: 'not started' }),
      ];

      vi.mocked(taskService.bulkUpdateTasks).mockResolvedValue(undefined);

      const storeWithTasks = configureStore({
        reducer: {
          tasks: tasksReducer,
        },
        preloadedState: {
          tasks: {
            items: tasks,
            isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
            error: null,
          },
        },
      });

      await storeWithTasks.dispatch(
        bulkUpdateTasksAsync({
          projectId: 'project-1',
          taskIds: ['task-1', 'task-2'],
          updates: { status: 'completed' },
        })
      );

      const state = storeWithTasks.getState().tasks;
      expect(state.items[0].status).toBe('completed');
      expect(state.items[1].status).toBe('completed');
      expect(state.items[2].status).toBe('not started'); // Not updated
    });
  });

  describe('updateTaskPriorityAsync thunk', () => {
    it('should update task priority when fulfilled', async () => {
      const task = createMockTask({ id: 'task-1', priority: 'low' });
      const updatedTask = { ...task, priority: 'high' as const, version: 2 };
      vi.mocked(taskService.updateTaskPriority).mockResolvedValue(updatedTask);

      const storeWithTasks = configureStore({
        reducer: {
          tasks: tasksReducer,
        },
        preloadedState: {
          tasks: {
            items: [task],
            isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
            error: null,
          },
        },
      });

      await storeWithTasks.dispatch(
        updateTaskPriorityAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          priority: 'high',
        })
      );

      const state = storeWithTasks.getState().tasks;
      expect(state.items[0].priority).toBe('high');
    });
  });

  describe('updateTaskStatusAsync thunk', () => {
    it('should update task status when fulfilled', async () => {
      const task = createMockTask({ id: 'task-1', status: 'not started' });
      const updatedTask = { ...task, status: 'completed' as const, version: 2 };
      vi.mocked(taskService.updateTaskStatus).mockResolvedValue(updatedTask);

      const storeWithTasks = configureStore({
        reducer: {
          tasks: tasksReducer,
        },
        preloadedState: {
          tasks: {
            items: [task],
            isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
            error: null,
          },
        },
      });

      await storeWithTasks.dispatch(
        updateTaskStatusAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          status: 'completed',
        })
      );

      const state = storeWithTasks.getState().tasks;
      expect(state.items[0].status).toBe('completed');
    });
  });

  describe('reorderTasksAsync thunk', () => {
    it('should reorder tasks when fulfilled', async () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: 'high', position: 0 }),
        createMockTask({ id: 'task-2', priority: 'high', position: 1 }),
        createMockTask({ id: 'task-3', priority: 'high', position: 2 }),
      ];

      vi.mocked(taskService.reorderTasks).mockResolvedValue(undefined);

      const storeWithTasks = configureStore({
        reducer: {
          tasks: tasksReducer,
        },
        preloadedState: {
          tasks: {
            items: tasks,
            isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
            error: null,
          },
        },
      });

      await storeWithTasks.dispatch(
        reorderTasksAsync({
          projectId: 'project-1',
          priority: 'high',
          taskIds: ['task-3', 'task-1', 'task-2'],
        })
      );

      const state = storeWithTasks.getState().tasks;
      expect(state.items.find(t => t.id === 'task-3')?.position).toBe(0);
      expect(state.items.find(t => t.id === 'task-1')?.position).toBe(1);
      expect(state.items.find(t => t.id === 'task-2')?.position).toBe(2);
    });
  });

  describe('reorderTasksByStatusAsync thunk', () => {
    it('should reorder tasks by status when fulfilled', async () => {
      const tasks = [
        createMockTask({ id: 'task-1', status: 'in progress', statusPosition: 0 }),
        createMockTask({ id: 'task-2', status: 'in progress', statusPosition: 1 }),
      ];

      vi.mocked(taskService.reorderTasksByStatus).mockResolvedValue(undefined);

      const storeWithTasks = configureStore({
        reducer: {
          tasks: tasksReducer,
        },
        preloadedState: {
          tasks: {
            items: tasks,
            isLoading: false,
        urgentTasks: [],
        isLoadingUrgentTasks: false,
        urgentTasksError: null,
            error: null,
          },
        },
      });

      await storeWithTasks.dispatch(
        reorderTasksByStatusAsync({
          projectId: 'project-1',
          status: 'in progress',
          taskIds: ['task-2', 'task-1'],
        })
      );

      const state = storeWithTasks.getState().tasks;
      expect(state.items.find(t => t.id === 'task-2')?.statusPosition).toBe(0);
      expect(state.items.find(t => t.id === 'task-1')?.statusPosition).toBe(1);
    });
  });
});

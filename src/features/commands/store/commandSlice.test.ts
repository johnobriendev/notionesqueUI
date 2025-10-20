// src/features/commands/store/commandSlice.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import commandsReducer, {
  clearHistory,
  clearRedoStack,
  executeCommand,
  undoLastCommand,
  redoLastCommand,
} from './commandSlice';
import { UndoableCommand } from '../types/commandTypes';
import type { RootState } from '../../../app/store';

describe('commandSlice', () => {
  let store: ReturnType<typeof configureStore>;

  const createMockCommand = (
    description: string,
    executeFn?: () => Promise<void>,
    undoFn?: () => Promise<void>
  ): UndoableCommand => {
    return {
      type: 'mock-command',
      description,
      execute: vi.fn(executeFn || (() => Promise.resolve())),
      undo: vi.fn(undoFn || (() => Promise.resolve())),
    };
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        commands: commandsReducer,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().commands;

      expect(state).toEqual({
        undoStack: [],
        redoStack: [],
        isExecuting: false,
      });
    });
  });

  describe('clearHistory reducer', () => {
    it('should clear both undo and redo stacks', () => {
      const command1 = createMockCommand('Command 1');
      const command2 = createMockCommand('Command 2');

      const storeWithHistory = configureStore({
        reducer: {
          commands: commandsReducer,
        },
        preloadedState: {
          commands: {
            undoStack: [command1],
            redoStack: [command2],
            isExecuting: false,
          },
        },
      });

      storeWithHistory.dispatch(clearHistory());

      const state = storeWithHistory.getState().commands;
      expect(state.undoStack).toEqual([]);
      expect(state.redoStack).toEqual([]);
    });
  });

  describe('clearRedoStack reducer', () => {
    it('should clear only redo stack', () => {
      const command1 = createMockCommand('Command 1');
      const command2 = createMockCommand('Command 2');

      const storeWithHistory = configureStore({
        reducer: {
          commands: commandsReducer,
        },
        preloadedState: {
          commands: {
            undoStack: [command1],
            redoStack: [command2],
            isExecuting: false,
          },
        },
      });

      storeWithHistory.dispatch(clearRedoStack());

      const state = storeWithHistory.getState().commands;
      expect(state.undoStack).toEqual([command1]);
      expect(state.redoStack).toEqual([]);
    });
  });

  describe('executeCommand async thunk', () => {
    it('should set executing state when pending', () => {
      const action = { type: executeCommand.pending.type };
      const state = commandsReducer(undefined, action);

      expect(state.isExecuting).toBe(true);
    });

    it('should add command to undo stack when fulfilled', async () => {
      const command = createMockCommand('Test Command');

      await store.dispatch(executeCommand(command));

      const state = store.getState().commands;
      expect(state.isExecuting).toBe(false);
      expect(state.undoStack).toHaveLength(1);
      expect(state.undoStack[0].description).toBe('Test Command');
      expect(command.execute).toHaveBeenCalledTimes(1);
    });

    it('should clear redo stack when new command is executed', async () => {
      const command1 = createMockCommand('Command 1');
      const command2 = createMockCommand('Command 2');
      const command3 = createMockCommand('Command 3');

      const storeWithHistory = configureStore({
        reducer: {
          commands: commandsReducer,
        },
        preloadedState: {
          commands: {
            undoStack: [command1],
            redoStack: [command2],
            isExecuting: false,
          },
        },
      });

      await storeWithHistory.dispatch(executeCommand(command3));

      const state = storeWithHistory.getState().commands;
      expect(state.undoStack).toHaveLength(2);
      expect(state.redoStack).toEqual([]);
    });

    it('should handle execution failure', async () => {
      const failingCommand = createMockCommand(
        'Failing Command',
        () => Promise.reject(new Error('Execution failed'))
      );

      await store.dispatch(executeCommand(failingCommand));

      const state = store.getState().commands;
      expect(state.isExecuting).toBe(false);
      expect(state.undoStack).toHaveLength(0);
    });
  });

  describe('undoLastCommand async thunk', () => {
    it('should set executing state when pending', () => {
      const action = { type: undoLastCommand.pending.type };
      const state = commandsReducer(undefined, action);

      expect(state.isExecuting).toBe(true);
    });

    it('should move command from undo to redo stack when fulfilled', async () => {
      const command = createMockCommand('Test Command');

      const storeWithHistory = configureStore({
        reducer: {
          commands: commandsReducer,
        },
        preloadedState: {
          commands: {
            undoStack: [command],
            redoStack: [],
            isExecuting: false,
          },
        },
      });

      await storeWithHistory.dispatch(undoLastCommand());

      const state = storeWithHistory.getState().commands;
      expect(state.isExecuting).toBe(false);
      expect(state.undoStack).toHaveLength(0);
      expect(state.redoStack).toHaveLength(1);
      expect(state.redoStack[0].description).toBe('Test Command');
      expect(command.undo).toHaveBeenCalledTimes(1);
    });

    it('should reject when undo stack is empty', async () => {
      const result = await store.dispatch(undoLastCommand());

      expect(result.type).toBe(undoLastCommand.rejected.type);
      expect(result.payload).toBe('No commands to undo');
    });

    it('should handle undo failure', async () => {
      const failingCommand = createMockCommand(
        'Failing Command',
        undefined,
        () => Promise.reject(new Error('Undo failed'))
      );

      const storeWithHistory = configureStore({
        reducer: {
          commands: commandsReducer,
        },
        preloadedState: {
          commands: {
            undoStack: [failingCommand],
            redoStack: [],
            isExecuting: false,
          },
        },
      });

      await storeWithHistory.dispatch(undoLastCommand());

      const state = storeWithHistory.getState().commands;
      expect(state.isExecuting).toBe(false);
      // Command should not be moved on failure
      expect(state.undoStack).toHaveLength(1);
      expect(state.redoStack).toHaveLength(0);
    });

    it('should undo multiple commands in order', async () => {
      const command1 = createMockCommand('Command 1');
      const command2 = createMockCommand('Command 2');
      const command3 = createMockCommand('Command 3');

      const storeWithHistory = configureStore({
        reducer: {
          commands: commandsReducer,
        },
        preloadedState: {
          commands: {
            undoStack: [command1, command2, command3],
            redoStack: [],
            isExecuting: false,
          },
        },
      });

      await storeWithHistory.dispatch(undoLastCommand());

      const state = storeWithHistory.getState().commands;
      expect(state.undoStack).toHaveLength(2);
      expect(state.redoStack).toHaveLength(1);
      expect(state.redoStack[0].description).toBe('Command 3');
    });
  });

  describe('redoLastCommand async thunk', () => {
    it('should set executing state when pending', () => {
      const action = { type: redoLastCommand.pending.type };
      const state = commandsReducer(undefined, action);

      expect(state.isExecuting).toBe(true);
    });

    it('should move command from redo to undo stack when fulfilled', async () => {
      const command = createMockCommand('Test Command');

      const storeWithHistory = configureStore({
        reducer: {
          commands: commandsReducer,
        },
        preloadedState: {
          commands: {
            undoStack: [],
            redoStack: [command],
            isExecuting: false,
          },
        },
      });

      await storeWithHistory.dispatch(redoLastCommand());

      const state = storeWithHistory.getState().commands;
      expect(state.isExecuting).toBe(false);
      expect(state.undoStack).toHaveLength(1);
      expect(state.redoStack).toHaveLength(0);
      expect(state.undoStack[0].description).toBe('Test Command');
      expect(command.execute).toHaveBeenCalledTimes(1);
    });

    it('should reject when redo stack is empty', async () => {
      const result = await store.dispatch(redoLastCommand());

      expect(result.type).toBe(redoLastCommand.rejected.type);
      expect(result.payload).toBe('No commands to redo');
    });

    it('should handle redo failure', async () => {
      const failingCommand = createMockCommand(
        'Failing Command',
        () => Promise.reject(new Error('Redo failed'))
      );

      const storeWithHistory = configureStore({
        reducer: {
          commands: commandsReducer,
        },
        preloadedState: {
          commands: {
            undoStack: [],
            redoStack: [failingCommand],
            isExecuting: false,
          },
        },
      });

      await storeWithHistory.dispatch(redoLastCommand());

      const state = storeWithHistory.getState().commands;
      expect(state.isExecuting).toBe(false);
      // Command should not be moved on failure
      expect(state.undoStack).toHaveLength(0);
      expect(state.redoStack).toHaveLength(1);
    });

    it('should redo multiple commands in order', async () => {
      const command1 = createMockCommand('Command 1');
      const command2 = createMockCommand('Command 2');
      const command3 = createMockCommand('Command 3');

      const storeWithHistory = configureStore({
        reducer: {
          commands: commandsReducer,
        },
        preloadedState: {
          commands: {
            undoStack: [],
            redoStack: [command1, command2, command3],
            isExecuting: false,
          },
        },
      });

      await storeWithHistory.dispatch(redoLastCommand());

      const state = storeWithHistory.getState().commands;
      expect(state.undoStack).toHaveLength(1);
      expect(state.redoStack).toHaveLength(2);
      expect(state.undoStack[0].description).toBe('Command 3');
    });
  });

  describe('command workflow integration', () => {
    it('should support full undo/redo workflow', async () => {
      const command1 = createMockCommand('Command 1');
      const command2 = createMockCommand('Command 2');

      // Execute two commands
      await store.dispatch(executeCommand(command1));
      await store.dispatch(executeCommand(command2));

      let state = store.getState().commands;
      expect(state.undoStack).toHaveLength(2);
      expect(state.redoStack).toHaveLength(0);

      // Undo last command
      await store.dispatch(undoLastCommand());

      state = store.getState().commands;
      expect(state.undoStack).toHaveLength(1);
      expect(state.redoStack).toHaveLength(1);

      // Redo command
      await store.dispatch(redoLastCommand());

      state = store.getState().commands;
      expect(state.undoStack).toHaveLength(2);
      expect(state.redoStack).toHaveLength(0);
    });

    it('should clear redo stack when new command is executed after undo', async () => {
      const command1 = createMockCommand('Command 1');
      const command2 = createMockCommand('Command 2');
      const command3 = createMockCommand('Command 3');

      // Execute two commands
      await store.dispatch(executeCommand(command1));
      await store.dispatch(executeCommand(command2));

      // Undo one
      await store.dispatch(undoLastCommand());

      let state = store.getState().commands;
      expect(state.redoStack).toHaveLength(1);

      // Execute new command
      await store.dispatch(executeCommand(command3));

      state = store.getState().commands;
      expect(state.undoStack).toHaveLength(2);
      expect(state.undoStack[1].description).toBe('Command 3');
      expect(state.redoStack).toHaveLength(0);
    });
  });
});

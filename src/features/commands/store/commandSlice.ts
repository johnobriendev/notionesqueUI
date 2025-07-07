//src/features/commands/store/commandSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UndoableCommand, CommandHistoryState } from '../types/commandTypes';

// Define the root state type to match your actual store structure
type RootState = {
  tasks: any;
  tasksMeta: any;
  ui: any;
  projects: any;
  commands: CommandHistoryState;
};

// Initial state for command history
const initialState: CommandHistoryState = {
  undoStack: [],
  redoStack: [],
  isExecuting: false
};

// Async thunk to execute a command
export const executeCommand = createAsyncThunk<
  UndoableCommand,
  UndoableCommand,
  { state: RootState }
>(
  'commands/executeCommand',
  async (command: UndoableCommand, { dispatch, getState, rejectWithValue }) => {
    try {
      console.log(`🎯 Executing command: ${command.description}`);
      await command.execute(dispatch, getState);
      return command;
    } catch (error: any) {
      console.error(`❌ Command failed: ${command.description}`, error);
      return rejectWithValue(error.message || 'Command execution failed');
    }
  }
);

// Async thunk to undo the last command
export const undoLastCommand = createAsyncThunk<
  UndoableCommand,
  void,
  { state: RootState }
>(
  'commands/undoLastCommand',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const { undoStack } = state.commands;
    
    if (undoStack.length === 0) {
      return rejectWithValue('No commands to undo');
    }
    
    const command = undoStack[undoStack.length - 1];
    
    try {
      console.log(`↩️ Undoing command: ${command.description}`);
      await command.undo(dispatch, getState);
      return command;
    } catch (error: any) {
      console.error(`❌ Undo failed: ${command.description}`, error);
      return rejectWithValue(error.message || 'Undo failed');
    }
  }
);

// Async thunk to redo the last undone command
export const redoLastCommand = createAsyncThunk<
  UndoableCommand,
  void,
  { state: RootState }
>(
  'commands/redoLastCommand',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const { redoStack } = state.commands;
    
    if (redoStack.length === 0) {
      return rejectWithValue('No commands to redo');
    }
    
    const command = redoStack[redoStack.length - 1];
    
    try {
      console.log(`↪️ Redoing command: ${command.description}`);
      await command.execute(dispatch, getState);
      return command;
    } catch (error: any) {
      console.error(`❌ Redo failed: ${command.description}`, error);
      return rejectWithValue(error.message || 'Redo failed');
    }
  }
);

// Command slice
export const commandSlice = createSlice({
  name: 'commands',
  initialState,
  reducers: {
    // Clear all command history
    clearHistory: (state) => {
      state.undoStack = [];
      state.redoStack = [];
      console.log('🧹 Command history cleared');
    },
    
    // Clear redo stack (used when a new command is executed)
    clearRedoStack: (state) => {
      state.redoStack = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Execute command
      .addCase(executeCommand.pending, (state) => {
        state.isExecuting = true;
      })
      .addCase(executeCommand.fulfilled, (state, action) => {
        state.isExecuting = false;
        // Add command to undo stack
        state.undoStack.push(action.payload);
        // Clear redo stack when new command is executed
        state.redoStack = [];
        console.log(`✅ Command executed and added to undo stack`);
      })
      .addCase(executeCommand.rejected, (state, action) => {
        state.isExecuting = false;
        console.error('Command execution rejected:', action.payload);
      })
      
      // Undo command
      .addCase(undoLastCommand.pending, (state) => {
        state.isExecuting = true;
      })
      .addCase(undoLastCommand.fulfilled, (state, action) => {
        state.isExecuting = false;
        // Move command from undo to redo stack
        const command = state.undoStack.pop();
        if (command) {
          state.redoStack.push(command);
        }
        console.log(`✅ Command undone and moved to redo stack`);
      })
      .addCase(undoLastCommand.rejected, (state, action) => {
        state.isExecuting = false;
        console.error('Undo rejected:', action.payload);
      })
      
      // Redo command
      .addCase(redoLastCommand.pending, (state) => {
        state.isExecuting = true;
      })
      .addCase(redoLastCommand.fulfilled, (state, action) => {
        state.isExecuting = false;
        // Move command from redo to undo stack
        const command = state.redoStack.pop();
        if (command) {
          state.undoStack.push(command);
        }
        console.log(`✅ Command redone and moved to undo stack`);
      })
      .addCase(redoLastCommand.rejected, (state, action) => {
        state.isExecuting = false;
        console.error('Redo rejected:', action.payload);
      });
  }
});

// Export actions
export const { clearHistory, clearRedoStack } = commandSlice.actions;

// Export reducer
export default commandSlice.reducer;

// Selectors
export const selectCanUndo = (state: { commands: CommandHistoryState }) => 
  state.commands.undoStack.length > 0;

export const selectCanRedo = (state: { commands: CommandHistoryState }) => 
  state.commands.redoStack.length > 0;

export const selectUndoStackLength = (state: { commands: CommandHistoryState }) => 
  state.commands.undoStack.length;

export const selectRedoStackLength = (state: { commands: CommandHistoryState }) => 
  state.commands.redoStack.length;

export const selectIsExecutingCommand = (state: { commands: CommandHistoryState }) => 
  state.commands.isExecuting;

export const selectLastUndoCommand = (state: { commands: CommandHistoryState }) => {
  const { undoStack } = state.commands;
  return undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
};

export const selectLastRedoCommand = (state: { commands: CommandHistoryState }) => {
  const { redoStack } = state.commands;
  return redoStack.length > 0 ? redoStack[redoStack.length - 1] : null;
};
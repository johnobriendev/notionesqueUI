//src/features/commands/types/commandTypes.ts

import type { AppDispatch } from '../../../app/store';

// Base command interface - every undoable operation implements this
export interface UndoableCommand {
  type: string;                                    // Command type identifier
  description: string;                             // Human-readable description
  execute: (dispatch: any, getState: () => any) => Promise<void>;  // How to perform the action
  undo: (dispatch: any, getState: () => any) => Promise<void>;     // How to reverse the action
}

// Command history state managed by Redux
export interface CommandHistoryState {
  undoStack: UndoableCommand[];   // Commands that can be undone
  redoStack: UndoableCommand[];   // Commands that can be redone
  isExecuting: boolean;           // Prevents multiple operations at once
}

// Command execution result
export interface CommandResult {
  success: boolean;
  error?: string;
}

// Command factory function type
export type CommandFactory<T = any> = (data: T) => UndoableCommand;
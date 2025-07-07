// src/features/ui/components/HistoryControls.tsx - COMMAND SYSTEM VERSION
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { 
  undoLastCommand, 
  redoLastCommand,
  selectCanUndo,
  selectCanRedo,
  selectUndoStackLength,
  selectRedoStackLength,
  selectLastUndoCommand,
  selectLastRedoCommand,
  selectIsExecutingCommand
} from '../../commands/store/commandSlice';

const HistoryControls: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Use the command system selectors instead of redux-undo selectors
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const undoStackLength = useAppSelector(selectUndoStackLength);
  const redoStackLength = useAppSelector(selectRedoStackLength);
  const lastUndoCommand = useAppSelector(selectLastUndoCommand);
  const lastRedoCommand = useAppSelector(selectLastRedoCommand);
  const isExecuting = useAppSelector(selectIsExecutingCommand);

  // Simple undo handler - just dispatch the undo command
  const handleUndo = async () => {
    if (!canUndo || isExecuting) return;
    
    console.log('🔄 Undoing last command...');
    try {
      await dispatch(undoLastCommand()).unwrap();
      console.log('✅ Undo completed successfully');
    } catch (error) {
      console.error('❌ Undo failed:', error);
      // You could show a toast notification here
    }
  };

  // Simple redo handler - just dispatch the redo command
  const handleRedo = async () => {
    if (!canRedo || isExecuting) return;
    
    console.log('🔄 Redoing last command...');
    try {
      await dispatch(redoLastCommand()).unwrap();
      console.log('✅ Redo completed successfully');
    } catch (error) {
      console.error('❌ Redo failed:', error);
      // You could show a toast notification here
    }
  };

  // Helper to get a user-friendly description for the tooltip
  const getUndoTooltip = () => {
    if (!canUndo) return 'No actions to undo';
    if (lastUndoCommand) {
      return `Undo: ${lastUndoCommand.description}`;
    }
    return `Undo (${undoStackLength} actions available)`;
  };

  const getRedoTooltip = () => {
    if (!canRedo) return 'No actions to redo';
    if (lastRedoCommand) {
      return `Redo: ${lastRedoCommand.description}`;
    }
    return `Redo (${redoStackLength} actions available)`;
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Undo Button */}
      <button
        onClick={handleUndo}
        disabled={!canUndo || isExecuting}
        className={`p-2 rounded-md transition-all duration-200 ${
          canUndo && !isExecuting
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-md' 
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        } ${isExecuting ? 'opacity-50' : ''}`}
        title={getUndoTooltip()}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6M3 10l6-6"/>
        </svg>
      </button>
      
      {/* Redo Button */}
      <button
        onClick={handleRedo}
        disabled={!canRedo || isExecuting}
        className={`p-2 rounded-md transition-all duration-200 ${
          canRedo && !isExecuting
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-md' 
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        } ${isExecuting ? 'opacity-50' : ''}`}
        title={getRedoTooltip()}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 10H11a8 8 0 0 0-8 8v2M21 10l-6 6M21 10l-6-6"/>
        </svg>
      </button>
      
      {/* Status Display */}
      <div className="flex items-center space-x-3 ml-4">
        <span className="text-xs text-gray-500">
          Undo: {undoStackLength} | Redo: {redoStackLength}
        </span>
        
        {/* Loading indicator when executing commands */}
        {isExecuting && (
          <div className="flex items-center space-x-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span className="text-xs text-blue-600">Processing...</span>
          </div>
        )}
      </div>
      
      {/* Debug info in development */}
      {import.meta.env?.DEV && (
        <div className="text-xs text-gray-400 ml-4">
          {lastUndoCommand && (
            <div>Last: {lastUndoCommand.type}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryControls;
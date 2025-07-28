// src/features/ui/components/HistoryControls.tsx
import React, { useState } from 'react';
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

type ConfirmationType = 'undo' | 'redo' | null;

const HistoryControls: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Modal state
  const [showConfirmation, setShowConfirmation] = useState<ConfirmationType>(null);
  
  // Use the command system selectors instead of redux-undo selectors
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const undoStackLength = useAppSelector(selectUndoStackLength);
  const redoStackLength = useAppSelector(selectRedoStackLength);
  const lastUndoCommand = useAppSelector(selectLastUndoCommand);
  const lastRedoCommand = useAppSelector(selectLastRedoCommand);
  const isExecuting = useAppSelector(selectIsExecutingCommand);

  // Show confirmation modal for undo
  const handleUndoClick = () => {
    if (!canUndo || isExecuting) return;
    setShowConfirmation('undo');
  };

  // Show confirmation modal for redo
  const handleRedoClick = () => {
    if (!canRedo || isExecuting) return;
    setShowConfirmation('redo');
  };

  // Execute undo after confirmation
  const confirmUndo = async () => {
    setShowConfirmation(null);
    
    try {
      await dispatch(undoLastCommand()).unwrap();
    } catch (error) {
      console.error('❌ Undo failed:', error);
      // You could show a toast notification here
    }
  };

  // Execute redo after confirmation
  const confirmRedo = async () => {
    setShowConfirmation(null);
    
    try {
      await dispatch(redoLastCommand()).unwrap();
    } catch (error) {
      console.error('❌ Redo failed:', error);
      // You could show a toast notification here
    }
  };

  // Close modal without action
  const closeConfirmation = () => {
    setShowConfirmation(null);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeConfirmation();
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

  // Render confirmation modal
  const renderConfirmationModal = () => {
    if (!showConfirmation) return null;

    const isUndo = showConfirmation === 'undo';
    const command = isUndo ? lastUndoCommand : lastRedoCommand;
    const commandDesc = command?.description || (isUndo ? 'the last action' : 'the last undone action');
    
    const title = isUndo ? 'Confirm Undo' : 'Confirm Redo';
    const message = isUndo 
      ? `Are you sure you want to undo "${commandDesc}"? This action cannot be undone without using redo.`
      : `Are you sure you want to redo "${commandDesc}"?`;
    const confirmText = isUndo ? 'Undo' : 'Redo';
    const confirmAction = isUndo ? confirmUndo : confirmRedo;
    const buttonColorClass = isUndo 
      ? 'bg-red-600 hover:bg-red-700' 
      : 'bg-blue-600 hover:bg-blue-700';

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600">
              {message}
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeConfirmation}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors duration-200 ${buttonColorClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Undo Button */}
        <button
          onClick={handleUndoClick}
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
          onClick={handleRedoClick}
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

      {/* Integrated Confirmation Modal */}
      {renderConfirmationModal()}
    </>
  );
};

export default HistoryControls;
// src/features/tasks/hooks/useConflictResolution.tsx
import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import ConflictResolutionModal from '../components/ConflictResolutionModal';
import { TaskConflict, Task } from '../../../types';

interface ConflictResolutionResult {
  resolution: 'keep_mine' | 'take_theirs' | 'cancel';
  updatedTask?: Task;
}

// Function to show conflict resolution modal as a promise
export const showConflictResolution = (
  conflict: TaskConflict, 
  userChanges: Partial<Task>
): Promise<ConflictResolutionResult> => {
  return new Promise((resolve) => {
    // Create a container for the modal
    const modalContainer = document.createElement('div');
    document.body.appendChild(modalContainer);
    
    const root = createRoot(modalContainer);
    
    const handleResolve = (resolution: 'keep_mine' | 'take_theirs' | 'merge') => {
      // Clean up
      root.unmount();
      document.body.removeChild(modalContainer);
      
      if (resolution === 'keep_mine') {
        resolve({ resolution: 'keep_mine' });
      } else if (resolution === 'take_theirs') {
        resolve({ 
          resolution: 'take_theirs', 
          updatedTask: conflict.currentTask 
        });
      } else {
        resolve({ resolution: 'cancel' });
      }
    };
    
    const handleCancel = () => {
      // Clean up
      root.unmount();
      document.body.removeChild(modalContainer);
      resolve({ resolution: 'cancel' });
    };
    
    // Render the modal
    root.render(
      <ConflictResolutionModal
        isOpen={true}
        conflict={conflict}
        userChanges={userChanges}
        onResolve={handleResolve}
        onCancel={handleCancel}
      />
    );
  });
};

// Hook for using conflict resolution in components
export const useConflictResolution = () => {
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  
  const resolveConflict = useCallback(async (
    conflict: TaskConflict, 
    userChanges: Partial<Task>
  ): Promise<ConflictResolutionResult> => {
    setIsResolvingConflict(true);
    try {
      const result = await showConflictResolution(conflict, userChanges);
      return result;
    } finally {
      setIsResolvingConflict(false);
    }
  }, []);
  
  return {
    resolveConflict,
    isResolvingConflict
  };
};
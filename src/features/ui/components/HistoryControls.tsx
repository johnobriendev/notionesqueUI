// src/components/common/HistoryControls.tsx - METADATA VERSION
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { ActionCreators } from 'redux-undo';
import { 
  createTaskAsync, 
  deleteTaskAsync, 
  updateTaskAsync,
  updateTaskPriorityAsync,
  deleteTasksAsync,
  bulkUpdateTasksAsync,
  reorderTasksAsync
} from '../../../features/tasks/store/tasksSlice';
import { selectCurrentProject } from '../../../features/projects/store/projectsSlice';

const HistoryControls: React.FC = () => {
  const dispatch = useAppDispatch();
  
  const canUndo = useAppSelector(state => state.tasks.past.length > 0);
  const canRedo = useAppSelector(state => state.tasks.future.length > 0);
  const pastCount = useAppSelector(state => state.tasks.past.length);
  const futureCount = useAppSelector(state => state.tasks.future.length);
  const tasksState = useAppSelector(state => state.tasks);
  const currentProject = useAppSelector(selectCurrentProject);

  // ✅ SIMPLE: Just read the stored undo metadata
  const getLastUndoAction = () => {
    if (!canUndo || pastCount === 0) return null;
    
    // Get the undo instructions from the last past state
    const lastState = tasksState.past[pastCount - 1];
    const undoAction = lastState?.lastActionUndo;
    
    console.log('📖 Reading stored undo action:', undoAction);
    return undoAction;
  };

  // ✅ SIMPLE: Read stored redo metadata  
  const getNextRedoAction = () => {
    if (!canRedo || futureCount === 0) return null;
    
    // Get the redo instructions from the first future state
    const nextState = tasksState.future[0];
    const redoAction = nextState?.lastActionUndo;
    
    console.log('📖 Reading stored redo action:', redoAction);
    return redoAction;
  };

  // ✅ EXECUTE STORED UNDO INSTRUCTIONS
  const executeUndoInstructions = async (instructions: any) => {
    if (!currentProject || !instructions) return;
    
    switch (instructions.operation) {
      case 'delete':
        console.log('🔄 Executing: Delete task', instructions.taskId);
        await dispatch(deleteTaskAsync({
          projectId: instructions.projectId,
          taskId: instructions.taskId,
          isUndoOperation: true
        })).unwrap();
        break;
        
      case 'create':
        console.log('🔄 Executing: Create task', instructions.taskData?.title);
        if (instructions.taskData) {
          await dispatch(createTaskAsync({
            projectId: instructions.projectId,
            title: instructions.taskData.title,
            description: instructions.taskData.description ?? undefined,
            status: instructions.taskData.status,
            priority: instructions.taskData.priority,
            position: instructions.taskData.position,
            customFields: instructions.taskData.customFields || {},
            taskId: instructions.taskData.id,
            isUndoOperation: true
          })).unwrap();
        }
        break;
        
      case 'update':
        console.log('🔄 Executing: Update task', instructions.taskId);
        if (instructions.previousData) {
          await dispatch(updateTaskAsync({
            projectId: instructions.projectId,
            taskId: instructions.taskId,
            updates: {
              title: instructions.previousData.title,
              description: instructions.previousData.description ?? undefined,
              status: instructions.previousData.status,
              priority: instructions.previousData.priority,
              position: instructions.previousData.position,
              customFields: instructions.previousData.customFields
            },
            isUndoOperation: true
          })).unwrap();
        }
        break;
        
      case 'updatePriority':
        console.log('🔄 Executing: Revert priority change', instructions.taskId);
        await dispatch(updateTaskPriorityAsync({
          projectId: instructions.projectId,
          taskId: instructions.taskId,
          priority: instructions.previousPriority,
          destinationIndex: instructions.previousPosition,
          isUndoOperation: true
        })).unwrap();
        break;
        
      case 'bulkCreate':
        console.log('🔄 Executing: Bulk recreate tasks', instructions.tasksData?.length);
        if (instructions.tasksData) {
          for (const taskData of instructions.tasksData) {
            await dispatch(createTaskAsync({
              projectId: instructions.projectId,
              title: taskData.title,
              description: taskData.description ?? undefined,
              status: taskData.status,
              priority: taskData.priority,
              position: taskData.position,
              customFields: taskData.customFields || {},
              taskId: taskData.id,
              isUndoOperation: true
            })).unwrap();
          }
        }
        break;
        
      case 'bulkUpdate':
        console.log('🔄 Executing: Bulk revert updates', instructions.taskIds?.length);
        if (instructions.previousData) {
          for (const taskData of instructions.previousData) {
            await dispatch(updateTaskAsync({
              projectId: instructions.projectId,
              taskId: taskData.id,
              updates: {
                status: taskData.status,
                priority: taskData.priority
              },
              isUndoOperation: true
            })).unwrap();
          }
        }
        break;
        
      case 'reorder':
        console.log('🔄 Executing: Revert reorder', instructions.priority);
        await dispatch(reorderTasksAsync({
          projectId: instructions.projectId,
          priority: instructions.priority,
          taskIds: instructions.previousOrder,
          isUndoOperation: true
        })).unwrap();
        break;
        
      default:
        console.warn('❓ Unknown undo operation:', instructions.operation);
    }
  };

  // ✅ EXECUTE STORED REDO INSTRUCTIONS (same as undo but forward)
  const executeRedoInstructions = async (instructions: any) => {
    if (!currentProject || !instructions) return;
    
    // For redo, we execute the OPPOSITE of the undo instruction
    switch (instructions.operation) {
      case 'delete':
        // If undo was "delete", redo is "create"
        console.log('🔄 Redoing: Create task', instructions.taskId);
        // We need to get the task data from current state to recreate
        const currentTask = tasksState.present.items.find(t => t.id === instructions.taskId);
        if (currentTask) {
          await dispatch(createTaskAsync({
            projectId: instructions.projectId,
            title: currentTask.title,
            description: currentTask.description ?? undefined,
            status: currentTask.status,
            priority: currentTask.priority,
            position: currentTask.position,
            customFields: currentTask.customFields || {},
            taskId: currentTask.id,
            isUndoOperation: true
          })).unwrap();
        }
        break;
        
      case 'create':
        // If undo was "create", redo is "delete"
        console.log('🔄 Redoing: Delete task', instructions.taskData?.id);
        if (instructions.taskData) {
          await dispatch(deleteTaskAsync({
            projectId: instructions.projectId,
            taskId: instructions.taskData.id,
            isUndoOperation: true
          })).unwrap();
        }
        break;
        
      // Add other cases as needed...
      default:
        console.warn('❓ Redo not implemented for operation:', instructions.operation);
    }
  };

  const handleUndo = async () => {
    console.log('🔄 UNDO - Metadata Based');
    
    const undoAction = getLastUndoAction();
    if (!undoAction) {
      console.log('❌ No stored undo action found');
      return;
    }
    
    console.log(`🎯 Undoing: ${undoAction.description}`);
    
    try {
      // 1. First update Redux state
      dispatch(ActionCreators.undo());
      
      // 2. Then execute stored undo instructions
      await executeUndoInstructions(undoAction.instructions);
      
      console.log('✅ Undo completed');
    } catch (error) {
      console.error('❌ Undo failed:', error);
    }
  };

  const handleRedo = async () => {
    console.log('🔄 REDO - Metadata Based');
    
    const redoAction = getNextRedoAction();
    if (!redoAction) {
      console.log('❌ No stored redo action found');
      return;
    }
    
    console.log(`🎯 Redoing: ${redoAction.description}`);
    
    try {
      // 1. First execute redo instructions
      await executeRedoInstructions(redoAction.instructions);
      
      // 2. Then update Redux state
      dispatch(ActionCreators.redo());
      
      console.log('✅ Redo completed');
    } catch (error) {
      console.error('❌ Redo failed:', error);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={`p-2 rounded-md ${
          canUndo 
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
        title={`Undo (${pastCount} states)`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6M3 10l6-6"/>
        </svg>
      </button>
      
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={`p-2 rounded-md ${
          canRedo 
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
        title={`Redo (${futureCount} states)`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10H11a8 8 0 0 0-8 8v2M21 10l-6 6M21 10l-6-6"/>
        </svg>
      </button>
      
      <span className="text-xs text-gray-500 ml-4">
        Past: {pastCount} | Future: {futureCount}
      </span>
    </div>
  );
};

export default HistoryControls;
// src/views/KanbanView.tsx - Fixed Container and Scrolling
import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { openTaskModal, openTaskDetail, openDeleteConfirm } from '../features/ui/store/uiSlice';
import { selectTasksByPriority } from '../features/tasks/store/tasksSlice';
import { selectCurrentProject } from '../features/projects/store/projectsSlice';
import { TaskPriority, TaskStatus, Task } from '../types';
import { executeCommand } from '../features/commands/store/commandSlice';
import { createTaskCommand, updateTaskPriorityCommand, reorderTasksCommand } from '../features/commands/taskCommands';
import { WriteGuard } from '../components/common/PermissionGuard';
import { getProjectPermissions } from '../lib/permissions';

const KanbanView: React.FC = () => {
  const dispatch = useAppDispatch();

  const tasksByPriority = useAppSelector(selectTasksByPriority);
  const currentProject = useAppSelector(selectCurrentProject);

  // State for quick add task inputs in each column
  const [newTaskInputs, setNewTaskInputs] = useState<Record<TaskPriority, string>>({
    low: '',
    medium: '',
    high: '',
    urgent: ''
  });

  // State to track which column has an active input
  const [activeInputColumn, setActiveInputColumn] = useState<TaskPriority | null>(null);

  // Ref for click outside detection
  const createTaskRefs = useRef<Record<TaskPriority, HTMLDivElement | null>>({
    low: null,
    medium: null,
    high: null,
    urgent: null
  });

  // Handle click outside to close create task forms
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeInputColumn) {
        const activeRef = createTaskRefs.current[activeInputColumn];
        if (activeRef && !activeRef.contains(event.target as Node)) {
          setActiveInputColumn(null);
          // Reset the input when closing
          setNewTaskInputs(prev => ({
            ...prev,
            [activeInputColumn]: ''
          }));
        }
      }
    };

    if (activeInputColumn) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeInputColumn]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    if (!currentProject) return;

    // Get the priority from the droppable ID (column ID)
    const sourcePriority = source.droppableId as TaskPriority;
    const destinationPriority = destination.droppableId as TaskPriority;

    // Get the task ID from the draggable ID
    const taskId = result.draggableId;

    console.log('🎯 DRAG END:', {
      sourcePriority,
      destinationPriority,
      taskId,
      sourceIndex: source.index,
      destinationIndex: destination.index
    });

    try {
      if (sourcePriority !== destinationPriority) {
        // Moving between columns - use updateTaskPriorityCommand
        console.log('🔄 Moving between columns - using command pattern');

        const command = updateTaskPriorityCommand({
          projectId: currentProject.id,
          taskId: taskId,
          priority: destinationPriority,
          destinationIndex: destination.index
        });

        await dispatch(executeCommand(command)).unwrap();
        console.log('✅ Priority update command executed successfully');

      } else {
        // Reordering within the same column - use reorderTasksCommand
        console.log('🔄 Reordering within column - using command pattern');

        const columnTasks = tasksByPriority[sourcePriority];
        const reorderedTasks = Array.from(columnTasks);

        // Remove the task from its old position
        const [movedTask] = reorderedTasks.splice(source.index, 1);

        // Insert the task at its new position
        reorderedTasks.splice(destination.index, 0, movedTask);

        // Create an array of task IDs in their new order
        const newOrder = reorderedTasks.map(task => task.id);

        const command = reorderTasksCommand({
          projectId: currentProject.id,
          priority: sourcePriority,
          taskIds: newOrder
        });

        await dispatch(executeCommand(command)).unwrap();
        console.log('✅ Reorder command executed successfully');
      }

    } catch (error) {
      console.error('❌ Drag & drop command failed:', error);
    }
  };

  // Handle showing the task input for a specific column
  const handleShowInput = (priority: TaskPriority) => {
    setActiveInputColumn(priority);
  };

  // Handle input change
  const handleInputChange = (priority: TaskPriority, value: string) => {
    setNewTaskInputs(prev => ({
      ...prev,
      [priority]: value
    }));
  };

  // Handle creating a new task
  const handleCreateTask = async (priority: TaskPriority) => {
    const title = newTaskInputs[priority].trim();
    if (!title) return;

    if (!currentProject) {
      console.error('No project selected');
      return;
    }

    try {
      console.log('🎯 Creating CREATE command for Kanban quick-add:', title);

      const command = createTaskCommand({
        projectId: currentProject.id,
        title,
        description: '',
        status: 'not started',
        priority,
        customFields: {}
      });

      await dispatch(executeCommand(command)).unwrap();
      console.log('✅ Kanban quick-add command executed successfully');

      // Reset the input on success
      setNewTaskInputs(prev => ({
        ...prev,
        [priority]: ''
      }));
      setActiveInputColumn(null);
    } catch (error) {
      console.error('❌ Kanban quick-add command failed:', error);
    }
  };

  // Handle canceling task creation
  const handleCancelTask = () => {
    setActiveInputColumn(null);
  };

  // Handle key press events (Enter to submit, Escape to cancel)
  const handleKeyDown = (e: React.KeyboardEvent, priority: TaskPriority) => {
    if (e.key === 'Enter') {
      handleCreateTask(priority);
    } else if (e.key === 'Escape') {
      handleCancelTask();
    }
  };

  // Get priority color class
  const getPriorityColorClass = (priority: TaskPriority): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-500';
      case 'high': return 'bg-orange-100 border-orange-500';
      case 'medium': return 'bg-yellow-100 border-yellow-500';
      case 'low': return 'bg-green-100 border-green-500';
    }
  };

  // Get formatted priority name
  const getPriorityName = (priority: TaskPriority): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Get status badge class
  const getStatusBadgeClass = (status: TaskStatus): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle edit task
  const handleEditTask = (taskId: string) => {
    dispatch(openTaskModal(taskId));
  };

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    dispatch(openDeleteConfirm(taskId));
  };

  // Show a message if no project is selected
  if (!currentProject) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Project Selected</h2>
          <p className="text-gray-600">Please select a project from the dashboard to view its tasks.</p>
        </div>
      </div>
    );
  }

  return (
    // 🔄 UPDATED: Center the kanban board on large screens
    <div className="h-full flex flex-col">
      <DragDropContext onDragEnd={handleDragEnd}>

        <div
          className="flex-1 overflow-x-auto overflow-y-hidden"
          style={{
            touchAction: 'pan-x pan-y',
            WebkitOverflowScrolling: 'touch'
          }}
        >

          <div className="flex h-full gap-3 px-2 justify-center min-w-full" style={{ minWidth: 'max-content' }}>
            {Object.entries(tasksByPriority).map(([priority, priorityTasks]) => (
              <div
                key={priority}
                className={`flex-shrink-0 w-72 rounded-lg border-t-4 h-full ${getPriorityColorClass(priority as TaskPriority)}`}
              >
                <div className="bg-white rounded-b-lg shadow h-full flex flex-col">
                  {/* Column header */}
                  <div className="p-3 border-b bg-gray-50 flex-shrink-0">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {getPriorityName(priority as TaskPriority)} ({priorityTasks.length})
                    </h3>
                  </div>

                  {/* Scrollable tasks area */}
                  <Droppable droppableId={priority}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-2 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                          }`}
                        style={{ minHeight: '200px' }}
                      >
                        {priorityTasks.length === 0 ? (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-gray-400 text-sm text-center">
                              No tasks
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {priorityTasks.map((task, index) => (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`${snapshot.isDragging ? 'opacity-70 rotate-3 scale-105' : ''
                                      } transition-all duration-200`}
                                  >
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-3">
                                      <div className="flex justify-between items-start mb-2">
                                        <h4
                                          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 line-clamp-2 flex-1 text-sm"
                                          onClick={() => dispatch(openTaskDetail(task.id))}
                                        >
                                          {task.title}
                                        </h4>
                                      </div>

                                      {task.description && (
                                        <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}

                                      <div className="mt-3 flex items-center justify-between">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>
                                          {task.status}
                                        </span>

                                        <WriteGuard>
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => handleEditTask(task.id)}
                                              className="text-indigo-600 hover:text-indigo-900 text-xs"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteTask(task.id)}
                                              className="text-red-600 hover:text-red-900 text-xs"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </WriteGuard>
                                      </div>

                                      {/* Custom fields (if any) */}
                                      {Object.keys(task.customFields).length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                          <p className="text-xs text-gray-500 font-medium mb-1">Custom fields:</p>
                                          <div className="text-xs text-gray-600 space-y-1">
                                            {Object.entries(task.customFields).map(([key, value]) => (
                                              <div key={key} className="flex justify-between">
                                                <span className="font-medium">{key}:</span>
                                                <span className="truncate ml-2">{String(value)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Task Button - Fixed at bottom */}
                  <div className="px-2 py-1.5 border-t bg-gray-50 flex-shrink-0">
                    {activeInputColumn === priority as TaskPriority ? (
                      <div
                        ref={(el) => createTaskRefs.current[priority as TaskPriority] = el}
                        className="bg-white rounded-lg p-2"
                      >
                        <textarea
                          value={newTaskInputs[priority as TaskPriority]}
                          onChange={(e) => handleInputChange(priority as TaskPriority, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, priority as TaskPriority)}
                          placeholder="Enter task title..."
                          className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-between mt-2">
                          <button
                            onClick={() => handleCreateTask(priority as TaskPriority)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Add Task
                          </button>
                          <button
                            onClick={handleCancelTask}
                            className="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <WriteGuard>
                        <button
                          onClick={() => handleShowInput(priority as TaskPriority)}
                          className="w-full py-1.5 px-2 text-blue-600 hover:bg-blue-50 rounded text-sm flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
                        >
                          <span className="text-base mr-1">+</span> Add task
                        </button>
                      </WriteGuard>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanView;
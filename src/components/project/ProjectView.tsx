// src/components/project/ProjectView.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { fetchProject, selectCurrentProject, setCurrentProject } from '../../features/projects/projectsSlice';
import { fetchTasks } from '../../features/tasks/tasksSlice';
import Header from '../layout/Header';
import ListView from '../views/ListView';
import KanbanView from '../views/KanbanView';
import TaskDetailView from '../task/TaskDetailVIew';
import { closeTaskDetail } from '../../features/ui/uiSlice';

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const currentProject = useAppSelector(selectCurrentProject);
  const viewMode = useAppSelector(state => state.ui.viewMode);
  const isTaskDetailOpen = useAppSelector(state => state.ui.isTaskDetailOpen);
  const viewingTaskId = useAppSelector(state => state.ui.viewingTaskId);
  const tasks = useAppSelector(state => state.tasks.present.items);
  
  // Find the task being viewed, if any
  const taskBeingViewed = viewingTaskId 
    ? tasks.find(task => task.id === viewingTaskId) 
    : null;
  
  // Load the project and its tasks when the component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      // First fetch the project details
      dispatch(fetchProject(projectId))
        .unwrap()
        .then((project) => {
          // Set it as the current project
          dispatch(setCurrentProject(project));
          // Then fetch all tasks for this project
          dispatch(fetchTasks(projectId));
        })
        .catch((error) => {
          console.error('Failed to load project:', error);
          // Navigate back to dashboard on error
          navigate('/');
        });
    }
  }, [dispatch, projectId, navigate]);
  
  // If no project is loaded yet, show a loading indicator
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        showBackButton={true} 
        projectName={currentProject.name}
      />
      
      <main>
        <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {viewMode === 'list' ? <ListView /> : <KanbanView />}
        </div>
      </main>
      
      {isTaskDetailOpen && taskBeingViewed && (
        <TaskDetailView 
          task={taskBeingViewed} 
          onClose={() => dispatch(closeTaskDetail())} 
        />
      )}
    </div>
  );
};

export default ProjectView;
// src/components/project/ProjectView.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { fetchProject, selectCurrentProject, setCurrentProject, fetchProjects } from '../../features/projects/projectsSlice';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
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
    let isMounted = true;
    const loadProject = async () => {
      if (!projectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Make up to 3 retries if we get auth errors
        let retries = 0;
        let project = null;
        
        while (retries < 3 && !project) {
          try {
            project = await dispatch(fetchProject(projectId)).unwrap();
          } catch (err: any) {
            // If it's an auth error, wait and retry
            if (err?.response?.status === 401 && retries < 2) {
              console.log(`Auth error, retrying (${retries + 1}/3)...`);
              await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
              retries++;
            } else {
              throw err; // Re-throw if not auth error or max retries reached
            }
          }
        }
        
        if (!project) throw new Error('Failed to load project');
        
        if (isMounted) {
          dispatch(setCurrentProject(project));
          await dispatch(fetchTasks(projectId)).unwrap();
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        if (isMounted) {
          setError('Failed to load project');
          setLoading(false);
          // Navigate back to dashboard after a delay
          setTimeout(() => navigate('/'), 2000);
        }
      }
    };
    
    loadProject();
    
    return () => {
      isMounted = false;
    };
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
      {/* Type cast Header to any to bypass the TypeScript error */}
      {React.createElement(Header as any, {
        showBackButton: true,
        projectName: currentProject.name
      })}
      
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
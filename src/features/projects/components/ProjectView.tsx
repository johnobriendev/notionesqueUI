// src/components/project/ProjectView.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../app/hooks';
import { fetchProject, selectCurrentProject, setCurrentProject, selectAllProjects } from '../store/projectsSlice';
import { fetchTasks } from '../../tasks/store/tasksSlice';
import { closeTaskDetail, setCurrentProjectId } from '../../ui/store/uiSlice';
import { clearHistory } from '../../commands/store/commandSlice'; // Import command system
import Header from '../../../components/layout/Header';
import ListView from '../../../views/ListView';
import KanbanView from '../../../views/KanbanView';
import TaskDetailView from '../../tasks/components/TaskDetailVIew';
import { useAppAuth } from '../../../auth/AuthProvider';
import TeamModal from '../../collaboration/components/TeamModal';

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAppReady } = useAppAuth();

  const currentProject = useAppSelector(selectCurrentProject);
  const allProjects = useAppSelector(selectAllProjects);
  const viewMode = useAppSelector(state => state.ui.viewMode);
  const isTaskDetailOpen = useAppSelector(state => state.ui.isTaskDetailOpen);
  const viewingTaskId = useAppSelector(state => state.ui.viewingTaskId);
  const tasks = useAppSelector(state => state.tasks.items);

  // Find the task being viewed, if any
  const taskBeingViewed = viewingTaskId
    ? tasks.find(task => task.id === viewingTaskId)
    : null;

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!projectId) {
        navigate('/');
        return;
      }

      //  Wait for authentication to be ready

      if (!isAppReady) {
        return; // Stay in loading state until auth is ready
      }



      setLoading(true);
      setError(null);

      try {
        //  Check if we already have this project in our store

        let project = allProjects.find(p => p.id === projectId);

        //  Only fetch from API if we don't have the project
        if (!project) {
          //console.log('Fetching project from API:', projectId);

          // Retry logic for auth errors (this was in your original code)
          let retries = 0;
          while (retries < 3 && !project) {
            try {
              project = await dispatch(fetchProject(projectId)).unwrap();
            } catch (err: any) {
              if (err?.response?.status === 401 && retries < 2) {
                //console.log(`Auth error, retrying (${retries + 1}/3)...`);
                await new Promise(r => setTimeout(r, 1000));
                retries++;
              } else {
                throw err;
              }
            }
          }
        } else {

          //console.log('Using project from store:', project.name);
        }

        if (!project) {
          throw new Error('Project not found');
        }

        if (isMounted) {



          dispatch(clearHistory());


          // Set the current project in the projects state
          dispatch(setCurrentProject(project));


          dispatch(setCurrentProjectId(projectId));

          // Always fetch fresh tasks (tasks change more frequently than projects)
          await dispatch(fetchTasks(projectId)).unwrap();
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        if (isMounted) {
          setError('Failed to load project');
          setLoading(false);
          setTimeout(() => navigate('/'), 2000);
        }
      }
    };

    loadProject();

    return () => {
      isMounted = false;
    };


  }, [dispatch, projectId, navigate, currentProject, allProjects, isAppReady]);

  if (!isAppReady || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isAppReady ? 'Initializing application...' : 'Loading project...'}
          </p>
        </div>
      </div>
    );
  }

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
      <div className='flex flex-col md:h-screen'>
        <Header
          showBackButton={true}
          projectName={currentProject.name}
        />

        <main className='flex-1 md:overflow-y-auto'>
          <div className={`h-full mx-auto max-w-none px-2 ${viewMode === 'list' ? 'py-4' : 'pt-4'}`}>
            {viewMode === 'list' ? <ListView /> : <KanbanView />}
          </div>
        </main>
      </div>
      {isTaskDetailOpen && taskBeingViewed && (
        <TaskDetailView
          task={taskBeingViewed}
          onClose={() => dispatch(closeTaskDetail())}
        />
      )}

      <TeamModal />
    </div>
  );
};

export default ProjectView;
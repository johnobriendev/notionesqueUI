// src/App.tsx
import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import ProjectDashboard from './features/projects/components/ProjectDashboard';
import Header from './components/layout/Header';
import ListView from './views/ListView';
import KanbanView from './views/KanbanView';
import TaskModal from './features/tasks/components/TaskModal';
import BulkEditModal from './features/tasks/components/BulkEditModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import TaskDetailView from './features/tasks/components/TaskDetailVIew';
import { closeTaskDetail } from './features/ui/uiSlice';
import { useAppSelector, useAppDispatch } from './app/hooks';
import AuthLayout from './components/layout/AuthLayout';
import ProjectView from './features/projects/components/ProjectView';
import WelcomePage from './views/WelcomePage';


// Root layout that includes modals which are shared across routes
const RootLayout = () => {
  return (
    <>
      <Outlet />
      <TaskModal />
      <DeleteConfirmModal />
      <BulkEditModal />
    </>
  );
};

// Authenticated routes wrapper
const ProtectedRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  // Show loading indicator while Auth0 initializes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, show welcome page
  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  // If authenticated, render the protected content
  return <AuthLayout><Outlet /></AuthLayout>;
};



function App() {
  const { isLoading } = useAuth0();

  // Show loading indicator while Auth0 initializes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Define the router configuration
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        {
          element: <ProtectedRoutes />,
          children: [
            {
              index: true,
              element: <ProjectDashboard />
            },
            {
              path: "projects/:projectId",
              element: <ProjectView />
            }
          ]
        },
        {
          path: "*",
          element: <Navigate to="/" replace />
        }
      ]
    }
  ]);

  return <RouterProvider router={router} />;
}

export default App;





// src/components/auth/WelcomePage.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const WelcomePage: React.FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  // If already authenticated or still loading, don't show the welcome page
  if (isAuthenticated || isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Notionesque</h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          A powerful task management tool with Kanban and list views, 
          custom fields, and project organization.
        </p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Get Started</h2>
        
        <p className="text-gray-600 mb-6">
          Sign in to access your projects and tasks or create a new account.
        </p>
        
        <button
          onClick={() => loginWithRedirect()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Sign In / Sign Up
        </button>
        
        <div className="mt-8 text-sm text-gray-500 text-center">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Organize Projects</h3>
          <p className="text-gray-600">Create and manage multiple projects with their own tasks and priorities.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Flexible Views</h3>
          <p className="text-gray-600">Switch between Kanban board and list view based on your workflow needs.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Custom Fields</h3>
          <p className="text-gray-600">Add custom data to your tasks to track exactly what matters to you.</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
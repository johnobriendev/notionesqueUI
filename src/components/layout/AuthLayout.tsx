// src/components/layout/AuthLayout.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();

  // Show loading indicator when Auth0 is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to continue</h1>
        <button
          onClick={() => loginWithRedirect()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Log In
        </button>
      </div>
    );
  }

  // Show the app content if authenticated
  return <>{children}</>;
};

export default AuthLayout;
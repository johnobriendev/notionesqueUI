// src/components/dashboard/DashboardHeader.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const DashboardHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth0();
  
  // Handle logout
  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Notionesque Dashboard
          </h1>
          
          {isAuthenticated && user && (
            <div className="flex items-center space-x-2">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full border border-gray-200"
                />
              )}
              <span className="text-sm text-gray-700">{user.name}</span>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
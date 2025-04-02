// src/components/dashboard/DashboardHeader.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const DashboardHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth0();
  
  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-gray-900">Notionesque</h1>
          </div>
          
          {isAuthenticated && user && (
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-700 mr-2">
                {user.email}
              </div>
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full border border-gray-200"
                />
              )}
              <button 
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
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
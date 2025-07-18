// src/components/dashboard/DashboardHeader.tsx
import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearProjects } from '../../features/projects/store/projectsSlice';
import { clearPersistedState } from '../../app/store';
import {
  selectPendingInvitations,
  fetchPendingInvitations
} from '../../features/collaboration/store/collaborationSlice';
import {
  openInvitationsPanel,
  selectIsInvitationsPanelOpen,
} from '../../features/ui/store/uiSlice';
import InvitationsPanel from '../../features/collaboration/components/InvitationsPanel';


const DashboardHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth0();
  const dispatch = useAppDispatch();
  const pendingInvitations = useAppSelector(selectPendingInvitations);
  const isInvitationsPanelOpen = useAppSelector(selectIsInvitationsPanelOpen);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchPendingInvitations());
    }
  }, [isAuthenticated, dispatch]);


  const handleLogout = () => {
    dispatch(clearProjects()); // Clear projects from state
    clearPersistedState();     // Clear localStorage
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleOpenInvitations = () => {
    dispatch(openInvitationsPanel());
  };

  return (
    <>
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-gray-900">Esque</h1>
          </div>

          {isAuthenticated && user && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleOpenInvitations}
                className="relative px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Invitations</span>
                {pendingInvitations.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {pendingInvitations.length}
                  </span>
                )}
              </button>
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
     <InvitationsPanel isOpen={isInvitationsPanelOpen} />
    </>
  );
};

export default DashboardHeader;
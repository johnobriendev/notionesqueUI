// src/components/dashboard/DashboardHeader.tsx
import React, { useEffect, useState } from 'react';
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
import { useAppAuth } from '../../auth/AuthProvider';

const DashboardHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth0();
  const dispatch = useAppDispatch();
  const pendingInvitations = useAppSelector(selectPendingInvitations);
  const isInvitationsPanelOpen = useAppSelector(selectIsInvitationsPanelOpen);
  const { isAppReady } = useAppAuth();
  
  //  State for mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isAppReady) {
      dispatch(fetchPendingInvitations());
    }
  }, [isAuthenticated, isAppReady, dispatch]);

  const handleLogout = () => {
    dispatch(clearProjects());
    clearPersistedState();
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleOpenInvitations = () => {
    dispatch(openInvitationsPanel());
  };

  //  Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {/* Make logo responsive - smaller on mobile */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Esque</h1>
            </div>

            {isAuthenticated && user && (
              <>
                {/* Desktop navigation - hidden on mobile */}
                <div className="hidden md:flex items-center space-x-3">
                  <button
                    onClick={handleOpenInvitations}
                    className="relative px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Invitations</span>
                    {pendingInvitations.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {pendingInvitations.length}
                      </span>
                    )}
                  </button>
                  {/* Show email only on larger screens */}
                  <div className="hidden lg:block text-sm text-gray-700 mr-2">
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

                {/*  Mobile menu button - visible only on mobile */}
                <div className="md:hidden flex items-center space-x-2">
                  {/* Mobile invitations button - icon only */}
                  <button
                    onClick={handleOpenInvitations}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {pendingInvitations.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {pendingInvitations.length}
                      </span>
                    )}
                  </button>

                  {/* Profile picture */}
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt="Profile"
                      className="h-8 w-8 rounded-full border border-gray-200"
                    />
                  )}

                  {/* Hamburger menu button */}
                  <button
                    onClick={toggleMobileMenu}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/*  Mobile dropdown menu */}
          {isAuthenticated && user && isMobileMenuOpen && (
            <div className="md:hidden mt-4 py-2 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                {/* User email */}
                <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100">
                  {user.email}
                </div>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      <InvitationsPanel isOpen={isInvitationsPanelOpen} />
    </>
  );
};

export default DashboardHeader;
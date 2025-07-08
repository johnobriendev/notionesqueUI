// src/auth/AuthProvider.tsx
// src/auth/AuthProvider.tsx
import React, { useEffect, createContext, useContext, useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { setupAuthInterceptor } from '../lib/api';
import { debugToken } from '../lib/utils';

// ADDITION: Create context for app ready state
interface AuthContextType {
  isAppReady: boolean;
}

const AuthContext = createContext<AuthContextType>({ isAppReady: false });

// ADDITION: Export hook to use the app ready state
export const useAppAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN || '';
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || '';
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE || '';
  const redirectUri = window.location.origin;

  if (!domain || !clientId) {
    console.error('Auth0 configuration is missing. Check your environment variables.');
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: 'openid profile email'
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
    >
      <AuthSetup>{children}</AuthSetup>
    </Auth0Provider>
  );
};

// ENHANCED: AuthSetup now tracks when app is ready
const AuthSetup: React.FC<AuthProviderProps> = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated, user, isLoading } = useAuth0();
  const [isAppReady, setIsAppReady] = useState(false);

  // Setup the auth interceptor for API requests when authenticated
  useEffect(() => {
    const setupAuth = async () => {
      if (isAuthenticated && !isLoading) {
        try {
          // KEEP YOUR EXISTING DEBUG LOGGING
          console.log('User is authenticated, setting up API interceptors');
          
          const getToken = async () => {
            try {
              return await getAccessTokenSilently();
            } catch (error) {
              console.error('Error getting access token:', error);
              return undefined;
            }
          };

          const getUserInfo = () => user;

          // KEEP YOUR EXISTING DEBUG
          debugToken(getToken);

          setupAuthInterceptor(getToken, getUserInfo);
          
          // ADDITION: Small delay to ensure interceptor is fully set up
          // This replaces the 500ms delay in ProjectDashboard
          setTimeout(() => {
            setIsAppReady(true);
          }, 50); // Much shorter than your 500ms
          
        } catch (error) {
          console.error('Error setting up auth:', error);
          setIsAppReady(true); // Still set ready to avoid infinite loading
        }
      } else if (!isLoading && !isAuthenticated) {
        // ADDITION: Not authenticated but auth is done loading
        setIsAppReady(true);
      } else {
        // ADDITION: Reset when auth state changes
        setIsAppReady(false);
      }
    };

    setupAuth();
  }, [isAuthenticated, isLoading, getAccessTokenSilently, user]);

  return (
    <AuthContext.Provider value={{ isAppReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
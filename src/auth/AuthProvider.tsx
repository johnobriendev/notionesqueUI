// src/auth/AuthProvider.tsx
import React, { useEffect } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { setupAuthInterceptor } from '../lib/api';
import { debugToken } from '../lib/utils';


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


// New component to handle API interceptors and auth setup
const AuthSetup: React.FC<AuthProviderProps> = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();

  // Setup the auth interceptor for API requests when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      //console.log('User is authenticated, checking Auth0 config');
      //console.log('Frontend Auth0 Config:');
      //console.log('- Domain:', import.meta.env.VITE_AUTH0_DOMAIN);
      //console.log('- Audience:', import.meta.env.VITE_AUTH0_AUDIENCE);
      //console.log('- Client ID:', import.meta.env.VITE_AUTH0_CLIENT_ID ? 'Set (hidden)' : 'Not set');
      //console.log('User object has email:', !!user?.email);

      const getToken = async () => {
        try {
          return await getAccessTokenSilently();
        } catch (error) {
          console.error('Error getting access token:', error);
          return undefined;
        }
      };

      const getUserInfo = () => user;


      debugToken(getToken);

      setupAuthInterceptor(getToken, getUserInfo);
    }
  }, [isAuthenticated, getAccessTokenSilently, user]);

  return <>{children}</>;
};


export default AuthProvider;
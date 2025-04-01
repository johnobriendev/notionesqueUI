// src/auth/AuthProvider.tsx
import React, {useEffect} from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { setupAuthInterceptor } from '../services/api';


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
    >
      <AuthSetup>{children}</AuthSetup>
    </Auth0Provider>
  );
};


// New component to handle API interceptors and auth setup
const AuthSetup: React.FC<AuthProviderProps> = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  // Setup the auth interceptor for API requests when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const getToken = async () => {
        try {
          return await getAccessTokenSilently({
            authorizationParams: {
              // You can specify additional params here if needed
            }
          });
        } catch (error) {
          console.error('Error getting access token:', error);
          return undefined;
        }
      };

      setupAuthInterceptor(getToken);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return <>{children}</>;
};


export default AuthProvider;
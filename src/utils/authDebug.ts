// src/utils/authDebug.ts

export const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const debugToken = async (getToken: () => Promise<string | undefined>) => {
  try {
    console.log('Attempting to get token...');
    const token = await getToken();
    
    if (!token) {
      console.error('No token received');
      return;
    }
    
    console.log('Token received (first 10 chars):', token.substring(0, 10) + '...');
    
    // Decode and log the token payload
    const payload = decodeJwt(token);
    console.log('Token payload:', payload);
    
    // Check important claims
    if (payload) {
      console.log('Token audience:', payload.aud);
      console.log('Token subject (user id):', payload.sub);
      console.log('Token expiration:', new Date(payload.exp * 1000).toISOString());
      
      // Check if token has email
      if (payload.email) {
        console.log('Token has email claim:', payload.email);
      } else {
        console.warn('Token does not have an email claim!');
      }
    }
    
    return payload;
  } catch (error) {
    console.error('Error debugging token:', error);
  }
};
import { tokenManager } from "./token-manager";

interface JWTPayload {
  username: string;
  email: string;
  role: string;
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    // Client-side JWT parsing (without verification - verification happens on server)
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error('Invalid token format');
      return null;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    
    
    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export function getCurrentUser(): { username: string; isAuthenticated: boolean } {
  const token = tokenManager.get();
  
  if (!token) {
    return { username: '', isAuthenticated: false };
  }

  const payload = decodeJWT(token);
  
  return { username: payload?.username || '', isAuthenticated: true };
}

// export function isTokenValid(): boolean {
//   const token = tokenManager.get();
  
//   if (!token) return false;
  
//   const payload = decodeJWT(token);
//   return payload ? Date.now() < payload.exp * 1000 : false;
// }

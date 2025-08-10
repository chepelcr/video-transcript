import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

// Cognito configuration
const poolData = {
  UserPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID!,
  ClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID!,
};

if (!poolData.UserPoolId || !poolData.ClientId) {
  throw new Error('Missing Cognito configuration. Please set VITE_AWS_COGNITO_USER_POOL_ID and VITE_AWS_COGNITO_CLIENT_ID');
}

const userPool = new CognitoUserPool(poolData);

export interface LoginResult {
  user: CognitoUser;
  session: CognitoUserSession;
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export class CognitoAuthService {
  /**
   * Register a new user
   */
  static async register(userData: RegisterData): Promise<{ user: CognitoUser; needsVerification: boolean }> {
    return new Promise((resolve, reject) => {
      console.log('🔐 Registering user with Cognito:', userData.username);

      const attributeList: CognitoUserAttribute[] = [
        new CognitoUserAttribute({ Name: 'email', Value: userData.email }),
      ];

      if (userData.firstName) {
        attributeList.push(new CognitoUserAttribute({ Name: 'given_name', Value: userData.firstName }));
      }

      if (userData.lastName) {
        attributeList.push(new CognitoUserAttribute({ Name: 'family_name', Value: userData.lastName }));
      }

      userPool.signUp(
        userData.username,
        userData.password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            console.error('Cognito registration error:', err);
            reject(new Error(err.message || 'Registration failed'));
            return;
          }

          console.log('✅ Cognito registration successful:', result?.user.getUsername());
          
          resolve({
            user: result!.user,
            needsVerification: !result!.userConfirmed,
          });
        }
      );
    });
  }

  /**
   * Login user with Cognito
   */
  static async login(username: string, password: string): Promise<LoginResult> {
    return new Promise((resolve, reject) => {
      console.log('🔐 Authenticating with Cognito:', username);

      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session: CognitoUserSession) => {
          console.log('✅ Cognito authentication successful');
          
          resolve({
            user: cognitoUser,
            session,
            accessToken: session.getAccessToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken(),
            idToken: session.getIdToken().getJwtToken(),
          });
        },
        onFailure: (err) => {
          console.error('Cognito authentication error:', err);
          reject(new Error(err.message || 'Authentication failed'));
        },
        newPasswordRequired: (userAttributes) => {
          console.log('New password required for user:', userAttributes);
          reject(new Error('New password required. Please contact support.'));
        },
      });
    });
  }

  /**
   * Refresh session using refresh token
   */
  static async refreshSession(): Promise<CognitoUserSession | null> {
    return new Promise((resolve) => {
      const currentUser = userPool.getCurrentUser();
      
      if (!currentUser) {
        resolve(null);
        return;
      }

      currentUser.getSession((err: any, session: CognitoUserSession) => {
        if (err) {
          console.error('Session refresh error:', err);
          resolve(null);
          return;
        }

        if (session && session.isValid()) {
          console.log('✅ Cognito session refreshed');
          resolve(session);
        } else {
          console.log('❌ Invalid Cognito session');
          resolve(null);
        }
      });
    });
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<CognitoUserSession | null> {
    return new Promise((resolve) => {
      const currentUser = userPool.getCurrentUser();
      
      if (!currentUser) {
        resolve(null);
        return;
      }

      currentUser.getSession((err: any, session: CognitoUserSession) => {
        if (err) {
          console.error('Get session error:', err);
          resolve(null);
          return;
        }

        resolve(session && session.isValid() ? session : null);
      });
    });
  }

  /**
   * Logout user
   */
  static logout(): void {
    console.log('🔐 Logging out from Cognito');
    
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
    
    // Clear any stored tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
  }

  /**
   * Get current user
   */
  static getCurrentUser(): CognitoUser | null {
    return userPool.getCurrentUser();
  }

  /**
   * Extract user info from ID token
   */
  static extractUserFromIdToken(idToken: string): any {
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      return {
        sub: payload.sub,
        username: payload['cognito:username'],
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        emailVerified: payload.email_verified,
      };
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  }
}

export default CognitoAuthService;
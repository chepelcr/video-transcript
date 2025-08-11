import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminUpdateUserAttributesCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  clientId: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface CognitoUser {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  sub: string;
  emailVerified?: boolean;
}

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  
  constructor(private config: CognitoConfig) {
    this.client = new CognitoIdentityProviderClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Create a new user in Cognito with verified email
   */
  async createUser(
    username: string,
    email: string,
    temporaryPassword: string,
    firstName?: string,
    lastName?: string
  ): Promise<CognitoUser> {
    try {
      console.log(`🔐 Creating Cognito user: ${username}`);

      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' }, // Pre-verify emails
      ];

      if (firstName) {
        userAttributes.push({ Name: 'given_name', Value: firstName });
      }

      if (lastName) {
        userAttributes.push({ Name: 'family_name', Value: lastName });
      }

      // Create user in Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        UserAttributes: userAttributes,
        TemporaryPassword: temporaryPassword,
        MessageAction: 'SUPPRESS', // Don't send welcome email - we handle verification
      });

      const createResult = await this.client.send(createUserCommand);
      
      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        Password: temporaryPassword,
        Permanent: true,
      });

      await this.client.send(setPasswordCommand);

      console.log(`✅ Cognito user created: ${username}`);

      return {
        username,
        email,
        firstName,
        lastName,
        sub: createResult.User?.Attributes?.find(attr => attr.Name === 'sub')?.Value || `cognito-${username}`,
      };

    } catch (error: any) {
      console.error('Error creating Cognito user:', error);
      throw new Error(`Failed to create Cognito user: ${error.message}`);
    }
  }

  /**
   * Update user attributes in Cognito
   */
  async updateUserAttributes(
    username: string,
    attributes: { [key: string]: string }
  ): Promise<void> {
    try {
      console.log(`🔐 Updating Cognito user attributes: ${username}`);

      const userAttributes = Object.entries(attributes).map(([key, value]) => ({
        Name: key,
        Value: value,
      }));

      const updateCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        UserAttributes: userAttributes,
      });

      await this.client.send(updateCommand);

      console.log(`✅ Cognito user attributes updated: ${username}`);

    } catch (error: any) {
      console.error('Error updating Cognito user attributes:', error);
      throw new Error(`Failed to update Cognito user: ${error.message}`);
    }
  }

  /**
   * Get user data from Cognito by user ID
   */
  async getUser(userId: string): Promise<CognitoUser | null> {
    try {
      console.log(`🔍 Getting Cognito user data for: ${userId.substring(0, 8)}...`);

      const command = new AdminGetUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: userId,
      });

      const result = await this.client.send(command);
      
      if (!result.UserAttributes) {
        console.log(`❌ No user attributes found for: ${userId.substring(0, 8)}...`);
        return null;
      }

      // Extract user attributes
      const getAttribute = (name: string) => 
        result.UserAttributes?.find(attr => attr.Name === name)?.Value;

      const email = getAttribute('email') || '';
      const firstName = getAttribute('given_name');
      const lastName = getAttribute('family_name');
      const sub = getAttribute('sub') || userId;
      const emailVerified = getAttribute('email_verified') === 'true';
      const customUsername = getAttribute('custom:username');

      const userData = {
        username: customUsername || email.split('@')[0], // Use custom username or fallback to email prefix
        email,
        firstName,
        lastName,
        sub,
        emailVerified,
      };

      console.log(`✅ Retrieved Cognito user: ${userData.username} (${email})`);
      return userData;

    } catch (error: any) {
      console.error('Error getting Cognito user:', error);
      // Return null instead of throwing to handle non-existent users gracefully
      return null;
    }
  }

  /**
   * Initiate password reset for a user
   */
  async initiatePasswordReset(email: string): Promise<void> {
    try {
      console.log(`🔑 Initiating password reset for: ${email}`);

      const command = new ForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: email,
      });

      await this.client.send(command);
      console.log(`✅ Password reset initiated for: ${email}`);
    } catch (error: any) {
      console.error('🚨 Error initiating password reset:', error);
      throw new Error(`Failed to initiate password reset: ${error.message}`);
    }
  }

  /**
   * Confirm password reset with verification code
   */
  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
    try {
      console.log(`🔐 Confirming password reset for: ${email}`);

      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      });

      await this.client.send(command);
      console.log(`✅ Password reset confirmed for: ${email}`);
    } catch (error: any) {
      console.error('🚨 Error confirming password reset:', error);
      throw new Error(`Failed to confirm password reset: ${error.message}`);
    }
  }

  /**
   * Verify JWT token format (basic validation)
   */
  validateTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      return parts.length === 3;
    } catch {
      return false;
    }
  }

  /**
   * Extract user info from Cognito JWT (without verification - API Gateway handles this)
   */
  extractUserFromToken(token: string): { sub: string; username?: string; email?: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      return {
        sub: payload.sub,
        username: payload['cognito:username'] || payload.username,
        email: payload.email,
      };
    } catch {
      return null;
    }
  }
}

// Factory function to create Cognito service
export function createCognitoService(): CognitoService {
  const config: CognitoConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    userPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
    clientId: process.env.AWS_COGNITO_CLIENT_ID!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  };

  if (!config.userPoolId || !config.clientId || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error('Missing required AWS Cognito configuration. Please set AWS_COGNITO_USER_POOL_ID, AWS_COGNITO_CLIENT_ID, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY');
  }

  return new CognitoService(config);
}
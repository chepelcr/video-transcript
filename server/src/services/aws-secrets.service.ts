import AWS from 'aws-sdk';
import { APP_CONFIG } from '../config/app';

export interface DatabaseCredentials {
  username: string;
  password: string;
  engine: string;
  host: string;
  port: string;
  dbname: string;
}

export interface SMTPCredentials {
  host: string;
  port: string;
  user: string;
  password: string;
}

export interface IAWSSecretsService {
  getDatabaseCredentials(): Promise<DatabaseCredentials>;
  getSMTPCredentials(): Promise<SMTPCredentials>;
}

export class AWSSecretsService implements IAWSSecretsService {
  private secretsManager: AWS.SecretsManager;

  constructor() {
    // Configure AWS
    AWS.config.update({
      region: APP_CONFIG.AWS_REGION,
      accessKeyId: APP_CONFIG.AWS_ACCESS_KEY_ID,
      secretAccessKey: APP_CONFIG.AWS_SECRET_ACCESS_KEY
    });

    this.secretsManager = new AWS.SecretsManager();
  }

  async getDatabaseCredentials(): Promise<DatabaseCredentials> {
    const secretName = 'dev/video-transcript/db';
    
    try {
      console.log(`🔐 Retrieving database credentials from AWS Secrets Manager: ${secretName}`);
      
      const result = await this.secretsManager.getSecretValue({
        SecretId: secretName
      }).promise();

      if (!result.SecretString) {
        throw new Error('Secret string not found in AWS Secrets Manager response');
      }

      const credentials = JSON.parse(result.SecretString) as DatabaseCredentials;
      
      // Validate required fields
      this.validateDatabaseCredentials(credentials);
      
      console.log(`✅ Database credentials retrieved successfully from AWS Secrets Manager`);
      console.log(`   Host: ${credentials.host}`);
      console.log(`   Database: ${credentials.dbname}`);
      console.log(`   Username: ${credentials.username}`);
      
      return credentials;
      
    } catch (error: any) {
      console.error(`❌ Failed to retrieve database credentials from AWS Secrets Manager:`, error);
      throw new Error(`Failed to retrieve database credentials: ${error.message}`);
    }
  }

  async getSMTPCredentials(): Promise<SMTPCredentials> {
    const secretName = 'dev/FrontEnd/ses';
    
    try {
      console.log(`📧 Retrieving SMTP credentials from AWS Secrets Manager: ${secretName}`);
      
      const result = await this.secretsManager.getSecretValue({
        SecretId: secretName
      }).promise();

      if (!result.SecretString) {
        throw new Error('Secret string not found in AWS Secrets Manager response');
      }

      const credentials = JSON.parse(result.SecretString) as SMTPCredentials;
      
      // Validate required fields
      this.validateSMTPCredentials(credentials);
      
      console.log(`✅ SMTP credentials retrieved successfully from AWS Secrets Manager`);
      console.log(`   Host: ${credentials.host}`);
      console.log(`   Port: ${credentials.port}`);
      console.log(`   User: ${credentials.user}`);
      
      return credentials;
      
    } catch (error: any) {
      console.error(`❌ Failed to retrieve SMTP credentials from AWS Secrets Manager:`, error);
      throw new Error(`Failed to retrieve SMTP credentials: ${error.message}`);
    }
  }

  private validateDatabaseCredentials(credentials: any): asserts credentials is DatabaseCredentials {
    const required = ['username', 'password', 'engine', 'host', 'port', 'dbname'];
    
    for (const field of required) {
      if (!credentials[field]) {
        throw new Error(`Missing required database credential field: ${field}`);
      }
    }
    
    // Validate engine
    if (credentials.engine !== 'postgres') {
      throw new Error(`Unsupported database engine: ${credentials.engine}. Expected 'postgres'`);
    }
    
    // Validate port is a number
    if (isNaN(parseInt(credentials.port))) {
      throw new Error(`Invalid port number: ${credentials.port}`);
    }
  }

  private validateSMTPCredentials(credentials: any): asserts credentials is SMTPCredentials {
    const required = ['host', 'port', 'user', 'password'];
    
    for (const field of required) {
      if (!credentials[field]) {
        throw new Error(`Missing required SMTP credential field: ${field}`);
      }
    }
    
    // Validate port is a number
    if (isNaN(parseInt(credentials.port))) {
      throw new Error(`Invalid port number: ${credentials.port}`);
    }
  }
}
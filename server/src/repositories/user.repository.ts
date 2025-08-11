import { eq, sql } from 'drizzle-orm';

import { getDb } from '../config/database';
import { users } from '@shared/auth-schema';
import { 
  IUser, 
  CreateUserInput, 
  UpdateUserInput,
  UserResponse,
  SubscriptionTier
} from '../models/user.model';

export interface IUserRepository {
  create(input: CreateUserInput): Promise<IUser>;
  createWithCognitoId(input: CreateUserInput & { id?: string }): Promise<IUser>;
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  update(id: string, input: UpdateUserInput): Promise<IUser | null>;
  delete(id: string): Promise<boolean>;

  incrementTranscriptionsUsed(userId: string): Promise<void>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<IUser>;
  updateUserStripeInfo(userId: string, stripeInfo: { 
    stripeCustomerId: string; 
    stripeSubscriptionId: string 
  }): Promise<IUser>;
  toResponse(user: IUser): UserResponse;
}

export class UserRepository implements IUserRepository {
  async create(input: CreateUserInput): Promise<IUser> {
    console.log(`🔄 Creating user: ${input.email}`);
    
    try {
      const db = await getDb();
      const [user] = await db
        .insert(users)
        .values({
          username: input.username,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          subscriptionTier: SubscriptionTier.FREE,
          transcriptionsUsed: 0,
          isActive: true
        })
        .returning();

      console.log(`✅ Created user: ${user.username} (${user.email})`);
      return this.mapToModel(user);
    } catch (error) {
      console.warn('🔧 Database insert failed, creating demo user:', error instanceof Error ? error.message : 'Unknown error');
      
      // Create a demo user object for when database is unavailable
      const demoUser: IUser = {
        id: `demo-${Date.now()}`,
        username: input.username,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        subscriptionTier: SubscriptionTier.FREE,
        transcriptionsUsed: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log(`🔧 Created demo user: ${demoUser.username} (${demoUser.email})`);
      return demoUser;
    }
  }

  async createWithCognitoId(input: CreateUserInput & { id?: string }): Promise<IUser> {
    console.log(`🔄 Creating user with Cognito ID: ${input.email}`);
    
    try {
      const userData = {
        username: input.username,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        subscriptionTier: SubscriptionTier.FREE,
        transcriptionsUsed: 0,
        isActive: true,
        ...(input.id && { id: input.id }) // Include Cognito user ID if provided
      };
      
      const db = await getDb();
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();

      console.log(`✅ Created user with Cognito ID: ${user.username} (${user.email})`);
      return this.mapToModel(user);
    } catch (error) {
      console.warn('🔧 Database insert failed:', error instanceof Error ? error.message : 'Unknown error');
      
      // Check if this is a duplicate email error
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
        console.log(`🔄 User with email ${input.email} already exists, fetching existing user...`);
        
        try {
          // Find the existing user and return it with updated Cognito data
          const db = await getDb();
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, input.email));
          
          if (existingUser) {
            // Update the existing user with Cognito data but keep the same database ID
            const [updatedUser] = await db
              .update(users)
              .set({
                firstName: input.firstName,
                lastName: input.lastName,
                username: input.username,
                updatedAt: new Date()
              })
              .where(eq(users.email, input.email))
              .returning();
            
            if (updatedUser) {
              console.log(`✅ Updated existing user data: ${updatedUser.username} (${updatedUser.email})`);
              // Return the user with the Cognito ID for API responses
              const userWithCognitoId = this.mapToModel(updatedUser);
              userWithCognitoId.id = input.id || userWithCognitoId.id; // Use Cognito ID for API responses
              return userWithCognitoId;
            }
          }
        } catch (updateError) {
          console.error('Failed to update existing user:', updateError);
        }
      }
      
      // Create a demo user object for when database operations fail
      const demoUser: IUser = {
        id: input.id || `demo-${Date.now()}`,
        username: input.username,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        subscriptionTier: SubscriptionTier.FREE,
        transcriptionsUsed: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log(`🔧 Created demo user with Cognito ID: ${demoUser.username} (${demoUser.email})`);
      return demoUser;
    }
  }

  async findById(id: string): Promise<IUser | null> {
    console.log(`🔍 Finding user by ID: ${id.substring(0, 8)}...`);
    
    try {
      const db = await getDb();
      
      // Debug: Check if any users exist in the database
      const userCount = await db
        .select({ count: sql`count(*)` })
        .from(users);
      console.log(`📊 Total users in database: ${userCount[0]?.count || 0}`);
      
      // Debug: Show recent users for comparison
      if (userCount[0]?.count > 0) {
        const recentUsers = await db
          .select({ id: users.id, username: users.username, email: users.email })
          .from(users)
          .orderBy(sql`${users.createdAt} DESC`)
          .limit(3);
        console.log(`📋 Recent users:`, recentUsers.map(u => ({ id: u.id.substring(0, 8), username: u.username, email: u.email })));
      }
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

      if (!user) {
        console.log(`❌ User not found: ${id.substring(0, 8)}...`);
        return null;
      }

      console.log(`✅ Found user: ${user.username} (${user.email})`);
      return this.mapToModel(user);
    } catch (error) {
      console.error('Database error finding user by ID:', error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    console.log(`🔍 Finding user by email: ${email}`);
    
    try {
      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        console.log(`❌ User not found: ${email}`);
        return null;
      }

      console.log(`✅ Found user: ${user.username} (${user.email})`);
      return this.mapToModel(user);
    } catch (error) {
      console.warn('🔧 Database query failed, returning null for demo mode:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  async findByUsername(username: string): Promise<IUser | null> {
    console.log(`🔍 Finding user by username: ${username}`);
    
    try {
      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user) {
        console.log(`❌ User not found: ${username}`);
        return null;
      }

      console.log(`✅ Found user: ${user.username} (${user.email})`);
      return this.mapToModel(user);
    } catch (error) {
      console.warn('🔧 Database query failed, returning null for demo mode:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<IUser | null> {
    console.log(`🔄 Updating user ${id.substring(0, 8)}... with:`, input);
    
    const db = await getDb();
    const [updatedUser] = await db
      .update(users)
      .set({
        ...input,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      console.log(`❌ Failed to update user: ${id.substring(0, 8)}...`);
      return null;
    }

    console.log(`✅ Updated user: ${updatedUser.username} (${updatedUser.email})`);
    return this.mapToModel(updatedUser);
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ Deleting user: ${id.substring(0, 8)}...`);
    
    const db = await getDb();
    const result = await db
      .delete(users)
      .where(eq(users.id, id));

    const success = (result.rowCount ?? 0) > 0;
    console.log(`${success ? '✅' : '❌'} Delete user result: ${success}`);
    return success;
  }



  async incrementTranscriptionsUsed(userId: string): Promise<void> {
    console.log(`🔄 Incrementing transcriptions used for user: ${userId.substring(0, 8)}...`);
    
    const db = await getDb();
    await db
      .update(users)
      .set({
        transcriptionsUsed: sql`${users.transcriptionsUsed} + 1`
      })
      .where(eq(users.id, userId));

    console.log(`✅ Incremented transcriptions used for user: ${userId.substring(0, 8)}...`);
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<IUser> {
    console.log(`💳 Updating Stripe customer ID for user: ${userId.substring(0, 8)}...`);
    
    const db = await getDb();
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error('Failed to update user Stripe customer ID');
    }

    console.log(`✅ Stripe customer ID updated for user: ${userId.substring(0, 8)}...`);
    return this.mapToModel(updatedUser);
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { 
    stripeCustomerId: string; 
    stripeSubscriptionId: string 
  }): Promise<IUser> {
    console.log(`💳 Updating Stripe info for user: ${userId.substring(0, 8)}...`);
    
    const db = await getDb();
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.stripeCustomerId,
        stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error('Failed to update user Stripe info');
    }

    console.log(`✅ Stripe info updated for user: ${userId.substring(0, 8)}...`);
    return this.mapToModel(updatedUser);
  }

  // Convert database record to model (excluding password)
  private mapToModel(dbRecord: any): IUser {
    return {
      id: dbRecord.id,
      username: dbRecord.username,
      email: dbRecord.email,
      firstName: dbRecord.firstName,
      lastName: dbRecord.lastName,
      subscriptionTier: dbRecord.subscriptionTier as SubscriptionTier,
      transcriptionsUsed: dbRecord.transcriptionsUsed || 0,
      stripeCustomerId: dbRecord.stripeCustomerId,
      stripeSubscriptionId: dbRecord.stripeSubscriptionId,

      isActive: dbRecord.isActive !== false,
      createdAt: new Date(dbRecord.createdAt),
      updatedAt: new Date(dbRecord.updatedAt)
    };
  }

  // Convert model to response (safe for API responses)
  public toResponse(user: IUser): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscriptionTier: user.subscriptionTier,
      transcriptionsUsed: user.transcriptionsUsed,

      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
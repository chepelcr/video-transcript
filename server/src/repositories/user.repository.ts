import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
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
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  update(id: string, input: UpdateUserInput): Promise<IUser | null>;
  delete(id: string): Promise<boolean>;
  verifyPassword(user: IUser, password: string): Promise<boolean>;
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
    
    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12);
    
    const [user] = await db
      .insert(users)
      .values({
        username: input.username,
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        subscriptionTier: SubscriptionTier.FREE,
        transcriptionsUsed: 0,
        isEmailVerified: false,
        isActive: true
      })
      .returning();

    console.log(`✅ Created user: ${user.username} (${user.email})`);
    return this.mapToModel(user);
  }

  async findById(id: string): Promise<IUser | null> {
    console.log(`🔍 Finding user by ID: ${id.substring(0, 8)}...`);
    
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
  }

  async findByEmail(email: string): Promise<IUser | null> {
    console.log(`🔍 Finding user by email: ${email}`);
    
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
  }

  async findByUsername(username: string): Promise<IUser | null> {
    console.log(`🔍 Finding user by username: ${username}`);
    
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
  }

  async update(id: string, input: UpdateUserInput): Promise<IUser | null> {
    console.log(`🔄 Updating user ${id.substring(0, 8)}... with:`, {
      ...input,
      password: input.password ? '[HIDDEN]' : undefined
    });
    
    const updateData: any = { ...input };
    
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
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
    
    const result = await db
      .delete(users)
      .where(eq(users.id, id));

    const success = (result.rowCount ?? 0) > 0;
    console.log(`${success ? '✅' : '❌'} Delete user result: ${success}`);
    return success;
  }

  async verifyPassword(user: IUser, password: string): Promise<boolean> {
    // Get the user with password from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));

    if (!dbUser || !dbUser.password) {
      return false;
    }

    return bcrypt.compare(password, dbUser.password);
  }

  async incrementTranscriptionsUsed(userId: string): Promise<void> {
    console.log(`🔄 Incrementing transcriptions used for user: ${userId.substring(0, 8)}...`);
    
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
      isEmailVerified: dbRecord.isEmailVerified || false,
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
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
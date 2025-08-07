import { eq, and, desc, gt, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  users, 
  transcriptions, 
  refreshTokens,
  type User,
  type InsertUser,
  type Transcription,
  type InsertTranscription,
  type RefreshToken,
  type InsertRefreshToken
} from '@shared/auth-schema';

// User operations
export class AuthStorage {
  // Create user
  async createUser(userData: Omit<InsertUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || null;
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || null;
  }

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user || null;
  }

  // Update user
  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  // Verify email
  async verifyUserEmail(email: string, code: string): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ 
        isEmailVerified: true, 
        emailVerificationCode: null,
        emailVerificationExpires: null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(users.email, email),
          eq(users.emailVerificationCode, code),
          gt(users.emailVerificationExpires, new Date())
        )
      )
      .returning();
    return user || null;
  }

  // Increment transcriptions used
  async incrementTranscriptionsUsed(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        transcriptionsUsed: sql`transcriptions_used + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Transcription operations
  async createTranscription(transcriptionData: Omit<InsertTranscription, 'id' | 'createdAt'>): Promise<Transcription> {
    const [transcription] = await db
      .insert(transcriptions)
      .values(transcriptionData)
      .returning();
    return transcription;
  }

  // Get user transcriptions with pagination
  async getUserTranscriptions(userId: string, limit: number = 10, offset: number = 0): Promise<{
    transcriptions: Transcription[];
    total: number;
  }> {
    const [transcriptionsResult, countResult] = await Promise.all([
      db
        .select()
        .from(transcriptions)
        .where(eq(transcriptions.userId, userId))
        .orderBy(desc(transcriptions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transcriptions)
        .where(eq(transcriptions.userId, userId))
    ]);

    return {
      transcriptions: transcriptionsResult,
      total: countResult[0]?.count || 0
    };
  }

  // Get transcription by ID
  async getTranscriptionById(id: string, userId: string): Promise<Transcription | null> {
    const [transcription] = await db
      .select()
      .from(transcriptions)
      .where(
        and(
          eq(transcriptions.id, id),
          eq(transcriptions.userId, userId)
        )
      );
    return transcription || null;
  }

  // Refresh token operations
  async createRefreshToken(tokenData: Omit<InsertRefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken> {
    const [token] = await db
      .insert(refreshTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  // Get refresh token
  async getRefreshToken(token: string): Promise<RefreshToken | null> {
    const [refreshToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          gt(refreshTokens.expiresAt, new Date())
        )
      );
    return refreshToken || null;
  }

  // Delete refresh token
  async deleteRefreshToken(token: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.token, token));
  }

  // Delete all user refresh tokens
  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, userId));
  }

  // Clean expired refresh tokens
  async cleanExpiredRefreshTokens(): Promise<void> {
    await db
      .delete(refreshTokens)
      .where(sql`expires_at < NOW()`);
  }
}

export const authStorage = new AuthStorage();
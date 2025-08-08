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

  // Set password reset token
  async setPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.email, email))
      .returning();
    return user || null;
  }

  // Get user by password reset token
  async getUserByResetToken(token: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpires, new Date())
        )
      );
    return user || null;
  }

  // Reset password using token
  async resetPassword(token: string, newPasswordHash: string): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({
        password: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpires, new Date())
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
  async createTranscription(transcriptionData: any): Promise<Transcription> {
    console.log('Creating transcription with data:', transcriptionData);
    
    const result = await db.execute(sql`
      INSERT INTO transcriptions (user_id, video_url, video_title, status)
      VALUES (${transcriptionData.userId}, ${transcriptionData.videoUrl}, ${transcriptionData.videoTitle || null}, ${transcriptionData.status || 'processing'})
      RETURNING id, user_id as "userId", video_url as "videoUrl", video_title as "videoTitle", 
               transcript, status, duration, word_count as "wordCount", 
               processing_time as "processingTime", accuracy, created_at as "createdAt"
    `);
    
    console.log('Created transcription result:', result);
    const transcription = result.rows[0] as Transcription;
    console.log('Returning transcription:', transcription);
    return transcription;
  }

  // Get user transcriptions with pagination
  async getUserTranscriptions(userId: string, limit: number = 10, offset: number = 0): Promise<{
    transcriptions: Transcription[];
    total: number;
  }> {
    try {
      const [transcriptionsResult, countResult] = await Promise.all([
        db.execute(sql`
          SELECT id, user_id as "userId", video_url as "videoUrl", video_title as "videoTitle", 
                 transcript, status, duration, word_count as "wordCount", 
                 processing_time as "processingTime", accuracy, created_at as "createdAt"
          FROM transcriptions 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC 
          LIMIT ${limit} OFFSET ${offset}
        `),
        db.execute(sql`
          SELECT COUNT(*) as count 
          FROM transcriptions 
          WHERE user_id = ${userId}
        `)
      ]);

      return {
        transcriptions: transcriptionsResult.rows as Transcription[],
        total: parseInt((countResult.rows[0] as any)?.count || '0')
      };
    } catch (error) {
      console.error('Get transcriptions error:', error);
      throw new Error('Failed to get transcriptions');
    }
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

  // Get transcription by ID (without user restriction)
  async getTranscription(id: string): Promise<Transcription | null> {
    const [transcription] = await db
      .select()
      .from(transcriptions)
      .where(eq(transcriptions.id, id));
    return transcription || null;
  }

  // Update transcription  
  async updateTranscription(id: string, updates: Partial<Transcription>): Promise<Transcription | null> {
    try {
      console.log('Updating transcription with:', { id, updates });
      
      // Simple direct SQL update for status
      if (updates.status && Object.keys(updates).length === 1) {
        const result = await db.execute(sql`
          UPDATE transcriptions 
          SET status = ${updates.status}
          WHERE id = ${id} 
          RETURNING *
        `);
        console.log('SQL update result:', result);
        return result.rows[0] as Transcription || null;
      }
      
      // For multiple fields, use Drizzle ORM
      const [transcription] = await db
        .update(transcriptions)
        .set(updates)
        .where(eq(transcriptions.id, id))
        .returning();
      return transcription || null;
    } catch (error) {
      console.error('Update transcription error:', error);
      throw error;
    }
  }

  // Increment user transcriptions (alias for incrementTranscriptionsUsed)
  async incrementUserTranscriptions(userId: string): Promise<void> {
    return this.incrementTranscriptionsUsed(userId);
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
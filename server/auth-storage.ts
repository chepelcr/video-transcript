import { eq, and, desc, gt, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  transcriptions,
  refreshTokens,
  type User,
  type InsertUser,
  type Transcription,
  type InsertTranscription,
  type RefreshToken,
  type InsertRefreshToken,
} from "@shared/auth-schema";

// User operations
export class AuthStorage {
  // Create user
  async createUser(
    userData: Omit<InsertUser, "id" | "createdAt" | "updatedAt">,
  ): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  // Update user
  async updateUser(
    id: string,
    updates: Partial<Omit<User, "id" | "createdAt">>,
  ): Promise<User | null> {
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
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.email, email),
          eq(users.emailVerificationCode, code),
          gt(users.emailVerificationExpires, new Date()),
        ),
      )
      .returning();
    return user || null;
  }

  // Set password reset token
  async setPasswordResetToken(
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
        updatedAt: new Date(),
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
          gt(users.passwordResetExpires, new Date()),
        ),
      );
    return user || null;
  }

  // Reset password using token
  async resetPassword(
    token: string,
    newPasswordHash: string,
  ): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({
        password: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpires, new Date()),
        ),
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
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Transcription operations
  async createTranscription(transcriptionData: any): Promise<Transcription> {
    console.log("Creating transcription with data:", transcriptionData);

    const result = await db.execute(sql`
      INSERT INTO transcriptions (user_id, video_url, video_title, status)
      VALUES (${transcriptionData.userId}, ${transcriptionData.videoUrl}, ${transcriptionData.videoTitle || null}, ${transcriptionData.status || "processing"})
      RETURNING id, user_id as "userId", video_url as "videoUrl", video_title as "videoTitle", 
               transcript, status, duration, word_count as "wordCount", 
               processing_time as "processingTime", accuracy, created_at as "createdAt"
    `);

    console.log("Created transcription result:", result);
    const transcription = result.rows[0] as Transcription;
    console.log("Returning transcription:", transcription);
    return transcription;
  }

  // Get user transcriptions with pagination
  async getUserTranscriptions(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{
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
        `),
      ]);

      return {
        transcriptions: transcriptionsResult.rows as Transcription[],
        total: parseInt((countResult.rows[0] as any)?.count || "0"),
      };
    } catch (error) {
      console.error("Get transcriptions error:", error);
      throw new Error("Failed to get transcriptions");
    }
  }

  // Get transcription by ID
  async getTranscriptionById(
    id: string,
    userId: string,
  ): Promise<Transcription | null> {
    const [transcription] = await db
      .select()
      .from(transcriptions)
      .where(and(eq(transcriptions.id, id), eq(transcriptions.userId, userId)));
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
  async updateTranscription(
    id: string,
    updates: Partial<Transcription>,
  ): Promise<Transcription | null> {
    try {
      console.log("🔄 Updating transcription:", {
        id: id.substring(0, 8) + "...",
        updates,
      });

      // Convert frontend field names to database column names using exact schema field names
      const dbUpdates: any = {};

      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
      }
      if (updates.transcript !== undefined) {
        dbUpdates.transcript = updates.transcript;
      }
      if (updates.duration !== undefined) {
        dbUpdates.duration = updates.duration;
      }
      if (updates.wordCount !== undefined) {
        dbUpdates.wordCount = updates.wordCount; // Maps to word_count in schema
      }
      if (updates.accuracy !== undefined) {
        dbUpdates.accuracy = updates.accuracy;
      }
      if (updates.processingTime !== undefined) {
        dbUpdates.processingTime = updates.processingTime; // Maps to processing_time in schema
      }

      if (Object.keys(dbUpdates).length === 0) {
        console.log("❌ No valid update fields provided");
        return null;
      }

      console.log("🔄 Using Drizzle ORM update with:", dbUpdates);
      console.log("🔄 Updating transcription ID:", id);

      try {
        // Execute the update without .returning() to avoid Drizzle issues
        await db
          .update(transcriptions)
          .set(dbUpdates)
          .where(eq(transcriptions.id, id));

        console.log("✅ Drizzle update executed successfully");

        // Fetch the updated record separately using raw SQL with proper field mapping
        const result = await db.execute(sql`
          SELECT id, user_id as "userId", video_url as "videoUrl", video_title as "videoTitle", 
                 transcript, status, duration, word_count as "wordCount", 
                 processing_time as "processingTime", accuracy, created_at as "createdAt"
          FROM transcriptions 
          WHERE id = ${id}
        `);

        const updatedTranscription = result.rows[0] as Transcription;

        if (updatedTranscription) {
          console.log(
            `✅ Transcription ${id.substring(0, 8)}... updated successfully to status: ${updatedTranscription.status}`,
          );
          console.log(
            "✅ Updated data keys:",
            Object.keys(updatedTranscription),
          );
          console.log("✅ Status field debug:", {
            statusValue: updatedTranscription.status,
            statusType: typeof updatedTranscription.status,
            hasStatusKey: "status" in updatedTranscription,
            allFieldsDebug: updatedTranscription,
          });

          // Force the status if it's still undefined
          if (!updatedTranscription.status && dbUpdates.status) {
            console.log(
              "🔧 Forcing status from dbUpdates since fetch returned undefined",
            );
            updatedTranscription.status = dbUpdates.status;
          }

          return updatedTranscription;
        } else {
          console.log(`❌ No transcription found with ID: ${id}`);
          return null;
        }
      } catch (drizzleError) {
        console.error("❌ Drizzle update error:", drizzleError);
        throw drizzleError;
      }
    } catch (error) {
      console.error("❌ Update transcription error:", error);
      throw error;
    }
  }

  // Increment user transcriptions (alias for incrementTranscriptionsUsed)
  async incrementUserTranscriptions(userId: string): Promise<void> {
    return this.incrementTranscriptionsUsed(userId);
  }

  // Refresh token operations
  async createRefreshToken(
    tokenData: Omit<InsertRefreshToken, "id" | "createdAt">,
  ): Promise<RefreshToken> {
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
          gt(refreshTokens.expiresAt, new Date()),
        ),
      );
    return refreshToken || null;
  }

  // Delete refresh token
  async deleteRefreshToken(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  // Delete all user refresh tokens
  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  // Clean expired refresh tokens
  async cleanExpiredRefreshTokens(): Promise<void> {
    await db.delete(refreshTokens).where(sql`expires_at < NOW()`);
  }
}

export const authStorage = new AuthStorage();

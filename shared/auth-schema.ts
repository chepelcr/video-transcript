import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - authentication handled by AWS Cognito
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionTier: text("subscription_tier").default("free"),
  transcriptionsUsed: integer("transcriptions_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("users_email_idx").on(table.email),
]);

// Transcriptions table to track user transcription history
export const transcriptions = pgTable("transcriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  videoUrl: text("video_url").notNull(),
  videoTitle: text("video_title"), // Video title extracted from URL
  transcript: text("transcript"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  duration: integer("duration"), // in seconds
  wordCount: integer("word_count"),
  processingTime: integer("processing_time"), // in seconds  
  accuracy: integer("accuracy"), // percentage
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("transcriptions_user_id_idx").on(table.userId),
  index("transcriptions_created_at_idx").on(table.createdAt),
]);



// Insert and Select schemas for validation (no password - managed by Cognito)
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  username: z.string().min(1),
});

export const selectUserSchema = createSelectSchema(users);

export const insertTranscriptionSchema = createInsertSchema(transcriptions);
export const selectTranscriptionSchema = createSelectSchema(transcriptions);



// API Request/Response types
export const registerRequestSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const verifyEmailRequestSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const createTranscriptionRequestSchema = z.object({
  videoUrl: z.string().url(),
  transcript: z.string(),
  duration: z.number().positive(),
  wordCount: z.number().positive(),
  processingTime: z.number().positive(),
  accuracy: z.number().min(0).max(100),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = typeof transcriptions.$inferInsert;


export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type CreateTranscriptionRequest = z.infer<typeof createTranscriptionRequestSchema>;

// API Response types
export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: string;
  transcriptionsUsed?: number;
  isEmailVerified?: boolean;
  isPro?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TranscriptionHistoryResponse {
  transcriptions: Transcription[];
  total: number;
  page: number;
  limit: number;
}
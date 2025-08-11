import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  emailVerified: boolean("email_verified").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionTier: text("subscription_tier").default("free"), // free, pro, enterprise
  transcriptionsUsed: integer("transcriptions_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transcriptions = pgTable("transcriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  videoUrl: text("video_url").notNull(),
  videoTitle: text("video_title"), // Video title extracted from URL
  transcript: text("transcript"),
  status: text("status").default("processing"), // processing, completed, failed
  duration: numeric("duration", { precision: 10, scale: 2 }), // in seconds with decimals
  wordCount: integer("word_count"),
  processingTime: numeric("processing_time", { precision: 10, scale: 2 }), // in seconds with decimals
  accuracy: numeric("accuracy", { precision: 5, scale: 2 }), // transcription accuracy percentage with decimals
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // transcription_completed, transcription_failed, system, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id"), // e.g., transcription ID for transcription notifications
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firstName: true,
  lastName: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  username: true,
  firstName: true,
  lastName: true,
});

export const insertTranscriptionSchema = createInsertSchema(transcriptions).pick({
  videoUrl: true,
  videoTitle: true,
  userId: true,
  status: true,
}).extend({
  videoTitle: z.string().optional(),
  status: z.string().optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  relatedId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type User = typeof users.$inferSelect;
export type InsertTranscription = z.infer<typeof insertTranscriptionSchema>;
export type Transcription = typeof transcriptions.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

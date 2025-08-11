import { z } from 'zod';

// User subscription tiers
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// Base user interface
export interface IUser {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  subscriptionTier: SubscriptionTier;
  transcriptionsUsed: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create user input (password managed by AWS Cognito)
export interface CreateUserInput {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Update user input
export interface UpdateUserInput {
  username?: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: SubscriptionTier;
  transcriptionsUsed?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  isActive?: boolean;
}

// User response (without sensitive data)
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  subscriptionTier: SubscriptionTier;
  transcriptionsUsed: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication input (passwords managed by AWS Cognito)
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Validation schemas (passwords validated by AWS Cognito)
export const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  subscriptionTier: z.nativeEnum(SubscriptionTier).optional(),
  isActive: z.boolean().optional()
});
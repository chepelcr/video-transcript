import { z } from 'zod';

// Transcription status enum
export enum TranscriptionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Base transcription interface
export interface ITranscription {
  id: string;
  userId: string | null; // Allow null for anonymous transcriptions
  videoUrl: string;
  videoTitle?: string | null;
  transcript?: string | null;
  status: TranscriptionStatus;
  duration?: number | null;
  wordCount?: number | null;
  processingTime?: number | null;
  accuracy?: number | null;
  createdAt: Date;
  updatedAt?: Date;
  result?: any; // For backwards compatibility
}

// Create transcription input
export interface CreateTranscriptionInput {
  userId: string | null; // Allow null for anonymous transcriptions
  videoUrl: string;
  videoTitle?: string;
  status?: TranscriptionStatus;
}

// Update transcription input
export interface UpdateTranscriptionInput {
  transcript?: string;
  status?: TranscriptionStatus;
  duration?: number;
  wordCount?: number;
  processingTime?: number;
  accuracy?: number;
}

// Transcription query options
export interface TranscriptionQueryOptions {
  userId?: string;
  status?: TranscriptionStatus;
  limit?: number;
  offset?: number;
}

// Validation schemas
export const createTranscriptionSchema = z.object({
  userId: z.string().uuid(),
  videoUrl: z.string().url(),
  videoTitle: z.string().optional(),
  status: z.nativeEnum(TranscriptionStatus).optional()
});

// Anonymous transcription schema (no userId required)
export const createAnonymousTranscriptionSchema = z.object({
  videoUrl: z.string().url(),
  videoTitle: z.string().optional(),
  status: z.nativeEnum(TranscriptionStatus).optional()
});

export const updateTranscriptionSchema = z.object({
  transcript: z.string().optional(),
  status: z.nativeEnum(TranscriptionStatus).optional(),
  duration: z.number().positive().optional(),
  wordCount: z.number().positive().optional(),
  processingTime: z.number().positive().optional(),
  accuracy: z.number().min(0).max(100).optional()
});
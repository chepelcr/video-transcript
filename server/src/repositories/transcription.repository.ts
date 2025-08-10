import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { transcriptions } from '@shared/auth-schema';
import { 
  ITranscription, 
  CreateTranscriptionInput, 
  UpdateTranscriptionInput, 
  TranscriptionQueryOptions,
  TranscriptionStatus
} from '../models/transcription.model';

export interface ITranscriptionRepository {
  create(input: CreateTranscriptionInput): Promise<ITranscription>;
  findById(id: string): Promise<ITranscription | null>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<ITranscription[]>;
  countByUserId(userId: string): Promise<number>;
  update(id: string, input: UpdateTranscriptionInput): Promise<ITranscription | null>;
  delete(id: string): Promise<boolean>;
  findByStatus(status: TranscriptionStatus): Promise<ITranscription[]>;
}

export class TranscriptionRepository implements ITranscriptionRepository {
  async create(input: CreateTranscriptionInput): Promise<ITranscription> {
    console.log(`🔄 Creating transcription:`, input);
    
    const [transcription] = await db
      .insert(transcriptions)
      .values({
        userId: input.userId,
        videoUrl: input.videoUrl,
        videoTitle: input.videoTitle,
        status: input.status || TranscriptionStatus.PENDING
      })
      .returning();

    console.log(`✅ Created transcription: ${transcription.id.substring(0, 8)}... - ${transcription.videoTitle}`);
    return this.mapToModel(transcription);
  }

  async findById(id: string): Promise<ITranscription | null> {
    console.log(`🔍 Finding transcription by ID: ${id.substring(0, 8)}...`);
    
    const [transcription] = await db
      .select()
      .from(transcriptions)
      .where(eq(transcriptions.id, id));

    if (!transcription) {
      console.log(`❌ Transcription not found: ${id.substring(0, 8)}...`);
      return null;
    }

    console.log(`✅ Found transcription: ${transcription.videoTitle} - Status: ${transcription.status}`);
    return this.mapToModel(transcription);
  }

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<ITranscription[]> {
    console.log(`🔍 Finding transcriptions for user: ${userId.substring(0, 8)}... (limit: ${limit || 'all'}, offset: ${offset || 0})`);
    
    let query = db
      .select()
      .from(transcriptions)
      .where(eq(transcriptions.userId, userId))
      .orderBy(desc(transcriptions.createdAt));

    if (limit !== undefined) {
      query = query.limit(limit);
    }

    if (offset !== undefined) {
      query = query.offset(offset);
    }

    const userTranscriptions = await query;
    
    console.log(`✅ Found ${userTranscriptions.length} transcriptions for user: ${userId.substring(0, 8)}...`);
    
    return userTranscriptions.map(t => this.mapToModel(t));
  }

  async countByUserId(userId: string): Promise<number> {
    console.log(`🔢 Counting transcriptions for user: ${userId.substring(0, 8)}...`);
    
    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(transcriptions)
      .where(eq(transcriptions.userId, userId));

    const total = Number(totalResult[0].count);
    
    console.log(`✅ Total transcriptions for user ${userId.substring(0, 8)}...: ${total}`);
    
    return total;
  }

  async update(id: string, input: UpdateTranscriptionInput): Promise<ITranscription | null> {
    console.log(`🔄 Updating transcription ${id.substring(0, 8)}... with:`, input);
    
    const [updatedTranscription] = await db
      .update(transcriptions)
      .set({
        ...input,
        // Handle numeric fields properly
        duration: input.duration ? Number(input.duration) : undefined,
        wordCount: input.wordCount ? Number(input.wordCount) : undefined,
        processingTime: input.processingTime ? Number(input.processingTime) : undefined,
        accuracy: input.accuracy ? Number(input.accuracy) : undefined
      })
      .where(eq(transcriptions.id, id))
      .returning();

    if (!updatedTranscription) {
      console.log(`❌ Failed to update transcription: ${id.substring(0, 8)}...`);
      return null;
    }

    console.log(`✅ Updated transcription: ${updatedTranscription.videoTitle} - Status: ${updatedTranscription.status}`);
    return this.mapToModel(updatedTranscription);
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ Deleting transcription: ${id.substring(0, 8)}...`);
    
    const result = await db
      .delete(transcriptions)
      .where(eq(transcriptions.id, id));

    const success = (result.rowCount ?? 0) > 0;
    console.log(`${success ? '✅' : '❌'} Delete transcription result: ${success}`);
    return success;
  }

  async findByStatus(status: TranscriptionStatus): Promise<ITranscription[]> {
    console.log(`🔍 Finding transcriptions with status: ${status}`);
    
    const results = await db
      .select()
      .from(transcriptions)
      .where(eq(transcriptions.status, status))
      .orderBy(desc(transcriptions.createdAt));

    console.log(`✅ Found ${results.length} transcriptions with status: ${status}`);
    return results.map(t => this.mapToModel(t));
  }

  private mapToModel(dbRecord: any): ITranscription {
    return {
      id: dbRecord.id,
      userId: dbRecord.userId,
      videoUrl: dbRecord.videoUrl,
      videoTitle: dbRecord.videoTitle,
      transcript: dbRecord.transcript,
      status: dbRecord.status as TranscriptionStatus,
      duration: dbRecord.duration ? Number(dbRecord.duration) : null,
      wordCount: dbRecord.wordCount ? Number(dbRecord.wordCount) : null,
      processingTime: dbRecord.processingTime ? Number(dbRecord.processingTime) : null,
      accuracy: dbRecord.accuracy ? Number(dbRecord.accuracy) : null,
      createdAt: new Date(dbRecord.createdAt)
    };
  }
}
import { type User, type InsertUser, type Transcription, type InsertTranscription } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserSubscriptionTier(userId: string, tier: string): Promise<User>;
  incrementUserTranscriptions(userId: string): Promise<User>;
  
  createTranscription(transcription: InsertTranscription): Promise<Transcription>;
  getTranscriptionsByUserId(userId: string): Promise<Transcription[]>;
  getTranscription(id: string): Promise<Transcription | undefined>;
  updateTranscription(id: string, updates: Partial<Transcription>): Promise<Transcription>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transcriptions: Map<string, Transcription>;

  constructor() {
    this.users = new Map();
    this.transcriptions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: "free",
      transcriptionsUsed: 0,
      createdAt: new Date(),
      isActive: true,
      isEmailVerified: false,
      emailVerificationCode: null,
      emailVerificationExpires: null,
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = {
      ...user,
      stripeCustomerId,
      stripeSubscriptionId,
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserSubscriptionTier(userId: string, tier: string): Promise<User> {
    return this.updateUser(userId, { subscriptionTier: tier });
  }

  async incrementUserTranscriptions(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    return this.updateUser(userId, { 
      transcriptionsUsed: (user.transcriptionsUsed || 0) + 1 
    });
  }

  async createTranscription(insertTranscription: InsertTranscription): Promise<Transcription> {
    const id = randomUUID();
    const transcription: Transcription = {
      ...insertTranscription,
      id,
      transcript: null,
      status: "processing",
      duration: null,
      wordCount: null,
      processingTime: null,
      accuracy: null,
      createdAt: new Date(),
    };
    this.transcriptions.set(id, transcription);
    return transcription;
  }

  async getTranscriptionsByUserId(userId: string): Promise<Transcription[]> {
    return Array.from(this.transcriptions.values()).filter(
      (transcription) => transcription.userId === userId,
    );
  }

  async getTranscription(id: string): Promise<Transcription | undefined> {
    return this.transcriptions.get(id);
  }

  async updateTranscription(id: string, updates: Partial<Transcription>): Promise<Transcription> {
    const transcription = this.transcriptions.get(id);
    if (!transcription) {
      throw new Error("Transcription not found");
    }
    
    const updatedTranscription = {
      ...transcription,
      ...updates,
    };
    
    this.transcriptions.set(id, updatedTranscription);
    return updatedTranscription;
  }
}

export const storage = new MemStorage();

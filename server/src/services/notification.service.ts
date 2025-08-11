import { desc, eq, and } from 'drizzle-orm';
import { getDb } from '../config/database';
import { notifications, type InsertNotification, type Notification } from '@shared/schema';

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      console.log('📬 Creating notification:', notification);
      
      const db = await getDb();
      const [newNotification] = await db
        .insert(notifications)
        .values(notification)
        .returning();

      console.log('✅ Notification created:', newNotification.id);
      return newNotification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications (latest 5, ordered by creation date)
   */
  async getUserNotifications(userId: string): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> {
    try {
      console.log('📬 Fetching notifications for user:', userId);
      
      const db = await getDb();
      
      // Get latest 5 notifications
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(5);

      // Count unread notifications
      const unreadNotifications = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      const result = {
        notifications: userNotifications,
        unreadCount: unreadNotifications.length
      };

      console.log(`✅ Found ${userNotifications.length} notifications, ${result.unreadCount} unread`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      console.log('📬 Marking notification as read:', notificationId);
      
      const db = await getDb();
      const result = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .returning();

      const success = result.length > 0;
      console.log(`${success ? '✅' : '❌'} Notification mark as read result:`, success);
      return success;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      console.log('📬 Marking all notifications as read for user:', userId);
      
      const db = await getDb();
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Create a transcription completion notification
   */
  async createTranscriptionCompletedNotification(
    userId: string, 
    transcriptionId: string, 
    videoTitle: string
  ): Promise<Notification> {
    const notification: InsertNotification = {
      userId,
      type: 'transcription_completed',
      title: 'Transcription Completed',
      message: `Your transcription for "${videoTitle}" has been completed successfully.`,
      relatedId: transcriptionId,
    };

    return this.createNotification(notification);
  }

  /**
   * Create a transcription failed notification
   */
  async createTranscriptionFailedNotification(
    userId: string, 
    transcriptionId: string, 
    videoTitle: string,
    errorMessage?: string
  ): Promise<Notification> {
    const notification: InsertNotification = {
      userId,
      type: 'transcription_failed',
      title: 'Transcription Failed',
      message: `Your transcription for "${videoTitle}" failed to process.${errorMessage ? ` Error: ${errorMessage}` : ''}`,
      relatedId: transcriptionId,
    };

    return this.createNotification(notification);
  }

  /**
   * Create a system notification
   */
  async createSystemNotification(
    userId: string, 
    title: string, 
    message: string
  ): Promise<Notification> {
    const notification: InsertNotification = {
      userId,
      type: 'system',
      title,
      message,
      relatedId: null,
    };

    return this.createNotification(notification);
  }

  /**
   * Create a welcome notification for new users
   */
  async createWelcomeNotification(
    userId: string,
    firstName?: string
  ): Promise<Notification> {
    const userName = firstName || 'User';
    const notification: InsertNotification = {
      userId,
      type: 'system',
      title: '🎉 Welcome to VideoScript!',
      message: `Welcome ${userName}! Your account is ready. You have 3 free transcriptions to get started. Click here to transcribe your first video.`,
      relatedId: null,
    };

    return this.createNotification(notification);
  }
}
import { Request, Response, Router } from 'express';
import { NotificationService } from '../services/notification.service';

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique notification identifier
 *         type:
 *           type: string
 *           description: Type of notification (transcription_completed, transcription_failed, system)
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         relatedId:
 *           type: string
 *           description: Related entity ID (e.g., transcription ID)
 *         isRead:
 *           type: boolean
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was created
 */

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * @swagger
   * /api/users/{userId}/notifications:
   *   get:
   *     summary: Get user notifications
   *     description: Retrieve the latest 5 notifications for a user
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: header
   *         name: x-user-id
   *         required: true
   *         schema:
   *           type: string
   *         description: Authenticated user ID
   *     responses:
   *       200:
   *         description: User notifications retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 notifications:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Notification'
   *                 unreadCount:
   *                   type: number
   *                   description: Number of unread notifications
   *       401:
   *         description: Unauthorized - user authentication required
   *       403:
   *         description: Forbidden - can only access own notifications
   *       500:
   *         description: Internal server error
   */
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      console.log('📬 Getting notifications for user:', userId);

      const result = await this.notificationService.getUserNotifications(userId);
      
      res.json(result);
    } catch (error: any) {
      console.error('❌ Error fetching user notifications:', error);
      res.status(500).json({ 
        message: 'Failed to fetch notifications',
        error: error.message 
      });
    }
  }

  /**
   * @swagger
   * /api/users/{userId}/notifications/{notificationId}/read:
   *   put:
   *     summary: Mark notification as read
   *     description: Mark a specific notification as read
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: path
   *         name: notificationId
   *         required: true
   *         schema:
   *           type: string
   *         description: Notification ID
   *       - in: header
   *         name: x-user-id
   *         required: true
   *         schema:
   *           type: string
   *         description: Authenticated user ID
   *     responses:
   *       200:
   *         description: Notification marked as read successfully
   *       401:
   *         description: Unauthorized - user authentication required
   *       403:
   *         description: Forbidden - can only access own notifications
   *       404:
   *         description: Notification not found
   *       500:
   *         description: Internal server error
   */
  async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { userId, notificationId } = req.params;
      console.log('📬 Marking notification as read:', notificationId, 'for user:', userId);

      const success = await this.notificationService.markAsRead(notificationId, userId);
      
      if (!success) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
      console.error('❌ Error marking notification as read:', error);
      res.status(500).json({ 
        message: 'Failed to mark notification as read',
        error: error.message 
      });
    }
  }

  /**
   * @swagger
   * /api/users/{userId}/notifications/read-all:
   *   put:
   *     summary: Mark all notifications as read
   *     description: Mark all notifications for a user as read
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: header
   *         name: x-user-id
   *         required: true
   *         schema:
   *           type: string
   *         description: Authenticated user ID
   *     responses:
   *       200:
   *         description: All notifications marked as read successfully
   *       401:
   *         description: Unauthorized - user authentication required
   *       403:
   *         description: Forbidden - can only access own notifications
   *       500:
   *         description: Internal server error
   */
  async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      console.log('📬 Marking all notifications as read for user:', userId);

      await this.notificationService.markAllAsRead(userId);
      
      res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      console.error('❌ Error marking all notifications as read:', error);
      res.status(500).json({ 
        message: 'Failed to mark all notifications as read',
        error: error.message 
      });
    }
  }

  /**
   * @swagger
   * /api/users/{userId}/notifications/test:
   *   post:
   *     summary: Create a test notification (development only)
   *     description: Create a test notification for development and testing purposes
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       201:
   *         description: Test notification created successfully
   *       500:
   *         description: Internal server error
   */
  async createTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      console.log('🧪 Creating test notification for user:', userId);

      const notification = await this.notificationService.createNotification({
        userId,
        type: 'system',
        title: 'Welcome to VideoScript!',
        message: 'Your account has been set up successfully. You can now start transcribing videos and enjoy all our features.'
      });
      
      res.status(201).json({ 
        message: 'Test notification created',
        notification 
      });
    } catch (error: any) {
      console.error('❌ Error creating test notification:', error);
      res.status(500).json({ 
        message: 'Failed to create test notification',
        error: error.message 
      });
    }
  }

  /**
   * Test endpoint to create a completed transcription with notification
   */
  async createTestTranscriptionComplete(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { db } = await import('../config/database');
      const { transcriptions } = await import('../../../shared/schema');
      
      console.log('🧪 Creating test completed transcription for user:', userId);

      // Create completed transcription directly in database
      const [transcription] = await db
        .insert(transcriptions)
        .values({
          userId,
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoTitle: 'Rick Astley - Never Gonna Give You Up (Official Video)',
          status: 'completed',
          transcript: `This is a sample transcript for testing purposes. 

The video "Rick Astley - Never Gonna Give You Up" contains spoken content that would normally be transcribed by our AI service. In this test scenario, we are simulating a completed transcription to demonstrate the notification system and download functionality.

Key features being tested:
- Notification creation when transcription completes
- Download and copy buttons enabled in the dashboard
- Real-time updates in the user interface

This transcript contains approximately 300 words and demonstrates how the system handles completed transcriptions. Users can copy this text to their clipboard or download it as a text file for further use.

Thank you for testing the VideoScript transcription service!`,
          duration: 180,
          wordCount: 95,
          processingTime: 45,
          accuracy: 95.8
        })
        .returning();

      // Create completion notification
      const notification = await this.notificationService.createTranscriptionCompletedNotification(
        userId,
        transcription.id,
        transcription.videoTitle || 'Test Video'
      );

      res.status(201).json({
        message: 'Test completed transcription created with notification',
        transcription: {
          id: transcription.id,
          videoTitle: transcription.videoTitle,
          status: transcription.status
        },
        notification
      });
    } catch (error: any) {
      console.error('❌ Error creating test completed transcription:', error);
      res.status(500).json({ 
        message: 'Failed to create test completed transcription',
        error: error.message 
      });
    }
  }

  getRouter(): Router {
    const router = Router();
    
    // Get user notifications
    router.get('/users/:userId/notifications', this.getUserNotifications.bind(this));
    
    // Mark specific notification as read
    router.patch('/users/:userId/notifications/:notificationId/read', this.markNotificationAsRead.bind(this));
    
    // Mark all notifications as read
    router.patch('/users/:userId/notifications/mark-all-read', this.markAllNotificationsAsRead.bind(this));

    // Test endpoint for development
    router.post('/users/:userId/notifications/test', this.createTestNotification.bind(this));
    
    // Test completed transcription endpoint
    router.post('/users/:userId/notifications/test-transcription', this.createTestTranscriptionComplete.bind(this));

    return router;
  }
}
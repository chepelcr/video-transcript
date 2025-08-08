import type { Express } from "express";
import { authStorage } from "./auth-storage";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateVerificationCode,
  generatePasswordResetToken,
  authenticateToken,
  cleanUserObject,
} from "./auth";
import {
  registerRequestSchema,
  verifyEmailRequestSchema,
  loginRequestSchema,
  refreshTokenRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  createTranscriptionRequestSchema,
  type AuthResponse,
  type UserResponse,
  type TranscriptionHistoryResponse,
} from "@shared/auth-schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";

export function setupAuthRoutes(app: Express) {
  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerRequestSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await authStorage.getUserByEmail(
        validatedData.email,
      );
      if (existingUser) {
        return res.status(400).json({
          error: "User with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Generate email verification code
      const verificationCode = generateVerificationCode();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const user = await authStorage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        username: validatedData.username,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
        isEmailVerified: false,
        transcriptionsUsed: 0,
        subscriptionTier: "free",
        isActive: true,
      });

      // Send verification email
      const emailSent = await sendVerificationEmail(
        user.email,
        verificationCode,
        validatedData.firstName || "User",
      );

      if (!emailSent) {
        console.log(
          `Failed to send email. Verification code for ${user.email}: ${verificationCode}`,
        );
      } else {
        console.log(`Verification email sent to ${user.email}`);
      }

      res.status(201).json({
        message:
          "User created successfully. Please check your email for verification code.",
        userId: user.id,
        email: user.email,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({
        error: error.message || "Registration failed",
      });
    }
  });

  // Verify email
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, code } = verifyEmailRequestSchema.parse(req.body);

      const user = await authStorage.verifyUserEmail(email, code);
      if (!user) {
        return res.status(400).json({
          error: "Invalid or expired verification code",
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token
      await authStorage.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const response: AuthResponse = {
        user: cleanUserObject(user),
        accessToken,
        refreshToken,
      };

      res.json(response);
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(400).json({
        error: error.message || "Email verification failed",
      });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginRequestSchema.parse(req.body);

      // Get user
      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(401).json({
          error: "Please verify your email before logging in",
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token
      await authStorage.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const response: AuthResponse = {
        user: cleanUserObject(user),
        accessToken,
        refreshToken,
      };

      res.json(response);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({
        error: error.message || "Login failed",
      });
    }
  });

  // Refresh token
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      // Handle both body and query parameters for refresh token
      const tokenFromBody = req.body?.refreshToken;
      const tokenFromQuery = req.query?.refreshToken;
      const refreshToken = tokenFromBody || tokenFromQuery;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(403).json({
          error: "Invalid refresh token",
        });
      }

      // Check if refresh token exists in database
      const storedToken = await authStorage.getRefreshToken(refreshToken);
      if (!storedToken) {
        return res.status(403).json({
          error: "Refresh token not found or expired",
        });
      }

      // Get user
      const user = await authStorage.getUserById(decoded.userId);
      if (!user) {
        return res.status(403).json({
          error: "User not found",
        });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);

      // Delete old refresh token
      await authStorage.deleteRefreshToken(refreshToken);

      // Store new refresh token
      await authStorage.createRefreshToken({
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const response: AuthResponse = {
        user: cleanUserObject(user),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };

      res.json(response);
    } catch (error: any) {
      console.error("Token refresh error:", error);
      res.status(400).json({
        error: error.message || "Token refresh failed",
      });
    }
  });

  // Logout
  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authStorage.deleteRefreshToken(refreshToken);
      }

      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(400).json({
        error: error.message || "Logout failed",
      });
    }
  });

  // Forgot password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const validatedData = forgotPasswordRequestSchema.parse(req.body);

      // Check if user exists
      const user = await authStorage.getUserByEmail(validatedData.email);
      if (!user) {
        // For security, we don't reveal if the email exists or not
        return res.json({
          message:
            "If an account with that email exists, a password reset link has been sent.",
        });
      }

      // Generate password reset token
      const resetToken = generatePasswordResetToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token to database
      await authStorage.setPasswordResetToken(
        validatedData.email,
        resetToken,
        resetExpires,
      );

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(
        validatedData.email,
        resetToken,
        user.firstName || "User",
      );

      if (!emailSent) {
        console.log(
          `Failed to send password reset email. Reset token for ${user.email}: ${resetToken}`,
        );
      } else {
        console.log(`Password reset email sent to ${user.email}`);
      }

      res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(400).json({
        error: error.message || "Failed to process password reset request",
      });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const validatedData = resetPasswordRequestSchema.parse(req.body);

      // Verify reset token
      const user = await authStorage.getUserByResetToken(validatedData.token);
      if (!user) {
        return res.status(400).json({
          error: "Invalid or expired reset token",
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(validatedData.newPassword);

      // Update password and clear reset token
      const updatedUser = await authStorage.resetPassword(
        validatedData.token,
        hashedPassword,
      );
      if (!updatedUser) {
        return res.status(400).json({
          error: "Failed to reset password",
        });
      }

      res.json({
        message:
          "Password reset successfully. You can now log in with your new password.",
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(400).json({
        error: error.message || "Failed to reset password",
      });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;

      const user = await authStorage.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      res.json(cleanUserObject(user));
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(400).json({
        error: error.message || "Failed to get user",
      });
    }
  });

  // Update user profile
  app.put("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { firstName, lastName } = req.body;

      const user = await authStorage.updateUser(userId, {
        username: `${firstName} ${lastName}`, // Update username instead since we're using username field
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      res.json(cleanUserObject(user));
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(400).json({
        error: error.message || "Failed to update profile",
      });
    }
  });

  // Get user transcriptions
  app.get("/api/users/transcriptions", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const result = await authStorage.getUserTranscriptions(
        userId,
        limit,
        offset,
      );

      const response: TranscriptionHistoryResponse = {
        transcriptions: result.transcriptions,
        total: result.total,
        page,
        limit,
      };

      res.json(response);
    } catch (error: any) {
      console.error("Get transcriptions error:", error);
      res.status(400).json({
        error: error.message || "Failed to get transcriptions",
      });
    }
  });

  // Get single transcription
  app.get("/api/transcriptions/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const transcriptionId = req.params.id;

      const transcription = await authStorage.getTranscriptionById(
        transcriptionId,
        userId,
      );
      if (!transcription) {
        return res.status(404).json({
          error: "Transcription not found",
        });
      }

      res.json(transcription);
    } catch (error: any) {
      console.error("Get transcription error:", error);
      res.status(400).json({
        error: error.message || "Failed to get transcription",
      });
    }
  });

  // Update user profile
  app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { username, firstName, lastName } = req.body;

      // Validate input
      if (!username || !firstName || !lastName) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Check if username is already taken by another user
      const existingUser = await authStorage.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Username is already taken" });
      }

      const updatedUser = await authStorage.updateUser(userId, {
        username,
        firstName,
        lastName,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(cleanUserObject(updatedUser));
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
}

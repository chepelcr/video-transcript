export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export const handleError = (error: Error) => {
  if (error instanceof AppError && error.isOperational) {
    // Log operational errors
    console.error('Operational error:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    });
    return {
      statusCode: error.statusCode,
      message: error.message
    };
  }

  // Log programming errors
  console.error('Programming error:', {
    message: error.message,
    stack: error.stack
  });

  return {
    statusCode: 500,
    message: 'Internal server error'
  };
};
import { Request, Response, NextFunction } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  error?: string;
  timestamp: string;
}

/**
 * Base Controller class with common functionality
 */
export class BaseController {
  /**
   * Handle success response
   */
  success<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle error response
   */
  error(res: Response, error: Error, message: string = 'Internal Server Error', statusCode: number = 500): Response<ApiResponse> {
    console.error('Controller Error:', error);
    
    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle validation error
   */
  validationError(res: Response, errors: string[], message: string = 'Validation failed'): Response<ApiResponse> {
    return res.status(400).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle not found error
   */
  notFound(res: Response, message: string = 'Resource not found'): Response<ApiResponse> {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle unauthorized error
   */
  unauthorized(res: Response, message: string = 'Unauthorized'): Response<ApiResponse> {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Validate request body
   */
  validateRequired(body: Record<string, any>, fields: string[]): string[] {
    const errors: string[] = [];
    
    fields.forEach(field => {
      if (!body[field]) {
        errors.push(`${field} is required`);
      }
    });

    return errors;
  }

  /**
   * Async wrapper to handle errors
   */
  asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
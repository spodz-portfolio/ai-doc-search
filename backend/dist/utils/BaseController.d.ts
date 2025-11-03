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
export declare class BaseController {
    /**
     * Handle success response
     */
    success<T>(res: Response, data: T, message?: string, statusCode?: number): Response<ApiResponse<T>>;
    /**
     * Handle error response
     */
    error(res: Response, error: Error, message?: string, statusCode?: number): Response<ApiResponse>;
    /**
     * Handle validation error
     */
    validationError(res: Response, errors: string[], message?: string): Response<ApiResponse>;
    /**
     * Handle not found error
     */
    notFound(res: Response, message?: string): Response<ApiResponse>;
    /**
     * Handle unauthorized error
     */
    unauthorized(res: Response, message?: string): Response<ApiResponse>;
    /**
     * Validate request body
     */
    validateRequired(body: Record<string, any>, fields: string[]): string[];
    /**
     * Async wrapper to handle errors
     */
    asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
}
export {};

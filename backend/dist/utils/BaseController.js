/**
 * Base Controller class with common functionality
 */
export class BaseController {
    /**
     * Handle success response
     */
    success(res, data, message = 'Success', statusCode = 200) {
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
    error(res, error, message = 'Internal Server Error', statusCode = 500) {
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
    validationError(res, errors, message = 'Validation failed') {
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
    notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Handle unauthorized error
     */
    unauthorized(res, message = 'Unauthorized') {
        return res.status(401).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Validate request body
     */
    validateRequired(body, fields) {
        const errors = [];
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
    asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}

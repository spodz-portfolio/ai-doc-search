/**
 * Base Service class with common functionality
 */
export class BaseService {
    repository;
    constructor(repository = null) {
        this.repository = repository;
    }
    /**
     * Handle service errors
     */
    handleError(error, operation = 'Operation') {
        console.error(`${operation} failed:`, error);
        throw new Error(`${operation} failed: ${error.message}`);
    }
    /**
     * Validate input data
     */
    validateInput(data, requiredFields = []) {
        const errors = [];
        requiredFields.forEach(field => {
            if (!data[field]) {
                errors.push(`${field} is required`);
            }
        });
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
    }
    /**
     * Transform data for output
     */
    transformData(data, transformer) {
        if (Array.isArray(data)) {
            return data.map(transformer);
        }
        return transformer(data);
    }
    /**
     * Paginate results
     */
    paginate(data, page = 1, limit = 10) {
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        return {
            data: data.slice(startIndex, endIndex),
            pagination: {
                page,
                limit,
                total: data.length,
                totalPages: Math.ceil(data.length / limit),
                hasNext: endIndex < data.length,
                hasPrev: startIndex > 0
            }
        };
    }
    /**
     * Sleep utility for rate limiting
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

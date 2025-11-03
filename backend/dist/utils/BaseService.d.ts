interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
/**
 * Base Service class with common functionality
 */
export declare class BaseService {
    protected repository: any;
    constructor(repository?: any);
    /**
     * Handle service errors
     */
    protected handleError(error: Error, operation?: string): never;
    /**
     * Validate input data
     */
    protected validateInput(data: Record<string, any>, requiredFields?: string[]): void;
    /**
     * Transform data for output
     */
    protected transformData<T, U>(data: T | T[], transformer: (item: T) => U): U | U[];
    /**
     * Paginate results
     */
    protected paginate<T>(data: T[], page?: number, limit?: number): PaginationResult<T>;
    /**
     * Sleep utility for rate limiting
     */
    protected sleep(ms: number): Promise<void>;
}
export {};

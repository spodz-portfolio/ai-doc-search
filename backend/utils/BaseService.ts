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
export class BaseService {
  protected repository: any;

  constructor(repository: any = null) {
    this.repository = repository;
  }

  /**
   * Handle service errors
   */
  protected handleError(error: Error, operation: string = 'Operation'): never {
    console.error(`${operation} failed:`, error);
    throw new Error(`${operation} failed: ${error.message}`);
  }

  /**
   * Validate input data
   */
  protected validateInput(data: Record<string, any>, requiredFields: string[] = []): void {
    const errors: string[] = [];

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
  protected transformData<T, U>(data: T | T[], transformer: (item: T) => U): U | U[] {
    if (Array.isArray(data)) {
      return data.map(transformer);
    }
    return transformer(data);
  }

  /**
   * Paginate results
   */
  protected paginate<T>(data: T[], page: number = 1, limit: number = 10): PaginationResult<T> {
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
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
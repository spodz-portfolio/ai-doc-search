interface BaseRecord {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Base Repository class with common data access patterns
 */
export declare class BaseRepository<T extends Record<string, any> = Record<string, any>> {
    protected storage: Map<string, BaseRecord & T>;
    private idCounter;
    constructor();
    /**
     * Generate unique ID
     */
    protected generateId(): string;
    /**
     * Create a new record
     */
    create(data: T): Promise<BaseRecord & T>;
    /**
     * Find record by ID
     */
    findById(id: string): Promise<(BaseRecord & T) | null>;
    /**
     * Find all records with optional filter
     */
    findAll(filter?: Partial<T>): Promise<(BaseRecord & T)[]>;
    /**
     * Update record by ID
     */
    updateById(id: string, updates: Partial<T>): Promise<(BaseRecord & T) | null>;
    /**
     * Delete record by ID
     */
    deleteById(id: string): Promise<boolean>;
    /**
     * Count records
     */
    count(filter?: Partial<T>): Promise<number>;
    /**
     * Clear all records
     */
    clear(): Promise<boolean>;
    /**
     * Check if record exists
     */
    exists(id: string): Promise<boolean>;
}
export {};

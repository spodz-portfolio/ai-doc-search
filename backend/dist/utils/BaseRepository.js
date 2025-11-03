/**
 * Base Repository class with common data access patterns
 */
export class BaseRepository {
    storage;
    idCounter;
    constructor() {
        // In-memory storage for this simple implementation
        this.storage = new Map();
        this.idCounter = 1;
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${this.idCounter++}`;
    }
    /**
     * Create a new record
     */
    async create(data) {
        const id = this.generateId();
        const record = {
            id,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.storage.set(id, record);
        return record;
    }
    /**
     * Find record by ID
     */
    async findById(id) {
        return this.storage.get(id) || null;
    }
    /**
     * Find all records with optional filter
     */
    async findAll(filter) {
        const records = Array.from(this.storage.values());
        if (!filter) {
            return records;
        }
        return records.filter(record => {
            return Object.keys(filter).every(key => {
                return record[key] === filter[key];
            });
        });
    }
    /**
     * Update record by ID
     */
    async updateById(id, updates) {
        const record = this.storage.get(id);
        if (!record) {
            return null;
        }
        const updatedRecord = {
            ...record,
            ...updates,
            updatedAt: new Date()
        };
        this.storage.set(id, updatedRecord);
        return updatedRecord;
    }
    /**
     * Delete record by ID
     */
    async deleteById(id) {
        return this.storage.delete(id);
    }
    /**
     * Count records
     */
    async count(filter) {
        if (!filter) {
            return this.storage.size;
        }
        const filtered = await this.findAll(filter);
        return filtered.length;
    }
    /**
     * Clear all records
     */
    async clear() {
        this.storage.clear();
        return true;
    }
    /**
     * Check if record exists
     */
    async exists(id) {
        return this.storage.has(id);
    }
}

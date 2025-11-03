interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base Repository class with common data access patterns
 */
export class BaseRepository<T extends Record<string, any> = Record<string, any>> {
  protected storage: Map<string, BaseRecord & T>;
  private idCounter: number;

  constructor() {
    // In-memory storage for this simple implementation
    this.storage = new Map();
    this.idCounter = 1;
  }

  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return `${Date.now()}-${this.idCounter++}`;
  }

  /**
   * Create a new record
   */
  async create(data: T): Promise<BaseRecord & T> {
    const id = this.generateId();
    const record: BaseRecord & T = {
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
  async findById(id: string): Promise<(BaseRecord & T) | null> {
    return this.storage.get(id) || null;
  }

  /**
   * Find all records with optional filter
   */
  async findAll(filter?: Partial<T>): Promise<(BaseRecord & T)[]> {
    const records = Array.from(this.storage.values());
    
    if (!filter) {
      return records;
    }

    return records.filter(record => {
      return Object.keys(filter).every(key => {
        return record[key as keyof typeof record] === filter[key as keyof T];
      });
    });
  }

  /**
   * Update record by ID
   */
  async updateById(id: string, updates: Partial<T>): Promise<(BaseRecord & T) | null> {
    const record = this.storage.get(id);
    if (!record) {
      return null;
    }

    const updatedRecord: BaseRecord & T = {
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
  async deleteById(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  /**
   * Count records
   */
  async count(filter?: Partial<T>): Promise<number> {
    if (!filter) {
      return this.storage.size;
    }

    const filtered = await this.findAll(filter);
    return filtered.length;
  }

  /**
   * Clear all records
   */
  async clear(): Promise<boolean> {
    this.storage.clear();
    return true;
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    return this.storage.has(id);
  }
}
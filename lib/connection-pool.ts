// Database connection pooling and query optimization
// Improves performance and handles database connections efficiently

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Connection pool configuration
interface PoolConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  acquireTimeout: number;
}

const defaultPoolConfig: PoolConfig = {
  maxConnections: process.env.NODE_ENV === 'production' ? 20 : 5,
  idleTimeout: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  acquireTimeout: 5000, // 5 seconds
};

class DatabaseConnectionPool {
  private pool: SupabaseClient[] = [];
  private inUse: Set<SupabaseClient> = new Set();
  private waitingQueue: Array<{
    resolve: (client: SupabaseClient) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private config: PoolConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...defaultPoolConfig, ...config };
    this.startCleanupTimer();
  }

  private createConnection(): SupabaseClient {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'Connection': 'keep-alive',
          },
        },
      }
    );

    logger.debug('Database connection created', {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
    });

    return client;
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
      this.processWaitingQueue();
    }, this.config.idleTimeout / 2);
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    const idleConnections = this.pool.filter(
      (client) => !this.inUse.has(client)
    );

    // Keep minimum connections but clean up excess idle ones
    const minConnections = Math.min(2, this.config.maxConnections);
    if (idleConnections.length > minConnections) {
      const toRemove = idleConnections.slice(minConnections);
      toRemove.forEach((client) => {
        const index = this.pool.indexOf(client);
        if (index > -1) {
          this.pool.splice(index, 1);
        }
      });

      logger.debug('Cleaned up idle connections', {
        removed: toRemove.length,
        remaining: this.pool.length,
      });
    }
  }

  private processWaitingQueue(): void {
    const now = Date.now();
    
    // Process timeouts
    this.waitingQueue = this.waitingQueue.filter((request) => {
      if (now - request.timestamp > this.config.acquireTimeout) {
        request.reject(new Error('Connection acquire timeout'));
        return false;
      }
      return true;
    });

    // Fulfill waiting requests
    while (this.waitingQueue.length > 0 && this.pool.length > this.inUse.size) {
      const request = this.waitingQueue.shift()!;
      const availableClient = this.pool.find(client => !this.inUse.has(client));
      
      if (availableClient) {
        this.inUse.add(availableClient);
        request.resolve(availableClient);
      } else {
        this.waitingQueue.unshift(request);
        break;
      }
    }
  }

  async acquire(): Promise<SupabaseClient> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Try to get an available connection immediately
      const availableClient = this.pool.find(client => !this.inUse.has(client));
      
      if (availableClient) {
        this.inUse.add(availableClient);
        logger.debug('Connection acquired from pool', {
          acquisitionTime: Date.now() - startTime,
          poolSize: this.pool.length,
          inUse: this.inUse.size,
        });
        resolve(availableClient);
        return;
      }

      // Create new connection if under limit
      if (this.pool.length < this.config.maxConnections) {
        const newClient = this.createConnection();
        this.pool.push(newClient);
        this.inUse.add(newClient);
        
        logger.debug('New connection created and acquired', {
          acquisitionTime: Date.now() - startTime,
          poolSize: this.pool.length,
          inUse: this.inUse.size,
        });
        resolve(newClient);
        return;
      }

      // Add to waiting queue
      this.waitingQueue.push({
        resolve,
        reject,
        timestamp: Date.now(),
      });

      logger.debug('Connection request queued', {
        queueLength: this.waitingQueue.length,
        poolSize: this.pool.length,
        inUse: this.inUse.size,
      });
    });
  }

  release(client: SupabaseClient): void {
    if (this.inUse.has(client)) {
      this.inUse.delete(client);
      
      logger.debug('Connection released', {
        poolSize: this.pool.length,
        inUse: this.inUse.size,
        waitingQueue: this.waitingQueue.length,
      });

      // Process waiting queue immediately
      this.processWaitingQueue();
    }
  }

  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Reject all waiting requests
    this.waitingQueue.forEach((request) => {
      request.reject(new Error('Connection pool destroyed'));
    });
    this.waitingQueue = [];

    // Clear all connections
    this.pool = [];
    this.inUse.clear();

    logger.info('Database connection pool destroyed');
  }

  getStats(): {
    poolSize: number;
    inUse: number;
    waiting: number;
    maxConnections: number;
  } {
    return {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
      waiting: this.waitingQueue.length,
      maxConnections: this.config.maxConnections,
    };
  }
}

// Global connection pool instance
let globalPool: DatabaseConnectionPool | null = null;

export function getConnectionPool(): DatabaseConnectionPool {
  if (!globalPool) {
    globalPool = new DatabaseConnectionPool();
  }
  return globalPool;
}

// Helper function for executing queries with automatic connection management
export async function withDatabaseConnection<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const pool = getConnectionPool();
  const client = await pool.acquire();
  const startTime = Date.now();

  try {
    const result = await operation(client);
    
    logger.debug('Database operation completed', {
      duration: Date.now() - startTime,
      poolStats: pool.getStats(),
    });

    return result;
  } catch (error) {
    logger.error('Database operation failed', error, {
      duration: Date.now() - startTime,
      poolStats: pool.getStats(),
    });
    throw error;
  } finally {
    pool.release(client);
  }
}

// Optimized query helpers
export class QueryBuilder {
  static batchSelect<T>(
    tableName: string,
    ids: string[],
    columns: string = '*'
  ) {
    return async (client: SupabaseClient): Promise<T[]> => {
      if (ids.length === 0) return [];

      const { data, error } = await client
        .from(tableName)
        .select(columns)
        .in('id', ids);

      if (error) throw error;
      return (data as T[]) || [];
    };
  }

  static paginatedSelect<T>(
    tableName: string,
    options: {
      columns?: string;
      filter?: Record<string, unknown>;
      orderBy?: { column: string; ascending?: boolean };
      page?: number;
      limit?: number;
    } = {}
  ) {
    return async (client: SupabaseClient): Promise<{
      data: T[];
      count: number;
      page: number;
      totalPages: number;
    }> => {
      const {
        columns = '*',
        filter = {},
        orderBy,
        page = 1,
        limit = 20,
      } = options;

      let query = client.from(tableName).select(columns, { count: 'exact' });

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data as T[]) || [],
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    };
  }

  static upsertBatch<T>(
    tableName: string,
    records: T[],
    onConflict?: string
  ) {
    return async (client: SupabaseClient): Promise<T[]> => {
      if (records.length === 0) return [];

      const { data, error } = await client
        .from(tableName)
        .upsert(records, { onConflict })
        .select();

      if (error) throw error;
      return (data as T[]) || [];
    };
  }
}

// Cleanup function for graceful shutdown
export async function shutdownConnectionPool(): Promise<void> {
  if (globalPool) {
    await globalPool.destroy();
    globalPool = null;
  }
}

// Performance monitoring
export function logConnectionPoolStats(): void {
  const pool = getConnectionPool();
  const stats = pool.getStats();
  
  logger.info('Connection pool statistics', {
    ...stats,
    utilization: stats.poolSize > 0 ? (stats.inUse / stats.poolSize) * 100 : 0,
  });
}
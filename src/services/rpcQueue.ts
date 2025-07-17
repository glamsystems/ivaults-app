import { Connection } from '@solana/web3.js';

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  retries: number;
}

class RPCQueue {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private lastRequestTime = 0;
  
  // Configuration
  private readonly minRequestInterval = 100; // 100ms between requests (10 req/sec max)
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // Start with 1 second retry delay
  private readonly maxQueueSize = 100;
  
  // Rate limiting state
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly requestsPerWindow = 40; // 40 requests per window
  private readonly windowDuration = 10000; // 10 second window
  
  // Backoff state for 429 errors
  private backoffMultiplier = 1;
  private lastErrorTime = 0;

  /**
   * Add a request to the queue
   */
  async add<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error('RPC queue is full'));
        return;
      }
      
      this.queue.push({
        execute,
        resolve,
        reject,
        retries: 0,
      });
      
      this.processQueue();
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      
      // Reset window if needed
      if (now - this.windowStart > this.windowDuration) {
        this.windowStart = now;
        this.requestCount = 0;
        
        // Reduce backoff multiplier over time
        if (now - this.lastErrorTime > 30000 && this.backoffMultiplier > 1) {
          this.backoffMultiplier = Math.max(1, this.backoffMultiplier * 0.5);
          console.log(`[RPCQueue] Reducing backoff multiplier to ${this.backoffMultiplier}`);
        }
      }
      
      // Check rate limit
      if (this.requestCount >= this.requestsPerWindow) {
        const waitTime = this.windowDuration - (now - this.windowStart);
        console.log(`[RPCQueue] Rate limit reached, waiting ${waitTime}ms`);
        await this.sleep(waitTime);
        continue;
      }
      
      // Enforce minimum interval between requests
      const timeSinceLastRequest = now - this.lastRequestTime;
      const adjustedInterval = this.minRequestInterval * this.backoffMultiplier;
      
      if (timeSinceLastRequest < adjustedInterval) {
        await this.sleep(adjustedInterval - timeSinceLastRequest);
      }
      
      const request = this.queue.shift()!;
      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error: any) {
        console.error('[RPCQueue] Request failed:', error?.message || error);
        
        // Handle 429 errors with exponential backoff
        if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
          this.lastErrorTime = Date.now();
          this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, 10);
          console.log(`[RPCQueue] Got 429 error, increasing backoff to ${this.backoffMultiplier}x`);
          
          // Put request back in queue for retry
          if (request.retries < this.maxRetries) {
            request.retries++;
            this.queue.unshift(request); // Put at front of queue
            await this.sleep(this.retryDelay * Math.pow(2, request.retries));
            continue;
          }
        }
        
        // Handle other errors with simple retry
        if (request.retries < this.maxRetries && this.shouldRetry(error)) {
          request.retries++;
          this.queue.unshift(request);
          await this.sleep(this.retryDelay * request.retries);
          continue;
        }
        
        request.reject(error);
      }
    }
    
    this.processing = false;
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    const message = error?.message || '';
    return (
      message.includes('Network request failed') ||
      message.includes('Failed to fetch') ||
      message.includes('timeout') ||
      message.includes('ECONNRESET')
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      requestCount: this.requestCount,
      backoffMultiplier: this.backoffMultiplier,
      windowRemaining: Math.max(0, this.windowDuration - (Date.now() - this.windowStart)),
    };
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.processing = false;
  }
}

// Export singleton instance
export const rpcQueue = new RPCQueue();

/**
 * Wrapper for Connection class that uses the RPC queue
 */
export class QueuedConnection {
  constructor(private connection: Connection) {}

  async getBalance(...args: Parameters<Connection['getBalance']>) {
    return rpcQueue.add(() => this.connection.getBalance(...args));
  }

  async getParsedTokenAccountsByOwner(...args: Parameters<Connection['getParsedTokenAccountsByOwner']>) {
    return rpcQueue.add(() => this.connection.getParsedTokenAccountsByOwner(...args));
  }

  async getMultipleAccountsInfo(...args: Parameters<Connection['getMultipleAccountsInfo']>) {
    return rpcQueue.add(() => this.connection.getMultipleAccountsInfo(...args));
  }

  async getProgramAccounts(...args: Parameters<Connection['getProgramAccounts']>) {
    return rpcQueue.add(() => this.connection.getProgramAccounts(...args));
  }

  async getAccountInfo(...args: Parameters<Connection['getAccountInfo']>) {
    return rpcQueue.add(() => this.connection.getAccountInfo(...args));
  }

  async sendRawTransaction(...args: Parameters<Connection['sendRawTransaction']>) {
    return rpcQueue.add(() => this.connection.sendRawTransaction(...args));
  }

  async confirmTransaction(...args: Parameters<Connection['confirmTransaction']>) {
    return rpcQueue.add(() => this.connection.confirmTransaction(...args));
  }

  // Add more methods as needed
}
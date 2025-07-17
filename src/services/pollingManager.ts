interface PollingTask {
  callback: () => void | Promise<void>;
  interval: number;
  minInterval?: number;
  lastExecution?: number;
}

class PollingManager {
  private tasks = new Map<string, PollingTask>();
  private intervals = new Map<string, NodeJS.Timer>();
  private lastExecutions = new Map<string, number>();
  private isActive = true;

  /**
   * Register a polling task
   */
  register(
    key: string,
    callback: () => void | Promise<void>,
    interval: number,
    options?: {
      executeImmediately?: boolean;
      minInterval?: number;
    }
  ) {
    console.log(`[PollingManager] Registering task: ${key} with interval ${interval}ms`);
    
    // Stop existing task if it exists
    this.stop(key);
    
    // Register the new task
    this.tasks.set(key, {
      callback,
      interval,
      minInterval: options?.minInterval || interval / 2, // Default min interval is half the polling interval
    });
    
    // Execute immediately if requested
    if (options?.executeImmediately) {
      this.executeTask(key);
    }
  }

  /**
   * Start a specific task or all tasks
   */
  start(key?: string) {
    if (!this.isActive) return;
    
    if (key) {
      this.startTask(key);
    } else {
      // Start all registered tasks
      this.tasks.forEach((_, taskKey) => this.startTask(taskKey));
    }
  }

  /**
   * Stop a specific task or all tasks
   */
  stop(key?: string) {
    if (key) {
      this.stopTask(key);
    } else {
      // Stop all tasks
      this.intervals.forEach((_, taskKey) => this.stopTask(taskKey));
    }
  }

  /**
   * Execute a task immediately (with debouncing)
   */
  async executeNow(key: string) {
    const task = this.tasks.get(key);
    if (!task) {
      console.warn(`[PollingManager] Task ${key} not found`);
      return;
    }
    
    const now = Date.now();
    const lastExecution = this.lastExecutions.get(key) || 0;
    const timeSinceLastExecution = now - lastExecution;
    
    // Check minimum interval
    if (timeSinceLastExecution < (task.minInterval || 0)) {
      console.log(
        `[PollingManager] Skipping ${key} - too soon since last execution (${timeSinceLastExecution}ms < ${task.minInterval}ms)`
      );
      return;
    }
    
    await this.executeTask(key);
  }

  /**
   * Smart refresh - only execute if enough time has passed
   */
  async smartRefresh(key: string, minInterval?: number) {
    const task = this.tasks.get(key);
    if (!task) return;
    
    const now = Date.now();
    const lastExecution = this.lastExecutions.get(key) || 0;
    const timeSinceLastExecution = now - lastExecution;
    const threshold = minInterval || task.minInterval || task.interval / 2;
    
    if (timeSinceLastExecution >= threshold) {
      await this.executeTask(key);
    } else {
      console.log(
        `[PollingManager] Smart refresh skipped for ${key} - only ${timeSinceLastExecution}ms since last execution`
      );
    }
  }

  /**
   * Pause all polling (useful when app goes to background)
   */
  pauseAll() {
    console.log('[PollingManager] Pausing all polling');
    this.isActive = false;
    this.stop();
  }

  /**
   * Resume all polling
   */
  resumeAll() {
    console.log('[PollingManager] Resuming all polling');
    this.isActive = true;
    this.start();
  }

  /**
   * Get status of all tasks
   */
  getStatus() {
    const status: Record<string, any> = {};
    this.tasks.forEach((task, key) => {
      status[key] = {
        interval: task.interval,
        lastExecution: this.lastExecutions.get(key),
        isRunning: this.intervals.has(key),
      };
    });
    return status;
  }

  private startTask(key: string) {
    const task = this.tasks.get(key);
    if (!task) {
      console.warn(`[PollingManager] Cannot start task ${key} - not registered`);
      return;
    }
    
    // Don't start if already running
    if (this.intervals.has(key)) {
      console.log(`[PollingManager] Task ${key} already running`);
      return;
    }
    
    console.log(`[PollingManager] Starting task: ${key}`);
    
    // Create interval
    const interval = setInterval(() => {
      this.executeTask(key);
    }, task.interval);
    
    this.intervals.set(key, interval);
  }

  private stopTask(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      console.log(`[PollingManager] Stopping task: ${key}`);
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  private async executeTask(key: string) {
    const task = this.tasks.get(key);
    if (!task || !this.isActive) return;
    
    try {
      console.log(`[PollingManager] Executing task: ${key}`);
      this.lastExecutions.set(key, Date.now());
      await task.callback();
    } catch (error) {
      console.error(`[PollingManager] Error executing task ${key}:`, error);
    }
  }
}

// Export singleton instance
export const pollingManager = new PollingManager();
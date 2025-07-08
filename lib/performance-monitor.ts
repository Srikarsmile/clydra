/**
 * Performance monitoring and metrics collection
 */
export interface PerformanceMetrics {
  requestId: string;
  model: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tokenCount?: number;
  responseSize?: number;
  cacheHit?: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private aggregatedStats = {
    totalRequests: 0,
    totalDuration: 0,
    cacheHitRate: 0,
    errorRate: 0,
    averageResponseTime: 0,
    modelsUsed: new Set<string>(),
  };

  startRequest(requestId: string, model: string): void {
    this.metrics.set(requestId, {
      requestId,
      model,
      startTime: Date.now(),
    });
  }

  endRequest(
    requestId: string,
    options: {
      tokenCount?: number;
      responseSize?: number;
      cacheHit?: boolean;
      error?: string;
    } = {}
  ): void {
    const metric = this.metrics.get(requestId);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      ...options,
    };

    this.metrics.set(requestId, completedMetric);
    this.updateAggregatedStats(completedMetric);
  }

  private updateAggregatedStats(metric: PerformanceMetrics): void {
    this.aggregatedStats.totalRequests++;
    this.aggregatedStats.totalDuration += metric.duration || 0;
    this.aggregatedStats.modelsUsed.add(metric.model);

    if (metric.cacheHit) {
      this.aggregatedStats.cacheHitRate = 
        (this.aggregatedStats.cacheHitRate * (this.aggregatedStats.totalRequests - 1) + 1) / 
        this.aggregatedStats.totalRequests;
    }

    if (metric.error) {
      this.aggregatedStats.errorRate = 
        (this.aggregatedStats.errorRate * (this.aggregatedStats.totalRequests - 1) + 1) / 
        this.aggregatedStats.totalRequests;
    }

    this.aggregatedStats.averageResponseTime = 
      this.aggregatedStats.totalDuration / this.aggregatedStats.totalRequests;
  }

  getMetrics(requestId: string): PerformanceMetrics | undefined {
    return this.metrics.get(requestId);
  }

  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  getAggregatedStats() {
    return {
      ...this.aggregatedStats,
      modelsUsed: Array.from(this.aggregatedStats.modelsUsed),
    };
  }

  getModelPerformance(model: string) {
    const modelMetrics = this.getAllMetrics().filter(m => m.model === model);
    
    if (modelMetrics.length === 0) {
      return null;
    }

    const totalDuration = modelMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const successfulRequests = modelMetrics.filter(m => !m.error);
    const cacheHits = modelMetrics.filter(m => m.cacheHit);

    return {
      model,
      totalRequests: modelMetrics.length,
      successfulRequests: successfulRequests.length,
      averageResponseTime: totalDuration / modelMetrics.length,
      cacheHitRate: cacheHits.length / modelMetrics.length,
      errorRate: (modelMetrics.length - successfulRequests.length) / modelMetrics.length,
    };
  }

  cleanup(): void {
    // Keep only last 1000 metrics
    if (this.metrics.size > 1000) {
      const entries = Array.from(this.metrics.entries())
        .sort((a, b) => (b[1].startTime || 0) - (a[1].startTime || 0))
        .slice(0, 1000);
      
      this.metrics.clear();
      entries.forEach(([key, value]) => this.metrics.set(key, value));
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-cleanup every 10 minutes
setInterval(() => {
  performanceMonitor.cleanup();
}, 10 * 60 * 1000);
/**
 * Monitoring and Alerting System
 * 
 * This module provides monitoring capabilities for the error handling system,
 * including metrics collection and alerting for critical errors.
 * 
 * Requirements covered:
 * - 7.1: Detailed error logging for debugging and monitoring
 * - 7.5: System stability monitoring
 */

import { ErrorSeverity, ErrorCategory } from './errorHandler';

/**
 * Metrics interface for tracking system health
 */
export interface SystemMetrics {
  errorCount: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  responseTimeMs: number;
  successRate: number;
  timestamp: Date;
}

/**
 * Alert configuration interface
 */
export interface AlertConfig {
  enabled: boolean;
  criticalErrorThreshold: number;
  highErrorRateThreshold: number;
  responseTimeThreshold: number;
  checkIntervalMs: number;
}

/**
 * In-memory metrics storage (in production, use Redis or similar)
 */
class MetricsStore {
  private metrics: SystemMetrics[] = [];
  private readonly maxMetricsHistory = 1000;

  addMetric(metric: SystemMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  getRecentMetrics(minutes: number = 5): SystemMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getAverageResponseTime(minutes: number = 5): number {
    const recent = this.getRecentMetrics(minutes);
    if (recent.length === 0) return 0;
    
    const total = recent.reduce((sum, m) => sum + m.responseTimeMs, 0);
    return total / recent.length;
  }

  getErrorRate(minutes: number = 5): number {
    const recent = this.getRecentMetrics(minutes);
    if (recent.length === 0) return 0;
    
    const totalErrors = recent.reduce((sum, m) => sum + m.errorCount, 0);
    const totalRequests = recent.length;
    
    return totalErrors / totalRequests;
  }

  getCriticalErrorCount(minutes: number = 5): number {
    const recent = this.getRecentMetrics(minutes);
    return recent.reduce((sum, m) => sum + (m.errorsBySeverity[ErrorSeverity.CRITICAL] || 0), 0);
  }
}

// Global metrics store instance
const metricsStore = new MetricsStore();

/**
 * Default alert configuration
 */
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: process.env.NODE_ENV === 'production',
  criticalErrorThreshold: 5, // 5 critical errors in 5 minutes
  highErrorRateThreshold: 0.1, // 10% error rate
  responseTimeThreshold: 5000, // 5 seconds
  checkIntervalMs: 60000 // Check every minute
};

/**
 * Record system metrics
 */
export function recordMetrics(
  responseTimeMs: number,
  errorCount: number = 0,
  errorCategory?: ErrorCategory,
  errorSeverity?: ErrorSeverity
): void {
  const errorsByCategory: Record<ErrorCategory, number> = {
    [ErrorCategory.AUTHENTICATION]: 0,
    [ErrorCategory.AUTHORIZATION]: 0,
    [ErrorCategory.VALIDATION]: 0,
    [ErrorCategory.PAYMENT]: 0,
    [ErrorCategory.DATABASE]: 0,
    [ErrorCategory.EMAIL]: 0,
    [ErrorCategory.NETWORK]: 0,
    [ErrorCategory.CONFIGURATION]: 0,
    [ErrorCategory.RATE_LIMIT]: 0,
    [ErrorCategory.WEBHOOK]: 0,
    [ErrorCategory.INTERNAL]: 0
  };

  const errorsBySeverity: Record<ErrorSeverity, number> = {
    [ErrorSeverity.LOW]: 0,
    [ErrorSeverity.MEDIUM]: 0,
    [ErrorSeverity.HIGH]: 0,
    [ErrorSeverity.CRITICAL]: 0
  };

  if (errorCategory) {
    errorsByCategory[errorCategory] = errorCount;
  }

  if (errorSeverity) {
    errorsBySeverity[errorSeverity] = errorCount;
  }

  const metric: SystemMetrics = {
    errorCount,
    errorsByCategory,
    errorsBySeverity,
    responseTimeMs,
    successRate: errorCount === 0 ? 1.0 : 0.0,
    timestamp: new Date()
  };

  metricsStore.addMetric(metric);
}

/**
 * Get current system health status
 */
export function getSystemHealth(): {
  status: 'healthy' | 'degraded' | 'critical';
  metrics: {
    averageResponseTime: number;
    errorRate: number;
    criticalErrors: number;
  };
  alerts: string[];
} {
  const averageResponseTime = metricsStore.getAverageResponseTime();
  const errorRate = metricsStore.getErrorRate();
  const criticalErrors = metricsStore.getCriticalErrorCount();
  
  const alerts: string[] = [];
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

  // Check for critical errors
  if (criticalErrors >= DEFAULT_ALERT_CONFIG.criticalErrorThreshold) {
    alerts.push(`Critical error threshold exceeded: ${criticalErrors} critical errors in last 5 minutes`);
    status = 'critical';
  }

  // Check error rate
  if (errorRate >= DEFAULT_ALERT_CONFIG.highErrorRateThreshold) {
    alerts.push(`High error rate detected: ${(errorRate * 100).toFixed(1)}%`);
    if (status !== 'critical') status = 'degraded';
  }

  // Check response time
  if (averageResponseTime >= DEFAULT_ALERT_CONFIG.responseTimeThreshold) {
    alerts.push(`High response time detected: ${averageResponseTime.toFixed(0)}ms average`);
    if (status !== 'critical') status = 'degraded';
  }

  return {
    status,
    metrics: {
      averageResponseTime,
      errorRate,
      criticalErrors
    },
    alerts
  };
}

/**
 * Log system health status
 */
export function logSystemHealth(): void {
  const health = getSystemHealth();
  
  const logData = {
    status: health.status,
    metrics: health.metrics,
    alerts: health.alerts,
    timestamp: new Date().toISOString()
  };

  switch (health.status) {
    case 'critical':
      console.error('🚨 SYSTEM HEALTH CRITICAL:', logData);
      break;
    case 'degraded':
      console.warn('⚠️ SYSTEM HEALTH DEGRADED:', logData);
      break;
    case 'healthy':
      console.log('✅ System health check passed:', logData);
      break;
  }
}

/**
 * Start health monitoring (call this in your application startup)
 */
export function startHealthMonitoring(config: Partial<AlertConfig> = {}): void {
  const alertConfig = { ...DEFAULT_ALERT_CONFIG, ...config };
  
  if (!alertConfig.enabled) {
    console.log('Health monitoring disabled');
    return;
  }

  console.log('🏥 Starting health monitoring with config:', alertConfig);

  setInterval(() => {
    logSystemHealth();
  }, alertConfig.checkIntervalMs);
}

/**
 * Create a middleware wrapper that automatically records metrics
 */
export function withMetrics<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let errorCount = 0;
    let errorCategory: ErrorCategory | undefined;
    let errorSeverity: ErrorSeverity | undefined;

    try {
      const result = await fn(...args);
      return result;
    } catch (error: any) {
      errorCount = 1;
      
      // Try to extract error category and severity if it's an AppError
      if (error.category && error.severity) {
        errorCategory = error.category;
        errorSeverity = error.severity;
      }
      
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      recordMetrics(responseTime, errorCount, errorCategory, errorSeverity);
      
      console.log(`📊 Metrics recorded for ${operationName}:`, {
        responseTimeMs: responseTime,
        errorCount,
        errorCategory,
        errorSeverity
      });
    }
  }) as T;
}

export default {
  recordMetrics,
  getSystemHealth,
  logSystemHealth,
  startHealthMonitoring,
  withMetrics
};
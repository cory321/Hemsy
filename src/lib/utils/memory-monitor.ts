/**
 * Memory monitoring utilities for production
 * Helps track memory usage and detect potential leaks
 */

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  deviceMemory?: number;
  connectionType?: string;
}

export interface MemoryReport {
  current: MemorySnapshot;
  trend: 'stable' | 'increasing' | 'decreasing';
  warningLevel: 'normal' | 'warning' | 'critical';
  message?: string;
}

/**
 * Class for monitoring memory usage in the browser
 */
export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private maxSnapshots = 60; // Keep last 60 snapshots (1 hour at 1 minute intervals)
  private warningThreshold = 0.75; // Warn when using 75% of heap limit
  private criticalThreshold = 0.9; // Critical when using 90% of heap limit
  private trendThreshold = 50 * 1024 * 1024; // 50MB increase triggers warning

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
    };

    // Check if performance.memory is available (Chrome only)
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      snapshot.usedJSHeapSize = memory.usedJSHeapSize;
      snapshot.totalJSHeapSize = memory.totalJSHeapSize;
      snapshot.jsHeapSizeLimit = memory.jsHeapSizeLimit;
    }

    // Check device memory (experimental API)
    if ('deviceMemory' in navigator) {
      snapshot.deviceMemory = (navigator as any).deviceMemory;
    }

    // Check connection type
    if ('connection' in navigator && (navigator as any).connection) {
      snapshot.connectionType = (navigator as any).connection.effectiveType;
    }

    // Add to snapshots array
    this.snapshots.push(snapshot);

    // Keep only the last maxSnapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Analyze memory usage and return a report
   */
  analyze(): MemoryReport {
    const current = this.takeSnapshot();

    // Default report
    const report: MemoryReport = {
      current,
      trend: 'stable',
      warningLevel: 'normal',
    };

    if (!current.usedJSHeapSize || !current.jsHeapSizeLimit) {
      report.message = 'Memory monitoring not available in this browser';
      return report;
    }

    // Check memory usage percentage
    const usagePercent = current.usedJSHeapSize / current.jsHeapSizeLimit;

    if (usagePercent >= this.criticalThreshold) {
      report.warningLevel = 'critical';
      report.message = `Critical: Using ${Math.round(usagePercent * 100)}% of available memory`;
    } else if (usagePercent >= this.warningThreshold) {
      report.warningLevel = 'warning';
      report.message = `Warning: Using ${Math.round(usagePercent * 100)}% of available memory`;
    }

    // Analyze trend if we have enough snapshots
    if (this.snapshots.length >= 5) {
      const oldSnapshot = this.snapshots[this.snapshots.length - 5];
      if (oldSnapshot && oldSnapshot.usedJSHeapSize) {
        const memoryIncrease =
          current.usedJSHeapSize - oldSnapshot.usedJSHeapSize;

        if (memoryIncrease > this.trendThreshold) {
          report.trend = 'increasing';
          const increaseMB = Math.round(memoryIncrease / 1024 / 1024);
          report.message =
            (report.message || '') +
            ` Memory increased by ${increaseMB}MB in last 5 minutes`;
        } else if (memoryIncrease < -this.trendThreshold) {
          report.trend = 'decreasing';
        }
      }
    }

    return report;
  }

  /**
   * Get formatted memory statistics
   */
  getStats(): string {
    const current = this.snapshots[this.snapshots.length - 1];

    if (!current || !current.usedJSHeapSize) {
      return 'Memory stats not available';
    }

    const used = Math.round(current.usedJSHeapSize / 1024 / 1024);
    const total = Math.round((current.totalJSHeapSize || 0) / 1024 / 1024);
    const limit = Math.round((current.jsHeapSizeLimit || 0) / 1024 / 1024);

    return `Memory: ${used}MB / ${total}MB (Limit: ${limit}MB)`;
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots = [];
  }

  /**
   * Export snapshots for debugging
   */
  export(): MemorySnapshot[] {
    return [...this.snapshots];
  }
}

/**
 * Hook for monitoring memory in React components
 */
export function useMemoryMonitor(
  intervalMs = 60000, // Default: check every minute
  onWarning?: (report: MemoryReport) => void
) {
  // Hooks must be called before any conditional returns
  const monitorRef = React.useRef<MemoryMonitor | null>(null);
  const [stats, setStats] = React.useState('');
  const [report, setReport] = React.useState<MemoryReport | null>(null);

  React.useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    monitorRef.current = new MemoryMonitor();

    const checkMemory = () => {
      if (!monitorRef.current) return;

      const newReport = monitorRef.current.analyze();
      setReport(newReport);
      setStats(monitorRef.current.getStats());

      // Call warning callback if needed
      if (onWarning && newReport.warningLevel !== 'normal') {
        onWarning(newReport);
      }
    };

    // Initial check
    checkMemory();

    // Set up interval
    const interval = setInterval(checkMemory, intervalMs);

    return () => {
      clearInterval(interval);
      if (monitorRef.current) {
        monitorRef.current.clear();
      }
    };
  }, [intervalMs, onWarning]);

  // Early return for SSR
  if (typeof window === 'undefined') {
    return { stats: '', report: null };
  }

  return { stats, report };
}

/**
 * Utility to detect potential memory leaks
 */
export class LeakDetector {
  private objectWeakMap = new WeakMap<object, number>();
  private checkInterval: NodeJS.Timeout | null = null;
  private leakCallbacks: ((info: any) => void)[] = [];

  /**
   * Track an object for potential leaks
   */
  track(obj: object, identifier: string): void {
    this.objectWeakMap.set(obj, Date.now());

    // Use WeakRef to detect when object should be garbage collected
    const weakRef = new WeakRef(obj);

    // Check if object is still alive after a delay
    setTimeout(() => {
      if (weakRef.deref()) {
        // Object is still alive, might be a leak
        const age = Date.now() - (this.objectWeakMap.get(obj) || 0);
        if (age > 300000) {
          // 5 minutes
          this.reportLeak({
            identifier,
            age,
            type: 'potential_leak',
            message: `Object "${identifier}" still in memory after ${Math.round(age / 1000)}s`,
          });
        }
      }
    }, 300000); // Check after 5 minutes
  }

  /**
   * Report a potential leak
   */
  private reportLeak(info: any): void {
    console.warn('Potential memory leak detected:', info);
    this.leakCallbacks.forEach((callback) => callback(info));
  }

  /**
   * Add a callback for leak detection
   */
  onLeak(callback: (info: any) => void): void {
    this.leakCallbacks.push(callback);
  }

  /**
   * Clean up the detector
   */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.leakCallbacks = [];
  }
}

// Singleton instance for global memory monitoring
let globalMonitor: MemoryMonitor | null = null;

/**
 * Get or create global memory monitor instance
 */
export function getGlobalMemoryMonitor(): MemoryMonitor {
  if (typeof window === 'undefined') {
    throw new Error('Memory monitor is only available in browser environment');
  }

  if (!globalMonitor) {
    globalMonitor = new MemoryMonitor();

    // Auto-monitor in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const report = globalMonitor!.analyze();
        if (report.warningLevel === 'critical') {
          console.error('Memory Critical:', report.message);
        } else if (report.warningLevel === 'warning') {
          console.warn('Memory Warning:', report.message);
        }
      }, 60000); // Check every minute
    }
  }

  return globalMonitor;
}

// Export React for the hook
import * as React from 'react';

import { EventEmitter } from './event-emitter';
import { BaseEvent } from './base-event';
import { appendFile } from 'fs/promises';
import chalk from 'chalk';

type EventCategory = 'error' | 'warning' | 'success' | 'normal';

interface EventStats {
  total: number;
  byCategory: Record<EventCategory, number>;
  byType: Map<string, number>;
}

/**
 * Colorful debugging tool for logging events from EventEmitter.
 * Subscribes to all events and formats them beautifully for console output.
 */
export class EventLogger {
  private unsubscribe?: () => void;
  private filterPattern?: RegExp;
  private logFilePath?: string;
  private stats: EventStats = {
    total: 0,
    byCategory: { error: 0, warning: 0, success: 0, normal: 0 },
    byType: new Map(),
  };

  constructor(
    private emitter: EventEmitter,
    options?: {
      filter?: string | RegExp;
      logFile?: string;
    }
  ) {
    if (options?.filter) {
      this.filterPattern =
        typeof options.filter === 'string'
          ? new RegExp(options.filter)
          : options.filter;
    }
    this.logFilePath = options?.logFile;
  }

  /**
   * Start logging events
   */
  start(): void {
    if (this.unsubscribe) {
      return; // Already started
    }

    // Reset stats
    this.stats = {
      total: 0,
      byCategory: { error: 0, warning: 0, success: 0, normal: 0 },
      byType: new Map(),
    };

    // Subscribe to all events with wildcard
    this.unsubscribe = this.emitter.on('*', (event: BaseEvent) => {
      this.logEvent(event);
    });

    console.log(chalk.blue('🔍 Event logger started'));
  }

  /**
   * Stop logging events and show statistics
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
      this.printStats();
      console.log(chalk.blue('🛑 Event logger stopped'));
    }
  }

  /**
   * Log a single event
   */
  private logEvent(event: BaseEvent): void {
    // Apply filter if set
    if (this.filterPattern && !this.filterPattern.test(event.type)) {
      return;
    }

    // Update stats
    this.updateStats(event);

    // Format and display
    const formatted = this.formatEvent(event);
    console.log(formatted);

    // Write to file if configured (without colors)
    if (this.logFilePath) {
      const plainText = this.formatEventPlain(event);
      this.writeToFile(plainText).catch((err) => {
        console.error('Failed to write to log file:', err);
      });
    }
  }

  /**
   * Update statistics for this event
   */
  private updateStats(event: BaseEvent): void {
    this.stats.total++;

    const category = this.categorizeEvent(event.type);
    this.stats.byCategory[category]++;

    const count = this.stats.byType.get(event.type) || 0;
    this.stats.byType.set(event.type, count + 1);
  }

  /**
   * Categorize event by type pattern
   */
  private categorizeEvent(type: string): EventCategory {
    const lower = type.toLowerCase();

    if (
      lower.includes('error') ||
      lower.includes('failed') ||
      lower.includes('failure')
    ) {
      return 'error';
    }

    if (
      lower.includes('warning') ||
      lower.includes('warn') ||
      lower.includes('degraded')
    ) {
      return 'warning';
    }

    if (
      lower.includes('success') ||
      lower.includes('loaded') ||
      lower.includes('completed') ||
      lower.includes('initialized')
    ) {
      return 'success';
    }

    return 'normal';
  }

  /**
   * Format event for colorful console display
   */
  private formatEvent(event: BaseEvent): string {
    const category = this.categorizeEvent(event.type);
    const timestamp = chalk.gray(event.timestamp.toISOString());
    const type = this.colorizeType(event.type, category);
    const payload = this.formatPayload(event.payload);

    // If payload is long, put it on a new line with indentation
    if (payload.length > 50) {
      return `${timestamp}  ${type}\n  ${chalk.white(payload)}\n${chalk.gray('─'.repeat(80))}`;
    }

    return `${timestamp}  ${type}  ${chalk.white(payload)}`;
  }

  /**
   * Format event for plain text (file output)
   */
  private formatEventPlain(event: BaseEvent): string {
    const timestamp = event.timestamp.toISOString();
    const type = event.type;
    const payload = this.formatPayload(event.payload);

    if (payload.length > 50) {
      return `[${timestamp}] ${type}\n  ${payload}\n${'─'.repeat(80)}`;
    }

    return `[${timestamp}] ${type} ${payload}`;
  }

  /**
   * Colorize event type based on category
   */
  private colorizeType(type: string, category: EventCategory): string {
    switch (category) {
      case 'error':
        return chalk.red.bold(type);
      case 'warning':
        return chalk.yellow(type);
      case 'success':
        return chalk.green(type);
      default:
        return chalk.cyan(type);
    }
  }

  /**
   * Format payload with truncation for long values
   */
  private formatPayload(payload: unknown): string {
    if (!payload) {
      return '';
    }

    try {
      const json = JSON.stringify(payload, null, 0);
      const maxLength = 200;

      if (json.length > maxLength) {
        return json.substring(0, maxLength) + chalk.gray('...');
      }

      return json;
    } catch {
      return chalk.gray('[circular or non-serializable]');
    }
  }

  /**
   * Print statistics summary
   */
  private printStats(): void {
    console.log('\n' + chalk.bold('📊 Event Logger Statistics:'));
    console.log(
      chalk.white(
        `  Total events: ${this.stats.total} (${chalk.green(this.stats.byCategory.success)} success, ${chalk.cyan(this.stats.byCategory.normal)} normal, ${chalk.yellow(this.stats.byCategory.warning)} warnings, ${chalk.red(this.stats.byCategory.error)} errors)`
      )
    );

    if (this.stats.byType.size > 0) {
      console.log(chalk.white('\n  Top event types:'));
      const sorted = Array.from(this.stats.byType.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      for (const [type, count] of sorted) {
        const category = this.categorizeEvent(type);
        const coloredType = this.colorizeType(type, category);
        console.log(chalk.white(`    ${coloredType}: ${count}`));
      }
    }
    console.log('');
  }

  /**
   * Write log entry to file
   */
  private async writeToFile(entry: string): Promise<void> {
    if (!this.logFilePath) {
      return;
    }

    await appendFile(this.logFilePath, entry + '\n', 'utf-8');
  }
}

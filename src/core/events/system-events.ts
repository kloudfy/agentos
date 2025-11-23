import { randomUUID } from 'node:crypto';
import { BaseEvent, EventMetadata } from './base-event';

/**
 * Payload for system startup events.
 */
export interface StartupPayload {
  /** Version of the system being started */
  version: string;
  /** Environment the system is running in (e.g., 'development', 'production') */
  environment: string;
  /** Timestamp when the system started */
  startTime: Date;
}

/**
 * Payload for system shutdown events.
 */
export interface ShutdownPayload {
  /** Reason for the shutdown */
  reason: string;
  /** Whether the shutdown was graceful or forced */
  graceful: boolean;
}

/**
 * Payload for system error events.
 */
export interface ErrorPayload {
  /** The error that occurred */
  error: Error;
  /** Additional context about the error */
  context?: Record<string, unknown>;
  /** Severity level of the error */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Payload for system state change events.
 */
export interface StateChangePayload {
  /** The previous state */
  from: string;
  /** The new state */
  to: string;
  /** Optional reason for the state change */
  reason?: string;
}

/**
 * Factory class for creating standardized system-level events.
 * Provides static methods for common system events with consistent structure.
 * 
 * @example
 * ```typescript
 * // Create a startup event
 * const startupEvent = SystemEvents.startup({
 *   version: '1.0.0',
 *   environment: 'production',
 *   startTime: new Date()
 * });
 * 
 * // Create an error event
 * const errorEvent = SystemEvents.error({
 *   error: new Error('Database connection failed'),
 *   context: { database: 'postgres' },
 *   severity: 'critical'
 * });
 * ```
 */
export class SystemEvents {
  /**
   * Creates a system startup event.
   * 
   * @param payload - Startup information including version, environment, and start time
   * @param metadata - Optional additional metadata (defaults to { source: 'system' })
   * @returns A BaseEvent with type 'system.startup'
   */
  static startup(
    payload: StartupPayload,
    metadata?: Partial<EventMetadata>
  ): BaseEvent<StartupPayload> {
    return this.createEvent('system.startup', payload, metadata);
  }

  /**
   * Creates a system shutdown event.
   * 
   * @param payload - Shutdown information including reason and graceful flag
   * @param metadata - Optional additional metadata (defaults to { source: 'system' })
   * @returns A BaseEvent with type 'system.shutdown'
   */
  static shutdown(
    payload: ShutdownPayload,
    metadata?: Partial<EventMetadata>
  ): BaseEvent<ShutdownPayload> {
    return this.createEvent('system.shutdown', payload, metadata);
  }

  /**
   * Creates a system error event.
   * 
   * @param payload - Error information including error object, context, and severity
   * @param metadata - Optional additional metadata (defaults to { source: 'system' })
   * @returns A BaseEvent with type 'system.error'
   */
  static error(
    payload: ErrorPayload,
    metadata?: Partial<EventMetadata>
  ): BaseEvent<ErrorPayload> {
    return this.createEvent('system.error', payload, metadata);
  }

  /**
   * Creates a system state change event.
   * 
   * @param payload - State change information including from, to, and optional reason
   * @param metadata - Optional additional metadata (defaults to { source: 'system' })
   * @returns A BaseEvent with type 'system.stateChange'
   */
  static stateChange(
    payload: StateChangePayload,
    metadata?: Partial<EventMetadata>
  ): BaseEvent<StateChangePayload> {
    return this.createEvent('system.stateChange', payload, metadata);
  }

  /**
   * Private helper method to create events with consistent structure.
   * Generates UUID, sets timestamp, and applies default metadata.
   * 
   * @template T - The type of the event payload
   * @param type - The event type string
   * @param payload - The event payload
   * @param metadata - Optional metadata to merge with defaults
   * @returns A properly formatted BaseEvent
   */
  private static createEvent<T>(
    type: string,
    payload: T,
    metadata?: Partial<EventMetadata>
  ): BaseEvent<T> {
    return {
      id: randomUUID(),
      type,
      timestamp: new Date(),
      payload,
      metadata: {
        source: 'system',
        ...metadata,
      },
    };
  }
}

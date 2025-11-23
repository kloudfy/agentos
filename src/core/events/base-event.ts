/**
 * Metadata associated with an event for tracking and correlation purposes.
 * All properties are readonly to ensure immutability.
 */
export interface EventMetadata {
  /** The source system or component that created the event */
  readonly source: string;
  /** Optional correlation ID for tracking related events across the system */
  readonly correlationId?: string;
  /** Optional user ID associated with the event */
  readonly userId?: string;
}

/**
 * Base event interface that defines the structure for all events in the system.
 * Uses generic type parameter T for type-safe payload handling.
 * All properties are readonly to enforce immutability and prevent handlers from corrupting event data.
 * 
 * @template T - The type of the event payload
 * 
 * @example
 * ```typescript
 * interface UserLoginPayload {
 *   username: string;
 *   timestamp: Date;
 * }
 * 
 * const event: BaseEvent<UserLoginPayload> = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   type: 'user.login',
 *   timestamp: new Date(),
 *   payload: { username: 'john', timestamp: new Date() },
 *   metadata: { source: 'auth-service' }
 * };
 * ```
 */
export interface BaseEvent<T = unknown> {
  /** Unique identifier for the event (UUID) */
  readonly id: string;
  /** Event type using dot notation (e.g., "user.login", "system.startup") */
  readonly type: string;
  /** Timestamp when the event was created */
  readonly timestamp: Date;
  /** Event-specific data with generic type T for type safety */
  readonly payload: T;
  /** Metadata for tracking and correlation */
  readonly metadata: EventMetadata;
}

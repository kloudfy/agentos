import { BaseEvent } from './base-event';

/**
 * Event handler function type that processes events.
 * Can be synchronous or asynchronous.
 * 
 * @template T - The type of the event payload
 */
export type EventHandler<T = unknown> = (event: BaseEvent<T>) => void | Promise<void>;

/**
 * Function returned by the on() method that unsubscribes a handler when called.
 */
export type UnsubscribeFunction = () => void;

/**
 * Central event bus that manages event subscriptions and dispatches events to handlers.
 * Implements the Observer pattern with support for:
 * - Multiple handlers per event type
 * - Wildcard listeners that receive all events
 * - Asynchronous event handling with Promise.allSettled
 * - Error isolation (failed handlers don't block others)
 * - Memory leak prevention through automatic cleanup
 * 
 * @example
 * ```typescript
 * const emitter = new EventEmitter();
 * 
 * // Subscribe to specific event type
 * const unsubscribe = emitter.on('user.login', (event) => {
 *   console.log('User logged in:', event.payload);
 * });
 * 
 * // Subscribe to all events with wildcard
 * emitter.on('*', (event) => {
 *   console.log('Event received:', event.type);
 * });
 * 
 * // Emit an event
 * await emitter.emit({
 *   id: '123',
 *   type: 'user.login',
 *   timestamp: new Date(),
 *   payload: { username: 'john' },
 *   metadata: { source: 'auth' }
 * });
 * 
 * // Unsubscribe
 * unsubscribe();
 * ```
 */
export class EventEmitter {
  /**
   * Internal storage for event handlers.
   * Key: event type (or "*" for wildcard)
   * Value: Set of handler functions
   */
  private handlers: Map<string, Set<EventHandler>>;

  /**
   * Creates a new EventEmitter instance with empty handler storage.
   */
  constructor() {
    this.handlers = new Map<string, Set<EventHandler>>();
  }

  /**
   * Subscribes a handler to a specific event type or wildcard.
   * Returns an unsubscribe function for easy cleanup.
   * 
   * @template T - The type of the event payload
   * @param eventType - The event type to listen for (use "*" for all events)
   * @param handler - The function to call when the event is emitted
   * @returns A function that unsubscribes the handler when called
   * 
   * @example
   * ```typescript
   * const unsubscribe = emitter.on('user.login', (event) => {
   *   console.log('Handler called:', event.payload);
   * });
   * 
   * // Later, unsubscribe
   * unsubscribe();
   * ```
   */
  on<T = unknown>(eventType: string, handler: EventHandler<T>): UnsubscribeFunction {
    // Get or create the Set of handlers for this event type
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set<EventHandler>());
    }

    const handlersSet = this.handlers.get(eventType)!;
    handlersSet.add(handler as EventHandler);

    // Return unsubscribe function that removes this specific handler
    return () => {
      this.off(eventType, handler);
    };
  }

  /**
   * Manually unsubscribes a handler from a specific event type.
   * Safe to call even if the handler is not registered (no-op).
   * Automatically cleans up empty handler Sets to prevent memory leaks.
   * 
   * @template T - The type of the event payload
   * @param eventType - The event type to unsubscribe from
   * @param handler - The handler function to remove
   * 
   * @example
   * ```typescript
   * const handler = (event) => console.log(event);
   * emitter.on('user.login', handler);
   * 
   * // Later, manually unsubscribe
   * emitter.off('user.login', handler);
   * ```
   */
  off<T = unknown>(eventType: string, handler: EventHandler<T>): void {
    const handlersSet = this.handlers.get(eventType);
    
    if (!handlersSet) {
      // No handlers registered for this event type - no-op
      return;
    }

    handlersSet.delete(handler as EventHandler);

    // Clean up empty Sets to prevent memory leaks
    if (handlersSet.size === 0) {
      this.handlers.delete(eventType);
    }
  }

  /**
   * Emits an event to all registered handlers for that event type and wildcard handlers.
   * Executes all handlers concurrently using Promise.allSettled to ensure:
   * - All handlers execute even if some fail
   * - Failed handlers don't block other handlers
   * - The Promise resolves when all handlers complete
   * 
   * @template T - The type of the event payload
   * @param event - The event to emit
   * @returns A Promise that resolves when all handlers have completed
   * 
   * @example
   * ```typescript
   * await emitter.emit({
   *   id: '123',
   *   type: 'user.login',
   *   timestamp: new Date(),
   *   payload: { username: 'john' },
   *   metadata: { source: 'auth' }
   * });
   * ```
   */
  async emit<T = unknown>(event: BaseEvent<T>): Promise<void> {
    const handlersToExecute: EventHandler[] = [];

    // Get handlers for the specific event type
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      handlersToExecute.push(...Array.from(typeHandlers));
    }

    // Get wildcard handlers that listen to all events
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      handlersToExecute.push(...Array.from(wildcardHandlers));
    }

    // Execute all handlers concurrently with error isolation
    // Promise.allSettled ensures all handlers run even if some fail
    await Promise.allSettled(
      handlersToExecute.map(handler => 
        Promise.resolve().then(() => handler(event))
      )
    );
  }
}

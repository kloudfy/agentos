/**
 * Event System Module
 * 
 * Provides a type-safe, decoupled event-driven communication system for AgentOS.
 * Enables plugins to emit and listen for events without tight coupling.
 */

// Base event types and interfaces
export { BaseEvent, EventMetadata } from './base-event';

// Event emitter and handler types
export { EventEmitter, EventHandler, UnsubscribeFunction } from './event-emitter';

// System events factory and payload types
export {
  SystemEvents,
  StartupPayload,
  ShutdownPayload,
  ErrorPayload,
  StateChangePayload,
} from './system-events';

// Event debugging tool
export { EventLogger } from './event-logger';

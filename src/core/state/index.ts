/**
 * State Management Module
 * 
 * Provides persistent storage for plugin state with:
 * - Versioning and migration support
 * - Automatic backups
 * - State validation
 * - Event-driven notifications
 */

// State store interface and types
export {
  StateStore,
  StateData,
  MigrationFunction,
  ValidationFunction,
} from './state-store';

// FileSystem implementation
export {
  FileSystemStateStore,
  FileSystemStateStoreOptions,
} from './filesystem-state-store';

// Scoped state manager
export { StateManager } from './state-manager';

// Error classes
export {
  StateWriteError,
  StateReadError,
  StateParseError,
  StateValidationError,
} from './errors';

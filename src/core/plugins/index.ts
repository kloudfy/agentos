/**
 * Plugin System Module
 * 
 * Provides a robust plugin architecture for AgentOS with:
 * - Plugin registration and lifecycle management
 * - Dependency resolution and load ordering
 * - Event-driven plugin communication
 * - Type-safe plugin access
 */

// Plugin interfaces
export { Plugin, PluginMetadata } from './plugin';

// Plugin context and logger
export { PluginContext, Logger } from './plugin-context';

// Plugin manager
export {
  PluginManager,
  LoadResult,
  UnloadResult,
} from './plugin-manager';

// Dependency resolver
export { DependencyResolver } from './dependency-resolver';

// Error classes
export {
  DuplicatePluginError,
  MissingDependencyError,
  CircularDependencyError,
  PluginNotFoundError,
  PluginInUseError,
} from './errors';

import { EventEmitter } from '../events';
import { Plugin } from './plugin';

/**
 * Logger interface providing structured logging capabilities.
 * All methods accept a message and optional additional arguments.
 */
export interface Logger {
  /**
   * Log debug-level message for detailed troubleshooting.
   * @param message - The log message
   * @param args - Optional additional arguments to log
   */
  debug(message: string, ...args: unknown[]): void;

  /**
   * Log info-level message for general information.
   * @param message - The log message
   * @param args - Optional additional arguments to log
   */
  info(message: string, ...args: unknown[]): void;

  /**
   * Log warn-level message for warnings that don't prevent operation.
   * @param message - The log message
   * @param args - Optional additional arguments to log
   */
  warn(message: string, ...args: unknown[]): void;

  /**
   * Log error-level message for errors and exceptions.
   * @param message - The log message
   * @param args - Optional additional arguments to log
   */
  error(message: string, ...args: unknown[]): void;
}

/**
 * Runtime context provided to plugins during their lifecycle.
 * Provides access to system services and other plugins.
 * All properties are readonly to prevent plugins from modifying the context.
 * 
 * @example
 * ```typescript
 * class MyPlugin implements Plugin {
 *   async load(context: PluginContext) {
 *     // Access event system
 *     context.events.on('user.login', this.handleLogin);
 *     
 *     // Use logger
 *     context.logger.info('Plugin initialized');
 *     
 *     // Access configuration
 *     const apiKey = context.config.apiKey;
 *     
 *     // Get other plugins
 *     const corePlugin = context.getPlugin<CorePlugin>('core-plugin');
 *   }
 * }
 * ```
 */
export interface PluginContext {
  /** Name of the plugin receiving this context */
  readonly pluginName: string;

  /** Event emitter for inter-plugin communication */
  readonly events: EventEmitter;

  /** Logger instance for structured logging */
  readonly logger: Logger;

  /** Plugin-specific configuration object */
  readonly config: Record<string, unknown>;

  /**
   * Retrieves a loaded plugin by name with type safety.
   * 
   * @template T - The plugin type to cast to
   * @param name - Name of the plugin to retrieve
   * @returns The loaded plugin instance
   * @throws {PluginNotFoundError} If the plugin is not loaded
   * 
   * @example
   * ```typescript
   * const authPlugin = context.getPlugin<AuthPlugin>('auth-plugin');
   * authPlugin.authenticate(user);
   * ```
   */
  getPlugin<T extends Plugin>(name: string): T;
}

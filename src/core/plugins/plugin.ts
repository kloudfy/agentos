import { PluginContext } from './plugin-context';

/**
 * Metadata describing a plugin's identity and dependencies.
 * All properties are readonly to prevent modification after registration.
 */
export interface PluginMetadata {
  /** Unique identifier for the plugin */
  readonly name: string;
  /** Semantic version of the plugin (e.g., "1.0.0") */
  readonly version: string;
  /** Human-readable description of the plugin's purpose */
  readonly description: string;
  /** Optional array of plugin names that this plugin depends on */
  readonly dependencies?: string[];
}

/**
 * Plugin interface that all plugins must implement.
 * Defines the contract for plugin lifecycle and configuration.
 * 
 * @example
 * ```typescript
 * class MyPlugin implements Plugin {
 *   metadata = {
 *     name: 'my-plugin',
 *     version: '1.0.0',
 *     description: 'Example plugin',
 *     dependencies: ['core-plugin']
 *   };
 *   
 *   configure(config: Record<string, unknown>) {
 *     // Set up plugin configuration
 *   }
 *   
 *   async load(context: PluginContext) {
 *     context.logger.info('Plugin loaded');
 *     context.events.on('some.event', this.handleEvent);
 *   }
 *   
 *   async unload() {
 *     // Clean up resources
 *   }
 * }
 * ```
 */
export interface Plugin {
  /** Plugin metadata including name, version, and dependencies */
  readonly metadata: PluginMetadata;

  /**
   * Optional configuration method called before load().
   * Used to set up plugin-specific configuration.
   * 
   * @param config - Configuration object for the plugin
   */
  configure?(config: Record<string, unknown>): void | Promise<void>;

  /**
   * Optional load method called when the plugin is loaded.
   * Receives PluginContext with access to system services.
   * 
   * @param context - Runtime context providing access to events, logger, and other plugins
   */
  load?(context: PluginContext): void | Promise<void>;

  /**
   * Optional unload method called when the plugin is unloaded.
   * Used to clean up resources and event listeners.
   */
  unload?(): void | Promise<void>;
}

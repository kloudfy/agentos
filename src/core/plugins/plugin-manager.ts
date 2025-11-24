import { randomUUID } from 'node:crypto';
import { EventEmitter } from '../events';
import { Plugin } from './plugin';
import { PluginContext, Logger } from './plugin-context';
import { DependencyResolver } from './dependency-resolver';
import {
  DuplicatePluginError,
  PluginNotFoundError,
  PluginInUseError,
} from './errors';
import { StateStore, StateManager } from '../state';

/**
 * Result of loading multiple plugins.
 */
export interface LoadResult {
  /** Names of successfully loaded plugins */
  successful: string[];
  /** Plugins that failed to load with their errors */
  failed: Array<{ name: string; error: Error }>;
}

/**
 * Result of unloading multiple plugins.
 */
export interface UnloadResult {
  /** Names of successfully unloaded plugins */
  successful: string[];
  /** Plugins that failed to unload with their errors */
  failed: Array<{ name: string; error: Error }>;
}

/**
 * Central manager for plugin registration, loading, and lifecycle management.
 * Handles dependency resolution, event emission, and plugin context creation.
 * 
 * @example
 * ```typescript
 * const events = new EventEmitter();
 * const manager = new PluginManager(events);
 * 
 * // Register plugins
 * manager.register(new CorePlugin());
 * manager.register(new AuthPlugin(), { apiKey: 'secret' });
 * 
 * // Load all plugins
 * const result = await manager.loadAll();
 * console.log(`Loaded ${result.successful.length} plugins`);
 * 
 * // Get a plugin
 * const authPlugin = manager.getPlugin<AuthPlugin>('auth-plugin');
 * 
 * // Unload all plugins
 * await manager.unloadAll();
 * ```
 */
export class PluginManager {
  /** Registry of all registered plugins */
  private registry: Map<string, Plugin>;

  /** Map of currently loaded plugins */
  private loaded: Map<string, Plugin>;

  /** Map of plugin configurations */
  private configs: Map<string, Record<string, unknown>>;

  /** Event emitter for plugin lifecycle events */
  private events: EventEmitter;

  /** State store for plugin state persistence */
  private stateStore: StateStore;

  /**
   * Creates a new PluginManager instance.
   * 
   * @param events - EventEmitter for plugin lifecycle events
   * @param stateStore - StateStore for plugin state persistence
   */
  constructor(events: EventEmitter, stateStore: StateStore) {
    this.registry = new Map();
    this.loaded = new Map();
    this.configs = new Map();
    this.events = events;
    this.stateStore = stateStore;
  }

  /**
   * Registers a plugin with optional configuration.
   * 
   * @param plugin - The plugin to register
   * @param config - Optional configuration for the plugin
   * @throws {DuplicatePluginError} If a plugin with the same name is already registered
   * 
   * @example
   * ```typescript
   * manager.register(new MyPlugin(), { apiKey: 'secret', timeout: 5000 });
   * ```
   */
  register(plugin: Plugin, config?: Record<string, unknown>): void {
    const name = plugin.metadata.name;

    if (this.registry.has(name)) {
      throw new DuplicatePluginError(name);
    }

    this.registry.set(name, plugin);

    if (config) {
      this.configs.set(name, config);
    }

    // Emit registration event
    this.events.emit({
      id: randomUUID(),
      type: 'plugin.registered',
      timestamp: new Date(),
      payload: {
        name: plugin.metadata.name,
        version: plugin.metadata.version,
        dependencies: plugin.metadata.dependencies || [],
      },
      metadata: { source: 'plugin-manager' },
    });
  }

  /**
   * Loads a plugin and all its dependencies.
   * Dependencies are loaded first in the correct order.
   * 
   * @param pluginName - Name of the plugin to load
   * @throws {PluginNotFoundError} If the plugin is not registered
   * @throws {MissingDependencyError} If a required dependency is missing
   * @throws {CircularDependencyError} If a circular dependency is detected
   * 
   * @example
   * ```typescript
   * await manager.load('auth-plugin'); // Loads auth-plugin and its dependencies
   * ```
   */
  async load(pluginName: string): Promise<void> {
    // Check if already loaded
    if (this.loaded.has(pluginName)) {
      return;
    }

    // Check if registered
    if (!this.registry.has(pluginName)) {
      throw new PluginNotFoundError(pluginName, 'registered');
    }

    const plugin = this.registry.get(pluginName)!;
    const startTime = Date.now();

    try {
      // Resolve and load dependencies
      const dependencies = plugin.metadata.dependencies || [];
      if (dependencies.length > 0) {
        // Create a subgraph with just this plugin and its dependencies
        const subPlugins = new Map<string, Plugin>();
        subPlugins.set(pluginName, plugin);

        for (const dep of dependencies) {
          const depPlugin = this.registry.get(dep);
          if (depPlugin) {
            subPlugins.set(dep, depPlugin);
          }
        }

        const loadOrder = DependencyResolver.resolveDependencies(
          subPlugins,
          pluginName
        );

        // Load dependencies (excluding the plugin itself)
        for (const dep of loadOrder) {
          if (dep !== pluginName && !this.loaded.has(dep)) {
            await this.load(dep);
          }
        }
      }

      // Call configure if defined
      const config = this.configs.get(pluginName) || {};
      if (plugin.configure) {
        await plugin.configure(config);
      }

      // Create plugin context
      const context: PluginContext = {
        pluginName,
        events: this.events,
        logger: this.createLogger(pluginName),
        config,
        state: new StateManager(this.stateStore, pluginName),
        getPlugin: <T extends Plugin>(name: string): T => {
          return this.getPlugin<T>(name);
        },
      };

      // Call load if defined
      if (plugin.load) {
        await plugin.load(context);
      }

      // Mark as loaded
      this.loaded.set(pluginName, plugin);

      const loadTime = Date.now() - startTime;

      // Emit loaded event
      this.events.emit({
        id: randomUUID(),
        type: 'plugin.loaded',
        timestamp: new Date(),
        payload: {
          name: pluginName,
          loadTime,
        },
        metadata: { source: 'plugin-manager' },
      });
    } catch (error) {
      // Emit error event
      this.events.emit({
        id: randomUUID(),
        type: 'plugin.error',
        timestamp: new Date(),
        payload: {
          name: pluginName,
          operation: 'load',
          error: error as Error,
        },
        metadata: { source: 'plugin-manager' },
      });

      throw error;
    }
  }

  /**
   * Loads all registered plugins in dependency order.
   * Continues loading even if individual plugins fail.
   * 
   * @returns LoadResult with successful and failed plugin loads
   * 
   * @example
   * ```typescript
   * const result = await manager.loadAll();
   * console.log(`Loaded: ${result.successful.join(', ')}`);
   * if (result.failed.length > 0) {
   *   console.error('Failed:', result.failed);
   * }
   * ```
   */
  async loadAll(): Promise<LoadResult> {
    const result: LoadResult = {
      successful: [],
      failed: [],
    };

    try {
      // Get load order for all plugins
      const loadOrder = DependencyResolver.resolveDependencies(this.registry);

      // Load each plugin
      for (const pluginName of loadOrder) {
        try {
          await this.load(pluginName);
          result.successful.push(pluginName);
        } catch (error) {
          result.failed.push({
            name: pluginName,
            error: error as Error,
          });
        }
      }
    } catch (error) {
      // If dependency resolution fails, mark all as failed
      for (const pluginName of this.registry.keys()) {
        if (!this.loaded.has(pluginName)) {
          result.failed.push({
            name: pluginName,
            error: error as Error,
          });
        }
      }
    }

    return result;
  }

  /**
   * Unloads a plugin.
   * Prevents unloading if other loaded plugins depend on it.
   * 
   * @param pluginName - Name of the plugin to unload
   * @throws {PluginNotFoundError} If the plugin is not loaded
   * @throws {PluginInUseError} If other loaded plugins depend on this plugin
   * 
   * @example
   * ```typescript
   * await manager.unload('auth-plugin');
   * ```
   */
  async unload(pluginName: string): Promise<void> {
    // Check if loaded
    if (!this.loaded.has(pluginName)) {
      throw new PluginNotFoundError(pluginName, 'loaded');
    }

    // Check if any loaded plugins depend on this one
    const dependents: string[] = [];
    for (const [name, plugin] of this.loaded.entries()) {
      if (name !== pluginName) {
        const deps = plugin.metadata.dependencies || [];
        if (deps.includes(pluginName)) {
          dependents.push(name);
        }
      }
    }

    if (dependents.length > 0) {
      throw new PluginInUseError(pluginName, dependents);
    }

    const plugin = this.loaded.get(pluginName)!;

    try {
      // Call unload if defined
      if (plugin.unload) {
        await plugin.unload();
      }

      // Remove from loaded
      this.loaded.delete(pluginName);

      // Emit unloaded event
      this.events.emit({
        id: randomUUID(),
        type: 'plugin.unloaded',
        timestamp: new Date(),
        payload: {
          name: pluginName,
        },
        metadata: { source: 'plugin-manager' },
      });
    } catch (error) {
      // Emit error event
      this.events.emit({
        id: randomUUID(),
        type: 'plugin.error',
        timestamp: new Date(),
        payload: {
          name: pluginName,
          operation: 'unload',
          error: error as Error,
        },
        metadata: { source: 'plugin-manager' },
      });

      throw error;
    }
  }

  /**
   * Unloads all loaded plugins in reverse dependency order.
   * Continues unloading even if individual plugins fail.
   * 
   * @returns UnloadResult with successful and failed plugin unloads
   * 
   * @example
   * ```typescript
   * const result = await manager.unloadAll();
   * console.log(`Unloaded: ${result.successful.join(', ')}`);
   * ```
   */
  async unloadAll(): Promise<UnloadResult> {
    const result: UnloadResult = {
      successful: [],
      failed: [],
    };

    // Get reverse load order
    const loadedPlugins = new Map<string, Plugin>(this.loaded);
    let unloadOrder: string[];

    try {
      unloadOrder = DependencyResolver.resolveDependencies(loadedPlugins);
      unloadOrder.reverse(); // Reverse to unload dependents first
    } catch (error) {
      // If resolution fails, just unload in any order
      unloadOrder = Array.from(loadedPlugins.keys());
    }

    // Unload each plugin
    for (const pluginName of unloadOrder) {
      try {
        const plugin = this.loaded.get(pluginName);
        if (plugin && plugin.unload) {
          await plugin.unload();
        }

        this.loaded.delete(pluginName);

        // Emit unloaded event
        this.events.emit({
          id: randomUUID(),
          type: 'plugin.unloaded',
          timestamp: new Date(),
          payload: {
            name: pluginName,
          },
          metadata: { source: 'plugin-manager' },
        });

        result.successful.push(pluginName);
      } catch (error) {
        result.failed.push({
          name: pluginName,
          error: error as Error,
        });
      }
    }

    return result;
  }

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
   * const authPlugin = manager.getPlugin<AuthPlugin>('auth-plugin');
   * authPlugin.authenticate(user);
   * ```
   */
  getPlugin<T extends Plugin>(name: string): T {
    if (!this.loaded.has(name)) {
      throw new PluginNotFoundError(name, 'loaded');
    }

    return this.loaded.get(name) as T;
  }

  /**
   * Checks if a plugin is currently loaded.
   * 
   * @param name - Name of the plugin to check
   * @returns True if the plugin is loaded, false otherwise
   */
  isLoaded(name: string): boolean {
    return this.loaded.has(name);
  }

  /**
   * Checks if a plugin is registered.
   * 
   * @param name - Name of the plugin to check
   * @returns True if the plugin is registered, false otherwise
   */
  isRegistered(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Gets the names of all loaded plugins.
   * 
   * @returns Array of loaded plugin names
   */
  getLoadedPlugins(): string[] {
    return Array.from(this.loaded.keys());
  }

  /**
   * Gets the names of all registered plugins.
   * 
   * @returns Array of registered plugin names
   */
  getRegisteredPlugins(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Creates a logger instance for a plugin.
   * 
   * @param pluginName - Name of the plugin
   * @returns Logger instance
   */
  private createLogger(pluginName: string): Logger {
    return {
      debug: (message: string, ...args: unknown[]) => {
        console.debug(`[${pluginName}] ${message}`, ...args);
      },
      info: (message: string, ...args: unknown[]) => {
        console.info(`[${pluginName}] ${message}`, ...args);
      },
      warn: (message: string, ...args: unknown[]) => {
        console.warn(`[${pluginName}] ${message}`, ...args);
      },
      error: (message: string, ...args: unknown[]) => {
        console.error(`[${pluginName}] ${message}`, ...args);
      },
    };
  }
}

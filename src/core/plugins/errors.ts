/**
 * Error thrown when attempting to register a plugin with a name that already exists.
 */
export class DuplicatePluginError extends Error {
  constructor(name: string) {
    super(`Plugin '${name}' is already registered`);
    this.name = 'DuplicatePluginError';
  }
}

/**
 * Error thrown when a plugin depends on another plugin that is not registered.
 */
export class MissingDependencyError extends Error {
  constructor(plugin: string, dependency: string) {
    super(`Plugin '${plugin}' requires missing dependency '${dependency}'`);
    this.name = 'MissingDependencyError';
  }
}

/**
 * Error thrown when a circular dependency is detected in the plugin dependency graph.
 */
export class CircularDependencyError extends Error {
  constructor(cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}

/**
 * Error thrown when attempting to access a plugin that is not registered or loaded.
 */
export class PluginNotFoundError extends Error {
  constructor(name: string, context: 'registered' | 'loaded' = 'loaded') {
    super(`Plugin '${name}' is not ${context}`);
    this.name = 'PluginNotFoundError';
  }
}

/**
 * Error thrown when attempting to unload a plugin that other loaded plugins depend on.
 */
export class PluginInUseError extends Error {
  constructor(plugin: string, dependents: string[]) {
    super(
      `Cannot unload plugin '${plugin}': required by ${dependents.join(', ')}`
    );
    this.name = 'PluginInUseError';
  }
}

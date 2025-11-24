/**
 * State data wrapper that includes version and metadata.
 * 
 * @template T - The type of the state data
 */
export interface StateData<T = unknown> {
  /** Version number for migration support */
  version: number;
  /** The actual state data */
  data: T;
  /** Metadata about the state */
  metadata: {
    /** When the state was last modified */
    lastModified: Date;
    /** Name of the plugin that owns this state */
    pluginName: string;
  };
}

/**
 * Function that migrates state from one version to another.
 * 
 * @template T - The type of the state data
 */
export type MigrationFunction<T = unknown> = (
  oldState: T,
  oldVersion: number
) => T;

/**
 * Function that validates state data.
 * 
 * @template T - The type of the state data
 * @returns true if state is valid, false otherwise
 */
export type ValidationFunction<T = unknown> = (state: T) => boolean;

/**
 * Interface for state storage implementations.
 * Provides methods for saving, loading, and managing plugin state.
 * 
 * @example
 * ```typescript
 * const store: StateStore = new FileSystemStateStore(events);
 * 
 * // Save state
 * await store.save('my-plugin', { count: 42 }, 1);
 * 
 * // Load state
 * const state = await store.load<{ count: number }>('my-plugin');
 * console.log(state?.data.count); // 42
 * ```
 */
export interface StateStore {
  /**
   * Saves state for a plugin.
   * Creates a backup of existing state before overwriting.
   * 
   * @template T - The type of the state data
   * @param pluginName - Name of the plugin
   * @param data - State data to save
   * @param version - Version number (default: 1)
   * @throws {StateWriteError} If save fails
   */
  save<T>(pluginName: string, data: T, version?: number): Promise<void>;

  /**
   * Loads state for a plugin.
   * 
   * @template T - The type of the state data
   * @param pluginName - Name of the plugin
   * @returns State data or null if no state exists
   * @throws {StateReadError} If read fails
   * @throws {StateParseError} If JSON parsing fails
   */
  load<T>(pluginName: string): Promise<StateData<T> | null>;

  /**
   * Checks if state exists for a plugin.
   * 
   * @param pluginName - Name of the plugin
   * @returns true if state exists, false otherwise
   */
  exists(pluginName: string): Promise<boolean>;

  /**
   * Clears state for a plugin.
   * Creates a backup before deletion.
   * 
   * @param pluginName - Name of the plugin
   * @throws {StateWriteError} If deletion fails
   */
  clear(pluginName: string): Promise<void>;

  /**
   * Migrates state from current version to target version.
   * Applies migrations in sequence.
   * 
   * @template T - The type of the state data
   * @param pluginName - Name of the plugin
   * @param targetVersion - Target version number
   * @param migrations - Map of version -> migration function
   * @throws {StateReadError} If load fails
   * @throws {StateWriteError} If save fails
   */
  migrate<T>(
    pluginName: string,
    targetVersion: number,
    migrations: Map<number, MigrationFunction<T>>
  ): Promise<void>;

  /**
   * Validates state data using a validation function.
   * 
   * @template T - The type of the state data
   * @param pluginName - Name of the plugin
   * @param validator - Validation function
   * @returns true if valid, false otherwise
   * @throws {StateReadError} If load fails
   */
  validate<T>(
    pluginName: string,
    validator: ValidationFunction<T>
  ): Promise<boolean>;

  /**
   * Restores state from a backup.
   * 
   * @param pluginName - Name of the plugin
   * @param backupIndex - Backup index (0 = most recent, default: 0)
   * @throws {StateReadError} If backup doesn't exist
   * @throws {StateWriteError} If restore fails
   */
  restore(pluginName: string, backupIndex?: number): Promise<void>;

  /**
   * Lists available backups for a plugin.
   * 
   * @param pluginName - Name of the plugin
   * @returns Array of backup file paths
   */
  listBackups(pluginName: string): Promise<string[]>;
}

import {
  StateStore,
  StateData,
  MigrationFunction,
  ValidationFunction,
} from './state-store';

/**
 * Scoped state manager that automatically provides plugin name.
 * Wraps a StateStore and injects the plugin name for all operations.
 * 
 * @example
 * ```typescript
 * // In plugin code
 * class MyPlugin implements Plugin {
 *   async load(context: PluginContext) {
 *     // No need to specify plugin name
 *     await context.state.save({ count: 42 }, 1);
 *     const state = await context.state.load();
 *   }
 * }
 * ```
 */
export class StateManager {
  private store: StateStore;
  private pluginName: string;

  constructor(store: StateStore, pluginName: string) {
    this.store = store;
    this.pluginName = pluginName;
  }

  async save<T>(data: T, version?: number): Promise<void> {
    return this.store.save(this.pluginName, data, version);
  }

  async load<T>(): Promise<StateData<T> | null> {
    return this.store.load<T>(this.pluginName);
  }

  async exists(): Promise<boolean> {
    return this.store.exists(this.pluginName);
  }

  async clear(): Promise<void> {
    return this.store.clear(this.pluginName);
  }

  async migrate<T>(
    targetVersion: number,
    migrations: Map<number, MigrationFunction<T>>
  ): Promise<void> {
    return this.store.migrate(this.pluginName, targetVersion, migrations);
  }

  async validate<T>(validator: ValidationFunction<T>): Promise<boolean> {
    return this.store.validate(this.pluginName, validator);
  }

  async restore(backupIndex?: number): Promise<void> {
    return this.store.restore(this.pluginName, backupIndex);
  }

  async listBackups(): Promise<string[]> {
    return this.store.listBackups(this.pluginName);
  }
}

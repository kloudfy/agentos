import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from '../events';
import {
  StateStore,
  StateData,
  MigrationFunction,
  ValidationFunction,
} from './state-store';
import {
  StateWriteError,
  StateReadError,
  StateParseError,
} from './errors';

/**
 * Options for FileSystemStateStore.
 */
export interface FileSystemStateStoreOptions {
  /** Directory where state files are stored (default: '.agentos/state') */
  stateDir?: string;
  /** Maximum number of backups to keep (default: 3) */
  maxBackups?: number;
  /** Whether to pretty-print JSON (default: true) */
  prettyPrint?: boolean;
}

/**
 * State store implementation that uses the filesystem.
 * Stores state as JSON files with automatic backups and versioning.
 * 
 * @example
 * ```typescript
 * const events = new EventEmitter();
 * const store = new FileSystemStateStore(events, {
 *   stateDir: '.agentos/state',
 *   maxBackups: 3
 * });
 * 
 * await store.save('my-plugin', { count: 42 }, 1);
 * const state = await store.load('my-plugin');
 * ```
 */
export class FileSystemStateStore implements StateStore {
  private stateDir: string;
  private maxBackups: number;
  private prettyPrint: boolean;
  private events: EventEmitter;
  private operationQueue: Map<string, Promise<void>>;

  constructor(events: EventEmitter, options: FileSystemStateStoreOptions = {}) {
    this.stateDir = options.stateDir || '.agentos/state';
    this.maxBackups = options.maxBackups || 3;
    this.prettyPrint = options.prettyPrint !== false;
    this.events = events;
    this.operationQueue = new Map();
  }

  async save<T>(pluginName: string, data: T, version: number = 1): Promise<void> {
    return this.queueOperation(pluginName, async () => {
      try {
        // Ensure state directory exists
        await fs.mkdir(this.stateDir, { recursive: true });

        const statePath = this.getStatePath(pluginName);

        // Create backup if state exists
        if (await this.exists(pluginName)) {
          await this.createBackup(pluginName);
        }

        // Create state data
        const stateData: StateData<T> = {
          version,
          data,
          metadata: {
            lastModified: new Date(),
            pluginName,
          },
        };

        // Write to temporary file first (atomic write)
        const tempPath = `${statePath}.tmp`;
        const json = this.prettyPrint
          ? JSON.stringify(stateData, null, 2)
          : JSON.stringify(stateData);

        await fs.writeFile(tempPath, json, 'utf-8');

        // Rename to final path (atomic operation)
        await fs.rename(tempPath, statePath);

        // Rotate backups if needed
        await this.rotateBackups(pluginName);

        // Get file size for event
        const stats = await fs.stat(statePath);

        // Emit success event
        this.events.emit({
          id: randomUUID(),
          type: 'state.saved',
          timestamp: new Date(),
          payload: {
            pluginName,
            version,
            size: stats.size,
          },
          metadata: { source: 'state-store' },
        });
      } catch (error) {
        // Emit error event
        this.events.emit({
          id: randomUUID(),
          type: 'state.error',
          timestamp: new Date(),
          payload: {
            pluginName,
            operation: 'save',
            error: error as Error,
          },
          metadata: { source: 'state-store' },
        });

        throw new StateWriteError(pluginName, error as Error);
      }
    });
  }

  async load<T>(pluginName: string): Promise<StateData<T> | null> {
    return this.queueOperation(pluginName, async () => {
      try {
        const statePath = this.getStatePath(pluginName);

        // Check if file exists
        try {
          await fs.access(statePath);
        } catch (error) {
          // File doesn't exist, return null
          return null;
        }

        // Read file
        const json = await fs.readFile(statePath, 'utf-8');

        // Parse JSON
        let parsed: any;
        try {
          parsed = JSON.parse(json);
        } catch (error) {
          throw new StateParseError(pluginName, error as Error);
        }

        // Validate structure
        if (!parsed.version || !parsed.data || !parsed.metadata) {
          throw new StateParseError(
            pluginName,
            new Error('Invalid state structure: missing required fields')
          );
        }

        // Convert date string to Date object
        const stateData: StateData<T> = {
          version: parsed.version,
          data: parsed.data,
          metadata: {
            lastModified: new Date(parsed.metadata.lastModified),
            pluginName: parsed.metadata.pluginName,
          },
        };

        // Emit success event
        this.events.emit({
          id: randomUUID(),
          type: 'state.loaded',
          timestamp: new Date(),
          payload: {
            pluginName,
            version: stateData.version,
          },
          metadata: { source: 'state-store' },
        });

        return stateData;
      } catch (error) {
        if (error instanceof StateParseError) {
          // Emit error event
          this.events.emit({
            id: randomUUID(),
            type: 'state.error',
            timestamp: new Date(),
            payload: {
              pluginName,
              operation: 'load',
              error: error as Error,
            },
            metadata: { source: 'state-store' },
          });
          throw error;
        }

        // Emit error event
        this.events.emit({
          id: randomUUID(),
          type: 'state.error',
          timestamp: new Date(),
          payload: {
            pluginName,
            operation: 'load',
            error: error as Error,
          },
          metadata: { source: 'state-store' },
        });

        throw new StateReadError(pluginName, error as Error);
      }
    });
  }

  async exists(pluginName: string): Promise<boolean> {
    try {
      const statePath = this.getStatePath(pluginName);
      await fs.access(statePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async clear(pluginName: string): Promise<void> {
    return this.queueOperation(pluginName, async () => {
      try {
        const statePath = this.getStatePath(pluginName);

        // Create backup before clearing
        if (await this.exists(pluginName)) {
          await this.createBackup(pluginName);
        }

        // Delete state file
        await fs.unlink(statePath);

        // Emit success event
        this.events.emit({
          id: randomUUID(),
          type: 'state.cleared',
          timestamp: new Date(),
          payload: {
            pluginName,
          },
          metadata: { source: 'state-store' },
        });
      } catch (error) {
        // Emit error event
        this.events.emit({
          id: randomUUID(),
          type: 'state.error',
          timestamp: new Date(),
          payload: {
            pluginName,
            operation: 'clear',
            error: error as Error,
          },
          metadata: { source: 'state-store' },
        });

        throw new StateWriteError(pluginName, error as Error);
      }
    });
  }

  async migrate<T>(
    pluginName: string,
    targetVersion: number,
    migrations: Map<number, MigrationFunction<T>>
  ): Promise<void> {
    return this.queueOperation(pluginName, async () => {
      // Load current state
      const state = await this.load<T>(pluginName);

      if (!state) {
        // No state to migrate
        return;
      }

      const currentVersion = state.version;

      if (currentVersion >= targetVersion) {
        // Already at target version or newer
        return;
      }

      // Apply migrations in sequence
      let migratedData = state.data;
      for (let v = currentVersion + 1; v <= targetVersion; v++) {
        const migration = migrations.get(v);
        if (migration) {
          migratedData = migration(migratedData, v - 1);
        }
      }

      // Save migrated state
      await this.save(pluginName, migratedData, targetVersion);

      // Emit migration event
      this.events.emit({
        id: randomUUID(),
        type: 'state.migrated',
        timestamp: new Date(),
        payload: {
          pluginName,
          fromVersion: currentVersion,
          toVersion: targetVersion,
        },
        metadata: { source: 'state-store' },
      });
    });
  }

  async validate<T>(
    pluginName: string,
    validator: ValidationFunction<T>
  ): Promise<boolean> {
    try {
      const state = await this.load<T>(pluginName);

      if (!state) {
        // No state exists, consider valid
        return true;
      }

      return validator(state.data);
    } catch (error) {
      // Emit error event
      this.events.emit({
        id: randomUUID(),
        type: 'state.error',
        timestamp: new Date(),
        payload: {
          pluginName,
          operation: 'validate',
          error: error as Error,
        },
        metadata: { source: 'state-store' },
      });

      throw error;
    }
  }

  async restore(pluginName: string, backupIndex: number = 0): Promise<void> {
    return this.queueOperation(pluginName, async () => {
      try {
        const backupPath = this.getBackupPath(pluginName, backupIndex + 1);
        const statePath = this.getStatePath(pluginName);

        // Check if backup exists
        await fs.access(backupPath);

        // Copy backup to state file
        await fs.copyFile(backupPath, statePath);

        // Emit success event
        this.events.emit({
          id: randomUUID(),
          type: 'state.restored',
          timestamp: new Date(),
          payload: {
            pluginName,
            backupIndex,
          },
          metadata: { source: 'state-store' },
        });
      } catch (error) {
        throw new StateReadError(pluginName, error as Error);
      }
    });
  }

  async listBackups(pluginName: string): Promise<string[]> {
    try {
      const files = await fs.readdir(this.stateDir);
      const sanitized = this.sanitizePluginName(pluginName);
      const backupPrefix = `${sanitized}.backup.`;

      const backups = files
        .filter((file) => file.startsWith(backupPrefix))
        .sort()
        .reverse(); // Most recent first

      return backups.map((file) => join(this.stateDir, file));
    } catch (error) {
      return [];
    }
  }

  private getStatePath(pluginName: string): string {
    const sanitized = this.sanitizePluginName(pluginName);
    return join(this.stateDir, `${sanitized}.json`);
  }

  private getBackupPath(pluginName: string, index: number): string {
    const sanitized = this.sanitizePluginName(pluginName);
    return join(this.stateDir, `${sanitized}.backup.${index}.json`);
  }

  private sanitizePluginName(pluginName: string): string {
    // Remove path separators and special characters
    return pluginName.replace(/[^a-zA-Z0-9-_]/g, '-');
  }

  private async createBackup(pluginName: string): Promise<void> {
    try {
      const statePath = this.getStatePath(pluginName);

      // Check if state file exists
      try {
        await fs.access(statePath);
      } catch (error) {
        // No state file, nothing to backup
        return;
      }

      // Find next backup index
      const backups = await this.listBackups(pluginName);
      const nextIndex = backups.length + 1;

      const backupPath = this.getBackupPath(pluginName, nextIndex);

      // Copy state file to backup
      await fs.copyFile(statePath, backupPath);

      // Emit backup created event
      this.events.emit({
        id: randomUUID(),
        type: 'state.backup.created',
        timestamp: new Date(),
        payload: {
          pluginName,
          backupPath,
        },
        metadata: { source: 'state-store' },
      });
    } catch (error) {
      // Backup failure shouldn't prevent save
      console.error(`Failed to create backup for ${pluginName}:`, error);
    }
  }

  private async rotateBackups(pluginName: string): Promise<void> {
    try {
      const backups = await this.listBackups(pluginName);

      if (backups.length <= this.maxBackups) {
        return;
      }

      // Delete oldest backups
      const toDelete = backups.slice(this.maxBackups);
      for (const backup of toDelete) {
        await fs.unlink(backup);
      }
    } catch (error) {
      // Rotation failure shouldn't prevent save
      console.error(`Failed to rotate backups for ${pluginName}:`, error);
    }
  }

  private async queueOperation<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // Wait for any pending operation for this key
    const pending = this.operationQueue.get(key);
    if (pending) {
      await pending.catch(() => {
        // Ignore errors from previous operations
      });
    }

    // Execute operation and store promise
    const promise = operation();
    this.operationQueue.set(
      key,
      promise.then(() => {}).catch(() => {})
    );

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up if this was the last operation
      if (this.operationQueue.get(key) === promise) {
        this.operationQueue.delete(key);
      }
    }
  }
}

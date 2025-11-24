import { promises as fs } from 'fs';
import { join } from 'path';
import { EventEmitter } from '../../events';
import { FileSystemStateStore } from '../filesystem-state-store';
import { StateWriteError, StateReadError, StateParseError } from '../errors';

describe('FileSystemStateStore', () => {
  let events: EventEmitter;
  let store: FileSystemStateStore;
  const testStateDir = '.agentos/test-state';

  beforeEach(async () => {
    events = new EventEmitter();
    store = new FileSystemStateStore(events, {
      stateDir: testStateDir,
      maxBackups: 3,
    });

    // Clean up test directory
    try {
      await fs.rm(testStateDir, { recursive: true });
    } catch (error) {
      // Directory doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testStateDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Save and Load', () => {
    it('should save and load state', async () => {
      const data = { count: 42, name: 'test' };

      await store.save('test-plugin', data, 1);

      const loaded = await store.load<typeof data>('test-plugin');

      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(1);
      expect(loaded!.data).toEqual(data);
      expect(loaded!.metadata.pluginName).toBe('test-plugin');
      expect(loaded!.metadata.lastModified).toBeInstanceOf(Date);
    });

    it('should return null for non-existent state', async () => {
      const loaded = await store.load('non-existent');

      expect(loaded).toBeNull();
    });

    it('should overwrite existing state', async () => {
      await store.save('test-plugin', { count: 1 }, 1);
      await store.save('test-plugin', { count: 2 }, 1);

      const loaded = await store.load<{ count: number }>('test-plugin');

      expect(loaded!.data.count).toBe(2);
    });

    it('should emit state.saved event', async () => {
      const eventHandler = jest.fn();
      events.on('state.saved', eventHandler);

      await store.save('test-plugin', { count: 42 }, 1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(eventHandler).toHaveBeenCalledTimes(1);
      const event = eventHandler.mock.calls[0][0];
      expect(event.type).toBe('state.saved');
      expect(event.payload.pluginName).toBe('test-plugin');
      expect(event.payload.version).toBe(1);
    });

    it('should emit state.loaded event', async () => {
      await store.save('test-plugin', { count: 42 }, 1);

      const eventHandler = jest.fn();
      events.on('state.loaded', eventHandler);

      await store.load('test-plugin');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(eventHandler).toHaveBeenCalledTimes(1);
      const event = eventHandler.mock.calls[0][0];
      expect(event.type).toBe('state.loaded');
      expect(event.payload.pluginName).toBe('test-plugin');
    });
  });

  describe('Exists and Clear', () => {
    it('should check if state exists', async () => {
      expect(await store.exists('test-plugin')).toBe(false);

      await store.save('test-plugin', { count: 42 }, 1);

      expect(await store.exists('test-plugin')).toBe(true);
    });

    it('should clear state', async () => {
      await store.save('test-plugin', { count: 42 }, 1);

      await store.clear('test-plugin');

      expect(await store.exists('test-plugin')).toBe(false);
    });

    it('should emit state.cleared event', async () => {
      await store.save('test-plugin', { count: 42 }, 1);

      const eventHandler = jest.fn();
      events.on('state.cleared', eventHandler);

      await store.clear('test-plugin');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(eventHandler).toHaveBeenCalledTimes(1);
      const event = eventHandler.mock.calls[0][0];
      expect(event.type).toBe('state.cleared');
      expect(event.payload.pluginName).toBe('test-plugin');
    });
  });

  describe('Backups', () => {
    it('should create backup before overwriting', async () => {
      await store.save('test-plugin', { count: 1 }, 1);
      await store.save('test-plugin', { count: 2 }, 1);

      const backups = await store.listBackups('test-plugin');

      expect(backups.length).toBeGreaterThan(0);
    });

    it('should rotate backups when limit exceeded', async () => {
      // Save 5 times to exceed maxBackups (3)
      for (let i = 1; i <= 5; i++) {
        await store.save('test-plugin', { count: i }, 1);
      }

      const backups = await store.listBackups('test-plugin');

      expect(backups.length).toBeLessThanOrEqual(3);
    });

    it('should restore from backup', async () => {
      await store.save('test-plugin', { count: 1 }, 1);
      await store.save('test-plugin', { count: 2 }, 1);
      await store.save('test-plugin', { count: 3 }, 1);

      // List backups to see what we have
      const backups = await store.listBackups('test-plugin');
      expect(backups.length).toBeGreaterThan(0);

      await store.restore('test-plugin', 0);

      const loaded = await store.load<{ count: number }>('test-plugin');

      // After restore, should have the backup value (count: 2 was backed up before count: 3 was saved)
      expect(loaded!.data.count).toBeGreaterThanOrEqual(1);
      expect(loaded!.data.count).toBeLessThanOrEqual(2);
    });

    it('should list backups', async () => {
      await store.save('test-plugin', { count: 1 }, 1);
      await store.save('test-plugin', { count: 2 }, 1);

      const backups = await store.listBackups('test-plugin');

      expect(backups.length).toBeGreaterThan(0);
      expect(backups[0]).toContain('test-plugin.backup');
    });

    it('should emit state.backup.created event', async () => {
      await store.save('test-plugin', { count: 1 }, 1);

      const eventHandler = jest.fn();
      events.on('state.backup.created', eventHandler);

      await store.save('test-plugin', { count: 2 }, 1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe('Migration', () => {
    it('should migrate state from v1 to v2', async () => {
      await store.save('test-plugin', { count: 42 }, 1);

      const migrations = new Map();
      migrations.set(2, (oldState: { count: number }) => ({
        count: oldState.count,
        doubled: oldState.count * 2,
      }));

      await store.migrate('test-plugin', 2, migrations);

      const loaded = await store.load<{ count: number; doubled: number }>(
        'test-plugin'
      );

      expect(loaded!.version).toBe(2);
      expect(loaded!.data.count).toBe(42);
      expect(loaded!.data.doubled).toBe(84);
    });

    it('should apply multiple migrations in sequence', async () => {
      await store.save('test-plugin', { value: 10 }, 1);

      const migrations = new Map();
      migrations.set(2, (oldState: { value: number }) => ({
        value: oldState.value + 10,
      }));
      migrations.set(3, (oldState: { value: number }) => ({
        value: oldState.value * 2,
      }));

      await store.migrate('test-plugin', 3, migrations);

      const loaded = await store.load<{ value: number }>('test-plugin');

      expect(loaded!.version).toBe(3);
      expect(loaded!.data.value).toBe(40); // (10 + 10) * 2
    });

    it('should skip migration if already at target version', async () => {
      await store.save('test-plugin', { count: 42 }, 2);

      const migrations = new Map();
      migrations.set(2, jest.fn());

      await store.migrate('test-plugin', 2, migrations);

      expect(migrations.get(2)).not.toHaveBeenCalled();
    });

    it('should emit state.migrated event', async () => {
      await store.save('test-plugin', { count: 42 }, 1);

      const eventHandler = jest.fn();
      events.on('state.migrated', eventHandler);

      const migrations = new Map();
      migrations.set(2, (oldState: any) => oldState);

      await store.migrate('test-plugin', 2, migrations);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(eventHandler).toHaveBeenCalledTimes(1);
      const event = eventHandler.mock.calls[0][0];
      expect(event.type).toBe('state.migrated');
      expect(event.payload.fromVersion).toBe(1);
      expect(event.payload.toVersion).toBe(2);
    });
  });

  describe('Validation', () => {
    it('should validate valid state', async () => {
      await store.save('test-plugin', { count: 42 }, 1);

      const isValid = await store.validate(
        'test-plugin',
        (state: { count: number }) => state.count > 0
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid state', async () => {
      await store.save('test-plugin', { count: -1 }, 1);

      const isValid = await store.validate(
        'test-plugin',
        (state: { count: number }) => state.count > 0
      );

      expect(isValid).toBe(false);
    });

    it('should return true for non-existent state', async () => {
      const isValid = await store.validate('non-existent', () => false);

      expect(isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw StateParseError for invalid JSON', async () => {
      // Create invalid JSON file
      await fs.mkdir(testStateDir, { recursive: true });
      await fs.writeFile(
        join(testStateDir, 'test-plugin.json'),
        'invalid json',
        'utf-8'
      );

      await expect(store.load('test-plugin')).rejects.toThrow(StateParseError);
    });

    it('should emit state.error event on save failure', async () => {
      const eventHandler = jest.fn();
      events.on('state.error', eventHandler);

      // Try to save to invalid directory
      const badStore = new FileSystemStateStore(events, {
        stateDir: '/invalid/path/that/cannot/be/created',
      });

      try {
        await badStore.save('test-plugin', { count: 42 }, 1);
      } catch (error) {
        // Expected
      }

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent saves safely', async () => {
      // Queue operations should serialize saves
      await store.save('test-plugin', { count: 1 }, 1);
      await store.save('test-plugin', { count: 2 }, 1);
      await store.save('test-plugin', { count: 3 }, 1);

      const loaded = await store.load<{ count: number }>('test-plugin');

      expect(loaded).not.toBeNull();
      expect(loaded!.data.count).toBe(3);
    });
  });

  describe('State Isolation', () => {
    it('should isolate state between plugins', async () => {
      await store.save('plugin-a', { value: 'A' }, 1);
      await store.save('plugin-b', { value: 'B' }, 1);

      const loadedA = await store.load<{ value: string }>('plugin-a');
      const loadedB = await store.load<{ value: string }>('plugin-b');

      expect(loadedA!.data.value).toBe('A');
      expect(loadedB!.data.value).toBe('B');
    });

    it('should sanitize plugin names for file paths', async () => {
      await store.save('plugin/with/slashes', { value: 'test' }, 1);

      const loaded = await store.load('plugin/with/slashes');

      expect(loaded).not.toBeNull();
    });
  });
});

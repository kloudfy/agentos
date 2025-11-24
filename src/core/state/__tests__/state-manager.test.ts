import { EventEmitter } from '../../events';
import { FileSystemStateStore } from '../filesystem-state-store';
import { StateManager } from '../state-manager';
import { promises as fs } from 'fs';

describe('StateManager', () => {
  let events: EventEmitter;
  let store: FileSystemStateStore;
  let manager: StateManager;
  const testStateDir = '.agentos/test-state-manager';

  beforeEach(async () => {
    events = new EventEmitter();
    store = new FileSystemStateStore(events, {
      stateDir: testStateDir,
    });
    manager = new StateManager(store, 'test-plugin');

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

  it('should save state without specifying plugin name', async () => {
    await manager.save({ count: 42 }, 1);

    const loaded = await manager.load<{ count: number }>();

    expect(loaded).not.toBeNull();
    expect(loaded!.data.count).toBe(42);
  });

  it('should load state without specifying plugin name', async () => {
    await store.save('test-plugin', { count: 42 }, 1);

    const loaded = await manager.load<{ count: number }>();

    expect(loaded).not.toBeNull();
    expect(loaded!.data.count).toBe(42);
  });

  it('should check exists without specifying plugin name', async () => {
    expect(await manager.exists()).toBe(false);

    await manager.save({ count: 42 }, 1);

    expect(await manager.exists()).toBe(true);
  });

  it('should clear state without specifying plugin name', async () => {
    await manager.save({ count: 42 }, 1);

    await manager.clear();

    expect(await manager.exists()).toBe(false);
  });

  it('should migrate state without specifying plugin name', async () => {
    await manager.save({ count: 42 }, 1);

    const migrations = new Map();
    migrations.set(2, (oldState: { count: number }) => ({
      count: oldState.count * 2,
    }));

    await manager.migrate(2, migrations);

    const loaded = await manager.load<{ count: number }>();

    expect(loaded!.version).toBe(2);
    expect(loaded!.data.count).toBe(84);
  });

  it('should validate state without specifying plugin name', async () => {
    await manager.save({ count: 42 }, 1);

    const isValid = await manager.validate((state: { count: number }) => state.count > 0);

    expect(isValid).toBe(true);
  });

  it('should restore from backup without specifying plugin name', async () => {
    await manager.save({ count: 1 }, 1);
    await manager.save({ count: 2 }, 1);

    await manager.restore(0);

    const loaded = await manager.load<{ count: number }>();

    expect(loaded!.data.count).toBe(1);
  });

  it('should list backups without specifying plugin name', async () => {
    await manager.save({ count: 1 }, 1);
    await manager.save({ count: 2 }, 1);

    const backups = await manager.listBackups();

    expect(backups.length).toBeGreaterThan(0);
  });
});

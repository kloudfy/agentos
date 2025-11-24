import { promises as fs } from 'fs';
import { EventEmitter } from '../../events';
import { PluginManager } from '../../plugins/plugin-manager';
import { Plugin } from '../../plugins/plugin';
import { PluginContext } from '../../plugins/plugin-context';
import { FileSystemStateStore } from '../filesystem-state-store';

describe('State Management Integration', () => {
  let events: EventEmitter;
  let stateStore: FileSystemStateStore;
  let pluginManager: PluginManager;
  const testStateDir = '.agentos/test-integration';

  beforeEach(async () => {
    events = new EventEmitter();
    stateStore = new FileSystemStateStore(events, {
      stateDir: testStateDir,
    });
    pluginManager = new PluginManager(events, stateStore);

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

  it('should allow plugin to save and load state', async () => {
    let savedState: any = null;
    let loadedState: any = null;

    const plugin: Plugin = {
      metadata: {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
      },
      load: async (context: PluginContext) => {
        // Save state
        await context.state.save({ count: 42, name: 'test' }, 1);
        savedState = { count: 42, name: 'test' };

        // Load state
        const state = await context.state.load<{ count: number; name: string }>();
        loadedState = state?.data;
      },
    };

    pluginManager.register(plugin);
    await pluginManager.load('test-plugin');

    expect(savedState).toEqual({ count: 42, name: 'test' });
    expect(loadedState).toEqual({ count: 42, name: 'test' });
  });

  it('should persist state across plugin reloads', async () => {
    const plugin: Plugin = {
      metadata: {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
      },
      load: async (context: PluginContext) => {
        const state = await context.state.load<{ count: number }>();
        if (!state) {
          await context.state.save({ count: 1 }, 1);
        } else {
          await context.state.save({ count: state.data.count + 1 }, 1);
        }
      },
    };

    pluginManager.register(plugin);

    // First load
    await pluginManager.load('test-plugin');
    let state = await stateStore.load<{ count: number }>('test-plugin');
    expect(state!.data.count).toBe(1);

    // Unload and reload
    await pluginManager.unload('test-plugin');
    await pluginManager.load('test-plugin');
    state = await stateStore.load<{ count: number }>('test-plugin');
    expect(state!.data.count).toBe(2);
  });

  it('should emit state events during plugin operations', async () => {
    const stateEvents: string[] = [];
    events.on('state.saved', () => {
      stateEvents.push('saved');
    });
    events.on('state.loaded', () => {
      stateEvents.push('loaded');
    });

    const plugin: Plugin = {
      metadata: {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
      },
      load: async (context: PluginContext) => {
        await context.state.save({ count: 42 }, 1);
        await context.state.load();
      },
    };

    pluginManager.register(plugin);
    await pluginManager.load('test-plugin');

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(stateEvents).toContain('saved');
    expect(stateEvents).toContain('loaded');
  });

  it('should isolate state between plugins', async () => {
    const pluginA: Plugin = {
      metadata: {
        name: 'plugin-a',
        version: '1.0.0',
        description: 'Plugin A',
      },
      load: async (context: PluginContext) => {
        await context.state.save({ value: 'A' }, 1);
      },
    };

    const pluginB: Plugin = {
      metadata: {
        name: 'plugin-b',
        version: '1.0.0',
        description: 'Plugin B',
      },
      load: async (context: PluginContext) => {
        await context.state.save({ value: 'B' }, 1);
      },
    };

    pluginManager.register(pluginA);
    pluginManager.register(pluginB);

    await pluginManager.load('plugin-a');
    await pluginManager.load('plugin-b');

    const stateA = await stateStore.load<{ value: string }>('plugin-a');
    const stateB = await stateStore.load<{ value: string }>('plugin-b');

    expect(stateA!.data.value).toBe('A');
    expect(stateB!.data.value).toBe('B');
  });
});

import { EventEmitter } from '../../events';
import { PluginManager } from '../plugin-manager';
import { Plugin } from '../plugin';
import { PluginContext } from '../plugin-context';
import {
  DuplicatePluginError,
  PluginNotFoundError,
  MissingDependencyError,
  PluginInUseError,
} from '../errors';

// Create a mock plugin with optional dependencies
const createMockPlugin = (
  name: string,
  dependencies: string[] = []
): Plugin => ({
  metadata: {
    name,
    version: '1.0.0',
    description: `Mock plugin ${name}`,
    dependencies,
  },
});

// Create a plugin with lifecycle tracking
const createTrackingPlugin = (name: string, dependencies: string[] = []) => {
  const calls: string[] = [];
  const plugin: Plugin = {
    metadata: {
      name,
      version: '1.0.0',
      description: `Tracking plugin ${name}`,
      dependencies,
    },
    configure: jest.fn(() => {
      calls.push('configure');
    }),
    load: jest.fn(() => {
      calls.push('load');
    }),
    unload: jest.fn(() => {
      calls.push('unload');
    }),
  };
  return { plugin, calls };
};

describe('PluginManager', () => {
  let events: EventEmitter;
  let manager: PluginManager;

  beforeEach(() => {
    events = new EventEmitter();
    manager = new PluginManager(events);
  });

  describe('Plugin Registration', () => {
    it('should register a plugin successfully', () => {
      const plugin = createMockPlugin('test-plugin');
      
      expect(() => manager.register(plugin)).not.toThrow();
      expect(manager.isRegistered('test-plugin')).toBe(true);
    });

    it('should throw error when registering duplicate plugin name', () => {
      const plugin1 = createMockPlugin('test-plugin');
      const plugin2 = createMockPlugin('test-plugin');

      manager.register(plugin1);

      expect(() => manager.register(plugin2)).toThrow(DuplicatePluginError);
    });

    it('should store plugin configuration', () => {
      const plugin = createMockPlugin('test-plugin');
      const config = { apiKey: 'secret', timeout: 5000 };

      manager.register(plugin, config);

      expect(manager.isRegistered('test-plugin')).toBe(true);
    });
  });

  describe('Plugin Loading', () => {
    it('should load plugin without dependencies', async () => {
      const { plugin, calls } = createTrackingPlugin('test-plugin');
      manager.register(plugin);

      await manager.load('test-plugin');

      expect(manager.isLoaded('test-plugin')).toBe(true);
      expect(calls).toContain('load');
    });

    it('should call configure before load', async () => {
      const { plugin, calls } = createTrackingPlugin('test-plugin');
      const config = { apiKey: 'secret' };

      manager.register(plugin, config);
      await manager.load('test-plugin');

      expect(calls.indexOf('configure')).toBeLessThan(calls.indexOf('load'));
      expect(plugin.configure).toHaveBeenCalledWith(config);
    });

    it('should create and pass PluginContext to load method', async () => {
      const plugin: Plugin = {
        metadata: { name: 'test-plugin', version: '1.0.0', description: 'Test' },
        load: jest.fn(),
      };

      manager.register(plugin);
      await manager.load('test-plugin');

      expect(plugin.load).toHaveBeenCalledTimes(1);
      const context: PluginContext = (plugin.load as jest.Mock).mock.calls[0][0];

      expect(context.pluginName).toBe('test-plugin');
      expect(context.events).toBe(events);
      expect(context.logger).toBeDefined();
      expect(context.config).toBeDefined();
      expect(context.getPlugin).toBeDefined();
    });

    it('should not reload already loaded plugin', async () => {
      const plugin: Plugin = {
        metadata: { name: 'test-plugin', version: '1.0.0', description: 'Test' },
        load: jest.fn(),
      };

      manager.register(plugin);
      await manager.load('test-plugin');
      await manager.load('test-plugin');

      expect(plugin.load).toHaveBeenCalledTimes(1);
    });

    it('should throw error when loading non-registered plugin', async () => {
      await expect(manager.load('non-existent')).rejects.toThrow(
        PluginNotFoundError
      );
    });

    it('should throw error when dependency is missing', async () => {
      const plugin = createMockPlugin('test-plugin', ['missing-dep']);
      manager.register(plugin);

      await expect(manager.load('test-plugin')).rejects.toThrow(
        MissingDependencyError
      );
    });
  });

  describe('Plugin Unloading', () => {
    it('should unload plugin successfully', async () => {
      const { plugin, calls } = createTrackingPlugin('test-plugin');
      manager.register(plugin);
      await manager.load('test-plugin');

      await manager.unload('test-plugin');

      expect(manager.isLoaded('test-plugin')).toBe(false);
      expect(calls).toContain('unload');
    });

    it('should call unload method', async () => {
      const plugin: Plugin = {
        metadata: { name: 'test-plugin', version: '1.0.0', description: 'Test' },
        unload: jest.fn(),
      };

      manager.register(plugin);
      await manager.load('test-plugin');
      await manager.unload('test-plugin');

      expect(plugin.unload).toHaveBeenCalledTimes(1);
    });

    it('should prevent unloading plugin with dependents', async () => {
      const pluginA = createMockPlugin('plugin-a');
      const pluginB = createMockPlugin('plugin-b', ['plugin-a']);

      manager.register(pluginA);
      manager.register(pluginB);
      await manager.load('plugin-b');

      await expect(manager.unload('plugin-a')).rejects.toThrow(PluginInUseError);
    });

    it('should throw error when unloading non-loaded plugin', async () => {
      await expect(manager.unload('non-existent')).rejects.toThrow(
        PluginNotFoundError
      );
    });
  });

  describe('Query Methods', () => {
    it('should return correct plugin with getPlugin', async () => {
      const plugin = createMockPlugin('test-plugin');
      manager.register(plugin);
      await manager.load('test-plugin');

      const retrieved = manager.getPlugin('test-plugin');

      expect(retrieved).toBe(plugin);
    });

    it('should throw error when getting non-loaded plugin', () => {
      expect(() => manager.getPlugin('non-existent')).toThrow(
        PluginNotFoundError
      );
    });

    it('should return correct boolean for isLoaded', async () => {
      const plugin = createMockPlugin('test-plugin');
      manager.register(plugin);

      expect(manager.isLoaded('test-plugin')).toBe(false);

      await manager.load('test-plugin');

      expect(manager.isLoaded('test-plugin')).toBe(true);
    });

    it('should return correct boolean for isRegistered', () => {
      const plugin = createMockPlugin('test-plugin');

      expect(manager.isRegistered('test-plugin')).toBe(false);

      manager.register(plugin);

      expect(manager.isRegistered('test-plugin')).toBe(true);
    });

    it('should return correct array for getLoadedPlugins', async () => {
      const pluginA = createMockPlugin('plugin-a');
      const pluginB = createMockPlugin('plugin-b');

      manager.register(pluginA);
      manager.register(pluginB);

      expect(manager.getLoadedPlugins()).toEqual([]);

      await manager.load('plugin-a');

      expect(manager.getLoadedPlugins()).toEqual(['plugin-a']);

      await manager.load('plugin-b');

      expect(manager.getLoadedPlugins()).toContain('plugin-a');
      expect(manager.getLoadedPlugins()).toContain('plugin-b');
      expect(manager.getLoadedPlugins()).toHaveLength(2);
    });

    it('should return correct array for getRegisteredPlugins', () => {
      const pluginA = createMockPlugin('plugin-a');
      const pluginB = createMockPlugin('plugin-b');

      expect(manager.getRegisteredPlugins()).toEqual([]);

      manager.register(pluginA);

      expect(manager.getRegisteredPlugins()).toEqual(['plugin-a']);

      manager.register(pluginB);

      expect(manager.getRegisteredPlugins()).toContain('plugin-a');
      expect(manager.getRegisteredPlugins()).toContain('plugin-b');
      expect(manager.getRegisteredPlugins()).toHaveLength(2);
    });
  });
});

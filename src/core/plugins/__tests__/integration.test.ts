import { EventEmitter } from '../../events';
import { PluginManager } from '../plugin-manager';
import { Plugin } from '../plugin';
import { PluginContext } from '../plugin-context';

describe('Plugin System Integration Tests', () => {
  let events: EventEmitter;
  let manager: PluginManager;

  beforeEach(() => {
    events = new EventEmitter();
    manager = new PluginManager(events);
  });

  describe('Full Lifecycle', () => {
    it('should complete full plugin lifecycle: register -> load -> unload', async () => {
      const lifecycleSteps: string[] = [];

      const plugin: Plugin = {
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
        },
        configure: jest.fn(() => {
          lifecycleSteps.push('configure');
        }),
        load: jest.fn(() => {
          lifecycleSteps.push('load');
        }),
        unload: jest.fn(() => {
          lifecycleSteps.push('unload');
        }),
      };

      // Register
      manager.register(plugin);
      expect(manager.isRegistered('test-plugin')).toBe(true);
      expect(manager.isLoaded('test-plugin')).toBe(false);

      // Load
      await manager.load('test-plugin');
      expect(manager.isLoaded('test-plugin')).toBe(true);
      expect(lifecycleSteps).toEqual(['configure', 'load']);

      // Unload
      await manager.unload('test-plugin');
      expect(manager.isLoaded('test-plugin')).toBe(false);
      expect(lifecycleSteps).toEqual(['configure', 'load', 'unload']);
    });
  });

  describe('Multiple Plugins with Dependencies', () => {
    it('should handle complex plugin dependency graph', async () => {
      const loadOrder: string[] = [];

      // Create a realistic plugin ecosystem
      const corePlugin: Plugin = {
        metadata: {
          name: 'core',
          version: '1.0.0',
          description: 'Core functionality',
        },
        load: jest.fn(() => {
          loadOrder.push('core');
        }),
      };

      const authPlugin: Plugin = {
        metadata: {
          name: 'auth',
          version: '1.0.0',
          description: 'Authentication',
          dependencies: ['core'],
        },
        load: jest.fn(() => {
          loadOrder.push('auth');
        }),
      };

      const databasePlugin: Plugin = {
        metadata: {
          name: 'database',
          version: '1.0.0',
          description: 'Database access',
          dependencies: ['core'],
        },
        load: jest.fn(() => {
          loadOrder.push('database');
        }),
      };

      const apiPlugin: Plugin = {
        metadata: {
          name: 'api',
          version: '1.0.0',
          description: 'API endpoints',
          dependencies: ['auth', 'database'],
        },
        load: jest.fn(() => {
          loadOrder.push('api');
        }),
      };

      const uiPlugin: Plugin = {
        metadata: {
          name: 'ui',
          version: '1.0.0',
          description: 'User interface',
          dependencies: ['api'],
        },
        load: jest.fn(() => {
          loadOrder.push('ui');
        }),
      };

      // Register all plugins
      manager.register(corePlugin);
      manager.register(authPlugin);
      manager.register(databasePlugin);
      manager.register(apiPlugin);
      manager.register(uiPlugin);

      // Load all
      const result = await manager.loadAll();

      expect(result.successful).toHaveLength(5);
      expect(result.failed).toHaveLength(0);

      // Verify load order respects dependencies
      expect(loadOrder.indexOf('core')).toBeLessThan(loadOrder.indexOf('auth'));
      expect(loadOrder.indexOf('core')).toBeLessThan(loadOrder.indexOf('database'));
      expect(loadOrder.indexOf('auth')).toBeLessThan(loadOrder.indexOf('api'));
      expect(loadOrder.indexOf('database')).toBeLessThan(loadOrder.indexOf('api'));
      expect(loadOrder.indexOf('api')).toBeLessThan(loadOrder.indexOf('ui'));

      // Verify all plugins are loaded
      expect(manager.isLoaded('core')).toBe(true);
      expect(manager.isLoaded('auth')).toBe(true);
      expect(manager.isLoaded('database')).toBe(true);
      expect(manager.isLoaded('api')).toBe(true);
      expect(manager.isLoaded('ui')).toBe(true);
    });
  });

  describe('Plugin Communication via Events', () => {
    it('should allow plugins to communicate through event system', async () => {
      const messages: string[] = [];

      const publisherPlugin: Plugin = {
        metadata: {
          name: 'publisher',
          version: '1.0.0',
          description: 'Publishes events',
        },
        load: jest.fn((context: PluginContext) => {
          // Emit a custom event
          context.events.emit({
            id: 'test-id',
            type: 'custom.message',
            timestamp: new Date(),
            payload: { message: 'Hello from publisher!' },
            metadata: { source: 'publisher' },
          });
        }),
      };

      const subscriberPlugin: Plugin = {
        metadata: {
          name: 'subscriber',
          version: '1.0.0',
          description: 'Subscribes to events',
        },
        load: jest.fn((context: PluginContext) => {
          // Listen for custom events
          context.events.on('custom.message', (event) => {
            messages.push((event.payload as any).message);
          });
        }),
      };

      manager.register(subscriberPlugin);
      manager.register(publisherPlugin);

      await manager.load('subscriber');
      await manager.load('publisher');

      // Wait for event to be processed
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(messages).toContain('Hello from publisher!');
    });
  });

  describe('Plugin Accessing Other Plugins', () => {
    it('should allow plugins to access other loaded plugins', async () => {
      let retrievedPlugin: Plugin | null = null;

      interface ServicePlugin extends Plugin {
        getData: () => string;
      }

      const servicePlugin: ServicePlugin = {
        metadata: {
          name: 'service',
          version: '1.0.0',
          description: 'Provides a service',
        },
        getData: () => 'service data',
      };

      const consumerPlugin: Plugin = {
        metadata: {
          name: 'consumer',
          version: '1.0.0',
          description: 'Consumes service',
          dependencies: ['service'],
        },
        load: jest.fn((context: PluginContext) => {
          retrievedPlugin = context.getPlugin('service');
        }),
      };

      manager.register(servicePlugin);
      manager.register(consumerPlugin);

      await manager.load('consumer');

      expect(retrievedPlugin).toBe(servicePlugin);
      expect((retrievedPlugin as any).getData()).toBe('service data');
    });
  });

  describe('Error Handling Throughout Lifecycle', () => {
    it('should handle errors during plugin load gracefully', async () => {
      const errorEvents: any[] = [];
      events.on('plugin.error', (event) => {
        errorEvents.push(event);
      });

      const failingPlugin: Plugin = {
        metadata: {
          name: 'failing',
          version: '1.0.0',
          description: 'Fails to load',
        },
        load: jest.fn(() => {
          throw new Error('Load failed');
        }),
      };

      const successPlugin: Plugin = {
        metadata: {
          name: 'success',
          version: '1.0.0',
          description: 'Loads successfully',
        },
        load: jest.fn(),
      };

      manager.register(failingPlugin);
      manager.register(successPlugin);

      const result = await manager.loadAll();

      expect(result.successful).toContain('success');
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].name).toBe('failing');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].payload.name).toBe('failing');
      expect(errorEvents[0].payload.operation).toBe('load');
    });

    it('should handle errors during plugin unload gracefully', async () => {
      const errorEvents: any[] = [];
      events.on('plugin.error', (event) => {
        errorEvents.push(event);
      });

      const failingPlugin: Plugin = {
        metadata: {
          name: 'failing',
          version: '1.0.0',
          description: 'Fails to unload',
        },
        unload: jest.fn(() => {
          throw new Error('Unload failed');
        }),
      };

      const successPlugin: Plugin = {
        metadata: {
          name: 'success',
          version: '1.0.0',
          description: 'Unloads successfully',
        },
        unload: jest.fn(),
      };

      manager.register(failingPlugin);
      manager.register(successPlugin);

      await manager.loadAll();
      const result = await manager.unloadAll();

      expect(result.successful).toContain('success');
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].name).toBe('failing');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].payload.name).toBe('failing');
      expect(errorEvents[0].payload.operation).toBe('unload');
    });
  });

  describe('Plugin Configuration', () => {
    it('should pass configuration to plugins', async () => {
      let receivedConfig: Record<string, unknown> | null = null;

      const plugin: Plugin = {
        metadata: {
          name: 'configurable',
          version: '1.0.0',
          description: 'Accepts configuration',
        },
        configure: jest.fn((config) => {
          receivedConfig = config;
        }),
      };

      const config = {
        apiKey: 'secret-key',
        timeout: 5000,
        enabled: true,
      };

      manager.register(plugin, config);
      await manager.load('configurable');

      expect(receivedConfig).toEqual(config);
      expect(plugin.configure).toHaveBeenCalledWith(config);
    });

    it('should provide config in PluginContext', async () => {
      let contextConfig: Record<string, unknown> | null = null;

      const plugin: Plugin = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        load: jest.fn((context: PluginContext) => {
          contextConfig = context.config;
        }),
      };

      const config = { setting: 'value' };

      manager.register(plugin, config);
      await manager.load('test');

      expect(contextConfig).toEqual(config);
    });
  });

  describe('Logger Functionality', () => {
    it('should provide logger to plugins', async () => {
      let logger: any = null;

      const plugin: Plugin = {
        metadata: {
          name: 'test',
          version: '1.0.0',
          description: 'Test',
        },
        load: jest.fn((context: PluginContext) => {
          logger = context.logger;
        }),
      };

      manager.register(plugin);
      await manager.load('test');

      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();

      // Test that logger methods don't throw
      expect(() => logger.debug('debug message')).not.toThrow();
      expect(() => logger.info('info message')).not.toThrow();
      expect(() => logger.warn('warn message')).not.toThrow();
      expect(() => logger.error('error message')).not.toThrow();
    });
  });

  describe('Real-World Scenario', () => {
    it('should handle a complete application startup and shutdown', async () => {
      const lifecycle: string[] = [];

      // Simulate a real application with multiple plugins
      const plugins = [
        {
          metadata: {
            name: 'config',
            version: '1.0.0',
            description: 'Configuration management',
          },
          load: () => {
            lifecycle.push('config:load');
          },
          unload: () => {
            lifecycle.push('config:unload');
          },
        },
        {
          metadata: {
            name: 'logger',
            version: '1.0.0',
            description: 'Logging system',
            dependencies: ['config'],
          },
          load: () => {
            lifecycle.push('logger:load');
          },
          unload: () => {
            lifecycle.push('logger:unload');
          },
        },
        {
          metadata: {
            name: 'database',
            version: '1.0.0',
            description: 'Database connection',
            dependencies: ['config', 'logger'],
          },
          load: () => {
            lifecycle.push('database:load');
          },
          unload: () => {
            lifecycle.push('database:unload');
          },
        },
        {
          metadata: {
            name: 'auth',
            version: '1.0.0',
            description: 'Authentication',
            dependencies: ['database', 'logger'],
          },
          load: () => {
            lifecycle.push('auth:load');
          },
          unload: () => {
            lifecycle.push('auth:unload');
          },
        },
        {
          metadata: {
            name: 'api',
            version: '1.0.0',
            description: 'REST API',
            dependencies: ['auth', 'database'],
          },
          load: () => {
            lifecycle.push('api:load');
          },
          unload: () => {
            lifecycle.push('api:unload');
          },
        },
      ];

      // Register all plugins
      plugins.forEach((plugin) => manager.register(plugin));

      // Startup
      const loadResult = await manager.loadAll();
      expect(loadResult.successful).toHaveLength(5);
      expect(loadResult.failed).toHaveLength(0);

      // Verify all plugins loaded
      expect(manager.getLoadedPlugins()).toHaveLength(5);

      // Shutdown
      const unloadResult = await manager.unloadAll();
      expect(unloadResult.successful).toHaveLength(5);
      expect(unloadResult.failed).toHaveLength(0);

      // Verify all plugins unloaded
      expect(manager.getLoadedPlugins()).toHaveLength(0);

      // Verify lifecycle order
      expect(lifecycle.indexOf('config:load')).toBeLessThan(
        lifecycle.indexOf('logger:load')
      );
      expect(lifecycle.indexOf('logger:load')).toBeLessThan(
        lifecycle.indexOf('database:load')
      );
      expect(lifecycle.indexOf('database:load')).toBeLessThan(
        lifecycle.indexOf('auth:load')
      );
      expect(lifecycle.indexOf('auth:load')).toBeLessThan(
        lifecycle.indexOf('api:load')
      );

      // Verify unload is in reverse order
      expect(lifecycle.indexOf('api:unload')).toBeLessThan(
        lifecycle.indexOf('auth:unload')
      );
      expect(lifecycle.indexOf('auth:unload')).toBeLessThan(
        lifecycle.indexOf('database:unload')
      );
    });
  });
});

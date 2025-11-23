import { DependencyResolver } from '../dependency-resolver';
import { Plugin } from '../plugin';
import {
  MissingDependencyError,
  CircularDependencyError,
} from '../errors';

// Helper to create mock plugin
const createPlugin = (name: string, dependencies: string[] = []): Plugin => ({
  metadata: {
    name,
    version: '1.0.0',
    description: `Plugin ${name}`,
    dependencies,
  },
});

describe('DependencyResolver', () => {
  describe('Simple Dependency Resolution', () => {
    it('should resolve plugin with no dependencies', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a'));

      const result = DependencyResolver.resolveDependencies(plugins);

      expect(result).toEqual(['plugin-a']);
    });

    it('should resolve simple dependency chain', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a'));
      plugins.set('plugin-b', createPlugin('plugin-b', ['plugin-a']));

      const result = DependencyResolver.resolveDependencies(plugins);

      expect(result).toEqual(['plugin-a', 'plugin-b']);
    });

    it('should resolve three-level dependency chain', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a'));
      plugins.set('plugin-b', createPlugin('plugin-b', ['plugin-a']));
      plugins.set('plugin-c', createPlugin('plugin-c', ['plugin-b']));

      const result = DependencyResolver.resolveDependencies(plugins);

      expect(result).toEqual(['plugin-a', 'plugin-b', 'plugin-c']);
    });
  });

  describe('Complex Dependency Resolution', () => {
    it('should resolve diamond dependency pattern', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a'));
      plugins.set('plugin-b', createPlugin('plugin-b', ['plugin-a']));
      plugins.set('plugin-c', createPlugin('plugin-c', ['plugin-a']));
      plugins.set('plugin-d', createPlugin('plugin-d', ['plugin-b', 'plugin-c']));

      const result = DependencyResolver.resolveDependencies(plugins);

      // plugin-a must come first
      expect(result[0]).toBe('plugin-a');
      // plugin-d must come last
      expect(result[3]).toBe('plugin-d');
      // plugin-b and plugin-c can be in any order but after plugin-a
      expect(result.indexOf('plugin-b')).toBeGreaterThan(result.indexOf('plugin-a'));
      expect(result.indexOf('plugin-c')).toBeGreaterThan(result.indexOf('plugin-a'));
    });

    it('should resolve multiple independent plugins', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a'));
      plugins.set('plugin-b', createPlugin('plugin-b'));
      plugins.set('plugin-c', createPlugin('plugin-c'));

      const result = DependencyResolver.resolveDependencies(plugins);

      expect(result).toHaveLength(3);
      expect(result).toContain('plugin-a');
      expect(result).toContain('plugin-b');
      expect(result).toContain('plugin-c');
    });

    it('should resolve complex dependency graph', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('core', createPlugin('core'));
      plugins.set('auth', createPlugin('auth', ['core']));
      plugins.set('database', createPlugin('database', ['core']));
      plugins.set('api', createPlugin('api', ['auth', 'database']));
      plugins.set('ui', createPlugin('ui', ['api']));

      const result = DependencyResolver.resolveDependencies(plugins);

      // Verify dependencies come before dependents
      expect(result.indexOf('core')).toBeLessThan(result.indexOf('auth'));
      expect(result.indexOf('core')).toBeLessThan(result.indexOf('database'));
      expect(result.indexOf('auth')).toBeLessThan(result.indexOf('api'));
      expect(result.indexOf('database')).toBeLessThan(result.indexOf('api'));
      expect(result.indexOf('api')).toBeLessThan(result.indexOf('ui'));
    });
  });

  describe('Missing Dependency Detection', () => {
    it('should throw error for missing dependency', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a', ['missing-plugin']));

      expect(() => {
        DependencyResolver.resolveDependencies(plugins);
      }).toThrow(MissingDependencyError);

      expect(() => {
        DependencyResolver.resolveDependencies(plugins);
      }).toThrow("Plugin 'plugin-a' requires missing dependency 'missing-plugin'");
    });

    it('should throw error for multiple missing dependencies', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a', ['dep1', 'dep2']));

      expect(() => {
        DependencyResolver.resolveDependencies(plugins);
      }).toThrow(MissingDependencyError);
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect simple circular dependency', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a', ['plugin-b']));
      plugins.set('plugin-b', createPlugin('plugin-b', ['plugin-a']));

      expect(() => {
        DependencyResolver.resolveDependencies(plugins);
      }).toThrow(CircularDependencyError);
    });

    it('should detect three-way circular dependency', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a', ['plugin-b']));
      plugins.set('plugin-b', createPlugin('plugin-b', ['plugin-c']));
      plugins.set('plugin-c', createPlugin('plugin-c', ['plugin-a']));

      expect(() => {
        DependencyResolver.resolveDependencies(plugins);
      }).toThrow(CircularDependencyError);
    });

    it('should detect self-dependency', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a', ['plugin-a']));

      expect(() => {
        DependencyResolver.resolveDependencies(plugins);
      }).toThrow(CircularDependencyError);
    });

    it('should detect circular dependency in complex graph', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a'));
      plugins.set('plugin-b', createPlugin('plugin-b', ['plugin-a']));
      plugins.set('plugin-c', createPlugin('plugin-c', ['plugin-b']));
      plugins.set('plugin-d', createPlugin('plugin-d', ['plugin-c', 'plugin-e']));
      plugins.set('plugin-e', createPlugin('plugin-e', ['plugin-b']));
      // Add circular dependency
      plugins.set('plugin-f', createPlugin('plugin-f', ['plugin-d']));
      // Recreate plugin-b with circular dependency
      const pluginB = createPlugin('plugin-b', ['plugin-a', 'plugin-f']);
      plugins.set('plugin-b', pluginB);

      expect(() => {
        DependencyResolver.resolveDependencies(plugins);
      }).toThrow(CircularDependencyError);
    });
  });

  describe('Topological Sort Correctness', () => {
    it('should ensure all dependencies come before dependents', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('a', createPlugin('a'));
      plugins.set('b', createPlugin('b', ['a']));
      plugins.set('c', createPlugin('c', ['a']));
      plugins.set('d', createPlugin('d', ['b', 'c']));
      plugins.set('e', createPlugin('e', ['d']));

      const result = DependencyResolver.resolveDependencies(plugins);

      // Verify each plugin comes after all its dependencies
      for (const [name, plugin] of plugins.entries()) {
        const pluginIndex = result.indexOf(name);
        const deps = plugin.metadata.dependencies || [];

        for (const dep of deps) {
          const depIndex = result.indexOf(dep);
          expect(depIndex).toBeLessThan(pluginIndex);
        }
      }
    });

    it('should handle empty plugin map', () => {
      const plugins = new Map<string, Plugin>();

      const result = DependencyResolver.resolveDependencies(plugins);

      expect(result).toEqual([]);
    });

    it('should handle single plugin', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('only-plugin', createPlugin('only-plugin'));

      const result = DependencyResolver.resolveDependencies(plugins);

      expect(result).toEqual(['only-plugin']);
    });
  });

  describe('Start Plugin Priority', () => {
    it('should prioritize start plugin when specified', () => {
      const plugins = new Map<string, Plugin>();
      plugins.set('plugin-a', createPlugin('plugin-a'));
      plugins.set('plugin-b', createPlugin('plugin-b'));
      plugins.set('plugin-c', createPlugin('plugin-c'));

      const result = DependencyResolver.resolveDependencies(plugins, 'plugin-b');

      // plugin-b should be first if it has no dependencies
      expect(result[0]).toBe('plugin-b');
    });
  });
});

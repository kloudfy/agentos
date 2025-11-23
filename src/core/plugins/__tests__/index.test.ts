import * as PluginSystem from '../index';

describe('Plugin System Module Exports', () => {
  it('should export Plugin interface', () => {
    // TypeScript compile-time check
    const plugin: PluginSystem.Plugin = {
      metadata: {
        name: 'test',
        version: '1.0.0',
        description: 'Test plugin',
      },
    };
    expect(plugin).toBeDefined();
  });

  it('should export PluginManager class', () => {
    expect(PluginSystem.PluginManager).toBeDefined();
  });

  it('should export DependencyResolver class', () => {
    expect(PluginSystem.DependencyResolver).toBeDefined();
  });

  it('should export all error classes', () => {
    expect(PluginSystem.DuplicatePluginError).toBeDefined();
    expect(PluginSystem.MissingDependencyError).toBeDefined();
    expect(PluginSystem.CircularDependencyError).toBeDefined();
    expect(PluginSystem.PluginNotFoundError).toBeDefined();
    expect(PluginSystem.PluginInUseError).toBeDefined();
  });

  it('should export all required types', () => {
    // Type checks (compile-time verification)
    const metadata: PluginSystem.PluginMetadata = {
      name: 'test',
      version: '1.0.0',
      description: 'Test',
    };
    
    expect(metadata).toBeDefined();
  });
});

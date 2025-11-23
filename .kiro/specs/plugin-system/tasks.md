# Implementation Plan

- [x] 1. Create Plugin and PluginMetadata interfaces
  - Create src/core/plugins/plugin.ts file
  - Define PluginMetadata interface with readonly name, version, description, and optional dependencies properties
  - Define Plugin interface with readonly metadata property
  - Add optional configure method accepting config object
  - Add optional load method accepting PluginContext and returning Promise<void>
  - Add optional unload method returning Promise<void>
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create PluginContext interface and Logger
  - [x] 2.1 Define Logger interface
    - Create src/core/plugins/plugin-context.ts file
    - Define Logger interface with debug, info, warn, and error methods
    - Each method should accept message string and optional args
    - _Requirements: 2.2_
  
  - [x] 2.2 Define PluginContext interface
    - Define PluginContext interface with readonly pluginName property
    - Add readonly events property of type EventEmitter
    - Add readonly logger property of type Logger
    - Add readonly config property of type Record<string, unknown>
    - Add getPlugin<T> method accepting name string and returning T
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Create custom error classes
  - Create src/core/plugins/errors.ts file
  - Define DuplicatePluginError extending Error
  - Define MissingDependencyError extending Error
  - Define CircularDependencyError extending Error
  - Define PluginNotFoundError extending Error
  - Define PluginInUseError extending Error
  - Each error should have descriptive message and proper name property
  - _Requirements: 3.3, 4.3, 4.4, 6.5, 8.2_

- [x] 4. Implement DependencyResolver
  - [x] 4.1 Create DependencyResolver class structure
    - Create src/core/plugins/dependency-resolver.ts file
    - Define DependencyResolver class with static methods only
    - Import Plugin interface and error classes
    - _Requirements: 4.2, 5.2, 5.3_
  
  - [x] 4.2 Implement dependency graph building
    - Implement private static buildDependencyGraph method
    - Accept Map<string, Plugin> and return Map<string, string[]>
    - Build adjacency list representation of dependency graph
    - _Requirements: 4.2, 5.2_
  
  - [x] 4.3 Implement cycle detection
    - Implement private static detectCycles method
    - Use depth-first search with recursion stack
    - Return cycle path as string array if found, null otherwise
    - _Requirements: 4.4_
  
  - [x] 4.4 Implement topological sort
    - Implement private static topologicalSort method
    - Use Kahn's algorithm for topological sorting
    - Accept dependency graph and optional start node
    - Return array of plugin names in load order
    - Throw CircularDependencyError if cycle detected
    - _Requirements: 4.2, 5.2, 5.3_
  
  - [x] 4.5 Implement public resolveDependencies method
    - Implement static resolveDependencies method
    - Accept Map<string, Plugin> and optional plugin name
    - Build dependency graph
    - Detect cycles and throw error if found
    - Perform topological sort
    - Validate all dependencies exist
    - Return sorted array of plugin names
    - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.3_

- [x] 5. Implement PluginManager class
  - [x] 5.1 Create PluginManager class structure
    - Create src/core/plugins/plugin-manager.ts file
    - Define LoadResult interface with successful and failed arrays
    - Define UnloadResult interface with successful and failed arrays
    - Define PluginManager class with private registry, loaded, configs, and events properties
    - Implement constructor accepting EventEmitter
    - Initialize all Maps in constructor
    - _Requirements: 3.4, 10.1_
  
  - [x] 5.2 Implement register method
    - Write register(plugin: Plugin, config?: Record<string, unknown>) method
    - Validate plugin has metadata with name property
    - Check if plugin name already exists in registry
    - Throw DuplicatePluginError if duplicate found
    - Store plugin in registry Map
    - Store config in configs Map if provided
    - Emit plugin.registered event with metadata
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.2_
  
  - [x] 5.3 Implement load method
    - Write async load(pluginName: string) method
    - Check if plugin already loaded (return early if yes)
    - Check if plugin is registered (throw PluginNotFoundError if no)
    - Get plugin dependencies from metadata
    - Recursively load each dependency using resolveDependencies
    - Call plugin.configure(config) if method exists
    - Create PluginContext with pluginName, events, logger, config, and getPlugin
    - Call plugin.load(context) if method exists
    - Add plugin to loaded Map
    - Emit plugin.loaded event with name and load time
    - Catch errors and emit plugin.error event
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 10.3_
  
  - [x] 5.4 Implement loadAll method
    - Write async loadAll() method returning Promise<LoadResult>
    - Get all registered plugins
    - Use DependencyResolver.resolveDependencies to get load order
    - Iterate through sorted plugin names
    - Load each plugin using load() method
    - Catch individual failures and continue
    - Track successful and failed loads
    - Return LoadResult with successful and failed arrays
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 5.5 Implement unload method
    - Write async unload(pluginName: string) method
    - Check if plugin is loaded (throw PluginNotFoundError if no)
    - Check if any loaded plugins depend on this plugin
    - Throw PluginInUseError if dependents exist
    - Call plugin.unload() if method exists
    - Remove plugin from loaded Map
    - Emit plugin.unloaded event with name
    - Catch errors and emit plugin.error event
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.4_
  
  - [x] 5.6 Implement unloadAll method
    - Write async unloadAll() method returning Promise<UnloadResult>
    - Get all loaded plugins
    - Use DependencyResolver to get reverse load order
    - Iterate through sorted plugin names in reverse
    - Unload each plugin using unload() method
    - Catch individual failures and continue
    - Track successful and failed unloads
    - Return UnloadResult with successful and failed arrays
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 5.7 Implement query methods
    - Write getPlugin<T>(name: string): T method
    - Check if plugin is loaded (throw PluginNotFoundError if no)
    - Return plugin instance with type casting
    - Write isLoaded(name: string): boolean method
    - Write isRegistered(name: string): boolean method
    - Write getLoadedPlugins(): string[] method
    - Write getRegisteredPlugins(): string[] method
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4_

- [x] 6. Create module exports
  - Create src/core/plugins/index.ts file
  - Export Plugin and PluginMetadata from plugin.ts
  - Export PluginContext and Logger from plugin-context.ts
  - Export PluginManager, LoadResult, and UnloadResult from plugin-manager.ts
  - Export DependencyResolver from dependency-resolver.ts
  - Export all error classes from errors.ts
  - _Requirements: 12.2, 12.3_

- [x] 7. Implement comprehensive test suite
  - [x] 7.1 Create test utilities
    - Create src/core/plugins/__tests__/plugin-manager.test.ts file
    - Implement createMockPlugin utility function
    - Implement createTrackingPlugin utility function
    - Set up EventEmitter for tests
    - _Requirements: 11.1, 12.4_
  
  - [x] 7.2 Write plugin registration tests
    - Test successful plugin registration
    - Test duplicate plugin name rejection
    - Test plugin.registered event emission
    - Test config storage during registration
    - _Requirements: 11.1, 11.2_
  
  - [x] 7.3 Write plugin loading tests
    - Test loading plugin without dependencies
    - Test loading plugin with dependencies in correct order
    - Test configure() called before load()
    - Test PluginContext creation and passing
    - Test plugin.loaded event emission
    - Test loading already loaded plugin (no-op)
    - _Requirements: 11.1, 11.3_
  
  - [x] 7.4 Write dependency resolution tests
    - Create src/core/plugins/__tests__/dependency-resolver.test.ts file
    - Test simple dependency chain resolution
    - Test complex dependency graph resolution
    - Test missing dependency detection
    - Test circular dependency detection
    - Test topological sort correctness
    - _Requirements: 11.1, 11.5, 11.6_
  
  - [x] 7.5 Write plugin unloading tests
    - Test successful plugin unload
    - Test unload() method called
    - Test plugin.unloaded event emission
    - Test preventing unload of plugin with dependents
    - Test unloading non-loaded plugin throws error
    - _Requirements: 11.1, 11.4_
  
  - [x] 7.6 Write loadAll and unloadAll tests
    - Test loadAll loads all plugins in correct order
    - Test loadAll continues on individual failures
    - Test loadAll returns LoadResult
    - Test unloadAll unloads in reverse order
    - Test unloadAll continues on individual failures
    - Test unloadAll returns UnloadResult
    - _Requirements: 11.1, 11.3, 11.4_
  
  - [x] 7.7 Write query method tests
    - Test getPlugin returns correct plugin
    - Test getPlugin throws for non-loaded plugin
    - Test isLoaded returns correct boolean
    - Test isRegistered returns correct boolean
    - Test getLoadedPlugins returns correct array
    - Test getRegisteredPlugins returns correct array
    - _Requirements: 11.1_
  
  - [x] 7.8 Write event integration tests
    - Test plugin.registered event structure
    - Test plugin.loaded event structure
    - Test plugin.unloaded event structure
    - Test plugin.error event emission on failures
    - _Requirements: 11.1, 11.7_
  
  - [x] 7.9 Write integration tests
    - Create src/core/plugins/__tests__/integration.test.ts file
    - Test full lifecycle: register -> load -> unload
    - Test multiple plugins with complex dependencies
    - Test plugin communication via events
    - Test plugin accessing other plugins via getPlugin
    - Test error handling throughout lifecycle
    - _Requirements: 11.1_
  
  - [x] 7.10 Verify test coverage meets requirements
    - Run test coverage report
    - Verify code coverage is greater than 90%
    - Add additional tests if coverage is below threshold
    - _Requirements: 11.1_

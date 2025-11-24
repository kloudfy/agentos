---
title: Architecture Principles
category: design
priority: critical
inclusion: always
---

# Architecture Principles

This document defines the core architectural principles for AgentOS. All code generation and modifications must adhere to these principles.

## Core Principles

### 1. Event-Driven Architecture

**Principle:** All system components communicate through events, not direct method calls.

**Implementation:**
- Use EventEmitter for all inter-component communication
- Components subscribe to events they care about
- Events are immutable and contain all necessary data
- No circular dependencies between components

**Example:**
```typescript
// ✓ CORRECT: Event-driven
events.emit({
  type: 'plugin.loaded',
  payload: { plugin: pluginInstance }
});

// ✗ WRONG: Direct coupling
pluginManager.notifyPluginLoaded(plugin);
```

**Benefits:**
- Loose coupling between components
- Easy to add new features without modifying existing code
- Natural audit trail of system behavior
- Testable in isolation

### 2. Plugin-Based Extensibility

**Principle:** Core functionality is minimal; features are added via plugins.

**Implementation:**
- Core provides: Events, State, Plugin System, Personality
- Everything else is a plugin
- Plugins are self-contained and independent
- Plugins declare dependencies explicitly

**Plugin Structure:**
```typescript
interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  initialize(context: PluginContext): Promise<void>;
  shutdown?(): Promise<void>;
}
```

**Benefits:**
- System remains lightweight
- Features can be enabled/disabled
- Third-party extensions possible
- Easy to test individual features


### 3. Immutability and Pure Functions

**Principle:** Data structures are immutable; functions have no side effects.

**Implementation:**
- Use `readonly` for all interface properties
- Return new objects instead of modifying existing ones
- Pure functions for business logic
- Side effects isolated to specific layers

**Example:**
```typescript
// ✓ CORRECT: Immutable
interface Event {
  readonly id: string;
  readonly type: string;
  readonly timestamp: Date;
}

function addListener(listeners: Listener[], newListener: Listener): Listener[] {
  return [...listeners, newListener];
}

// ✗ WRONG: Mutable
interface Event {
  id: string;
  type: string;
}

function addListener(listeners: Listener[], newListener: Listener): void {
  listeners.push(newListener);
}
```

**Benefits:**
- Predictable behavior
- Easier to reason about code
- Thread-safe by default
- Simplified testing

### 4. Dependency Injection

**Principle:** Dependencies are injected, not imported directly.

**Implementation:**
- Constructor injection for required dependencies
- Context objects for runtime dependencies
- No global state or singletons
- Interfaces over concrete implementations

**Example:**
```typescript
// ✓ CORRECT: Dependency injection
class PluginManager {
  constructor(
    private events: EventEmitter,
    private state: StateManager
  ) {}
}

// ✗ WRONG: Direct imports
import { globalEvents } from './globals';
class PluginManager {
  private events = globalEvents;
}
```

### 5. Separation of Concerns

**Principle:** Each module has a single, well-defined responsibility.

**Module Boundaries:**
- **Events:** Event emission and subscription
- **Plugins:** Plugin lifecycle and dependency management
- **State:** Data persistence and retrieval
- **Personality:** Context analysis and personality selection

**Rules:**
- No cross-cutting concerns in business logic
- Each module exports a clean public API
- Internal implementation details are private
- Modules communicate only through defined interfaces

### 6. Fail-Fast and Error Boundaries

**Principle:** Detect errors early; isolate failures to prevent cascading.

**Implementation:**
- Validate inputs at boundaries
- Throw errors for programmer mistakes
- Return errors for expected failures
- Isolate plugin failures from core system

**Example:**
```typescript
// ✓ CORRECT: Fail-fast validation
function loadPlugin(name: string): Plugin {
  if (!name || name.trim() === '') {
    throw new Error('Plugin name is required');
  }
  // ... load plugin
}

// Error boundary for plugins
try {
  await plugin.initialize(context);
} catch (error) {
  logger.error(`Plugin ${plugin.name} failed:`, error);
  // Core system continues running
}
```

### 7. Interface Segregation

**Principle:** Clients should not depend on interfaces they don't use.

**Implementation:**
- Small, focused interfaces
- Compose interfaces when needed
- No "god" interfaces
- Optional properties for extensions

**Example:**
```typescript
// ✓ CORRECT: Focused interfaces
interface EventEmitter {
  emit(event: BaseEvent): void;
  on(type: string, listener: EventListener): void;
}

interface EventHistory {
  getHistory(type?: string): BaseEvent[];
  clearHistory(): void;
}

// ✗ WRONG: God interface
interface EventSystem {
  emit(event: BaseEvent): void;
  on(type: string, listener: EventListener): void;
  getHistory(type?: string): BaseEvent[];
  clearHistory(): void;
  saveToFile(path: string): void;
  loadFromFile(path: string): void;
  // ... 20 more methods
}
```

## Architectural Patterns

### Repository Pattern (State Management)

```typescript
interface StateStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

class FileSystemStateStore implements StateStore {
  // Implementation details hidden
}
```

### Factory Pattern (Event Creation)

```typescript
class SystemEvents {
  static pluginLoaded(plugin: Plugin): BaseEvent {
    return {
      id: randomUUID(),
      type: 'plugin.loaded',
      timestamp: new Date(),
      payload: { plugin }
    };
  }
}
```

### Strategy Pattern (Personality Selection)

```typescript
interface PersonalitySelector {
  selectPersonality(context: PersonalityContext): PersonalityMatch;
}

class PatternBasedSelector implements PersonalitySelector {
  // Pattern matching strategy
}

class MLBasedSelector implements PersonalitySelector {
  // Machine learning strategy
}
```

## Design Constraints

### Performance
- Event emission: <1ms
- Plugin loading: <100ms
- State operations: <50ms
- Personality switching: <5ms

### Scalability
- Support 100+ plugins
- Handle 10,000+ events/second
- Manage 1,000+ state keys
- Process 100+ personality switches/minute

### Reliability
- No data loss on crashes
- Graceful degradation on plugin failures
- Automatic recovery from errors
- Comprehensive error logging

## Anti-Patterns to Avoid

### ✗ Global State
```typescript
// WRONG
export const globalState = new Map();
```

### ✗ Circular Dependencies
```typescript
// WRONG
// plugin-manager.ts imports plugin.ts
// plugin.ts imports plugin-manager.ts
```

### ✗ God Objects
```typescript
// WRONG
class AgentOS {
  // 50 methods doing everything
}
```

### ✗ Tight Coupling
```typescript
// WRONG
class PluginManager {
  private db = new PostgresDatabase();
}
```

## Code Organization

```
src/
  core/              # Core systems
    events/          # Event system
    plugins/         # Plugin system
    state/           # State management
    personality/     # Personality system
  plugins/           # Built-in plugins
  types/             # Shared types
  utils/             # Utilities
```

## Documentation Requirements

Every module must have:
1. **README.md:** Overview and usage examples
2. **API Documentation:** JSDoc for all public APIs
3. **Architecture Diagram:** Visual representation
4. **Integration Guide:** How to use with other modules

## Review Checklist

Before merging code, verify:
- [ ] Follows event-driven architecture
- [ ] No direct dependencies between modules
- [ ] Immutable data structures used
- [ ] Dependencies injected, not imported
- [ ] Single responsibility per module
- [ ] Error boundaries implemented
- [ ] Interfaces are focused and small
- [ ] Performance constraints met
- [ ] Documentation complete

## References

- Event System Design: `.kiro/specs/event-system/design.md`
- Plugin System Design: `.kiro/specs/plugin-system/design.md`
- State Management Design: `.kiro/specs/state-management/design.md`
- ADR Index: `docs/adr/README.md`

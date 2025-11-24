---
title: Code Conventions
category: style
priority: high
inclusion: always
---

# Code Conventions

This document defines coding conventions and style guidelines for AgentOS. All code must follow these conventions for consistency and maintainability.

## TypeScript Configuration

### Strict Mode Required

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Annotations

```typescript
// ✓ CORRECT: Explicit types
function calculateSum(a: number, b: number): number {
  return a + b;
}

const users: User[] = [];
const config: PluginConfig = { name: 'test' };

// ✗ WRONG: Implicit any
function calculateSum(a, b) {
  return a + b;
}

const users = [];
```

### No `any` Type

```typescript
// ✓ CORRECT: Proper types
function processData(data: unknown): ProcessedData {
  if (!isValidData(data)) {
    throw new Error('Invalid data');
  }
  return transformData(data);
}

// ✗ WRONG: Using any
function processData(data: any): any {
  return data.transform();
}
```

## File Organization

### File Size Limits

- **Maximum:** 300 lines per file
- **Recommended:** 150-200 lines
- **Action:** Split large files into modules

### File Structure

```typescript
// 1. Imports (grouped and sorted)
import { readFile } from 'fs/promises';
import path from 'path';

import { EventEmitter } from '../events';
import { Plugin } from './types';

// 2. Constants
const MAX_PLUGINS = 100;
const DEFAULT_TIMEOUT = 30000;

// 3. Types/Interfaces
interface PluginConfig {
  name: string;
  version: string;
}

// 4. Main class/function
export class PluginManager {
  // Implementation
}

// 5. Helper functions (private)
function validatePlugin(plugin: Plugin): void {
  // Implementation
}
```


### Import Organization

```typescript
// 1. Node.js built-ins
import fs from 'fs';
import path from 'path';

// 2. External dependencies
import express from 'express';
import { v4 as uuid } from 'uuid';

// 3. Internal modules (absolute paths)
import { EventEmitter } from '@/core/events';
import { Plugin } from '@/core/plugins';

// 4. Relative imports
import { helper } from './utils';
import { Config } from './types';
```

## Naming Conventions

### Files and Directories

```
kebab-case for files:
  event-emitter.ts
  plugin-manager.ts
  state-store.ts

kebab-case for directories:
  src/core/events/
  src/core/plugins/
  src/core/state-management/
```

### Classes and Interfaces

```typescript
// PascalCase for classes
class EventEmitter {}
class PluginManager {}

// PascalCase for interfaces
interface Plugin {}
interface EventListener {}

// PascalCase for types
type PersonalityType = 'helpful' | 'efficient';
```

### Functions and Variables

```typescript
// camelCase for functions
function loadPlugin() {}
function calculateScore() {}

// camelCase for variables
const pluginName = 'test';
let isLoaded = false;

// UPPER_SNAKE_CASE for constants
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;
```

### Private Members

```typescript
class PluginManager {
  // Private with underscore prefix (optional but recommended)
  private _plugins: Map<string, Plugin>;
  
  // Or just private keyword
  private plugins: Map<string, Plugin>;
  
  // Public (no prefix)
  public loadPlugin(name: string): void {}
}
```

## Documentation (JSDoc)

### Required for All Public APIs

```typescript
/**
 * Loads and initializes a plugin.
 * 
 * @param name - The unique name of the plugin to load
 * @param config - Optional configuration for the plugin
 * @returns Promise that resolves when plugin is loaded
 * @throws {PluginNotFoundError} If plugin cannot be found
 * @throws {PluginLoadError} If plugin initialization fails
 * 
 * @example
 * ```typescript
 * await manager.loadPlugin('my-plugin', { enabled: true });
 * ```
 */
async loadPlugin(name: string, config?: PluginConfig): Promise<void> {
  // Implementation
}
```

### Interface Documentation

```typescript
/**
 * Represents a plugin that extends AgentOS functionality.
 * 
 * Plugins are self-contained modules that can be loaded dynamically.
 * Each plugin must have a unique name and version.
 * 
 * @example
 * ```typescript
 * const plugin: Plugin = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   async initialize(context) {
 *     // Setup code
 *   }
 * };
 * ```
 */
export interface Plugin {
  /** Unique identifier for the plugin */
  readonly name: string;
  
  /** Semantic version string (e.g., "1.0.0") */
  readonly version: string;
  
  /**
   * Initializes the plugin with runtime context.
   * 
   * @param context - Runtime context providing access to system services
   * @returns Promise that resolves when initialization is complete
   */
  initialize(context: PluginContext): Promise<void>;
}
```

## Code Style

### Line Length

- **Maximum:** 100 characters
- **Recommended:** 80 characters
- **Action:** Break long lines

```typescript
// ✓ CORRECT: Break long lines
const result = await pluginManager.loadPlugin(
  pluginName,
  {
    enabled: true,
    timeout: 5000,
    retries: 3
  }
);

// ✗ WRONG: Too long
const result = await pluginManager.loadPlugin(pluginName, { enabled: true, timeout: 5000, retries: 3 });
```

### Indentation

- **2 spaces** (no tabs)
- Consistent throughout file

### Quotes

- **Single quotes** for strings
- **Backticks** for template literals

```typescript
// ✓ CORRECT
const name = 'plugin';
const message = `Loading ${name}`;

// ✗ WRONG
const name = "plugin";
const message = 'Loading ' + name;
```

### Semicolons

- **Always use semicolons**

```typescript
// ✓ CORRECT
const x = 5;
return result;

// ✗ WRONG
const x = 5
return result
```

### Braces

- **Always use braces** for control structures
- **Opening brace on same line**

```typescript
// ✓ CORRECT
if (condition) {
  doSomething();
}

// ✗ WRONG
if (condition) doSomething();

if (condition)
{
  doSomething();
}
```

## Function Guidelines

### Function Length

- **Maximum:** 50 lines
- **Recommended:** 20-30 lines
- **Action:** Extract helper functions

### Function Complexity

- **Maximum cyclomatic complexity:** 15
- **Action:** Refactor complex functions

### Single Responsibility

```typescript
// ✓ CORRECT: Single responsibility
function validatePluginName(name: string): void {
  if (!name || name.trim() === '') {
    throw new Error('Plugin name is required');
  }
}

function loadPluginFromDisk(path: string): Plugin {
  return require(path);
}

// ✗ WRONG: Multiple responsibilities
function loadPlugin(name: string): Plugin {
  // Validates name
  if (!name) throw new Error('Invalid name');
  
  // Finds plugin
  const path = findPluginPath(name);
  
  // Loads plugin
  const plugin = require(path);
  
  // Validates plugin
  if (!plugin.initialize) throw new Error('Invalid plugin');
  
  // Registers plugin
  this.plugins.set(name, plugin);
  
  return plugin;
}
```

### Pure Functions Preferred

```typescript
// ✓ CORRECT: Pure function
function calculateScore(
  patterns: string[],
  context: Context
): number {
  return patterns.filter(p => context.message.includes(p)).length;
}

// ✗ WRONG: Side effects
function calculateScore(
  patterns: string[],
  context: Context
): number {
  this.lastScore = patterns.length; // Side effect
  console.log('Calculating...'); // Side effect
  return patterns.length;
}
```

## Error Handling

### Custom Error Classes

```typescript
// Define custom errors
export class PluginError extends Error {
  constructor(message: string, public readonly pluginName: string) {
    super(message);
    this.name = 'PluginError';
  }
}

export class PluginNotFoundError extends PluginError {
  constructor(pluginName: string) {
    super(`Plugin not found: ${pluginName}`, pluginName);
    this.name = 'PluginNotFoundError';
  }
}
```

### Error Handling Pattern

```typescript
// ✓ CORRECT: Specific error handling
try {
  await plugin.initialize(context);
} catch (error) {
  if (error instanceof PluginError) {
    logger.error('Plugin error', { plugin: error.pluginName, error });
    throw error;
  }
  
  logger.error('Unexpected error', { error });
  throw new PluginError('Initialization failed', plugin.name);
}

// ✗ WRONG: Swallow errors
try {
  await plugin.initialize(context);
} catch (error) {
  console.log('Error occurred');
}
```

## Async/Await

### Prefer async/await over Promises

```typescript
// ✓ CORRECT: async/await
async function loadPlugin(name: string): Promise<Plugin> {
  const path = await findPluginPath(name);
  const plugin = await import(path);
  return plugin;
}

// ✗ WRONG: Promise chains
function loadPlugin(name: string): Promise<Plugin> {
  return findPluginPath(name)
    .then(path => import(path))
    .then(plugin => plugin);
}
```

### Always await Promises

```typescript
// ✓ CORRECT
await plugin.initialize(context);
await saveState(state);

// ✗ WRONG: Floating promises
plugin.initialize(context); // Not awaited!
saveState(state); // Not awaited!
```

## Immutability

### Use readonly

```typescript
// ✓ CORRECT: Immutable interface
interface Plugin {
  readonly name: string;
  readonly version: string;
}

// ✗ WRONG: Mutable
interface Plugin {
  name: string;
  version: string;
}
```

### Return new objects

```typescript
// ✓ CORRECT: Return new array
function addPlugin(plugins: Plugin[], newPlugin: Plugin): Plugin[] {
  return [...plugins, newPlugin];
}

// ✗ WRONG: Mutate array
function addPlugin(plugins: Plugin[], newPlugin: Plugin): void {
  plugins.push(newPlugin);
}
```

## Comments

### When to Comment

```typescript
// ✓ GOOD: Explain why, not what
// Use exponential backoff to avoid overwhelming the server
await retry(operation, { backoff: 'exponential' });

// Complex algorithm explanation
// Boyer-Moore string search for O(n/m) average case
const index = boyerMooreSearch(text, pattern);

// ✗ BAD: Obvious comments
// Increment counter
counter++;

// Set name to 'test'
const name = 'test';
```

### TODO Comments

```typescript
// TODO(username): Add support for plugin versioning
// FIXME: Race condition when loading multiple plugins
// HACK: Temporary workaround for issue #123
```

## Testing Conventions

### Test File Naming

```
Source: event-emitter.ts
Test:   event-emitter.test.ts

Location: __tests__/ directory
```

### Test Structure

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should handle normal case', () => {});
    it('should handle edge case', () => {});
    it('should throw on error', () => {});
  });
});
```

## Git Conventions

### Commit Messages

```
Format: <type>(<scope>): <subject>

Types:
  feat: New feature
  fix: Bug fix
  docs: Documentation
  style: Formatting
  refactor: Code restructuring
  test: Tests
  chore: Maintenance

Examples:
  feat(plugins): Add plugin dependency resolution
  fix(events): Prevent memory leak in event listeners
  docs(api): Update plugin API documentation
  test(state): Add integration tests for state persistence
```

### Branch Naming

```
feature/plugin-system
fix/event-memory-leak
docs/api-documentation
refactor/state-management
```

## Code Review Checklist

Before submitting PR:
- [ ] Follows TypeScript strict mode
- [ ] No `any` types used
- [ ] Files under 300 lines
- [ ] Functions under 50 lines
- [ ] Complexity under 15
- [ ] JSDoc for all public APIs
- [ ] Tests included
- [ ] Linting passes
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Immutability maintained

## Tools

### ESLint
```bash
npm run lint
npm run lint:fix
```

### Prettier
```bash
npm run format
```

### Type Checking
```bash
npm run type-check
```

## References

- TypeScript Handbook: https://www.typescriptlang.org/docs/
- ESLint Config: `.eslintrc.json`
- Prettier Config: `.prettierrc`
- TSConfig: `tsconfig.json`

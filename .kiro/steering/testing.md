---
title: Testing Standards
category: quality
priority: critical
inclusion: always
---

# Testing Standards

This document defines testing standards for AgentOS. All code must meet these standards before merging.

## Coverage Requirements

### Minimum Thresholds
- **Statement Coverage:** ≥90%
- **Branch Coverage:** ≥90%
- **Function Coverage:** ≥90%
- **Line Coverage:** ≥90%

### Enforcement
- Enforced by Jest configuration
- Checked in pre-commit hook
- Blocked in CI/CD pipeline
- Reported in pull requests

## Test Framework

### Primary Framework: Jest

**Configuration:**
```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "coverageThreshold": {
    "global": {
      "statements": 90,
      "branches": 90,
      "functions": 90,
      "lines": 90
    }
  }
}
```

### Test File Naming
- Unit tests: `*.test.ts`
- Integration tests: `integration.test.ts`
- Location: `__tests__` directory next to source

**Example:**
```
src/core/events/
  event-emitter.ts
  __tests__/
    event-emitter.test.ts
    integration.test.ts
```

## Test Structure

### AAA Pattern (Arrange-Act-Assert)

```typescript
describe('EventEmitter', () => {
  describe('emit', () => {
    it('should notify all registered listeners', () => {
      // Arrange
      const emitter = new EventEmitter();
      const listener = jest.fn();
      emitter.on('test', listener);
      const event = { type: 'test', id: '1', timestamp: new Date() };
      
      // Act
      emitter.emit(event);
      
      // Assert
      expect(listener).toHaveBeenCalledWith(event);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
```


### Test Organization

```typescript
describe('ClassName', () => {
  // Setup
  let instance: ClassName;
  
  beforeEach(() => {
    instance = new ClassName();
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  // Group related tests
  describe('methodName', () => {
    it('should handle normal case', () => {});
    it('should handle edge cases', () => {});
    it('should throw on invalid input', () => {});
  });
});
```

## Test Categories

### 1. Unit Tests

**Purpose:** Test individual functions/methods in isolation

**Characteristics:**
- Fast (<100ms per test)
- No external dependencies
- Mock all dependencies
- Test one thing per test

**Example:**
```typescript
describe('PersonalitySelector', () => {
  it('should select helpful personality for beginner context', () => {
    const selector = new PersonalitySelector();
    const context = {
      userMessage: 'help me understand',
      expertiseLevel: 'beginner'
    };
    
    const match = selector.selectPersonality(context);
    
    expect(match.personality.name).toBe('helpful');
  });
});
```

### 2. Integration Tests

**Purpose:** Test component interactions

**Characteristics:**
- Moderate speed (<1s per test)
- Use real dependencies where appropriate
- Test workflows and data flow
- Verify component integration

**Example:**
```typescript
describe('Plugin System Integration', () => {
  it('should load plugin and emit events', async () => {
    const events = new EventEmitter();
    const manager = new PluginManager(events);
    const eventSpy = jest.fn();
    
    events.on('plugin.loaded', eventSpy);
    
    await manager.loadPlugin(testPlugin);
    
    expect(eventSpy).toHaveBeenCalled();
    expect(manager.getPlugin('test')).toBeDefined();
  });
});
```

### 3. End-to-End Tests

**Purpose:** Test complete user workflows

**Characteristics:**
- Slower (<5s per test)
- Use real system components
- Test from user perspective
- Verify business requirements

**Location:** `tests/e2e/`

## Test Coverage Guidelines

### What to Test

**✓ Always Test:**
- Public API methods
- Error handling
- Edge cases (null, undefined, empty)
- Boundary conditions
- Async operations
- Event emission
- State changes

**✓ Consider Testing:**
- Complex private methods
- Algorithm correctness
- Performance characteristics
- Concurrency issues

**✗ Don't Test:**
- Third-party libraries
- Simple getters/setters
- Type definitions
- Configuration files

### Coverage Strategies

**Branch Coverage:**
```typescript
// Test both branches
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

// Tests needed:
it('should divide numbers', () => {
  expect(divide(10, 2)).toBe(5);
});

it('should throw on division by zero', () => {
  expect(() => divide(10, 0)).toThrow('Division by zero');
});
```

**Edge Cases:**
```typescript
describe('edge cases', () => {
  it('should handle null input', () => {});
  it('should handle undefined input', () => {});
  it('should handle empty array', () => {});
  it('should handle empty string', () => {});
  it('should handle negative numbers', () => {});
  it('should handle very large numbers', () => {});
});
```

## Mocking Guidelines

### When to Mock

**✓ Mock:**
- External services (APIs, databases)
- File system operations
- Time-dependent code
- Random number generation
- Heavy computations

**✗ Don't Mock:**
- Simple data structures
- Pure functions
- Value objects
- Internal business logic

### Mock Examples

**Jest Mocks:**
```typescript
// Mock function
const mockFn = jest.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue(Promise.resolve(data));

// Mock module
jest.mock('../database', () => ({
  query: jest.fn().mockResolvedValue([])
}));

// Spy on method
const spy = jest.spyOn(object, 'method');
```

## Async Testing

### Promises
```typescript
it('should resolve with data', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

it('should reject on error', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

### Callbacks
```typescript
it('should call callback with result', (done) => {
  functionWithCallback((result) => {
    expect(result).toBe(expected);
    done();
  });
});
```

### Timeouts
```typescript
it('should timeout after 5 seconds', async () => {
  jest.setTimeout(5000);
  await longRunningOperation();
}, 5000);
```

## Test Data Management

### Test Fixtures
```typescript
// fixtures/test-plugin.ts
export const testPlugin: Plugin = {
  name: 'test-plugin',
  version: '1.0.0',
  initialize: jest.fn().mockResolvedValue(undefined)
};
```

### Factory Functions
```typescript
function createTestEvent(overrides?: Partial<BaseEvent>): BaseEvent {
  return {
    id: randomUUID(),
    type: 'test',
    timestamp: new Date(),
    ...overrides
  };
}
```

## Performance Testing

### Benchmarks
```typescript
describe('performance', () => {
  it('should emit events in <1ms', () => {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      emitter.emit(event);
    }
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000); // <1ms per event
  });
});
```

## Test Quality Standards

### Test Naming
```typescript
// ✓ GOOD: Descriptive names
it('should throw error when plugin name is empty', () => {});
it('should emit event after successful plugin load', () => {});

// ✗ BAD: Vague names
it('should work', () => {});
it('test plugin', () => {});
```

### One Assertion Focus
```typescript
// ✓ GOOD: Focused test
it('should return correct personality name', () => {
  expect(match.personality.name).toBe('helpful');
});

it('should return high confidence', () => {
  expect(match.confidence).toBeGreaterThan(0.8);
});

// ✗ BAD: Multiple unrelated assertions
it('should work correctly', () => {
  expect(match.personality.name).toBe('helpful');
  expect(match.confidence).toBeGreaterThan(0.8);
  expect(match.matchedPatterns).toHaveLength(3);
  expect(manager.getHistory()).toHaveLength(1);
});
```

### Test Independence
```typescript
// ✓ GOOD: Independent tests
describe('EventEmitter', () => {
  let emitter: EventEmitter;
  
  beforeEach(() => {
    emitter = new EventEmitter(); // Fresh instance
  });
  
  it('test 1', () => {});
  it('test 2', () => {});
});

// ✗ BAD: Dependent tests
let sharedEmitter = new EventEmitter();

it('test 1', () => {
  sharedEmitter.on('test', listener);
});

it('test 2', () => {
  // Depends on test 1 running first
  sharedEmitter.emit(event);
});
```

## TDD Approach

### Red-Green-Refactor Cycle

1. **Red:** Write failing test
2. **Green:** Write minimal code to pass
3. **Refactor:** Improve code quality

**Example:**
```typescript
// 1. RED: Write test first
it('should calculate sum', () => {
  expect(sum(2, 3)).toBe(5);
});

// 2. GREEN: Minimal implementation
function sum(a: number, b: number): number {
  return a + b;
}

// 3. REFACTOR: Add validation
function sum(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Invalid input');
  }
  return a + b;
}
```

## CI/CD Integration

### Pre-commit
- Run tests for changed files
- Check coverage thresholds
- Block commit if tests fail

### Pull Request
- Run full test suite
- Generate coverage report
- Comment on PR with results

### Main Branch
- Run full test suite + E2E
- Generate coverage badge
- Deploy if all tests pass

## Test Maintenance

### Keep Tests Updated
- Update tests when requirements change
- Remove obsolete tests
- Refactor tests with code

### Avoid Test Smells
- **Flaky tests:** Fix or remove
- **Slow tests:** Optimize or move to E2E
- **Duplicate tests:** Consolidate
- **Unclear tests:** Improve naming and structure

## Documentation

### Test Documentation
```typescript
/**
 * Tests the PersonalitySelector's ability to match patterns
 * and select appropriate personalities based on user context.
 * 
 * Coverage:
 * - Pattern matching for all 5 personalities
 * - Confidence scoring
 * - Tie-breaking logic
 * - Edge cases (empty input, invalid context)
 */
describe('PersonalitySelector', () => {
  // Tests...
});
```

## Review Checklist

Before merging, verify:
- [ ] All tests pass
- [ ] Coverage ≥90% for all metrics
- [ ] Tests follow AAA pattern
- [ ] Test names are descriptive
- [ ] Edge cases covered
- [ ] Error cases tested
- [ ] Async operations tested correctly
- [ ] No flaky tests
- [ ] Tests are independent
- [ ] Mocks used appropriately

## References

- Jest Documentation: https://jestjs.io/
- Testing Best Practices: `docs/testing-guide.md`
- Coverage Reports: `.kiro/logs/coverage/`

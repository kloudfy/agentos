---
name: Test Generator
description: Automatically generates comprehensive test files when source files are saved
enabled: true
trigger: file-save
priority: high
---

# Test Generator Hook

## Overview
This hook automatically generates test files for source code to ensure comprehensive test coverage (>90%) across the AgentOS codebase.

## Trigger Configuration

**Event:** `file-save`

**File Patterns:**
- `src/**/*.ts` (exclude test files)
- `!src/**/*.test.ts`
- `!src/**/__tests__/**`
- `!src/**/*.spec.ts`

**Debounce:** 2000ms (wait 2 seconds after last save)

## Execution Rules

### When to Generate Tests

1. **New Files:** Always generate tests for new source files
2. **Modified Files:** Regenerate tests if:
   - New public methods/functions added
   - Existing method signatures changed
   - New classes or interfaces added
   - Coverage drops below 90%

3. **Skip Generation If:**
   - File is a type definition only (no logic)
   - Test file already exists with >90% coverage
   - File is in `__tests__` directory
   - File is a `.d.ts` declaration file

### Test File Location

```
Source: src/core/events/event-emitter.ts
Test:   src/core/events/__tests__/event-emitter.test.ts

Source: src/plugins/example-plugin.ts
Test:   src/plugins/__tests__/example-plugin.test.ts
```

## Test Generation Guidelines

### Test Structure

```typescript
import { ClassName } from '../source-file';

describe('ClassName', () => {
  let instance: ClassName;

  beforeEach(() => {
    // Setup
    instance = new ClassName();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should handle normal case', () => {
      // Test implementation
    });

    it('should handle edge cases', () => {
      // Test edge cases
    });

    it('should handle errors', () => {
      // Test error handling
    });
  });
});
```

### Coverage Requirements

- **Statement Coverage:** ≥90%
- **Branch Coverage:** ≥90%
- **Function Coverage:** ≥90%
- **Line Coverage:** ≥90%

### Test Categories

1. **Unit Tests**
   - Test individual methods/functions
   - Mock external dependencies
   - Fast execution (<100ms per test)

2. **Integration Tests**
   - Test component interactions
   - Use real dependencies where appropriate
   - Moderate execution time (<1s per test)

3. **Edge Cases**
   - Null/undefined inputs
   - Empty arrays/objects
   - Boundary values
   - Invalid inputs

4. **Error Handling**
   - Expected errors
   - Unexpected errors
   - Error messages
   - Error recovery

### Test Patterns to Include

```typescript
// Constructor tests
describe('constructor', () => {
  it('should initialize with default values', () => {});
  it('should accept custom configuration', () => {});
  it('should throw on invalid config', () => {});
});

// Method tests
describe('publicMethod', () => {
  it('should return expected result', () => {});
  it('should handle edge cases', () => {});
  it('should throw on invalid input', () => {});
});

// Async tests
describe('asyncMethod', () => {
  it('should resolve with data', async () => {});
  it('should reject on error', async () => {});
  it('should handle timeout', async () => {});
});

// Event tests (for EventEmitter)
describe('event emission', () => {
  it('should emit event with payload', () => {});
  it('should call all listeners', () => {});
  it('should handle listener errors', () => {});
});
```

## Analysis Steps

1. **Parse Source File**
   - Extract classes, interfaces, functions
   - Identify public API surface
   - Detect dependencies

2. **Analyze Existing Tests**
   - Check if test file exists
   - Calculate current coverage
   - Identify missing test cases

3. **Generate Test Cases**
   - Create describe blocks for each class/function
   - Generate tests for each public method
   - Add edge case tests
   - Add error handling tests

4. **Validate Generated Tests**
   - Ensure tests compile
   - Run tests to verify they pass
   - Check coverage meets threshold

## Output Format

### Success
```
✓ Generated test file: src/core/events/__tests__/event-emitter.test.ts
  - 45 test cases created
  - Coverage: 94.2% statements, 91.5% branches
  - Execution time: 1.2s
```

### Partial Success
```
⚠ Generated test file with warnings: src/core/plugins/__tests__/plugin.test.ts
  - 32 test cases created
  - Coverage: 87.3% statements (below 90% threshold)
  - Warnings:
    - Method 'complexMethod' needs additional test cases
    - Branch coverage low in error handling
```

### Failure
```
✗ Failed to generate test file: src/core/state/state-store.ts
  - Error: Unable to parse TypeScript file
  - Suggestion: Check for syntax errors
```

## Integration with Development Workflow

1. **Save File** → Hook triggers
2. **Analyze File** → Determine if tests needed
3. **Generate Tests** → Create comprehensive test suite
4. **Run Tests** → Verify tests pass
5. **Report Coverage** → Display coverage metrics
6. **Notify Developer** → Show results in IDE

## Configuration Options

```yaml
testGenerator:
  enabled: true
  coverageThreshold: 90
  autoRun: true
  autoFix: true
  frameworks:
    - jest
  mockingLibrary: jest
  assertionStyle: expect
  testFilePattern: "__tests__/{name}.test.ts"
  includeIntegrationTests: true
  includeEdgeCases: true
  includeErrorHandling: true
```

## Best Practices

1. **Descriptive Test Names:** Use clear, descriptive test names
2. **Arrange-Act-Assert:** Follow AAA pattern
3. **One Assertion Per Test:** Keep tests focused
4. **Mock External Dependencies:** Isolate unit under test
5. **Test Behavior, Not Implementation:** Focus on what, not how
6. **Clean Up Resources:** Use afterEach for cleanup
7. **Avoid Test Interdependence:** Tests should be independent

## Exclusions

Do not generate tests for:
- Type definition files (`*.d.ts`)
- Configuration files
- Migration scripts
- Build scripts
- Files in `node_modules`
- Files in `dist` or `build` directories

## Error Handling

If test generation fails:
1. Log error details
2. Notify developer
3. Suggest manual test creation
4. Do not block file save operation

## Performance Considerations

- Generate tests asynchronously
- Use worker threads for large files
- Cache parsed AST for reuse
- Limit concurrent test generation to 3 files
- Timeout after 30 seconds

## Metrics Tracking

Track and report:
- Number of tests generated
- Coverage improvements
- Generation time
- Success/failure rate
- Most common failure reasons

## Example Output

```typescript
// Auto-generated test file for src/core/events/event-emitter.ts
// Generated by Kiro Test Generator on 2024-01-15

import { EventEmitter } from '../event-emitter';
import { BaseEvent } from '../types';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('constructor', () => {
    it('should initialize with empty listeners', () => {
      expect(emitter).toBeDefined();
    });
  });

  describe('on', () => {
    it('should register event listener', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      
      emitter.emit({ type: 'test', id: '1', timestamp: new Date() });
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      
      emitter.emit({ type: 'test', id: '1', timestamp: new Date() });
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  // ... more tests
});
```

## Notes

- This hook integrates with the eval-runner MCP tool for quality gates
- Generated tests follow the project's testing standards (see `.kiro/steering/testing.md`)
- Tests are automatically formatted using Prettier
- Coverage reports are stored in `.kiro/logs/coverage/`

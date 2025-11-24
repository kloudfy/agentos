# Eval Harness

Quality gate system for AgentOS that measures quality scores, tracks regressions over time, and blocks deployments when quality drops below acceptable thresholds.

## Overview

The Eval Harness is a unique innovation that provides:

- **Quality Scoring**: Weighted scoring system for test scenarios
- **Regression Detection**: Tracks quality changes over time
- **Blocking Gates**: Prevents commits/deployments when quality drops
- **Historical Tracking**: Maintains baseline scores for comparison
- **Flexible Scenarios**: Support for various test types

## Key Concepts

### Evaluation Suite

A collection of test scenarios with quality thresholds:

```typescript
const suite: EvalSuite = {
  name: 'Core System Quality',
  version: '1.0.0',
  description: 'Tests core functionality and performance',
  scenarios: [...],
  quality_thresholds: {
    minimum: 0.85,              // 85% minimum score
    regression_tolerance: 0.05,  // Allow 5% drop
    blocking: true               // Block on failure
  }
};
```

### Scenarios

Individual test cases with weights:

```typescript
const scenario: EvalScenario = {
  name: 'Event Emission Performance',
  weight: 0.3,  // 30% of total score
  test: {
    action: 'event.emit',
    eventType: 'test.event',
    expected: { latency_ms: 1 }
  },
  timeout: 5000
};
```

### Scoring

Scores are calculated as weighted averages:

```
total_score = Σ(scenario.score × scenario.weight)
```

Example:
- Scenario A: score=1.0, weight=0.3 → contributes 0.3
- Scenario B: score=0.8, weight=0.3 → contributes 0.24
- Scenario C: score=0.9, weight=0.4 → contributes 0.36
- **Total Score: 0.90 (90%)**

### Quality Gates

Three levels of quality gates:

1. **Minimum Threshold**: Absolute minimum acceptable score
2. **Regression Tolerance**: Maximum allowed drop from baseline
3. **Warning Threshold**: Triggers warnings but doesn't block

```typescript
quality_thresholds: {
  minimum: 0.85,              // Must be ≥85%
  regression_tolerance: 0.05,  // Can't drop >5% from baseline
  blocking: true,              // Block if failed
  warning: 0.90                // Warn if <90%
}
```

## Usage

### Basic Usage

```typescript
import { EvalRunner, EvalSuite } from '@/core/eval';

// Create suite
const suite: EvalSuite = {
  name: 'My Test Suite',
  version: '1.0.0',
  description: 'Test suite description',
  scenarios: [
    {
      name: 'Test 1',
      weight: 0.5,
      test: {
        action: 'plugin.load',
        plugin: 'test-plugin'
      }
    },
    {
      name: 'Test 2',
      weight: 0.5,
      test: {
        action: 'custom',
        testFn: async () => {
          // Custom test logic
          return true;
        }
      }
    }
  ],
  quality_thresholds: {
    minimum: 0.85,
    regression_tolerance: 0.05,
    blocking: true
  }
};

// Run evaluation
const runner: EvalRunner = new EvalHarness();
const report = await runner.run(suite);

// Check results
console.log(`Score: ${report.total_score}`);
console.log(`Passed: ${report.scenarios_passed}/${report.scenarios_total}`);

if (report.blocked) {
  console.error('Quality gates failed!');
  process.exit(1);
}
```

### With Configuration

```typescript
const config: EvalConfig = {
  results_dir: '.kiro/eval/results',
  baseline_dir: '.kiro/eval/baselines',
  save_results: true,
  update_baseline: true,
  max_retries: 2,
  parallel: true,
  max_parallel: 4
};

const report = await runner.run(suite, config);
```

### Checking Regression

```typescript
const baseline = await runner.loadBaseline(suite.name);

if (baseline) {
  const regression = baseline.score - report.total_score;
  
  if (regression > suite.quality_thresholds.regression_tolerance) {
    console.error(`Regression detected: ${regression * 100}%`);
  }
}
```

## Scenario Types

### Plugin Loading

```typescript
{
  name: 'Plugin Load Test',
  weight: 0.2,
  test: {
    action: 'plugin.load',
    plugin: 'my-plugin',
    expected: { loaded: true }
  }
}
```

### Event Emission

```typescript
{
  name: 'Event Performance',
  weight: 0.3,
  test: {
    action: 'event.emit',
    eventType: 'test.event',
    expected: { latency_ms: 1 }
  }
}
```

### State Operations

```typescript
{
  name: 'State Persistence',
  weight: 0.2,
  test: {
    action: 'state.write',
    stateKey: 'test-key',
    input: { value: 'test' },
    expected: { success: true }
  }
}
```

### Custom Tests

```typescript
{
  name: 'Custom Logic',
  weight: 0.3,
  test: {
    action: 'custom',
    testFn: async () => {
      // Your test logic
      const result = await someOperation();
      return result.success;
    }
  }
}
```

## Report Structure

```typescript
interface EvalReport {
  suite_name: string;
  timestamp: Date;
  total_score: number;           // 0-1
  scenarios_passed: number;
  scenarios_total: number;
  results: EvalResult[];
  blocked: boolean;
  baseline_score?: number;
  regression?: number;
  quality_gate_status: 'passed' | 'warning' | 'failed' | 'blocked';
  performance?: {
    total_duration_ms: number;
    avg_duration_ms: number;
    slowest_scenario?: string;
  };
}
```

## Integration

### Pre-Commit Hook

```bash
# .git/hooks/pre-commit
npm run eval || exit 1
```

### CI/CD Pipeline

```yaml
# .github/workflows/quality.yml
- name: Run Quality Gates
  run: npm run eval
  
- name: Block on Failure
  if: failure()
  run: exit 1
```

### MCP Tool

The eval harness integrates with the `eval-runner` MCP tool defined in `.kiro/mcp/eval-runner.json`.

## Best Practices

1. **Weight Distribution**: Ensure scenario weights sum to 1.0
2. **Meaningful Scenarios**: Test critical functionality
3. **Appropriate Thresholds**: Set realistic minimum scores
4. **Regular Baselines**: Update baselines after intentional changes
5. **Monitor Trends**: Track quality over time
6. **Fast Scenarios**: Keep individual tests under 5 seconds
7. **Clear Names**: Use descriptive scenario names

## Example Suite

```typescript
const coreQualitySuite: EvalSuite = {
  name: 'Core System Quality',
  version: '1.0.0',
  description: 'Comprehensive quality tests for core systems',
  scenarios: [
    {
      name: 'Event Emission Performance',
      weight: 0.25,
      test: {
        action: 'event.emit',
        eventType: 'test.event'
      },
      timeout: 1000
    },
    {
      name: 'Plugin Load Time',
      weight: 0.25,
      test: {
        action: 'plugin.load',
        plugin: 'test-plugin'
      },
      timeout: 5000
    },
    {
      name: 'State Persistence',
      weight: 0.25,
      test: {
        action: 'state.write',
        stateKey: 'test'
      },
      timeout: 2000
    },
    {
      name: 'Personality Switching',
      weight: 0.25,
      test: {
        action: 'personality.switch'
      },
      timeout: 1000
    }
  ],
  quality_thresholds: {
    minimum: 0.85,
    regression_tolerance: 0.05,
    blocking: true,
    warning: 0.90
  },
  metadata: {
    author: 'AgentOS Team',
    tags: ['core', 'performance', 'quality'],
    documentation: 'docs/eval/core-quality.md'
  }
};
```

## Files

- `types.ts` - Type definitions
- `index.ts` - Module exports
- `eval-harness.ts` - Runner implementation (Phase 2)
- `scenarios/` - Built-in scenario implementations (Phase 2)
- `reporters/` - Report formatters (Phase 2)

## References

- MCP Tool: `.kiro/mcp/eval-runner.json`
- Hook: `.kiro/hooks/eval-runner.md`
- Steering: `.kiro/steering/evals.md`

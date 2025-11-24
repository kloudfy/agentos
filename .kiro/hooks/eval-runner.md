---
name: Eval Runner
description: Runs quality gates on commit to ensure code quality and prevent regressions
enabled: true
trigger: pre-commit
priority: critical
---

# Eval Runner Hook

## Overview
This hook runs the evaluation harness before commits to ensure code quality standards are met and prevent quality regressions from being committed to the repository.

## Trigger Configuration

**Event:** `pre-commit`

**Additional Triggers:**
- `pre-push` (optional, configurable)
- `manual` (via command palette)
- `scheduled` (nightly builds)

**Execution Mode:** Blocking (prevents commit if quality gates fail)

## Quality Gates

### 1. Test Coverage Gate

**Threshold:** ≥90% coverage across all metrics

```yaml
coverage:
  statements: 90%
  branches: 90%
  functions: 90%
  lines: 90%
```

**Action on Failure:**
- Block commit
- Display coverage report
- Highlight uncovered code
- Suggest test additions

### 2. Regression Gate

**Threshold:** ≤5% performance regression

```yaml
regression:
  maxRegressionPercent: 5
  metrics:
    - responseTime
    - throughput
    - memoryUsage
    - cpuUsage
```

**Baseline:** Previous commit or main branch

**Action on Failure:**
- Block commit
- Display regression details
- Show performance comparison
- Suggest optimization areas

### 3. Test Pass Rate Gate

**Threshold:** 100% tests passing

```yaml
testPassRate:
  required: 100%
  allowFlaky: false
  retries: 2
```

**Action on Failure:**
- Block commit
- Display failing tests
- Show error messages
- Link to test logs

### 4. Code Quality Gate

**Thresholds:**
```yaml
codeQuality:
  maxComplexity: 15
  maxFileLength: 300
  maxFunctionLength: 50
  duplicateCodeThreshold: 3%
```

**Action on Failure:**
- Block commit (configurable)
- Display quality issues
- Suggest refactoring
- Link to style guide

## Execution Flow

```
1. Pre-commit hook triggered
   ↓
2. Detect changed files
   ↓
3. Run relevant test suites
   ↓
4. Calculate coverage
   ↓
5. Run performance benchmarks
   ↓
6. Compare with baseline
   ↓
7. Check quality gates
   ↓
8. Generate report
   ↓
9. Allow/Block commit
```

## Test Suites

### Unit Tests
```bash
npm test -- --coverage --changedSince=HEAD
```

**Scope:** Only test files related to changed code

**Timeout:** 60 seconds

**Parallel:** Yes (4 workers)

### Integration Tests
```bash
npm test -- src/**/__tests__/integration.test.ts
```

**Scope:** All integration tests

**Timeout:** 120 seconds

**Parallel:** Limited (2 workers)

### Performance Tests
```bash
npm run benchmark -- --compare=baseline
```

**Scope:** Core performance benchmarks

**Timeout:** 180 seconds

**Parallel:** No

## Regression Detection

### Performance Metrics

1. **Event Emission Latency**
   - Baseline: 0.5ms
   - Threshold: +5% (0.525ms)

2. **Plugin Load Time**
   - Baseline: 50ms
   - Threshold: +5% (52.5ms)

3. **State Persistence Time**
   - Baseline: 10ms
   - Threshold: +5% (10.5ms)

4. **Personality Switch Time**
   - Baseline: 1ms
   - Threshold: +5% (1.05ms)

### Regression Calculation

```typescript
regressionPercent = ((current - baseline) / baseline) * 100

if (regressionPercent > 5) {
  blockCommit();
  reportRegression();
}
```

## Output Format

### Success (All Gates Pass)

```
✓ Quality Gates Passed

Coverage:
  Statements: 94.2% (✓ ≥90%)
  Branches:   91.5% (✓ ≥90%)
  Functions:  92.8% (✓ ≥90%)
  Lines:      93.1% (✓ ≥90%)

Tests:
  Total:  143 tests
  Passed: 143 (100%)
  Failed: 0
  Time:   12.3s

Performance:
  Event Emission:      0.48ms (✓ +0% vs baseline)
  Plugin Loading:      49ms   (✓ -2% vs baseline)
  State Persistence:   9.8ms  (✓ -2% vs baseline)
  Personality Switch:  0.95ms (✓ -5% vs baseline)

✓ Commit allowed
```

### Failure (Quality Gate Failed)

```
✗ Quality Gates Failed

Coverage:
  Statements: 87.3% (✗ <90%, need +2.7%)
  Branches:   88.1% (✗ <90%, need +1.9%)
  Functions:  91.2% (✓ ≥90%)
  Lines:      89.5% (✗ <90%, need +0.5%)

Uncovered Files:
  - src/core/personality/context-analyzer.ts (84.6%)
  - src/core/plugins/dependency-resolver.ts (82.1%)

Tests:
  Total:  143 tests
  Passed: 141 (98.6%)
  Failed: 2

Failed Tests:
  ✗ PersonalitySelector › should handle edge cases
    Expected: "helpful"
    Received: "efficient"
    
  ✗ PluginManager › should resolve dependencies
    Error: Circular dependency detected

Performance:
  Event Emission:      0.53ms (✗ +6% vs baseline) ⚠ REGRESSION
  Plugin Loading:      51ms   (✓ +2% vs baseline)
  State Persistence:   10.2ms (✓ +2% vs baseline)
  Personality Switch:  0.98ms (✓ -2% vs baseline)

✗ Commit blocked

Actions Required:
  1. Add tests to increase coverage to ≥90%
  2. Fix 2 failing tests
  3. Optimize event emission (6% regression)

Run 'npm test -- --coverage' for detailed report
```

### Warning (Non-blocking Issues)

```
⚠ Quality Warnings

Code Quality:
  - src/core/plugins/plugin-manager.ts:
    • Function 'loadPlugin' has complexity 18 (max: 15)
    • File length 342 lines (max: 300)
  
  - Duplicate code detected:
    • src/core/events/event-emitter.ts:45-52
    • src/core/state/state-manager.ts:78-85

Suggestions:
  - Refactor 'loadPlugin' to reduce complexity
  - Split plugin-manager.ts into smaller modules
  - Extract duplicate code into shared utility

⚠ Commit allowed with warnings
```

## Configuration

### Hook Configuration

```yaml
evalRunner:
  enabled: true
  blocking: true
  triggers:
    preCommit: true
    prePush: false
    manual: true
  
  gates:
    coverage:
      enabled: true
      threshold: 90
      blocking: true
    
    regression:
      enabled: true
      maxPercent: 5
      blocking: true
    
    testPassRate:
      enabled: true
      required: 100
      blocking: true
    
    codeQuality:
      enabled: true
      blocking: false  # Warning only
  
  performance:
    runBenchmarks: true
    compareToBaseline: true
    baselineBranch: main
  
  reporting:
    verbose: true
    logPath: .kiro/logs/eval-results.json
    saveReports: true
    reportPath: docs/eval-reports/
  
  optimization:
    runOnlyChangedTests: true
    parallelExecution: true
    maxWorkers: 4
    cacheResults: true
```

### Bypass Options

**Emergency Bypass:** (Use sparingly)
```bash
git commit --no-verify -m "Emergency fix"
```

**Partial Bypass:** (Skip specific gates)
```bash
SKIP_COVERAGE=true git commit -m "WIP: Add feature"
```

**Note:** Bypasses are logged and reported in team metrics

## Integration with CI/CD

This hook mirrors the CI/CD pipeline checks:

1. **Local (Pre-commit):** Fast subset of tests
2. **CI (Pull Request):** Full test suite
3. **CD (Pre-deploy):** Full suite + E2E tests

**Consistency:** Same quality gates across all environments

## Performance Optimization

### Incremental Testing
- Only run tests for changed files
- Use Jest's `--changedSince` flag
- Cache test results

### Parallel Execution
- Run unit tests in parallel (4 workers)
- Run integration tests sequentially
- Use worker threads for benchmarks

### Smart Caching
- Cache test results by file hash
- Reuse coverage data when possible
- Cache benchmark baselines

### Timeout Management
- Unit tests: 60s timeout
- Integration tests: 120s timeout
- Performance tests: 180s timeout
- Total hook timeout: 300s (5 minutes)

## Error Handling

### Test Failures
- Display clear error messages
- Show stack traces
- Link to relevant code
- Suggest fixes

### Timeout Errors
- Identify slow tests
- Suggest optimization
- Allow bypass with warning

### Infrastructure Errors
- Detect environment issues
- Provide troubleshooting steps
- Allow retry

## Logging and Reporting

### Log Files
```
.kiro/logs/eval-results.json       # Latest results
.kiro/logs/eval-history/           # Historical results
.kiro/logs/regressions/            # Regression details
```

### Report Generation
- JSON format for programmatic access
- Markdown format for documentation
- HTML format for visualization
- CSV format for metrics tracking

### Metrics Tracked
- Coverage trends over time
- Test execution time trends
- Regression frequency
- Quality gate pass/fail rates
- Most common failure reasons

## Team Notifications

### Slack Integration (Optional)
```yaml
notifications:
  slack:
    enabled: false
    webhook: ${SLACK_WEBHOOK_URL}
    channels:
      - #engineering
    events:
      - regression
      - coverage-drop
      - repeated-failures
```

### Email Notifications (Optional)
```yaml
notifications:
  email:
    enabled: false
    recipients:
      - team@example.com
    events:
      - critical-regression
      - security-issues
```

## Best Practices

1. **Run Locally First:** Always run eval before committing
2. **Fix Issues Promptly:** Don't accumulate quality debt
3. **Monitor Trends:** Watch for gradual quality degradation
4. **Update Baselines:** Refresh baselines after intentional changes
5. **Document Bypasses:** Always explain why you bypassed checks
6. **Review Reports:** Regularly review quality reports
7. **Optimize Tests:** Keep tests fast and reliable

## Troubleshooting

### Hook Not Running
```bash
# Check hook installation
ls -la .git/hooks/pre-commit

# Reinstall hooks
npm run prepare
```

### Tests Timing Out
```bash
# Increase timeout
JEST_TIMEOUT=120000 git commit -m "message"

# Run specific tests
npm test -- --testNamePattern="specific test"
```

### False Positives
```bash
# Update baseline
npm run benchmark -- --save-baseline

# Clear cache
npm test -- --clearCache
```

## Integration with Other Hooks

- **Test Generator:** Ensures new tests are included
- **Linting Hook:** Code quality checks run first
- **ADR Generator:** Documents quality decisions

## Notes

- This hook uses the `eval-runner` MCP tool
- Results are stored in `.kiro/logs/eval-results.json`
- Historical data enables trend analysis
- Integrates with GitHub Actions for CI/CD
- Supports custom quality gates via configuration

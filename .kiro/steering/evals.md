---
title: Quality Evaluation Criteria
category: quality
priority: critical
inclusion: always
---

# Quality Evaluation Criteria

This document defines quality criteria and evaluation metrics for AgentOS. All code must meet these standards to ensure high-quality, production-ready software.

## Performance Benchmarks

### Core System Performance

**Event System:**
- Event emission latency: <1ms (p95)
- Event throughput: >10,000 events/second
- Memory per event: <1KB
- Listener registration: <0.1ms

**Plugin System:**
- Plugin load time: <100ms per plugin
- Plugin initialization: <500ms per plugin
- Dependency resolution: <50ms for 100 plugins
- Memory per plugin: <5MB baseline

**State Management:**
- Read operation: <10ms (p95)
- Write operation: <50ms (p95)
- Batch operations: <100ms for 100 items
- State file size: <10MB per scope

**Personality System:**
- Context analysis: <5ms
- Personality selection: <10ms
- Personality switch: <5ms
- Pattern matching: <1ms

### Performance Testing

```typescript
describe('performance benchmarks', () => {
  it('should emit events in <1ms', async () => {
    const emitter = new EventEmitter();
    const iterations = 1000;
    
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      emitter.emit(createTestEvent());
    }
    const duration = performance.now() - start;
    
    const avgLatency = duration / iterations;
    expect(avgLatency).toBeLessThan(1);
  });
  
  it('should load plugin in <100ms', async () => {
    const manager = new PluginManager(events, state);
    
    const start = performance.now();
    await manager.loadPlugin(testPlugin);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
```

### Performance Monitoring

```typescript
// Instrument critical paths
class PerformanceMonitor {
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      
      if (duration > this.thresholds[name]) {
        logger.warn('Performance threshold exceeded', {
          operation: name,
          duration,
          threshold: this.thresholds[name]
        });
      }
    }
  }
}
```


## Reliability Targets

### Availability

**Target:** 99.9% uptime (8.76 hours downtime/year)

**Measurement:**
- Track system crashes
- Monitor error rates
- Measure recovery time
- Log all failures

### Error Handling

**Requirements:**
- All errors caught and logged
- Graceful degradation on failures
- No unhandled promise rejections
- No uncaught exceptions

**Error Rate Targets:**
- Critical errors: 0 per day
- Non-critical errors: <10 per day
- Warnings: <100 per day

### Recovery

**Targets:**
- Automatic recovery from transient failures
- State recovery after crash: <5 seconds
- Plugin recovery: Isolate failures, continue operation
- Data integrity: No data loss on crashes

### Testing for Reliability

```typescript
describe('reliability', () => {
  it('should recover from plugin crash', async () => {
    const manager = new PluginManager(events, state);
    const crashingPlugin = createCrashingPlugin();
    
    await manager.loadPlugin(crashingPlugin);
    
    // Plugin crashes
    await expect(
      crashingPlugin.initialize(context)
    ).rejects.toThrow();
    
    // System continues operating
    expect(manager.isRunning()).toBe(true);
    
    // Other plugins unaffected
    const otherPlugin = manager.getPlugin('other');
    expect(otherPlugin).toBeDefined();
  });
  
  it('should preserve state on crash', async () => {
    const store = new FileSystemStateStore(testPath);
    
    await store.set('key', 'value');
    
    // Simulate crash
    process.kill(process.pid, 'SIGTERM');
    
    // Restart
    const newStore = new FileSystemStateStore(testPath);
    const value = await newStore.get('key');
    
    expect(value).toBe('value');
  });
});
```

## Maintainability Metrics

### Code Complexity

**Cyclomatic Complexity:**
- Maximum: 15 per function
- Target: <10 per function
- Action: Refactor if exceeded

**Cognitive Complexity:**
- Maximum: 20 per function
- Target: <15 per function
- Focus on readability

### Code Duplication

**Target:** <3% duplicate code

**Detection:**
```bash
# Use jscpd for duplicate detection
npx jscpd src/
```

**Action:** Extract common code into utilities

### Technical Debt

**Measurement:**
- TODO/FIXME comments tracked
- Code smells identified by SonarQube
- Outdated dependencies monitored

**Target:**
- Resolve critical debt within 1 sprint
- Reduce debt by 10% per quarter

### Documentation Coverage

**Requirements:**
- 100% of public APIs documented
- All modules have README
- Architecture decisions recorded (ADRs)
- Examples for complex features

**Measurement:**
```bash
# Check JSDoc coverage
npm run docs:coverage
```

## Code Quality Metrics

### Test Coverage

**Minimum Thresholds:**
- Statements: 90%
- Branches: 90%
- Functions: 90%
- Lines: 90%

**Target:** 95% coverage across all metrics

### Type Safety

**Requirements:**
- TypeScript strict mode enabled
- No `any` types (exceptions documented)
- All function signatures typed
- No type assertions without validation

**Measurement:**
```bash
# Type check
npm run type-check

# Count any types
grep -r "any" src/ --include="*.ts" | wc -l
```

### Linting

**Zero tolerance for:**
- ESLint errors
- TypeScript errors
- Security vulnerabilities

**Warnings:**
- Address within 1 week
- Track in backlog

## Security Metrics

### Vulnerability Scanning

**Frequency:** Daily automated scans

**Targets:**
- Zero critical vulnerabilities
- Zero high vulnerabilities
- <5 medium vulnerabilities
- Address within SLA:
  - Critical: 24 hours
  - High: 1 week
  - Medium: 1 month

**Tools:**
```bash
npm audit
npm run security-check
```

### Security Testing

```typescript
describe('security', () => {
  it('should prevent path traversal', () => {
    expect(() => 
      readFile('../../../etc/passwd')
    ).toThrow(SecurityError);
  });
  
  it('should validate input length', () => {
    const longInput = 'a'.repeat(10000);
    expect(() => 
      processInput(longInput)
    ).toThrow(ValidationError);
  });
  
  it('should sanitize output', () => {
    const error = new Error('/secret/path/file.ts:42');
    const sanitized = sanitizeError(error);
    expect(sanitized).not.toContain('/secret/path');
  });
});
```

## User Experience Metrics

### Response Time

**Targets:**
- User action to feedback: <100ms
- Command execution: <1 second
- Plugin operation: <5 seconds

### Error Messages

**Quality Criteria:**
- Clear and actionable
- Include context
- Suggest solutions
- No technical jargon (for user-facing errors)

**Example:**
```typescript
// ✓ GOOD: Clear, actionable
throw new Error(
  'Plugin "my-plugin" failed to load. ' +
  'Ensure the plugin is installed and compatible with AgentOS 2.0. ' +
  'Run "npm install my-plugin" to install.'
);

// ✗ BAD: Vague, unhelpful
throw new Error('Plugin error');
```

## Scalability Metrics

### Resource Usage

**Memory:**
- Base system: <50MB
- Per plugin: <5MB
- Total limit: <500MB for 50 plugins

**CPU:**
- Idle: <1% CPU
- Active: <10% CPU average
- Spike: <50% CPU peak

**Disk:**
- State storage: <100MB
- Logs: <1GB (with rotation)
- Cache: <500MB

### Load Testing

```typescript
describe('scalability', () => {
  it('should handle 100 plugins', async () => {
    const manager = new PluginManager(events, state);
    const plugins = Array.from({ length: 100 }, createTestPlugin);
    
    const start = performance.now();
    await Promise.all(plugins.map(p => manager.loadPlugin(p)));
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(10000); // <10s for 100 plugins
    expect(manager.getPluginCount()).toBe(100);
  });
  
  it('should handle 10k events/second', async () => {
    const emitter = new EventEmitter();
    const events = Array.from({ length: 10000 }, createTestEvent);
    
    const start = performance.now();
    events.forEach(e => emitter.emit(e));
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(1000); // <1s for 10k events
  });
});
```

## Quality Gates

### Pre-Commit Gates

**Must Pass:**
- All tests pass
- Coverage ≥90%
- No linting errors
- No type errors
- No security vulnerabilities

### Pre-Merge Gates

**Must Pass:**
- All pre-commit gates
- Code review approved
- Documentation updated
- Performance benchmarks pass
- No regressions detected

### Pre-Release Gates

**Must Pass:**
- All pre-merge gates
- E2E tests pass
- Load tests pass
- Security audit complete
- Release notes prepared

## Continuous Monitoring

### Metrics Dashboard

**Track:**
- Test coverage trends
- Performance metrics
- Error rates
- Build times
- Deployment frequency
- Mean time to recovery (MTTR)

### Alerts

**Trigger alerts on:**
- Coverage drops below 90%
- Performance regression >5%
- Error rate spike
- Security vulnerability detected
- Build failure

## Evaluation Process

### Daily

- Run full test suite
- Check coverage reports
- Review error logs
- Monitor performance metrics

### Weekly

- Review quality metrics
- Address technical debt
- Update documentation
- Security scan

### Monthly

- Comprehensive quality review
- Performance optimization
- Dependency updates
- Architecture review

## Quality Improvement

### Continuous Improvement

**Process:**
1. Measure current metrics
2. Identify improvement areas
3. Set specific targets
4. Implement changes
5. Measure results
6. Iterate

**Targets:**
- Improve coverage by 1% per sprint
- Reduce complexity by 5% per quarter
- Decrease error rate by 10% per quarter
- Improve performance by 5% per quarter

### Retrospectives

**Frequency:** After each major release

**Review:**
- What went well
- What needs improvement
- Action items
- Lessons learned

## Reporting

### Quality Report Format

```markdown
# Quality Report - 2024-01-15

## Test Coverage
- Statements: 94.2% (✓ Target: 90%)
- Branches: 91.5% (✓ Target: 90%)
- Functions: 92.8% (✓ Target: 90%)
- Lines: 93.1% (✓ Target: 90%)

## Performance
- Event emission: 0.48ms (✓ Target: <1ms)
- Plugin loading: 49ms (✓ Target: <100ms)
- State operations: 9.8ms (✓ Target: <10ms)

## Reliability
- Uptime: 99.95% (✓ Target: 99.9%)
- Error rate: 3/day (✓ Target: <10/day)
- Recovery time: 2.1s (✓ Target: <5s)

## Security
- Critical vulnerabilities: 0 (✓ Target: 0)
- High vulnerabilities: 0 (✓ Target: 0)
- Medium vulnerabilities: 2 (✓ Target: <5)

## Technical Debt
- TODO items: 12 (↓ from 15)
- Code duplication: 2.1% (✓ Target: <3%)
- Complexity violations: 3 (↓ from 5)

## Action Items
1. Address 2 medium security vulnerabilities
2. Reduce TODO count to <10
3. Optimize state persistence (target: <8ms)
```

## Review Checklist

Before release, verify:
- [ ] All quality gates passed
- [ ] Performance benchmarks met
- [ ] Reliability targets achieved
- [ ] Security scan clean
- [ ] Documentation complete
- [ ] Tests comprehensive (≥90% coverage)
- [ ] No critical technical debt
- [ ] Metrics tracked and reported

## References

- Performance Benchmarks: `benchmarks/`
- Test Coverage Reports: `.kiro/logs/coverage/`
- Quality Metrics: `.kiro/logs/quality-metrics.json`
- Security Audits: `.kiro/logs/security-audit.log`

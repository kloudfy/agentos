import { ScenarioExecutor } from '../scenario-executor';
import { ScenarioTest } from '../types';

describe('ScenarioExecutor', () => {
  let executor: ScenarioExecutor;

  beforeEach(() => {
    executor = new ScenarioExecutor();
  });

  describe('execute', () => {
    it('should execute plugin load test', async () => {
      const test: ScenarioTest = {
        action: 'plugin.load',
        plugin: 'test-plugin',
      };

      const result = await executor.execute('Plugin Load Test', test);

      expect(result.scenario_name).toBe('Plugin Load Test');
      expect(result.passed).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.duration_ms).toBeGreaterThan(0);
    });

    it('should execute event emit test', async () => {
      const test: ScenarioTest = {
        action: 'event.emit',
        eventType: 'test.event',
      };

      const result = await executor.execute('Event Emit Test', test);

      expect(result.passed).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should execute custom test', async () => {
      const test: ScenarioTest = {
        action: 'custom',
        testFn: async () => true,
      };

      const result = await executor.execute('Custom Test', test);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(1.0);
    });

    it('should handle test failure', async () => {
      const test: ScenarioTest = {
        action: 'custom',
        testFn: async () => false,
      };

      const result = await executor.execute('Failing Test', test);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should handle test error', async () => {
      const test: ScenarioTest = {
        action: 'custom',
        testFn: async () => {
          throw new Error('Test error');
        },
      };

      const result = await executor.execute('Error Test', test);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(result.error).toBe('Test error');
    });

    it('should handle timeout', async () => {
      const test: ScenarioTest = {
        action: 'custom',
        testFn: async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        },
      };

      const result = await executor.execute('Timeout Test', test, 100);

      expect(result.passed).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should include metadata', async () => {
      const test: ScenarioTest = {
        action: 'custom',
        testFn: async () => true,
      };

      const result = await executor.execute('Metadata Test', test);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.memory_used_mb).toBeDefined();
      expect(result.metadata?.action).toBe('custom');
    });
  });

  describe('action types', () => {
    it('should execute plugin.initialize', async () => {
      const test: ScenarioTest = {
        action: 'plugin.initialize',
        plugin: 'test-plugin',
      };

      const result = await executor.execute('Init Test', test);

      expect(result.passed).toBeDefined();
    });

    it('should execute state.read', async () => {
      const test: ScenarioTest = {
        action: 'state.read',
        stateKey: 'test-key',
      };

      const result = await executor.execute('Read Test', test);

      expect(result.passed).toBeDefined();
    });

    it('should execute state.write', async () => {
      const test: ScenarioTest = {
        action: 'state.write',
        stateKey: 'test-key',
        input: { value: 'test' },
      };

      const result = await executor.execute('Write Test', test);

      expect(result.passed).toBeDefined();
    });

    it('should execute personality.switch', async () => {
      const test: ScenarioTest = {
        action: 'personality.switch',
      };

      const result = await executor.execute('Switch Test', test);

      expect(result.passed).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should use custom validation function', async () => {
      const test: ScenarioTest = {
        action: 'custom',
        testFn: async () => true,
        validate: (result) => {
          return result === true;
        },
      };

      const result = await executor.execute('Validation Test', test);

      expect(result.passed).toBe(true);
    });

    it('should fail on validation failure', async () => {
      const test: ScenarioTest = {
        action: 'custom',
        testFn: async () => true,
        validate: () => false,
      };

      const result = await executor.execute('Validation Fail Test', test);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should require plugin name for plugin actions', async () => {
      const test: ScenarioTest = {
        action: 'plugin.load',
        // Missing plugin name
      };

      const result = await executor.execute('Missing Plugin', test);

      expect(result.passed).toBe(false);
      expect(result.error).toContain('Plugin name required');
    });

    it('should require event type for event actions', async () => {
      const test: ScenarioTest = {
        action: 'event.emit',
        // Missing event type
      };

      const result = await executor.execute('Missing Event', test);

      expect(result.passed).toBe(false);
      expect(result.error).toContain('Event type required');
    });

    it('should require state key for state actions', async () => {
      const test: ScenarioTest = {
        action: 'state.read',
        // Missing state key
      };

      const result = await executor.execute('Missing Key', test);

      expect(result.passed).toBe(false);
      expect(result.error).toContain('State key required');
    });

    it('should require test function for custom action', async () => {
      const test: ScenarioTest = {
        action: 'custom',
        // Missing testFn
      };

      const result = await executor.execute('Missing Function', test);

      expect(result.passed).toBe(false);
      expect(result.error).toContain('Test function required');
    });
  });
});

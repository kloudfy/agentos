import { EvalHarness } from '../eval-harness';
import { EvalSuite, EvalConfig } from '../types';

describe('EvalHarness', () => {
  let harness: EvalHarness;

  beforeEach(() => {
    harness = new EvalHarness();
  });

  describe('run', () => {
    it('should run simple suite', async () => {
      const suite: EvalSuite = {
        name: 'Test Suite',
        version: '1.0.0',
        description: 'Test suite',
        scenarios: [
          {
            name: 'Test 1',
            weight: 0.5,
            test: {
              action: 'custom',
              testFn: async () => true,
            },
          },
          {
            name: 'Test 2',
            weight: 0.5,
            test: {
              action: 'custom',
              testFn: async () => true,
            },
          },
        ],
        quality_thresholds: {
          minimum: 0.85,
          regression_tolerance: 0.05,
          blocking: true,
        },
      };

      const report = await harness.run(suite);

      expect(report.suite_name).toBe('Test Suite');
      expect(report.scenarios_total).toBe(2);
      expect(report.scenarios_passed).toBe(2);
      expect(report.total_score).toBe(1.0);
      expect(report.blocked).toBe(false);
      expect(report.quality_gate_status).toBe('passed');
    });

    it('should calculate weighted score correctly', async () => {
      const suite: EvalSuite = {
        name: 'Weighted Suite',
        version: '1.0.0',
        description: 'Test weighted scoring',
        scenarios: [
          {
            name: 'High Weight Pass',
            weight: 0.7,
            test: {
              action: 'custom',
              testFn: async () => true,
            },
          },
          {
            name: 'Low Weight Fail',
            weight: 0.3,
            test: {
              action: 'custom',
              testFn: async () => false,
            },
          },
        ],
        quality_thresholds: {
          minimum: 0.60,
          regression_tolerance: 0.05,
          blocking: false,
        },
      };

      const report = await harness.run(suite);

      // Score should be 0.7 * 1.0 + 0.3 * 0.0 = 0.7
      expect(report.total_score).toBeCloseTo(0.7, 5);
      expect(report.scenarios_passed).toBe(1);
      expect(report.scenarios_total).toBe(2);
    });

    it('should block when quality gates fail', async () => {
      const suite: EvalSuite = {
        name: 'Failing Suite',
        version: '1.0.0',
        description: 'Test blocking',
        scenarios: [
          {
            name: 'Failing Test',
            weight: 1.0,
            test: {
              action: 'custom',
              testFn: async () => false,
            },
          },
        ],
        quality_thresholds: {
          minimum: 0.85,
          regression_tolerance: 0.05,
          blocking: true,
        },
      };

      const report = await harness.run(suite);

      expect(report.total_score).toBe(0);
      expect(report.blocked).toBe(true);
      expect(report.quality_gate_status).toBe('blocked');
    });

    it('should include performance metrics', async () => {
      const suite: EvalSuite = {
        name: 'Performance Suite',
        version: '1.0.0',
        description: 'Test performance tracking',
        scenarios: [
          {
            name: 'Fast Test',
            weight: 0.5,
            test: {
              action: 'custom',
              testFn: async () => true,
            },
          },
          {
            name: 'Slow Test',
            weight: 0.5,
            test: {
              action: 'custom',
              testFn: async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                return true;
              },
            },
          },
        ],
        quality_thresholds: {
          minimum: 0.85,
          regression_tolerance: 0.05,
          blocking: false,
        },
      };

      const report = await harness.run(suite);

      expect(report.performance).toBeDefined();
      expect(report.performance?.total_duration_ms).toBeGreaterThan(0);
      expect(report.performance?.avg_duration_ms).toBeGreaterThan(0);
      expect(report.performance?.slowest_scenario).toBe('Slow Test');
    });

    it('should include summary and recommendations', async () => {
      const suite: EvalSuite = {
        name: 'Summary Suite',
        version: '1.0.0',
        description: 'Test summary generation',
        scenarios: [
          {
            name: 'Test',
            weight: 1.0,
            test: {
              action: 'custom',
              testFn: async () => false,
            },
          },
        ],
        quality_thresholds: {
          minimum: 0.85,
          regression_tolerance: 0.05,
          blocking: true,
        },
      };

      const report = await harness.run(suite);

      expect(report.summary).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations!.length).toBeGreaterThan(0);
    });
  });

  describe('calculateScore', () => {
    it('should calculate weighted average', () => {
      const results = [
        { scenario_name: 'T1', passed: true, score: 1.0, duration_ms: 100 },
        { scenario_name: 'T2', passed: true, score: 0.8, duration_ms: 100 },
        { scenario_name: 'T3', passed: true, score: 0.9, duration_ms: 100 },
      ];

      const scenarios = [
        { name: 'T1', weight: 0.3, test: { action: 'custom' as const } },
        { name: 'T2', weight: 0.3, test: { action: 'custom' as const } },
        { name: 'T3', weight: 0.4, test: { action: 'custom' as const } },
      ];

      const score = harness.calculateScore(results, scenarios);

      // 0.3*1.0 + 0.3*0.8 + 0.4*0.9 = 0.3 + 0.24 + 0.36 = 0.9
      expect(score).toBeCloseTo(0.9, 5);
    });

    it('should handle zero weight', () => {
      const results = [
        { scenario_name: 'T1', passed: true, score: 1.0, duration_ms: 100 },
      ];

      const scenarios = [
        { name: 'T1', weight: 0, test: { action: 'custom' as const } },
      ];

      const score = harness.calculateScore(results, scenarios);

      expect(score).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should support parallel execution', async () => {
      const suite: EvalSuite = {
        name: 'Parallel Suite',
        version: '1.0.0',
        description: 'Test parallel execution',
        scenarios: [
          {
            name: 'Test 1',
            weight: 0.25,
            test: { action: 'custom', testFn: async () => true },
          },
          {
            name: 'Test 2',
            weight: 0.25,
            test: { action: 'custom', testFn: async () => true },
          },
          {
            name: 'Test 3',
            weight: 0.25,
            test: { action: 'custom', testFn: async () => true },
          },
          {
            name: 'Test 4',
            weight: 0.25,
            test: { action: 'custom', testFn: async () => true },
          },
        ],
        quality_thresholds: {
          minimum: 0.85,
          regression_tolerance: 0.05,
          blocking: false,
        },
      };

      const config: EvalConfig = {
        parallel: true,
        max_parallel: 2,
      };

      const report = await harness.run(suite, config);

      expect(report.scenarios_total).toBe(4);
      expect(report.scenarios_passed).toBe(4);
    });

    it('should support retry on failure', async () => {
      let attempts = 0;

      const suite: EvalSuite = {
        name: 'Retry Suite',
        version: '1.0.0',
        description: 'Test retry logic',
        scenarios: [
          {
            name: 'Flaky Test',
            weight: 1.0,
            test: {
              action: 'custom',
              testFn: async () => {
                attempts++;
                return attempts >= 2; // Pass on second attempt
              },
            },
          },
        ],
        quality_thresholds: {
          minimum: 0.85,
          regression_tolerance: 0.05,
          blocking: false,
        },
      };

      const config: EvalConfig = {
        max_retries: 2,
      };

      const report = await harness.run(suite, config);

      expect(report.scenarios_passed).toBe(1);
      expect(report.results[0].metadata?.attempts).toBe(2);
    });

    it('should stop on failure when configured', async () => {
      const suite: EvalSuite = {
        name: 'Stop on Failure Suite',
        version: '1.0.0',
        description: 'Test stop on failure',
        scenarios: [
          {
            name: 'Failing Test',
            weight: 0.5,
            test: { action: 'custom', testFn: async () => false },
          },
          {
            name: 'Should Not Run',
            weight: 0.5,
            test: { action: 'custom', testFn: async () => true },
          },
        ],
        quality_thresholds: {
          minimum: 0.85,
          regression_tolerance: 0.05,
          blocking: false,
        },
      };

      const config: EvalConfig = {
        continue_on_failure: false,
      };

      const report = await harness.run(suite, config);

      expect(report.scenarios_total).toBe(1); // Only first scenario ran
    });
  });
});

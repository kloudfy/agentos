import {
  EvalScenario,
  EvalSuite,
  EvalResult,
  EvalReport,
  QualityThresholds,
  ScenarioTest,
  EvalBaseline,
} from '../types';

describe('Eval Types', () => {
  describe('ScenarioTest', () => {
    it('should create valid plugin load test', () => {
      const test: ScenarioTest = {
        action: 'plugin.load',
        plugin: 'test-plugin',
        expected: { loaded: true },
      };

      expect(test.action).toBe('plugin.load');
      expect(test.plugin).toBe('test-plugin');
    });

    it('should create valid event emit test', () => {
      const test: ScenarioTest = {
        action: 'event.emit',
        eventType: 'test.event',
        expected: { emitted: true },
      };

      expect(test.action).toBe('event.emit');
      expect(test.eventType).toBe('test.event');
    });

    it('should create valid custom test', () => {
      const testFn = async () => true;
      const test: ScenarioTest = {
        action: 'custom',
        testFn,
      };

      expect(test.action).toBe('custom');
      expect(test.testFn).toBe(testFn);
    });
  });

  describe('EvalScenario', () => {
    it('should create valid scenario', () => {
      const scenario: EvalScenario = {
        name: 'Test Scenario',
        weight: 0.5,
        test: {
          action: 'plugin.load',
          plugin: 'test',
        },
        timeout: 5000,
      };

      expect(scenario.name).toBe('Test Scenario');
      expect(scenario.weight).toBe(0.5);
      expect(scenario.timeout).toBe(5000);
    });

    it('should allow optional fields', () => {
      const scenario: EvalScenario = {
        name: 'Minimal Scenario',
        weight: 1.0,
        test: {
          action: 'custom',
          testFn: async () => true,
        },
      };

      expect(scenario.timeout).toBeUndefined();
      expect(scenario.description).toBeUndefined();
    });
  });

  describe('QualityThresholds', () => {
    it('should create valid thresholds', () => {
      const thresholds: QualityThresholds = {
        minimum: 0.85,
        regression_tolerance: 0.05,
        blocking: true,
      };

      expect(thresholds.minimum).toBe(0.85);
      expect(thresholds.regression_tolerance).toBe(0.05);
      expect(thresholds.blocking).toBe(true);
    });

    it('should allow optional warning threshold', () => {
      const thresholds: QualityThresholds = {
        minimum: 0.85,
        regression_tolerance: 0.05,
        blocking: true,
        warning: 0.90,
      };

      expect(thresholds.warning).toBe(0.90);
    });
  });

  describe('EvalSuite', () => {
    it('should create valid suite', () => {
      const suite: EvalSuite = {
        name: 'Test Suite',
        version: '1.0.0',
        description: 'Test suite description',
        scenarios: [
          {
            name: 'Scenario 1',
            weight: 0.5,
            test: { action: 'plugin.load', plugin: 'test' },
          },
          {
            name: 'Scenario 2',
            weight: 0.5,
            test: { action: 'event.emit', eventType: 'test' },
          },
        ],
        quality_thresholds: {
          minimum: 0.85,
          regression_tolerance: 0.05,
          blocking: true,
        },
      };

      expect(suite.name).toBe('Test Suite');
      expect(suite.scenarios).toHaveLength(2);
      expect(suite.quality_thresholds.minimum).toBe(0.85);
    });

    it('should validate weights sum to 1.0', () => {
      const suite: EvalSuite = {
        name: 'Test Suite',
        version: '1.0.0',
        description: 'Test',
        scenarios: [
          { name: 'S1', weight: 0.3, test: { action: 'custom', testFn: async () => true } },
          { name: 'S2', weight: 0.3, test: { action: 'custom', testFn: async () => true } },
          { name: 'S3', weight: 0.4, test: { action: 'custom', testFn: async () => true } },
        ],
        quality_thresholds: {
          minimum: 0.85,
          regression_tolerance: 0.05,
          blocking: true,
        },
      };

      const totalWeight = suite.scenarios.reduce((sum, s) => sum + s.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });
  });

  describe('EvalResult', () => {
    it('should create valid passing result', () => {
      const result: EvalResult = {
        scenario_name: 'Test Scenario',
        passed: true,
        score: 1.0,
        duration_ms: 150,
      };

      expect(result.passed).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.error).toBeUndefined();
    });

    it('should create valid failing result', () => {
      const result: EvalResult = {
        scenario_name: 'Test Scenario',
        passed: false,
        score: 0.0,
        duration_ms: 200,
        error: 'Test failed',
        stack: 'Error stack trace',
      };

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0.0);
      expect(result.error).toBe('Test failed');
    });

    it('should include optional metadata', () => {
      const result: EvalResult = {
        scenario_name: 'Test Scenario',
        passed: true,
        score: 0.95,
        duration_ms: 100,
        metadata: {
          attempts: 1,
          memory_used_mb: 12.5,
          cpu_time_ms: 95,
        },
      };

      expect(result.metadata?.attempts).toBe(1);
      expect(result.metadata?.memory_used_mb).toBe(12.5);
    });
  });

  describe('EvalReport', () => {
    it('should create valid report', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.92,
        scenarios_passed: 8,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      expect(report.total_score).toBe(0.92);
      expect(report.scenarios_passed).toBe(8);
      expect(report.blocked).toBe(false);
    });

    it('should include regression data', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.88,
        scenarios_passed: 7,
        scenarios_total: 10,
        results: [],
        blocked: true,
        baseline_score: 0.95,
        regression: 0.07,
        quality_gate_status: 'blocked',
      };

      expect(report.baseline_score).toBe(0.95);
      expect(report.regression).toBe(0.07);
      expect(report.quality_gate_status).toBe('blocked');
    });

    it('should include performance metrics', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.90,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
        performance: {
          total_duration_ms: 5000,
          avg_duration_ms: 500,
          slowest_scenario: 'Heavy Test',
          peak_memory_mb: 150,
        },
      };

      expect(report.performance?.total_duration_ms).toBe(5000);
      expect(report.performance?.slowest_scenario).toBe('Heavy Test');
    });
  });

  describe('EvalBaseline', () => {
    it('should create valid baseline', () => {
      const baseline: EvalBaseline = {
        suite_name: 'Test Suite',
        suite_version: '1.0.0',
        score: 0.95,
        timestamp: new Date(),
        commit: 'abc123',
        branch: 'main',
      };

      expect(baseline.score).toBe(0.95);
      expect(baseline.commit).toBe('abc123');
    });

    it('should include scenario scores', () => {
      const baseline: EvalBaseline = {
        suite_name: 'Test Suite',
        suite_version: '1.0.0',
        score: 0.95,
        timestamp: new Date(),
        scenario_scores: {
          'Scenario 1': 1.0,
          'Scenario 2': 0.9,
          'Scenario 3': 0.95,
        },
      };

      expect(baseline.scenario_scores?.['Scenario 1']).toBe(1.0);
      expect(baseline.scenario_scores?.['Scenario 2']).toBe(0.9);
    });
  });

  describe('Quality Gate Logic', () => {
    it('should pass when score meets minimum', () => {
      const thresholds: QualityThresholds = {
        minimum: 0.85,
        regression_tolerance: 0.05,
        blocking: true,
      };

      const score = 0.90;
      const passed = score >= thresholds.minimum;

      expect(passed).toBe(true);
    });

    it('should fail when score below minimum', () => {
      const thresholds: QualityThresholds = {
        minimum: 0.85,
        regression_tolerance: 0.05,
        blocking: true,
      };

      const score = 0.80;
      const passed = score >= thresholds.minimum;

      expect(passed).toBe(false);
    });

    it('should detect regression', () => {
      const thresholds: QualityThresholds = {
        minimum: 0.85,
        regression_tolerance: 0.05,
        blocking: true,
      };

      const baseline = 0.95;
      const current = 0.88;
      const regression = baseline - current;

      expect(regression).toBeCloseTo(0.07, 5);
      expect(regression > thresholds.regression_tolerance).toBe(true);
    });

    it('should allow acceptable regression', () => {
      const thresholds: QualityThresholds = {
        minimum: 0.85,
        regression_tolerance: 0.05,
        blocking: true,
      };

      const baseline = 0.95;
      const current = 0.92;
      const regression = baseline - current;

      expect(regression).toBeCloseTo(0.03, 5);
      expect(regression <= thresholds.regression_tolerance).toBe(true);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate weighted average correctly', () => {
      const results: Array<{ score: number; weight: number }> = [
        { score: 1.0, weight: 0.3 },
        { score: 0.8, weight: 0.3 },
        { score: 0.9, weight: 0.4 },
      ];

      const totalScore = results.reduce(
        (sum, r) => sum + r.score * r.weight,
        0
      );

      expect(totalScore).toBeCloseTo(0.9, 5); // 0.3 + 0.24 + 0.36 = 0.9
    });

    it('should handle perfect scores', () => {
      const results: Array<{ score: number; weight: number }> = [
        { score: 1.0, weight: 0.5 },
        { score: 1.0, weight: 0.5 },
      ];

      const totalScore = results.reduce(
        (sum, r) => sum + r.score * r.weight,
        0
      );

      expect(totalScore).toBe(1.0);
    });

    it('should handle complete failure', () => {
      const results: Array<{ score: number; weight: number }> = [
        { score: 0.0, weight: 0.5 },
        { score: 0.0, weight: 0.5 },
      ];

      const totalScore = results.reduce(
        (sum, r) => sum + r.score * r.weight,
        0
      );

      expect(totalScore).toBe(0.0);
    });
  });
});

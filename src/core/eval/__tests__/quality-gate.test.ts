import { QualityGate } from '../quality-gate';
import { EvalReport, EvalBaseline, QualityThresholds } from '../types';

describe('QualityGate', () => {
  let gate: QualityGate;

  beforeEach(() => {
    gate = new QualityGate();
  });

  describe('checkQuality', () => {
    const thresholds: QualityThresholds = {
      minimum: 0.85,
      regression_tolerance: 0.05,
      blocking: true,
      warning: 0.90,
    };

    it('should pass when score meets minimum', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.90,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const result = gate.checkQuality(report, thresholds);

      expect(result.passed).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.status).toBe('passed');
      expect(result.failures).toHaveLength(0);
    });

    it('should fail when score below minimum', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.80,
        scenarios_passed: 8,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const result = gate.checkQuality(report, thresholds);

      expect(result.passed).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.status).toBe('blocked');
      expect(result.failures.length).toBeGreaterThan(0);
    });

    it('should warn when score below warning threshold', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.88,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const result = gate.checkQuality(report, thresholds);

      expect(result.passed).toBe(true);
      expect(result.status).toBe('warning');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect regression', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.88,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const baseline: EvalBaseline = {
        suite_name: 'Test Suite',
        suite_version: '1.0.0',
        score: 0.95,
        timestamp: new Date(),
      };

      const result = gate.checkQuality(report, thresholds, baseline);

      expect(result.passed).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.failures.some(f => f.includes('Regression'))).toBe(true);
    });

    it('should allow acceptable regression', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.92,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const baseline: EvalBaseline = {
        suite_name: 'Test Suite',
        suite_version: '1.0.0',
        score: 0.95,
        timestamp: new Date(),
      };

      const result = gate.checkQuality(report, thresholds, baseline);

      expect(result.passed).toBe(true);
      expect(result.blocked).toBe(false);
    });

    it('should not block when blocking is disabled', () => {
      const nonBlockingThresholds: QualityThresholds = {
        ...thresholds,
        blocking: false,
      };

      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.80,
        scenarios_passed: 8,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const result = gate.checkQuality(report, nonBlockingThresholds);

      expect(result.passed).toBe(false);
      expect(result.blocked).toBe(false);
      expect(result.status).toBe('failed');
    });

    it('should include recommendations', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.80,
        scenarios_passed: 8,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const result = gate.checkQuality(report, thresholds);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('detectRegression', () => {
    it('should detect regression above tolerance', () => {
      const result = gate.detectRegression(0.88, 0.95, 0.05);

      expect(result.detected).toBe(true);
      expect(result.amount).toBeCloseTo(0.07, 5);
    });

    it('should not detect regression within tolerance', () => {
      const result = gate.detectRegression(0.92, 0.95, 0.05);

      expect(result.detected).toBe(false);
      expect(result.amount).toBeCloseTo(0.03, 5);
    });

    it('should handle improvement as no regression', () => {
      const result = gate.detectRegression(0.97, 0.95, 0.05);

      expect(result.detected).toBe(false);
      expect(result.amount).toBe(0);
    });
  });

  describe('shouldBlock', () => {
    const thresholds: QualityThresholds = {
      minimum: 0.85,
      regression_tolerance: 0.05,
      blocking: true,
    };

    it('should block when score below minimum', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.80,
        scenarios_passed: 8,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const shouldBlock = gate.shouldBlock(report, thresholds);

      expect(shouldBlock).toBe(true);
    });

    it('should block on excessive regression', () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.88,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const baseline: EvalBaseline = {
        suite_name: 'Test Suite',
        suite_version: '1.0.0',
        score: 0.95,
        timestamp: new Date(),
      };

      const shouldBlock = gate.shouldBlock(report, thresholds, baseline);

      expect(shouldBlock).toBe(true);
    });

    it('should not block when blocking disabled', () => {
      const nonBlockingThresholds: QualityThresholds = {
        ...thresholds,
        blocking: false,
      };

      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.80,
        scenarios_passed: 8,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const shouldBlock = gate.shouldBlock(report, nonBlockingThresholds);

      expect(shouldBlock).toBe(false);
    });
  });

  describe('generateSummary', () => {
    it('should generate passed summary', () => {
      const result = {
        passed: true,
        blocked: false,
        status: 'passed' as const,
        failures: [],
        warnings: [],
        recommendations: [],
      };

      const summary = gate.generateSummary(result);

      expect(summary).toContain('passed');
    });

    it('should generate warning summary', () => {
      const result = {
        passed: true,
        blocked: false,
        status: 'warning' as const,
        failures: [],
        warnings: ['Warning 1'],
        recommendations: [],
      };

      const summary = gate.generateSummary(result);

      expect(summary).toContain('warning');
    });

    it('should generate blocked summary', () => {
      const result = {
        passed: false,
        blocked: true,
        status: 'blocked' as const,
        failures: ['Failure 1'],
        warnings: [],
        recommendations: [],
      };

      const summary = gate.generateSummary(result);

      expect(summary).toContain('BLOCKED');
    });

    it('should generate failed summary', () => {
      const result = {
        passed: false,
        blocked: false,
        status: 'failed' as const,
        failures: ['Failure 1'],
        warnings: [],
        recommendations: [],
      };

      const summary = gate.generateSummary(result);

      expect(summary).toContain('failed');
    });
  });
});

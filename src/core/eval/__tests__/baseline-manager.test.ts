import { promises as fs } from 'fs';
import path from 'path';
import { BaselineManager } from '../baseline-manager';
import { EvalReport } from '../types';

describe('BaselineManager', () => {
  const testDir = path.join(__dirname, '.test-baselines');
  let manager: BaselineManager;

  beforeEach(async () => {
    manager = new BaselineManager(testDir);
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore errors
    }
  });

  describe('saveBaseline', () => {
    it('should save baseline from report', async () => {
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.95,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [
          {
            scenario_name: 'Test 1',
            passed: true,
            score: 1.0,
            duration_ms: 100,
          },
        ],
        blocked: false,
        quality_gate_status: 'passed',
      };

      await manager.saveBaseline(report);

      const baseline = await manager.loadBaseline('Test Suite');

      expect(baseline).toBeDefined();
      expect(baseline?.score).toBe(0.95);
      expect(baseline?.suite_name).toBe('Test Suite');
    });

    it('should create baseline directory if not exists', async () => {
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

      await manager.saveBaseline(report);

      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('loadBaseline', () => {
    it('should load existing baseline', async () => {
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

      await manager.saveBaseline(report);
      const baseline = await manager.loadBaseline('Test Suite');

      expect(baseline).toBeDefined();
      expect(baseline?.score).toBe(0.92);
    });

    it('should return null for non-existent baseline', async () => {
      const baseline = await manager.loadBaseline('Non Existent');

      expect(baseline).toBeNull();
    });

    it('should parse timestamp correctly', async () => {
      const now = new Date();
      const report: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: now,
        total_score: 0.90,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      await manager.saveBaseline(report);
      const baseline = await manager.loadBaseline('Test Suite');

      expect(baseline?.timestamp).toBeInstanceOf(Date);
      expect(baseline?.timestamp.getTime()).toBeCloseTo(now.getTime(), -2);
    });
  });

  describe('updateBaseline', () => {
    it('should update baseline when score improves', async () => {
      const report1: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.90,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      await manager.saveBaseline(report1);

      const report2: EvalReport = {
        ...report1,
        total_score: 0.95,
      };

      const updated = await manager.updateBaseline(report2);

      expect(updated).toBe(true);

      const baseline = await manager.loadBaseline('Test Suite');
      expect(baseline?.score).toBe(0.95);
    });

    it('should not update baseline when score decreases', async () => {
      const report1: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.95,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      await manager.saveBaseline(report1);

      const report2: EvalReport = {
        ...report1,
        total_score: 0.90,
      };

      const updated = await manager.updateBaseline(report2);

      expect(updated).toBe(false);

      const baseline = await manager.loadBaseline('Test Suite');
      expect(baseline?.score).toBe(0.95);
    });

    it('should update baseline when forced', async () => {
      const report1: EvalReport = {
        suite_name: 'Test Suite',
        timestamp: new Date(),
        total_score: 0.95,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      await manager.saveBaseline(report1);

      const report2: EvalReport = {
        ...report1,
        total_score: 0.90,
      };

      const updated = await manager.updateBaseline(report2, undefined, true);

      expect(updated).toBe(true);

      const baseline = await manager.loadBaseline('Test Suite');
      expect(baseline?.score).toBe(0.90);
    });

    it('should create baseline if none exists', async () => {
      const report: EvalReport = {
        suite_name: 'New Suite',
        timestamp: new Date(),
        total_score: 0.90,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const updated = await manager.updateBaseline(report);

      expect(updated).toBe(true);

      const baseline = await manager.loadBaseline('New Suite');
      expect(baseline?.score).toBe(0.90);
    });
  });

  describe('deleteBaseline', () => {
    it('should delete existing baseline', async () => {
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

      await manager.saveBaseline(report);
      const deleted = await manager.deleteBaseline('Test Suite');

      expect(deleted).toBe(true);

      const baseline = await manager.loadBaseline('Test Suite');
      expect(baseline).toBeNull();
    });

    it('should return false for non-existent baseline', async () => {
      const deleted = await manager.deleteBaseline('Non Existent');

      expect(deleted).toBe(false);
    });
  });

  describe('listBaselines', () => {
    it('should list all baselines', async () => {
      const report1: EvalReport = {
        suite_name: 'Suite 1',
        timestamp: new Date(),
        total_score: 0.90,
        scenarios_passed: 9,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      const report2: EvalReport = {
        suite_name: 'Suite 2',
        timestamp: new Date(),
        total_score: 0.85,
        scenarios_passed: 8,
        scenarios_total: 10,
        results: [],
        blocked: false,
        quality_gate_status: 'passed',
      };

      await manager.saveBaseline(report1);
      await manager.saveBaseline(report2);

      const baselines = await manager.listBaselines();

      expect(baselines).toHaveLength(2);
      expect(baselines).toContain('suite-1');
      expect(baselines).toContain('suite-2');
    });

    it('should return empty array when no baselines exist', async () => {
      const baselines = await manager.listBaselines();

      expect(baselines).toEqual([]);
    });
  });
});

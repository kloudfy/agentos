/**
 * Quality Checker
 * 
 * Runs eval harness and compares results to baseline.
 */

import { EvalHarness } from '../../core/eval/eval-harness';
import { BaselineManager } from '../../core/eval/baseline-manager';
import { QualityGate } from '../../core/eval/quality-gate';
import { EvalScenario, EvalResult } from '../../core/eval/types';

/**
 * Quality check result.
 */
export interface QualityCheckResult {
  readonly passed: boolean;
  readonly score: number;
  readonly baselineScore: number;
  readonly drop: number;
  readonly message: string;
  readonly details: {
    readonly scenariosRun: number;
    readonly scenariosPassed: number;
    readonly scenariosFailed: number;
  };
}

/**
 * Quality checker using eval harness.
 */
export class QualityChecker {
  private readonly harness: EvalHarness;
  private readonly baseline: BaselineManager;
  private readonly gate: QualityGate;

  /**
   * Creates a new quality checker.
   */
  constructor(baselinePath: string, threshold: number, maxDrop: number) {
    this.harness = new EvalHarness();
    this.baseline = new BaselineManager(baselinePath);
    this.gate = new QualityGate();
  }

  /**
   * Runs quality check on scenarios.
   */
  async runCheck(scenarios: EvalScenario[]): Promise<QualityCheckResult> {
    console.log(`🔍 Running quality check on ${scenarios.length} scenarios...`);

    // Run eval harness - create a suite
    const suite: import('../../core/eval/types').EvalSuite = {
      name: 'Quality Check',
      version: '1.0.0',
      description: 'CI/CD quality check',
      scenarios,
      quality_thresholds: {
        minimum: 0.7,
        warning: 0.8,
        regression_tolerance: 0.05,
        blocking: true,
      },
    };
    const report = await this.harness.run(suite);
    const results = [...report.results];

    // Calculate score
    const score = this.calculateScore(results);
    
    // Get baseline score
    const baselineScore = await this.getBaselineScore();

    // Calculate drop
    const drop = baselineScore > 0 
      ? ((baselineScore - score) / baselineScore) * 100 
      : 0;

    // Check if passed
    const gateResult = this.gate.checkQuality(report, suite.quality_thresholds);
    const passed = gateResult.passed;

    // Count results
    const scenariosPassed = results.filter(r => r.passed).length;
    const scenariosFailed = results.length - scenariosPassed;

    // Generate message
    const message = this.generateMessage(passed, score, baselineScore, drop);

    return {
      passed,
      score,
      baselineScore,
      drop,
      message,
      details: {
        scenariosRun: results.length,
        scenariosPassed,
        scenariosFailed,
      },
    };
  }

  /**
   * Calculates overall score from results.
   */
  private calculateScore(results: EvalResult[]): number {
    if (results.length === 0) {
      return 0;
    }

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    return totalScore / results.length;
  }

  /**
   * Gets baseline score.
   */
  private async getBaselineScore(): Promise<number> {
    try {
      const baseline = await this.baseline.loadBaseline('Quality Check');
      return baseline?.score || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Generates result message.
   */
  private generateMessage(
    passed: boolean,
    score: number,
    baselineScore: number,
    drop: number
  ): string {
    const scorePercent = (score * 100).toFixed(1);
    const baselinePercent = (baselineScore * 100).toFixed(1);

    if (passed) {
      if (drop > 0) {
        return `✅ Quality check passed. Score: ${scorePercent}% (baseline: ${baselinePercent}%, drop: ${drop.toFixed(1)}%)`;
      } else {
        return `✅ Quality check passed. Score: ${scorePercent}% (baseline: ${baselinePercent}%)`;
      }
    } else {
      return `❌ Quality check failed. Score: ${scorePercent}% (baseline: ${baselinePercent}%, drop: ${drop.toFixed(1)}%)`;
    }
  }
}

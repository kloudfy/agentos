/**
 * Quality Gate
 * 
 * Evaluates quality metrics against thresholds and determines
 * whether quality gates pass or fail.
 */

import { EvalReport, EvalBaseline, QualityThresholds } from './types';

/**
 * Result of quality gate evaluation.
 */
export interface QualityGateResult {
  /** Whether quality gates passed */
  readonly passed: boolean;
  
  /** Whether operation should be blocked */
  readonly blocked: boolean;
  
  /** Overall status */
  readonly status: 'passed' | 'warning' | 'failed' | 'blocked';
  
  /** Reasons for failure (if any) */
  readonly failures: readonly string[];
  
  /** Warnings (if any) */
  readonly warnings: readonly string[];
  
  /** Recommendations for improvement */
  readonly recommendations: readonly string[];
}

/**
 * Evaluates quality gates and determines pass/fail status.
 */
export class QualityGate {
  /**
   * Checks quality against thresholds and baseline.
   * 
   * @param report - Evaluation report to check
   * @param thresholds - Quality thresholds to enforce
   * @param baseline - Optional baseline for regression detection
   * @returns Quality gate result
   * 
   * @example
   * ```typescript
   * const gate = new QualityGate();
   * const result = gate.checkQuality(report, thresholds, baseline);
   * 
   * if (result.blocked) {
   *   console.error('Quality gates failed!');
   *   process.exit(1);
   * }
   * ```
   */
  checkQuality(
    report: EvalReport,
    thresholds: QualityThresholds,
    baseline?: EvalBaseline
  ): QualityGateResult {
    const failures: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check minimum threshold
    if (report.total_score < thresholds.minimum) {
      failures.push(
        `Score ${(report.total_score * 100).toFixed(1)}% below minimum ${(thresholds.minimum * 100).toFixed(1)}%`
      );
      recommendations.push('Improve failing scenarios to meet minimum quality threshold');
    }

    // Check warning threshold
    if (thresholds.warning && report.total_score < thresholds.warning) {
      warnings.push(
        `Score ${(report.total_score * 100).toFixed(1)}% below warning threshold ${(thresholds.warning * 100).toFixed(1)}%`
      );
    }

    // Check regression
    if (baseline) {
      const regression = this.detectRegression(
        report.total_score,
        baseline.score,
        thresholds.regression_tolerance
      );

      if (regression.detected) {
        failures.push(
          `Regression detected: ${(regression.amount * 100).toFixed(1)}% drop (max allowed: ${(thresholds.regression_tolerance * 100).toFixed(1)}%)`
        );
        recommendations.push('Review recent changes that may have impacted quality');
      }
    }

    // Check scenario pass rate
    const passRate = report.scenarios_passed / report.scenarios_total;
    if (passRate < 0.9) {
      warnings.push(
        `Only ${report.scenarios_passed}/${report.scenarios_total} scenarios passed (${(passRate * 100).toFixed(1)}%)`
      );
      recommendations.push('Fix failing scenarios to improve overall quality');
    }

    // Determine status
    const passed = failures.length === 0;
    const blocked = !passed && thresholds.blocking;
    
    let status: 'passed' | 'warning' | 'failed' | 'blocked';
    if (blocked) {
      status = 'blocked';
    } else if (!passed) {
      status = 'failed';
    } else if (warnings.length > 0) {
      status = 'warning';
    } else {
      status = 'passed';
    }

    return {
      passed,
      blocked,
      status,
      failures,
      warnings,
      recommendations,
    };
  }

  /**
   * Detects regression by comparing current score to baseline.
   * 
   * @param current - Current score
   * @param baseline - Baseline score
   * @param tolerance - Maximum allowed regression
   * @returns Regression detection result
   */
  detectRegression(
    current: number,
    baseline: number,
    tolerance: number
  ): { detected: boolean; amount: number } {
    const regression = baseline - current;
    const detected = regression > tolerance;

    return {
      detected,
      amount: Math.max(0, regression),
    };
  }

  /**
   * Determines if operation should be blocked based on quality gates.
   * 
   * @param report - Evaluation report
   * @param thresholds - Quality thresholds
   * @param baseline - Optional baseline
   * @returns True if operation should be blocked
   */
  shouldBlock(
    report: EvalReport,
    thresholds: QualityThresholds,
    baseline?: EvalBaseline
  ): boolean {
    if (!thresholds.blocking) {
      return false;
    }

    // Block if below minimum
    if (report.total_score < thresholds.minimum) {
      return true;
    }

    // Block if regression exceeds tolerance
    if (baseline) {
      const regression = this.detectRegression(
        report.total_score,
        baseline.score,
        thresholds.regression_tolerance
      );

      if (regression.detected) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generates summary message for quality gate result.
   * 
   * @param result - Quality gate result
   * @returns Human-readable summary
   */
  generateSummary(result: QualityGateResult): string {
    if (result.status === 'passed') {
      return '✓ All quality gates passed';
    }

    if (result.status === 'warning') {
      return `⚠ Quality gates passed with ${result.warnings.length} warning(s)`;
    }

    if (result.status === 'blocked') {
      return `✗ Quality gates BLOCKED: ${result.failures.join(', ')}`;
    }

    return `✗ Quality gates failed: ${result.failures.join(', ')}`;
  }
}

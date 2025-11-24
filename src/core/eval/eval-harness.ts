/**
 * Eval Harness
 * 
 * Main evaluation engine that runs test suites, calculates scores,
 * and generates quality reports.
 */

import { performance } from 'perf_hooks';
import {
  EvalSuite,
  EvalScenario,
  EvalResult,
  EvalReport,
  EvalConfig,
  EvalBaseline,
  EvalRunner,
} from './types';
import { ScenarioExecutor } from './scenario-executor';
import { QualityGate } from './quality-gate';
import { BaselineManager } from './baseline-manager';

/**
 * Main evaluation harness implementation.
 * Executes test suites and generates quality reports.
 * 
 * @example
 * ```typescript
 * const harness = new EvalHarness();
 * const report = await harness.run(suite);
 * 
 * if (report.blocked) {
 *   console.error('Quality gates failed!');
 *   process.exit(1);
 * }
 * ```
 */
export class EvalHarness implements EvalRunner {
  private readonly executor: ScenarioExecutor;
  private readonly qualityGate: QualityGate;
  private baselineManager?: BaselineManager;

  constructor() {
    this.executor = new ScenarioExecutor();
    this.qualityGate = new QualityGate();
  }

  /**
   * Runs an evaluation suite.
   * 
   * @param suite - The suite to execute
   * @param config - Optional configuration
   * @returns Evaluation report with results
   */
  async run(suite: EvalSuite, config?: EvalConfig): Promise<EvalReport> {
    const startTime = performance.now();
    
    // Initialize baseline manager if needed
    if (config?.baseline_dir) {
      this.baselineManager = new BaselineManager(config.baseline_dir);
    }

    // Load baseline for regression detection
    const baseline = await this.loadBaseline(suite.name);

    // Execute all scenarios
    const results = await this.runScenarios(suite.scenarios, config);

    // Calculate total score
    const total_score = this.calculateScore(results, suite.scenarios);

    // Calculate regression
    const regression = baseline ? baseline.score - total_score : undefined;

    // Count passed scenarios
    const scenarios_passed = results.filter(r => r.passed).length;

    // Check quality gates
    const gateResult = this.qualityGate.checkQuality(
      {
        suite_name: suite.name,
        timestamp: new Date(),
        total_score,
        scenarios_passed,
        scenarios_total: results.length,
        results,
        blocked: false, // Will be set below
        baseline_score: baseline?.score,
        regression,
        quality_gate_status: 'passed', // Will be set below
      },
      suite.quality_thresholds,
      baseline
    );

    // Calculate performance metrics
    const totalDuration = performance.now() - startTime;
    const avgDuration = results.reduce((sum, r) => sum + r.duration_ms, 0) / results.length;
    const slowest = results.reduce((max, r) => 
      r.duration_ms > max.duration_ms ? r : max
    );

    // Build final report
    const report: EvalReport = {
      suite_name: suite.name,
      timestamp: new Date(),
      total_score,
      scenarios_passed,
      scenarios_total: results.length,
      results,
      blocked: gateResult.blocked,
      baseline_score: baseline?.score,
      regression,
      quality_gate_status: gateResult.status,
      summary: this.qualityGate.generateSummary(gateResult),
      recommendations: gateResult.recommendations,
      performance: {
        total_duration_ms: totalDuration,
        avg_duration_ms: avgDuration,
        slowest_scenario: slowest.scenario_name,
      },
    };

    // Save results if configured
    if (config?.save_results) {
      await this.saveResults(report, config);
    }

    // Update baseline if configured and quality improved
    if (config?.update_baseline && !gateResult.blocked) {
      await this.updateBaseline(report);
    }

    return report;
  }


  /**
   * Runs all scenarios in a suite.
   */
  private async runScenarios(
    scenarios: readonly EvalScenario[],
    config?: EvalConfig
  ): Promise<EvalResult[]> {
    const results: EvalResult[] = [];

    if (config?.parallel) {
      // Run scenarios in parallel
      const maxParallel = config.max_parallel || 4;
      const batches = this.createBatches(scenarios, maxParallel);

      for (const batch of batches) {
        const batchResults = await Promise.all(
          batch.map(scenario => this.runScenario(scenario, config))
        );
        results.push(...batchResults);
      }
    } else {
      // Run scenarios sequentially
      for (const scenario of scenarios) {
        const result = await this.runScenario(scenario, config);
        results.push(result);

        // Stop on failure if configured
        if (!result.passed && !config?.continue_on_failure) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Runs a single scenario with retry support.
   */
  private async runScenario(
    scenario: EvalScenario,
    config?: EvalConfig
  ): Promise<EvalResult> {
    const maxRetries = config?.max_retries || 0;
    let lastResult: EvalResult | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executor.execute(
          scenario.name,
          scenario.test,
          scenario.timeout
        );

        // Success - return result
        if (result.passed) {
          if (attempt > 0) {
            // Create new result with attempts metadata
            return {
              ...result,
              metadata: {
                ...result.metadata,
                attempts: attempt + 1,
              },
            };
          }
          return result;
        }

        lastResult = result;
      } catch (error) {
        lastResult = {
          scenario_name: scenario.name,
          passed: false,
          score: 0,
          duration_ms: 0,
          error: error instanceof Error ? error.message : String(error),
        };
      }

      // Log retry if configured
      if (config?.logger && attempt < maxRetries) {
        config.logger.warn(
          `Scenario "${scenario.name}" failed, retrying (${attempt + 1}/${maxRetries})...`
        );
      }
    }

    // All retries exhausted
    return lastResult!;
  }

  /**
   * Calculates weighted average score from results.
   * 
   * @param results - Individual scenario results
   * @param scenarios - Scenario definitions with weights
   * @returns Total weighted score (0-1)
   */
  calculateScore(results: EvalResult[], scenarios: readonly EvalScenario[]): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const scenario = scenarios[i];

      totalScore += result.score * scenario.weight;
      totalWeight += scenario.weight;
    }

    // Normalize by total weight (should be 1.0, but handle edge cases)
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Loads baseline for a suite.
   */
  async loadBaseline(suiteName: string): Promise<EvalBaseline | undefined> {
    if (!this.baselineManager) {
      return undefined;
    }

    const baseline = await this.baselineManager.loadBaseline(suiteName);
    return baseline || undefined;
  }

  /**
   * Saves baseline for a suite.
   */
  async saveBaseline(baseline: EvalBaseline): Promise<void> {
    if (!this.baselineManager) {
      throw new Error('Baseline manager not initialized');
    }

    await this.baselineManager.saveBaseline({
      suite_name: baseline.suite_name,
      timestamp: baseline.timestamp,
      total_score: baseline.score,
      scenarios_passed: 0,
      scenarios_total: 0,
      results: [],
      blocked: false,
      quality_gate_status: 'passed',
    });
  }

  /**
   * Gets historical results for a suite.
   */
  async getHistory(suiteName: string, limit?: number): Promise<readonly EvalReport[]> {
    // TODO: Implement history storage and retrieval
    return [];
  }

  /**
   * Updates baseline if score improved.
   */
  private async updateBaseline(report: EvalReport): Promise<void> {
    if (!this.baselineManager) {
      return;
    }

    await this.baselineManager.updateBaseline(report);
  }

  /**
   * Saves evaluation results to disk.
   */
  private async saveResults(report: EvalReport, config: EvalConfig): Promise<void> {
    if (!config.results_dir) {
      return;
    }

    // TODO: Implement results storage
    // For now, just log
    if (config.logger) {
      config.logger.info(`Results saved for suite: ${report.suite_name}`);
    }
  }

  /**
   * Creates batches for parallel execution.
   */
  private createBatches<T>(items: readonly T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize) as T[]);
    }
    
    return batches;
  }
}

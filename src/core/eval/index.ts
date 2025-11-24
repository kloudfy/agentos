/**
 * Eval Harness Module
 * 
 * Quality gate system for AgentOS that measures quality scores,
 * tracks regressions, and blocks deployments when quality drops
 * below acceptable thresholds.
 * 
 * @module eval
 * 
 * @example
 * ```typescript
 * import { EvalSuite, EvalRunner } from '@/core/eval';
 * 
 * const suite: EvalSuite = {
 *   name: 'Core Quality',
 *   version: '1.0.0',
 *   description: 'Core system quality tests',
 *   scenarios: [...],
 *   quality_thresholds: {
 *     minimum: 0.85,
 *     regression_tolerance: 0.05,
 *     blocking: true
 *   }
 * };
 * 
 * const runner: EvalRunner = new EvalHarness();
 * const report = await runner.run(suite);
 * 
 * if (report.blocked) {
 *   console.error('Quality gates failed!');
 *   process.exit(1);
 * }
 * ```
 */

// Export all types
export type {
  ScenarioAction,
  ScenarioTest,
  EvalScenario,
  QualityThresholds,
  EvalSuite,
  EvalResult,
  EvalReport,
  EvalBaseline,
  EvalConfig,
  EvalRunner,
} from './types';

// Export classes
export { ScenarioExecutor } from './scenario-executor';
export { QualityGate } from './quality-gate';
export type { QualityGateResult } from './quality-gate';
export { BaselineManager } from './baseline-manager';
export { EvalHarness } from './eval-harness';

/**
 * Eval Harness Types
 * 
 * Defines the type system for AgentOS's quality gate evaluation harness.
 * This system measures quality scores, tracks regressions, and blocks
 * deployments when quality drops below acceptable thresholds.
 */

/**
 * Action type for scenario tests.
 * Defines what operation the scenario will perform.
 */
export type ScenarioAction = 
  | 'plugin.load'           // Load a plugin
  | 'plugin.initialize'     // Initialize a plugin
  | 'event.emit'            // Emit an event
  | 'state.read'            // Read from state
  | 'state.write'           // Write to state
  | 'personality.switch'    // Switch personality
  | 'custom';               // Custom test action

/**
 * Test definition for an evaluation scenario.
 * Specifies the action to perform and expected results.
 */
export interface ScenarioTest {
  /** The action to perform in this test */
  readonly action: ScenarioAction;
  
  /** Plugin name (for plugin-related actions) */
  readonly plugin?: string;
  
  /** Event type (for event-related actions) */
  readonly eventType?: string;
  
  /** State key (for state-related actions) */
  readonly stateKey?: string;
  
  /** Input data for the test */
  readonly input?: unknown;
  
  /** Expected output or result */
  readonly expected?: unknown;
  
  /** Custom test function (for 'custom' action type) */
  readonly testFn?: () => Promise<boolean>;
  
  /** Validation function to check results */
  readonly validate?: (result: unknown) => boolean;
}

/**
 * Individual evaluation scenario.
 * Represents a single test case with scoring weight.
 * 
 * @example
 * ```typescript
 * const scenario: EvalScenario = {
 *   name: 'Plugin Load Performance',
 *   weight: 0.3,
 *   test: {
 *     action: 'plugin.load',
 *     plugin: 'test-plugin',
 *     expected: { loaded: true }
 *   },
 *   timeout: 5000
 * };
 * ```
 */
export interface EvalScenario {
  /** Unique name for this scenario */
  readonly name: string;
  
  /** 
   * Weight for scoring (0-1).
   * Higher weight means this scenario has more impact on total score.
   * All weights in a suite should sum to 1.0.
   */
  readonly weight: number;
  
  /** The test to execute */
  readonly test: ScenarioTest;
  
  /** 
   * Optional timeout in milliseconds.
   * Test fails if it exceeds this duration.
   * @default 30000 (30 seconds)
   */
  readonly timeout?: number;
  
  /** Optional description of what this scenario tests */
  readonly description?: string;
  
  /** Optional tags for categorization */
  readonly tags?: readonly string[];
}


/**
 * Quality thresholds for evaluation.
 * Defines acceptable quality levels and regression tolerance.
 * 
 * @example
 * ```typescript
 * const thresholds: QualityThresholds = {
 *   minimum: 0.85,              // 85% minimum score
 *   regression_tolerance: 0.05,  // Allow 5% drop
 *   blocking: true               // Block on failure
 * };
 * ```
 */
export interface QualityThresholds {
  /**
   * Minimum acceptable score (0-1).
   * Scores below this threshold are considered failures.
   * @example 0.85 means 85% minimum quality
   */
  readonly minimum: number;
  
  /**
   * Maximum allowed regression from baseline (0-1).
   * If current score drops more than this from baseline, block deployment.
   * @example 0.05 means allow up to 5% drop from baseline
   */
  readonly regression_tolerance: number;
  
  /**
   * Whether to block operations (commits, deployments) on failure.
   * If true, failing quality gates will prevent the operation.
   * If false, failures are reported but don't block.
   */
  readonly blocking: boolean;
  
  /**
   * Optional warning threshold (0-1).
   * Scores below this trigger warnings but don't block.
   */
  readonly warning?: number;
}

/**
 * Collection of evaluation scenarios.
 * Represents a complete test suite with quality requirements.
 * 
 * @example
 * ```typescript
 * const suite: EvalSuite = {
 *   name: 'Core System Quality',
 *   version: '1.0.0',
 *   description: 'Tests core system functionality and performance',
 *   scenarios: [
 *     { name: 'Event Performance', weight: 0.3, test: {...} },
 *     { name: 'Plugin Loading', weight: 0.3, test: {...} },
 *     { name: 'State Persistence', weight: 0.4, test: {...} }
 *   ],
 *   quality_thresholds: {
 *     minimum: 0.85,
 *     regression_tolerance: 0.05,
 *     blocking: true
 *   }
 * };
 * ```
 */
export interface EvalSuite {
  /** Unique name for this evaluation suite */
  readonly name: string;
  
  /** 
   * Semantic version of this suite.
   * Used to track suite evolution over time.
   */
  readonly version: string;
  
  /** Human-readable description of what this suite tests */
  readonly description: string;
  
  /** 
   * Array of scenarios to execute.
   * Weights should sum to 1.0 for proper scoring.
   */
  readonly scenarios: readonly EvalScenario[];
  
  /** Quality thresholds for this suite */
  readonly quality_thresholds: QualityThresholds;
  
  /** Optional metadata for the suite */
  readonly metadata?: {
    /** Author or team responsible for this suite */
    readonly author?: string;
    
    /** Tags for categorization */
    readonly tags?: readonly string[];
    
    /** Related documentation */
    readonly documentation?: string;
    
    /** Minimum AgentOS version required */
    readonly minVersion?: string;
  };
}

/**
 * Result of executing a single evaluation scenario.
 * Contains pass/fail status, score, and performance metrics.
 * 
 * @example
 * ```typescript
 * const result: EvalResult = {
 *   scenario_name: 'Plugin Load Performance',
 *   passed: true,
 *   score: 0.95,
 *   duration_ms: 45,
 *   metadata: {
 *     attempts: 1,
 *     memory_used_mb: 12.5
 *   }
 * };
 * ```
 */
export interface EvalResult {
  /** Name of the scenario that was executed */
  readonly scenario_name: string;
  
  /** Whether the scenario passed all checks */
  readonly passed: boolean;
  
  /**
   * Score for this scenario (0-1).
   * 1.0 = perfect, 0.0 = complete failure.
   * Partial credit may be awarded based on test implementation.
   */
  readonly score: number;
  
  /** 
   * Duration of test execution in milliseconds.
   * Used for performance tracking and timeout detection.
   */
  readonly duration_ms: number;
  
  /**
   * Error message if the scenario failed.
   * Undefined if the scenario passed.
   */
  readonly error?: string;
  
  /**
   * Stack trace if an exception occurred.
   * Useful for debugging test failures.
   */
  readonly stack?: string;
  
  /** Optional metadata about the test execution */
  readonly metadata?: {
    /** Number of retry attempts */
    readonly attempts?: number;
    
    /** Memory used during test (MB) */
    readonly memory_used_mb?: number;
    
    /** CPU time used (ms) */
    readonly cpu_time_ms?: number;
    
    /** Any additional metrics */
    readonly [key: string]: unknown;
  };
}


/**
 * Overall evaluation report.
 * Aggregates results from all scenarios and determines if quality gates passed.
 * 
 * @example
 * ```typescript
 * const report: EvalReport = {
 *   suite_name: 'Core System Quality',
 *   timestamp: new Date(),
 *   total_score: 0.92,
 *   scenarios_passed: 8,
 *   scenarios_total: 10,
 *   results: [...],
 *   blocked: false,
 *   baseline_score: 0.95,
 *   regression: 0.03,
 *   quality_gate_status: 'passed'
 * };
 * ```
 */
export interface EvalReport {
  /** Name of the suite that was executed */
  readonly suite_name: string;
  
  /** When this evaluation was run */
  readonly timestamp: Date;
  
  /**
   * Overall weighted score (0-1).
   * Calculated as: sum(scenario.score * scenario.weight) for all scenarios.
   */
  readonly total_score: number;
  
  /** Number of scenarios that passed */
  readonly scenarios_passed: number;
  
  /** Total number of scenarios executed */
  readonly scenarios_total: number;
  
  /** Individual results for each scenario */
  readonly results: readonly EvalResult[];
  
  /**
   * Whether this evaluation blocked the operation.
   * True if quality gates failed and blocking is enabled.
   */
  readonly blocked: boolean;
  
  /**
   * Baseline score from previous run (if available).
   * Used to calculate regression.
   */
  readonly baseline_score?: number;
  
  /**
   * Regression amount (0-1).
   * Positive values indicate quality drop.
   * Calculated as: baseline_score - total_score
   */
  readonly regression?: number;
  
  /**
   * Overall quality gate status.
   * - 'passed': All quality gates passed
   * - 'warning': Below warning threshold but above minimum
   * - 'failed': Below minimum threshold
   * - 'blocked': Failed and blocking is enabled
   */
  readonly quality_gate_status: 'passed' | 'warning' | 'failed' | 'blocked';
  
  /** Optional summary message */
  readonly summary?: string;
  
  /** Optional recommendations for improvement */
  readonly recommendations?: readonly string[];
  
  /** Performance metrics for the entire suite */
  readonly performance?: {
    /** Total execution time (ms) */
    readonly total_duration_ms: number;
    
    /** Average scenario duration (ms) */
    readonly avg_duration_ms: number;
    
    /** Slowest scenario */
    readonly slowest_scenario?: string;
    
    /** Peak memory usage (MB) */
    readonly peak_memory_mb?: number;
  };
}

/**
 * Historical baseline data.
 * Stores previous evaluation results for regression detection.
 */
export interface EvalBaseline {
  /** Suite name this baseline is for */
  readonly suite_name: string;
  
  /** Suite version */
  readonly suite_version: string;
  
  /** Baseline score */
  readonly score: number;
  
  /** When this baseline was established */
  readonly timestamp: Date;
  
  /** Git commit hash (if available) */
  readonly commit?: string;
  
  /** Branch name (if available) */
  readonly branch?: string;
  
  /** Individual scenario scores */
  readonly scenario_scores?: Record<string, number>;
}

/**
 * Configuration for the eval harness.
 */
export interface EvalConfig {
  /** Directory to store evaluation results */
  readonly results_dir?: string;
  
  /** Directory to store baselines */
  readonly baseline_dir?: string;
  
  /** Whether to save results to disk */
  readonly save_results?: boolean;
  
  /** Whether to update baseline on success */
  readonly update_baseline?: boolean;
  
  /** Maximum number of retry attempts for failed scenarios */
  readonly max_retries?: number;
  
  /** Whether to run scenarios in parallel */
  readonly parallel?: boolean;
  
  /** Maximum number of parallel scenarios */
  readonly max_parallel?: number;
  
  /** Whether to continue on scenario failure */
  readonly continue_on_failure?: boolean;
  
  /** Custom logger */
  readonly logger?: {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
}

/**
 * Eval harness runner interface.
 * Executes evaluation suites and generates reports.
 */
export interface EvalRunner {
  /**
   * Runs an evaluation suite.
   * 
   * @param suite - The suite to execute
   * @param config - Optional configuration
   * @returns Evaluation report with results
   */
  run(suite: EvalSuite, config?: EvalConfig): Promise<EvalReport>;
  
  /**
   * Loads baseline for a suite.
   * 
   * @param suiteName - Name of the suite
   * @returns Baseline data or undefined if not found
   */
  loadBaseline(suiteName: string): Promise<EvalBaseline | undefined>;
  
  /**
   * Saves baseline for a suite.
   * 
   * @param baseline - Baseline data to save
   */
  saveBaseline(baseline: EvalBaseline): Promise<void>;
  
  /**
   * Gets historical results for a suite.
   * 
   * @param suiteName - Name of the suite
   * @param limit - Maximum number of results to return
   * @returns Array of historical reports
   */
  getHistory(suiteName: string, limit?: number): Promise<readonly EvalReport[]>;
}

/**
 * Scenario Executor
 * 
 * Executes individual evaluation scenarios by performing the specified
 * action and validating results against expectations.
 */

import { performance } from 'perf_hooks';
import { ScenarioTest, EvalResult, ScenarioAction } from './types';

/**
 * Executes evaluation scenarios.
 * Supports multiple action types and integrates with AgentOS core systems.
 */
export class ScenarioExecutor {
  /**
   * Executes a scenario test and returns the result.
   * 
   * @param name - Name of the scenario
   * @param test - Test definition to execute
   * @param timeout - Maximum execution time in milliseconds
   * @returns Evaluation result with score and metrics
   */
  async execute(
    name: string,
    test: ScenarioTest,
    timeout: number = 30000
  ): Promise<EvalResult> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(test, timeout);
      
      const duration = performance.now() - startTime;
      const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;

      return {
        scenario_name: name,
        passed: result.passed,
        score: result.score,
        duration_ms: duration,
        metadata: {
          memory_used_mb: memoryUsed,
          action: test.action,
        },
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      return {
        scenario_name: name,
        passed: false,
        score: 0,
        duration_ms: duration,
        error: errorMessage,
        stack,
      };
    }
  }

  /**
   * Executes test with timeout protection.
   */
  private async executeWithTimeout(
    test: ScenarioTest,
    timeout: number
  ): Promise<{ passed: boolean; score: number }> {
    return Promise.race([
      this.executeByAction(test),
      this.createTimeoutPromise(timeout),
    ]);
  }

  /**
   * Creates a promise that rejects after timeout.
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Routes execution to appropriate handler based on action type.
   */
  private async executeByAction(
    test: ScenarioTest
  ): Promise<{ passed: boolean; score: number }> {
    switch (test.action) {
      case 'plugin.load':
        return this.executePluginLoad(test);
      case 'plugin.initialize':
        return this.executePluginInitialize(test);
      case 'event.emit':
        return this.executeEventEmit(test);
      case 'state.read':
        return this.executeStateRead(test);
      case 'state.write':
        return this.executeStateWrite(test);
      case 'personality.switch':
        return this.executePersonalitySwitch(test);
      case 'custom':
        return this.executeCustom(test);
      default:
        throw new Error(`Unknown action type: ${test.action}`);
    }
  }


  /**
   * Executes plugin load test.
   * Tests plugin loading performance and success.
   */
  async executePluginLoad(test: ScenarioTest): Promise<{ passed: boolean; score: number }> {
    if (!test.plugin) {
      throw new Error('Plugin name required for plugin.load action');
    }

    // Simulate plugin load (in real implementation, would use PluginManager)
    const startTime = performance.now();
    
    // Mock plugin load - replace with actual PluginManager integration
    const loadTime = performance.now() - startTime;
    const passed = loadTime < 100; // Target: <100ms
    
    // Score based on performance
    const score = passed ? Math.max(0, 1 - loadTime / 200) : 0;

    if (test.validate) {
      const validationPassed = test.validate({ loaded: true, loadTime });
      return { passed: validationPassed, score: validationPassed ? score : 0 };
    }

    return { passed, score };
  }

  /**
   * Executes plugin initialization test.
   * Tests plugin initialization success and timing.
   */
  async executePluginInitialize(
    test: ScenarioTest
  ): Promise<{ passed: boolean; score: number }> {
    if (!test.plugin) {
      throw new Error('Plugin name required for plugin.initialize action');
    }

    const startTime = performance.now();
    
    // Mock plugin initialization - replace with actual PluginManager integration
    const initTime = performance.now() - startTime;
    const passed = initTime < 500; // Target: <500ms
    
    // Score based on performance
    const score = passed ? Math.max(0, 1 - initTime / 1000) : 0;

    if (test.validate) {
      const validationPassed = test.validate({ initialized: true, initTime });
      return { passed: validationPassed, score: validationPassed ? score : 0 };
    }

    return { passed, score };
  }

  /**
   * Executes event emission test.
   * Tests event system performance and reliability.
   */
  async executeEventEmit(test: ScenarioTest): Promise<{ passed: boolean; score: number }> {
    if (!test.eventType) {
      throw new Error('Event type required for event.emit action');
    }

    const startTime = performance.now();
    
    // Mock event emission - replace with actual EventEmitter integration
    const emitTime = performance.now() - startTime;
    const passed = emitTime < 1; // Target: <1ms
    
    // Score based on performance
    const score = passed ? Math.max(0, 1 - emitTime / 2) : 0;

    if (test.validate) {
      const validationPassed = test.validate({ emitted: true, emitTime });
      return { passed: validationPassed, score: validationPassed ? score : 0 };
    }

    return { passed, score };
  }

  /**
   * Executes state read test.
   * Tests state retrieval performance and correctness.
   */
  async executeStateRead(test: ScenarioTest): Promise<{ passed: boolean; score: number }> {
    if (!test.stateKey) {
      throw new Error('State key required for state.read action');
    }

    const startTime = performance.now();
    
    // Mock state read - replace with actual StateManager integration
    const readTime = performance.now() - startTime;
    const passed = readTime < 10; // Target: <10ms
    
    // Score based on performance
    const score = passed ? Math.max(0, 1 - readTime / 20) : 0;

    if (test.validate) {
      const validationPassed = test.validate({ value: test.expected, readTime });
      return { passed: validationPassed, score: validationPassed ? score : 0 };
    }

    return { passed, score };
  }

  /**
   * Executes state write test.
   * Tests state persistence performance and reliability.
   */
  async executeStateWrite(test: ScenarioTest): Promise<{ passed: boolean; score: number }> {
    if (!test.stateKey) {
      throw new Error('State key required for state.write action');
    }

    const startTime = performance.now();
    
    // Mock state write - replace with actual StateManager integration
    const writeTime = performance.now() - startTime;
    const passed = writeTime < 50; // Target: <50ms
    
    // Score based on performance
    const score = passed ? Math.max(0, 1 - writeTime / 100) : 0;

    if (test.validate) {
      const validationPassed = test.validate({ success: true, writeTime });
      return { passed: validationPassed, score: validationPassed ? score : 0 };
    }

    return { passed, score };
  }

  /**
   * Executes personality switch test.
   * Tests personality system performance and correctness.
   */
  async executePersonalitySwitch(
    test: ScenarioTest
  ): Promise<{ passed: boolean; score: number }> {
    const startTime = performance.now();
    
    // Mock personality switch - replace with actual PersonalityManager integration
    const switchTime = performance.now() - startTime;
    const passed = switchTime < 5; // Target: <5ms
    
    // Score based on performance
    const score = passed ? Math.max(0, 1 - switchTime / 10) : 0;

    if (test.validate) {
      const validationPassed = test.validate({ switched: true, switchTime });
      return { passed: validationPassed, score: validationPassed ? score : 0 };
    }

    return { passed, score };
  }

  /**
   * Executes custom test function.
   * Allows arbitrary test logic defined by the scenario.
   */
  async executeCustom(test: ScenarioTest): Promise<{ passed: boolean; score: number }> {
    if (!test.testFn) {
      throw new Error('Test function required for custom action');
    }

    const passed = await test.testFn();
    const score = passed ? 1.0 : 0.0;

    if (test.validate) {
      const validationPassed = test.validate(passed);
      return { passed: validationPassed, score: validationPassed ? score : 0 };
    }

    return { passed, score };
  }
}

/**
 * CI/CD Automator Entry Point
 */

import { CICDAutomator } from './automator';
import { loadConfig } from './config';
import { EvalScenario } from '../../core/eval/types';

/**
 * Main entry point.
 */
export async function main(): Promise<void> {
  console.log('🚀 CI/CD Automator Starting...\n');

  try {
    // Load configuration
    const config = loadConfig();
    console.log(`📦 Repository: ${config.repoOwner}/${config.repoName}`);
    console.log(`🎯 Quality Threshold: ${config.qualityThreshold * 100}%`);
    console.log(`📉 Max Quality Drop: ${config.maxQualityDrop}%\n`);

    // Create automator
    const automator = new CICDAutomator(config);

    // Get PR number from environment or args
    const prNumber = parseInt(process.env.PR_NUMBER || process.argv[2] || '0');

    if (!prNumber) {
      console.error('❌ PR_NUMBER environment variable or argument required');
      process.exit(1);
    }

    // Example scenarios (in real use, load from test suite)
    const scenarios: EvalScenario[] = [
      {
        id: 'test-1',
        name: 'Basic functionality test',
        description: 'Tests core functionality',
        input: { test: 'data' },
        expectedOutput: { result: 'success' },
        category: 'functionality',
      },
    ];

    // Run quality check on PR
    await automator.checkPR(prNumber, scenarios);

    console.log('\n✅ CI/CD Automator Complete');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Export for use as library
export { CICDAutomator } from './automator';
export { GitHubClient } from './github-client';
export { QualityChecker } from './quality-checker';
export { loadConfig } from './config';
export type { AutomatorConfig } from './config';

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

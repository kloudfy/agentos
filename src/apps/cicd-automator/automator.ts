/**
 * CI/CD Automator
 * 
 * Automates quality checks, ADR generation, and GitHub integration.
 */

import { GitHubClient } from './github-client';
import { QualityChecker } from './quality-checker';
import { AutomatorConfig } from './config';
import { ADRDetector } from '../../core/adr/adr-detector';
import { ADRGenerator } from '../../core/adr/adr-generator';
import { ADRManager } from '../../core/adr/adr-manager';
import { EvalScenario } from '../../core/eval/types';

/**
 * CI/CD Automator.
 * 
 * Integrates quality gates, ADR generation, and GitHub workflows.
 */
export class CICDAutomator {
  private readonly config: AutomatorConfig;
  private readonly github: GitHubClient;
  private readonly qualityChecker: QualityChecker;
  private readonly adrDetector: ADRDetector;
  private readonly adrGenerator: ADRGenerator;
  private readonly adrManager: ADRManager;

  /**
   * Creates a new CI/CD automator.
   */
  constructor(config: AutomatorConfig) {
    this.config = config;
    
    this.github = new GitHubClient(
      config.githubToken,
      config.repoOwner,
      config.repoName
    );

    this.qualityChecker = new QualityChecker(
      config.baselinePath,
      config.qualityThreshold,
      config.maxQualityDrop
    );

    this.adrDetector = new ADRDetector();
    this.adrGenerator = new ADRGenerator();
    this.adrManager = new ADRManager(config.adrDir);
  }

  /**
   * Runs quality check on a pull request.
   */
  async checkPR(prNumber: number, scenarios: EvalScenario[]): Promise<void> {
    console.log(`🔍 Checking PR #${prNumber}...`);

    try {
      // Get PR info
      const pr = await this.github.getPullRequest(prNumber);
      console.log(`📝 PR: ${pr.title}`);

      // Update status to pending
      await this.github.updateStatus(
        pr.head.sha,
        'pending',
        'Running quality checks...'
      );

      // Run quality check
      const result = await this.runQualityCheck(scenarios);

      // Update GitHub status
      const state = result.passed ? 'success' : 'failure';
      await this.github.updateStatus(pr.head.sha, state, result.message);

      // Post comment with details
      await this.postResultComment(prNumber, result);

      console.log(result.message);

    } catch (error) {
      console.error('❌ Error checking PR:', error);
      throw error;
    }
  }

  /**
   * Runs quality check.
   */
  async runQualityCheck(scenarios: EvalScenario[]): Promise<any> {
    return await this.qualityChecker.runCheck(scenarios);
  }

  /**
   * Generates ADR from code changes.
   */
  async generateADR(oldCode: string, newCode: string): Promise<string> {
    if (!this.config.enableADR) {
      console.log('⏭️  ADR generation disabled');
      return '';
    }

    console.log('📝 Generating ADR...');

    // Detect changes
    const changes = this.adrDetector.detectInterfaceChanges(oldCode, newCode);

    if (changes.length === 0) {
      console.log('ℹ️  No interface changes detected');
      return '';
    }

    console.log(`📊 Detected ${changes.length} changes`);

    // Analyze impact
    const impact = this.adrDetector.analyzeImpact(changes);
    console.log(`⚠️  Impact: ${impact.severity} (${impact.breakingChangesCount} breaking)`);

    // Generate ADR
    const number = await this.adrManager.getNextNumber();
    const adr = this.adrGenerator.generateFromChanges(changes, number, {
      author: 'CI/CD Automator',
      tags: ['automated', 'ci-cd'],
    });

    // Save ADR
    const filepath = await this.adrManager.saveADR(adr);
    console.log(`✅ ADR saved: ${filepath}`);

    return filepath;
  }

  /**
   * Posts result comment on PR.
   */
  private async postResultComment(prNumber: number, result: any): Promise<void> {
    const comment = this.formatResultComment(result);
    await this.github.postComment(prNumber, comment);
  }

  /**
   * Formats result as markdown comment.
   */
  private formatResultComment(result: any): string {
    const icon = result.passed ? '✅' : '❌';
    const status = result.passed ? 'PASSED' : 'FAILED';

    return `
## ${icon} Quality Check ${status}

**Score:** ${(result.score * 100).toFixed(1)}%
**Baseline:** ${(result.baselineScore * 100).toFixed(1)}%
**Drop:** ${result.drop.toFixed(1)}%

### Details

- Scenarios Run: ${result.details.scenariosRun}
- Passed: ${result.details.scenariosPassed}
- Failed: ${result.details.scenariosFailed}

${result.passed ? '✅ All quality gates passed!' : '❌ Quality gates failed. Please review and fix issues.'}
    `.trim();
  }
}

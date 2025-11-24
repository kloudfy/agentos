/**
 * Baseline Manager
 * 
 * Manages baseline scores for regression detection.
 * Saves and loads historical quality data.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { EvalReport, EvalBaseline } from './types';

/**
 * Manages baseline storage and retrieval.
 */
export class BaselineManager {
  private readonly baselineDir: string;

  /**
   * Creates a new BaselineManager.
   * 
   * @param baselineDir - Directory to store baseline files
   */
  constructor(baselineDir: string = '.kiro/eval/baselines') {
    this.baselineDir = baselineDir;
  }

  /**
   * Saves baseline from evaluation report.
   * 
   * @param report - Evaluation report to save as baseline
   * @param suiteName - Optional suite name (uses report.suite_name if not provided)
   * 
   * @example
   * ```typescript
   * const manager = new BaselineManager();
   * await manager.saveBaseline(report);
   * ```
   */
  async saveBaseline(report: EvalReport, suiteName?: string): Promise<void> {
    const name = suiteName || report.suite_name;
    const baseline: EvalBaseline = {
      suite_name: name,
      suite_version: '1.0.0', // TODO: Get from suite
      score: report.total_score,
      timestamp: report.timestamp,
      scenario_scores: this.extractScenarioScores(report),
    };

    await this.ensureBaselineDir();
    
    const filePath = this.getBaselinePath(name);
    const data = JSON.stringify(baseline, null, 2);
    
    await fs.writeFile(filePath, data, 'utf-8');
  }

  /**
   * Loads baseline for a suite.
   * 
   * @param suiteName - Name of the suite
   * @returns Baseline data or null if not found
   * 
   * @example
   * ```typescript
   * const manager = new BaselineManager();
   * const baseline = await manager.loadBaseline('Core Quality');
   * 
   * if (baseline) {
   *   console.log(`Baseline score: ${baseline.score}`);
   * }
   * ```
   */
  async loadBaseline(suiteName: string): Promise<EvalBaseline | null> {
    const filePath = this.getBaselinePath(suiteName);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Convert timestamp string back to Date and create new object
      const baseline: EvalBaseline = {
        ...parsed,
        timestamp: new Date(parsed.timestamp),
      };
      
      return baseline;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Updates baseline if current score is better or force update is requested.
   * 
   * @param report - Evaluation report
   * @param suiteName - Optional suite name
   * @param force - Force update even if score is lower
   * @returns True if baseline was updated
   * 
   * @example
   * ```typescript
   * const manager = new BaselineManager();
   * const updated = await manager.updateBaseline(report);
   * 
   * if (updated) {
   *   console.log('Baseline updated with new score');
   * }
   * ```
   */
  async updateBaseline(
    report: EvalReport,
    suiteName?: string,
    force: boolean = false
  ): Promise<boolean> {
    const name = suiteName || report.suite_name;
    const existing = await this.loadBaseline(name);

    // Always update if no baseline exists or force is true
    if (!existing || force) {
      await this.saveBaseline(report, name);
      return true;
    }

    // Update if score improved
    if (report.total_score > existing.score) {
      await this.saveBaseline(report, name);
      return true;
    }

    return false;
  }

  /**
   * Deletes baseline for a suite.
   * 
   * @param suiteName - Name of the suite
   * @returns True if baseline was deleted
   */
  async deleteBaseline(suiteName: string): Promise<boolean> {
    const filePath = this.getBaselinePath(suiteName);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Lists all available baselines.
   * 
   * @returns Array of suite names with baselines
   */
  async listBaselines(): Promise<string[]> {
    try {
      await this.ensureBaselineDir();
      const files = await fs.readdir(this.baselineDir);
      
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  /**
   * Gets baseline file path for a suite.
   */
  private getBaselinePath(suiteName: string): string {
    const filename = `${this.sanitizeName(suiteName)}.json`;
    return path.join(this.baselineDir, filename);
  }

  /**
   * Sanitizes suite name for use as filename.
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Ensures baseline directory exists.
   */
  private async ensureBaselineDir(): Promise<void> {
    try {
      await fs.mkdir(this.baselineDir, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Extracts scenario scores from report.
   */
  private extractScenarioScores(report: EvalReport): Record<string, number> {
    const scores: Record<string, number> = {};
    
    for (const result of report.results) {
      scores[result.scenario_name] = result.score;
    }
    
    return scores;
  }
}

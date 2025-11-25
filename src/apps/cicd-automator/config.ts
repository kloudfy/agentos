/**
 * CI/CD Automator Configuration
 */

/**
 * Automator configuration.
 */
export interface AutomatorConfig {
  /** GitHub personal access token */
  readonly githubToken: string;
  
  /** Repository owner */
  readonly repoOwner: string;
  
  /** Repository name */
  readonly repoName: string;
  
  /** Quality threshold (0-1) */
  readonly qualityThreshold: number;
  
  /** Maximum quality drop percentage */
  readonly maxQualityDrop: number;
  
  /** Baseline file path */
  readonly baselinePath: string;
  
  /** ADR output directory */
  readonly adrDir: string;
  
  /** Enable ADR generation */
  readonly enableADR: boolean;
}

/**
 * Default configuration.
 */
export const DEFAULT_CONFIG: Partial<AutomatorConfig> = {
  qualityThreshold: 0.9,
  maxQualityDrop: 5,
  baselinePath: './baselines',
  adrDir: './docs/adr',
  enableADR: true,
};

/**
 * Loads configuration from environment variables.
 */
export function loadConfig(): AutomatorConfig {
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.REPO_OWNER;
  const repoName = process.env.REPO_NAME;

  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  if (!repoOwner) {
    throw new Error('REPO_OWNER environment variable is required');
  }

  if (!repoName) {
    throw new Error('REPO_NAME environment variable is required');
  }

  return {
    githubToken,
    repoOwner,
    repoName,
    qualityThreshold: parseFloat(process.env.QUALITY_THRESHOLD || '0.9'),
    maxQualityDrop: parseFloat(process.env.MAX_QUALITY_DROP || '5'),
    baselinePath: process.env.BASELINE_PATH || './baselines',
    adrDir: process.env.ADR_DIR || './docs/adr',
    enableADR: process.env.ENABLE_ADR !== 'false',
  };
}

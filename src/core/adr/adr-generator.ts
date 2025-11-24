/**
 * ADR Generator
 * 
 * Generates ADR content from detected code changes.
 */

import { Change, ADRData, ADRStatus, ImpactAnalysis } from './types';
import { ADRDetector } from './adr-detector';

/**
 * Generates Architecture Decision Records from code changes.
 */
export class ADRGenerator {
  private detector: ADRDetector;

  constructor() {
    this.detector = new ADRDetector();
  }

  /**
   * Generates ADR data from detected changes.
   * 
   * @param changes - Detected code changes
   * @param number - ADR number
   * @param options - Generation options
   * @returns Complete ADR data
   */
  generateFromChanges(
    changes: Change[],
    number: number,
    options?: {
      author?: string;
      tags?: string[];
      status?: ADRStatus;
    }
  ): ADRData {
    const title = this.generateTitle(changes);
    const context = this.suggestContext(changes);
    const decision = this.generateDecision(changes);
    const consequences = this.suggestConsequences(changes);
    const alternatives = this.suggestAlternatives(changes);

    return {
      number,
      title,
      date: new Date(),
      status: options?.status || 'Proposed',
      context,
      decision,
      consequences,
      alternatives,
      metadata: {
        author: options?.author,
        tags: options?.tags || this.generateTags(changes),
      },
    };
  }

  /**
   * Suggests context section content.
   */
  suggestContext(changes: Change[]): string {
    const impact = this.detector.analyzeImpact(changes);
    const breakingChanges = this.detector.detectBreakingChanges(changes);

    const parts: string[] = [];

    // Describe the situation
    if (breakingChanges.length > 0) {
      parts.push(
        `The current interface design has ${breakingChanges.length} breaking change(s) ` +
        `that need to be addressed. These changes affect ${impact.affectedSystems.join(', ')}.`
      );
    } else {
      parts.push(
        `Interface enhancements have been identified that will improve the system ` +
        `without breaking existing functionality.`
      );
    }

    // List key changes
    parts.push('\n**Key Changes:**');
    changes.slice(0, 5).forEach(change => {
      parts.push(`- ${change.description}`);
    });

    if (changes.length > 5) {
      parts.push(`- ... and ${changes.length - 5} more changes`);
    }

    // Describe impact
    parts.push(`\n**Impact:** ${impact.severity} severity, affecting ${impact.affectedSystems.length} system(s).`);

    return parts.join('\n');
  }

  /**
   * Suggests consequences of the changes.
   */
  suggestConsequences(changes: Change[]): {
    positive: string[];
    negative: string[];
    neutral: string[];
  } {
    const positive: string[] = [];
    const negative: string[] = [];
    const neutral: string[] = [];

    const breakingChanges = this.detector.detectBreakingChanges(changes);
    const impact = this.detector.analyzeImpact(changes);

    // Positive consequences
    const hasAdditions = changes.some(c => c.type.includes('added'));
    if (hasAdditions) {
      positive.push('Enhanced functionality with new interfaces/properties');
      positive.push('Improved type safety and developer experience');
    }

    const hasModifications = changes.some(c => c.type.includes('modified'));
    if (hasModifications) {
      positive.push('More accurate type definitions');
      positive.push('Better alignment with actual usage patterns');
    }

    // Negative consequences
    if (breakingChanges.length > 0) {
      negative.push(`Breaking changes require updates to ${impact.affectedSystems.length} system(s)`);
      negative.push(`Migration effort estimated as: ${impact.migrationEffort}`);
      negative.push('Requires major version bump');
    }

    const hasRemovals = changes.some(c => c.type.includes('removed'));
    if (hasRemovals) {
      negative.push('Removed interfaces/properties may break existing code');
      negative.push('Requires deprecation period and migration guide');
    }

    // Neutral consequences
    neutral.push('Documentation needs to be updated');
    neutral.push('Tests need to be updated to reflect changes');

    if (breakingChanges.length > 0) {
      neutral.push('Changelog must document breaking changes');
    }

    return { positive, negative, neutral };
  }

  /**
   * Generates title from changes.
   */
  private generateTitle(changes: Change[]): string {
    const breakingChanges = this.detector.detectBreakingChanges(changes);

    if (changes.length === 1) {
      const change = changes[0];
      return this.formatChangeTitle(change);
    }

    // Multiple changes
    const targets = new Set(changes.map(c => c.target.split('.')[0]));
    const targetList = Array.from(targets).slice(0, 2).join(' and ');

    if (breakingChanges.length > 0) {
      return `Breaking Changes to ${targetList} Interface${targets.size > 1 ? 's' : ''}`;
    }

    return `Update ${targetList} Interface${targets.size > 1 ? 's' : ''}`;
  }

  /**
   * Formats a single change into a title.
   */
  private formatChangeTitle(change: Change): string {
    switch (change.type) {
      case 'interface-added':
        return `Add ${change.target} Interface`;
      case 'interface-removed':
        return `Remove ${change.target} Interface`;
      case 'interface-modified':
        return `Modify ${change.target} Interface`;
      case 'property-added':
        return `Add ${change.target} Property`;
      case 'property-removed':
        return `Remove ${change.target} Property`;
      case 'property-modified':
        return `Change ${change.target} Type`;
      case 'method-signature-changed':
        return `Change ${change.target} Signature`;
      default:
        return `Update ${change.target}`;
    }
  }

  /**
   * Generates decision section.
   */
  private generateDecision(changes: Change[]): string {
    const parts: string[] = [];

    parts.push('We will make the following changes to the interfaces:\n');

    changes.forEach(change => {
      if (change.before && change.after) {
        parts.push(`**${change.target}:**`);
        parts.push('```typescript');
        parts.push(`// Before: ${change.before}`);
        parts.push(`// After:  ${change.after}`);
        parts.push('```\n');
      } else {
        parts.push(`- ${change.description}`);
      }
    });

    const breakingChanges = this.detector.detectBreakingChanges(changes);
    if (breakingChanges.length > 0) {
      parts.push('\n**Migration Path:**');
      parts.push('1. Update all code using the modified interfaces');
      parts.push('2. Run tests to verify compatibility');
      parts.push('3. Update documentation');
      parts.push('4. Release as major version');
    }

    return parts.join('\n');
  }

  /**
   * Suggests alternatives that were considered.
   */
  private suggestAlternatives(changes: Change[]): Array<{
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    rejectionReason: string;
  }> {
    const breakingChanges = this.detector.detectBreakingChanges(changes);

    if (breakingChanges.length === 0) {
      return []; // No alternatives needed for non-breaking changes
    }

    return [
      {
        name: 'Deprecation Period',
        description: 'Keep old interfaces and add new ones alongside, deprecating the old',
        pros: [
          'No immediate breaking changes',
          'Gradual migration path',
          'Backward compatibility maintained',
        ],
        cons: [
          'Increased code complexity',
          'Maintenance burden of supporting both versions',
          'Delayed cleanup',
        ],
        rejectionReason: 'Adds unnecessary complexity and delays necessary improvements',
      },
      {
        name: 'Keep Current Design',
        description: 'Do not make any changes to existing interfaces',
        pros: [
          'No breaking changes',
          'No migration needed',
          'Stable API',
        ],
        cons: [
          'Does not address identified issues',
          'Technical debt accumulates',
          'Suboptimal developer experience',
        ],
        rejectionReason: 'Does not solve the underlying problems that necessitate these changes',
      },
    ];
  }

  /**
   * Generates tags based on changes.
   */
  private generateTags(changes: Change[]): string[] {
    const tags = new Set<string>(['architecture', 'api']);

    const breakingChanges = this.detector.detectBreakingChanges(changes);
    if (breakingChanges.length > 0) {
      tags.add('breaking-change');
    }

    // Add tags based on affected systems
    for (const change of changes) {
      if (change.target.toLowerCase().includes('plugin')) tags.add('plugins');
      if (change.target.toLowerCase().includes('event')) tags.add('events');
      if (change.target.toLowerCase().includes('state')) tags.add('state');
      if (change.target.toLowerCase().includes('personality')) tags.add('personality');
    }

    return Array.from(tags);
  }
}

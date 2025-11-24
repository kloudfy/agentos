/**
 * ADR (Architecture Decision Record) Types
 * 
 * Defines types for automatic ADR generation when interfaces change.
 */

/**
 * ADR status values.
 */
export type ADRStatus = 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';

/**
 * Type of code change detected.
 */
export type ChangeType =
  | 'interface-added'
  | 'interface-modified'
  | 'interface-removed'
  | 'property-added'
  | 'property-removed'
  | 'property-modified'
  | 'method-added'
  | 'method-removed'
  | 'method-signature-changed'
  | 'type-changed';

/**
 * Severity level of impact.
 */
export type ImpactSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Detected code change.
 */
export interface Change {
  /** Type of change */
  readonly type: ChangeType;
  
  /** Target of the change (interface name, property name, etc.) */
  readonly target: string;
  
  /** Human-readable description */
  readonly description: string;
  
  /** Whether this is a breaking change */
  readonly breaking: boolean;
  
  /** Optional before/after values */
  readonly before?: string;
  readonly after?: string;
  
  /** File where change occurred */
  readonly file?: string;
  
  /** Line number */
  readonly line?: number;
}

/**
 * Impact analysis of changes.
 */
export interface ImpactAnalysis {
  /** Overall severity */
  readonly severity: ImpactSeverity;
  
  /** Systems/components affected */
  readonly affectedSystems: readonly string[];
  
  /** Recommendations for handling the change */
  readonly recommendations: readonly string[];
  
  /** Estimated migration effort */
  readonly migrationEffort?: 'trivial' | 'low' | 'medium' | 'high';
  
  /** Breaking changes count */
  readonly breakingChangesCount: number;
}

/**
 * Architecture Decision Record data.
 */
export interface ADRData {
  /** ADR number (sequential) */
  readonly number: number;
  
  /** Title of the decision */
  readonly title: string;
  
  /** Date of the decision */
  readonly date: Date;
  
  /** Current status */
  readonly status: ADRStatus;
  
  /** Context explaining the situation */
  readonly context: string;
  
  /** The decision made */
  readonly decision: string;
  
  /** Consequences of the decision */
  readonly consequences: {
    readonly positive: readonly string[];
    readonly negative: readonly string[];
    readonly neutral: readonly string[];
  };
  
  /** Optional alternatives considered */
  readonly alternatives?: readonly {
    readonly name: string;
    readonly description: string;
    readonly pros: readonly string[];
    readonly cons: readonly string[];
    readonly rejectionReason: string;
  }[];
  
  /** Related ADR numbers */
  readonly relatedADRs?: readonly number[];
  
  /** Optional metadata */
  readonly metadata?: {
    readonly author?: string;
    readonly reviewers?: readonly string[];
    readonly tags?: readonly string[];
    readonly supersedes?: number;
    readonly supersededBy?: number;
  };
}

/**
 * ADR generation options.
 */
export interface ADRGenerationOptions {
  /** Directory to save ADRs */
  readonly outputDir?: string;
  
  /** Template to use */
  readonly template?: string;
  
  /** Auto-detect breaking changes */
  readonly detectBreaking?: boolean;
  
  /** Include alternatives section */
  readonly includeAlternatives?: boolean;
  
  /** Author name */
  readonly author?: string;
  
  /** Tags to add */
  readonly tags?: readonly string[];
}

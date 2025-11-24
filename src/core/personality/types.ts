/**
 * Personality Types Module
 * 
 * Defines the core types and interfaces for the Phantom Branching system.
 * This enables dynamic personality switching based on context.
 */

/**
 * Tone of communication for a personality.
 */
export type PersonalityTone = 
  | 'formal'      // Professional, structured communication
  | 'casual'      // Relaxed, conversational style
  | 'technical'   // Precise, technical terminology
  | 'friendly'    // Warm, approachable manner
  | 'concise';    // Brief, to-the-point

/**
 * Level of detail in responses.
 */
export type VerbosityLevel = 
  | 'minimal'     // Terse, essential information only
  | 'moderate'    // Balanced detail level
  | 'detailed';   // Comprehensive, thorough explanations

/**
 * Predefined personality type identifiers.
 */
export type PersonalityType = 
  | 'helpful'     // Patient, detailed, beginner-friendly
  | 'efficient'   // Terse, optimized, expert-focused
  | 'creative'    // Experimental, innovative, exploratory
  | 'analytical'  // Data-driven, precise, methodical
  | 'casual';     // Conversational, friendly, natural

/**
 * Core personality interface defining behavior and characteristics.
 * Each personality represents a distinct mode of interaction.
 * 
 * @example
 * ```typescript
 * const helpfulPersonality: Personality = {
 *   name: 'helpful',
 *   description: 'Patient and beginner-friendly assistant',
 *   tone: 'friendly',
 *   verbosity: 'detailed',
 *   exampleUsage: [
 *     'Explaining concepts step-by-step',
 *     'Providing detailed examples',
 *     'Answering "how do I" questions'
 *   ],
 *   contextPatterns: [
 *     'how do i',
 *     'explain',
 *     'tutorial',
 *     'beginner',
 *     'help me understand'
 *   ],
 *   systemPrompt: 'You are a patient, helpful assistant...'
 * };
 * ```
 */
export interface Personality {
  /** Unique identifier for the personality */
  readonly name: PersonalityType;
  
  /** Human-readable description of the personality */
  readonly description: string;
  
  /** Communication tone this personality uses */
  readonly tone: PersonalityTone;
  
  /** Level of detail in responses */
  readonly verbosity: VerbosityLevel;
  
  /** Example use cases where this personality excels */
  readonly exampleUsage: readonly string[];
  
  /** Keywords/patterns that trigger this personality */
  readonly contextPatterns: readonly string[];
  
  /** System prompt defining how this personality behaves */
  readonly systemPrompt: string;
  
  /** Optional priority weight for conflict resolution (higher = preferred) */
  readonly priority?: number;
  
  /** Optional metadata for extensibility */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Context information used for personality selection.
 */
export interface PersonalityContext {
  /** User's input message */
  userMessage: string;
  
  /** Conversation history (recent messages) */
  conversationHistory?: string[];
  
  /** Current task or operation being performed */
  currentTask?: string;
  
  /** User's expertise level (if known) */
  expertiseLevel?: 'beginner' | 'intermediate' | 'expert';
  
  /** Explicit personality preference from user */
  preferredPersonality?: PersonalityType;
  
  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of personality matching/selection.
 */
export interface PersonalityMatch {
  /** The selected personality */
  personality: Personality;
  
  /** Confidence score (0-1) for this match */
  confidence: number;
  
  /** Patterns that matched from the context */
  matchedPatterns: string[];
  
  /** Reason for selection (for debugging/logging) */
  reason: string;
}

/**
 * Configuration for the personality system.
 */
export interface PersonalityConfig {
  /** Default personality when no match is found */
  defaultPersonality: PersonalityType;
  
  /** Minimum confidence threshold for personality switching */
  confidenceThreshold: number;
  
  /** Whether to allow mid-conversation personality switches */
  allowDynamicSwitching: boolean;
  
  /** Maximum conversation history to consider */
  maxHistoryLength: number;
  
  /** Custom personality definitions (extends built-in personalities) */
  customPersonalities?: Personality[];
}

/**
 * Personality transition event data.
 */
export interface PersonalityTransition {
  /** Previous personality (null if first selection) */
  from: PersonalityType | null;
  
  /** New personality */
  to: PersonalityType;
  
  /** Reason for transition */
  reason: string;
  
  /** Confidence in the transition */
  confidence: number;
  
  /** Timestamp of transition */
  timestamp: Date;
}

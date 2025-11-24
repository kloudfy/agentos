/**
 * Personality Module - Phantom Branching System
 * 
 * Enables dynamic personality switching based on context.
 * Provides 5 distinct personalities for different interaction modes.
 */

// Core types
export {
  Personality,
  PersonalityType,
  PersonalityTone,
  VerbosityLevel,
  PersonalityContext,
  PersonalityMatch,
  PersonalityConfig,
  PersonalityTransition,
} from './types';

// Built-in personalities
export {
  HELPFUL_PERSONALITY,
  EFFICIENT_PERSONALITY,
  CREATIVE_PERSONALITY,
  ANALYTICAL_PERSONALITY,
  CASUAL_PERSONALITY,
  BUILT_IN_PERSONALITIES,
  PERSONALITY_MAP,
} from './personalities';

// Context analyzer
export { ContextAnalyzer } from './context-analyzer';

// Personality selector
export { PersonalitySelector } from './personality-selector';

// Personality manager
export { PersonalityManager } from './personality-manager';

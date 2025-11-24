import {
  Personality,
  PersonalityContext,
  PersonalityMatch,
  PersonalityType,
} from './types';
import { BUILT_IN_PERSONALITIES, PERSONALITY_MAP } from './personalities';

/**
 * Selects the best personality based on context analysis.
 * Uses pattern matching and confidence scoring.
 */
export class PersonalitySelector {
  private personalities: readonly Personality[];
  private confidenceThreshold: number;

  /**
   * Creates a new PersonalitySelector.
   * 
   * @param personalities - Array of personalities to select from (defaults to built-in)
   * @param confidenceThreshold - Minimum confidence for selection (default: 0.3)
   */
  constructor(
    personalities: readonly Personality[] = BUILT_IN_PERSONALITIES,
    confidenceThreshold: number = 0.3
  ) {
    this.personalities = personalities;
    this.confidenceThreshold = confidenceThreshold;
  }

  /**
   * Selects the best personality for the given context.
   * 
   * @param context - Analyzed context from user input
   * @returns Best matching personality with confidence score
   * 
   * @example
   * ```typescript
   * const selector = new PersonalitySelector();
   * const match = selector.selectPersonality(context);
   * console.log(`Selected: ${match.personality.name} (${match.confidence})`);
   * ```
   */
  selectPersonality(context: PersonalityContext): PersonalityMatch {
    // If user has explicit preference, use it
    if (context.preferredPersonality) {
      const personality = PERSONALITY_MAP.get(context.preferredPersonality);
      if (personality) {
        return {
          personality,
          confidence: 1.0,
          matchedPatterns: ['user-preference'],
          reason: 'Explicit user preference',
        };
      }
    }

    // Calculate scores for all personalities
    const scores = this.personalities.map(personality => ({
      personality,
      ...this.calculateScore(personality, context),
    }));

    // Sort by confidence (descending), then by priority (descending)
    scores.sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) < 0.05) {
        // If confidence is very close, use priority
        return (b.personality.priority || 0) - (a.personality.priority || 0);
      }
      return b.confidence - a.confidence;
    });

    const best = scores[0];

    // If confidence is too low, fall back to helpful
    if (best.confidence < this.confidenceThreshold) {
      const helpful = PERSONALITY_MAP.get('helpful')!;
      return {
        personality: helpful,
        confidence: 0.5,
        matchedPatterns: [],
        reason: 'Low confidence, defaulting to helpful personality',
      };
    }

    return {
      personality: best.personality,
      confidence: best.confidence,
      matchedPatterns: best.matchedPatterns,
      reason: best.reason,
    };
  }

  /**
   * Calculates confidence score for a personality given context.
   */
  private calculateScore(
    personality: Personality,
    context: PersonalityContext
  ): { confidence: number; matchedPatterns: string[]; reason: string } {
    const normalizedMessage = context.userMessage.toLowerCase();
    const matchedPatterns: string[] = [];
    let score = 0;
    let maxPossibleScore = 0;

    // Pattern matching (most important factor)
    const patternWeight = 0.6;
    maxPossibleScore += patternWeight;

    for (const pattern of personality.contextPatterns) {
      if (normalizedMessage.includes(pattern)) {
        matchedPatterns.push(pattern);
        score += patternWeight / personality.contextPatterns.length;
      }
    }

    // Expertise level matching
    if (context.expertiseLevel) {
      const expertiseWeight = 0.2;
      maxPossibleScore += expertiseWeight;

      if (
        (context.expertiseLevel === 'beginner' && personality.name === 'helpful') ||
        (context.expertiseLevel === 'expert' && personality.name === 'efficient') ||
        (context.expertiseLevel === 'intermediate' && 
         ['analytical', 'creative'].includes(personality.name))
      ) {
        score += expertiseWeight;
      }
    }

    // Task matching
    if (context.currentTask) {
      const taskWeight = 0.15;
      maxPossibleScore += taskWeight;

      const taskPersonalityMap: Record<string, PersonalityType[]> = {
        debugging: ['analytical', 'efficient'],
        optimization: ['efficient', 'analytical'],
        design: ['creative', 'analytical'],
        learning: ['helpful', 'casual'],
        testing: ['analytical', 'efficient'],
        deployment: ['efficient', 'analytical'],
      };

      const suitablePersonalities = taskPersonalityMap[context.currentTask] || [];
      if (suitablePersonalities.includes(personality.name)) {
        score += taskWeight;
      }
    }

    // Metadata-based scoring
    if (context.metadata) {
      const metadataWeight = 0.05;
      maxPossibleScore += metadataWeight;

      const urgency = context.metadata.urgency as number;
      const complexity = context.metadata.complexity as number;

      // High urgency favors efficient
      if (urgency > 0.7 && personality.name === 'efficient') {
        score += metadataWeight / 2;
      }

      // High complexity favors analytical
      if (complexity > 0.7 && personality.name === 'analytical') {
        score += metadataWeight / 2;
      }
    }

    // Normalize score to 0-1 range
    const confidence = maxPossibleScore > 0 ? score / maxPossibleScore : 0;

    // Generate reason
    let reason = `Matched ${matchedPatterns.length} pattern(s)`;
    if (context.expertiseLevel) {
      reason += `, expertise: ${context.expertiseLevel}`;
    }
    if (context.currentTask) {
      reason += `, task: ${context.currentTask}`;
    }

    return {
      confidence: Math.min(1, confidence),
      matchedPatterns,
      reason,
    };
  }

  /**
   * Gets all personalities with their scores for debugging.
   */
  getAllScores(context: PersonalityContext): Array<{
    personality: Personality;
    confidence: number;
    matchedPatterns: string[];
  }> {
    return this.personalities.map(personality => ({
      personality,
      ...this.calculateScore(personality, context),
    }));
  }
}

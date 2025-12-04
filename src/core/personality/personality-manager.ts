import { randomUUID } from 'node:crypto';
import { EventEmitter } from '../events';
import {
  Personality,
  PersonalityType,
  PersonalityContext,
  PersonalityMatch,
  PersonalityTransition,
  PersonalityConfig,
} from './types';
import { PERSONALITY_MAP } from './personalities';
import { ContextAnalyzer } from './context-analyzer';
import { PersonalitySelector } from './personality-selector';

/**
 * Manages the active personality and handles transitions.
 * Integrates with the Event System to emit transition events.
 */
export class PersonalityManager {
  private currentPersonality: Personality;
  private transitionHistory: PersonalityTransition[];
  private contextAnalyzer: ContextAnalyzer;
  private personalitySelector: PersonalitySelector;
  private events: EventEmitter;
  private config: PersonalityConfig;

  /**
   * Creates a new PersonalityManager.
   * 
   * @param events - EventEmitter for emitting transition events
   * @param config - Configuration for personality system
   * 
   * @example
   * ```typescript
   * const events = new EventEmitter();
   * const manager = new PersonalityManager(events, {
   *   defaultPersonality: 'helpful',
   *   confidenceThreshold: 0.3,
   *   allowDynamicSwitching: true,
   *   maxHistoryLength: 10,
   * });
   * ```
   */
  constructor(events: EventEmitter, config?: Partial<PersonalityConfig>) {
    this.events = events;
    this.config = {
      defaultPersonality: config?.defaultPersonality || 'helpful',
      confidenceThreshold: config?.confidenceThreshold || 0.2,
      allowDynamicSwitching: config?.allowDynamicSwitching !== false,
      maxHistoryLength: config?.maxHistoryLength || 10,
      customPersonalities: config?.customPersonalities,
    };

    this.contextAnalyzer = new ContextAnalyzer();
    this.personalitySelector = new PersonalitySelector(
      config?.customPersonalities || undefined,
      this.config.confidenceThreshold
    );

    // Initialize with default personality
    this.currentPersonality = PERSONALITY_MAP.get(this.config.defaultPersonality)!;
    this.transitionHistory = [];
  }

  /**
   * Gets the currently active personality.
   * 
   * @returns Current personality
   */
  getCurrentPersonality(): Personality {
    return this.currentPersonality;
  }

  /**
   * Gets the transition history.
   * 
   * @returns Array of personality transitions
   */
  getTransitionHistory(): readonly PersonalityTransition[] {
    return [...this.transitionHistory];
  }

  /**
   * Analyzes input and potentially switches personality.
   * 
   * @param input - User's message
   * @param additionalContext - Optional additional context
   * @returns The selected personality match
   * 
   * @example
   * ```typescript
   * const match = await manager.analyzeAndSwitch('How do I debug this?');
   * console.log(`Using personality: ${match.personality.name}`);
   * ```
   */
  async analyzeAndSwitch(
    input: string,
    additionalContext?: Partial<PersonalityContext>
  ): Promise<PersonalityMatch> {
    // Analyze context
    const context = this.contextAnalyzer.analyzeContext(input, additionalContext);

    // Select best personality
    const match = this.personalitySelector.selectPersonality(context);

    // Switch if different and dynamic switching is allowed
    if (
      this.config.allowDynamicSwitching &&
      match.personality.name !== this.currentPersonality.name
    ) {
      await this.switchPersonality(match.personality.name, match.reason, match.confidence);
    }

    return match;
  }

  /**
   * Explicitly switches to a specific personality.
   * 
   * @param personalityType - The personality to switch to
   * @param reason - Reason for the switch
   * @param confidence - Confidence in the switch (default: 1.0)
   * 
   * @example
   * ```typescript
   * await manager.switchPersonality('efficient', 'User requested quick answer');
   * ```
   */
  async switchPersonality(
    personalityType: PersonalityType,
    reason: string = 'Manual switch',
    confidence: number = 1.0
  ): Promise<void> {
    const newPersonality = PERSONALITY_MAP.get(personalityType);

    if (!newPersonality) {
      throw new Error(`Unknown personality type: ${personalityType}`);
    }

    if (newPersonality.name === this.currentPersonality.name) {
      // Already using this personality
      return;
    }

    const previousPersonality = this.currentPersonality.name;
    this.currentPersonality = newPersonality;

    // Create transition record
    const transition: PersonalityTransition = {
      from: previousPersonality,
      to: newPersonality.name,
      reason,
      confidence,
      timestamp: new Date(),
    };

    // Add to history
    this.transitionHistory.push(transition);

    // Trim history if needed
    if (this.transitionHistory.length > this.config.maxHistoryLength) {
      this.transitionHistory.shift();
    }

    // Emit transition event
    this.events.emit({
      id: randomUUID(),
      type: 'personality.switched',
      timestamp: new Date(),
      payload: {
        from: previousPersonality,
        to: newPersonality.name,
        reason,
        confidence,
      },
      metadata: { source: 'personality-manager' },
    });
  }

  /**
   * Resets to the default personality.
   * 
   * @param reason - Reason for reset
   */
  async reset(reason: string = 'Reset to default'): Promise<void> {
    await this.switchPersonality(this.config.defaultPersonality, reason);
  }

  /**
   * Gets statistics about personality usage.
   * 
   * @returns Usage statistics
   */
  getStatistics(): {
    currentPersonality: PersonalityType;
    totalTransitions: number;
    personalityUsage: Record<PersonalityType, number>;
    averageConfidence: number;
  } {
    const usage: Partial<Record<PersonalityType, number>> = {};
    let totalConfidence = 0;

    // Count current personality
    usage[this.currentPersonality.name] = 1;

    // Count from history
    for (const transition of this.transitionHistory) {
      usage[transition.to] = (usage[transition.to] || 0) + 1;
      totalConfidence += transition.confidence;
    }

    return {
      currentPersonality: this.currentPersonality.name,
      totalTransitions: this.transitionHistory.length,
      personalityUsage: usage as Record<PersonalityType, number>,
      averageConfidence:
        this.transitionHistory.length > 0
          ? totalConfidence / this.transitionHistory.length
          : 1.0,
    };
  }

  /**
   * Gets the system prompt for the current personality.
   * 
   * @returns System prompt string
   */
  getSystemPrompt(): string {
    return this.currentPersonality.systemPrompt;
  }

  /**
   * Checks if dynamic switching is enabled.
   */
  isDynamicSwitchingEnabled(): boolean {
    return this.config.allowDynamicSwitching;
  }

  /**
   * Enables or disables dynamic switching.
   */
  setDynamicSwitching(enabled: boolean): void {
    this.config.allowDynamicSwitching = enabled;
  }
}

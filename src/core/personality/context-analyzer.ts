import { PersonalityContext } from './types';

/**
 * Analyzes user input to extract context for personality selection.
 * Detects patterns, keywords, urgency, and complexity.
 */
export class ContextAnalyzer {
  /**
   * Analyzes user input and returns structured context.
   * 
   * @param input - User's message or query
   * @param additionalContext - Optional additional context
   * @returns Structured personality context
   * 
   * @example
   * ```typescript
   * const analyzer = new ContextAnalyzer();
   * const context = analyzer.analyzeContext('How do I debug this error?');
   * // Returns context with detected patterns, keywords, etc.
   * ```
   */
  analyzeContext(
    input: string,
    additionalContext?: Partial<PersonalityContext>
  ): PersonalityContext {
    const normalizedInput = input.toLowerCase().trim();

    return {
      userMessage: input,
      conversationHistory: additionalContext?.conversationHistory,
      currentTask: this.detectTask(normalizedInput),
      expertiseLevel: this.detectExpertiseLevel(normalizedInput),
      preferredPersonality: additionalContext?.preferredPersonality,
      metadata: {
        keywords: this.extractKeywords(normalizedInput),
        patterns: this.detectPatterns(normalizedInput),
        urgency: this.calculateUrgency(normalizedInput),
        complexity: this.calculateComplexity(normalizedInput),
        questionType: this.detectQuestionType(normalizedInput),
        ...additionalContext?.metadata,
      },
    };
  }

  /**
   * Extracts important keywords from the input.
   */
  private extractKeywords(input: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    ]);

    const words = input
      .split(/\s+/)
      .map(w => w.replace(/[^\w]/g, ''))
      .filter(w => w.length > 2 && !stopWords.has(w));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Detects common patterns in the input.
   */
  private detectPatterns(input: string): string[] {
    const patterns: string[] = [];

    // Question patterns
    if (/^(how|what|why|when|where|who)\b/.test(input)) {
      patterns.push('question');
    }
    if (/how (do|can|to)\b/.test(input)) {
      patterns.push('how-to');
    }
    if (/what (is|are|does)\b/.test(input)) {
      patterns.push('definition');
    }
    if (/why\b/.test(input)) {
      patterns.push('explanation');
    }

    // Command patterns
    if (/^(show|tell|give|provide|list|explain)\b/.test(input)) {
      patterns.push('command');
    }

    // Exploratory patterns
    if (/(idea|brainstorm|think|consider|explore|alternative)/.test(input)) {
      patterns.push('exploratory');
    }

    // Problem-solving patterns
    if (/(debug|fix|error|issue|problem|broken|fail)/.test(input)) {
      patterns.push('problem-solving');
    }

    // Optimization patterns
    if (/(optimize|improve|better|faster|efficient|performance)/.test(input)) {
      patterns.push('optimization');
    }

    // Learning patterns
    if (/(learn|understand|explain|tutorial|guide|beginner)/.test(input)) {
      patterns.push('learning');
    }

    return patterns;
  }

  /**
   * Detects the current task from input.
   */
  private detectTask(input: string): string | undefined {
    if (/(debug|fix|error)/.test(input)) return 'debugging';
    if (/(optimize|improve|performance)/.test(input)) return 'optimization';
    if (/(design|architect|plan)/.test(input)) return 'design';
    if (/(learn|understand|explain)/.test(input)) return 'learning';
    if (/(test|verify|validate)/.test(input)) return 'testing';
    if (/(deploy|release|production)/.test(input)) return 'deployment';
    return undefined;
  }

  /**
   * Detects user's expertise level from input.
   */
  private detectExpertiseLevel(
    input: string
  ): 'beginner' | 'intermediate' | 'expert' | undefined {
    // Beginner indicators
    if (/(beginner|new to|just started|don't understand|confused|help me)/.test(input)) {
      return 'beginner';
    }

    // Expert indicators
    if (/(optimize|performance|production|architecture|advanced|expert)/.test(input)) {
      return 'expert';
    }

    // Intermediate is default if we can't determine
    return 'intermediate';
  }

  /**
   * Calculates urgency level (0-1).
   */
  private calculateUrgency(input: string): number {
    let urgency = 0.5; // Default

    // High urgency indicators
    if (/(urgent|asap|quickly|fast|now|immediately|critical|emergency)/.test(input)) {
      urgency += 0.3;
    }

    // Low urgency indicators
    if (/(when you (can|have time)|no rush|eventually|sometime|curious|whenever)/.test(input)) {
      urgency -= 0.2;
    }

    return Math.max(0, Math.min(1, urgency));
  }

  /**
   * Calculates complexity level (0-1).
   */
  private calculateComplexity(input: string): number {
    let complexity = 0.5; // Default

    // High complexity indicators
    if (/(complex|complicated|advanced|multiple|integrate|architecture)/.test(input)) {
      complexity += 0.2;
    }

    // Multiple questions or parts
    const questionMarks = (input.match(/\?/g) || []).length;
    if (questionMarks > 1) {
      complexity += 0.1;
    }

    // Long input suggests complexity
    if (input.length > 200) {
      complexity += 0.1;
    }

    // Simple indicators
    if (/(simple|basic|quick|just|only)/.test(input)) {
      complexity -= 0.2;
    }

    return Math.max(0, Math.min(1, complexity));
  }

  /**
   * Detects the type of question being asked.
   */
  private detectQuestionType(input: string): string | undefined {
    if (/^how\b/.test(input)) return 'how';
    if (/^what\b/.test(input)) return 'what';
    if (/^why\b/.test(input)) return 'why';
    if (/^when\b/.test(input)) return 'when';
    if (/^where\b/.test(input)) return 'where';
    if (/^who\b/.test(input)) return 'who';
    if (/\?$/.test(input)) return 'general-question';
    return undefined;
  }
}

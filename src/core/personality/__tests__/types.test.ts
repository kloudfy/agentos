import {
  Personality,
  PersonalityType,
  PersonalityContext,
  HELPFUL_PERSONALITY,
  EFFICIENT_PERSONALITY,
  CREATIVE_PERSONALITY,
  ANALYTICAL_PERSONALITY,
  CASUAL_PERSONALITY,
  BUILT_IN_PERSONALITIES,
  PERSONALITY_MAP,
} from '../index';

describe('Personality Types', () => {
  describe('Built-in Personalities', () => {
    it('should have all 5 personalities defined', () => {
      expect(BUILT_IN_PERSONALITIES).toHaveLength(5);
    });

    it('should have unique names', () => {
      const names = BUILT_IN_PERSONALITIES.map(p => p.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(5);
    });

    it('should have all required properties', () => {
      BUILT_IN_PERSONALITIES.forEach(personality => {
        expect(personality.name).toBeDefined();
        expect(personality.description).toBeDefined();
        expect(personality.tone).toBeDefined();
        expect(personality.verbosity).toBeDefined();
        expect(personality.exampleUsage).toBeDefined();
        expect(personality.contextPatterns).toBeDefined();
        expect(personality.systemPrompt).toBeDefined();
      });
    });
  });

  describe('HELPFUL Personality', () => {
    it('should have correct characteristics', () => {
      expect(HELPFUL_PERSONALITY.name).toBe('helpful');
      expect(HELPFUL_PERSONALITY.tone).toBe('friendly');
      expect(HELPFUL_PERSONALITY.verbosity).toBe('detailed');
    });

    it('should have beginner-friendly patterns', () => {
      expect(HELPFUL_PERSONALITY.contextPatterns).toContain('how do i');
      expect(HELPFUL_PERSONALITY.contextPatterns).toContain('explain');
      expect(HELPFUL_PERSONALITY.contextPatterns).toContain('beginner');
    });
  });

  describe('EFFICIENT Personality', () => {
    it('should have correct characteristics', () => {
      expect(EFFICIENT_PERSONALITY.name).toBe('efficient');
      expect(EFFICIENT_PERSONALITY.tone).toBe('concise');
      expect(EFFICIENT_PERSONALITY.verbosity).toBe('minimal');
    });

    it('should have expert-focused patterns', () => {
      expect(EFFICIENT_PERSONALITY.contextPatterns).toContain('quick');
      expect(EFFICIENT_PERSONALITY.contextPatterns).toContain('optimize');
      expect(EFFICIENT_PERSONALITY.contextPatterns).toContain('production');
    });
  });

  describe('CREATIVE Personality', () => {
    it('should have correct characteristics', () => {
      expect(CREATIVE_PERSONALITY.name).toBe('creative');
      expect(CREATIVE_PERSONALITY.tone).toBe('casual');
      expect(CREATIVE_PERSONALITY.verbosity).toBe('moderate');
    });

    it('should have innovation-focused patterns', () => {
      expect(CREATIVE_PERSONALITY.contextPatterns).toContain('brainstorm');
      expect(CREATIVE_PERSONALITY.contextPatterns).toContain('innovative');
      expect(CREATIVE_PERSONALITY.contextPatterns).toContain('design');
    });
  });

  describe('ANALYTICAL Personality', () => {
    it('should have correct characteristics', () => {
      expect(ANALYTICAL_PERSONALITY.name).toBe('analytical');
      expect(ANALYTICAL_PERSONALITY.tone).toBe('technical');
      expect(ANALYTICAL_PERSONALITY.verbosity).toBe('detailed');
    });

    it('should have analysis-focused patterns', () => {
      expect(ANALYTICAL_PERSONALITY.contextPatterns).toContain('analyze');
      expect(ANALYTICAL_PERSONALITY.contextPatterns).toContain('debug');
      expect(ANALYTICAL_PERSONALITY.contextPatterns).toContain('investigate');
    });
  });

  describe('CASUAL Personality', () => {
    it('should have correct characteristics', () => {
      expect(CASUAL_PERSONALITY.name).toBe('casual');
      expect(CASUAL_PERSONALITY.tone).toBe('casual');
      expect(CASUAL_PERSONALITY.verbosity).toBe('moderate');
    });

    it('should have conversational patterns', () => {
      expect(CASUAL_PERSONALITY.contextPatterns).toContain('hey');
      expect(CASUAL_PERSONALITY.contextPatterns).toContain('chat');
      expect(CASUAL_PERSONALITY.contextPatterns).toContain('friendly');
    });
  });

  describe('PERSONALITY_MAP', () => {
    it('should contain all personalities', () => {
      expect(PERSONALITY_MAP.size).toBe(5);
    });

    it('should allow lookup by name', () => {
      expect(PERSONALITY_MAP.get('helpful')).toBe(HELPFUL_PERSONALITY);
      expect(PERSONALITY_MAP.get('efficient')).toBe(EFFICIENT_PERSONALITY);
      expect(PERSONALITY_MAP.get('creative')).toBe(CREATIVE_PERSONALITY);
      expect(PERSONALITY_MAP.get('analytical')).toBe(ANALYTICAL_PERSONALITY);
      expect(PERSONALITY_MAP.get('casual')).toBe(CASUAL_PERSONALITY);
    });
  });

  describe('Type Safety', () => {
    it('should enforce PersonalityType', () => {
      const validTypes: PersonalityType[] = [
        'helpful',
        'efficient',
        'creative',
        'analytical',
        'casual',
      ];

      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should create valid PersonalityContext', () => {
      const context: PersonalityContext = {
        userMessage: 'How do I debug this?',
        conversationHistory: ['Previous message'],
        currentTask: 'debugging',
        expertiseLevel: 'intermediate',
      };

      expect(context.userMessage).toBeDefined();
      expect(context.conversationHistory).toHaveLength(1);
    });
  });
});

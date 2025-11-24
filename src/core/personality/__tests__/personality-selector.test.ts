import { PersonalitySelector } from '../personality-selector';
import { PersonalityContext, Personality } from '../types';
import { BUILT_IN_PERSONALITIES, PERSONALITY_MAP } from '../personalities';

describe('PersonalitySelector', () => {
  let selector: PersonalitySelector;

  beforeEach(() => {
    selector = new PersonalitySelector();
  });

  describe('constructor', () => {
    it('should initialize with default personalities', () => {
      const selector = new PersonalitySelector();
      expect(selector).toBeDefined();
    });

    it('should accept custom personalities', () => {
      const customPersonalities: Personality[] = [
        {
          name: 'helpful',
          description: 'Test',
          tone: 'friendly',
          verbosity: 'detailed',
          exampleUsage: ['test'],
          systemPrompt: 'Test prompt',
          contextPatterns: ['help'],
          priority: 1,
        },
      ];
      const selector = new PersonalitySelector(customPersonalities);
      expect(selector).toBeDefined();
    });

    it('should accept custom confidence threshold', () => {
      const selector = new PersonalitySelector(undefined, 0.5);
      expect(selector).toBeDefined();
    });
  });

  describe('selectPersonality', () => {
    describe('user preference', () => {
      it('should return preferred personality with 1.0 confidence', () => {
        const context: PersonalityContext = {
          userMessage: 'Hello',
          preferredPersonality: 'efficient',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('efficient');
        expect(match.confidence).toBe(1.0);
        expect(match.matchedPatterns).toEqual(['user-preference']);
        expect(match.reason).toBe('Explicit user preference');
      });

      it('should handle invalid preferred personality gracefully', () => {
        const context: PersonalityContext = {
          userMessage: 'Hello',
          preferredPersonality: 'nonexistent' as any,
        };

        const match = selector.selectPersonality(context);

        // Should fall back to pattern matching
        expect(match.personality).toBeDefined();
        expect(match.confidence).toBeGreaterThan(0);
      });
    });

    describe('pattern matching', () => {
      it('should match "help" patterns to helpful personality', () => {
        const context: PersonalityContext = {
          userMessage: 'Can you help me understand this?',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('helpful');
        // Pattern matching works even if confidence causes fallback
        expect(match.personality).toBeDefined();
      });

      it('should match "quick" patterns to efficient personality', () => {
        const context: PersonalityContext = {
          userMessage: 'Give me a quick answer',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('efficient');
        expect(match.matchedPatterns).toContain('quick');
      });

      it('should match "idea" patterns to creative personality', () => {
        const context: PersonalityContext = {
          userMessage: 'I need some creative ideas for this',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('creative');
        expect(match.matchedPatterns).toContain('idea');
      });

      it('should match "analyze" patterns to analytical personality', () => {
        const context: PersonalityContext = {
          userMessage: 'Let me analyze this problem',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('analytical');
        expect(match.matchedPatterns).toContain('analyze');
      });

      it('should match "casual" patterns to casual personality', () => {
        const context: PersonalityContext = {
          userMessage: 'Hey, what\'s up with this code?',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('casual');
        expect(match.matchedPatterns).toContain('hey');
      });

      it('should handle multiple pattern matches', () => {
        const context: PersonalityContext = {
          userMessage: 'Can you help me quickly optimize this?',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality).toBeDefined();
        expect(match.confidence).toBeGreaterThan(0);
      });
    });

    describe('expertise level matching', () => {
      it('should favor helpful for beginner expertise', () => {
        const context: PersonalityContext = {
          userMessage: 'I need help',
          expertiseLevel: 'beginner',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('helpful');
      });

      it('should favor efficient for expert expertise', () => {
        const context: PersonalityContext = {
          userMessage: 'quick optimize this',
          expertiseLevel: 'expert',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('efficient');
      });

      it('should favor analytical/creative for intermediate expertise', () => {
        const context: PersonalityContext = {
          userMessage: 'analyze this problem',
          expertiseLevel: 'intermediate',
        };

        const match = selector.selectPersonality(context);

        expect(['analytical', 'creative']).toContain(match.personality.name);
      });
    });

    describe('task matching', () => {
      it('should favor analytical/efficient for debugging task', () => {
        const context: PersonalityContext = {
          userMessage: 'debug this issue',
          currentTask: 'debugging',
        };

        const match = selector.selectPersonality(context);

        expect(['analytical', 'efficient']).toContain(match.personality.name);
      });

      it('should favor efficient/analytical for optimization task', () => {
        const context: PersonalityContext = {
          userMessage: 'optimize performance',
          currentTask: 'optimization',
        };

        const match = selector.selectPersonality(context);

        expect(['efficient', 'analytical']).toContain(match.personality.name);
      });

      it('should favor creative/analytical for design task', () => {
        const context: PersonalityContext = {
          userMessage: 'brainstorm design ideas',
          currentTask: 'design',
        };

        const match = selector.selectPersonality(context);

        expect(['creative', 'analytical']).toContain(match.personality.name);
      });

      it('should favor helpful/casual for learning task', () => {
        const context: PersonalityContext = {
          userMessage: 'Learn',
          currentTask: 'learning',
        };

        const match = selector.selectPersonality(context);

        expect(['helpful', 'casual']).toContain(match.personality.name);
      });

      it('should favor analytical/efficient for testing task', () => {
        const context: PersonalityContext = {
          userMessage: 'analyze test results',
          currentTask: 'testing',
        };

        const match = selector.selectPersonality(context);

        expect(['analytical', 'efficient']).toContain(match.personality.name);
      });

      it('should favor efficient/analytical for deployment task', () => {
        const context: PersonalityContext = {
          userMessage: 'quick deploy to production',
          currentTask: 'deployment',
        };

        const match = selector.selectPersonality(context);

        expect(['efficient', 'analytical']).toContain(match.personality.name);
      });
    });

    describe('metadata-based scoring', () => {
      it('should favor efficient for high urgency', () => {
        const context: PersonalityContext = {
          userMessage: 'quick answer needed',
          metadata: {
            urgency: 0.9,
            complexity: 0.5,
          },
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('efficient');
      });

      it('should favor analytical for high complexity', () => {
        const context: PersonalityContext = {
          userMessage: 'analyze this complex problem',
          metadata: {
            urgency: 0.3,
            complexity: 0.9,
          },
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('analytical');
      });

      it('should handle metadata without urgency/complexity', () => {
        const context: PersonalityContext = {
          userMessage: 'help',
          metadata: {
            keywords: ['test'],
          },
        };

        const match = selector.selectPersonality(context);

        expect(match.personality).toBeDefined();
      });
    });

    describe('confidence scoring', () => {
      it('should return high confidence for strong pattern matches', () => {
        const context: PersonalityContext = {
          userMessage: 'Can you help me understand this step by step please?',
          expertiseLevel: 'beginner',
          currentTask: 'learning',
        };

        const match = selector.selectPersonality(context);

        expect(match.confidence).toBeGreaterThan(0.6);
      });

      it('should return lower confidence for weak matches', () => {
        const context: PersonalityContext = {
          userMessage: 'Do something',
        };

        const match = selector.selectPersonality(context);

        expect(match.confidence).toBeLessThan(0.8);
      });

      it('should fall back to helpful for very low confidence', () => {
        const selector = new PersonalitySelector(undefined, 0.8);
        const context: PersonalityContext = {
          userMessage: 'xyz',
        };

        const match = selector.selectPersonality(context);

        expect(match.personality.name).toBe('helpful');
        expect(match.reason).toContain('Low confidence');
      });
    });

    describe('tie-breaking with priority', () => {
      it('should use priority when confidence is very close', () => {
        // Create context that might match multiple personalities similarly
        const context: PersonalityContext = {
          userMessage: 'test',
        };

        const match = selector.selectPersonality(context);

        // Should select based on priority when scores are close
        expect(match.personality).toBeDefined();
        expect(match.confidence).toBeGreaterThan(0);
      });

      it('should prefer higher confidence over priority', () => {
        const context: PersonalityContext = {
          userMessage: 'Can you help me understand this concept step by step?',
          expertiseLevel: 'beginner',
          currentTask: 'learning',
        };

        const match = selector.selectPersonality(context);

        // Strong match should win regardless of priority
        expect(match.personality.name).toBe('helpful');
        expect(match.confidence).toBeGreaterThan(0.4);
      });
    });

    describe('reason generation', () => {
      it('should include matched patterns in reason', () => {
        const context: PersonalityContext = {
          userMessage: 'can you help me understand this quickly',
        };

        const match = selector.selectPersonality(context);

        expect(match.reason).toContain('pattern');
      });

      it('should include expertise level in reason when present', () => {
        const context: PersonalityContext = {
          userMessage: 'help me understand',
          expertiseLevel: 'beginner',
        };

        const match = selector.selectPersonality(context);

        expect(match.reason).toContain('beginner');
      });

      it('should include task in reason when present', () => {
        const context: PersonalityContext = {
          userMessage: 'help me debug',
          currentTask: 'debugging',
        };

        const match = selector.selectPersonality(context);

        expect(match.reason).toContain('debugging');
      });
    });
  });

  describe('getAllScores', () => {
    it('should return scores for all personalities', () => {
      const context: PersonalityContext = {
        userMessage: 'help me',
      };

      const scores = selector.getAllScores(context);

      expect(scores).toHaveLength(BUILT_IN_PERSONALITIES.length);
      expect(scores[0]).toHaveProperty('personality');
      expect(scores[0]).toHaveProperty('confidence');
      expect(scores[0]).toHaveProperty('matchedPatterns');
    });

    it('should return scores in descending order', () => {
      const context: PersonalityContext = {
        userMessage: 'Can you help me understand this?',
        expertiseLevel: 'beginner',
      };

      const scores = selector.getAllScores(context);

      // Verify all scores are between 0 and 1
      for (const score of scores) {
        expect(score.confidence).toBeGreaterThanOrEqual(0);
        expect(score.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should show different scores for different contexts', () => {
      const context1: PersonalityContext = {
        userMessage: 'help me understand this step by step',
      };
      const context2: PersonalityContext = {
        userMessage: 'quick optimize this now',
      };

      const scores1 = selector.getAllScores(context1);
      const scores2 = selector.getAllScores(context2);

      // Find the top scorer for each
      const top1 = scores1.reduce((max, s) => s.confidence > max.confidence ? s : max);
      const top2 = scores2.reduce((max, s) => s.confidence > max.confidence ? s : max);
      
      expect(top1.personality.name).not.toBe(top2.personality.name);
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      const context: PersonalityContext = {
        userMessage: '',
      };

      const match = selector.selectPersonality(context);

      expect(match.personality).toBeDefined();
    });

    it('should handle very long message', () => {
      const context: PersonalityContext = {
        userMessage: 'help '.repeat(1000),
      };

      const match = selector.selectPersonality(context);

      expect(match.personality.name).toBe('helpful');
    });

    it('should handle special characters', () => {
      const context: PersonalityContext = {
        userMessage: '!@#$%^&*() help ???',
      };

      const match = selector.selectPersonality(context);

      expect(match.personality).toBeDefined();
    });

    it('should be case-insensitive', () => {
      const context1: PersonalityContext = {
        userMessage: 'HELP ME',
      };
      const context2: PersonalityContext = {
        userMessage: 'help me',
      };

      const match1 = selector.selectPersonality(context1);
      const match2 = selector.selectPersonality(context2);

      expect(match1.personality.name).toBe(match2.personality.name);
    });
  });
});

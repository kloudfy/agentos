import { EventEmitter } from '../../events';
import { ContextAnalyzer } from '../context-analyzer';
import { PersonalitySelector } from '../personality-selector';
import { PersonalityManager } from '../personality-manager';
import { PersonalityContext } from '../types';

describe('Personality System Integration', () => {
  let events: EventEmitter;
  let contextAnalyzer: ContextAnalyzer;
  let personalitySelector: PersonalitySelector;
  let personalityManager: PersonalityManager;

  beforeEach(() => {
    events = new EventEmitter();
    contextAnalyzer = new ContextAnalyzer();
    personalitySelector = new PersonalitySelector();
    personalityManager = new PersonalityManager(events);
  });

  describe('End-to-End Flow: User Input → Context Analysis → Personality Selection → Switch → Event', () => {
    it('should handle creative brainstorming request', async () => {
      const userInput = 'I need some creative ideas for designing this feature';
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      // Full flow using PersonalityManager
      const match = await personalityManager.analyzeAndSwitch(userInput, {
        currentTask: 'design',
      });

      expect(match.personality.name).toBe('creative');
      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(personalityManager.getCurrentPersonality().name).toBe('creative');
    });

    it('should handle analytical debugging request', async () => {
      const userInput = 'Let me analyze this complex bug systematically';

      const match = await personalityManager.analyzeAndSwitch(userInput, {
        expertiseLevel: 'intermediate',
        metadata: {
          complexity: 0.8,
        },
      });

      expect(match.personality.name).toBe('analytical');
      expect(match.confidence).toBeGreaterThan(0.5);
    });

    it('should handle casual conversation', async () => {
      const userInput = 'Hey, what\'s up with this code?';

      const match = await personalityManager.analyzeAndSwitch(userInput);

      expect(match.personality.name).toBe('casual');
    });
  });

  describe('User Preferences', () => {
    it('should respect explicit user preference', async () => {
      const userInput = 'Help me debug this';
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      // User explicitly wants efficient personality
      const match = await personalityManager.analyzeAndSwitch(userInput, {
        preferredPersonality: 'efficient',
      });

      expect(match.personality.name).toBe('efficient');
      expect(match.confidence).toBe(1.0);
      expect(match.reason).toBe('Explicit user preference');
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it('should override pattern matching with user preference', async () => {
      const userInput = 'Can you help me understand this?';

      // Without preference, should select helpful
      const match1 = await personalityManager.analyzeAndSwitch(userInput);
      expect(match1.personality.name).toBe('helpful');

      // Reset
      await personalityManager.reset();

      // With preference, should select creative
      const match2 = await personalityManager.analyzeAndSwitch(userInput, {
        preferredPersonality: 'creative',
      });
      expect(match2.personality.name).toBe('creative');
    });
  });

  describe('Dynamic Switching Control', () => {
    it('should not switch when dynamic switching is disabled', async () => {
      const manager = new PersonalityManager(events, {
        allowDynamicSwitching: false,
      });
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      // Try to trigger switch
      const match = await manager.analyzeAndSwitch('Quick answer please');

      // Should detect efficient but not switch
      expect(match.personality.name).toBe('efficient');
      expect(manager.getCurrentPersonality().name).toBe('helpful');
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('should allow manual switches even when dynamic switching is disabled', async () => {
      const manager = new PersonalityManager(events, {
        allowDynamicSwitching: false,
      });
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      // Manual switch should work
      await manager.switchPersonality('efficient');

      expect(manager.getCurrentPersonality().name).toBe('efficient');
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complex Context Scenarios', () => {
    it('should handle high urgency, high complexity scenario', async () => {
      const userInput = 'URGENT: Complex production bug needs immediate analysis';

      const match = await personalityManager.analyzeAndSwitch(userInput, {
        expertiseLevel: 'expert',
        currentTask: 'debugging',
        metadata: {
          urgency: 0.95,
          complexity: 0.9,
        },
      });

      // Should favor analytical or efficient
      expect(['analytical', 'efficient']).toContain(match.personality.name);
      expect(match.confidence).toBeGreaterThan(0.6);
    });

    it('should handle learning scenario with low urgency', async () => {
      const userInput = 'When you have time, can you explain how this works?';

      const match = await personalityManager.analyzeAndSwitch(userInput, {
        expertiseLevel: 'beginner',
        currentTask: 'learning',
        metadata: {
          urgency: 0.2,
          complexity: 0.3,
        },
      });

      expect(match.personality.name).toBe('helpful');
    });

    it('should handle design task with intermediate expertise', async () => {
      const userInput = 'I need to design the architecture for this feature';

      const match = await personalityManager.analyzeAndSwitch(userInput, {
        expertiseLevel: 'intermediate',
        currentTask: 'design',
      });

      expect(['creative', 'analytical']).toContain(match.personality.name);
    });
  });

  describe('Event System Integration', () => {
    it('should include metadata in events for tracking', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      await personalityManager.switchPersonality('efficient', 'Test', 0.85);

      const event = eventSpy.mock.calls[0][0];
      expect(event.metadata).toBeDefined();
      expect(event.metadata.source).toBe('personality-manager');
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Reset and Recovery', () => {
    it('should reset to default after multiple switches', async () => {
      await personalityManager.analyzeAndSwitch('Quick');
      await personalityManager.analyzeAndSwitch('Ideas');
      await personalityManager.analyzeAndSwitch('Analyze');

      expect(personalityManager.getCurrentPersonality().name).not.toBe('helpful');

      await personalityManager.reset('Conversation ended');

      expect(personalityManager.getCurrentPersonality().name).toBe('helpful');
      
      const history = personalityManager.getTransitionHistory();
      const lastTransition = history[history.length - 1];
      expect(lastTransition.reason).toBe('Conversation ended');
    });
  });

  describe('Debugging and Introspection', () => {
    it('should provide detailed scores for debugging', () => {
      const context: PersonalityContext = {
        userMessage: 'Help me optimize this quickly',
        expertiseLevel: 'expert',
        currentTask: 'optimization',
      };

      const scores = personalitySelector.getAllScores(context);

      expect(scores.length).toBe(5); // All built-in personalities
      
      // Verify structure
      for (const score of scores) {
        expect(score).toHaveProperty('personality');
        expect(score).toHaveProperty('confidence');
        expect(score).toHaveProperty('matchedPatterns');
        expect(score.confidence).toBeGreaterThanOrEqual(0);
        expect(score.confidence).toBeLessThanOrEqual(1);
      }

      // Efficient should have high score
      const efficientScore = scores.find(s => s.personality.name === 'efficient');
      expect(efficientScore).toBeDefined();
      expect(efficientScore!.confidence).toBeGreaterThan(0.5);
    });
  });
});

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
    it('should handle help request from beginner', async () => {
      const userInput = 'Can you help me understand how to debug this error?';
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      // Step 1: Analyze context
      const context = contextAnalyzer.analyzeContext(userInput, {
        expertiseLevel: 'beginner',
      });

      expect(context.userMessage).toBe(userInput);
      expect(context.expertiseLevel).toBe('beginner');
      expect(context.currentTask).toBe('debugging');
      expect(context.metadata?.patterns).toContain('question');
      expect(context.metadata?.patterns).toContain('learning');

      // Step 2: Select personality
      const match = personalitySelector.selectPersonality(context);

      expect(match.personality.name).toBe('helpful');
      expect(match.confidence).toBeGreaterThan(0.5);
      expect(match.matchedPatterns.length).toBeGreaterThan(0);

      // Step 3: Switch personality
      await personalityManager.switchPersonality(
        match.personality.name,
        match.reason,
        match.confidence
      );

      // Step 4: Verify event emission
      expect(eventSpy).toHaveBeenCalledTimes(1);
      const event = eventSpy.mock.calls[0][0];
      expect(event.type).toBe('personality.switched');
      expect(event.payload.to).toBe('helpful');

      // Verify final state
      expect(personalityManager.getCurrentPersonality().name).toBe('helpful');
    });

    it('should handle quick optimization request from expert', async () => {
      const userInput = 'Quick: optimize this algorithm for better performance';
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      // Step 1: Analyze context
      const context = contextAnalyzer.analyzeContext(userInput, {
        expertiseLevel: 'expert',
      });

      expect(context.currentTask).toBe('optimization');
      expect(context.expertiseLevel).toBe('expert');
      expect(context.metadata?.urgency).toBeGreaterThan(0.5);

      // Step 2: Select personality
      const match = personalitySelector.selectPersonality(context);

      expect(match.personality.name).toBe('efficient');
      expect(match.confidence).toBeGreaterThan(0.6);

      // Step 3: Switch personality
      await personalityManager.switchPersonality(
        match.personality.name,
        match.reason,
        match.confidence
      );

      // Step 4: Verify event emission
      expect(eventSpy).toHaveBeenCalledTimes(1);
      expect(eventSpy.mock.calls[0][0].payload.to).toBe('efficient');

      // Verify system prompt changed
      const systemPrompt = personalityManager.getSystemPrompt();
      expect(systemPrompt).toContain('efficient');
    });

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

  describe('Multiple Transitions', () => {
    it('should handle conversation flow with multiple personality switches', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      // User starts with a help request
      await personalityManager.analyzeAndSwitch(
        'Can you help me understand this?'
      );
      expect(personalityManager.getCurrentPersonality().name).toBe('helpful');

      // User asks for quick optimization
      await personalityManager.analyzeAndSwitch(
        'Now quickly optimize this'
      );
      expect(personalityManager.getCurrentPersonality().name).toBe('efficient');

      // User wants creative ideas
      await personalityManager.analyzeAndSwitch(
        'Give me some creative alternatives'
      );
      expect(personalityManager.getCurrentPersonality().name).toBe('creative');

      // Verify all transitions were recorded
      expect(eventSpy).toHaveBeenCalledTimes(3);
      const history = personalityManager.getTransitionHistory();
      expect(history).toHaveLength(3);
      expect(history[0].to).toBe('helpful');
      expect(history[1].to).toBe('efficient');
      expect(history[2].to).toBe('creative');
    });

    it('should not emit events when personality stays the same', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      // Multiple help requests
      await personalityManager.analyzeAndSwitch('Help me with this');
      await personalityManager.analyzeAndSwitch('Can you help me with that?');
      await personalityManager.analyzeAndSwitch('Please help');

      // Only first switch should emit event (from default to helpful)
      expect(eventSpy).toHaveBeenCalledTimes(1);
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

  describe('Statistics and History', () => {
    it('should track comprehensive statistics across conversation', async () => {
      await personalityManager.analyzeAndSwitch('Help me', {
        expertiseLevel: 'beginner',
      });
      await personalityManager.analyzeAndSwitch('Quick answer', {
        expertiseLevel: 'expert',
      });
      await personalityManager.analyzeAndSwitch('Creative ideas');
      await personalityManager.analyzeAndSwitch('Analyze this');

      const stats = personalityManager.getStatistics();

      expect(stats.totalTransitions).toBe(4);
      expect(stats.currentPersonality).toBe('analytical');
      expect(stats.personalityUsage.helpful).toBeGreaterThan(0);
      expect(stats.personalityUsage.efficient).toBeGreaterThan(0);
      expect(stats.personalityUsage.creative).toBeGreaterThan(0);
      expect(stats.personalityUsage.analytical).toBeGreaterThan(0);
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(stats.averageConfidence).toBeLessThanOrEqual(1);
    });

    it('should maintain accurate history with timestamps', async () => {
      const startTime = new Date();

      await personalityManager.analyzeAndSwitch('Help');
      await new Promise(resolve => setTimeout(resolve, 10));
      await personalityManager.analyzeAndSwitch('Quick');
      await new Promise(resolve => setTimeout(resolve, 10));
      await personalityManager.analyzeAndSwitch('Ideas');

      const history = personalityManager.getTransitionHistory();
      const endTime = new Date();

      expect(history).toHaveLength(3);
      
      // Verify timestamps are in order
      expect(history[0].timestamp.getTime()).toBeLessThan(
        history[1].timestamp.getTime()
      );
      expect(history[1].timestamp.getTime()).toBeLessThan(
        history[2].timestamp.getTime()
      );

      // Verify timestamps are within test execution time
      for (const transition of history) {
        expect(transition.timestamp.getTime()).toBeGreaterThanOrEqual(
          startTime.getTime()
        );
        expect(transition.timestamp.getTime()).toBeLessThanOrEqual(
          endTime.getTime()
        );
      }
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
    it('should emit events that can be consumed by other systems', async () => {
      const allEvents: any[] = [];
      events.on('*', (event) => {
        allEvents.push(event);
      });

      await personalityManager.analyzeAndSwitch('Help me');
      await personalityManager.analyzeAndSwitch('Quick answer');

      expect(allEvents.length).toBeGreaterThan(0);
      
      const personalityEvents = allEvents.filter(
        e => e.type === 'personality.switched'
      );
      expect(personalityEvents).toHaveLength(2);
    });

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

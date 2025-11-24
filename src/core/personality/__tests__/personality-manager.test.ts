import { PersonalityManager } from '../personality-manager';
import { EventEmitter } from '../../events';
import { PersonalityType, PersonalityConfig } from '../types';

describe('PersonalityManager', () => {
  let events: EventEmitter;
  let manager: PersonalityManager;

  beforeEach(() => {
    events = new EventEmitter();
    manager = new PersonalityManager(events);
  });

  describe('constructor', () => {
    it('should initialize with default personality', () => {
      const manager = new PersonalityManager(events);
      
      expect(manager.getCurrentPersonality().name).toBe('helpful');
    });

    it('should accept custom default personality', () => {
      const config: Partial<PersonalityConfig> = {
        defaultPersonality: 'efficient',
      };
      const manager = new PersonalityManager(events, config);
      
      expect(manager.getCurrentPersonality().name).toBe('efficient');
    });

    it('should accept custom confidence threshold', () => {
      const config: Partial<PersonalityConfig> = {
        confidenceThreshold: 0.5,
      };
      const manager = new PersonalityManager(events, config);
      
      expect(manager).toBeDefined();
    });

    it('should accept custom max history length', () => {
      const config: Partial<PersonalityConfig> = {
        maxHistoryLength: 5,
      };
      const manager = new PersonalityManager(events, config);
      
      expect(manager).toBeDefined();
    });

    it('should allow disabling dynamic switching', () => {
      const config: Partial<PersonalityConfig> = {
        allowDynamicSwitching: false,
      };
      const manager = new PersonalityManager(events, config);
      
      expect(manager.isDynamicSwitchingEnabled()).toBe(false);
    });
  });

  describe('getCurrentPersonality', () => {
    it('should return the current personality', () => {
      const personality = manager.getCurrentPersonality();
      
      expect(personality).toBeDefined();
      expect(personality.name).toBe('helpful');
    });

    it('should return updated personality after switch', async () => {
      await manager.switchPersonality('efficient');
      
      const personality = manager.getCurrentPersonality();
      expect(personality.name).toBe('efficient');
    });
  });

  describe('switchPersonality', () => {
    it('should switch to a different personality', async () => {
      await manager.switchPersonality('efficient');
      
      expect(manager.getCurrentPersonality().name).toBe('efficient');
    });

    it('should emit personality.switched event', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      await manager.switchPersonality('efficient', 'Test switch');

      expect(eventSpy).toHaveBeenCalledTimes(1);
      const event = eventSpy.mock.calls[0][0];
      expect(event.type).toBe('personality.switched');
      expect(event.payload.from).toBe('helpful');
      expect(event.payload.to).toBe('efficient');
      expect(event.payload.reason).toBe('Test switch');
    });

    it('should add transition to history', async () => {
      await manager.switchPersonality('efficient', 'Test switch', 0.9);
      
      const history = manager.getTransitionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].from).toBe('helpful');
      expect(history[0].to).toBe('efficient');
      expect(history[0].reason).toBe('Test switch');
      expect(history[0].confidence).toBe(0.9);
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should not switch if already using target personality', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      await manager.switchPersonality('helpful');

      expect(eventSpy).not.toHaveBeenCalled();
      expect(manager.getTransitionHistory()).toHaveLength(0);
    });

    it('should throw error for unknown personality type', async () => {
      await expect(
        manager.switchPersonality('nonexistent' as PersonalityType)
      ).rejects.toThrow('Unknown personality type');
    });

    it('should use default reason when not provided', async () => {
      await manager.switchPersonality('efficient');
      
      const history = manager.getTransitionHistory();
      expect(history[0].reason).toBe('Manual switch');
    });

    it('should use default confidence of 1.0 when not provided', async () => {
      await manager.switchPersonality('efficient');
      
      const history = manager.getTransitionHistory();
      expect(history[0].confidence).toBe(1.0);
    });

    it('should trim history when exceeding max length', async () => {
      const config: Partial<PersonalityConfig> = {
        maxHistoryLength: 3,
      };
      const manager = new PersonalityManager(events, config);

      // Make 5 switches
      await manager.switchPersonality('efficient');
      await manager.switchPersonality('creative');
      await manager.switchPersonality('analytical');
      await manager.switchPersonality('casual');
      await manager.switchPersonality('helpful');

      const history = manager.getTransitionHistory();
      expect(history).toHaveLength(3);
      // Should keep the most recent 3
      expect(history[0].to).toBe('analytical');
      expect(history[1].to).toBe('casual');
      expect(history[2].to).toBe('helpful');
    });
  });

  describe('analyzeAndSwitch', () => {
    it('should analyze input and switch personality', async () => {
      const match = await manager.analyzeAndSwitch('Give me a quick answer');
      
      expect(match.personality.name).toBe('efficient');
      expect(manager.getCurrentPersonality().name).toBe('efficient');
    });

    it('should not switch if dynamic switching is disabled', async () => {
      const config: Partial<PersonalityConfig> = {
        allowDynamicSwitching: false,
      };
      const manager = new PersonalityManager(events, config);

      const match = await manager.analyzeAndSwitch('Give me a quick answer');
      
      expect(match.personality.name).toBe('efficient');
      expect(manager.getCurrentPersonality().name).toBe('helpful'); // Still default
    });

    it('should accept additional context', async () => {
      const match = await manager.analyzeAndSwitch('Help', {
        expertiseLevel: 'beginner',
        currentTask: 'learning',
      });
      
      expect(match.personality.name).toBe('helpful');
    });

    it('should respect preferred personality in context', async () => {
      const match = await manager.analyzeAndSwitch('Anything', {
        preferredPersonality: 'creative',
      });
      
      expect(match.personality.name).toBe('creative');
      expect(match.confidence).toBe(1.0);
    });

    it('should emit event when switching', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      await manager.analyzeAndSwitch('quick answer');

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should not emit event if personality stays the same', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      await manager.analyzeAndSwitch('Can you help me?');

      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset to default personality', async () => {
      await manager.switchPersonality('efficient');
      expect(manager.getCurrentPersonality().name).toBe('efficient');

      await manager.reset();
      
      expect(manager.getCurrentPersonality().name).toBe('helpful');
    });

    it('should reset to custom default personality', async () => {
      const config: Partial<PersonalityConfig> = {
        defaultPersonality: 'analytical',
      };
      const manager = new PersonalityManager(events, config);

      await manager.switchPersonality('efficient');
      await manager.reset();
      
      expect(manager.getCurrentPersonality().name).toBe('analytical');
    });

    it('should use custom reason when provided', async () => {
      await manager.switchPersonality('efficient');
      await manager.reset('User requested reset');
      
      const history = manager.getTransitionHistory();
      const lastTransition = history[history.length - 1];
      expect(lastTransition.reason).toBe('User requested reset');
    });

    it('should emit event on reset', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      await manager.switchPersonality('efficient');
      eventSpy.mockClear();
      
      await manager.reset();

      expect(eventSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTransitionHistory', () => {
    it('should return empty array initially', () => {
      const history = manager.getTransitionHistory();
      
      expect(history).toEqual([]);
    });

    it('should return all transitions', async () => {
      await manager.switchPersonality('efficient');
      await manager.switchPersonality('creative');
      await manager.switchPersonality('analytical');
      
      const history = manager.getTransitionHistory();
      expect(history).toHaveLength(3);
    });

    it('should return immutable copy of history', async () => {
      await manager.switchPersonality('efficient');
      
      const history1 = manager.getTransitionHistory();
      const history2 = manager.getTransitionHistory();
      
      expect(history1).not.toBe(history2); // Different array instances
      expect(history1).toEqual(history2); // Same content
    });

    it('should include all transition details', async () => {
      await manager.switchPersonality('efficient', 'Test reason', 0.85);
      
      const history = manager.getTransitionHistory();
      const transition = history[0];
      
      expect(transition.from).toBe('helpful');
      expect(transition.to).toBe('efficient');
      expect(transition.reason).toBe('Test reason');
      expect(transition.confidence).toBe(0.85);
      expect(transition.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for current state', () => {
      const stats = manager.getStatistics();
      
      expect(stats.currentPersonality).toBe('helpful');
      expect(stats.totalTransitions).toBe(0);
      expect(stats.personalityUsage).toEqual({ helpful: 1 });
      expect(stats.averageConfidence).toBe(1.0);
    });

    it('should track personality usage', async () => {
      await manager.switchPersonality('efficient');
      await manager.switchPersonality('creative');
      await manager.switchPersonality('efficient');
      
      const stats = manager.getStatistics();
      
      expect(stats.currentPersonality).toBe('efficient');
      expect(stats.totalTransitions).toBe(3);
      expect(stats.personalityUsage.efficient).toBe(3); // Current + 2 transitions
      expect(stats.personalityUsage.creative).toBe(1);
    });

    it('should calculate average confidence', async () => {
      await manager.switchPersonality('efficient', 'Test', 0.8);
      await manager.switchPersonality('creative', 'Test', 0.6);
      await manager.switchPersonality('analytical', 'Test', 1.0);
      
      const stats = manager.getStatistics();
      
      expect(stats.averageConfidence).toBeCloseTo(0.8, 1); // (0.8 + 0.6 + 1.0) / 3
    });

    it('should handle no transitions', () => {
      const stats = manager.getStatistics();
      
      expect(stats.averageConfidence).toBe(1.0);
    });
  });

  describe('getSystemPrompt', () => {
    it('should return system prompt for current personality', () => {
      const prompt = manager.getSystemPrompt();
      
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should return updated prompt after switch', async () => {
      const prompt1 = manager.getSystemPrompt();
      
      await manager.switchPersonality('efficient');
      const prompt2 = manager.getSystemPrompt();
      
      expect(prompt1).not.toBe(prompt2);
    });
  });

  describe('isDynamicSwitchingEnabled', () => {
    it('should return true by default', () => {
      expect(manager.isDynamicSwitchingEnabled()).toBe(true);
    });

    it('should return false when disabled in config', () => {
      const config: Partial<PersonalityConfig> = {
        allowDynamicSwitching: false,
      };
      const manager = new PersonalityManager(events, config);
      
      expect(manager.isDynamicSwitchingEnabled()).toBe(false);
    });
  });

  describe('setDynamicSwitching', () => {
    it('should enable dynamic switching', () => {
      const config: Partial<PersonalityConfig> = {
        allowDynamicSwitching: false,
      };
      const manager = new PersonalityManager(events, config);
      
      manager.setDynamicSwitching(true);
      
      expect(manager.isDynamicSwitchingEnabled()).toBe(true);
    });

    it('should disable dynamic switching', () => {
      manager.setDynamicSwitching(false);
      
      expect(manager.isDynamicSwitchingEnabled()).toBe(false);
    });

    it('should affect analyzeAndSwitch behavior', async () => {
      manager.setDynamicSwitching(false);
      
      const match = await manager.analyzeAndSwitch('quick answer');
      
      expect(match.personality.name).toBe('efficient');
      expect(manager.getCurrentPersonality().name).toBe('helpful'); // Didn't switch
    });
  });

  describe('event emission', () => {
    it('should emit events with correct structure', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      await manager.switchPersonality('efficient', 'Test', 0.9);

      expect(eventSpy).toHaveBeenCalledTimes(1);
      const event = eventSpy.mock.calls[0][0];
      
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type', 'personality.switched');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('payload');
      expect(event).toHaveProperty('metadata');
      expect(event.metadata.source).toBe('personality-manager');
    });

    it('should emit unique event IDs', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      await manager.switchPersonality('efficient');
      await manager.switchPersonality('creative');

      const event1 = eventSpy.mock.calls[0][0];
      const event2 = eventSpy.mock.calls[1][0];
      
      expect(event1.id).not.toBe(event2.id);
    });

    it('should include confidence in event payload', async () => {
      const eventSpy = jest.fn();
      events.on('personality.switched', eventSpy);

      await manager.switchPersonality('efficient', 'Test', 0.75);

      const event = eventSpy.mock.calls[0][0];
      expect(event.payload.confidence).toBe(0.75);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive switches', async () => {
      await manager.switchPersonality('efficient');
      await manager.switchPersonality('creative');
      await manager.switchPersonality('analytical');
      await manager.switchPersonality('casual');
      
      expect(manager.getCurrentPersonality().name).toBe('casual');
      expect(manager.getTransitionHistory()).toHaveLength(4);
    });

    it('should handle switching back and forth', async () => {
      await manager.switchPersonality('efficient');
      await manager.switchPersonality('helpful');
      await manager.switchPersonality('efficient');
      
      const history = manager.getTransitionHistory();
      expect(history).toHaveLength(3);
      expect(history[0].to).toBe('efficient');
      expect(history[1].to).toBe('helpful');
      expect(history[2].to).toBe('efficient');
    });

    it('should handle empty input in analyzeAndSwitch', async () => {
      const match = await manager.analyzeAndSwitch('');
      
      expect(match.personality).toBeDefined();
    });

    it('should handle very long input in analyzeAndSwitch', async () => {
      const longInput = 'help me '.repeat(1000);
      const match = await manager.analyzeAndSwitch(longInput);
      
      expect(match.personality).toBeDefined();
    });
  });

  describe('integration with ContextAnalyzer and PersonalitySelector', () => {
    it('should properly analyze context and select personality', async () => {
      const match = await manager.analyzeAndSwitch(
        'Can you help me understand this complex debugging issue?',
        {
          expertiseLevel: 'beginner',
          currentTask: 'debugging',
        }
      );
      
      expect(match.personality).toBeDefined();
      expect(match.confidence).toBeGreaterThan(0);
      expect(match.reason).toBeDefined();
    });

    it('should handle context with metadata', async () => {
      const match = await manager.analyzeAndSwitch('Quick fix needed', {
        metadata: {
          urgency: 0.9,
          complexity: 0.3,
        },
      });
      
      expect(match.personality.name).toBe('efficient');
    });
  });
});

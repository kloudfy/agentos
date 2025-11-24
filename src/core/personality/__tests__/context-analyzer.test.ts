import { ContextAnalyzer } from '../context-analyzer';

describe('ContextAnalyzer', () => {
  let analyzer: ContextAnalyzer;

  beforeEach(() => {
    analyzer = new ContextAnalyzer();
  });

  describe('Basic Analysis', () => {
    it('should analyze simple input', () => {
      const context = analyzer.analyzeContext('How do I debug this error?');

      expect(context.userMessage).toBe('How do I debug this error?');
      expect(context.metadata).toBeDefined();
    });

    it('should extract keywords', () => {
      const context = analyzer.analyzeContext('How do I optimize performance?');

      const keywords = context.metadata?.keywords as string[];
      expect(keywords).toContain('optimize');
      expect(keywords).toContain('performance');
    });

    it('should detect patterns', () => {
      const context = analyzer.analyzeContext('How do I fix this bug?');

      const patterns = context.metadata?.patterns as string[];
      expect(patterns).toContain('question');
      expect(patterns).toContain('how-to');
      expect(patterns).toContain('problem-solving');
    });
  });

  describe('Task Detection', () => {
    it('should detect debugging task', () => {
      const context = analyzer.analyzeContext('Debug this error');

      expect(context.currentTask).toBe('debugging');
    });

    it('should detect optimization task', () => {
      const context = analyzer.analyzeContext('Optimize this code');

      expect(context.currentTask).toBe('optimization');
    });

    it('should detect learning task', () => {
      const context = analyzer.analyzeContext('Explain how this works');

      expect(context.currentTask).toBe('learning');
    });

    it('should detect design task', () => {
      const context = analyzer.analyzeContext('Design a new architecture');

      expect(context.currentTask).toBe('design');
    });
  });

  describe('Expertise Level Detection', () => {
    it('should detect beginner level', () => {
      const context = analyzer.analyzeContext("I'm new to this, help me understand");

      expect(context.expertiseLevel).toBe('beginner');
    });

    it('should detect expert level', () => {
      const context = analyzer.analyzeContext('Optimize production performance');

      expect(context.expertiseLevel).toBe('expert');
    });

    it('should default to intermediate', () => {
      const context = analyzer.analyzeContext('How does this work?');

      expect(context.expertiseLevel).toBe('intermediate');
    });
  });

  describe('Urgency Calculation', () => {
    it('should detect high urgency', () => {
      const context = analyzer.analyzeContext('Fix this critical bug ASAP!');

      const urgency = context.metadata?.urgency as number;
      expect(urgency).toBeGreaterThan(0.7);
    });

    it('should detect low urgency', () => {
      const context = analyzer.analyzeContext('When you have time, can you explain this?');

      const urgency = context.metadata?.urgency as number;
      expect(urgency).toBeLessThan(0.5);
    });

    it('should have default urgency', () => {
      const context = analyzer.analyzeContext('How does this work?');

      const urgency = context.metadata?.urgency as number;
      expect(urgency).toBeGreaterThanOrEqual(0.4);
      expect(urgency).toBeLessThanOrEqual(0.6);
    });
  });

  describe('Complexity Calculation', () => {
    it('should detect high complexity', () => {
      const context = analyzer.analyzeContext(
        'How do I integrate multiple complex systems with advanced architecture patterns?'
      );

      const complexity = context.metadata?.complexity as number;
      expect(complexity).toBeGreaterThan(0.6);
    });

    it('should detect low complexity', () => {
      const context = analyzer.analyzeContext('Just show me the basic syntax');

      const complexity = context.metadata?.complexity as number;
      expect(complexity).toBeLessThan(0.5);
    });
  });

  describe('Question Type Detection', () => {
    it('should detect how questions', () => {
      const context = analyzer.analyzeContext('How do I do this?');

      expect(context.metadata?.questionType).toBe('how');
    });

    it('should detect what questions', () => {
      const context = analyzer.analyzeContext('What is this?');

      expect(context.metadata?.questionType).toBe('what');
    });

    it('should detect why questions', () => {
      const context = analyzer.analyzeContext('Why does this happen?');

      expect(context.metadata?.questionType).toBe('why');
    });
  });

  describe('Additional Context', () => {
    it('should merge additional context', () => {
      const context = analyzer.analyzeContext('Test message', {
        conversationHistory: ['Previous message'],
        preferredPersonality: 'efficient',
      });

      expect(context.conversationHistory).toEqual(['Previous message']);
      expect(context.preferredPersonality).toBe('efficient');
    });
  });
});

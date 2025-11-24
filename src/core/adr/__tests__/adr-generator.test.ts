import { ADRGenerator } from '../adr-generator';
import { Change } from '../types';

describe('ADRGenerator', () => {
  let generator: ADRGenerator;

  beforeEach(() => {
    generator = new ADRGenerator();
  });

  describe('generateFromChanges', () => {
    it('should generate ADR from single change', () => {
      const changes: Change[] = [
        {
          type: 'method-signature-changed',
          target: 'Plugin.initialize',
          description: 'Changed from sync to async',
          breaking: true,
          before: 'initialize(): void',
          after: 'initialize(context: PluginContext): Promise<void>',
        },
      ];

      const adr = generator.generateFromChanges(changes, 1);

      expect(adr.number).toBe(1);
      expect(adr.title).toBeTruthy();
      expect(adr.context).toBeTruthy();
      expect(adr.decision).toBeTruthy();
      expect(adr.status).toBe('Proposed');
      expect(adr.metadata).toBeDefined();
    });

    it('should generate ADR from multiple changes', () => {
      const changes: Change[] = [
        {
          type: 'property-added',
          target: 'Plugin.version',
          description: 'Added version property',
          breaking: false,
          after: 'version: string',
        },
        {
          type: 'method-signature-changed',
          target: 'Plugin.initialize',
          description: 'Changed to async',
          breaking: true,
          before: 'initialize(): void',
          after: 'initialize(): Promise<void>',
        },
      ];

      const adr = generator.generateFromChanges(changes, 2, { author: 'Test Author' });

      expect(adr.number).toBe(2);
      expect(adr.consequences.positive.length).toBeGreaterThan(0);
      expect(adr.consequences.negative.length).toBeGreaterThan(0);
      expect(adr.alternatives).toBeDefined();
      expect(adr.alternatives!.length).toBeGreaterThan(0);
      expect(adr.metadata?.author).toBe('Test Author');
    });
  });

  describe('suggestContext', () => {
    it('should suggest context for breaking changes', () => {
      const changes: Change[] = [
        {
          type: 'interface-removed',
          target: 'OldInterface',
          description: 'Removed obsolete interface',
          breaking: true,
        },
      ];

      const context = generator.suggestContext(changes);

      expect(context).toContain('breaking');
      expect(context.length).toBeGreaterThan(50);
    });

    it('should suggest context for non-breaking changes', () => {
      const changes: Change[] = [
        {
          type: 'interface-added',
          target: 'NewInterface',
          description: 'Added new interface',
          breaking: false,
        },
      ];

      const context = generator.suggestContext(changes);

      expect(context.toLowerCase()).toContain('enhance');
      expect(context.length).toBeGreaterThan(50);
    });

    it('should mention async changes', () => {
      const changes: Change[] = [
        {
          type: 'method-signature-changed',
          target: 'Plugin.load',
          description: 'Made async',
          breaking: true,
          after: 'load(): Promise<void>',
        },
      ];

      const context = generator.suggestContext(changes);

      expect(context.toLowerCase()).toContain('async');
    });
  });

  describe('suggestConsequences', () => {
    it('should suggest positive consequences for new features', () => {
      const changes: Change[] = [
        {
          type: 'property-added',
          target: 'Plugin.metadata',
          description: 'Added metadata',
          breaking: false,
        },
      ];

      const consequences = generator.suggestConsequences(changes);

      expect(consequences.positive.length).toBeGreaterThan(0);
    });

    it('should suggest negative consequences for breaking changes', () => {
      const changes: Change[] = [
        {
          type: 'method-removed',
          target: 'Plugin.destroy',
          description: 'Removed method',
          breaking: true,
        },
      ];

      const consequences = generator.suggestConsequences(changes);

      expect(consequences.negative.length).toBeGreaterThan(0);
      // Just verify we have negative consequences for breaking changes
      expect(consequences.negative.length).toBeGreaterThanOrEqual(1);
    });

    it('should suggest neutral consequences', () => {
      const changes: Change[] = [
        {
          type: 'property-modified',
          target: 'Plugin.name',
          description: 'Changed type',
          breaking: true,
        },
      ];

      const consequences = generator.suggestConsequences(changes);

      expect(consequences.neutral.length).toBeGreaterThan(0);
    });

    it('should generate consequences for async changes', () => {
      const changes: Change[] = [
        {
          type: 'method-signature-changed',
          target: 'Plugin.initialize',
          description: 'Made async',
          breaking: true,
          after: 'initialize(): Promise<void>',
        },
      ];

      const consequences = generator.suggestConsequences(changes);

      // Verify we have consequences (positive, negative, or neutral)
      const totalConsequences = 
        consequences.positive.length + 
        consequences.negative.length + 
        consequences.neutral.length;
      expect(totalConsequences).toBeGreaterThan(0);
    });
  });
});

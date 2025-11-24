import { generateADR, generateFilename } from '../adr-template';
import { ADRData } from '../types';

describe('ADR Template', () => {
  const baseADR: ADRData = {
    number: 1,
    title: 'Use Event-Driven Architecture',
    date: new Date('2024-01-15'),
    status: 'Accepted',
    context: 'We need a way to decouple system components.',
    decision: 'We will use an event-driven architecture.',
    consequences: {
      positive: ['Loose coupling', 'Easy to extend'],
      negative: ['More complex', 'Harder to debug'],
      neutral: ['Requires documentation'],
    },
  };

  describe('generateADR', () => {
    it('should generate basic ADR', () => {
      const markdown = generateADR(baseADR);

      expect(markdown).toContain('# ADR-0001: Use Event-Driven Architecture');
      expect(markdown).toContain('**Status:** Accepted');
      expect(markdown).toContain('**Date:** 2024-01-15');
      expect(markdown).toContain('## Context');
      expect(markdown).toContain('## Decision');
      expect(markdown).toContain('## Consequences');
    });

    it('should include positive consequences', () => {
      const markdown = generateADR(baseADR);

      expect(markdown).toContain('### Positive');
      expect(markdown).toContain('- Loose coupling');
      expect(markdown).toContain('- Easy to extend');
    });

    it('should include negative consequences', () => {
      const markdown = generateADR(baseADR);

      expect(markdown).toContain('### Negative');
      expect(markdown).toContain('- More complex');
    });

    it('should include metadata when provided', () => {
      const adr: ADRData = {
        ...baseADR,
        metadata: {
          author: 'John Doe',
          tags: ['architecture', 'events'],
        },
      };

      const markdown = generateADR(adr);

      expect(markdown).toContain('**Author:** John Doe');
      expect(markdown).toContain('**Tags:** architecture, events');
    });

    it('should include alternatives when provided', () => {
      const adr: ADRData = {
        ...baseADR,
        alternatives: [
          {
            name: 'Direct Coupling',
            description: 'Use direct method calls',
            pros: ['Simple', 'Fast'],
            cons: ['Tight coupling'],
            rejectionReason: 'Too tightly coupled',
          },
        ],
      };

      const markdown = generateADR(adr);

      expect(markdown).toContain('## Alternatives Considered');
      expect(markdown).toContain('### Alternative 1: Direct Coupling');
      expect(markdown).toContain('**Reason for rejection:** Too tightly coupled');
    });

    it('should include related ADRs when provided', () => {
      const adr: ADRData = {
        ...baseADR,
        relatedADRs: [2, 3],
      };

      const markdown = generateADR(adr);

      expect(markdown).toContain('## Related Decisions');
      expect(markdown).toContain('- ADR-0002');
      expect(markdown).toContain('- ADR-0003');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with number and slug', () => {
      const filename = generateFilename(baseADR);

      expect(filename).toBe('0001-use-event-driven-architecture.md');
    });

    it('should handle special characters in title', () => {
      const adr: ADRData = {
        ...baseADR,
        title: 'Use TypeScript & ESLint!',
      };

      const filename = generateFilename(adr);

      expect(filename).toBe('0001-use-typescript-eslint.md');
    });

    it('should pad numbers with zeros', () => {
      const adr: ADRData = {
        ...baseADR,
        number: 42,
      };

      const filename = generateFilename(adr);

      expect(filename).toMatch(/^0042-/);
    });

    it('should truncate long titles', () => {
      const adr: ADRData = {
        ...baseADR,
        title: 'A'.repeat(100),
      };

      const filename = generateFilename(adr);

      expect(filename.length).toBeLessThan(70); // 4 (number) + 1 (dash) + 60 (slug) + 3 (.md)
    });
  });
});

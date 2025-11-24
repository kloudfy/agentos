import { ADRDetector } from '../adr-detector';

describe('ADRDetector', () => {
  let detector: ADRDetector;

  beforeEach(() => {
    detector = new ADRDetector();
  });

  describe('detectInterfaceChanges', () => {
    it('should detect added interface', () => {
      const oldCode = '';
      const newCode = `
        interface Plugin {
          name: string;
        }
      `;

      const changes = detector.detectInterfaceChanges(oldCode, newCode);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('interface-added');
      expect(changes[0].target).toBe('Plugin');
      expect(changes[0].breaking).toBe(false);
    });

    it('should detect removed interface', () => {
      const oldCode = `
        interface Plugin {
          name: string;
        }
      `;
      const newCode = '';

      const changes = detector.detectInterfaceChanges(oldCode, newCode);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('interface-removed');
      expect(changes[0].target).toBe('Plugin');
      expect(changes[0].breaking).toBe(true);
    });

    it('should detect added property', () => {
      const oldCode = `
        interface Plugin {
          name: string;
        }
      `;
      const newCode = `
        interface Plugin {
          name: string;
          version: string;
        }
      `;

      const changes = detector.detectInterfaceChanges(oldCode, newCode);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('property-added');
      expect(changes[0].target).toBe('Plugin.version');
      expect(changes[0].breaking).toBe(true); // Required property
    });

    it('should detect optional property as non-breaking', () => {
      const oldCode = `
        interface Plugin {
          name: string;
        }
      `;
      const newCode = `
        interface Plugin {
          name: string;
          version?: string;
        }
      `;

      const changes = detector.detectInterfaceChanges(oldCode, newCode);

      expect(changes).toHaveLength(1);
      expect(changes[0].breaking).toBe(false); // Optional property
    });

    it('should detect removed property', () => {
      const oldCode = `
        interface Plugin {
          name: string;
          version: string;
        }
      `;
      const newCode = `
        interface Plugin {
          name: string;
        }
      `;

      const changes = detector.detectInterfaceChanges(oldCode, newCode);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('property-removed');
      expect(changes[0].target).toBe('Plugin.version');
      expect(changes[0].breaking).toBe(true);
    });

    it('should detect modified property', () => {
      const oldCode = `
        interface Plugin {
          name: string;
        }
      `;
      const newCode = `
        interface Plugin {
          name: number;
        }
      `;

      const changes = detector.detectInterfaceChanges(oldCode, newCode);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('property-modified');
      expect(changes[0].target).toBe('Plugin.name');
      expect(changes[0].breaking).toBe(true);
    });

    it('should detect multiple changes', () => {
      const oldCode = `
        interface Plugin {
          name: string;
          version: string;
        }
      `;
      const newCode = `
        interface Plugin {
          name: string;
          id: number;
        }
        interface NewInterface {
          value: string;
        }
      `;

      const changes = detector.detectInterfaceChanges(oldCode, newCode);

      expect(changes.length).toBeGreaterThan(1);
    });
  });

  describe('detectBreakingChanges', () => {
    it('should filter only breaking changes', () => {
      const changes = [
        {
          type: 'property-added' as const,
          target: 'Plugin.optional',
          description: 'Added optional property',
          breaking: false,
        },
        {
          type: 'property-removed' as const,
          target: 'Plugin.required',
          description: 'Removed property',
          breaking: true,
        },
      ];

      const breaking = detector.detectBreakingChanges(changes);

      expect(breaking).toHaveLength(1);
      expect(breaking[0].target).toBe('Plugin.required');
    });
  });

  describe('analyzeImpact', () => {
    it('should analyze low severity for no breaking changes', () => {
      const changes = [
        {
          type: 'property-added' as const,
          target: 'Plugin.optional',
          description: 'Added optional property',
          breaking: false,
        },
      ];

      const impact = detector.analyzeImpact(changes);

      expect(impact.severity).toBe('low');
      expect(impact.breakingChangesCount).toBe(0);
      expect(impact.migrationEffort).toBe('trivial');
    });

    it('should analyze medium severity for few breaking changes', () => {
      const changes = [
        {
          type: 'property-removed' as const,
          target: 'Plugin.name',
          description: 'Removed property',
          breaking: true,
        },
      ];

      const impact = detector.analyzeImpact(changes);

      expect(impact.severity).toBe('medium');
      expect(impact.breakingChangesCount).toBe(1);
      expect(impact.migrationEffort).toBe('low');
    });

    it('should analyze high severity for many breaking changes', () => {
      const changes = Array.from({ length: 4 }, (_, i) => ({
        type: 'property-removed' as const,
        target: `Plugin.prop${i}`,
        description: `Removed property ${i}`,
        breaking: true,
      }));

      const impact = detector.analyzeImpact(changes);

      expect(impact.severity).toBe('high');
      expect(impact.breakingChangesCount).toBe(4);
    });

    it('should include recommendations', () => {
      const changes = [
        {
          type: 'property-removed' as const,
          target: 'Plugin.name',
          description: 'Removed property',
          breaking: true,
        },
      ];

      const impact = detector.analyzeImpact(changes);

      expect(impact.recommendations.length).toBeGreaterThan(0);
      expect(impact.recommendations.some(r => r.includes('version'))).toBe(true);
    });

    it('should identify affected systems', () => {
      const changes = [
        {
          type: 'property-removed' as const,
          target: 'Plugin.name',
          description: 'Removed property',
          breaking: true,
          file: 'src/core/plugins/types.ts',
        },
      ];

      const impact = detector.analyzeImpact(changes);

      expect(impact.affectedSystems).toContain('Plugin');
    });
  });
});

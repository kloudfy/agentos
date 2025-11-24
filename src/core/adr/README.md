# ADR (Architecture Decision Record) Module

Automatically generates Architecture Decision Records when interface changes are detected in TypeScript code.

## Overview

The ADR module provides automated detection and documentation of architectural decisions based on code changes. It analyzes TypeScript interfaces, detects breaking changes, and generates comprehensive ADR documents following industry best practices.

## Features

- **Automatic Change Detection**: Detects interface, method, and property changes
- **Breaking Change Analysis**: Identifies changes that break backward compatibility
- **Impact Assessment**: Analyzes severity and affected systems
- **Smart Content Generation**: Suggests context, consequences, and alternatives
- **Standard ADR Format**: Generates markdown documents following ADR conventions
- **Comprehensive Testing**: 41 tests with >90% coverage

## Components

### 1. ADRDetector

Detects changes in TypeScript code and analyzes their impact.

```typescript
import { ADRDetector } from '@/core/adr';

const detector = new ADRDetector();

// Detect changes between old and new code
const changes = detector.detectInterfaceChanges(oldCode, newCode);

// Identify breaking changes
const breakingChanges = detector.detectBreakingChanges(changes);

// Analyze impact
const impact = detector.analyzeImpact(changes);
console.log(`Severity: ${impact.severity}`);
console.log(`Affected systems: ${impact.affectedSystems.join(', ')}`);
```

**Detected Change Types:**
- `interface-added` / `interface-removed` / `interface-modified`
- `property-added` / `property-removed` / `property-modified`
- `method-added` / `method-removed` / `method-signature-changed`
- `type-changed`

### 2. ADRGenerator

Generates ADR content from detected changes.

```typescript
import { ADRGenerator } from '@/core/adr';

const generator = new ADRGenerator();

// Generate complete ADR
const adr = generator.generateFromChanges(changes, 5, {
  author: 'John Doe',
  tags: ['breaking-change', 'plugin-system'],
  status: 'Proposed'
});

console.log(adr.title);
console.log(adr.context);
console.log(adr.decision);
```

**Generated Sections:**
- Title (auto-generated from changes)
- Context (why the decision is needed)
- Decision (what we're deciding)
- Consequences (positive, negative, neutral)
- Alternatives (other approaches considered)

### 3. ADRManager

Manages ADR files - saving, loading, and updating.

```typescript
import { ADRManager } from '@/core/adr';

const manager = new ADRManager('docs/adr');

// Get next ADR number
const number = await manager.getNextNumber(); // Returns 1, 2, 3, etc.

// Save ADR
const filepath = await manager.saveADR(adr);
console.log(`Saved to: ${filepath}`);

// Load ADR
const loaded = await manager.loadADR(filepath);

// List all ADRs
const allADRs = await manager.listADRs();

// Update status
await manager.updateStatus(5, 'Accepted');
```

### 4. Template Functions

Generate markdown from ADR data.

```typescript
import { generateADR, generateFilename } from '@/core/adr';

// Generate markdown content
const markdown = generateADR(adr, {
  includeAlternatives: true,
  includeMetadata: true,
  dateFormat: 'YYYY-MM-DD'
});

// Generate filename
const filename = generateFilename(adr); // "0005-change-plugin-initialize-to-async.md"
```

## Complete Example

```typescript
import { ADRDetector, ADRGenerator, ADRManager } from '@/core/adr';

// 1. Detect changes
const detector = new ADRDetector();
const changes = detector.detectInterfaceChanges(oldCode, newCode);

if (changes.length === 0) {
  console.log('No changes detected');
  return;
}

// 2. Analyze impact
const impact = detector.analyzeImpact(changes);
console.log(`Impact: ${impact.severity}`);
console.log(`Breaking changes: ${impact.breakingChanges}`);

// 3. Generate ADR
const generator = new ADRGenerator();
const manager = new ADRManager('docs/adr');
const number = await manager.getNextNumber();

const adr = generator.generateFromChanges(changes, number, {
  author: 'System',
  tags: ['automated', 'interface-change']
});

// 4. Save ADR
const filepath = await manager.saveADR(adr);
console.log(`ADR saved: ${filepath}`);

// 5. Review and update status
// ... after review ...
await manager.updateStatus(number, 'Accepted');
```

## ADR File Format

Generated ADRs follow this structure:

```markdown
# ADR-0005: Change Plugin.initialize to Async

**Date:** 2024-01-15

**Author:** System

## Status

**Proposed**

## Context

The current interface design has 1 breaking change(s) that need to be addressed...

## Decision

We will implement the following changes:

**Plugin:**
- Changed from sync to async ⚠️ **Breaking Change**
  - Before: `initialize(): void`
  - After: `initialize(context: PluginContext): Promise<void>`

## Consequences

### Positive

- Better async support
- Runtime context access

### Negative

- Breaking change requires migration
- Migration effort required

### Neutral

- Documentation needs updating
- Version bump required (major version)

## Alternatives Considered

### Gradual Migration with Deprecation

**Description:** Keep existing APIs and add new ones alongside...

**Reason for rejection:** Would create API confusion...
```

## Types

### Change

```typescript
interface Change {
  readonly type: ChangeType;
  readonly target: string;
  readonly description: string;
  readonly breaking: boolean;
  readonly before?: string;
  readonly after?: string;
  readonly location?: {
    readonly file: string;
    readonly line?: number;
  };
}
```

### ImpactAnalysis

```typescript
interface ImpactAnalysis {
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly affectedSystems: readonly string[];
  readonly breakingChanges: number;
  readonly estimatedEffort: 'low' | 'medium' | 'high';
  readonly recommendations: readonly string[];
  readonly migrationComplexity?: 'simple' | 'moderate' | 'complex';
  readonly backwardCompatible: boolean;
}
```

### ADRData

```typescript
interface ADRData {
  readonly number: number;
  readonly title: string;
  readonly date: Date;
  readonly status: 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';
  readonly context: string;
  readonly decision: string;
  readonly consequences: {
    readonly positive: readonly string[];
    readonly negative: readonly string[];
    readonly neutral: readonly string[];
  };
  readonly alternatives?: readonly {
    readonly name: string;
    readonly description: string;
    readonly pros: readonly string[];
    readonly cons: readonly string[];
    readonly rejectionReason: string;
  }[];
  readonly relatedADRs?: readonly number[];
  readonly metadata?: {
    readonly author?: string;
    readonly reviewers?: readonly string[];
    readonly tags?: readonly string[];
  };
}
```

## Integration with Kiro

The ADR module can be integrated with Kiro hooks to automatically generate ADRs when interfaces change:

```markdown
# .kiro/hooks/adr-generator.md

name: ADR Generator
trigger: on_file_save
filePattern: "src/**/*.ts"

## Instructions

When TypeScript interface files are saved:
1. Compare with previous version
2. Detect interface changes
3. If breaking changes detected, generate ADR
4. Save to docs/adr/
5. Notify developer
```

## Testing

Run tests:

```bash
# All ADR tests
npm test -- src/core/adr

# Specific test file
npm test -- src/core/adr/__tests__/adr-detector.test.ts

# With coverage
npm test -- src/core/adr --coverage
```

## Best Practices

1. **Review Generated ADRs**: Always review and edit generated ADRs before finalizing
2. **Add Context**: Enhance the context section with business rationale
3. **Document Alternatives**: Add any alternatives you considered
4. **Update Status**: Change status from "Proposed" to "Accepted" after approval
5. **Link Related ADRs**: Reference related decisions using `relatedADRs`

## Architecture Alignment

This module follows AgentOS architecture principles:

- **Event-Driven**: Can emit events when ADRs are generated
- **Immutable Data**: All data structures are readonly
- **Pure Functions**: Detection and generation logic is pure
- **Dependency Injection**: Components accept dependencies via constructor
- **Type Safety**: Full TypeScript strict mode compliance

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Architecture Decision Records (ADRs)](https://github.com/joelparkerhenderson/architecture-decision-record)

## License

Part of AgentOS - see main project license.

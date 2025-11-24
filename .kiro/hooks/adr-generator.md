---
name: ADR Generator
description: Automatically generates Architecture Decision Records when interface files change
enabled: true
trigger: file-change
priority: medium
---

# ADR Generator Hook

## Overview
This hook automatically generates Architecture Decision Records (ADRs) when interface files or type definitions change, ensuring architectural decisions are documented and tracked over time.

## Trigger Configuration

**Event:** `file-change`

**File Patterns:**
- `src/**/types.ts`
- `src/**/interfaces.ts`
- `src/**/*.interface.ts`
- `src/core/*/index.ts` (public API exports)

**Debounce:** 5000ms (wait 5 seconds after last change)

**Conditions:**
- File must be committed (not just saved)
- Changes must affect public interfaces
- Breaking changes trigger immediate generation

## ADR Structure

### Template

```markdown
# ADR-{number}: {Title}

**Status:** {Proposed|Accepted|Deprecated|Superseded}

**Date:** {YYYY-MM-DD}

**Author:** {Git commit author}

**Tags:** {architecture, api, breaking-change, etc.}

## Context

{What is the issue we're facing? What factors are driving this decision?}

## Decision

{What is the change we're making? What new interface/type/API are we introducing?}

## Consequences

### Positive
- {Benefit 1}
- {Benefit 2}

### Negative
- {Trade-off 1}
- {Trade-off 2}

### Neutral
- {Impact 1}
- {Impact 2}

## Alternatives Considered

### Alternative 1: {Name}
- **Description:** {What was considered}
- **Pros:** {Benefits}
- **Cons:** {Drawbacks}
- **Reason for rejection:** {Why not chosen}

### Alternative 2: {Name}
- **Description:** {What was considered}
- **Pros:** {Benefits}
- **Cons:** {Drawbacks}
- **Reason for rejection:** {Why not chosen}

## Related Decisions

- ADR-{number}: {Related decision}
- ADR-{number}: {Related decision}

## Implementation Notes

{Technical details, migration path, compatibility notes}

## References

- {Link to PR}
- {Link to issue}
- {Link to documentation}
```

## Detection Logic

### Breaking Changes

Automatically detect:
1. **Removed Properties:** Property deleted from interface
2. **Type Changes:** Property type changed incompatibly
3. **Required Fields:** Optional property made required
4. **Method Signature Changes:** Parameters or return type changed
5. **Removed Methods:** Public method deleted

### Non-Breaking Changes

Detect but mark as minor:
1. **Added Properties:** New optional property
2. **Extended Types:** Interface extended with new methods
3. **Relaxed Types:** Type made more permissive
4. **Documentation Changes:** JSDoc updates

### Example Detection

```typescript
// Before (ADR-0001)
interface Plugin {
  name: string;
  version: string;
  initialize(): void;
}

// After (triggers ADR-0002)
interface Plugin {
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<void>; // Breaking change
  metadata?: PluginMetadata; // Non-breaking addition
}
```

**Generated ADR Title:** "Change Plugin.initialize to async with context parameter"

## ADR Numbering

### Sequential Numbering

```
docs/adr/
  0001-event-system-architecture.md
  0002-plugin-dependency-resolution.md
  0003-state-persistence-strategy.md
  0004-personality-switching-mechanism.md
  0005-plugin-initialize-async-context.md
```

**Format:** `{number:04d}-{slug}.md`

**Number Source:** Highest existing number + 1

### Slug Generation

```typescript
// Title: "Change Plugin.initialize to async with context parameter"
// Slug:  "change-plugin-initialize-to-async-with-context-parameter"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}
```

## Content Generation

### Context Analysis

Analyze git history and code changes:

```typescript
const context = {
  changedFiles: ['src/core/plugins/plugin.ts'],
  changedInterfaces: ['Plugin'],
  breakingChanges: [
    {
      type: 'method-signature-change',
      interface: 'Plugin',
      method: 'initialize',
      before: 'initialize(): void',
      after: 'initialize(context: PluginContext): Promise<void>',
      impact: 'All plugins must update initialize method'
    }
  ],
  relatedFiles: [
    'src/core/plugins/plugin-manager.ts',
    'src/core/plugins/plugin-context.ts'
  ],
  affectedComponents: ['PluginManager', 'PluginContext'],
  estimatedImpact: 'high'
};
```

### Decision Extraction

Extract decision from:
1. **Commit Message:** Parse structured commit messages
2. **Code Comments:** Look for decision rationale
3. **PR Description:** Extract from linked PR
4. **Code Diff:** Analyze actual changes

### Consequence Prediction

Predict consequences based on:
1. **Breaking Changes:** Impact on existing code
2. **Dependencies:** Affected components
3. **Test Changes:** Required test updates
4. **Migration Effort:** Estimated work to adopt

### Alternative Suggestions

Suggest alternatives based on:
1. **Common Patterns:** Similar decisions in codebase
2. **Best Practices:** Industry standards
3. **Historical Decisions:** Previous ADRs
4. **Code Analysis:** Other possible approaches

## Execution Flow

```
1. File change detected
   ↓
2. Parse changed interfaces
   ↓
3. Detect breaking changes
   ↓
4. Analyze impact
   ↓
5. Generate ADR content
   ↓
6. Determine ADR number
   ↓
7. Create ADR file
   ↓
8. Link related ADRs
   ↓
9. Notify developer
   ↓
10. (Optional) Create PR
```

## Output Examples

### Example 1: Breaking Change

```markdown
# ADR-0005: Change Plugin.initialize to Async with Context Parameter

**Status:** Proposed

**Date:** 2024-01-15

**Author:** John Doe

**Tags:** architecture, breaking-change, plugins, async

## Context

The current Plugin interface requires synchronous initialization, which prevents plugins from performing async setup tasks like loading configuration from files, connecting to databases, or fetching remote resources. This limitation has caused workarounds where plugins perform async operations after initialization, leading to race conditions and initialization errors.

Additionally, plugins need access to the AgentOS runtime context (event system, state management, logging) during initialization, but currently have no way to receive this context.

## Decision

Change the `Plugin.initialize()` method signature from:
```typescript
initialize(): void
```

To:
```typescript
initialize(context: PluginContext): Promise<void>
```

This change:
1. Makes initialization async, allowing plugins to perform async setup
2. Provides plugins with runtime context during initialization
3. Enables proper error handling during plugin initialization

## Consequences

### Positive
- Plugins can perform async initialization (load configs, connect to services)
- Plugins receive runtime context (events, state, logging)
- Better error handling during initialization
- Eliminates race conditions from post-init async operations
- Aligns with modern async/await patterns

### Negative
- **Breaking change:** All existing plugins must be updated
- Plugin loading becomes async, affecting startup time
- More complex error handling in PluginManager
- Potential for initialization deadlocks if not careful

### Neutral
- Plugin initialization order becomes more important
- Need to document async initialization best practices
- May need timeout mechanism for slow initializations

## Alternatives Considered

### Alternative 1: Add Optional Async Hook
- **Description:** Keep `initialize()` sync, add optional `initializeAsync()`
- **Pros:** Non-breaking, gradual migration
- **Cons:** Two initialization methods, confusing API, doesn't solve context problem
- **Reason for rejection:** Creates API confusion and doesn't fully solve the problem

### Alternative 2: Use Callbacks
- **Description:** `initialize(context: PluginContext, callback: () => void)`
- **Pros:** Non-breaking if callback is optional
- **Cons:** Callback hell, outdated pattern, harder error handling
- **Reason for rejection:** Async/await is the modern standard

### Alternative 3: Separate Context Injection
- **Description:** Add `setContext(context: PluginContext)` method
- **Pros:** Separates concerns
- **Cons:** Two-phase initialization, more complex lifecycle
- **Reason for rejection:** Increases complexity without clear benefit

## Related Decisions

- ADR-0002: Plugin Dependency Resolution (affects initialization order)
- ADR-0001: Event System Architecture (context provides event access)

## Implementation Notes

### Migration Path

1. Update Plugin interface in `src/core/plugins/plugin.ts`
2. Update PluginManager to handle async initialization
3. Add timeout mechanism (default: 30s)
4. Update all built-in plugins
5. Document migration guide for external plugins
6. Add deprecation warnings for old signature (if possible)

### Compatibility

- **Breaking Change:** Yes
- **Version:** Requires major version bump (2.0.0)
- **Migration Effort:** Medium (update all plugins)
- **Deprecation Period:** N/A (breaking change)

### Error Handling

```typescript
try {
  await plugin.initialize(context);
} catch (error) {
  logger.error(`Plugin ${plugin.name} initialization failed:`, error);
  // Handle initialization failure
}
```

## References

- PR: #123 - Async Plugin Initialization
- Issue: #98 - Plugins need async initialization
- Discussion: #87 - Plugin context access
- Documentation: docs/plugins/async-initialization.md
```

### Example 2: Non-Breaking Addition

```markdown
# ADR-0006: Add Optional Metadata to Plugin Interface

**Status:** Accepted

**Date:** 2024-01-16

**Author:** Jane Smith

**Tags:** architecture, plugins, metadata

## Context

Plugins currently only expose `name` and `version` properties. There's no standardized way to provide additional metadata like description, author, license, homepage, or tags. This makes it difficult to:
- Display plugin information in UI
- Search and filter plugins
- Verify plugin authenticity
- Track plugin dependencies

## Decision

Add optional `metadata` property to Plugin interface:

```typescript
interface Plugin {
  name: string;
  version: string;
  metadata?: PluginMetadata;
  initialize(context: PluginContext): Promise<void>;
}

interface PluginMetadata {
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  tags?: string[];
  dependencies?: Record<string, string>;
}
```

## Consequences

### Positive
- Standardized plugin metadata format
- Better plugin discovery and documentation
- Non-breaking change (optional property)
- Enables future plugin marketplace features

### Negative
- None significant

### Neutral
- Plugins should provide metadata but not required
- Need to document metadata best practices

## Alternatives Considered

### Alternative 1: Separate Metadata File
- **Description:** Store metadata in `plugin.json` file
- **Pros:** Separation of concerns
- **Cons:** Extra file to maintain, loading complexity
- **Reason for rejection:** Adds unnecessary complexity

## Related Decisions

- ADR-0005: Async Plugin Initialization (context for this addition)

## Implementation Notes

Non-breaking addition. Existing plugins continue to work without changes.

## References

- PR: #125 - Add Plugin Metadata
- Issue: #102 - Plugin metadata support
```

## Configuration

```yaml
adrGenerator:
  enabled: true
  autoGenerate: true
  
  triggers:
    filePatterns:
      - "src/**/types.ts"
      - "src/**/interfaces.ts"
      - "src/**/*.interface.ts"
      - "src/core/*/index.ts"
    
    breakingChangesOnly: false
    debounceMs: 5000
  
  output:
    directory: "docs/adr"
    template: "docs/templates/adr-template.md"
    numberFormat: "0000"
    slugMaxLength: 60
  
  content:
    analyzeGitHistory: true
    extractFromCommits: true
    extractFromPRs: true
    suggestAlternatives: true
    linkRelatedADRs: true
  
  git:
    autoCommit: false
    createPR: false
    branch: "main"
  
  notifications:
    onCreate: true
    onBreakingChange: true
```

## Integration with Development Workflow

1. **Developer Changes Interface** → File saved
2. **Hook Detects Change** → Analyzes impact
3. **ADR Generated** → Creates numbered document
4. **Developer Reviews** → Edits if needed
5. **ADR Committed** → Part of same commit
6. **Team Notified** → Slack/email notification

## Best Practices

1. **Review Generated ADRs:** Always review and edit generated content
2. **Add Context:** Provide additional context not in code
3. **Document Alternatives:** Explain why other approaches weren't chosen
4. **Link Related ADRs:** Maintain decision history
5. **Update Status:** Mark as Accepted after team review
6. **Supersede Old ADRs:** Link to superseded decisions

## Maintenance

### ADR Lifecycle

```
Proposed → Accepted → (Deprecated) → Superseded
```

### Updating ADRs

- **Never delete ADRs:** Mark as deprecated/superseded
- **Link to new ADRs:** Show decision evolution
- **Maintain history:** Keep all decisions for reference

### ADR Index

Auto-generate `docs/adr/README.md`:

```markdown
# Architecture Decision Records

## Active Decisions

- [ADR-0005](0005-plugin-initialize-async.md) - Async Plugin Initialization
- [ADR-0006](0006-plugin-metadata.md) - Plugin Metadata

## Deprecated Decisions

- [ADR-0003](0003-sync-plugin-init.md) - Superseded by ADR-0005

## By Category

### Plugins
- ADR-0002, ADR-0005, ADR-0006

### Events
- ADR-0001

### State
- ADR-0003
```

## Error Handling

### Generation Failures
- Log error details
- Notify developer
- Create placeholder ADR
- Allow manual completion

### Numbering Conflicts
- Detect existing numbers
- Auto-increment to next available
- Handle concurrent generation

## Performance

- Generate ADRs asynchronously
- Cache parsed interfaces
- Limit to one generation per file change
- Timeout after 30 seconds

## Notes

- Uses `adr-generator` MCP tool
- Integrates with git for commit analysis
- Supports custom templates
- Can be triggered manually via command palette
- ADRs are versioned with code for traceability

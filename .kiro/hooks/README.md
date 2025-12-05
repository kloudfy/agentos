# Agent Hooks

This directory contains agent hook configurations that automate development workflows in Kiro IDE. Hooks are triggered by specific events (file saves, commits, etc.) and execute automated tasks to maintain code quality and consistency.

## Overview

Agent hooks enable:
- **Automated testing** - Generate and run tests on file changes
- **Quality gates** - Block commits that don't meet standards
- **Code formatting** - Auto-fix style issues on save
- **Documentation** - Generate ADRs for architectural changes

## Available Hooks

### 🧪 [test-generator.md](./test-generator.md)
**Trigger:** `file-save` | **Priority:** High | **Enabled:** ✅

Automatically generates comprehensive test files when source code is saved.

**Features:**
- Creates test files for new source files
- Updates tests when methods/signatures change
- Ensures ≥90% coverage
- Generates unit, integration, and edge case tests
- Uses AAA (Arrange-Act-Assert) pattern

**File Patterns:**
- `src/**/*.ts` (excludes test files)
- Debounce: 2000ms

**Example:**
```
Source: src/core/events/event-emitter.ts
Test:   src/core/events/__tests__/event-emitter.test.ts
```

### 🚦 [eval-runner.md](./eval-runner.md)
**Trigger:** `pre-commit` | **Priority:** Critical | **Enabled:** ✅

Runs quality gates before commits to prevent quality regressions.

**Quality Gates:**
1. **Test Coverage** - ≥90% all metrics
2. **Regression** - ≤5% performance drop
3. **Test Pass Rate** - 100% passing

**Blocking:** Yes - prevents commit if gates fail

**Additional Triggers:**
- `pre-push` (optional)
- `manual` (command palette)
- `scheduled` (nightly builds)

### 📝 [adr-generator.md](./adr-generator.md)
**Trigger:** `file-change` | **Priority:** Medium | **Enabled:** ✅

Automatically generates Architecture Decision Records when interfaces change.

**Features:**
- Detects breaking changes
- Creates numbered ADR documents (ADR-0001, ADR-0002, etc.)
- Analyzes impact and alternatives
- Links related decisions

**File Patterns:**
- `src/**/types.ts`
- `src/**/interfaces.ts`
- `src/**/*.interface.ts`
- `src/core/*/index.ts`
- Debounce: 5000ms

**Output:** `docs/adr/`

### 🎨 [linting.md](./linting.md)
**Trigger:** `file-save` | **Priority:** High | **Enabled:** ✅

Runs ESLint on file save with auto-fix for code quality and style.

**Auto-Fixed:**
- Formatting (indentation, spacing)
- Missing semicolons
- Quote style
- Import ordering

**Enforced Rules:**
- No `any` type
- Max 300 lines per file
- Max 50 lines per function
- Complexity ≤15
- TypeScript strict mode

**File Patterns:**
- `src/**/*.ts`
- `src/**/*.tsx`
- Debounce: 500ms

## Hook Configuration

### Frontmatter Structure

Each hook file uses YAML frontmatter for configuration:

```yaml
---
name: Hook Name
description: What the hook does
enabled: true|false
trigger: file-save|file-change|pre-commit|pre-push|manual
priority: critical|high|medium|low
---
```

### Trigger Types

- **`file-save`** - Executes when files are saved
- **`file-change`** - Executes when files are modified and committed
- **`pre-commit`** - Executes before git commit
- **`pre-push`** - Executes before git push
- **`manual`** - Executes via command palette

### Priority Levels

- **Critical** - Blocking operations (e.g., quality gates)
- **High** - Important but non-blocking (e.g., linting)
- **Medium** - Nice-to-have automation (e.g., ADR generation)
- **Low** - Optional enhancements

## Usage

### Enabling/Disabling Hooks

1. **Via Kiro UI:**
   - Open Agent Hooks panel
   - Toggle hook on/off

2. **Via Configuration:**
   - Edit hook file frontmatter
   - Set `enabled: false`

3. **Via Command Palette:**
   - Search "Agent Hooks"
   - Select hook to enable/disable

### Manual Execution

Run hooks manually via command palette:
1. Open command palette (Cmd/Ctrl+Shift+P)
2. Search for hook name
3. Execute

### Viewing Hook Output

- **Real-time:** Check Kiro output panel
- **Logs:** `.kiro/logs/hooks/`
- **Reports:** Generated in respective output directories

## Hook Execution Flow

```
Event Triggered
    ↓
Check if hook enabled
    ↓
Check file patterns match
    ↓
Wait for debounce period
    ↓
Execute hook command
    ↓
Process output
    ↓
Update UI/Block action if needed
```

## Best Practices

### Creating New Hooks

1. **Define clear trigger conditions**
   - Specific file patterns
   - Appropriate debounce time
   - Clear success/failure criteria

2. **Make hooks fast**
   - Target <5s execution time
   - Use incremental processing
   - Cache results when possible

3. **Provide clear feedback**
   - Show progress indicators
   - Display actionable error messages
   - Link to relevant documentation

4. **Handle failures gracefully**
   - Don't block on transient errors
   - Provide retry mechanisms
   - Log detailed error information

### Hook Dependencies

Hooks can depend on:
- **MCP Tools** - Call external tools/APIs
- **Steering Documents** - Reference coding standards
- **Specs** - Validate against requirements

## Statistics

- **Total Hooks:** 4
- **Enabled:** 4
- **Blocking:** 1 (eval-runner)
- **Auto-fix:** 1 (linting)
- **Documentation:** 1 (adr-generator)
- **Testing:** 2 (test-generator, eval-runner)

## Verification

✅ All hooks have valid frontmatter  
✅ File patterns match actual codebase structure  
✅ Debounce times are reasonable  
✅ Output directories exist or are created  
✅ Commands/scripts referenced exist  

## Related Documentation

- [MCP Tools](../mcp/) - External tool integrations
- [Steering Documents](../steering/) - Code standards
- [Specifications](../specs/) - Feature requirements
- [Main README](../../README.md) - Project overview

## Troubleshooting

### Hook Not Triggering

1. Check if hook is enabled
2. Verify file patterns match
3. Check debounce hasn't been interrupted
4. Review Kiro output panel for errors

### Hook Failing

1. Check command/script exists
2. Verify dependencies installed
3. Review error logs in `.kiro/logs/hooks/`
4. Try manual execution for detailed output

### Performance Issues

1. Increase debounce time
2. Narrow file patterns
3. Optimize hook script
4. Consider async execution

---

**Note:** These hooks are designed to work seamlessly with Kiro IDE's agent system. They can be customized, extended, or disabled based on team preferences and project needs.

---
name: Linting
description: Runs ESLint on file save to enforce code quality and style standards
enabled: true
trigger: file-save
priority: high
---

# Linting Hook

## Overview
This hook automatically runs ESLint on TypeScript files when saved, auto-fixing common issues and enforcing code quality standards.

## Trigger Configuration

**Event:** `file-save`

**File Patterns:**
- `src/**/*.ts`
- `src/**/*.tsx`
- `!src/**/*.test.ts`
- `!src/**/*.spec.ts`

**Debounce:** 500ms

## ESLint Configuration

### Rules Enforced

**TypeScript Strict Mode:**
- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/explicit-function-return-type`: warn
- `@typescript-eslint/no-unused-vars`: error
- `@typescript-eslint/strict-boolean-expressions`: warn

**Code Quality:**
- `max-lines`: 300 (error)
- `max-lines-per-function`: 50 (warn)
- `complexity`: 15 (error)
- `max-depth`: 4 (warn)

**Style:**
- `max-len`: 100 characters (warn)
- `indent`: 2 spaces (error)
- `quotes`: single (error)
- `semi`: always (error)

**Best Practices:**
- `no-console`: warn (except console.error)
- `no-debugger`: error
- `eqeqeq`: error (always use ===)
- `no-var`: error (use const/let)

## Auto-Fix Behavior

### Automatically Fixed
- Formatting issues (indentation, spacing)
- Missing semicolons
- Quote style inconsistencies
- Trailing whitespace
- Import ordering

### Requires Manual Fix
- `no-explicit-any` violations
- Unused variables
- Complex logic (complexity > 15)
- Files exceeding 300 lines

## Execution Flow

```
1. File saved
   ↓
2. Run ESLint with --fix
   ↓
3. Apply auto-fixes
   ↓
4. Report remaining issues
   ↓
5. Update file if fixes applied
```

## Output Format

### Success (No Issues)
```
✓ Linting passed: src/core/events/event-emitter.ts
  No issues found
```

### Auto-Fixed
```
✓ Linting passed with auto-fixes: src/core/plugins/plugin.ts
  Fixed 3 issues:
    - Added missing semicolons (2)
    - Fixed indentation (1)
```

### Errors Remaining
```
✗ Linting failed: src/core/state/state-store.ts
  3 errors, 2 warnings:
    
  Errors:
    Line 45: Unexpected 'any' type (@typescript-eslint/no-explicit-any)
    Line 78: Unused variable 'result' (@typescript-eslint/no-unused-vars)
    Line 120: File has 342 lines (max 300) (max-lines)
  
  Warnings:
    Line 23: Function has complexity 18 (max 15) (complexity)
    Line 56: Line exceeds 100 characters (max-len)
```

## Integration with IDE

- Real-time feedback in editor
- Inline error highlighting
- Quick-fix suggestions
- Format on save integration

## Configuration

```yaml
linting:
  enabled: true
  autoFix: true
  runOnSave: true
  
  eslint:
    configFile: .eslintrc.json
    ignoreFile: .eslintignore
    cache: true
    
  rules:
    strictMode: true
    maxLines: 300
    maxComplexity: 15
    noAny: error
    
  autoFixRules:
    - formatting
    - semicolons
    - quotes
    - imports
    
  notifications:
    showSuccess: false
    showWarnings: true
    showErrors: true
```

## Performance

- Uses ESLint cache for speed
- Only lints changed files
- Runs in background thread
- Timeout: 10 seconds

## Best Practices

1. Fix linting errors before committing
2. Don't disable rules without team discussion
3. Keep files under 300 lines
4. Avoid `any` type - use proper types
5. Extract complex functions

## Integration with Other Hooks

- Runs before test-generator
- Blocks commit if errors exist (via eval-runner)
- Enforces conventions from steering docs

## Notes

- Integrates with Prettier for formatting
- Follows conventions in `.kiro/steering/conventions.md`
- Errors block commits in CI/CD
- Can be temporarily disabled with `// eslint-disable-next-line`

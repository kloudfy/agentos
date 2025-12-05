# Model Context Protocol (MCP) Tools

This directory contains MCP tool configurations that extend Kiro IDE's capabilities through external integrations. MCP tools provide structured interfaces to external services, APIs, and custom scripts.

## Overview

MCP (Model Context Protocol) enables:
- **External API integration** - GitHub, CI/CD services, etc.
- **Custom tool execution** - Run scripts and commands
- **Structured data exchange** - Type-safe tool interfaces
- **Automated workflows** - Trigger tools from hooks or manually

## Available Tools

### 📊 [eval-runner.json](./eval-runner.json)
**Type:** Tool | **Enabled:** ✅

Runs the evaluation harness to measure code quality and performance.

**Command:** `npm run eval`

**Features:**
- Executes test scenarios (unit, integration, e2e)
- Returns quality metrics (coverage, pass rate, latency)
- Blocks operations if quality drops >5%
- Generates detailed reports

**Quality Gates:**
```json
{
  "minPassRate": 0.95,
  "maxRegressionPercent": 5,
  "minCoverage": 90,
  "maxLatencyMs": 1000
}
```

**Triggers:**
- Manual execution
- On commit (via hooks)
- On pull request
- Before deployment

**Output:**
- Format: JSON
- Logs: `.kiro/logs/eval-results.json`
- Reports: `docs/eval-reports/`

**Metrics Tracked:**
- Pass rate
- Failure count
- Regression percentage
- Coverage (statements, branches, functions, lines)
- Latency (avg, p95, p99)

### 📝 [adr-generator.json](./adr-generator.json)
**Type:** Tool | **Enabled:** ✅

Automatically generates Architecture Decision Records for interface changes.

**Command:** `node scripts/generate-adr.js`

**Features:**
- Auto-numbers ADRs sequentially (0001, 0002, etc.)
- Detects breaking changes
- Includes context and consequences
- Links related decisions

**Triggers:**
- Manual execution
- File changes (types.ts, interfaces.ts, etc.)
- Debounce: 5000ms

**File Patterns:**
- `src/**/types.ts`
- `src/**/interfaces.ts`
- `src/**/*.interface.ts`
- `src/core/*/index.ts`

**Output:**
- Directory: `docs/adr/`
- Format: Markdown
- Naming: `{number}-{slug}.md`
- Template: `docs/templates/adr-template.md`

**ADR Sections:**
- Status (Proposed/Accepted/Deprecated/Superseded)
- Context
- Decision
- Consequences
- Alternatives Considered
- Related Decisions

### 🐙 [github-integration.json](./github-integration.json)
**Type:** Tool | **Enabled:** ✅

GitHub API integration for repository management and CI/CD automation.

**Base URL:** `https://api.github.com`

**Authentication:**
- Type: Bearer token
- Environment variable: `GITHUB_TOKEN`
- Required scopes: `repo`, `workflow`, `read:org`, `write:checks`

**Rate Limiting:**
- Max requests: 5000/hour
- Check before request: Yes
- Wait on limit: Yes
- Alert threshold: 100 remaining

**Operations:**

**Repository:**
- Get repository info
- List branches
- Get file contents
- Create/update files
- Delete files

**Pull Requests:**
- List PRs
- Get PR details
- Create PR
- Update PR
- Merge PR
- List PR files
- List PR commits

**Workflows:**
- List workflows
- Get workflow runs
- Cancel workflow run
- Rerun workflow
- Download artifacts

**Checks:**
- Create check run
- Update check run
- List check runs
- Get check suite

**Issues:**
- List issues
- Get issue
- Create issue
- Update issue
- Add comment

**Commits:**
- Get commit
- List commits
- Compare commits
- Get commit status

## MCP Configuration Structure

### JSON Schema

```json
{
  "name": "tool-name",
  "version": "1.0.0",
  "description": "Tool description",
  "type": "tool",
  "enabled": true,
  "config": {
    "command": "command-to-run",
    "args": ["arg1", "arg2"],
    "timeout": 30000,
    "workingDirectory": ".",
    "env": {
      "VAR_NAME": "value"
    }
  },
  "triggers": {
    "manual": true,
    "onFileChange": {
      "enabled": true,
      "patterns": ["src/**/*.ts"],
      "debounceMs": 5000
    }
  },
  "output": {
    "format": "json|text|markdown",
    "logPath": ".kiro/logs/tool-output.json"
  }
}
```

### Configuration Fields

**Required:**
- `name` - Unique tool identifier
- `version` - Semantic version
- `description` - What the tool does
- `type` - Always "tool" for MCP tools
- `enabled` - Whether tool is active

**Optional:**
- `config` - Execution configuration
- `triggers` - When to run the tool
- `output` - Output format and location
- `authentication` - Auth configuration
- `rateLimit` - Rate limiting settings

## Usage

### Manual Execution

Run MCP tools manually:

1. **Via Command Palette:**
   - Open command palette (Cmd/Ctrl+Shift+P)
   - Search for tool name
   - Execute

2. **Via Chat:**
   - Reference tool in chat: `@eval-runner`
   - Kiro will execute and return results

3. **Via Hooks:**
   - Tools are called automatically by hooks
   - See `.kiro/hooks/` for configurations

### Viewing Tool Output

- **Real-time:** Kiro output panel
- **Logs:** `.kiro/logs/`
- **Reports:** Tool-specific output directories

### Tool Results

Tools return structured data:

```json
{
  "success": true,
  "data": {
    "metric1": "value1",
    "metric2": "value2"
  },
  "errors": [],
  "warnings": [],
  "metadata": {
    "executionTime": 1234,
    "timestamp": "2024-12-05T12:00:00Z"
  }
}
```

## Creating Custom MCP Tools

### 1. Create Configuration File

```json
{
  "name": "my-custom-tool",
  "version": "1.0.0",
  "description": "My custom tool",
  "type": "tool",
  "enabled": true,
  "config": {
    "command": "node",
    "args": ["scripts/my-tool.js"],
    "timeout": 30000
  }
}
```

### 2. Create Tool Script

```javascript
// scripts/my-tool.js
async function main() {
  try {
    // Tool logic here
    const result = await doSomething();
    
    // Return structured output
    console.log(JSON.stringify({
      success: true,
      data: result
    }));
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      errors: [error.message]
    }));
    process.exit(1);
  }
}

main();
```

### 3. Test Tool

```bash
# Test manually
node scripts/my-tool.js

# Test via Kiro
# Use command palette to execute
```

### 4. Add to Hooks (Optional)

Reference tool in hook configuration to automate execution.

## Best Practices

### Tool Design

1. **Single responsibility** - One tool, one purpose
2. **Fast execution** - Target <30s timeout
3. **Structured output** - Always return JSON
4. **Error handling** - Catch and report all errors
5. **Idempotent** - Safe to run multiple times

### Security

1. **Use environment variables** for secrets
2. **Validate all inputs** before processing
3. **Limit API scopes** to minimum required
4. **Implement rate limiting** for external APIs
5. **Log security events** for audit trail

### Performance

1. **Cache results** when appropriate
2. **Use incremental processing** for large datasets
3. **Implement timeouts** to prevent hanging
4. **Batch API requests** to reduce calls
5. **Monitor execution time** and optimize

## Statistics

- **Total Tools:** 3
- **Enabled:** 3
- **External APIs:** 1 (GitHub)
- **Custom Scripts:** 2 (eval-runner, adr-generator)
- **Average Timeout:** 30s

## Verification

✅ All tools have valid JSON configuration  
✅ Commands/scripts exist and are executable  
✅ Output directories are created  
✅ Environment variables documented  
✅ Rate limits configured for external APIs  

## Environment Variables

Required environment variables for MCP tools:

```bash
# GitHub Integration
export GITHUB_TOKEN="ghp_your_token_here"

# Eval Runner
export NODE_ENV="test"
export EVAL_MODE="quality-gate"
```

## Troubleshooting

### Tool Not Found

1. Check tool is enabled in configuration
2. Verify JSON syntax is valid
3. Restart Kiro IDE to reload configs

### Tool Execution Fails

1. Check command/script exists
2. Verify environment variables set
3. Review logs in `.kiro/logs/`
4. Test command manually in terminal

### Authentication Errors

1. Verify token is set in environment
2. Check token has required scopes
3. Ensure token hasn't expired
4. Test API access manually with curl

### Rate Limit Exceeded

1. Check rate limit configuration
2. Reduce request frequency
3. Implement caching
4. Use conditional requests (ETags)

## Related Documentation

- [Agent Hooks](../hooks/) - Automated workflows
- [Steering Documents](../steering/) - Code standards
- [Specifications](../specs/) - Feature requirements
- [MCP Protocol](https://modelcontextprotocol.io/) - Official MCP docs

---

**Note:** MCP tools extend Kiro's capabilities while maintaining security and performance. Always validate external integrations and monitor usage to stay within rate limits.

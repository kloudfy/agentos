# CI/CD Automator

Automated quality gates and ADR generation for continuous integration workflows.

## Features

- **Quality Gate Automation**: Runs eval harness on every commit
- **Baseline Comparison**: Blocks PRs if quality drops >5%
- **ADR Generation**: Auto-generates ADRs when interfaces change
- **GitHub Integration**: Updates PR status and posts comments
- **Event-Driven**: Integrates with AgentOS event system

## Architecture

```
CI/CD Automator
├── automator.ts          # Main orchestrator
├── github-client.ts      # GitHub API wrapper
├── quality-checker.ts    # Quality verification
├── config.ts             # Configuration
└── index.ts              # Entry point
```

## Quick Start

### Prerequisites

- Node.js 18+
- GitHub Personal Access Token
- AgentOS core systems

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

Create a `.env` file:

```env
# Required
GITHUB_TOKEN=ghp_your_token_here
REPO_OWNER=your-username
REPO_NAME=your-repo

# Optional
QUALITY_THRESHOLD=0.9
MAX_QUALITY_DROP=5
BASELINE_PATH=./baselines
ADR_DIR=./docs/adr
ENABLE_ADR=true
```

### Running

```bash
# Check a specific PR
npm run cicd -- 123

# Or with environment variable
PR_NUMBER=123 npm run cicd
```

## Usage

### As a CLI Tool

```bash
# Check PR #42
node dist/apps/cicd-automator/index.js 42

# With custom config
QUALITY_THRESHOLD=0.95 node dist/apps/cicd-automator/index.js 42
```

### As a Library

```typescript
import { CICDAutomator, loadConfig } from './apps/cicd-automator';

const config = loadConfig();
const automator = new CICDAutomator(config);

// Check a PR
await automator.checkPR(42, scenarios);

// Generate ADR
const adrPath = await automator.generateADR(oldCode, newCode);
```

### In GitHub Actions

```yaml
name: Quality Check

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run Quality Check
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO_OWNER: ${{ github.repository_owner }}
          REPO_NAME: ${{ github.event.repository.name }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: npm run cicd
```

## Components

### CICDAutomator

Main orchestrator that coordinates quality checks and ADR generation.

```typescript
const automator = new CICDAutomator(config);

// Check PR quality
await automator.checkPR(prNumber, scenarios);

// Run quality check
const result = await automator.runQualityCheck(scenarios);

// Generate ADR
const adrPath = await automator.generateADR(oldCode, newCode);
```

### GitHubClient

Simple GitHub API wrapper for PR operations.

```typescript
const github = new GitHubClient(token, owner, repo);

// Get PR info
const pr = await github.getPullRequest(42);

// Update commit status
await github.updateStatus(sha, 'success', 'All checks passed');

// Post comment
await github.postComment(42, 'Quality check results...');
```

### QualityChecker

Runs eval harness and compares to baseline.

```typescript
const checker = new QualityChecker(baselinePath, threshold, maxDrop);

// Run quality check
const result = await checker.runCheck(scenarios);

console.log(`Score: ${result.score}`);
console.log(`Passed: ${result.passed}`);
console.log(`Drop: ${result.drop}%`);
```

## Quality Gates

### Thresholds

- **Minimum Score**: 90% (configurable)
- **Maximum Drop**: 5% (configurable)
- **Baseline**: Stored in `./baselines/`

### Evaluation

1. Run eval harness on all scenarios
2. Calculate overall score
3. Compare to baseline
4. Check if drop exceeds threshold
5. Update GitHub status

### Example Results

```
✅ Quality check passed
Score: 94.5% (baseline: 95.0%, drop: 0.5%)

Scenarios Run: 50
Passed: 47
Failed: 3
```

## ADR Generation

### Automatic Detection

The automator detects interface changes and generates ADRs:

```typescript
// Detect changes
const changes = detector.detectInterfaceChanges(oldCode, newCode);

// Generate ADR if breaking changes found
if (changes.some(c => c.breaking)) {
  const adr = await automator.generateADR(oldCode, newCode);
  console.log(`ADR generated: ${adr}`);
}
```

### ADR Content

Generated ADRs include:

- **Title**: Auto-generated from changes
- **Context**: Why the change is needed
- **Decision**: What's being changed
- **Consequences**: Impact analysis
- **Alternatives**: Other approaches considered

### Example ADR

```markdown
# ADR-0042: Change Plugin Interface to Async

**Date:** 2024-01-15
**Author:** CI/CD Automator

## Status

**Proposed**

## Context

The current interface design has 2 breaking change(s)...

## Decision

We will implement the following changes:
- Change initialize() to async
- Add context parameter

## Consequences

### Positive
- Better async support
- Runtime context access

### Negative
- Breaking change requires migration
```

## GitHub Integration

### Commit Status

The automator updates commit status on GitHub:

- **Pending**: Quality check running
- **Success**: All checks passed
- **Failure**: Quality gates failed

### PR Comments

Posts detailed results as PR comments:

```markdown
## ✅ Quality Check PASSED

**Score:** 94.5%
**Baseline:** 95.0%
**Drop:** 0.5%

### Details

- Scenarios Run: 50
- Passed: 47
- Failed: 3

✅ All quality gates passed!
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | Yes | - | GitHub personal access token |
| `REPO_OWNER` | Yes | - | Repository owner |
| `REPO_NAME` | Yes | - | Repository name |
| `QUALITY_THRESHOLD` | No | 0.9 | Minimum quality score (0-1) |
| `MAX_QUALITY_DROP` | No | 5 | Maximum quality drop (%) |
| `BASELINE_PATH` | No | ./baselines | Baseline storage path |
| `ADR_DIR` | No | ./docs/adr | ADR output directory |
| `ENABLE_ADR` | No | true | Enable ADR generation |

### GitHub Token Permissions

Required scopes:

- `repo` - Full repository access
- `write:discussion` - Post comments

## Troubleshooting

### Quality Check Fails

1. Check baseline exists: `ls ./baselines/`
2. Verify scenarios are valid
3. Review eval harness logs

### GitHub API Errors

1. Verify token has correct permissions
2. Check rate limits: `curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/rate_limit`
3. Ensure repo owner/name are correct

### ADR Not Generated

1. Check `ENABLE_ADR=true`
2. Verify interface changes exist
3. Check ADR directory is writable

## Advanced Usage

### Custom Scenarios

```typescript
const scenarios: EvalScenario[] = [
  {
    id: 'perf-1',
    name: 'Performance test',
    description: 'Tests response time',
    input: { size: 1000 },
    expectedOutput: { time: '<100ms' },
    category: 'performance',
  },
  // ... more scenarios
];

await automator.checkPR(prNumber, scenarios);
```

### Custom Quality Gates

```typescript
const checker = new QualityChecker(
  './baselines',
  0.95,  // 95% minimum
  3      // 3% max drop
);
```

### Webhook Integration

```typescript
// Express webhook handler
app.post('/webhook', async (req, res) => {
  const { pull_request } = req.body;
  
  if (pull_request) {
    await automator.checkPR(pull_request.number, scenarios);
  }
  
  res.sendStatus(200);
});
```

## Best Practices

1. **Baseline Management**: Update baselines after major releases
2. **Scenario Coverage**: Maintain comprehensive test scenarios
3. **Threshold Tuning**: Adjust thresholds based on project needs
4. **ADR Review**: Always review auto-generated ADRs
5. **Token Security**: Use GitHub secrets, never commit tokens

## Contributing

1. Add new quality checks in `quality-checker.ts`
2. Extend GitHub integration in `github-client.ts`
3. Add configuration options in `config.ts`
4. Update this README

## License

Part of AgentOS - see main project license.

## References

- [GitHub API Documentation](https://docs.github.com/en/rest)
- [AgentOS Eval System](../../core/eval/README.md)
- [AgentOS ADR System](../../core/adr/README.md)
- [Quality Gates Guide](../../docs/quality-gates.md)

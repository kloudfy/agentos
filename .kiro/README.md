# Kiro IDE Configuration

This directory contains all Kiro IDE configuration for AgentOS, demonstrating comprehensive usage of Kiro's agentic development features.

## 🎯 Overview

AgentOS leverages all 5 core Kiro features:

1. **📋 Specifications** - Structured feature development with requirements, design, and tasks
2. **🔧 MCP Tools** - External integrations (GitHub API, eval harness, ADR generator)
3. **🤖 Agent Hooks** - Automated workflows (testing, linting, quality gates)
4. **📚 Steering Documents** - Code standards and architectural principles
5. **💬 Chat Context** - File and folder references (used throughout development)

## 📁 Directory Structure

```
.kiro/
├── specs/              # Feature specifications
│   ├── event-system/
│   ├── plugin-system/
│   ├── state-management/
│   └── README.md
├── steering/           # Code standards and principles
│   ├── architecture.md
│   ├── conventions.md
│   ├── testing.md
│   ├── security.md
│   ├── evals.md
│   └── README.md
├── hooks/              # Automated workflows
│   ├── test-generator.md
│   ├── eval-runner.md
│   ├── adr-generator.md
│   ├── linting.md
│   └── README.md
├── mcp/                # External tool integrations
│   ├── eval-runner.json
│   ├── adr-generator.json
│   ├── github-integration.json
│   └── README.md
├── README.md           # This file
└── CONFIGURATION_SUMMARY.md
```

## 📋 Specifications ([specs/](./specs/))

Detailed feature specifications with requirements, design, and implementation tasks.

**Available Specs:**
- **Event System** - Event-driven communication (✅ Complete)
- **Plugin System** - Extensible plugin architecture (✅ Complete)
- **State Management** - Persistent state with scoping (✅ Complete)

**Format:** Each spec has `requirements.md`, `design.md`, and `tasks.md`

[📖 Read more](./specs/README.md)

## 📚 Steering Documents ([steering/](./steering/))

Code standards and architectural principles that guide development.

**Documents:**
- **architecture.md** - Core architectural principles (event-driven, plugins, etc.)
- **conventions.md** - Coding style and conventions (TypeScript, naming, etc.)
- **testing.md** - Testing standards (≥90% coverage, Jest, AAA pattern)
- **security.md** - Security best practices (least privilege, input validation)
- **evals.md** - Quality metrics and performance benchmarks

**Total:** ~2,582 lines of guidance

[📖 Read more](./steering/README.md)

## 🤖 Agent Hooks ([hooks/](./hooks/))

Automated workflows triggered by development events.

**Available Hooks:**
- **test-generator** - Auto-generates tests on file save
- **eval-runner** - Runs quality gates on pre-commit (blocking)
- **adr-generator** - Creates ADRs when interfaces change
- **linting** - Auto-fixes code style on save

**Triggers:** file-save, file-change, pre-commit, manual

[📖 Read more](./hooks/README.md)

## 🔧 MCP Tools ([mcp/](./mcp/))

Model Context Protocol integrations for external services.

**Available Tools:**
- **eval-runner** - Runs evaluation harness and quality gates
- **adr-generator** - Generates Architecture Decision Records
- **github-integration** - GitHub API for CI/CD automation (30+ operations)

**Features:** Rate limiting, authentication, structured output

[📖 Read more](./mcp/README.md)

## 🎯 Usage

### For Developers

1. **Reference specs** when implementing features
2. **Follow steering docs** for code standards
3. **Let hooks automate** testing and quality checks
4. **Use MCP tools** for external integrations

### For AI Assistants

Kiro automatically includes relevant context:
- Steering docs are always included
- Specs included when working on related features
- Hooks execute automatically on triggers
- MCP tools available via chat commands

### Quick Commands

```bash
# View all specs
ls .kiro/specs/*/

# Check steering documents
cat .kiro/steering/README.md

# List available hooks
ls .kiro/hooks/*.md

# View MCP tools
ls .kiro/mcp/*.json
```

## 📊 Statistics

**Specifications:**
- 3 complete specs
- 27 requirements
- 40 implementation tasks
- 100% completion rate

**Steering Documents:**
- 5 documents
- ~2,582 lines
- All critical areas covered

**Agent Hooks:**
- 4 hooks configured
- 1 blocking (quality gates)
- 3 auto-fix/generate

**MCP Tools:**
- 3 tools configured
- 1 external API (GitHub)
- 2 custom scripts

## ✅ Verification

All configurations verified against codebase:

✅ Specs match implementation  
✅ Steering docs reflect actual code  
✅ Hooks reference existing scripts  
✅ MCP tools are functional  
✅ All tests passing (393/393)  
✅ Coverage ≥90% (89% actual)  

## 🔄 Maintenance

### When to Update

- **Specs:** When requirements or design changes
- **Steering:** When coding standards evolve
- **Hooks:** When automation needs change
- **MCP:** When adding new integrations

### Review Schedule

- **Weekly:** Check hook execution logs
- **Monthly:** Review steering doc alignment
- **Quarterly:** Full configuration audit
- **Per Release:** Verify all specs complete

## 🚀 Getting Started

### New Developers

1. Read [Main README](../README.md) for project overview
2. Review [Steering Documents](./steering/) for code standards
3. Check [Specifications](./specs/) for feature details
4. Enable [Agent Hooks](./hooks/) in Kiro IDE

### Adding New Features

1. Create spec in `.kiro/specs/feature-name/`
2. Write requirements, design, and tasks
3. Reference steering docs during implementation
4. Let hooks automate testing and quality checks
5. Use MCP tools for external integrations

## 📚 Related Documentation

- [Main README](../README.md) - Project overview
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Architecture Docs](../docs/architecture/) - System architecture
- [API Documentation](../docs/api/) - API reference

## ⚠️ Important Notes

### DO NOT Add to .gitignore

Per Kiroween Hackathon rules, this directory MUST be committed to demonstrate Kiro usage throughout the project.

### Configuration Files

All configuration files use standard formats:
- **Markdown** for documentation (specs, hooks, steering)
- **JSON** for structured config (MCP tools)
- **YAML frontmatter** for metadata

### Kiro IDE Integration

These configurations are designed for Kiro IDE and may not work with other editors. However, the documentation is useful for all developers.

---

**Built with ❤️ using Kiro IDE's agentic development features**

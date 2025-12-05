# Steering Documents

This directory contains steering files that guide code generation and development practices for AgentOS. These documents are automatically included in AI-assisted development sessions to ensure consistency and quality.

## Document Overview

### 📐 [architecture.md](./architecture.md)
**Category:** Design | **Priority:** Critical | **Inclusion:** Always

Defines core architectural principles:
- Event-driven architecture
- Plugin-based extensibility
- Immutability and pure functions
- Dependency injection
- Separation of concerns
- Fail-fast and error boundaries
- Interface segregation

**Key Metrics:**
- 6 core architectural principles
- Design patterns for each system
- Anti-patterns to avoid

### 📝 [conventions.md](./conventions.md)
**Category:** Style | **Priority:** High | **Inclusion:** Always

Coding conventions and style guidelines:
- TypeScript strict mode configuration
- File organization and naming
- Documentation requirements (JSDoc)
- Code style (line length, indentation, quotes)
- Function guidelines (length, complexity)
- Error handling patterns
- Git commit conventions

**Key Standards:**
- 100 character line length max
- 50 line function length max
- Cyclomatic complexity ≤15
- Single responsibility principle

### 🧪 [testing.md](./testing.md)
**Category:** Quality | **Priority:** Critical | **Inclusion:** Always

Testing standards and requirements:
- Coverage requirements (≥90% all metrics)
- Test framework configuration (Jest)
- Test structure (AAA pattern)
- Test categories (unit, integration, e2e)
- Mocking guidelines
- Performance testing

**Key Requirements:**
- Statement coverage: ≥90%
- Branch coverage: ≥90%
- Function coverage: ≥90%
- Line coverage: ≥90%

### 🔒 [security.md](./security.md)
**Category:** Security | **Priority:** Critical | **Inclusion:** Always

Security standards and best practices:
- Core security principles
- Input validation
- Secrets management
- File system security
- Plugin isolation
- Network security
- Error handling (no info leakage)

**Key Principles:**
- Principle of least privilege
- Defense in depth
- Fail securely
- No secrets in code
- Path traversal prevention

### 📊 [evals.md](./evals.md)
**Category:** Quality | **Priority:** Critical | **Inclusion:** Always

Quality evaluation criteria and metrics:
- Performance benchmarks
- Reliability targets
- Maintainability metrics
- Code quality metrics
- Security metrics
- User experience metrics

**Key Benchmarks:**
- Event emission: <1ms (p95)
- Plugin load: <100ms
- State operations: <50ms (p95)
- 99.9% uptime target

## Usage

### For Developers

These documents serve as:
1. **Reference guides** for coding standards
2. **Quality gates** for code reviews
3. **Training materials** for new team members
4. **Decision-making frameworks** for architecture choices

### For AI Assistants

Steering files are automatically included in AI-assisted development sessions through Kiro IDE's steering system. The frontmatter metadata controls when and how they're included:

```yaml
---
title: Document Title
category: design|style|quality|security
priority: critical|high|medium|low
inclusion: always|fileMatch|manual
---
```

**Inclusion modes:**
- `always` - Included in all sessions (default)
- `fileMatch` - Included when specific files are accessed
- `manual` - Included only when explicitly referenced

## Statistics

- **Total Documents:** 5
- **Total Lines:** ~2,582 lines
- **Coverage:** All critical development areas
- **Last Updated:** December 2024

## Verification

All steering documents are verified against the actual codebase:

✅ Architecture principles match implementation  
✅ Conventions align with tsconfig.json  
✅ Testing standards match jest.config.js  
✅ Security practices implemented in code  
✅ Performance benchmarks achievable  

## Maintenance

### When to Update

Update steering documents when:
- Architecture decisions change (create ADR first)
- New patterns emerge from code reviews
- Performance benchmarks are adjusted
- Security requirements evolve
- Testing standards are modified

### Review Schedule

- **Quarterly:** Full review of all documents
- **Per Release:** Verify alignment with codebase
- **On ADR:** Update relevant sections

## Related Documentation

- [Specifications](.kiro/specs/) - Detailed design documents
- [Agent Hooks](.kiro/hooks/) - Automation configurations
- [ADRs](docs/adr/) - Architecture decision records
- [Main README](../../README.md) - Project overview

## Contributing

When updating steering documents:

1. Ensure changes align with actual codebase
2. Update examples to reflect current patterns
3. Maintain consistent formatting
4. Add verification steps if needed
5. Update this README if structure changes

---

**Note:** These documents are living standards that evolve with the project. They should always reflect the current state and best practices of the AgentOS codebase.

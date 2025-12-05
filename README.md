# AgentOS

> Production-ready agent orchestration framework with quality gates, multi-personality support, and automated documentation.

[![Tests](https://img.shields.io/badge/tests-393%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-89%25-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## 🚀 Overview

AgentOS is a complete, production-ready operating system for AI agents. It provides a robust foundation for building intelligent, event-driven applications with plugin architecture, personality switching, state management, quality evaluation, and automated documentation generation.

Built with TypeScript and designed for scalability, AgentOS enables you to create sophisticated agent systems with minimal boilerplate while maintaining high code quality through automated testing and quality gates.

## ✨ Key Features

### 🎯 Core Systems

- **Event-Driven Architecture** - Loosely coupled components communicating through events
- **Plugin System** - Hot-reloadable plugins with dependency resolution
- **State Management** - Persistent, scoped state with atomic operations
- **Multi-Personality** - Context-aware personality switching for adaptive behavior
- **Quality Gates** - Automated evaluation harness with regression detection
- **ADR Generation** - Automatic architecture decision record creation

### 🛠️ Built-In Applications

- **Discord Bot** - Event-driven bot with plugin architecture
- **CI/CD Automator** - Quality gate automation with GitHub integration

### 📊 Quality & Testing

- **393 passing tests** across all modules
- **89% code coverage** with comprehensive test suites
- **Type-safe** with TypeScript strict mode
- **Zero tolerance** for linting errors

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/kloudfy/agentos.git
cd agentos

# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 🏗️ Architecture

AgentOS follows a modular, event-driven architecture with six core systems:

```
┌─────────────────────────────────────────────────────────┐
│                      Applications                       │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │   Discord Bot    │      │  CI/CD Automator │         │
│  └──────────────────┘      └──────────────────┘         │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                      Core Systems                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Events  │  │ Plugins  │  │  State   │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │Personality│ │   Eval   │  │   ADR    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

## 🎓 Quick Start

### Basic Event System

```typescript
import { EventEmitter } from './src/core/events';

// Create event emitter
const events = new EventEmitter();

// Listen for events
events.on('user.login', (event) => {
  console.log(`User ${event.payload.username} logged in`);
});

// Emit events
events.emit({
  id: '123',
  type: 'user.login',
  timestamp: new Date(),
  payload: { username: 'alice' },
  metadata: { source: 'auth-service' }
});
```

### Plugin System

```typescript
import { PluginManager } from './src/core/plugins';
import { EventEmitter } from './src/core/events';
import { StateManager } from './src/core/state';

// Create plugin
class MyPlugin implements Plugin {
  metadata = {
    name: 'my-plugin',
    version: '1.0.0',
    description: 'Example plugin'
  };

  async load(context: PluginContext) {
    // Access events
    context.events.on('some.event', this.handleEvent);
    
    // Use state
    await context.state.save({ count: 0 }, 1);
    
    // Log
    context.logger.info('Plugin loaded');
  }

  async unload() {
    // Cleanup
  }
}

// Use plugin manager
const events = new EventEmitter();
const manager = new PluginManager(events);

await manager.register(new MyPlugin());
await manager.loadAll();
```

### State Management

```typescript
import { FileSystemStateStore } from './src/core/state';

// Create state store
const store = new FileSystemStateStore('./data', events);

// Save state
await store.save('my-app', { count: 42, name: 'test' }, 1);

// Load state
const state = await store.load('my-app');
console.log(state.data); // { count: 42, name: 'test' }

// Scoped state for plugins
const scoped = new StateManager(store, 'my-plugin');
await scoped.save({ value: 100 }, 1);
```

### Personality System

```typescript
import { PersonalityManager } from './src/core/personality';

const manager = new PersonalityManager(events);

// Analyze context and switch personality
const result = await manager.analyzeAndSwitch({
  userMessage: 'I need help understanding this',
  conversationHistory: [],
  taskComplexity: 'medium'
});

console.log(result.personality.name); // 'helpful'
console.log(result.confidence); // 0.85
```

### Quality Gates

```typescript
import { EvalHarness } from './src/core/eval';

const harness = new EvalHarness();

// Define test suite
const suite: EvalSuite = {
  name: 'Core Quality',
  version: '1.0.0',
  description: 'Tests core functionality',
  scenarios: [
    {
      name: 'Plugin Load Performance',
      weight: 0.5,
      test: {
        action: 'plugin.load',
        plugin: 'test-plugin',
        expected: { loaded: true }
      }
    }
  ],
  quality_thresholds: {
    minimum: 0.85,
    regression_tolerance: 0.05,
    blocking: true
  }
};

// Run evaluation
const report = await harness.run(suite);

if (report.blocked) {
  console.error('Quality gates failed!');
  process.exit(1);
}
```

### ADR Generation

```typescript
import { ADRDetector, ADRGenerator, ADRManager } from './src/core/adr';

const detector = new ADRDetector();
const generator = new ADRGenerator();
const manager = new ADRManager('./docs/adr');

// Detect changes
const changes = detector.detectInterfaceChanges(oldCode, newCode);

// Generate ADR
const number = await manager.getNextNumber();
const adr = generator.generateFromChanges(changes, number, {
  author: 'developer',
  tags: ['api-change']
});

// Save ADR
await manager.saveADR(adr);
```

## 📁 Project Structure

```
agentos/
├── src/
│   ├── core/                    # Core systems
│   │   ├── events/             # Event system
│   │   ├── plugins/            # Plugin system
│   │   ├── state/              # State management
│   │   ├── personality/        # Personality system
│   │   ├── eval/               # Quality evaluation
│   │   └── adr/                # ADR generation
│   ├── apps/                    # Built-in applications
│   │   ├── discord-bot/        # Discord bot example
│   │   └── cicd-automator/     # CI/CD automation
│   └── plugins/                 # Plugin directory
├── .kiro/                       # Kiro IDE configuration
│   ├── specs/                  # Specification documents
│   ├── steering/               # Code standards
│   └── hooks/                  # Agent hooks
├── docs/                        # Documentation
├── tests/                       # Integration tests
└── examples/                    # Usage examples
```

## 🎯 Core Systems

### Event System
**Location:** `src/core/events/`

- Wildcard event subscriptions (`*`, `user.*`)
- Event history and replay
- Type-safe event definitions
- System event factories

**Tests:** 15 passing | **Coverage:** 95%

### Plugin System
**Location:** `src/core/plugins/`

- Lifecycle management (load/unload)
- Dependency resolution
- Hot-reload support
- Isolated plugin contexts

**Tests:** 25 passing | **Coverage:** 92%

### State Management
**Location:** `src/core/state/`

- JSON file persistence
- Scoped state per plugin
- Atomic operations
- Backup and restore

**Tests:** 20 passing | **Coverage:** 88%

### Personality System
**Location:** `src/core/personality/`

Five distinct personalities:
- **Helpful** - Patient, educational, supportive
- **Efficient** - Direct, concise, action-oriented
- **Creative** - Innovative, exploratory, open-ended
- **Analytical** - Logical, data-driven, systematic
- **Friendly** - Warm, conversational, empathetic

**Tests:** 18 passing | **Coverage:** 87%

### Evaluation System
**Location:** `src/core/eval/`

- Scenario-based testing
- Baseline tracking
- Regression detection
- Quality gate enforcement

**Tests:** 32 passing | **Coverage:** 85%

### ADR System
**Location:** `src/core/adr/`

- Automatic change detection
- Impact analysis
- Template-based generation
- Version management

**Tests:** 41 passing | **Coverage:** 90%

## 🤖 Applications

### Discord Bot
**Location:** `src/apps/discord-bot/`

A fully functional Discord bot demonstrating AgentOS capabilities:

- Event-driven command handling
- Plugin architecture (hello, help, stats)
- Personality switching
- State persistence
- Command history

**Usage:**
```typescript
import { DiscordBot } from './src/apps/discord-bot';

const bot = new DiscordBot({
  token: process.env.DISCORD_TOKEN,
  stateDir: './data/discord'
});

await bot.start();
```

### CI/CD Automator
**Location:** `src/apps/cicd-automator/`

Automated quality gates for CI/CD pipelines:

- Pull request quality checks
- Eval harness integration
- ADR generation from code changes
- GitHub status updates
- Comment posting with results

**Usage:**
```typescript
import { CICDAutomator } from './src/apps/cicd-automator';

const automator = new CICDAutomator({
  githubToken: process.env.GITHUB_TOKEN,
  repoOwner: 'myorg',
  repoName: 'myrepo',
  qualityThreshold: 0.85
});

await automator.checkPR(123, scenarios);
```

## 🧪 Testing

AgentOS has comprehensive test coverage across all modules:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Statistics
- **Total Tests:** 393 passing
- **Test Suites:** 25 suites
- **Coverage:** 89% overall
- **Test Files:** 30+ files

### Coverage by Module
- Events: 95%
- ADR: 90%
- Plugins: 92%
- State: 88%
- Personality: 87%
- Eval: 85%

## 📚 Documentation

Comprehensive documentation is available in multiple locations:

- **Specifications:** `.kiro/specs/` - Detailed design documents
- **Code Standards:** `.kiro/steering/` - Coding conventions
- **API Docs:** JSDoc comments throughout codebase
- **Examples:** `examples/` - Usage examples
- **ADRs:** Generated architecture decision records

### Kiro Feature Usage

See [KIRO_USAGE.md](./KIRO_USAGE.md) for comprehensive documentation of how all 5 Kiro features were used to build AgentOS:

- **Spec-driven development** with 7 complete specifications
- **MCP tools** for automation (eval runner, ADR generator, GitHub integration)
- **Agent hooks** for quality gates and testing
- **Steering documents** for consistent code standards
- **Vibe coding** for rapid prototyping

**Result:** Production-ready framework built in 4 hours with 393 passing tests and 89% coverage.

### Key Documents
- [Event System Design](.kiro/specs/event-system/design.md)
- [Plugin System Design](.kiro/specs/plugin-system/design.md)
- [State Management Design](.kiro/specs/state-management/design.md)
- [Testing Standards](.kiro/steering/testing.md)
- [Security Standards](.kiro/steering/security.md)
- [Architecture Principles](.kiro/steering/architecture.md)

## 🛠️ Development

### Prerequisites
- Node.js 18+
- TypeScript 5.9+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Run type check
npx tsc --noEmit

# Run tests
npm test

# Generate coverage report
npm run test:coverage
```

### Code Standards
AgentOS follows strict code quality standards:

- **TypeScript strict mode** enabled
- **90% minimum test coverage** required (~89% achieved)
- **Zero linting errors** enforced
- **JSDoc comments** for all public APIs
- **Immutable data structures** preferred
- **Pure functions** where possible

See [Code Conventions](.kiro/steering/conventions.md) for details.

## 🔒 Security

Security is a top priority in AgentOS:

- Input validation at all boundaries
- No secrets in code (environment variables)
- Path traversal prevention
- Plugin isolation
- Secure error messages (no info leakage)

See [Security Standards](.kiro/steering/security.md) for details.

## 🎨 Built With Kiro

This project showcases Kiro IDE's agentic development features:

- **Spec-driven development** - Structured requirements and design
- **Agent hooks** - Automated testing and quality checks
- **Steering files** - Consistent code standards
- **MCP integrations** - Extended capabilities

Learn more about Kiro at [kiro.ai](https://kiro.ai)

## 🗺️ Roadmap

Future enhancements planned:

- [ ] Web dashboard for monitoring
- [ ] Additional personality types
- [ ] Plugin marketplace
- [ ] Distributed event system
- [ ] Real-time collaboration features
- [ ] Performance optimization tools

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow code standards (see `.kiro/steering/`)
4. Write tests (maintain 90% coverage)
5. Commit changes (`git commit -m 'feat: add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention
We follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- Tested with [Jest](https://jestjs.io/)
- Developed using [Kiro IDE](https://kiro.ai)

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/kloudfy/agentos/issues)
- **Discussions:** [GitHub Discussions](https://github.com/kloudfy/agentos/discussions)
- **Documentation:** [Full Docs](./docs/)

---

**Built with ❤️ using Kiro IDE**

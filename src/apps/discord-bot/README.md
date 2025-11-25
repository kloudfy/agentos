# Discord Bot Application

An intelligent Discord bot powered by AgentOS, demonstrating integration of all core systems.

## Features

- **Event-Driven Architecture**: All actions flow through the event system
- **Plugin System**: Extensible command system with hot-reloading support
- **Personality Switching**: Adapts responses based on context and user
- **State Persistence**: Remembers user preferences and command history
- **Comprehensive Logging**: Full audit trail of all bot actions

## Architecture

```
Discord Bot
├── bot.ts                 # Main bot implementation
└── plugins/
    ├── hello.ts          # Greeting command
    ├── help.ts           # Help system
    └── stats.ts          # Statistics tracking
```

## Quick Start

### Prerequisites

- Node.js 18+
- Discord Bot Token
- TypeScript

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
DISCORD_TOKEN=your_bot_token_here
BOT_PREFIX=!
STATE_DIR=./data/discord-state
```

### Running the Bot

```bash
# Development mode
npm run dev:discord

# Production mode
npm start:discord
```

## Usage

### Available Commands

#### !hello
Greets you with a friendly message. The greeting adapts based on the bot's current personality.

**Examples:**
```
!hello
```

**Response:**
```
Hello Alice! How can I help you today?
```

#### !help [command]
Shows help information for all commands or a specific command.

**Examples:**
```
!help
!help hello
!help stats
```

#### !stats
Displays bot statistics including uptime, commands executed, and more.

**Examples:**
```
!stats
```

**Response:**
```
📊 Bot Statistics:
  Uptime: 2h 15m 30s
  Commands Executed: 42
  Messages Processed: 156
  Plugins Loaded: 3
  Personality Switches: 8

🏆 Top Commands:
  hello: 15 times
  help: 12 times
  stats: 10 times
```

## Personality System

The bot automatically switches personalities based on context:

- **Helpful**: Friendly and supportive (default)
- **Efficient**: Brief and to-the-point
- **Creative**: Enthusiastic and imaginative
- **Analytical**: Logical and detailed
- **Empathetic**: Understanding and compassionate

### Example Personality Switching

```
User: !hello
Bot (Helpful): Hello Alice! How can I help you today?

User: !hello
Bot (Efficient): Hi Alice.

User: !hello
Bot (Creative): Hey there, Alice! 🎨 Ready to create something amazing?
```

## Plugin Development

### Creating a New Plugin

```typescript
import { Plugin } from '../../../core/plugins/plugin';
import { PluginContext } from '../../../core/plugins/plugin-context';

export class MyPlugin implements Plugin {
  readonly name = 'my-plugin';
  readonly version = '1.0.0';
  readonly description = 'My custom plugin';

  async initialize(context: PluginContext): Promise<void> {
    // Listen for command events
    context.events.on('command.executed', (event) => {
      if (event.payload?.command === 'mycommand') {
        this.handleCommand(event.payload);
      }
    });
  }

  private async handleCommand(payload: any): Promise<void> {
    // Handle your command
    console.log('My command executed!');
  }

  async shutdown(): Promise<void> {
    // Cleanup
  }
}
```

### Plugin Lifecycle

1. **Initialize**: Called when plugin is loaded
2. **Event Handling**: Listen and respond to events
3. **State Management**: Store and retrieve data
4. **Shutdown**: Cleanup when plugin is unloaded

## State Management

The bot persists data using the FileSystemStateStore:

```typescript
// Store user preference
await context.state.set('user:123:theme', 'dark');

// Retrieve user preference
const theme = await context.state.get<string>('user:123:theme');

// Store command history
const history = await context.state.get<string[]>('user:123:commands') || [];
history.push('hello');
await context.state.set('user:123:commands', history);
```

### State Keys

- `user:{id}:commands` - User command history
- `user:{id}:preferences` - User preferences
- `hello:count` - Total greetings sent
- `help:requests` - Help requests count
- `stats:commands` - Commands executed
- `stats:messages` - Messages processed

## Event System

All bot actions emit events:

### Bot Events

- `bot.started` - Bot has started
- `bot.stopped` - Bot has stopped
- `message.received` - Message received from Discord
- `message.sent` - Message sent to Discord
- `command.executed` - Command was executed

### Plugin Events

- `plugin.loaded` - Plugin was loaded
- `plugin.error` - Plugin encountered an error
- `personality.switched` - Personality changed

### Listening to Events

```typescript
events.on('command.executed', (event) => {
  console.log(`Command: ${event.payload.command}`);
  console.log(`User: ${event.payload.user}`);
  console.log(`Personality: ${event.payload.personality}`);
});
```

## Testing

```bash
# Run bot tests
npm test -- src/apps/discord-bot

# Run with coverage
npm test -- src/apps/discord-bot --coverage
```

## Production Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist/ ./dist/

ENV NODE_ENV=production

CMD ["node", "dist/apps/discord-bot/bot.js"]
```

### Environment Variables

```env
# Required
DISCORD_TOKEN=your_token

# Optional
BOT_PREFIX=!
STATE_DIR=/data/state
PLUGIN_DIR=/app/plugins
ENABLE_PERSONALITY=true
LOG_LEVEL=info
```

### Monitoring

The bot emits metrics that can be collected:

```typescript
// Get bot statistics
const stats = await bot.getStats();

// Get user command history
const history = await bot.getUserCommandHistory('user123');

// Monitor events
events.on('*', (event) => {
  metrics.increment(`event.${event.type}`);
});
```

## Troubleshooting

### Bot Won't Start

1. Check Discord token is valid
2. Verify bot has necessary permissions
3. Check state directory is writable

### Commands Not Working

1. Verify command prefix matches configuration
2. Check plugin is loaded successfully
3. Review event logs for errors

### State Not Persisting

1. Verify state directory exists and is writable
2. Check disk space
3. Review file permissions

## Advanced Features

### Custom Personality

Create custom personality profiles:

```typescript
const customPersonality = {
  name: 'custom',
  description: 'My custom personality',
  traits: ['friendly', 'technical'],
  patterns: ['help me', 'how do i'],
  responseStyle: 'detailed',
};

personalityManager.addPersonality(customPersonality);
```

### Command Middleware

Add middleware to process commands:

```typescript
events.on('command.executed', async (event) => {
  // Rate limiting
  if (await isRateLimited(event.payload.user)) {
    return;
  }

  // Permission checking
  if (!await hasPermission(event.payload.user, event.payload.command)) {
    return;
  }

  // Continue processing...
});
```

### Analytics

Track detailed analytics:

```typescript
// Track command usage
events.on('command.executed', (event) => {
  analytics.track('command', {
    command: event.payload.command,
    user: event.payload.user,
    personality: event.payload.personality,
    timestamp: event.timestamp,
  });
});

// Generate reports
const report = await analytics.generateReport('daily');
```

## Contributing

1. Create a new plugin in `plugins/`
2. Follow TypeScript strict mode
3. Add comprehensive JSDoc comments
4. Include tests
5. Update this README

## License

Part of AgentOS - see main project license.

## Support

- Documentation: `docs/`
- Issues: GitHub Issues
- Discord: [AgentOS Community](https://discord.gg/agentos)

## References

- [Discord.js Documentation](https://discord.js.org/)
- [AgentOS Core Systems](../../core/README.md)
- [Plugin Development Guide](../../core/plugins/README.md)
- [Event System Guide](../../core/events/README.md)

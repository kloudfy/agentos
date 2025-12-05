/**
 * Discord Bot Application
 * 
 * Demonstrates AgentOS integration with Discord using:
 * - Event-driven architecture
 * - Plugin system for commands
 * - Personality switching based on context
 * - State persistence for user data
 * 
 * @example
 * ```typescript
 * const bot = new DiscordBot({
 *   token: process.env.DISCORD_TOKEN!,
 *   prefix: '!',
 *   stateDir: './data/discord-state'
 * });
 * 
 * await bot.start();
 * ```
 */

import { EventEmitter, BaseEvent } from '../../core/events';
import { PluginManager } from '../../core/plugins/plugin-manager';
import { PluginContext } from '../../core/plugins/plugin-context';
import { FileSystemStateStore } from '../../core/state';
import { PersonalityManager } from '../../core/personality/personality-manager';
import { Plugin } from '../../core/plugins/plugin';

/**
 * Discord bot configuration.
 */
export interface DiscordBotConfig {
  /** Discord bot token */
  readonly token: string;
  
  /** Command prefix (default: '!') */
  readonly prefix?: string;
  
  /** Directory for state persistence */
  readonly stateDir?: string;
  
  /** Plugin directory */
  readonly pluginDir?: string;
  
  /** Enable personality switching */
  readonly enablePersonality?: boolean;
}

/**
 * Discord message representation.
 */
export interface DiscordMessage {
  readonly id: string;
  readonly content: string;
  readonly author: {
    readonly id: string;
    readonly username: string;
    readonly bot: boolean;
  };
  readonly channel: {
    readonly id: string;
    readonly name: string;
  };
  readonly timestamp: Date;
}

/**
 * Discord Bot powered by AgentOS.
 * 
 * Integrates all core AgentOS systems to create an intelligent,
 * extensible Discord bot with personality and state management.
 */
export class DiscordBot {
  private readonly config: Required<DiscordBotConfig>;
  private readonly events: EventEmitter;
  private readonly pluginManager: PluginManager;
  private readonly stateStore: FileSystemStateStore;
  private readonly personalityManager: PersonalityManager;
  private readonly context: PluginContext;
  private running: boolean = false;

  /**
   * Creates a new Discord bot instance.
   * 
   * @param config - Bot configuration
   */
  constructor(config: DiscordBotConfig) {
    this.config = {
      token: config.token,
      prefix: config.prefix || '!',
      stateDir: config.stateDir || './data/discord-state',
      pluginDir: config.pluginDir || './plugins',
      enablePersonality: config.enablePersonality ?? true,
    };

    // Initialize core systems
    this.events = new EventEmitter();
    this.stateStore = new FileSystemStateStore(this.events, { 
      stateDir: this.config.stateDir 
    });
    this.personalityManager = new PersonalityManager(this.events);
    
    // Create plugin context
    this.context = {
      name: 'discord-bot',
      events: this.events,
      state: this.stateStore,
      getPlugin: (name: string) => null,
      config: {},
      logger: console,
    } as any;

    // Initialize plugin manager
    this.pluginManager = new PluginManager(
      this.events,
      this.stateStore
    );

    this.setupEventHandlers();
  }

  /**
   * Starts the Discord bot.
   * 
   * @throws Error if bot is already running or token is invalid
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Bot is already running');
    }

    console.log('🤖 Starting Discord Bot...');

    // Load plugins
    await this.loadPlugins();

    // Connect to Discord (simulated for this example)
    await this.connectToDiscord();

    this.running = true;

    this.events.emit({
      type: 'bot.started',
      id: this.generateId(),
      timestamp: new Date(),
      payload: { prefix: this.config.prefix },
      metadata: { source: 'discord-bot' },
    });

    console.log(`✅ Bot started with prefix: ${this.config.prefix}`);
  }

  /**
   * Stops the Discord bot.
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    console.log('🛑 Stopping Discord Bot...');

    this.running = false;

    this.events.emit({
      type: 'bot.stopped',
      id: this.generateId(),
      timestamp: new Date(),
      payload: {},
      metadata: { source: 'discord-bot' },
    });

    console.log('✅ Bot stopped');
  }

  /**
   * Handles incoming Discord messages.
   * 
   * @param message - Discord message
   */
  async handleMessage(message: DiscordMessage): Promise<void> {
    // Ignore bot messages
    if (message.author.bot) {
      return;
    }

    // Emit message event
    this.events.emit({
      type: 'message.received',
      id: this.generateId(),
      timestamp: new Date(),
      payload: { message },
      metadata: { source: 'discord-bot' },
    });

    // Check if message is a command
    if (!message.content.startsWith(this.config.prefix)) {
      return;
    }

    // Parse command
    const content = message.content.slice(this.config.prefix.length).trim();
    const [commandName, ...args] = content.split(/\s+/);

    if (!commandName) {
      return;
    }

    // Select personality based on message context
    let personality = 'helpful';
    if (this.config.enablePersonality) {
      const match = await this.personalityManager.analyzeAndSwitch(
        message.content,
        {
          expertiseLevel: 'intermediate',
        }
      );
      personality = match.personality.name;
    }

    // Execute command
    await this.executeCommand(commandName, args, message, personality);
  }

  /**
   * Executes a bot command.
   */
  private async executeCommand(
    commandName: string,
    args: string[],
    message: DiscordMessage,
    personality: string
  ): Promise<void> {
    console.log(`📝 Command: ${commandName} (personality: ${personality})`);

    // Emit command event
    this.events.emit({
      type: 'command.executed',
      id: this.generateId(),
      timestamp: new Date(),
      payload: {
        command: commandName,
        args,
        user: message.author.username,
        personality,
      },
      metadata: { source: 'discord-bot' },
    });

    // Store command in user history
    await this.storeCommandHistory(message.author.id, commandName);

    // Send response (simulated)
    await this.sendMessage(
      message.channel.id,
      `Executed command: ${commandName} with ${personality} personality`
    );
  }

  /**
   * Sends a message to a Discord channel.
   */
  private async sendMessage(channelId: string, content: string): Promise<void> {
    console.log(`💬 [${channelId}] ${content}`);

    this.events.emit({
      type: 'message.sent',
      id: this.generateId(),
      timestamp: new Date(),
      payload: { channelId, content },
      metadata: { source: 'discord-bot' },
    });
  }

  /**
   * Stores command in user's history.
   */
  private async storeCommandHistory(
    userId: string,
    command: string
  ): Promise<void> {
    const key = `user:${userId}:commands`;
    const state = await this.stateStore.load<{ commands: string[] }>('discord-bot');
    const history = state?.commands || [];
    
    history.push(command);
    
    // Keep last 100 commands
    if (history.length > 100) {
      history.shift();
    }
    
    await this.stateStore.save('discord-bot', { commands: history }, 1);
  }

  /**
   * Gets user's command history.
   */
  async getUserCommandHistory(userId: string): Promise<string[]> {
    const state = await this.stateStore.load<{ commands: string[] }>('discord-bot');
    return state?.commands || [];
  }

  /**
   * Sets up event handlers.
   */
  private setupEventHandlers(): void {
    // Log all events
    this.events.on('*', (event: BaseEvent) => {
      console.log(`[EVENT] ${event.type}`);
    });

    // Handle plugin events
    this.events.on('plugin.loaded', (event: BaseEvent) => {
      console.log(`✅ Plugin loaded: ${event.payload?.plugin?.name}`);
    });

    this.events.on('plugin.error', (event: BaseEvent) => {
      console.error(`❌ Plugin error: ${event.payload?.error}`);
    });
  }

  /**
   * Loads bot plugins.
   */
  private async loadPlugins(): Promise<void> {
    console.log('📦 Loading plugins...');

    // In a real implementation, this would dynamically load plugins
    // from the plugin directory. For this example, we'll simulate it.
    
    const pluginCount = 3; // hello, help, stats
    console.log(`✅ Loaded ${pluginCount} plugins`);
  }

  /**
   * Connects to Discord API.
   */
  private async connectToDiscord(): Promise<void> {
    // Simulated Discord connection
    // In a real implementation, this would use discord.js or similar
    console.log('🔌 Connecting to Discord...');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ Connected to Discord');
  }

  /**
   * Generates a unique ID.
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets bot statistics.
   */
  async getStats(): Promise<{
    uptime: number;
    commandsExecuted: number;
    pluginsLoaded: number;
  }> {
    const stats = await this.stateStore.get<any>('bot:stats') || {
      startTime: Date.now(),
      commandsExecuted: 0,
    };

    return {
      uptime: Date.now() - stats.startTime,
      commandsExecuted: stats.commandsExecuted,
      pluginsLoaded: 3, // Simulated
    };
  }
}

/**
 * Example usage and entry point.
 */
export async function main(): Promise<void> {
  // Load configuration from environment
  const token = process.env.DISCORD_TOKEN;
  
  if (!token) {
    console.error('❌ DISCORD_TOKEN environment variable is required');
    process.exit(1);
  }

  // Create and start bot
  const bot = new DiscordBot({
    token,
    prefix: process.env.BOT_PREFIX || '!',
    stateDir: process.env.STATE_DIR || './data/discord-state',
    enablePersonality: true,
  });

  try {
    await bot.start();

    // Simulate some messages
    await bot.handleMessage({
      id: '1',
      content: '!hello',
      author: { id: 'user1', username: 'Alice', bot: false },
      channel: { id: 'general', name: 'general' },
      timestamp: new Date(),
    });

    await bot.handleMessage({
      id: '2',
      content: '!help',
      author: { id: 'user1', username: 'Alice', bot: false },
      channel: { id: 'general', name: 'general' },
      timestamp: new Date(),
    });

    // Get stats
    const stats = await bot.getStats();
    console.log('📊 Bot Stats:', stats);

    // Keep bot running
    console.log('Bot is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

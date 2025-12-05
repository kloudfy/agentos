/**
 * Help Plugin
 * 
 * Provides help information about available commands.
 */

import { Plugin } from '../../../core/plugins/plugin';
import { PluginContext } from '../../../core/plugins/plugin-context';

/**
 * Command information.
 */
interface CommandInfo {
  readonly name: string;
  readonly description: string;
  readonly usage: string;
  readonly examples: readonly string[];
}

/**
 * Help command plugin.
 * 
 * Displays available commands and their usage.
 */
export class HelpPlugin implements Plugin {
  readonly metadata = {
    name: 'help',
    version: '1.0.0',
    description: 'Displays help information for commands',
  };

  private context?: PluginContext;
  private commands: Map<string, CommandInfo> = new Map();

  /**
   * Initializes the help plugin.
   */
  async load(context: PluginContext): Promise<void> {
    this.context = context;

    // Register available commands
    this.registerCommands();

    // Listen for command events
    context.events.on('command.executed', (event) => {
      const payload = event.payload as any;
      if (payload?.command === 'help') {
        this.handleHelp(payload);
      }
    });

    console.log('✅ Help plugin initialized');
  }

  /**
   * Registers available commands.
   */
  private registerCommands(): void {
    this.commands.set('hello', {
      name: 'hello',
      description: 'Greets you with a friendly message',
      usage: '!hello',
      examples: ['!hello'],
    });

    this.commands.set('help', {
      name: 'help',
      description: 'Shows this help message',
      usage: '!help [command]',
      examples: ['!help', '!help hello'],
    });

    this.commands.set('stats', {
      name: 'stats',
      description: 'Shows bot statistics',
      usage: '!stats',
      examples: ['!stats'],
    });
  }

  /**
   * Handles the help command.
   */
  private async handleHelp(payload: any): Promise<void> {
    const args = payload.args || [];
    const specificCommand = args[0];

    if (specificCommand) {
      // Show help for specific command
      this.showCommandHelp(specificCommand);
    } else {
      // Show general help
      this.showGeneralHelp();
    }

    // Track help requests
    if (this.context) {
      const state = await this.context.state.load<{ requests: number }>();
      const count = state?.data?.requests || 0;
      await this.context.state.save({ requests: count + 1 }, 1);
    }
  }

  /**
   * Shows general help message.
   */
  private showGeneralHelp(): void {
    console.log('\n📚 Available Commands:\n');

    for (const [name, info] of this.commands) {
      console.log(`  ${info.usage}`);
      console.log(`    ${info.description}`);
      console.log('');
    }

    console.log('💡 Tip: Use !help <command> for detailed information\n');
  }

  /**
   * Shows help for a specific command.
   */
  private showCommandHelp(commandName: string): void {
    const command = this.commands.get(commandName);

    if (!command) {
      console.log(`❌ Unknown command: ${commandName}`);
      console.log('💡 Use !help to see all available commands');
      return;
    }

    console.log(`\n📖 Help: ${command.name}\n`);
    console.log(`Description: ${command.description}`);
    console.log(`Usage: ${command.usage}`);
    console.log('\nExamples:');
    for (const example of command.examples) {
      console.log(`  ${example}`);
    }
    console.log('');
  }

  /**
   * Gets help request count.
   */
  async getHelpRequestCount(): Promise<number> {
    if (!this.context) {
      return 0;
    }
    const state = await this.context.state.load<{ requests: number }>();
    return state?.data?.requests || 0;
  }

  /**
   * Cleanup on shutdown.
   */
  async unload(): Promise<void> {
    console.log('📚 Help plugin shutting down');
  }
}

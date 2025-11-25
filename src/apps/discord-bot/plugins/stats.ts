/**
 * Stats Plugin
 * 
 * Displays bot statistics and metrics.
 */

import { Plugin } from '../../../core/plugins/plugin';
import { PluginContext } from '../../../core/plugins/plugin-context';

/**
 * Bot statistics.
 */
interface BotStats {
  readonly uptime: number;
  readonly commandsExecuted: number;
  readonly messagesProcessed: number;
  readonly pluginsLoaded: number;
  readonly personalitySwitches: number;
}

/**
 * Stats command plugin.
 * 
 * Tracks and displays bot statistics.
 */
export class StatsPlugin implements Plugin {
  readonly name = 'stats';
  readonly version = '1.0.0';
  readonly description = 'Displays bot statistics and metrics';

  private context?: PluginContext;
  private startTime: number = Date.now();

  /**
   * Initializes the stats plugin.
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;

    // Listen for various events to track stats
    context.events.on('command.executed', () => this.incrementStat('commands'));
    context.events.on('message.received', () => this.incrementStat('messages'));
    context.events.on('personality.switched', () => this.incrementStat('personality'));

    // Listen for stats command
    context.events.on('command.executed', (event) => {
      if (event.payload?.command === 'stats') {
        this.handleStats(event.payload);
      }
    });

    console.log('✅ Stats plugin initialized');
  }

  /**
   * Handles the stats command.
   */
  private async handleStats(payload: any): Promise<void> {
    const stats = await this.getStats();

    console.log('\n📊 Bot Statistics:\n');
    console.log(`  Uptime: ${this.formatUptime(stats.uptime)}`);
    console.log(`  Commands Executed: ${stats.commandsExecuted}`);
    console.log(`  Messages Processed: ${stats.messagesProcessed}`);
    console.log(`  Plugins Loaded: ${stats.pluginsLoaded}`);
    console.log(`  Personality Switches: ${stats.personalitySwitches}`);
    console.log('');

    // Show top commands
    await this.showTopCommands();
  }

  /**
   * Gets current bot statistics.
   */
  async getStats(): Promise<BotStats> {
    if (!this.context) {
      return {
        uptime: 0,
        commandsExecuted: 0,
        messagesProcessed: 0,
        pluginsLoaded: 0,
        personalitySwitches: 0,
      };
    }

    return {
      uptime: Date.now() - this.startTime,
      commandsExecuted: await this.getStat('commands'),
      messagesProcessed: await this.getStat('messages'),
      pluginsLoaded: 3, // Simulated
      personalitySwitches: await this.getStat('personality'),
    };
  }

  /**
   * Shows top commands by usage.
   */
  private async showTopCommands(): Promise<void> {
    if (!this.context) {
      return;
    }

    const commandCounts = await this.context.state.get<Record<string, number>>('stats:commands') || {};
    const sorted = Object.entries(commandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (sorted.length > 0) {
      console.log('🏆 Top Commands:');
      for (const [command, count] of sorted) {
        console.log(`  ${command}: ${count} times`);
      }
      console.log('');
    }
  }

  /**
   * Increments a statistic counter.
   */
  private async incrementStat(stat: string): Promise<void> {
    if (!this.context) {
      return;
    }

    const key = `stats:${stat}`;
    const current = await this.context.state.get<number>(key) || 0;
    await this.context.state.set(key, current + 1);
  }

  /**
   * Gets a statistic value.
   */
  private async getStat(stat: string): Promise<number> {
    if (!this.context) {
      return 0;
    }

    const key = `stats:${stat}`;
    return await this.context.state.get<number>(key) || 0;
  }

  /**
   * Formats uptime in human-readable format.
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Resets all statistics.
   */
  async resetStats(): Promise<void> {
    if (!this.context) {
      return;
    }

    await this.context.state.set('stats:commands', 0);
    await this.context.state.set('stats:messages', 0);
    await this.context.state.set('stats:personality', 0);
    
    this.startTime = Date.now();
    
    console.log('🔄 Statistics reset');
  }

  /**
   * Cleanup on shutdown.
   */
  async shutdown(): Promise<void> {
    console.log('📊 Stats plugin shutting down');
  }
}

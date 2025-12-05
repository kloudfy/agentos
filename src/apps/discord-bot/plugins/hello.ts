/**
 * Hello Plugin
 * 
 * Simple greeting plugin that demonstrates basic command handling.
 */

import { Plugin } from '../../../core/plugins/plugin';
import { PluginContext } from '../../../core/plugins/plugin-context';

/**
 * Hello command plugin.
 * 
 * Responds to !hello command with a friendly greeting.
 */
export class HelloPlugin implements Plugin {
  readonly metadata = {
    name: 'hello',
    version: '1.0.0',
    description: 'Greets users with a friendly message',
  };

  private context?: PluginContext;

  /**
   * Initializes the hello plugin.
   */
  async load(context: PluginContext): Promise<void> {
    this.context = context;

    // Listen for command events
    context.events.on('command.executed', (event) => {
      const payload = event.payload as any;
      if (payload?.command === 'hello') {
        this.handleHello(payload);
      }
    });

    console.log('✅ Hello plugin initialized');
  }

  /**
   * Handles the hello command.
   */
  private async handleHello(payload: any): Promise<void> {
    const username = payload.user || 'friend';
    const personality = payload.personality || 'helpful';

    // Customize greeting based on personality
    let greeting = '';
    switch (personality) {
      case 'helpful':
        greeting = `Hello ${username}! How can I help you today?`;
        break;
      case 'efficient':
        greeting = `Hi ${username}.`;
        break;
      case 'creative':
        greeting = `Hey there, ${username}! 🎨 Ready to create something amazing?`;
        break;
      case 'analytical':
        greeting = `Greetings, ${username}. What would you like to analyze?`;
        break;
      default:
        greeting = `Hello ${username}!`;
    }

    console.log(`👋 ${greeting}`);

    // Store greeting count
    if (this.context) {
      const state = await this.context.state.load<{ count: number }>();
      const count = state?.data?.count || 0;
      await this.context.state.save({ count: count + 1 }, 1);
    }
  }

  /**
   * Gets total greeting count.
   */
  async getGreetingCount(): Promise<number> {
    if (!this.context) {
      return 0;
    }
    const state = await this.context.state.load<{ count: number }>();
    return state?.data?.count || 0;
  }

  /**
   * Cleanup on shutdown.
   */
  async unload(): Promise<void> {
    console.log('👋 Hello plugin shutting down');
  }
}

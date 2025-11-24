import { EventEmitter, EventLogger, SystemEvents } from '../src/core/events';

/**
 * Demo of EventLogger with colorful output and statistics
 */
async function demo() {
  const emitter = new EventEmitter();

  // Create logger with optional filter and file output
  const logger = new EventLogger(emitter, {
    // filter: /^plugin\./,  // Uncomment to only log plugin.* events
    // logFile: './events.log'  // Uncomment to write to file
  });

  // Start logging
  logger.start();

  console.log('\n--- Emitting various events to demonstrate colors ---\n');

  // Success events (green)
  emitter.emit({
    id: '1',
    type: 'plugin.loaded',
    timestamp: new Date(),
    payload: { name: 'test-plugin', version: '1.0.0' },
  });

  emitter.emit({
    id: '2',
    type: 'plugin.initialized',
    timestamp: new Date(),
    payload: { name: 'test-plugin', duration: 45 },
  });

  emitter.emit({
    id: '3',
    type: 'task.completed',
    timestamp: new Date(),
    payload: { taskId: 'build-123', result: 'success' },
  });

  // Normal events (cyan)
  emitter.emit(SystemEvents.startup());

  emitter.emit({
    id: '4',
    type: 'state.changed',
    timestamp: new Date(),
    payload: { key: 'config', value: { enabled: true } },
  });

  // Warning events (yellow)
  emitter.emit({
    id: '5',
    type: 'plugin.warning',
    timestamp: new Date(),
    payload: { name: 'old-plugin', message: 'Deprecated API usage detected' },
  });

  emitter.emit({
    id: '6',
    type: 'system.degraded',
    timestamp: new Date(),
    payload: { reason: 'High memory usage', memoryMB: 450 },
  });

  // Error events (red)
  emitter.emit({
    id: '7',
    type: 'plugin.error',
    timestamp: new Date(),
    payload: { name: 'broken-plugin', error: 'Failed to initialize' },
  });

  emitter.emit({
    id: '8',
    type: 'task.failed',
    timestamp: new Date(),
    payload: { taskId: 'deploy-456', reason: 'Connection timeout' },
  });

  // Long payload to demonstrate multi-line formatting
  emitter.emit({
    id: '9',
    type: 'data.processed',
    timestamp: new Date(),
    payload: {
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      metadata: {
        source: 'api',
        timestamp: new Date().toISOString(),
        processingTime: 123,
      },
      results: { success: 8, failed: 2 },
    },
  });

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Stop logging - this will show statistics
  logger.stop();
}

demo().catch(console.error);

import { EventEmitter } from '../event-emitter';
import { EventLogger } from '../event-logger';
import { BaseEvent } from '../base-event';

describe('EventLogger', () => {
  let emitter: EventEmitter;
  let logger: EventLogger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    emitter = new EventEmitter();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    logger?.stop();
    consoleSpy.mockRestore();
  });

  describe('start and stop', () => {
    it('should start logging events', () => {
      logger = new EventLogger(emitter);
      logger.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event logger started')
      );
    });

    it('should stop logging events and show stats', () => {
      logger = new EventLogger(emitter);
      logger.start();
      consoleSpy.mockClear();

      logger.stop();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event Logger Statistics')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event logger stopped')
      );
    });

    it('should not start twice', () => {
      logger = new EventLogger(emitter);
      logger.start();
      consoleSpy.mockClear();

      logger.start();

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('event logging', () => {
    it('should log events to console', async () => {
      logger = new EventLogger(emitter);
      logger.start();
      consoleSpy.mockClear();

      const event: BaseEvent = {
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        payload: { data: 'test' },
        metadata: { source: 'test' },
      };

      await emitter.emit(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test.event')
      );
    });

    it('should handle events with empty payload', async () => {
      logger = new EventLogger(emitter);
      logger.start();
      consoleSpy.mockClear();

      const event: BaseEvent = {
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      };

      await emitter.emit(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test.event')
      );
    });

    it('should truncate long payloads', async () => {
      logger = new EventLogger(emitter);
      logger.start();
      consoleSpy.mockClear();

      const longPayload = { data: 'x'.repeat(300) };
      const event: BaseEvent = {
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        payload: longPayload,
        metadata: { source: 'test' },
      };

      await emitter.emit(event);

      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('...');
    });
  });

  describe('filtering', () => {
    it('should filter events by regex pattern', async () => {
      logger = new EventLogger(emitter, {
        filter: /^plugin\./,
      });
      logger.start();
      consoleSpy.mockClear();

      await emitter.emit({
        id: '1',
        type: 'plugin.loaded',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });

      await emitter.emit({
        id: '2',
        type: 'state.changed',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });

      // Should only log plugin.loaded
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('plugin.loaded')
      );
    });

    it('should filter events by string pattern', async () => {
      logger = new EventLogger(emitter, {
        filter: 'plugin.*',
      });
      logger.start();
      consoleSpy.mockClear();

      await emitter.emit({
        id: '1',
        type: 'plugin.loaded',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('statistics', () => {
    it('should track event counts', async () => {
      logger = new EventLogger(emitter);
      logger.start();

      await emitter.emit({
        id: '1',
        type: 'test.event',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });
      await emitter.emit({
        id: '2',
        type: 'test.event',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });
      await emitter.emit({
        id: '3',
        type: 'other.event',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });

      consoleSpy.mockClear();
      logger.stop();

      const statsCall = consoleSpy.mock.calls.find((call) =>
        call[0].includes('Total events: 3')
      );
      expect(statsCall).toBeDefined();
    });

    it('should categorize events correctly', async () => {
      logger = new EventLogger(emitter);
      logger.start();

      await emitter.emit({
        id: '1',
        type: 'plugin.loaded',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });
      await emitter.emit({
        id: '2',
        type: 'plugin.error',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });
      await emitter.emit({
        id: '3',
        type: 'plugin.warning',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });
      await emitter.emit({
        id: '4',
        type: 'state.changed',
        timestamp: new Date(),
        payload: {},
        metadata: { source: 'test' },
      });

      consoleSpy.mockClear();
      logger.stop();

      const statsOutput = consoleSpy.mock.calls
        .map((call) => String(call[0]))
        .join(' ');

      // Check for counts in the summary line
      expect(statsOutput).toContain('Total events: 4');
      expect(statsOutput).toContain('success');
      expect(statsOutput).toContain('errors');
      expect(statsOutput).toContain('warnings');
      expect(statsOutput).toContain('normal');
    });

    it('should show top event types', async () => {
      logger = new EventLogger(emitter);
      logger.start();

      // Emit same event type multiple times
      for (let i = 0; i < 5; i++) {
        await emitter.emit({
          id: `${i}`,
          type: 'frequent.event',
          timestamp: new Date(),
          payload: {},
          metadata: { source: 'test' },
        });
      }

      consoleSpy.mockClear();
      logger.stop();

      const statsOutput = consoleSpy.mock.calls
        .map((call) => call[0])
        .join('\n');

      expect(statsOutput).toMatch(/frequent\.event.*5/);
    });
  });
});

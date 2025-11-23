import { EventEmitter } from '../event-emitter';
import { BaseEvent } from '../base-event';
import { SystemEvents } from '../system-events';

/**
 * Test Utilities
 */

// Mock handler that tracks all calls
const createMockHandler = () => {
  const calls: BaseEvent[] = [];
  const handler = (event: BaseEvent) => {
    calls.push(event);
  };
  return { handler, calls };
};

// Async handler for testing async behavior
const createAsyncHandler = (delay: number) => {
  const calls: BaseEvent[] = [];
  const handler = async (event: BaseEvent) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    calls.push(event);
  };
  return { handler, calls };
};

// Error-throwing handler for testing error isolation
const createErrorHandler = (errorMessage: string) => {
  const calls: BaseEvent[] = [];
  const handler = (event: BaseEvent) => {
    calls.push(event);
    throw new Error(errorMessage);
  };
  return { handler, calls };
};

// Helper to create a test event
const createTestEvent = <T>(type: string, payload: T): BaseEvent<T> => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  type,
  timestamp: new Date(),
  payload,
  metadata: { source: 'test' },
});

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('BaseEvent Structure', () => {
    it('should have all required properties', () => {
      const event = createTestEvent('test.event', { data: 'test' });

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('payload');
      expect(event).toHaveProperty('metadata');
    });

    it('should support generic type parameter for payload', () => {
      interface CustomPayload {
        username: string;
        count: number;
      }

      const event: BaseEvent<CustomPayload> = createTestEvent('user.login', {
        username: 'john',
        count: 5,
      });

      expect(event.payload.username).toBe('john');
      expect(event.payload.count).toBe(5);
    });

    it('should have metadata with source, correlationId, and userId', () => {
      const event: BaseEvent = {
        id: 'test-id',
        type: 'test.event',
        timestamp: new Date(),
        payload: {},
        metadata: {
          source: 'test-source',
          correlationId: 'corr-123',
          userId: 'user-456',
        },
      };

      expect(event.metadata.source).toBe('test-source');
      expect(event.metadata.correlationId).toBe('corr-123');
      expect(event.metadata.userId).toBe('user-456');
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe to event type and call handler when event is emitted', async () => {
      const { handler, calls } = createMockHandler();
      emitter.on('user.login', handler);

      const event = createTestEvent('user.login', { username: 'john' });
      await emitter.emit(event);

      expect(calls).toHaveLength(1);
      expect(calls[0]).toBe(event);
    });

    it('should support multiple handlers for the same event type', async () => {
      const mock1 = createMockHandler();
      const mock2 = createMockHandler();
      const mock3 = createMockHandler();

      emitter.on('user.login', mock1.handler);
      emitter.on('user.login', mock2.handler);
      emitter.on('user.login', mock3.handler);

      const event = createTestEvent('user.login', { username: 'john' });
      await emitter.emit(event);

      expect(mock1.calls).toHaveLength(1);
      expect(mock2.calls).toHaveLength(1);
      expect(mock3.calls).toHaveLength(1);
    });

    it('should return unsubscribe function that removes handler', async () => {
      const { handler, calls } = createMockHandler();
      const unsubscribe = emitter.on('user.login', handler);

      const event1 = createTestEvent('user.login', { username: 'john' });
      await emitter.emit(event1);
      expect(calls).toHaveLength(1);

      unsubscribe();

      const event2 = createTestEvent('user.login', { username: 'jane' });
      await emitter.emit(event2);
      expect(calls).toHaveLength(1); // Still 1, not called again
    });

    it('should remove specific handler with off() method', async () => {
      const mock1 = createMockHandler();
      const mock2 = createMockHandler();

      emitter.on('user.login', mock1.handler);
      emitter.on('user.login', mock2.handler);

      emitter.off('user.login', mock1.handler);

      const event = createTestEvent('user.login', { username: 'john' });
      await emitter.emit(event);

      expect(mock1.calls).toHaveLength(0);
      expect(mock2.calls).toHaveLength(1);
    });

    it('should not throw when off() is called with non-existent handler', () => {
      const { handler } = createMockHandler();

      expect(() => {
        emitter.off('user.login', handler);
      }).not.toThrow();
    });

    it('should isolate handlers per event type', async () => {
      const loginHandler = createMockHandler();
      const logoutHandler = createMockHandler();

      emitter.on('user.login', loginHandler.handler);
      emitter.on('user.logout', logoutHandler.handler);

      const loginEvent = createTestEvent('user.login', { username: 'john' });
      await emitter.emit(loginEvent);

      expect(loginHandler.calls).toHaveLength(1);
      expect(logoutHandler.calls).toHaveLength(0);

      const logoutEvent = createTestEvent('user.logout', { username: 'john' });
      await emitter.emit(logoutEvent);

      expect(loginHandler.calls).toHaveLength(1);
      expect(logoutHandler.calls).toHaveLength(1);
    });
  });

  describe('Event Emission', () => {
    it('should emit event and execute all handlers', async () => {
      const mock1 = createMockHandler();
      const mock2 = createMockHandler();

      emitter.on('test.event', mock1.handler);
      emitter.on('test.event', mock2.handler);

      const event = createTestEvent('test.event', { data: 'test' });
      await emitter.emit(event);

      expect(mock1.calls).toHaveLength(1);
      expect(mock2.calls).toHaveLength(1);
    });

    it('should not throw when emitting event with no handlers', async () => {
      const event = createTestEvent('test.event', { data: 'test' });

      await expect(emitter.emit(event)).resolves.not.toThrow();
    });

    it('should await async handlers', async () => {
      const asyncMock = createAsyncHandler(50);
      emitter.on('test.event', asyncMock.handler);

      const event = createTestEvent('test.event', { data: 'test' });
      await emitter.emit(event);

      expect(asyncMock.calls).toHaveLength(1);
    });

    it('should return Promise that resolves', async () => {
      const { handler } = createMockHandler();
      emitter.on('test.event', handler);

      const event = createTestEvent('test.event', { data: 'test' });
      const result = emitter.emit(event);

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it('should pass correct event object to handlers', async () => {
      const { handler, calls } = createMockHandler();
      emitter.on('test.event', handler);

      const event = createTestEvent('test.event', { data: 'test', count: 42 });
      await emitter.emit(event);

      expect(calls[0].id).toBe(event.id);
      expect(calls[0].type).toBe('test.event');
      expect(calls[0].payload).toEqual({ data: 'test', count: 42 });
      expect(calls[0].metadata.source).toBe('test');
    });
  });

  describe('Error Isolation', () => {
    it('should execute all handlers even if one throws error', async () => {
      const errorMock = createErrorHandler('Handler failed');
      const successMock = createMockHandler();

      emitter.on('test.event', errorMock.handler);
      emitter.on('test.event', successMock.handler);

      const event = createTestEvent('test.event', { data: 'test' });
      await emitter.emit(event);

      expect(errorMock.calls).toHaveLength(1);
      expect(successMock.calls).toHaveLength(1);
    });

    it('should resolve emit Promise even when handler throws', async () => {
      const errorMock = createErrorHandler('Handler failed');
      emitter.on('test.event', errorMock.handler);

      const event = createTestEvent('test.event', { data: 'test' });

      await expect(emitter.emit(event)).resolves.toBeUndefined();
    });

    it('should allow successful handler to receive event despite other handler errors', async () => {
      const error1 = createErrorHandler('Error 1');
      const success = createMockHandler();
      const error2 = createErrorHandler('Error 2');

      emitter.on('test.event', error1.handler);
      emitter.on('test.event', success.handler);
      emitter.on('test.event', error2.handler);

      const event = createTestEvent('test.event', { data: 'test' });
      await emitter.emit(event);

      expect(success.calls).toHaveLength(1);
      expect(success.calls[0]).toBe(event);
    });
  });

  describe('Wildcard Listeners', () => {
    it('should register wildcard handler with "*"', async () => {
      const wildcardMock = createMockHandler();
      emitter.on('*', wildcardMock.handler);

      const event = createTestEvent('any.event', { data: 'test' });
      await emitter.emit(event);

      expect(wildcardMock.calls).toHaveLength(1);
    });

    it('should call wildcard handler for all event types', async () => {
      const wildcardMock = createMockHandler();
      emitter.on('*', wildcardMock.handler);

      const event1 = createTestEvent('user.login', { username: 'john' });
      const event2 = createTestEvent('user.logout', { username: 'john' });
      const event3 = createTestEvent('system.startup', { version: '1.0.0' });

      await emitter.emit(event1);
      await emitter.emit(event2);
      await emitter.emit(event3);

      expect(wildcardMock.calls).toHaveLength(3);
      expect(wildcardMock.calls[0].type).toBe('user.login');
      expect(wildcardMock.calls[1].type).toBe('user.logout');
      expect(wildcardMock.calls[2].type).toBe('system.startup');
    });

    it('should execute both wildcard and type-specific handlers', async () => {
      const wildcardMock = createMockHandler();
      const specificMock = createMockHandler();

      emitter.on('*', wildcardMock.handler);
      emitter.on('user.login', specificMock.handler);

      const event = createTestEvent('user.login', { username: 'john' });
      await emitter.emit(event);

      expect(wildcardMock.calls).toHaveLength(1);
      expect(specificMock.calls).toHaveLength(1);
    });

    it('should unsubscribe wildcard handler correctly', async () => {
      const wildcardMock = createMockHandler();
      const unsubscribe = emitter.on('*', wildcardMock.handler);

      const event1 = createTestEvent('test.event', { data: 'test' });
      await emitter.emit(event1);
      expect(wildcardMock.calls).toHaveLength(1);

      unsubscribe();

      const event2 = createTestEvent('test.event', { data: 'test' });
      await emitter.emit(event2);
      expect(wildcardMock.calls).toHaveLength(1); // Still 1
    });
  });

  describe('SystemEvents Factory', () => {
    it('should create startup event with correct structure', () => {
      const event = SystemEvents.startup({
        version: '1.0.0',
        environment: 'production',
        startTime: new Date(),
      });

      expect(event.type).toBe('system.startup');
      expect(event.id).toBeTruthy();
      expect(event.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.payload.version).toBe('1.0.0');
      expect(event.payload.environment).toBe('production');
      expect(event.metadata.source).toBe('system');
    });

    it('should create shutdown event with correct structure', () => {
      const event = SystemEvents.shutdown({
        reason: 'User requested shutdown',
        graceful: true,
      });

      expect(event.type).toBe('system.shutdown');
      expect(event.id).toBeTruthy();
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.payload.reason).toBe('User requested shutdown');
      expect(event.payload.graceful).toBe(true);
      expect(event.metadata.source).toBe('system');
    });

    it('should create error event with correct structure', () => {
      const testError = new Error('Test error');
      const event = SystemEvents.error({
        error: testError,
        context: { component: 'database' },
        severity: 'critical',
      });

      expect(event.type).toBe('system.error');
      expect(event.id).toBeTruthy();
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.payload.error).toBe(testError);
      expect(event.payload.context).toEqual({ component: 'database' });
      expect(event.payload.severity).toBe('critical');
      expect(event.metadata.source).toBe('system');
    });

    it('should create stateChange event with correct structure', () => {
      const event = SystemEvents.stateChange({
        from: 'idle',
        to: 'running',
        reason: 'User started process',
      });

      expect(event.type).toBe('system.stateChange');
      expect(event.id).toBeTruthy();
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.payload.from).toBe('idle');
      expect(event.payload.to).toBe('running');
      expect(event.payload.reason).toBe('User started process');
      expect(event.metadata.source).toBe('system');
    });

    it('should generate unique UUIDs for each event', () => {
      const event1 = SystemEvents.startup({
        version: '1.0.0',
        environment: 'test',
        startTime: new Date(),
      });

      const event2 = SystemEvents.startup({
        version: '1.0.0',
        environment: 'test',
        startTime: new Date(),
      });

      expect(event1.id).not.toBe(event2.id);
    });

    it('should set timestamp to current time', () => {
      const before = new Date();
      const event = SystemEvents.startup({
        version: '1.0.0',
        environment: 'test',
        startTime: new Date(),
      });
      const after = new Date();

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should apply default metadata with source "system"', () => {
      const event = SystemEvents.startup({
        version: '1.0.0',
        environment: 'test',
        startTime: new Date(),
      });

      expect(event.metadata.source).toBe('system');
    });

    it('should allow metadata override', () => {
      const event = SystemEvents.startup(
        {
          version: '1.0.0',
          environment: 'test',
          startTime: new Date(),
        },
        {
          source: 'custom-source',
          correlationId: 'corr-123',
          userId: 'user-456',
        }
      );

      expect(event.metadata.source).toBe('custom-source');
      expect(event.metadata.correlationId).toBe('corr-123');
      expect(event.metadata.userId).toBe('user-456');
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not grow internal Map unbounded after many subscribe/unsubscribe cycles', () => {
      const handlers: Array<() => void> = [];

      // Subscribe 100 handlers
      for (let i = 0; i < 100; i++) {
        const { handler } = createMockHandler();
        const unsubscribe = emitter.on(`event.${i}`, handler);
        handlers.push(unsubscribe);
      }

      // Unsubscribe all handlers
      handlers.forEach((unsubscribe) => unsubscribe());

      // Access private property for testing (TypeScript workaround)
      const handlersMap = (emitter as any).handlers as Map<string, Set<any>>;

      // Map should be empty after all unsubscribes
      expect(handlersMap.size).toBe(0);
    });

    it('should remove empty Sets after last handler unsubscribes', () => {
      const mock1 = createMockHandler();
      const mock2 = createMockHandler();

      const unsub1 = emitter.on('test.event', mock1.handler);
      const unsub2 = emitter.on('test.event', mock2.handler);

      const handlersMap = (emitter as any).handlers as Map<string, Set<any>>;
      expect(handlersMap.has('test.event')).toBe(true);

      unsub1();
      expect(handlersMap.has('test.event')).toBe(true); // Still has mock2

      unsub2();
      expect(handlersMap.has('test.event')).toBe(false); // Cleaned up
    });

    it('should handle many concurrent subscriptions efficiently', async () => {
      const mocks = Array.from({ length: 1000 }, () => createMockHandler());

      mocks.forEach((mock) => {
        emitter.on('test.event', mock.handler);
      });

      const event = createTestEvent('test.event', { data: 'test' });
      await emitter.emit(event);

      mocks.forEach((mock) => {
        expect(mock.calls).toHaveLength(1);
      });
    });
  });
});

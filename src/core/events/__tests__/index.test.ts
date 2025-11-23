import * as EventSystem from '../index';

describe('Event System Module Exports', () => {
  it('should export BaseEvent type', () => {
    // TypeScript compile-time check - if this compiles, the export exists
    const event: EventSystem.BaseEvent = {
      id: 'test-id',
      type: 'test.event',
      timestamp: new Date(),
      payload: {},
      metadata: { source: 'test' },
    };
    expect(event).toBeDefined();
  });

  it('should export EventEmitter class', () => {
    expect(EventSystem.EventEmitter).toBeDefined();
    const emitter = new EventSystem.EventEmitter();
    expect(emitter).toBeInstanceOf(EventSystem.EventEmitter);
  });

  it('should export SystemEvents class', () => {
    expect(EventSystem.SystemEvents).toBeDefined();
    const event = EventSystem.SystemEvents.startup({
      version: '1.0.0',
      environment: 'test',
      startTime: new Date(),
    });
    expect(event.type).toBe('system.startup');
  });

  it('should export all required types and interfaces', () => {
    // Verify all exports are accessible
    expect(EventSystem.EventEmitter).toBeDefined();
    expect(EventSystem.SystemEvents).toBeDefined();
    
    // Type checks (compile-time verification)
    const metadata: EventSystem.EventMetadata = { source: 'test' };
    const handler: EventSystem.EventHandler = (event) => {};
    const unsubscribe: EventSystem.UnsubscribeFunction = () => {};
    
    expect(metadata).toBeDefined();
    expect(handler).toBeDefined();
    expect(unsubscribe).toBeDefined();
  });
});

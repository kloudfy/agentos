# Implementation Plan

- [x] 1. Create BaseEvent interface and type definitions
  - Create src/core/events/base-event.ts file
  - Define EventMetadata interface with readonly source, correlationId, and userId properties
  - Define BaseEvent<T> interface with readonly id, type, timestamp, payload, and metadata properties
  - Ensure all properties use readonly modifier for immutability
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.2_

- [x] 2. Implement EventEmitter class with subscription management
  - [x] 2.1 Create EventEmitter class structure
    - Create src/core/events/event-emitter.ts file
    - Define EventHandler<T> type as function accepting BaseEvent<T> returning void or Promise<void>
    - Define UnsubscribeFunction type as function returning void
    - Implement EventEmitter class with private handlers Map<string, Set<EventHandler>>
    - Implement constructor to initialize empty handlers Map
    - _Requirements: 2.1, 2.5_
  
  - [x] 2.2 Implement on() method for event subscription
    - Write on<T>(eventType: string, handler: EventHandler<T>) method
    - Create new Set for eventType if it doesn't exist in handlers Map
    - Add handler to the Set for the given eventType
    - Return unsubscribe function that removes the handler when called
    - Support "*" wildcard event type registration
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1_
  
  - [x] 2.3 Implement off() method for manual unsubscription
    - Write off<T>(eventType: string, handler: EventHandler<T>) method
    - Remove handler from Set for the given eventType
    - Handle case where handler doesn't exist (no-op, no error)
    - Clean up empty Sets after removing last handler to prevent memory leaks
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 2.4 Implement emit() method for event dispatch
    - Write emit<T>(event: BaseEvent<T>) async method returning Promise<void>
    - Retrieve handlers Set for event.type from handlers Map
    - Retrieve wildcard handlers Set for "*" from handlers Map
    - Combine both Sets of handlers into single array
    - Execute all handlers using Promise.allSettled for concurrent execution
    - Return Promise that resolves when all handlers complete
    - Ensure failed handlers don't block other handlers from executing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 5.3, 5.4_

- [x] 3. Implement SystemEvents factory class
  - [x] 3.1 Create payload type definitions
    - Create src/core/events/system-events.ts file
    - Define StartupPayload interface with version, environment, and startTime properties
    - Define ShutdownPayload interface with reason and graceful properties
    - Define ErrorPayload interface with error, context, and severity properties
    - Define StateChangePayload interface with from, to, and reason properties
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 3.2 Implement SystemEvents factory methods
    - Create SystemEvents class with static methods only
    - Implement private static createEvent<T>(type, payload, metadata?) helper method
    - Generate UUID for event id using crypto.randomUUID() or uuid library
    - Set timestamp to current Date
    - Set default metadata source to 'system'
    - Implement static startup(payload: StartupPayload) method returning BaseEvent<StartupPayload> with type "system.startup"
    - Implement static shutdown(payload: ShutdownPayload) method returning BaseEvent<ShutdownPayload> with type "system.shutdown"
    - Implement static error(payload: ErrorPayload) method returning BaseEvent<ErrorPayload> with type "system.error"
    - Implement static stateChange(payload: StateChangePayload) method returning BaseEvent<StateChangePayload> with type "system.stateChange"
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. Create module exports and project structure
  - Create src/core/events/index.ts file
  - Export BaseEvent and EventMetadata from base-event.ts
  - Export EventEmitter, EventHandler, and UnsubscribeFunction from event-emitter.ts
  - Export SystemEvents class from system-events.ts
  - Export payload type definitions (StartupPayload, ShutdownPayload, ErrorPayload, StateChangePayload) from system-events.ts
  - _Requirements: 9.2, 9.3_

- [x] 5. Implement comprehensive test suite
  - [x] 5.1 Create test utilities and setup
    - Create src/core/events/__tests__/event-emitter.test.ts file
    - Implement createMockHandler() utility that returns handler and calls array
    - Implement createAsyncHandler(delay) utility for testing async handlers
    - Implement createErrorHandler(error) utility for testing error isolation
    - _Requirements: 7.1, 9.4_
  
  - [x] 5.2 Write BaseEvent structure tests
    - Test that BaseEvent interface has all required properties (id, type, timestamp, payload, metadata)
    - Test that generic type parameter T works correctly for payload typing
    - Test that EventMetadata has source, correlationId, and userId properties
    - _Requirements: 7.1, 7.6_
  
  - [x] 5.3 Write EventEmitter subscription tests
    - Test subscribing to event type and verifying handler is called
    - Test subscribing multiple handlers to same event type
    - Test that unsubscribe function removes handler
    - Test that off() removes specific handler
    - Test that off() with non-existent handler doesn't throw error
    - Test that handlers are isolated per event type
    - _Requirements: 7.1, 7.2_
  
  - [x] 5.4 Write EventEmitter emission tests
    - Test emitting event and verifying handlers execute
    - Test emitting event with no handlers (should not throw)
    - Test that async handlers are awaited
    - Test that emit returns Promise that resolves
    - Test that event object is passed correctly to handlers
    - _Requirements: 7.1, 7.3_
  
  - [x] 5.5 Write error isolation tests
    - Test registering handler that throws error
    - Test registering second handler that succeeds
    - Test that both handlers execute despite error in first
    - Test that emit Promise resolves even when handler throws
    - Test that successful handler receives correct event
    - _Requirements: 7.1, 7.4_
  
  - [x] 5.6 Write wildcard listener tests
    - Test registering wildcard handler with "*"
    - Test emitting various event types and verifying wildcard handler receives all
    - Test that wildcard and type-specific handlers both execute
    - Test that wildcard handler unsubscribe works correctly
    - _Requirements: 7.1, 7.5_
  
  - [x] 5.7 Write SystemEvents factory tests
    - Test that startup() creates event with correct structure and type "system.startup"
    - Test that shutdown() creates event with correct structure and type "system.shutdown"
    - Test that error() creates event with correct structure and type "system.error"
    - Test that stateChange() creates event with correct structure and type "system.stateChange"
    - Test that each event has unique UUID
    - Test that timestamps are current Date objects
    - Test that metadata defaults to { source: 'system' }
    - _Requirements: 7.1, 7.6_
  
  - [x] 5.8 Write memory leak prevention tests
    - Test subscribing and unsubscribing many handlers
    - Test that internal Map doesn't grow unbounded
    - Test that empty Sets are removed after last handler unsubscribes
    - _Requirements: 7.1_
  
  - [x] 5.9 Verify test coverage meets requirements
    - Run test coverage report
    - Verify code coverage is greater than 90%
    - Add additional tests if coverage is below threshold
    - _Requirements: 7.1_

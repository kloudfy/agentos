import * as StateModule from '../index';

describe('State Module Exports', () => {
  it('should export StateStore interface', () => {
    // TypeScript compile-time check
    const data: StateModule.StateData = {
      version: 1,
      data: {},
      metadata: {
        lastModified: new Date(),
        pluginName: 'test',
      },
    };
    expect(data).toBeDefined();
  });

  it('should export FileSystemStateStore class', () => {
    expect(StateModule.FileSystemStateStore).toBeDefined();
  });

  it('should export StateManager class', () => {
    expect(StateModule.StateManager).toBeDefined();
  });

  it('should export all error classes', () => {
    expect(StateModule.StateWriteError).toBeDefined();
    expect(StateModule.StateReadError).toBeDefined();
    expect(StateModule.StateParseError).toBeDefined();
    expect(StateModule.StateValidationError).toBeDefined();
  });
});

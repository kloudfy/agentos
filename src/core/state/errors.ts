/**
 * Error thrown when state write operation fails.
 */
export class StateWriteError extends Error {
  constructor(pluginName: string, cause: Error) {
    super(`Failed to write state for plugin '${pluginName}': ${cause.message}`);
    this.name = 'StateWriteError';
  }
}

/**
 * Error thrown when state read operation fails.
 */
export class StateReadError extends Error {
  constructor(pluginName: string, cause: Error) {
    super(`Failed to read state for plugin '${pluginName}': ${cause.message}`);
    this.name = 'StateReadError';
  }
}

/**
 * Error thrown when state JSON parsing fails.
 */
export class StateParseError extends Error {
  constructor(pluginName: string, cause: Error) {
    super(`Failed to parse state for plugin '${pluginName}': ${cause.message}`);
    this.name = 'StateParseError';
  }
}

/**
 * Error thrown when state validation fails.
 */
export class StateValidationError extends Error {
  constructor(pluginName: string, message: string) {
    super(`State validation failed for plugin '${pluginName}': ${message}`);
    this.name = 'StateValidationError';
  }
}

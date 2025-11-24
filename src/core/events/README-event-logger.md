# EventLogger

A colorful debugging tool for monitoring events in real-time.

## Features

✨ **Colorful Output**
- 🔴 Red for errors (`*.error`, `*.failed`, `*.failure`)
- 🟡 Yellow for warnings (`*.warning`, `*.warn`, `*.degraded`)
- 🟢 Green for success (`*.success`, `*.loaded`, `*.completed`, `*.initialized`)
- 🔵 Cyan for normal events

⚡ **Smart Formatting**
- Timestamps in gray
- Multi-line formatting for long payloads (>50 chars)
- Separator lines between events for readability
- Truncation for very long payloads (>200 chars)

📊 **Statistics Tracking**
- Total event count
- Breakdown by category (success/normal/warning/error)
- Top 5 most frequent event types
- Displayed when `stop()` is called

🎯 **Filtering**
- Regex pattern matching on event types
- Only log events you care about

💾 **File Logging**
- Optional file output (plain text, no colors)
- Async writes don't block event processing

## Usage

### Basic Usage

```typescript
import { EventEmitter, EventLogger } from './core/events';

const emitter = new EventEmitter();
const logger = new EventLogger(emitter);

logger.start();
// ... emit events ...
logger.stop(); // Shows statistics
```

### With Filtering

```typescript
// Only log plugin-related events
const logger = new EventLogger(emitter, {
  filter: /^plugin\./
});

// Or use a string pattern
const logger = new EventLogger(emitter, {
  filter: 'plugin.*'
});
```

### With File Output

```typescript
const logger = new EventLogger(emitter, {
  logFile: './debug-events.log'
});
```

### Complete Example

```typescript
const logger = new EventLogger(emitter, {
  filter: /^(plugin|state)\./,  // Only plugin.* and state.* events
  logFile: './events.log'        // Also write to file
});

logger.start();

// Events are automatically categorized and colored:
emitter.emit({ type: 'plugin.loaded', ... });      // Green
emitter.emit({ type: 'state.changed', ... });      // Cyan
emitter.emit({ type: 'plugin.warning', ... });     // Yellow
emitter.emit({ type: 'plugin.error', ... });       // Red

logger.stop();
// 📊 Event Logger Statistics:
//   Total events: 42 (38 success, 3 normal, 0 warnings, 1 errors)
```

## Output Examples

### Short Payload
```
2025-11-24T10:30:45.123Z  plugin.loaded  {"name":"test-plugin","version":"1.0.0"}
```

### Long Payload (Multi-line)
```
2025-11-24T10:30:45.456Z  data.processed
  {"items":[1,2,3,4,5],"metadata":{"source":"api","timestamp":"2025-11-24T10:30:45.456Z"}}
────────────────────────────────────────────────────────────────────────────────
```

### Statistics Summary
```
📊 Event Logger Statistics:
  Total events: 10 (3 success, 3 normal, 2 warnings, 2 errors)

  Top event types:
    plugin.loaded: 3
    state.changed: 2
    plugin.error: 2
    task.completed: 1
    system.startup: 1
```

## Event Categorization

Events are automatically categorized based on their type:

| Category | Patterns | Color |
|----------|----------|-------|
| Error | `*.error`, `*.failed`, `*.failure` | Red |
| Warning | `*.warning`, `*.warn`, `*.degraded` | Yellow |
| Success | `*.success`, `*.loaded`, `*.completed`, `*.initialized` | Green |
| Normal | Everything else | Cyan |

## Tips

- Use during development to see all system events in real-time
- Add filtering to focus on specific subsystems
- Enable file logging for post-mortem debugging
- Check statistics to identify noisy event types
- Long payloads are automatically formatted for readability

## Demo

Run the demo to see all features in action:

```bash
npx tsx examples/event-logger-demo.ts
```

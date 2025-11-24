---
title: Security Standards
category: security
priority: critical
inclusion: always
---

# Security Standards

This document defines security standards and best practices for AgentOS. All code must follow these guidelines to ensure system security.

## Core Security Principles

### 1. Principle of Least Privilege

**Rule:** Grant minimum permissions necessary for functionality.

**Implementation:**
- Plugins run in isolated contexts
- File system access is restricted
- Network access requires explicit permission
- State access is scoped per plugin

**Example:**
```typescript
// ✓ CORRECT: Scoped access
const pluginState = stateManager.scope(`plugin:${plugin.name}`);

// ✗ WRONG: Full access
const state = stateManager.getGlobalState();
```

### 2. Defense in Depth

**Rule:** Multiple layers of security controls.

**Layers:**
1. Input validation at boundaries
2. Type safety via TypeScript
3. Runtime checks for critical operations
4. Error handling and logging
5. Isolation between components

### 3. Fail Securely

**Rule:** Failures should not compromise security.

**Implementation:**
```typescript
// ✓ CORRECT: Fail securely
function loadPlugin(path: string): Plugin {
  if (!isValidPath(path)) {
    throw new SecurityError('Invalid plugin path');
  }
  
  try {
    return require(path);
  } catch (error) {
    logger.error('Plugin load failed', { path });
    throw new Error('Failed to load plugin');
    // Don't expose internal paths or errors
  }
}
```

## Input Validation

### Validate All External Input

**Sources:**
- User input
- File contents
- Network responses
- Plugin data
- Environment variables


**Validation Rules:**
```typescript
// String validation
function validatePluginName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Plugin name must be a non-empty string');
  }
  
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new ValidationError('Plugin name contains invalid characters');
  }
  
  if (name.length > 100) {
    throw new ValidationError('Plugin name too long');
  }
}

// Path validation
function validatePath(path: string): void {
  const normalized = path.normalize(path);
  
  if (normalized.includes('..')) {
    throw new SecurityError('Path traversal detected');
  }
  
  if (!normalized.startsWith(ALLOWED_BASE_PATH)) {
    throw new SecurityError('Path outside allowed directory');
  }
}

// Object validation
function validateConfig(config: unknown): PluginConfig {
  if (!config || typeof config !== 'object') {
    throw new ValidationError('Invalid config object');
  }
  
  // Use schema validation (e.g., Zod, Joi)
  return PluginConfigSchema.parse(config);
}
```

### Sanitize Output

```typescript
// ✓ CORRECT: Sanitize error messages
function handleError(error: Error): string {
  // Don't expose internal paths or sensitive data
  return `Operation failed: ${error.message.replace(/\/.*?\//g, '[path]')}`;
}

// ✗ WRONG: Expose internal details
function handleError(error: Error): string {
  return error.stack; // Exposes file paths, line numbers
}
```

## Secrets Management

### Never Commit Secrets

**Prohibited:**
- API keys
- Passwords
- Private keys
- Tokens
- Connection strings

**Detection:**
```bash
# Pre-commit hook checks for secrets
git secrets --scan
```

### Use Environment Variables

```typescript
// ✓ CORRECT: Environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable not set');
}

// ✗ WRONG: Hardcoded secrets
const apiKey = 'sk-1234567890abcdef';
```

### Secure Storage

```typescript
// Use secure credential storage
import { SecretManager } from './security/secrets';

const secrets = new SecretManager({
  keyring: 'agentos',
  encryption: 'aes-256-gcm'
});

await secrets.set('api-key', apiKey);
const key = await secrets.get('api-key');
```

## File System Security

### Path Traversal Prevention

```typescript
import path from 'path';

function safeReadFile(userPath: string): string {
  const basePath = '/safe/directory';
  const fullPath = path.join(basePath, userPath);
  
  // Verify path is within base directory
  if (!fullPath.startsWith(basePath)) {
    throw new SecurityError('Path traversal attempt detected');
  }
  
  return fs.readFileSync(fullPath, 'utf-8');
}
```

### File Permissions

```typescript
// Set restrictive permissions
fs.writeFileSync(path, data, {
  mode: 0o600 // Owner read/write only
});

// Check permissions before reading sensitive files
const stats = fs.statSync(path);
if ((stats.mode & 0o077) !== 0) {
  throw new SecurityError('File has insecure permissions');
}
```

## Plugin Security

### Plugin Isolation

```typescript
// Each plugin gets isolated context
class PluginContext {
  constructor(
    private pluginName: string,
    private events: EventEmitter,
    private state: StateManager
  ) {}
  
  // Scoped state access
  getState(): ScopedStateManager {
    return this.state.scope(`plugin:${this.pluginName}`);
  }
  
  // Limited event access
  emit(event: BaseEvent): void {
    // Validate event source
    if (event.metadata?.source !== this.pluginName) {
      throw new SecurityError('Plugin cannot emit events for other sources');
    }
    this.events.emit(event);
  }
}
```

### Plugin Validation

```typescript
// Validate plugin before loading
async function validatePlugin(plugin: Plugin): Promise<void> {
  // Check required properties
  if (!plugin.name || !plugin.version) {
    throw new ValidationError('Plugin missing required properties');
  }
  
  // Verify signature (if applicable)
  if (REQUIRE_SIGNED_PLUGINS) {
    await verifyPluginSignature(plugin);
  }
  
  // Check against blocklist
  if (isBlocklisted(plugin.name)) {
    throw new SecurityError('Plugin is blocklisted');
  }
  
  // Validate dependencies
  for (const dep of plugin.dependencies || []) {
    if (!isAllowedDependency(dep)) {
      throw new SecurityError(`Dependency ${dep} not allowed`);
    }
  }
}
```

## Network Security

### HTTPS Only

```typescript
// ✓ CORRECT: HTTPS only
const url = new URL(userInput);
if (url.protocol !== 'https:') {
  throw new SecurityError('Only HTTPS URLs allowed');
}

// ✗ WRONG: Allow HTTP
fetch(userInput);
```

### Request Validation

```typescript
// Validate and sanitize URLs
function validateUrl(url: string): URL {
  let parsed: URL;
  
  try {
    parsed = new URL(url);
  } catch {
    throw new ValidationError('Invalid URL');
  }
  
  // Whitelist allowed protocols
  if (!['https:', 'wss:'].includes(parsed.protocol)) {
    throw new SecurityError('Protocol not allowed');
  }
  
  // Prevent SSRF
  if (isPrivateIP(parsed.hostname)) {
    throw new SecurityError('Private IP addresses not allowed');
  }
  
  return parsed;
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private requests = new Map<string, number[]>();
  
  checkLimit(key: string, maxRequests: number, windowMs: number): void {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests
    const recent = requests.filter(time => now - time < windowMs);
    
    if (recent.length >= maxRequests) {
      throw new RateLimitError('Rate limit exceeded');
    }
    
    recent.push(now);
    this.requests.set(key, recent);
  }
}
```

## Error Handling

### Don't Leak Information

```typescript
// ✓ CORRECT: Generic error messages
try {
  await database.query(sql);
} catch (error) {
  logger.error('Database error', { error });
  throw new Error('Database operation failed');
}

// ✗ WRONG: Expose details
try {
  await database.query(sql);
} catch (error) {
  throw new Error(`Query failed: ${sql} - ${error.message}`);
}
```

### Secure Logging

```typescript
// ✓ CORRECT: Redact sensitive data
logger.info('User login', {
  username: user.username,
  ip: redactIP(request.ip),
  // Don't log passwords, tokens, etc.
});

// ✗ WRONG: Log sensitive data
logger.info('User login', {
  username: user.username,
  password: user.password, // Never log passwords!
  token: user.token
});
```

## Dependency Security

### Audit Dependencies

```bash
# Regular security audits
npm audit
npm audit fix

# Check for vulnerabilities
npm run security-check
```

### Pin Versions

```json
{
  "dependencies": {
    "express": "4.18.2",  // Exact version
    "lodash": "~4.17.21"  // Patch updates only
  }
}
```

### Minimize Dependencies

- Only include necessary dependencies
- Prefer standard library when possible
- Review dependency code before adding
- Monitor for security advisories

## Authentication & Authorization

### Token Validation

```typescript
function validateToken(token: string): TokenPayload {
  if (!token || typeof token !== 'string') {
    throw new AuthError('Invalid token');
  }
  
  // Verify token signature
  const payload = jwt.verify(token, SECRET_KEY);
  
  // Check expiration
  if (payload.exp < Date.now() / 1000) {
    throw new AuthError('Token expired');
  }
  
  // Validate claims
  if (!payload.sub || !payload.scope) {
    throw new AuthError('Invalid token claims');
  }
  
  return payload;
}
```

### Permission Checks

```typescript
function checkPermission(user: User, resource: string, action: string): void {
  const permissions = user.permissions || [];
  const required = `${resource}:${action}`;
  
  if (!permissions.includes(required) && !permissions.includes('*')) {
    throw new AuthorizationError(`Permission denied: ${required}`);
  }
}
```

## Code Injection Prevention

### No eval() or Function()

```typescript
// ✗ WRONG: Code injection risk
eval(userInput);
new Function(userInput)();

// ✓ CORRECT: Use safe alternatives
const result = JSON.parse(userInput);
```

### Template Injection

```typescript
// ✓ CORRECT: Parameterized queries
db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ✗ WRONG: String concatenation
db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

## Security Headers

```typescript
// Set security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

## Security Testing

### Security Test Cases

```typescript
describe('security', () => {
  it('should reject path traversal attempts', () => {
    expect(() => readFile('../../../etc/passwd')).toThrow(SecurityError);
  });
  
  it('should validate input length', () => {
    const longInput = 'a'.repeat(10000);
    expect(() => processInput(longInput)).toThrow(ValidationError);
  });
  
  it('should prevent SQL injection', () => {
    const malicious = "'; DROP TABLE users; --";
    expect(() => query(malicious)).not.toThrow();
  });
});
```

## Incident Response

### Security Logging

```typescript
// Log security events
securityLogger.warn('Failed login attempt', {
  username: attempt.username,
  ip: attempt.ip,
  timestamp: new Date(),
  reason: 'invalid_password'
});

securityLogger.error('Potential attack detected', {
  type: 'path_traversal',
  input: sanitize(userInput),
  source: request.ip
});
```

### Monitoring

- Monitor failed authentication attempts
- Track unusual access patterns
- Alert on security errors
- Regular security audits

## Review Checklist

Before merging, verify:
- [ ] All input validated
- [ ] No secrets in code
- [ ] Path traversal prevented
- [ ] Plugins isolated
- [ ] HTTPS enforced
- [ ] Error messages don't leak info
- [ ] Dependencies audited
- [ ] Security tests included
- [ ] Logging doesn't expose sensitive data
- [ ] Rate limiting implemented

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- Security Audit Log: `.kiro/logs/security.log`

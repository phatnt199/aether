# BaseService

Base class for all service classes, providing built-in logging functionality.

## Import

```typescript
import { BaseService } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
export class BaseService {
  protected logger: Logger;

  constructor(opts: { scope: string });
}
```

## Description

`BaseService` is the foundational base class for all services in the @ra-core-infra framework. It provides a single, essential feature: **scoped logging** via a protected `logger` instance.

**Key features**:
- Automatic logger initialization with custom scope
- Protected logger accessible to all extending classes
- Singleton logger pattern for consistent logging across services
- Four log levels: debug, info, warn, error
- Timestamp-based log formatting

**When to use**:
- Creating custom service classes
- Need built-in logging without manual logger setup
- Building domain services (e.g., UserService, ProductService)
- Implementing business logic layers

**When NOT to use**:
- For CRUD services → Use `BaseCrudService` instead (includes CRUD methods)
- For providers → Use `BaseProvider` instead
- For simple utility functions without state

## Constructor

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| opts | `{ scope: string }` | Yes | Configuration object |
| opts.scope | `string` | Yes | Logger scope identifier (e.g., service name) |

### Example

```typescript
export class CustomService extends BaseService {
  constructor() {
    super({ scope: 'CustomService' });
  }
}
```

## Properties

### logger (protected)

**Type**: `Logger`

**Description**: Protected logger instance available to all extending classes.

**Logger Methods**:
- `logger.debug(message: any, ...args: any[])` - Debug-level logging (only when debug enabled)
- `logger.info(message: any, ...args: any[])` - Info-level logging
- `logger.warn(message: any, ...args: any[])` - Warning-level logging
- `logger.error(message: any, ...args: any[])` - Error-level logging

**Logger Format**:
```
2025-01-15T10:30:45.123Z - [info]  [YourServiceScope]Your message here
```

**Usage**:
```typescript
export class MyService extends BaseService {
  constructor() {
    super({ scope: 'MyService' });
  }

  doSomething() {
    this.logger.info('Doing something...');
    this.logger.debug('Debug details', { data: 'value' });
    this.logger.warn('Warning condition');
    this.logger.error('Error occurred', error);
  }
}
```

---

## Complete Examples

### Basic Service Extension

```typescript
import { BaseService } from '@minimaltech/ra-core-infra';

export class EmailService extends BaseService {
  constructor() {
    super({ scope: 'EmailService' });
  }

  async sendEmail(to: string, subject: string, body: string) {
    this.logger.info(`Sending email to: ${to}`);

    try {
      // Email sending logic here
      await this.sendViaProvider(to, subject, body);

      this.logger.info('Email sent successfully');
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw error;
    }
  }

  private async sendViaProvider(to: string, subject: string, body: string) {
    // Implementation...
  }
}
```

---

### Service with Debug Logging

```typescript
import { BaseService } from '@minimaltech/ra-core-infra';

export class PaymentService extends BaseService {
  constructor() {
    super({ scope: 'PaymentService' });
  }

  async processPayment(amount: number, cardToken: string) {
    this.logger.info(`Processing payment: $${amount}`);

    // Debug logging for development
    this.logger.debug('Payment details', {
      amount,
      cardToken: cardToken.substring(0, 4) + '****',
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await this.chargeCard(amount, cardToken);

      this.logger.info('Payment processed successfully', {
        transactionId: result.id,
      });

      return result;
    } catch (error) {
      this.logger.error('Payment failed', {
        amount,
        error: error.message,
      });

      throw error;
    }
  }

  private async chargeCard(amount: number, token: string) {
    // Implementation...
    return { id: 'txn_123', status: 'success' };
  }
}
```

---

### Service with Business Logic

```typescript
import { BaseService } from '@minimaltech/ra-core-infra';

interface IUser {
  id: string;
  name: string;
  email: string;
}

export class UserValidationService extends BaseService {
  constructor() {
    super({ scope: 'UserValidationService' });
  }

  validateUser(user: Partial<IUser>): boolean {
    this.logger.info('Validating user', { userId: user.id });

    const errors: string[] = [];

    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push('Invalid email');
      this.logger.warn('Invalid email detected', { email: user.email });
    }

    if (!user.name || user.name.length < 2) {
      errors.push('Name too short');
      this.logger.warn('Invalid name detected', { name: user.name });
    }

    if (errors.length > 0) {
      this.logger.error('User validation failed', { errors });
      return false;
    }

    this.logger.info('User validation passed');
    return true;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

---

### Service with External API Integration

```typescript
import { BaseService } from '@minimaltech/ra-core-infra';

export class WeatherService extends BaseService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl: string }) {
    super({ scope: 'WeatherService' });

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;

    this.logger.info('WeatherService initialized', {
      baseUrl: this.baseUrl,
    });
  }

  async getWeather(city: string): Promise<any> {
    this.logger.info(`Fetching weather for: ${city}`);

    try {
      const url = `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}`;

      this.logger.debug('API request', { url: url.replace(this.apiKey, '***') });

      const response = await fetch(url);
      const data = await response.json();

      this.logger.info('Weather data retrieved', {
        city,
        temp: data.main.temp,
      });

      return data;
    } catch (error) {
      this.logger.error('Failed to fetch weather', {
        city,
        error: error.message,
      });

      throw error;
    }
  }
}
```

---

### Dependency Injection with BaseService

```typescript
import { injectable } from '@venizia/ignis-inversion';
import { BaseService } from '@minimaltech/ra-core-infra';

@injectable()
export class NotificationService extends BaseService {
  constructor() {
    super({ scope: 'NotificationService' });
    this.logger.info('NotificationService created');
  }

  async notify(userId: string, message: string) {
    this.logger.info(`Sending notification to user: ${userId}`);

    try {
      // Send notification logic
      await this.sendPushNotification(userId, message);

      this.logger.info('Notification sent successfully', { userId });
    } catch (error) {
      this.logger.error('Notification failed', {
        userId,
        error: error.message,
      });

      throw error;
    }
  }

  private async sendPushNotification(userId: string, message: string) {
    // Implementation...
  }
}

// Register in application
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();
    this.service(NotificationService);
  }
}
```

---

### Service with State Management

```typescript
import { BaseService } from '@minimaltech/ra-core-infra';

export class CacheService extends BaseService {
  private cache: Map<string, any> = new Map();

  constructor() {
    super({ scope: 'CacheService' });
    this.logger.info('Cache initialized');
  }

  set(key: string, value: any, ttl?: number) {
    this.logger.debug(`Setting cache key: ${key}`, { ttl });

    this.cache.set(key, {
      value,
      expiresAt: ttl ? Date.now() + ttl : null,
    });

    this.logger.info('Cache key set', {
      key,
      size: this.cache.size,
    });
  }

  get(key: string): any | null {
    this.logger.debug(`Getting cache key: ${key}`);

    const entry = this.cache.get(key);

    if (!entry) {
      this.logger.warn('Cache miss', { key });
      return null;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.logger.warn('Cache expired', { key });
      this.cache.delete(key);
      return null;
    }

    this.logger.info('Cache hit', { key });
    return entry.value;
  }

  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info('Cache cleared', { previousSize: size });
  }
}
```

---

### Service with Async Initialization

```typescript
import { BaseService } from '@minimaltech/ra-core-infra';

export class DatabaseService extends BaseService {
  private connection: any = null;
  private isConnected: boolean = false;

  constructor() {
    super({ scope: 'DatabaseService' });
  }

  async connect(connectionString: string) {
    this.logger.info('Connecting to database...');

    try {
      // Simulate database connection
      this.connection = await this.createConnection(connectionString);
      this.isConnected = true;

      this.logger.info('Database connected successfully');
    } catch (error) {
      this.logger.error('Database connection failed', error);
      throw error;
    }
  }

  async query(sql: string, params: any[] = []) {
    if (!this.isConnected) {
      this.logger.error('Database not connected');
      throw new Error('Database not connected');
    }

    this.logger.debug('Executing query', { sql, params });

    try {
      const result = await this.connection.execute(sql, params);

      this.logger.info('Query executed', {
        rowCount: result.rows.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Query failed', { sql, error: error.message });
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) return;

    this.logger.info('Disconnecting from database...');

    await this.connection.close();
    this.isConnected = false;

    this.logger.info('Database disconnected');
  }

  private async createConnection(connectionString: string) {
    // Simulate connection
    return {
      execute: async (sql: string, params: any[]) => ({
        rows: [],
      }),
      close: async () => {},
    };
  }
}
```

---

## Logger API Reference

### Log Levels

BaseService provides four log levels through the protected `logger` property:

#### debug(message: any, ...args: any[])

Debug-level logging. Only outputs when debug mode is enabled.

**Example**:
```typescript
this.logger.debug('Detailed debug info', { userId: 123, action: 'login' });
```

**Output** (when debug enabled):
```
2025-01-15T10:30:45.123Z - [debug]  [YourService]Detailed debug info { userId: 123, action: 'login' }
```

---

#### info(message: any, ...args: any[])

Info-level logging for general operational messages.

**Example**:
```typescript
this.logger.info('User logged in', { userId: 123 });
```

**Output**:
```
2025-01-15T10:30:45.123Z - [info]  [YourService]User logged in { userId: 123 }
```

---

#### warn(message: any, ...args: any[])

Warning-level logging for potentially problematic situations.

**Example**:
```typescript
this.logger.warn('Deprecated method called', { method: 'oldMethod' });
```

**Output**:
```
2025-01-15T10:30:45.123Z - [warn]  [YourService]Deprecated method called { method: 'oldMethod' }
```

---

#### error(message: any, ...args: any[])

Error-level logging for error conditions.

**Example**:
```typescript
this.logger.error('Operation failed', error);
```

**Output**:
```
2025-01-15T10:30:45.123Z - [error]  [YourService]Operation failed Error: ...
```

---

## Related APIs

- [BaseCrudService](/api-reference/services/base-crud-service) - CRUD service extending BaseService
- [DefaultAuthService](/api-reference/services/default-auth-service) - Auth service extending BaseService
- [DefaultNetworkRequestService](/api-reference/services/default-network-request-service) - Network service extending BaseService
- [BaseRaApplication](/api-reference/core/base-ra-application) - Register services in application
- [Logger](https://github.com/minimaltech/ra-core-infra) - Logger class documentation

## Common Issues

### Logger scope not showing correctly

**Cause**: Forgot to pass scope in super() call.

**Solution**: Always call super with scope parameter:

```typescript
export class MyService extends BaseService {
  constructor() {
    super({ scope: 'MyService' }); // ✅ Correct
  }
}

// ❌ Wrong - no scope
export class MyService extends BaseService {
  constructor() {
    super({ scope: '' }); // Bad: empty scope
  }
}
```

---

### Debug logs not appearing

**Cause**: Debug mode is disabled by default.

**Solution**: Debug logs require debug mode to be enabled in the Logger. By default, debug logs are suppressed.

```typescript
// Debug logs won't appear unless debug is enabled
this.logger.debug('This might not show');

// Use info() for logs that should always appear
this.logger.info('This always shows');
```

---

### Logger showing wrong timestamps

**Cause**: Logger uses ISO 8601 format with timezone.

**Note**: This is expected behavior. Logger uses `new Date().toISOString()` which returns UTC time in ISO format:

```
2025-01-15T10:30:45.123Z
```

---

### Cannot access logger in static methods

**Cause**: Logger is an instance property, not static.

**Solution**: Don't use static methods that need logging, or create a separate logger instance:

```typescript
export class MyService extends BaseService {
  constructor() {
    super({ scope: 'MyService' });
  }

  // ❌ Can't access this.logger in static method
  static staticMethod() {
    // this.logger is not available
  }

  // ✅ Use instance methods
  instanceMethod() {
    this.logger.info('Works fine');
  }
}
```

---

## Best Practices

### 1. Use Meaningful Scope Names

Choose descriptive scope names that clearly identify the service:

```typescript
// ✅ Good scope names
super({ scope: 'UserService' });
super({ scope: 'PaymentProcessor' });
super({ scope: 'EmailNotificationService' });

// ❌ Bad scope names
super({ scope: 'Service' });
super({ scope: 'US' });
super({ scope: '' });
```

---

### 2. Use Appropriate Log Levels

Follow logging level conventions:

```typescript
export class MyService extends BaseService {
  async doWork() {
    // Debug: Detailed debugging information
    this.logger.debug('Starting work', { params: '...' });

    // Info: General informational messages
    this.logger.info('Work completed successfully');

    // Warn: Warning conditions (recoverable)
    this.logger.warn('Slow performance detected');

    // Error: Error conditions (failures)
    this.logger.error('Work failed', error);
  }
}
```

---

### 3. Include Context in Logs

Provide relevant context data with log messages:

```typescript
// ✅ Good - includes context
this.logger.info('User updated', {
  userId: user.id,
  fields: ['name', 'email'],
  timestamp: Date.now(),
});

// ❌ Less useful - no context
this.logger.info('User updated');
```

---

### 4. Log at Key Points

Log important state changes and operations:

```typescript
export class OrderService extends BaseService {
  constructor() {
    super({ scope: 'OrderService' });
  }

  async createOrder(data: any) {
    this.logger.info('Creating order', { customerId: data.customerId });

    try {
      const order = await this.save(data);

      this.logger.info('Order created', {
        orderId: order.id,
        total: order.total,
      });

      return order;
    } catch (error) {
      this.logger.error('Order creation failed', {
        customerId: data.customerId,
        error: error.message,
      });

      throw error;
    }
  }
}
```

---

### 5. Avoid Logging Sensitive Data

Never log passwords, tokens, or sensitive information:

```typescript
// ❌ Bad - logs sensitive data
this.logger.info('User login', {
  email: user.email,
  password: user.password, // NEVER LOG PASSWORDS
});

// ✅ Good - omits sensitive data
this.logger.info('User login', {
  email: user.email,
  // password intentionally omitted
});

// ✅ Good - masks sensitive data
this.logger.debug('API request', {
  url: url.replace(apiKey, '***MASKED***'),
});
```

---

### 6. Use Logger for All Output

Use logger instead of console.log for consistency:

```typescript
// ❌ Bad - direct console usage
console.log('User created');

// ✅ Good - use logger
this.logger.info('User created');
```

---

## TypeScript Tips

### Type Your Service Methods

```typescript
import { BaseService } from '@minimaltech/ra-core-infra';

interface IUser {
  id: string;
  name: string;
  email: string;
}

export class UserService extends BaseService {
  constructor() {
    super({ scope: 'UserService' });
  }

  async findUser(id: string): Promise<IUser | null> {
    this.logger.info(`Finding user: ${id}`);

    try {
      const user = await this.fetchUser(id);
      return user;
    } catch (error) {
      this.logger.error('User lookup failed', error);
      return null;
    }
  }

  private async fetchUser(id: string): Promise<IUser> {
    // Implementation...
    return { id, name: 'Test', email: 'test@example.com' };
  }
}
```

---

### Use Generics for Flexible Services

```typescript
import { BaseService } from '@minimaltech/ra-core-infra';

export class GenericRepository<T> extends BaseService {
  private items: T[] = [];

  constructor(scope: string) {
    super({ scope });
  }

  add(item: T): void {
    this.logger.info('Adding item');
    this.items.push(item);
  }

  findAll(): T[] {
    this.logger.info(`Finding all items (${this.items.length} total)`);
    return this.items;
  }
}

// Usage
interface IProduct {
  id: string;
  name: string;
}

const productRepo = new GenericRepository<IProduct>('ProductRepository');
productRepo.add({ id: '1', name: 'Product 1' });
```

---

## Performance Tips

1. **Minimize debug logs in production**: Debug logs are disabled by default for performance
2. **Avoid expensive operations in logs**: Don't compute complex data just for logging
3. **Use appropriate log levels**: Info/warn/error logs always output, so use sparingly in hot paths

```typescript
// ❌ Bad - expensive computation for debug log
this.logger.debug('Data:', this.expensiveComputation());

// ✅ Good - only compute if needed
if (this.logger.isDebugEnabled) {
  this.logger.debug('Data:', this.expensiveComputation());
}

// ✅ Better - use simple info log
this.logger.info('Processing complete');
```

---

## See Also

- [BaseCrudService](/api-reference/services/base-crud-service) - CRUD operations base class
- [Dependency Injection Guide](/guides/dependency-injection/) - Service registration patterns
- [DefaultAuthService](/api-reference/services/default-auth-service) - Example service extending BaseService
- [BaseRaApplication](/api-reference/core/base-ra-application) - Application lifecycle and service registration

---

**Next**: Learn about [BaseProvider](/api-reference/providers/base-provider) for creating custom providers.

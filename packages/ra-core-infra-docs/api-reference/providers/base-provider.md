# BaseProvider

Abstract base class for creating custom providers in the dependency injection system.

## Import

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import type { Container } from '@venizia/ignis-inversion';
```

## Signature

```typescript
export abstract class BaseProvider<T> extends BaseHelper implements IProvider<T> {
  abstract value(container: Container): T;
}
```

## Description

`BaseProvider<T>` is an abstract base class for creating custom providers in the @ra-core-infra framework. Providers implement the **Provider Pattern**, allowing lazy initialization and container-based dependency resolution.

**Key features**:
- Generic type parameter for type-safe provider values
- Abstract `value()` method for custom provider logic
- Built-in logger support (inherited from BaseHelper)
- Integration with Venizia DI container
- Lazy instantiation - values created only when requested

**When to use**:
- Creating custom providers (auth, data, i18n, etc.)
- Need access to DI container during value creation
- Building framework extensions
- Implementing factory patterns

**When NOT to use**:
- For simple services → Use `BaseService` instead
- For CRUD operations → Use `BaseCrudService` instead
- For singleton values without container access

## Abstract Methods

### value(container: Container): T

**Required implementation** that returns the provider's value.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| container | `Container` | Yes | DI container for resolving dependencies |

**Returns**: `T` - The provider's value (type determined by generic parameter)

**Purpose**: This method is called by the DI container when the provider's value is requested. It receives the container to resolve dependencies.

**Example**:
```typescript
export class MyProvider extends BaseProvider<MyService> {
  constructor() {
    super({ scope: 'MyProvider' });
  }

  value(container: Container): MyService {
    // Resolve dependencies from container
    const config = container.get<Config>({ key: 'config' });

    // Create and return the value
    return new MyService(config);
  }
}
```

---

## Complete Examples

### Basic Custom Provider

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import type { Container } from '@venizia/ignis-inversion';

interface IEmailConfig {
  apiKey: string;
  fromEmail: string;
}

export class EmailConfigProvider extends BaseProvider<IEmailConfig> {
  constructor() {
    super({ scope: 'EmailConfigProvider' });
  }

  value(container: Container): IEmailConfig {
    this.logger.info('Creating email configuration');

    // Read from environment or config
    const config: IEmailConfig = {
      apiKey: process.env.EMAIL_API_KEY || '',
      fromEmail: process.env.EMAIL_FROM || 'noreply@example.com',
    };

    this.logger.info('Email configuration created', {
      fromEmail: config.fromEmail,
    });

    return config;
  }
}
```

---

### Provider with Container Dependencies

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import type { Container } from '@venizia/ignis-inversion';

export interface INotificationService {
  send(to: string, message: string): Promise<void>;
}

export class NotificationServiceProvider extends BaseProvider<INotificationService> {
  constructor() {
    super({ scope: 'NotificationServiceProvider' });
  }

  value(container: Container): INotificationService {
    this.logger.info('Creating notification service');

    // Resolve dependencies from container
    const emailConfig = container.get<IEmailConfig>({
      key: 'email.config',
    });

    const smsConfig = container.get<ISmsConfig>({
      key: 'sms.config',
    });

    // Create service with resolved dependencies
    return {
      async send(to: string, message: string) {
        // Send via email and SMS
        await Promise.all([
          sendEmail(to, message, emailConfig),
          sendSMS(to, message, smsConfig),
        ]);
      },
    };
  }
}
```

---

### Provider with Factory Pattern

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import type { Container } from '@venizia/ignis-inversion';

export interface ILogger {
  log(message: string): void;
}

export interface ILoggerFactory {
  create(name: string): ILogger;
}

export class LoggerFactoryProvider extends BaseProvider<ILoggerFactory> {
  constructor() {
    super({ scope: 'LoggerFactoryProvider' });
  }

  value(container: Container): ILoggerFactory {
    this.logger.info('Creating logger factory');

    return {
      create: (name: string): ILogger => {
        this.logger.debug(`Creating logger for: ${name}`);

        return {
          log: (message: string) => {
            console.log(`[${name}] ${message}`);
          },
        };
      },
    };
  }
}
```

---

### Provider with Environment-Based Configuration

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import type { Container } from '@venizia/ignis-inversion';

export interface IDatabaseConfig {
  host: string;
  port: number;
  database: string;
  ssl: boolean;
}

export class DatabaseConfigProvider extends BaseProvider<IDatabaseConfig> {
  constructor() {
    super({ scope: 'DatabaseConfigProvider' });
  }

  value(container: Container): IDatabaseConfig {
    const env = process.env.NODE_ENV || 'development';

    this.logger.info(`Creating database config for: ${env}`);

    const configs: Record<string, IDatabaseConfig> = {
      development: {
        host: 'localhost',
        port: 5432,
        database: 'dev_db',
        ssl: false,
      },
      production: {
        host: process.env.DB_HOST || '',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || '',
        ssl: true,
      },
    };

    const config = configs[env] || configs.development;

    this.logger.info('Database config created', {
      host: config.host,
      port: config.port,
      database: config.database,
    });

    return config;
  }
}
```

---

### Provider with Conditional Logic

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import type { Container } from '@venizia/ignis-inversion';

export interface IStorageService {
  save(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
}

export class StorageServiceProvider extends BaseProvider<IStorageService> {
  constructor() {
    super({ scope: 'StorageServiceProvider' });
  }

  value(container: Container): IStorageService {
    const useRedis = process.env.USE_REDIS === 'true';

    if (useRedis) {
      this.logger.info('Creating Redis storage service');

      const redisConfig = container.get<IRedisConfig>({
        key: 'redis.config',
      });

      return new RedisStorageService(redisConfig);
    } else {
      this.logger.info('Creating in-memory storage service');

      return new InMemoryStorageService();
    }
  }
}
```

---

### Provider Returning React Admin Provider

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import type { Container } from '@venizia/ignis-inversion';
import type { DataProvider } from 'react-admin';

export class CustomDataProviderProvider extends BaseProvider<DataProvider> {
  constructor() {
    super({ scope: 'CustomDataProviderProvider' });
  }

  value(container: Container): DataProvider {
    this.logger.info('Creating custom data provider');

    // Resolve network service
    const networkService = container.get<DefaultNetworkRequestService>({
      key: CoreBindings.DEFAULT_NETWORK_REQUEST_SERVICE,
    });

    // Create React Admin data provider
    return {
      getList: async (resource, params) => {
        this.logger.info(`getList: ${resource}`, params);

        const response = await networkService.doRequest({
          type: 'rest',
          method: 'GET',
          paths: [resource],
          query: params,
        });

        return {
          data: response.data,
          total: response.total || 0,
        };
      },

      getOne: async (resource, params) => {
        this.logger.info(`getOne: ${resource}`, params);

        const response = await networkService.doRequest({
          type: 'rest',
          method: 'GET',
          paths: [resource, params.id.toString()],
        });

        return { data: response.data };
      },

      // ... other methods
    };
  }
}
```

---

### Provider with Async Initialization

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import type { Container } from '@venizia/ignis-inversion';

export interface IDatabaseConnection {
  query(sql: string): Promise<any>;
  close(): Promise<void>;
}

export class DatabaseConnectionProvider extends BaseProvider<IDatabaseConnection> {
  private connection: IDatabaseConnection | null = null;

  constructor() {
    super({ scope: 'DatabaseConnectionProvider' });
  }

  value(container: Container): IDatabaseConnection {
    // Note: value() is synchronous, so we return a lazy-initialized wrapper
    if (this.connection) {
      this.logger.debug('Returning existing connection');
      return this.connection;
    }

    this.logger.info('Creating database connection wrapper');

    const config = container.get<IDatabaseConfig>({
      key: 'database.config',
    });

    // Return a proxy that initializes on first use
    const self = this;
    const connection: IDatabaseConnection = {
      async query(sql: string) {
        if (!self.connection) {
          self.logger.info('Initializing database connection');
          await self.initializeConnection(config);
        }

        return self.connection!.query(sql);
      },

      async close() {
        if (self.connection) {
          await self.connection.close();
          self.connection = null;
        }
      },
    };

    return connection;
  }

  private async initializeConnection(config: IDatabaseConfig): Promise<void> {
    // Async initialization logic
    this.connection = await createDatabaseConnection(config);
  }
}
```

---

### Provider with Singleton Pattern

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import type { Container } from '@venizia/ignis-inversion';

export class SingletonCacheService {
  private cache: Map<string, any> = new Map();

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key);
  }
}

export class CacheServiceProvider extends BaseProvider<SingletonCacheService> {
  private static instance: SingletonCacheService | null = null;

  constructor() {
    super({ scope: 'CacheServiceProvider' });
  }

  value(container: Container): SingletonCacheService {
    // Return singleton instance
    if (CacheServiceProvider.instance) {
      this.logger.debug('Returning existing cache service');
      return CacheServiceProvider.instance;
    }

    this.logger.info('Creating new cache service singleton');

    CacheServiceProvider.instance = new SingletonCacheService();
    return CacheServiceProvider.instance;
  }
}
```

---

## Registration in Application

### Register Provider

```typescript
import { BaseRaApplication } from '@minimaltech/ra-core-infra';
import { EmailConfigProvider } from './providers/EmailConfigProvider';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Register provider with custom key
    this.injectable(
      'singleton',
      new EmailConfigProvider(),
      ['email.config']
    );
  }
}
```

---

### Use Provider Value in Services

```typescript
import { injectable, inject } from '@venizia/ignis-inversion';
import { BaseService } from '@minimaltech/ra-core-infra';

@injectable()
export class EmailService extends BaseService {
  constructor(
    @inject({ key: 'email.config' })
    private emailConfig: IEmailConfig
  ) {
    super({ scope: 'EmailService' });
  }

  async sendEmail(to: string, subject: string, body: string) {
    this.logger.info(`Sending email using API key: ${this.emailConfig.apiKey}`);

    // Send email logic...
  }
}
```

---

### Use Provider Value in React Components

```typescript
import React from 'react';
import { useInjectable } from '@minimaltech/ra-core-infra';

function EmailSettings() {
  const emailConfig = useInjectable<IEmailConfig>({
    key: 'email.config',
  });

  return (
    <div>
      <h2>Email Settings</h2>
      <p>From: {emailConfig.fromEmail}</p>
    </div>
  );
}
```

---

## Related APIs

- [BaseRaApplication](/api-reference/core/base-ra-application) - Register providers in application
- [DefaultAuthProvider](/api-reference/providers/default-auth-provider) - Example auth provider
- [DefaultI18nProvider](/api-reference/providers/default-i18n-provider) - Example i18n provider
- [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) - Example data provider
- [BaseService](/api-reference/services/base-service) - Base service class
- [Container](https://github.com/venizia/ignis-inversion) - Venizia DI container

## Common Issues

### value() method not implemented

**Cause**: Forgot to implement abstract `value()` method.

**Solution**: Always implement `value()`:

```typescript
// ❌ Wrong - abstract method not implemented
export class MyProvider extends BaseProvider<MyType> {
  constructor() {
    super({ scope: 'MyProvider' });
  }
  // Missing value() implementation
}

// ✅ Correct
export class MyProvider extends BaseProvider<MyType> {
  constructor() {
    super({ scope: 'MyProvider' });
  }

  value(container: Container): MyType {
    return new MyType();
  }
}
```

---

### Container dependency not found

**Cause**: Dependency not registered before provider is used.

**Solution**: Ensure dependencies are registered in correct order:

```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // ✅ Register dependency first
    this.injectable('singleton', new ConfigProvider(), ['config']);

    // ✅ Then register provider that depends on it
    this.injectable('singleton', new MyServiceProvider(), ['my.service']);
  }
}
```

---

### Circular dependency error

**Cause**: Provider A depends on Provider B, which depends on Provider A.

**Solution**: Refactor to break circular dependency:

```typescript
// ❌ Bad - circular dependency
export class ServiceAProvider extends BaseProvider<ServiceA> {
  value(container: Container): ServiceA {
    const serviceB = container.get<ServiceB>({ key: 'service.b' });
    return new ServiceA(serviceB);
  }
}

export class ServiceBProvider extends BaseProvider<ServiceB> {
  value(container: Container): ServiceB {
    const serviceA = container.get<ServiceA>({ key: 'service.a' });
    return new ServiceB(serviceA);
  }
}

// ✅ Good - introduce shared dependency
export class SharedConfigProvider extends BaseProvider<SharedConfig> {
  value(container: Container): SharedConfig {
    return new SharedConfig();
  }
}

export class ServiceAProvider extends BaseProvider<ServiceA> {
  value(container: Container): ServiceA {
    const config = container.get<SharedConfig>({ key: 'shared.config' });
    return new ServiceA(config);
  }
}

export class ServiceBProvider extends BaseProvider<ServiceB> {
  value(container: Container): ServiceB {
    const config = container.get<SharedConfig>({ key: 'shared.config' });
    return new ServiceB(config);
  }
}
```

---

### Provider scope not showing in logs

**Cause**: Forgot to call super() with scope.

**Solution**: Always call super() in constructor:

```typescript
// ❌ Wrong
export class MyProvider extends BaseProvider<MyType> {
  // Missing constructor or super() call
}

// ✅ Correct
export class MyProvider extends BaseProvider<MyType> {
  constructor() {
    super({ scope: 'MyProvider' });
  }

  value(container: Container): MyType {
    return new MyType();
  }
}
```

---

## Best Practices

### 1. Use Descriptive Scope Names

```typescript
// ✅ Good
super({ scope: 'EmailConfigProvider' });
super({ scope: 'DatabaseConnectionProvider' });
super({ scope: 'AuthServiceProvider' });

// ❌ Bad
super({ scope: 'Provider' });
super({ scope: 'ECP' });
super({ scope: '' });
```

---

### 2. Log Provider Initialization

```typescript
export class MyProvider extends BaseProvider<MyService> {
  constructor() {
    super({ scope: 'MyProvider' });
  }

  value(container: Container): MyService {
    this.logger.info('Creating MyService');

    const config = container.get<Config>({ key: 'config' });

    this.logger.info('MyService created', {
      configLoaded: !!config,
    });

    return new MyService(config);
  }
}
```

---

### 3. Type Provider Generic Parameter

```typescript
// ✅ Good - explicit type
export class EmailConfigProvider extends BaseProvider<IEmailConfig> {
  value(container: Container): IEmailConfig {
    return { /* ... */ };
  }
}

// ❌ Less type-safe
export class EmailConfigProvider extends BaseProvider<any> {
  value(container: Container): any {
    return { /* ... */ };
  }
}
```

---

### 4. Handle Missing Dependencies Gracefully

```typescript
export class MyProvider extends BaseProvider<MyService> {
  constructor() {
    super({ scope: 'MyProvider' });
  }

  value(container: Container): MyService {
    try {
      const config = container.get<Config>({ key: 'config' });
      return new MyService(config);
    } catch (error) {
      this.logger.warn('Config not found, using defaults');
      return new MyService(defaultConfig);
    }
  }
}
```

---

### 5. Avoid Heavy Computation in value()

```typescript
// ❌ Bad - expensive computation every time
export class MyProvider extends BaseProvider<ExpensiveService> {
  value(container: Container): ExpensiveService {
    // This runs every time value() is called
    const data = computeExpensiveData();
    return new ExpensiveService(data);
  }
}

// ✅ Good - cache result
export class MyProvider extends BaseProvider<ExpensiveService> {
  private cachedService: ExpensiveService | null = null;

  value(container: Container): ExpensiveService {
    if (this.cachedService) {
      return this.cachedService;
    }

    const data = computeExpensiveData();
    this.cachedService = new ExpensiveService(data);
    return this.cachedService;
  }
}
```

---

### 6. Use Container for Dependency Resolution

```typescript
// ✅ Good - use container
export class MyProvider extends BaseProvider<MyService> {
  value(container: Container): MyService {
    const dep = container.get<Dependency>({ key: 'dependency' });
    return new MyService(dep);
  }
}

// ❌ Bad - hardcoded dependencies
export class MyProvider extends BaseProvider<MyService> {
  value(container: Container): MyService {
    const dep = new Dependency(); // Hard-coded, not using DI
    return new MyService(dep);
  }
}
```

---

## TypeScript Tips

### Type Container.get() Calls

```typescript
export class MyProvider extends BaseProvider<MyService> {
  constructor() {
    super({ scope: 'MyProvider' });
  }

  value(container: Container): MyService {
    // ✅ Type the get() call
    const config = container.get<IConfig>({
      key: 'config',
    });

    const logger = container.get<Logger>({
      key: CoreBindings.LOGGER,
    });

    return new MyService(config, logger);
  }
}
```

---

### Use Interfaces for Provider Values

```typescript
// Define interface
export interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Provider returns interface
export class EmailServiceProvider extends BaseProvider<IEmailService> {
  value(container: Container): IEmailService {
    return {
      async send(to, subject, body) {
        // Implementation...
      },
    };
  }
}

// Consumers use interface
@injectable()
export class UserService extends BaseService {
  constructor(
    @inject({ key: 'email.service' })
    private emailService: IEmailService
  ) {
    super({ scope: 'UserService' });
  }
}
```

---

## Performance Tips

1. **Cache provider values**: If value() is called multiple times, cache the result
2. **Lazy initialization**: Defer expensive operations until first use
3. **Minimize container.get() calls**: Resolve dependencies once and reuse

```typescript
export class OptimizedProvider extends BaseProvider<MyService> {
  private cachedValue: MyService | null = null;

  value(container: Container): MyService {
    // Return cached value if available
    if (this.cachedValue) {
      return this.cachedValue;
    }

    // Create and cache
    const config = container.get<Config>({ key: 'config' });
    this.cachedValue = new MyService(config);

    return this.cachedValue;
  }
}
```

---

## See Also

- [BaseRaApplication](/api-reference/core/base-ra-application) - Application lifecycle and provider registration
- [DefaultAuthProvider](/api-reference/providers/default-auth-provider) - Authentication provider example
- [DefaultI18nProvider](/api-reference/providers/default-i18n-provider) - Internationalization provider example
- [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) - Data provider example
- [BaseService](/api-reference/services/base-service) - Base service class
- [Dependency Injection Guide](/guides/dependency-injection/) - Complete DI guide

---

**Next**: Learn about [Utility Hooks](/api-reference/hooks/other-hooks) for common React patterns.

# BaseRaApplication

Abstract base class for creating React Admin applications with dependency injection and lifecycle management.

## Import

```typescript
import { BaseRaApplication } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
abstract class BaseRaApplication extends Container implements ICoreRaApplication {
  // Lifecycle methods
  abstract bindContext(): ValueOrPromise<void>;
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;
  start(): Promise<void>;

  // Registration helpers
  injectable<T>(scope: string, value: TClass<T>, tags?: string[]): void;
  service<T>(value: TClass<T>): void;
}

// Alias
abstract class AbstractRaApplication extends Container implements ICoreRaApplication
```

## Description

`BaseRaApplication` is the foundation class for all @ra-core-infra applications. It provides:

- **Dependency Injection Container**: Extends Venizia's `Container` for service registration
- **Lifecycle Hooks**: Structured initialization flow (preConfigure → bindContext → postConfigure → start)
- **Service Registration Helpers**: Convenient methods for registering services
- **Type Safety**: Full TypeScript support with generics

**When to use**:
- Create your main application class
- Set up dependency injection container
- Configure providers (data, auth, i18n)
- Register custom services
- Manage application lifecycle

**Key concepts**:
- **Abstract class**: Must be extended, cannot be instantiated directly
- **Lifecycle**: Ordered execution of setup methods
- **DI container**: All services registered here become injectable

## Lifecycle Methods

### bindContext() ⚡ Required

Register all services, providers, and configuration in the DI container.

**Signature**:
```typescript
abstract bindContext(): ValueOrPromise<void>
```

**When it runs**: Called by `preConfigure()` during startup

**Purpose**:
- Bind providers (data, auth, i18n)
- Register custom services
- Configure container bindings

**Example**:
```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Register data provider options
    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: {
        url: 'https://api.example.com',
      },
    });

    // Register custom services
    this.service(UserService);
    this.service(NotificationService);

    // Register auth provider options
    this.container.bind({
      key: CoreBindings.AUTH_PROVIDER_OPTIONS,
      value: {
        loginUrl: '/auth/login',
      },
    });
  }
}
```

---

### preConfigure()

Early initialization hook that calls `bindContext()`.

**Signature**:
```typescript
preConfigure(): ValueOrPromise<void>
```

**When it runs**: First step in `start()` lifecycle

**Default behavior**: Calls `bindContext()`

**Override for**:
- Pre-initialization tasks
- Environment setup
- Early validation

**Example**:
```typescript
export class MyApplication extends BaseRaApplication {
  preConfigure() {
    // Load environment variables
    console.log('Starting application...');

    // Call default behavior (bindContext)
    super.preConfigure();

    // Additional setup
    console.log('Services registered');
  }

  bindContext() {
    super.bindContext();
    // ... register services
  }
}
```

---

### postConfigure()

Post-initialization hook for tasks after service registration.

**Signature**:
```typescript
postConfigure(): ValueOrPromise<void>
```

**When it runs**: After `preConfigure()` in `start()` lifecycle

**Default behavior**: No-op (empty implementation)

**Override for**:
- Service initialization
- Database connections
- Cache warming
- Feature flags loading

**Example**:
```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();
    this.service(DatabaseService);
  }

  async postConfigure() {
    // Initialize services after registration
    const dbService = this.container.get<DatabaseService>({
      key: 'services.DatabaseService',
    });

    await dbService.connect();
    console.log('Database connected');
  }
}
```

---

### start()

Start the application by running the full lifecycle.

**Signature**:
```typescript
async start(): Promise<void>
```

**Execution flow**:
```
start()
  ↓
preConfigure()  // Calls bindContext()
  ↓
postConfigure()
  ↓
Application ready
```

**Example**:
```typescript
const app = new MyApplication();
await app.start();

// Application is now ready
// All services are registered and initialized
```

## Helper Methods

### injectable()

Register a class with a custom scope in the DI container.

**Signature**:
```typescript
injectable<T>(scope: string, value: TClass<T>, tags?: string[]): void
```

**Parameters**:
- `scope` - Scope/namespace for the binding (e.g., `"services"`, `"repositories"`)
- `value` - Class to register
- `tags` - Optional tags for filtering

**Generated key**: `"${scope}.${value.name}"`

**Example**:
```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Register with "services" scope
    this.injectable('services', UserService);
    // Key: "services.UserService"

    // Register with "repositories" scope
    this.injectable('repositories', UserRepository);
    // Key: "repositories.UserRepository"

    // Register with tags
    this.injectable('services', EmailService, ['notifications', 'external']);
  }
}
```

---

### service()

Register a service class (shorthand for `injectable('services', ...)`).

**Signature**:
```typescript
service<T>(value: TClass<T>): void
```

**Parameters**:
- `value` - Service class to register

**Generated key**: `"services.${value.name}"`

**Example**:
```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Register services
    this.service(UserService);         // Key: "services.UserService"
    this.service(ProductService);      // Key: "services.ProductService"
    this.service(OrderService);        // Key: "services.OrderService"
  }
}
```

**Equivalent to**:
```typescript
this.injectable('services', UserService);
```

## Complete Examples

### Basic Application

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IRestDataProviderOptions } from '@minimaltech/ra-core-infra';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Configure data provider
    const restDataProviderOptions: IRestDataProviderOptions = {
      url: 'https://api.example.com',
    };

    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: restDataProviderOptions,
    });
  }
}

// Usage
const app = new MyApplication();
await app.start();
```

---

### Application with Custom Services

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import { UserService } from '@/services/UserService';
import { ProductService } from '@/services/ProductService';
import { NotificationService } from '@/services/NotificationService';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Configure providers
    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: {
        url: process.env.API_URL || 'http://localhost:3000/api',
      },
    });

    // Register custom services
    this.service(UserService);
    this.service(ProductService);
    this.service(NotificationService);
  }
}
```

---

### Application with Async Initialization

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import { ConfigService } from '@/services/ConfigService';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: { url: 'https://api.example.com' },
    });

    this.service(ConfigService);
  }

  async postConfigure() {
    // Load remote configuration
    const configService = this.container.get<ConfigService>({
      key: 'services.ConfigService',
    });

    const config = await configService.loadRemoteConfig();
    console.log('Remote config loaded:', config);

    // Update data provider URL based on config
    if (config.apiUrl) {
      this.container.rebind({
        key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
        value: { url: config.apiUrl },
      });
    }
  }
}
```

---

### Application with Multiple Environments

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';

export class MyApplication extends BaseRaApplication {
  private environment: 'development' | 'staging' | 'production';

  constructor(env?: string) {
    super();
    this.environment = (env as any) || 'development';
  }

  bindContext() {
    super.bindContext();

    // Environment-specific configuration
    const apiUrls = {
      development: 'http://localhost:3000/api',
      staging: 'https://api-staging.example.com',
      production: 'https://api.example.com',
    };

    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: {
        url: apiUrls[this.environment],
        headers: {
          'X-Environment': this.environment,
        },
      },
    });

    // Register services
    this.service(UserService);
    this.service(ProductService);
  }

  preConfigure() {
    console.log(`Starting ${this.environment} environment...`);
    super.preConfigure();
  }

  async postConfigure() {
    console.log(`${this.environment} environment initialized`);
  }
}

// Usage
const app = new MyApplication(process.env.NODE_ENV);
await app.start();
```

---

### Application in React

```typescript
// App.tsx
import React from 'react';
import { Admin, Resource } from 'react-admin';
import { ApplicationContext, useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider } from '@minimaltech/ra-core-infra';
import { MyApplication } from './MyApplication';

export function App() {
  const [app, setApp] = React.useState<MyApplication | null>(null);

  React.useEffect(() => {
    const initApp = async () => {
      const application = new MyApplication();
      await application.start();
      setApp(application);
    };
    initApp();
  }, []);

  if (!app) {
    return <div>Loading...</div>;
  }

  return (
    <ApplicationContext.Provider
      value={{
        container: app.container,
        logger: app.logger,
        registry: app.registry,
      }}
    >
      <InnerApp />
    </ApplicationContext.Provider>
  );
}

function InnerApp() {
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  return (
    <Admin dataProvider={dataProvider}>
      <Resource name="users" />
      <Resource name="products" />
    </Admin>
  );
}
```

## Lifecycle Flow Diagram

```
┌─────────────────────────────────────────┐
│  const app = new MyApplication();      │
│  await app.start();                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
          ┌──────────────┐
          │ preConfigure │
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │ bindContext  │ ← Abstract method (must implement)
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │postConfigure │
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │ Application  │
          │    Ready     │
          └──────────────┘
```

## Related APIs

- [CoreBindings](/api-reference/core/core-bindings) - DI binding constants
- [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) - Data provider setup
- [useInjectable](/api-reference/hooks/use-injectable) - Inject services in components
- [Container](https://github.com/venizia/ignis-inversion) - Venizia DI container

## Common Issues

### "bindContext is not implemented"

**Cause**: Forgot to implement the abstract `bindContext()` method.

**Solution**: Implement `bindContext()` in your application class:

```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();
    // ... register services
  }
}
```

### Services not found in DI container

**Cause**: Service not registered in `bindContext()`.

**Solution**: Register all services before calling `start()`:

```typescript
bindContext() {
  super.bindContext();

  // Register your service
  this.service(MyService);
}
```

### Lifecycle methods not running

**Cause**: Forgot to call `await app.start()`.

**Solution**: Always call `start()` to initialize:

```typescript
const app = new MyApplication();
await app.start();  // Don't forget this!
```

### Cannot access container before start()

**Cause**: Trying to use container before calling `start()`.

**Solution**: Wait for `start()` to complete:

```typescript
const app = new MyApplication();
await app.start();

// Now safe to access container
const service = app.container.get({ key: 'MyService' });
```

## Best Practices

### 1. Always Call super.bindContext()

Call parent implementation to ensure base setup runs:

```typescript
bindContext() {
  super.bindContext();  // Always call first!

  // Your bindings
  this.service(MyService);
}
```

### 2. Use Environment Variables

Configure based on environment:

```typescript
bindContext() {
  super.bindContext();

  this.container.bind({
    key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    value: {
      url: process.env.VITE_API_URL || 'http://localhost:3000/api',
    },
  });
}
```

### 3. Organize Service Registration

Group related services together:

```typescript
bindContext() {
  super.bindContext();

  // Data layer
  this.service(UserService);
  this.service(ProductService);

  // Business logic
  this.service(OrderProcessingService);
  this.service(PaymentService);

  // External integrations
  this.service(EmailService);
  this.service(SmsService);
}
```

### 4. Use postConfigure for Initialization

Separate registration from initialization:

```typescript
bindContext() {
  super.bindContext();
  this.service(DatabaseService);
}

async postConfigure() {
  // Initialize after registration
  const db = this.container.get<DatabaseService>({
    key: 'services.DatabaseService',
  });
  await db.connect();
}
```

### 5. Handle Errors in Lifecycle

Wrap lifecycle methods in try-catch for debugging:

```typescript
async start() {
  try {
    await super.start();
    console.log('Application started successfully');
  } catch (error) {
    console.error('Failed to start application:', error);
    throw error;
  }
}
```

## Advanced Patterns

### Factory Pattern

Create application instances with different configurations:

```typescript
export class ApplicationFactory {
  static createDevelopment() {
    return new MyApplication({
      apiUrl: 'http://localhost:3000/api',
      debug: true,
    });
  }

  static createProduction() {
    return new MyApplication({
      apiUrl: 'https://api.example.com',
      debug: false,
    });
  }
}
```

### Plugin System

Extend application with plugins:

```typescript
interface Plugin {
  install(app: BaseRaApplication): void;
}

export class MyApplication extends BaseRaApplication {
  private plugins: Plugin[] = [];

  use(plugin: Plugin) {
    this.plugins.push(plugin);
    return this;
  }

  bindContext() {
    super.bindContext();

    // Install plugins
    for (const plugin of this.plugins) {
      plugin.install(this);
    }
  }
}

// Usage
const app = new MyApplication()
  .use(analyticsPlugin)
  .use(loggingPlugin);

await app.start();
```

### Singleton Pattern

Ensure single application instance:

```typescript
export class MyApplication extends BaseRaApplication {
  private static instance: MyApplication;

  static getInstance() {
    if (!MyApplication.instance) {
      MyApplication.instance = new MyApplication();
    }
    return MyApplication.instance;
  }

  private constructor() {
    super();
  }

  bindContext() {
    super.bindContext();
    // ... configuration
  }
}

// Usage
const app = MyApplication.getInstance();
await app.start();
```

## See Also

- [Dependency Injection Guide](/guides/dependency-injection/) - Complete DI guide
- [Application Lifecycle](/core-concepts/application-lifecycle) - Lifecycle concepts
- [Service Registration](/guides/dependency-injection/service-registration) - How to register services
- [Project Setup](/getting-started/project-setup) - Set up your first application

---

**Next**: Learn about [CoreBindings](/api-reference/core/core-bindings) for service binding keys.

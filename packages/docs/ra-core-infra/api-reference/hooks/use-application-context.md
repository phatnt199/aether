# useApplicationContext

React hooks for accessing the dependency injection container and logger.

## Import

```typescript
import { useApplicationContext, useApplicationLogger } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
function useApplicationContext(): Container

function useApplicationLogger(): Logger

interface ApplicationContextValue {
  container: Container | null;
  registry: Container | null;
  logger: Logger | null;
}
```

## Description

`useApplicationContext` and `useApplicationLogger` are React hooks that provide access to the application's dependency injection container and logger. They must be used within an `ApplicationContext.Provider`.

**Key features**:
- Direct access to DI container
- Logger access for application-wide logging
- Registry access for service discovery
- Type-safe with TypeScript
- Throws error if used outside provider

**When to use**:
- Access the DI container directly (alternative to `useInjectable`)
- Get multiple services at once
- Access the logger for debugging
- Implement custom service injection patterns

**When NOT to use**:
- For single service injection → Use `useInjectable` instead
- It's more common to use `useInjectable` for specific services

## Hooks

### useApplicationContext()

Get the dependency injection container.

**Signature**:
```typescript
function useApplicationContext(): Container
```

**Returns**: DI Container instance

**Throws**: Error if not within `ApplicationContext.Provider`

**Example**:
```typescript
import React from 'react';
import { useApplicationContext } from '@minimaltech/ra-core-infra';

function MyComponent() {
  const container = useApplicationContext();

  // Get services directly from container
  const userService = container.get({ key: 'services.UserService' });
  const productService = container.get({ key: 'services.ProductService' });

  return <div>Component content</div>;
}
```

---

### useApplicationLogger()

Get the application logger.

**Signature**:
```typescript
function useApplicationLogger(): Logger
```

**Returns**: Logger instance

**Throws**: Error if not within `ApplicationContext.Provider`

**Example**:
```typescript
import React from 'react';
import { useApplicationLogger } from '@minimaltech/ra-core-infra';

function MyComponent() {
  const logger = useApplicationLogger();

  React.useEffect(() => {
    logger.info('Component mounted');
    logger.debug('Debug information', { data: 'example' });

    return () => {
      logger.info('Component unmounted');
    };
  }, [logger]);

  return <div>Component content</div>;
}
```

---

## Setup

### Providing the Context

Wrap your application with `ApplicationContext.Provider`:

```typescript
import React from 'react';
import { ApplicationContext } from '@minimaltech/ra-core-infra';
import { MyApplication } from './MyApplication';

export function App() {
  const [app] = React.useState(() => {
    const application = new MyApplication();
    application.start();
    return application;
  });

  return (
    <ApplicationContext.Provider
      value={{
        container: app.container,
        logger: app.logger,
        registry: app.registry,
      }}
    >
      <YourApp />
    </ApplicationContext.Provider>
  );
}
```

---

## Complete Examples

### Direct Container Access

```typescript
import React from 'react';
import { useApplicationContext } from '@minimaltech/ra-core-infra';

interface User {
  id: string;
  name: string;
}

function UserList() {
  const container = useApplicationContext();
  const [users, setUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    // Get service from container
    const userService = container.get<UserService>({
      key: 'services.UserService',
    });

    // Fetch data
    userService.find({}).then(setUsers);
  }, [container]);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

### Multiple Services at Once

```typescript
import React from 'react';
import { useApplicationContext } from '@minimaltech/ra-core-infra';

function Dashboard() {
  const container = useApplicationContext();

  const [stats, setStats] = React.useState({
    users: 0,
    posts: 0,
    comments: 0,
  });

  React.useEffect(() => {
    async function loadStats() {
      // Get multiple services
      const userService = container.get({ key: 'services.UserService' });
      const postService = container.get({ key: 'services.PostService' });
      const commentService = container.get({ key: 'services.CommentService' });

      // Fetch all stats in parallel
      const [usersCount, postsCount, commentsCount] = await Promise.all([
        userService.count({}),
        postService.count({}),
        commentService.count({}),
      ]);

      setStats({
        users: usersCount.count,
        posts: postsCount.count,
        comments: commentsCount.count,
      });
    }

    loadStats();
  }, [container]);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Users: {stats.users}</p>
      <p>Posts: {stats.posts}</p>
      <p>Comments: {stats.comments}</p>
    </div>
  );
}
```

---

### Using Logger

```typescript
import React from 'react';
import { useApplicationLogger } from '@minimaltech/ra-core-infra';

function ErrorBoundaryLogger({ children }) {
  const logger = useApplicationLogger();

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logger.error('Unhandled error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [logger]);

  return <>{children}</>;
}
```

---

### Custom Hook with Context

```typescript
import { useApplicationContext } from '@minimaltech/ra-core-infra';

// Create custom hook for specific service
function useUserService() {
  const container = useApplicationContext();

  return React.useMemo(
    () => container.get({ key: 'services.UserService' }),
    [container]
  );
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const userService = useUserService();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    userService.findById(userId, {}).then(setUser);
  }, [userService, userId]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

---

### Conditional Service Resolution

```typescript
import React from 'react';
import { useApplicationContext } from '@minimaltech/ra-core-infra';

function DataFetcher({ serviceType }: { serviceType: 'users' | 'products' }) {
  const container = useApplicationContext();
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    // Conditionally resolve service based on type
    const serviceKey = serviceType === 'users'
      ? 'services.UserService'
      : 'services.ProductService';

    const service = container.get({ key: serviceKey });

    service.find({}).then(setData);
  }, [container, serviceType]);

  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

---

### Logging Component Lifecycle

```typescript
import React from 'react';
import { useApplicationLogger } from '@minimaltech/ra-core-infra';

function TrackedComponent({ name }: { name: string }) {
  const logger = useApplicationLogger();

  React.useEffect(() => {
    logger.info(`${name} mounted`);

    return () => {
      logger.info(`${name} unmounted`);
    };
  }, [logger, name]);

  const handleClick = () => {
    logger.debug(`${name} button clicked`);
  };

  return (
    <div>
      <h3>{name}</h3>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
```

---

### Performance Monitoring

```typescript
import React from 'react';
import { useApplicationLogger } from '@minimaltech/ra-core-infra';

function usePerformanceLogger(componentName: string) {
  const logger = useApplicationLogger();

  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      logger.info(`${componentName} lifetime: ${duration.toFixed(2)}ms`);
    };
  }, [logger, componentName]);
}

function ExpensiveComponent() {
  usePerformanceLogger('ExpensiveComponent');

  // Component logic...
  return <div>Expensive component</div>;
}
```

---

### Debug Mode Toggle

```typescript
import React from 'react';
import { useApplicationLogger } from '@minimaltech/ra-core-infra';

function DebugPanel() {
  const logger = useApplicationLogger();
  const [debugMode, setDebugMode] = React.useState(false);

  React.useEffect(() => {
    if (debugMode) {
      logger.setLevel('debug');
      logger.debug('Debug mode enabled');
    } else {
      logger.setLevel('info');
      logger.info('Debug mode disabled');
    }
  }, [logger, debugMode]);

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={debugMode}
          onChange={(e) => setDebugMode(e.target.checked)}
        />
        Enable Debug Mode
      </label>
    </div>
  );
}
```

---

## Related APIs

- [useInjectable](/api-reference/hooks/use-injectable) - Inject specific services (recommended for most cases)
- [BaseRaApplication](/api-reference/core/base-ra-application) - Application setup
- [Container](https://github.com/venizia/ignis-inversion) - Venizia DI container

## Common Issues

### "must be used within a ApplicationContextProvider"

**Cause**: Hook called outside of `ApplicationContext.Provider`.

**Solution**: Wrap your app with the provider:

```typescript
import { ApplicationContext } from '@minimaltech/ra-core-infra';

function App() {
  const [app] = React.useState(() => {
    const application = new MyApplication();
    application.start();
    return application;
  });

  return (
    <ApplicationContext.Provider
      value={{
        container: app.container,
        logger: app.logger,
        registry: app.registry,
      }}
    >
      <YourApp />
    </ApplicationContext.Provider>
  );
}
```

### Service not found in container

**Cause**: Service not registered in `bindContext()`.

**Solution**: Register the service in your application class:

```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Register your service
    this.service(UserService);
  }
}
```

### Container is null

**Cause**: Provider value not set correctly.

**Solution**: Ensure all context values are provided:

```typescript
<ApplicationContext.Provider
  value={{
    container: app.container,  // Must not be null
    logger: app.logger,        // Must not be null
    registry: app.registry,    // Can be null
  }}
>
```

### Hook called before app.start()

**Cause**: Accessing container before application initialization.

**Solution**: Wait for `start()` to complete:

```typescript
function App() {
  const [app, setApp] = React.useState<MyApplication | null>(null);

  React.useEffect(() => {
    const initApp = async () => {
      const application = new MyApplication();
      await application.start();  // Wait for initialization
      setApp(application);
    };
    initApp();
  }, []);

  if (!app) return <div>Loading...</div>;

  return (
    <ApplicationContext.Provider value={{ /* ... */ }}>
      <YourApp />
    </ApplicationContext.Provider>
  );
}
```

## Best Practices

### 1. Prefer useInjectable for Single Services

For injecting a single service, use `useInjectable`:

```typescript
// ❌ More verbose
const container = useApplicationContext();
const userService = container.get({ key: 'services.UserService' });

// ✅ Simpler
const userService = useInjectable<UserService>({ key: 'services.UserService' });
```

### 2. Memoize Container Calls

Cache service instances to avoid repeated container lookups:

```typescript
function MyComponent() {
  const container = useApplicationContext();

  const userService = React.useMemo(
    () => container.get({ key: 'services.UserService' }),
    [container]
  );

  // Use userService...
}
```

### 3. Create Custom Hooks

Encapsulate container access in custom hooks:

```typescript
// Custom hook
function useServices() {
  const container = useApplicationContext();

  return React.useMemo(() => ({
    users: container.get({ key: 'services.UserService' }),
    products: container.get({ key: 'services.ProductService' }),
    orders: container.get({ key: 'services.OrderService' }),
  }), [container]);
}

// Usage
function Dashboard() {
  const { users, products, orders } = useServices();
  // Use services...
}
```

### 4. Use Logger Consistently

Establish logging conventions:

```typescript
function MyComponent() {
  const logger = useApplicationLogger();

  // Use consistent log levels
  logger.debug('Detailed debug info');  // Development only
  logger.info('General information');   // Normal operation
  logger.warn('Warning condition');     // Potential issues
  logger.error('Error occurred');       // Errors

  // Include context
  logger.info('User action', { userId: '123', action: 'login' });
}
```

### 5. Avoid Direct Container Access in Production

Use `useInjectable` for type safety and clarity:

```typescript
// ❌ Less type-safe, harder to test
function MyComponent() {
  const container = useApplicationContext();
  const service = container.get({ key: 'SomeService' });
}

// ✅ Type-safe, easier to test
function MyComponent() {
  const service = useInjectable<SomeService>({ key: 'SomeService' });
}
```

## Performance Tips

1. **Memoize service resolution**: Use `React.useMemo` to cache service instances
2. **Avoid unnecessary re-renders**: Extract service calls to custom hooks
3. **Use dependency arrays**: Include container/logger in effect dependencies
4. **Lazy service resolution**: Only get services when needed

```typescript
function OptimizedComponent() {
  const container = useApplicationContext();

  // Lazy resolution - only when needed
  const handleClick = () => {
    const service = container.get({ key: 'services.AnalyticsService' });
    service.trackEvent('button_clicked');
  };

  return <button onClick={handleClick}>Click</button>;
}
```

## TypeScript Tips

### Type Container Calls

```typescript
import { useApplicationContext } from '@minimaltech/ra-core-infra';
import { UserService } from '@/services/UserService';

function MyComponent() {
  const container = useApplicationContext();

  // Type the get() call
  const userService = container.get<UserService>({
    key: 'services.UserService',
  });

  // userService is now typed as UserService
}
```

### Type Logger Methods

```typescript
import { useApplicationLogger } from '@minimaltech/ra-core-infra';

function MyComponent() {
  const logger = useApplicationLogger();

  // Logger methods are typed
  logger.info('Message', { data: 'value' });  // ✓ OK
  logger.nonExistent('test');                 // ✗ TypeScript error
}
```

## See Also

- [Dependency Injection Guide](/guides/dependency-injection/) - Complete DI guide
- [useInjectable Hook](/api-reference/hooks/use-injectable) - Single service injection
- [BaseRaApplication](/api-reference/core/base-ra-application) - Application setup
- [Container Documentation](https://github.com/venizia/ignis-inversion) - Venizia DI container

---

**Next**: Learn about [Core Types](/api-reference/core/types) for TypeScript type definitions.

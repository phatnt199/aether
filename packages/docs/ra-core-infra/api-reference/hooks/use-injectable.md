# useInjectable

React hook for injecting services from the dependency injection (DI) container into your components.

## Import

```typescript
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
function useInjectable<T>(opts: {
  container?: Container;
  key: TUseInjectableKeys;
}): T

// Type definitions
type TUseInjectableKeys = TUseInjectableKeysDefault | keyof IUseInjectableKeysOverrides;
type TUseInjectableKeysDefault = Extract<ValueOf<typeof CoreBindings>, string>;

// For type augmentation (advanced usage)
interface IUseInjectableKeysOverrides {
  // Add your custom service keys here
}
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `opts` | `object` | Yes | Configuration object |
| `opts.key` | `TUseInjectableKeys` | Yes | DI binding key (from CoreBindings or custom) |
| `opts.container` | `Container` | No | Custom DI container (defaults to application context) |

## Return Value

**Type**: `T` (Generic type parameter)

Returns the service instance registered with the specified key in the DI container.

## Description

`useInjectable` is the primary way to access dependency-injected services in React components. It retrieves services from the DI container (powered by Venizia's Ignis Inversion) using binding keys.

**When to use**:
- Access providers (data, auth, i18n) in components
- Inject custom services into your UI layer
- Access application-wide singletons
- Implement service-oriented React components

**How it works**:
1. Retrieves the DI container from ApplicationContext (or uses provided container)
2. Looks up the service by the provided key
3. Returns the service instance with proper TypeScript typing

## Examples

### Basic Usage with CoreBindings

Access built-in providers using predefined binding keys:

```typescript
import React from 'react';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider } from 'ra-core';

function UserList() {
  // Inject the data provider
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    dataProvider.getList('users', {
      pagination: { page: 1, perPage: 10 },
      sort: { field: 'id', order: 'ASC' },
      filter: {},
    }).then(({ data }) => setUsers(data));
  }, [dataProvider]);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### All CoreBindings Keys

Access any of the 8 predefined services:

```typescript
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider, IAuthProvider, II18nProvider } from 'ra-core';

function MyComponent() {
  // Data provider
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  // Auth provider
  const authProvider = useInjectable<IAuthProvider>({
    key: CoreBindings.DEFAULT_AUTH_PROVIDER,
  });

  // i18n provider
  const i18nProvider = useInjectable<II18nProvider>({
    key: CoreBindings.DEFAULT_I18N_PROVIDER,
  });

  // Auth service (for token management)
  const authService = useInjectable<IAuthService>({
    key: CoreBindings.DEFAULT_AUTH_SERVICE,
  });

  // ... use services
}
```

### Custom Services with Type Augmentation

For custom services, augment the `IUseInjectableKeysOverrides` interface for type safety:

**Step 1**: Create and register your custom service

```typescript
// services/NotificationService.ts
import { injectable } from '@venizia/ignis-inversion';
import { BaseService } from '@minimaltech/ra-core-infra';

@injectable()
export class NotificationService extends BaseService {
  notify(message: string) {
    console.log('Notification:', message);
  }

  error(message: string) {
    console.error('Error:', message);
  }
}

// In your Application class
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Register custom service
    this.service(NotificationService);
  }
}
```

**Step 2**: Augment types for TypeScript autocomplete

```typescript
// types/injectable.d.ts
import { NotificationService } from '@/services/NotificationService';

declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    NotificationService: NotificationService;
  }
}
```

**Step 3**: Use with type safety

```typescript
import { useInjectable } from '@minimaltech/ra-core-infra';

function MyComponent() {
  // Now TypeScript knows about 'NotificationService' key!
  const notifications = useInjectable<NotificationService>({
    key: 'NotificationService',
  });

  const handleClick = () => {
    notifications.notify('Button clicked!');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Using Custom Container

Override the default container (advanced use case):

```typescript
import { useInjectable } from '@minimaltech/ra-core-infra';
import { Container } from '@venizia/ignis-inversion';

function ComponentWithCustomContainer() {
  const customContainer = new Container();
  // ... configure custom container

  const service = useInjectable<MyService>({
    container: customContainer,
    key: 'MyService',
  });

  // ... use service
}
```

### Real-World Example: Protected Action

Combine auth provider with UI logic:

```typescript
import React from 'react';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IAuthProvider } from 'ra-core';

function DeleteButton({ recordId }: { recordId: string }) {
  const authProvider = useInjectable<IAuthProvider>({
    key: CoreBindings.DEFAULT_AUTH_PROVIDER,
  });

  const [canDelete, setCanDelete] = React.useState(false);

  React.useEffect(() => {
    authProvider.getPermissions()
      .then(permissions => {
        setCanDelete(permissions.includes('admin'));
      });
  }, [authProvider]);

  if (!canDelete) {
    return null;
  }

  const handleDelete = async () => {
    if (confirm('Are you sure?')) {
      // Delete logic here
    }
  };

  return (
    <button onClick={handleDelete}>
      Delete
    </button>
  );
}
```

### Error Handling

Handle missing services gracefully:

```typescript
import { useInjectable } from '@minimaltech/ra-core-infra';

function SafeComponent() {
  try {
    const service = useInjectable<MyService>({
      key: 'MyService',
    });

    return <div>Service loaded: {service.getName()}</div>;
  } catch (error) {
    console.error('Failed to load service:', error);
    return <div>Service unavailable</div>;
  }
}
```

## Related APIs

- [CoreBindings](/api-reference/core/core-bindings) - Predefined DI binding keys
- [BaseRaApplication](/api-reference/core/base-ra-application) - Application class for service registration
- [useApplicationContext](/api-reference/hooks/use-application-context) - Direct access to DI container
- [BaseService](/api-reference/services/base-service) - Base class for custom services

## Common Issues

### "Failed to determine injectable container"

**Cause**: No ApplicationContext provider wrapping your components.

**Solution**: Ensure your app is wrapped with ApplicationContext.Provider:

```typescript
import { ApplicationContext } from '@minimaltech/ra-core-infra';

function App() {
  const app = new MyApplication();
  await app.start();

  return (
    <ApplicationContext.Provider value={{
      container: app.container,
      logger: app.logger,
      registry: app.registry
    }}>
      <YourComponents />
    </ApplicationContext.Provider>
  );
}
```

### "Service not found" or undefined return value

**Cause**: Service not registered in DI container.

**Solution**: Register the service in your Application's `bindContext()` method:

```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Register your service
    this.service(MyCustomService);
  }
}
```

### TypeScript: Key not recognized

**Cause**: Custom service key not added to type augmentation.

**Solution**: Augment `IUseInjectableKeysOverrides` interface (see type augmentation example above).

### Hook called outside component

**Cause**: Using `useInjectable` outside a React component or custom hook.

**Solution**: Only call React hooks inside functional components or custom hooks:

```typescript
// ❌ Wrong - outside component
const service = useInjectable({ key: 'MyService' });

function MyComponent() {
  return <div>...</div>;
}

// ✅ Correct - inside component
function MyComponent() {
  const service = useInjectable({ key: 'MyService' });
  return <div>...</div>;
}
```

## Type Safety

### Generic Type Parameter

Always provide the type parameter for proper TypeScript inference:

```typescript
// ✅ Correct - with type parameter
const dataProvider = useInjectable<IDataProvider>({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
});

// ❌ Wrong - no type parameter (returns unknown)
const dataProvider = useInjectable({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
});
```

### Type Augmentation Pattern

For maximum type safety with custom services, always augment types:

```typescript
// types/injectable.d.ts
declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    // Map key string to service type
    'UserService': UserService;
    'NotificationService': NotificationService;
    // ... other services
  }
}
```

This enables:
- Autocomplete for service keys
- Type checking for key strings
- Automatic type inference from key

## Performance

`useInjectable` is lightweight and performs minimal work:

1. **Context lookup**: O(1) - React context access
2. **Container.get()**: O(1) - Hash map lookup in DI container
3. **No re-renders**: Hook doesn't subscribe to changes; returns stable reference

**Tip**: Services are singletons by default, so multiple `useInjectable` calls with the same key return the same instance.

## Best Practices

### 1. Extract to Custom Hook

Create custom hooks for commonly-used services:

```typescript
// hooks/useDataProvider.ts
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider } from 'ra-core';

export function useDataProvider() {
  return useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });
}

// Usage
function MyComponent() {
  const dataProvider = useDataProvider();
  // ...
}
```

### 2. Use CoreBindings Constants

Never hardcode binding keys:

```typescript
// ❌ Wrong - hardcoded string
const dataProvider = useInjectable<IDataProvider>({
  key: '@app/application/data/rest/default',
});

// ✅ Correct - use constant
const dataProvider = useInjectable<IDataProvider>({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
});
```

### 3. Type Augmentation for All Custom Services

Always augment types for custom services to maintain type safety across your codebase.

### 4. Avoid in Render Logic

Don't call `useInjectable` conditionally or in loops:

```typescript
// ❌ Wrong - conditional call
function MyComponent({ needsService }) {
  if (needsService) {
    const service = useInjectable({ key: 'MyService' });
  }
}

// ✅ Correct - always call, conditionally use
function MyComponent({ needsService }) {
  const service = useInjectable({ key: 'MyService' });

  if (needsService) {
    service.doSomething();
  }
}
```

## See Also

- [Dependency Injection Guide](/guides/dependency-injection/) - Complete DI guide
- [Service Registration](/guides/dependency-injection/service-registration) - How to register services
- [Injection Patterns](/guides/dependency-injection/injection-patterns) - DI patterns and best practices
- [BaseRaApplication](/api-reference/core/base-ra-application) - Application lifecycle and setup

---

**Next**: Learn about [CoreBindings](/api-reference/core/core-bindings) to see all available service keys.

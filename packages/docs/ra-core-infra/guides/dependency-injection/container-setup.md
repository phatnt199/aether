# Container Setup

Learn how to set up and configure the DI container for your @ra-core-infra application.

## Application Container

The DI container is created and managed by your application class, which extends `BaseRaApplication`.

### BaseRaApplication

`BaseRaApplication` extends the Venizia `Container` class and provides the foundation for your application:

```typescript
import { Container } from '@venizia/ignis-inversion';
import { ICoreRaApplication, ValueOrPromise } from '@minimaltech/ra-core-infra';

export abstract class BaseRaApplication extends Container implements ICoreRaApplication {
  // Abstract method - you must implement this
  abstract bindContext(): ValueOrPromise<void>;

  // Lifecycle hooks
  preConfigure(): ValueOrPromise<void> {
    this.bindContext();  // Calls your bindContext implementation
  }

  postConfigure(): ValueOrPromise<void> {
    // Override for post-configuration logic
  }

  // Start the application
  async start() {
    await this.preConfigure();
    await this.postConfigure();
  }

  // Helper methods
  injectable<T>(scope: string, value: TClass<T>, tags?: string[]) {
    this.bind({ key: `${scope}.${value.name}` })
      .toClass(value)
      .setTags(...(tags ?? []));
  }

  service<T>(value: TClass<T>) {
    this.injectable('services', value);
  }
}
```

**Key Points**:
- Extends `Container` - your app **is** a container
- `bindContext()` is **abstract** - you must implement it
- `start()` orchestrates the lifecycle
- Helper methods (`injectable`, `service`) simplify registration

### Application Lifecycle

The application goes through 4 lifecycle phases:

```
1. Construction     → new RaApplication()
2. Pre-Configure    → preConfigure() → calls bindContext()
3. Post-Configure   → postConfigure()
4. Start            → start() → orchestrates 2 & 3
```

**Lifecycle Flow**:
```typescript
const app = new RaApplication();  // 1. Construct

await app.start();                 // 4. Start

// Inside start():
//   await this.preConfigure();    // 2. Pre-configure
//     this.bindContext();          //    → Your registrations
//   await this.postConfigure();    // 3. Post-configure
```

**When to use each hook**:

| Hook | Purpose | Use For |
|------|---------|---------|
| `constructor` | Basic initialization | Store config, set defaults |
| `bindContext()` | **Service registration** | **Register all services** ⭐ |
| `postConfigure()` | Post-setup logic | Initialize connections, start services |

::: tip Best Practice
Put **all** service registrations in `bindContext()`. Keep constructor and `postConfigure()` minimal.
:::

---

## Creating Your Application

### Basic Setup

Create your application class by extending `BaseRaApplication`:

```typescript
// src/application/application.ts
import { BaseRaApplication, CoreBindings, IRestDataProviderOptions } from '@minimaltech/ra-core-infra';

export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    // Register configuration
    this.bind<IRestDataProviderOptions>({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    }).toValue({
      url: import.meta.env.VITE_API_URL || 'https://api.example.com',
      noAuthPaths: ['/auth/login', '/auth/register'],
    });

    // Register services (covered in next section)
    this.service(UserService);
    this.service(ProductApi);
  }
}
```

### With Async Initialization

If you need async setup, make `bindContext` async:

```typescript
export class RaApplication extends BaseRaApplication {
  async bindContext(): Promise<void> {
    // Async configuration loading
    const config = await fetch('/api/config').then(r => r.json());

    this.bind({ key: 'config.dynamic' })
      .toValue(config);

    // Register services
    this.service(UserService);
  }

  async postConfigure(): Promise<void> {
    // Initialize connections
    const dbService = this.get({ key: 'services.DatabaseService' });
    await dbService.connect();

    console.log('Application configured and ready!');
  }
}
```

### With Environment-Specific Configuration

Use environment variables for different configurations:

```typescript
export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    const isProd = import.meta.env.MODE === 'production';
    const isDev = import.meta.env.MODE === 'development';

    // Environment-specific API URL
    this.bind<IRestDataProviderOptions>({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    }).toValue({
      url: isProd
        ? 'https://api.production.com'
        : 'https://api.dev.com',
      noAuthPaths: isDev ? [] : ['/auth/login'],  // No auth in dev
    });

    // Development-only services
    if (isDev) {
      this.service(MockDataService);
      this.service(DebugService);
    }

    // Production-only services
    if (isProd) {
      this.service(AnalyticsService);
      this.service(ErrorTrackingService);
    }

    // Common services
    this.service(UserService);
    this.service(ProductApi);
  }
}
```

---

## Configuration Binding

@ra-core-infra requires certain configurations to be bound for providers to work.

### REST Data Provider Options

Configure the REST API endpoint:

```typescript
import { IRestDataProviderOptions, CoreBindings } from '@minimaltech/ra-core-infra';

bindContext(): void {
  this.bind<IRestDataProviderOptions>({
    key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
  }).toValue({
    url: 'https://api.example.com',           // API base URL (required)
    noAuthPaths: ['/auth/login', '/public'],  // Paths without auth headers
    headers: {                                 // Default headers
      'X-App-Version': '1.0.0',
      'X-Client-Type': 'web',
    },
  });
}
```

### Auth Provider Options

Configure authentication endpoints:

```typescript
import { IAuthProviderOptions, CoreBindings } from '@minimaltech/ra-core-infra';

bindContext(): void {
  this.bind<IAuthProviderOptions>({
    key: CoreBindings.AUTH_PROVIDER_OPTIONS,
  }).toValue({
    paths: {
      signIn: '/api/auth/login',              // Login endpoint
      signUp: '/api/auth/register',            // Signup endpoint (optional)
      checkAuth: '/api/auth/verify',           // Token verification endpoint
    },
    endpoints: {
      afterLogin: '/dashboard',                 // Redirect after login
    },
  });
}
```

### I18n Provider Options

Configure internationalization:

```typescript
import { II18nProviderOptions, CoreBindings, englishMessages } from '@minimaltech/ra-core-infra';
import frenchMessages from 'ra-language-french';

bindContext(): void {
  this.bind<II18nProviderOptions>({
    key: CoreBindings.I18N_PROVIDER_OPTIONS,
  }).toValue({
    i18nSources: {
      en: englishMessages,
      fr: frenchMessages,
    },
    listLanguages: [
      { locale: 'en', name: 'English' },
      { locale: 'fr', name: 'Français' },
    ],
  });
}
```

### Complete Configuration Example

```typescript
export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    // 1. REST Data Provider
    this.bind<IRestDataProviderOptions>({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    }).toValue({
      url: import.meta.env.VITE_API_URL,
      noAuthPaths: ['/auth/login'],
    });

    // 2. Auth Provider
    this.bind<IAuthProviderOptions>({
      key: CoreBindings.AUTH_PROVIDER_OPTIONS,
    }).toValue({
      paths: {
        signIn: '/api/auth/login',
        checkAuth: '/api/auth/verify',
      },
      endpoints: {
        afterLogin: '/dashboard',
      },
    });

    // 3. I18n Provider
    this.bind<II18nProviderOptions>({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
    }).toValue({
      i18nSources: { en: englishMessages },
      listLanguages: [{ locale: 'en', name: 'English' }],
    });

    // 4. Custom configuration
    this.bind({ key: 'config.app' })
      .toValue({
        appName: 'My Admin App',
        version: '1.0.0',
        features: {
          analytics: true,
          darkMode: true,
        },
      });

    // 5. Services
    this.service(UserService);
    this.service(ProductApi);
  }
}
```

---

## Container Methods

The container (your application) provides methods for managing bindings.

### bind()

Create a new binding:

```typescript
// Basic binding
this.bind({ key: 'services.EmailService' })
  .toClass(EmailService);

// With scope
this.bind({ key: 'services.EmailService' })
  .toClass(EmailService)
  .setScope(BindingScopes.SINGLETON);

// With tags
this.bind({ key: 'services.EmailService' })
  .toClass(EmailService)
  .setScope(BindingScopes.SINGLETON)
  .setTags('service', 'communication');

// Value binding
this.bind({ key: 'config.apiUrl' })
  .toValue('https://api.example.com');

// Provider binding
this.bind({ key: 'services.DatabaseConnection' })
  .toProvider((container) => {
    const config = container.get({ key: 'config.database' });
    return new DatabaseConnection(config);
  });
```

**Method Chaining**:
```typescript
this.bind({ key: 'services.UserService' })
  .toClass(UserService)           // ← Returns binding
  .setScope(BindingScopes.SINGLETON)  // ← Returns binding
  .setTags('service', 'user');        // ← Returns binding
```

### get()

Retrieve an instance from the container:

```typescript
// Type-safe retrieval
const userService = this.get<UserService>({
  key: 'services.UserService'
});

// With CoreBindings
const dataProvider = this.get<IDataProvider>({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER
});
```

**When to use**:
- Inside application lifecycle methods
- In providers when accessing other services
- Rarely in services (prefer `@inject`)

::: warning
Avoid using `container.get()` in components. Use `useInjectable` hook instead.
:::

### unbind()

Remove a binding:

```typescript
// Remove binding
this.unbind({ key: 'services.TempService' });

// Check if bound first
if (this.isBound({ key: 'services.TempService' })) {
  this.unbind({ key: 'services.TempService' });
}
```

**Use Cases**:
- Testing (override bindings)
- Hot module replacement
- Dynamic service replacement

### isBound()

Check if a key is bound:

```typescript
if (this.isBound({ key: 'services.EmailService' })) {
  console.log('EmailService is registered');
} else {
  console.log('EmailService is not registered');
}

// Conditional registration
if (!this.isBound({ key: 'services.Logger' })) {
  this.bind({ key: 'services.Logger' })
    .toClass(DefaultLogger);
}
```

### findByTag()

Find all bindings with a specific tag:

```typescript
// Register services with tags
this.bind({ key: 'services.EmailService' })
  .toClass(EmailService)
  .setTags('communication');

this.bind({ key: 'services.SmsService' })
  .toClass(SmsService)
  .setTags('communication');

// Find all communication services
const communicationServices = this.findByTag('communication');
// Returns: [EmailService, SmsService]
```

**Use Cases**:
- Service discovery
- Plugin systems
- Batch operations

---

## React Integration

Integrate the DI container with React using context.

### CoreApplicationContext

`CoreApplicationContext` provides the container to all React components:

```typescript
import { CoreApplicationContext } from '@minimaltech/ra-core-infra';

<CoreApplicationContext container={container}>
  {children}
</CoreApplicationContext>
```

### Application Context Setup

**Step 1: Create Application**:
```typescript
// src/application/ApplicationContext.tsx
import { CoreApplicationContext } from '@minimaltech/ra-core-infra';
import React, { ReactNode } from 'react';
import { RaApplication } from './application';

// Create and start application
const app = new RaApplication();
await app.start();

// Get container
const container = app.getContainer();

interface Props {
  children: ReactNode;
}

export function ApplicationContext({ children }: Props) {
  return (
    <CoreApplicationContext container={container}>
      {children}
    </CoreApplicationContext>
  );
}
```

**Step 2: Wrap Your App**:
```typescript
// src/App.tsx
import React from 'react';
import { ApplicationContext } from './application/ApplicationContext';
import { ProductList } from './screens/products/ProductList';

function App() {
  return (
    <ApplicationContext>
      <div style={{ padding: '2rem' }}>
        <ProductList />
      </div>
    </ApplicationContext>
  );
}

export default App;
```

**Step 3: Use in Components**:
```typescript
// src/screens/products/ProductList.tsx
import { useInjectable } from '@minimaltech/ra-core-infra';
import { ProductApi } from '@/application/services/product.api';

export function ProductList() {
  // Inject service from container
  const productApi = useInjectable<ProductApi>({
    key: 'services.ProductApi'
  });

  // Use service...
}
```

### With React Admin

Integrate with React Admin's `<Admin>` component:

```typescript
// src/App.tsx
import { Admin, Resource } from 'react-admin';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import { ApplicationContext } from './application/ApplicationContext';

function AdminApp() {
  // Inject providers
  const dataProvider = useInjectable({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER });
  const authProvider = useInjectable({ key: CoreBindings.DEFAULT_AUTH_PROVIDER });
  const i18nProvider = useInjectable({ key: CoreBindings.DEFAULT_I18N_PROVIDER });

  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
    >
      <Resource name="users" list={UserList} />
      <Resource name="products" list={ProductList} />
    </Admin>
  );
}

function App() {
  return (
    <ApplicationContext>
      <AdminApp />
    </ApplicationContext>
  );
}

export default App;
```

### With TanStack Query

Combine DI with TanStack Query for data fetching:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplicationContext } from './application/ApplicationContext';

const queryClient = new QueryClient();

function App() {
  return (
    <ApplicationContext>
      <QueryClientProvider client={queryClient}>
        <ProductList />
      </QueryClientProvider>
    </ApplicationContext>
  );
}
```

### Multiple Containers (Advanced)

Use different containers for different parts of your app:

```typescript
// Main application container
const mainApp = new RaApplication();
await mainApp.start();
const mainContainer = mainApp.getContainer();

// Admin-specific container (child of main)
const adminApp = new AdminApplication(mainContainer);  // Parent container
await adminApp.start();
const adminContainer = adminApp.getContainer();

function App() {
  return (
    <CoreApplicationContext container={mainContainer}>
      <MainApp />

      <CoreApplicationContext container={adminContainer}>
        <AdminApp />
      </CoreApplicationContext>
    </CoreApplicationContext>
  );
}
```

---

## Complete Examples

### Minimal Application

```typescript
// src/application/application.ts
import { BaseRaApplication, CoreBindings, IRestDataProviderOptions } from '@minimaltech/ra-core-infra';
import { ProductApi } from './services/product.api';

export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    // Configuration
    this.bind<IRestDataProviderOptions>({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    }).toValue({
      url: 'https://api.example.com',
    });

    // Services
    this.service(ProductApi);
  }
}
```

### Production Application

```typescript
// src/application/application.ts
import { BaseRaApplication, CoreBindings, IRestDataProviderOptions, IAuthProviderOptions, II18nProviderOptions, englishMessages } from '@minimaltech/ra-core-infra';
import { BindingScopes } from '@venizia/ignis-inversion';
import { UserService } from './services/user.service';
import { ProductApi } from './services/product.api';
import { OrderApi } from './services/order.api';
import { AnalyticsService } from './services/analytics.service';
import { LoggerService } from './services/logger.service';

export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    const isProd = import.meta.env.MODE === 'production';

    // REST Data Provider
    this.bind<IRestDataProviderOptions>({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    }).toValue({
      url: import.meta.env.VITE_API_URL,
      noAuthPaths: ['/auth/login', '/auth/register'],
      headers: {
        'X-App-Version': import.meta.env.VITE_APP_VERSION,
        'X-Client': 'web',
      },
    });

    // Auth Provider
    this.bind<IAuthProviderOptions>({
      key: CoreBindings.AUTH_PROVIDER_OPTIONS,
    }).toValue({
      paths: {
        signIn: '/api/auth/login',
        checkAuth: '/api/auth/verify',
      },
      endpoints: {
        afterLogin: '/dashboard',
      },
    });

    // I18n Provider
    this.bind<II18nProviderOptions>({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
    }).toValue({
      i18nSources: { en: englishMessages },
      listLanguages: [{ locale: 'en', name: 'English' }],
    });

    // App Configuration
    this.bind({ key: 'config.app' })
      .toValue({
        appName: 'Production Admin',
        version: import.meta.env.VITE_APP_VERSION,
        environment: import.meta.env.MODE,
      });

    // Core Services (Singleton)
    this.bind({ key: 'services.LoggerService' })
      .toClass(LoggerService)
      .setScope(BindingScopes.SINGLETON);

    this.bind({ key: 'services.AnalyticsService' })
      .toClass(AnalyticsService)
      .setScope(BindingScopes.SINGLETON);

    // API Services
    this.service(UserService);
    this.service(ProductApi);
    this.service(OrderApi);

    // Development-only
    if (!isProd) {
      this.service(DebugService);
    }
  }

  async postConfigure(): Promise<void> {
    // Initialize analytics
    const analytics = this.get({ key: 'services.AnalyticsService' });
    await analytics.initialize();

    console.log('Application ready!');
  }
}
```

---

## Troubleshooting

### "Cannot read properties of undefined"

**Cause**: Service not registered in container.

**Solution**: Check `bindContext()` registration:
```typescript
bindContext(): void {
  this.service(UserService);  // ← Add this
}
```

### "Binding not found for key: ..."

**Cause**: Typo in binding key or service not registered.

**Solution**: Verify key matches exactly:
```typescript
// Registration
this.bind({ key: 'services.UserService' }).toClass(UserService);

// Usage
useInjectable({ key: 'services.UserService' });  // ← Must match exactly
```

### "reflect-metadata must be imported first"

**Cause**: `reflect-metadata` not imported before decorators.

**Solution**: Add as first import in `main.tsx`:
```typescript
import 'reflect-metadata';  // ← Must be first!
import React from 'react';
import ReactDOM from 'react-dom/client';
// ...
```

### "Circular dependency detected"

**Cause**: ServiceA depends on ServiceB, and ServiceB depends on ServiceA.

**Solution**: Redesign to remove circular dependency or use property injection:
```typescript
class ServiceA {
  @inject({ key: 'services.ServiceB' })
  serviceB!: ServiceB;  // Property injection
}
```

---

## Related Topics

- **[Service Registration →](./service-registration)** - Register services and providers
- **[Injection Patterns →](./injection-patterns)** - Inject dependencies in components
- **[Best Practices →](./best-practices)** - Container setup best practices

## See Also

- **[BaseRaApplication →](/api-reference/core/base-ra-application)** - Application class API
- **[CoreBindings →](/api-reference/core/core-bindings)** - Standard binding keys
- **[First Application →](/getting-started/first-application)** - Complete tutorial

---

**Ready to register services?** Continue with [Service Registration →](./service-registration)

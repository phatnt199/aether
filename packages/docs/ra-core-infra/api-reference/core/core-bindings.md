# CoreBindings

Type-safe dependency injection binding keys for core @ra-core-infra services and configuration.

## Import

```typescript
import { CoreBindings } from '@minimaltech/ra-core-infra';
```

## Description

`CoreBindings` is a class containing string constants used as keys for the dependency injection container. These constants provide type-safe access to framework services and configuration objects.

**Purpose**:
- Consistent service lookup keys across the application
- Avoid magic strings and typos
- Enable TypeScript autocomplete for binding keys
- Clear documentation of available services

**When to use**:
- Register services in `BaseRaApplication.bindContext()`
- Inject services with `useInjectable()` hook
- Access services from the DI container

## All Binding Keys

### Provider Bindings

#### APPLICATION_INSTANCE

Application instance binding key.

**Value**: `'@app/application/instance'`

**Type**: `BaseRaApplication`

**Example**:
```typescript
const app = container.get<BaseRaApplication>({
  key: CoreBindings.APPLICATION_INSTANCE,
});
```

---

#### DEFAULT_REST_DATA_PROVIDER

REST data provider binding key.

**Value**: `'@app/application/data/rest/default'`

**Type**: `IDataProvider`

**Usage**: Access the main data provider for CRUD operations

**Example**:
```typescript
// In components
const dataProvider = useInjectable<IDataProvider>({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
});

// Perform data operations
const users = await dataProvider.getList({
  resource: 'users',
  params: { pagination: { page: 1, perPage: 10 } },
});
```

---

#### DEFAULT_AUTH_PROVIDER

Authentication provider binding key.

**Value**: `'@app/application/auth/default'`

**Type**: `IAuthProvider`

**Usage**: Access authentication methods (login, logout, checkAuth, etc.)

**Example**:
```typescript
const authProvider = useInjectable<IAuthProvider>({
  key: CoreBindings.DEFAULT_AUTH_PROVIDER,
});

// Check authentication
await authProvider.checkAuth();

// Get user identity
const identity = await authProvider.getIdentity();
```

---

#### DEFAULT_I18N_PROVIDER

Internationalization provider binding key.

**Value**: `'@app/application/i18n/default'`

**Type**: `II18nProvider`

**Usage**: Access translation and locale management

**Example**:
```typescript
const i18nProvider = useInjectable<II18nProvider>({
  key: CoreBindings.DEFAULT_I18N_PROVIDER,
});

// Translate a key
const translated = i18nProvider.translate('ra.action.save');

// Change locale
await i18nProvider.changeLocale('fr');
```

---

### Configuration Bindings

#### REST_DATA_PROVIDER_OPTIONS

REST data provider configuration binding key.

**Value**: `'@app/application/options/rest/data'`

**Type**: `IRestDataProviderOptions`

**Usage**: Configure the REST data provider (API URL, headers, etc.)

**Example**:
```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: {
        url: 'https://api.example.com',
        headers: {
          'X-Custom-Header': 'value',
        },
        noAuthPaths: ['/auth/login', '/auth/register'],
      },
    });
  }
}
```

---

#### AUTH_PROVIDER_OPTIONS

Authentication provider configuration binding key.

**Value**: `'@app/application/options/auth'`

**Type**: `IAuthProviderOptions`

**Usage**: Configure the authentication provider

**Example**:
```typescript
export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    this.container.bind({
      key: CoreBindings.AUTH_PROVIDER_OPTIONS,
      value: {
        loginUrl: '/auth/login',
        logoutUrl: '/auth/logout',
      },
    });
  }
}
```

---

#### I18N_PROVIDER_OPTIONS

Internationalization provider configuration binding key.

**Value**: `'@app/application/options/i18n'`

**Type**: `II18nProviderOptions`

**Usage**: Configure translations and available locales

**Example**:
```typescript
import polyglotI18nProvider from 'ra-i18n-polyglot';
import englishMessages from 'ra-language-english';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    this.container.bind({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
      value: {
        i18nSources: {
          en: englishMessages,
        },
        listLanguages: [
          { locale: 'en', name: 'English' },
          { locale: 'fr', name: 'Français' },
        ],
      },
    });
  }
}
```

---

### Service Bindings

#### DEFAULT_AUTH_SERVICE

Default authentication service binding key.

**Value**: `'@app/application/service/auth/default'`

**Type**: `IAuthService`

**Usage**: Access low-level auth service (token management, storage)

**Example**:
```typescript
const authService = useInjectable<IAuthService>({
  key: CoreBindings.DEFAULT_AUTH_SERVICE,
});

// Get stored auth token
const auth = authService.getAuth();

// Save new auth token
authService.saveAuth({ token: 'new-token', user: { id: '123' } });

// Clear auth data
authService.cleanUp();
```

---

## Quick Reference Table

| Constant | Value | Type | Purpose |
|----------|-------|------|---------|
| `APPLICATION_INSTANCE` | `@app/application/instance` | `BaseRaApplication` | Application instance |
| `DEFAULT_REST_DATA_PROVIDER` | `@app/application/data/rest/default` | `IDataProvider` | Data provider for CRUD |
| `DEFAULT_AUTH_PROVIDER` | `@app/application/auth/default` | `IAuthProvider` | Auth provider |
| `DEFAULT_I18N_PROVIDER` | `@app/application/i18n/default` | `II18nProvider` | i18n provider |
| `REST_DATA_PROVIDER_OPTIONS` | `@app/application/options/rest/data` | `IRestDataProviderOptions` | Data provider config |
| `AUTH_PROVIDER_OPTIONS` | `@app/application/options/auth` | `IAuthProviderOptions` | Auth provider config |
| `I18N_PROVIDER_OPTIONS` | `@app/application/options/i18n` | `II18nProviderOptions` | i18n provider config |
| `DEFAULT_AUTH_SERVICE` | `@app/application/service/auth/default` | `IAuthService` | Auth service (token mgmt) |

## Usage Patterns

### In Application Setup

Register configuration using CoreBindings:

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import type {
  IRestDataProviderOptions,
  IAuthProviderOptions,
  II18nProviderOptions,
} from '@minimaltech/ra-core-infra';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Data provider configuration
    const dataProviderOptions: IRestDataProviderOptions = {
      url: 'https://api.example.com',
    };
    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: dataProviderOptions,
    });

    // Auth provider configuration
    const authProviderOptions: IAuthProviderOptions = {
      loginUrl: '/auth/login',
    };
    this.container.bind({
      key: CoreBindings.AUTH_PROVIDER_OPTIONS,
      value: authProviderOptions,
    });

    // i18n provider configuration
    const i18nProviderOptions: II18nProviderOptions = {
      i18nSources: { /* ... */ },
    };
    this.container.bind({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
      value: i18nProviderOptions,
    });
  }
}
```

---

### In React Components

Inject services using CoreBindings:

```typescript
import React from 'react';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider, IAuthProvider } from '@minimaltech/ra-core-infra';

function UserProfile() {
  // Inject data provider
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  // Inject auth provider
  const authProvider = useInjectable<IAuthProvider>({
    key: CoreBindings.DEFAULT_AUTH_PROVIDER,
  });

  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      const identity = await authProvider.getIdentity();
      const userData = await dataProvider.getOne({
        resource: 'users',
        params: { id: identity.id },
      });
      setUser(userData.data);
    };
    loadUser();
  }, [dataProvider, authProvider]);

  return <div>{user?.name}</div>;
}
```

---

### Direct Container Access

Access services from container directly (advanced):

```typescript
import { CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider } from '@minimaltech/ra-core-infra';

// In application code (not React)
const app = new MyApplication();
await app.start();

// Get service from container
const dataProvider = app.container.get<IDataProvider>({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
});

const users = await dataProvider.getList({
  resource: 'users',
  params: { /* ... */ },
});
```

---

### Type Augmentation for Custom Bindings

Extend CoreBindings concept for your own services:

```typescript
// constants/bindings.ts
export class CustomBindings {
  static readonly USER_SERVICE = 'services.UserService';
  static readonly PRODUCT_SERVICE = 'services.ProductService';
  static readonly NOTIFICATION_SERVICE = 'services.NotificationService';
}

// Usage
import { CustomBindings } from '@/constants/bindings';

const userService = useInjectable<UserService>({
  key: CustomBindings.USER_SERVICE,
});
```

## Complete Example

### Full Application Setup

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import type {
  IRestDataProviderOptions,
  IAuthProviderOptions,
  II18nProviderOptions,
} from '@minimaltech/ra-core-infra';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import englishMessages from 'ra-language-english';
import { UserService } from '@/services/UserService';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // ============================================
    // Provider Configurations
    // ============================================

    // REST Data Provider
    const restDataProviderOptions: IRestDataProviderOptions = {
      url: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      headers: {
        'X-App-Version': '1.0.0',
      },
      noAuthPaths: ['/auth/login', '/auth/register'],
    };
    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: restDataProviderOptions,
    });

    // Auth Provider
    const authProviderOptions: IAuthProviderOptions = {
      loginUrl: '/auth/login',
      logoutUrl: '/auth/logout',
    };
    this.container.bind({
      key: CoreBindings.AUTH_PROVIDER_OPTIONS,
      value: authProviderOptions,
    });

    // i18n Provider
    const i18nProviderOptions: II18nProviderOptions = {
      i18nSources: {
        en: englishMessages,
      },
      listLanguages: [
        { locale: 'en', name: 'English' },
      ],
    };
    this.container.bind({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
      value: i18nProviderOptions,
    });

    // ============================================
    // Custom Services
    // ============================================
    this.service(UserService);
  }
}

// Start application
const app = new MyApplication();
await app.start();

export { app };
```

---

### Using in React

```typescript
import React from 'react';
import { Admin, Resource, ListGuesser } from 'react-admin';
import { ApplicationContext, useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider, IAuthProvider, II18nProvider } from '@minimaltech/ra-core-infra';
import { app } from './MyApplication';

export function App() {
  return (
    <ApplicationContext.Provider
      value={{
        container: app.container,
        logger: app.logger,
        registry: app.registry,
      }}
    >
      <AdminApp />
    </ApplicationContext.Provider>
  );
}

function AdminApp() {
  // Inject all providers using CoreBindings
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  const authProvider = useInjectable<IAuthProvider>({
    key: CoreBindings.DEFAULT_AUTH_PROVIDER,
  });

  const i18nProvider = useInjectable<II18nProvider>({
    key: CoreBindings.DEFAULT_I18N_PROVIDER,
  });

  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
    >
      <Resource name="users" list={ListGuesser} />
      <Resource name="posts" list={ListGuesser} />
    </Admin>
  );
}
```

## Related APIs

- [BaseRaApplication](/api-reference/core/base-ra-application) - Application class that uses these bindings
- [useInjectable](/api-reference/hooks/use-injectable) - Hook for injecting services
- [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) - Data provider configuration
- [DefaultAuthProvider](/api-reference/providers/default-auth-provider) - Auth provider configuration

## Best Practices

### 1. Always Use Constants

Never hardcode binding keys - always use CoreBindings:

```typescript
// ❌ Wrong - magic string
const dataProvider = useInjectable<IDataProvider>({
  key: '@app/application/data/rest/default',
});

// ✅ Correct - use constant
const dataProvider = useInjectable<IDataProvider>({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
});
```

### 2. Type Your Injections

Always provide type parameter for type safety:

```typescript
// ❌ Wrong - no type (returns unknown)
const dataProvider = useInjectable({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
});

// ✅ Correct - with type
const dataProvider = useInjectable<IDataProvider>({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
});
```

### 3. Create Custom Binding Classes

Follow CoreBindings pattern for your own services:

```typescript
export class AppBindings {
  // Services
  static readonly USER_SERVICE = 'services.UserService';
  static readonly ORDER_SERVICE = 'services.OrderService';

  // Configuration
  static readonly APP_CONFIG = '@app/config';
  static readonly FEATURE_FLAGS = '@app/feature-flags';
}

// Usage matches CoreBindings pattern
const userService = useInjectable<UserService>({
  key: AppBindings.USER_SERVICE,
});
```

### 4. Document Your Bindings

Document custom binding constants like CoreBindings:

```typescript
export class AppBindings {
  /**
   * User service binding key.
   * @type {UserService}
   */
  static readonly USER_SERVICE = 'services.UserService';

  /**
   * Application configuration binding key.
   * @type {IAppConfig}
   */
  static readonly APP_CONFIG = '@app/config';
}
```

### 5. Group Related Bindings

Organize bindings by category:

```typescript
export class AppBindings {
  // ============================================
  // Services
  // ============================================
  static readonly USER_SERVICE = 'services.UserService';
  static readonly PRODUCT_SERVICE = 'services.ProductService';

  // ============================================
  // Configuration
  // ============================================
  static readonly APP_CONFIG = '@app/config';
  static readonly FEATURE_FLAGS = '@app/feature-flags';

  // ============================================
  // External Services
  // ============================================
  static readonly EMAIL_SERVICE = 'external.EmailService';
  static readonly SMS_SERVICE = 'external.SmsService';
}
```

## See Also

- [Dependency Injection Guide](/guides/dependency-injection/) - Complete DI guide
- [Container Setup](/guides/dependency-injection/container-setup) - DI container configuration
- [Service Registration](/guides/dependency-injection/service-registration) - Registering services
- [BaseRaApplication](/api-reference/core/base-ra-application) - Application setup

---

**Congratulations!** You've completed the Phase 1 API Reference documentation. Continue with Phase 2 or explore other sections.

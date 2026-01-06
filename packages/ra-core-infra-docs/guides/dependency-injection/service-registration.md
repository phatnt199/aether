# Service Registration

Learn how to register services, providers, and dependencies in the DI container.

## Registration Methods

### Direct Binding

Use `bind()` to register services with full control:

```typescript
export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    // Direct class binding
    this.bind({ key: 'services.UserService' })
      .toClass(UserService)
      .setScope(BindingScopes.SINGLETON);

    // Value binding
    this.bind({ key: 'config.apiUrl' })
      .toValue('https://api.example.com');

    // Provider binding
    this.bind({ key: 'services.DatabaseConnection' })
      .toProvider((container) => {
        const config = container.get({ key: 'config' });
        return new DatabaseConnection(config);
      });
  }
}
```

### Helper Methods

Simplified registration with `injectable()` and `service()`:

```typescript
bindContext(): void {
  // service() - shorthand for services scope
  this.service(UserService);  // Key: "services.UserService"
  this.service(ProductApi);   // Key: "services.ProductApi"

  // injectable() - custom scope
  this.injectable('repositories', UserRepository);  // Key: "repositories.UserRepository"
  this.injectable('providers', CustomProvider);     // Key: "providers.CustomProvider"

  // With tags
  this.injectable('services', EmailService, ['communication', 'external']);
}
```

**Helper Implementation**:
```typescript
// From BaseRaApplication
injectable<T>(scope: string, value: TClass<T>, tags?: string[]) {
  this.bind({ key: `${scope}.${value.name}` })
    .toClass(value)
    .setTags(...(tags ?? []));
}

service<T>(value: TClass<T>) {
  this.injectable('services', value);  // Uses 'services' scope
}
```

---

## Binding Types

### Class Binding (toClass)

Register a class for automatic instantiation with dependency injection:

```typescript
// Service with dependencies
export class UserService {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    private dataProvider: IDataProvider
  ) {}
}

// Registration
this.bind({ key: 'services.UserService' })
  .toClass(UserService)
  .setScope(BindingScopes.SINGLETON);

// Container will:
// 1. Resolve dependencies (dataProvider)
// 2. Instantiate: new UserService(dataProvider)
// 3. Cache if SINGLETON
// 4. Return instance
```

**When to Use**:
- ✅ Services with dependencies
- ✅ Classes that need DI
- ✅ Stateless or stateful services
- ✅ Most common pattern

### Value Binding (toValue)

Register a pre-created value (no instantiation):

```typescript
// Configuration objects
this.bind<IRestDataProviderOptions>({
  key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
}).toValue({
  url: 'https://api.example.com',
  noAuthPaths: ['/auth/login'],
});

// Constants
this.bind({ key: 'config.appName' })
  .toValue('My Admin App');

// Instances
const logger = new Logger('app');
this.bind({ key: 'services.Logger' })
  .toValue(logger);
```

**When to Use**:
- ✅ Configuration objects
- ✅ Constants
- ✅ Pre-created instances
- ✅ Primitive values

### Provider Binding (toProvider)

Register a factory function for lazy/dynamic instantiation:

```typescript
// Lazy initialization
this.bind({ key: 'services.DatabaseConnection' })
  .toProvider((container) => {
    console.log('Creating database connection...');
    const config = container.get({ key: 'config.database' });
    return new DatabaseConnection(config.url, config.port);
  });

// Conditional creation
this.bind({ key: 'services.Storage' })
  .toProvider((container) => {
    const isProd = process.env.NODE_ENV === 'production';
    return isProd
      ? new S3Storage()
      : new LocalStorage();
  });

// Complex initialization
this.bind({ key: 'services.ApiClient' })
  .toProvider((container) => {
    const authService = container.get({ key: 'services.AuthService' });
    const config = container.get({ key: 'config.api' });

    const client = new ApiClient(config);
    client.setAuthToken(authService.getToken());
    return client;
  });
```

**When to Use**:
- ✅ Lazy initialization (expensive setup)
- ✅ Conditional creation
- ✅ Complex initialization logic
- ✅ Dependencies on other services

---

## Registration Patterns

### Services

Register API/business logic services:

```typescript
import { BaseCrudService, CoreBindings, IDataProvider } from '@minimaltech/ra-core-infra';
import { inject } from '@venizia/ignis-inversion';

export class ProductApi extends BaseCrudService<IProduct> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected dataProvider: IDataProvider
  ) {
    super({
      scope: 'ProductApi',
      dataProvider,
      serviceOptions: { basePath: '/products' },
    });
  }
}

// Registration
bindContext(): void {
  this.service(ProductApi);  // Key: "services.ProductApi"

  // Or with explicit scope
  this.bind({ key: 'services.ProductApi' })
    .toClass(ProductApi)
    .setScope(BindingScopes.SINGLETON);
}
```

### Providers

Register framework providers using BaseProvider pattern:

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import { Container, inject } from '@venizia/ignis-inversion';

export class CustomAuthProvider extends BaseProvider<IAuthProvider> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected dataProvider: IDataProvider,

    @inject({ key: CoreBindings.AUTH_PROVIDER_OPTIONS })
    protected options: IAuthProviderOptions
  ) {
    super({ scope: 'CustomAuthProvider' });
  }

  override value(container: Container): IAuthProvider {
    return {
      login: (params) => this.login(params),
      logout: () => this.logout(),
      checkAuth: () => this.checkAuth(),
      // ... other methods
    };
  }
}

// Registration
bindContext(): void {
  // Override default auth provider
  this.bind({ key: CoreBindings.DEFAULT_AUTH_PROVIDER })
    .toProvider((container) => {
      const provider = container.get<CustomAuthProvider>({
        key: 'providers.CustomAuthProvider'
      });
      return provider.value(container);
    });

  this.injectable('providers', CustomAuthProvider);
}
```

### Configuration

Register configuration objects for providers:

```typescript
bindContext(): void {
  // REST Data Provider Config
  this.bind<IRestDataProviderOptions>({
    key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
  }).toValue({
    url: import.meta.env.VITE_API_URL,
    noAuthPaths: ['/auth/login', '/auth/register'],
    headers: {
      'X-App-Version': '1.0.0',
    },
  });

  // Auth Provider Config
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

  // I18n Provider Config
  this.bind<II18nProviderOptions>({
    key: CoreBindings.I18N_PROVIDER_OPTIONS,
  }).toValue({
    i18nSources: { en: englishMessages },
    listLanguages: [{ locale: 'en', name: 'English' }],
  });

  // Custom Config
  this.bind({ key: 'config.features' })
    .toValue({
      analytics: true,
      darkMode: true,
      notifications: false,
    });
}
```

---

## CoreBindings

Standard binding keys for framework services:

```typescript
export class CoreBindings {
  // Application
  static readonly APPLICATION_INSTANCE = '@app/application/instance';

  // Providers
  static readonly DEFAULT_AUTH_PROVIDER = '@app/application/auth/default';
  static readonly DEFAULT_I18N_PROVIDER = '@app/application/i18n/default';
  static readonly DEFAULT_REST_DATA_PROVIDER = '@app/application/data/rest/default';

  // Services
  static readonly DEFAULT_AUTH_SERVICE = '@app/application/service/auth/default';

  // Options
  static readonly AUTH_PROVIDER_OPTIONS = '@app/application/options/auth';
  static readonly REST_DATA_PROVIDER_OPTIONS = '@app/application/options/rest/data';
  static readonly I18N_PROVIDER_OPTIONS = '@app/application/options/i18n';
}
```

**Usage**:
```typescript
// Type-safe registration
this.bind<IRestDataProviderOptions>({
  key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
}).toValue({ url: 'https://api.example.com' });

// Type-safe injection
const dataProvider = useInjectable<IDataProvider>({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER
});
```

---

## Custom Bindings

### Naming Conventions

Follow consistent naming patterns:

```typescript
bindContext(): void {
  // Pattern: "scope.ClassName"
  this.bind({ key: 'services.UserService' }).toClass(UserService);
  this.bind({ key: 'services.ProductApi' }).toClass(ProductApi);

  this.bind({ key: 'repositories.UserRepository' }).toClass(UserRepository);
  this.bind({ key: 'repositories.ProductRepository' }).toClass(ProductRepository);

  this.bind({ key: 'providers.CustomProvider' }).toClass(CustomProvider);

  this.bind({ key: 'config.api' }).toValue({ url: '...' });
  this.bind({ key: 'config.features' }).toValue({ ... });
}
```

**Best Practices**:
- Use namespaced keys: `scope.Name`
- Match scope to purpose: `services`, `repositories`, `config`, etc.
- Use PascalCase for class names
- Use camelCase for configs

### Type Augmentation

Enable autocomplete for custom keys:

```typescript
// src/types/ra-core-infra.d.ts
import 'reflect-metadata';

declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    'services.UserService': true;
    'services.ProductApi': true;
    'services.OrderApi': true;
    'repositories.UserRepository': true;
    'config.features': true;
  }
}
```

**Benefits**:
```typescript
// Now get IDE autocomplete!
const userService = useInjectable<UserService>({
  key: 'services.'  // ← IDE suggests UserService, ProductApi, OrderApi
});
```

---

## Complete Example

```typescript
// src/application/application.ts
import { BaseRaApplication, CoreBindings, IRestDataProviderOptions, IAuthProviderOptions, II18nProviderOptions, englishMessages } from '@minimaltech/ra-core-infra';
import { BindingScopes } from '@venizia/ignis-inversion';

// Services
import { UserService } from './services/user.service';
import { ProductApi } from './services/product.api';
import { OrderApi } from './services/order.api';
import { NotificationService } from './services/notification.service';

// Repositories
import { UserRepository } from './repositories/user.repository';

export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    // ===== CONFIGURATION =====

    // REST Data Provider
    this.bind<IRestDataProviderOptions>({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    }).toValue({
      url: import.meta.env.VITE_API_URL || 'https://api.example.com',
      noAuthPaths: ['/auth/login', '/auth/register'],
      headers: {
        'X-App-Version': '1.0.0',
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

    // Custom Configuration
    this.bind({ key: 'config.features' })
      .toValue({
        analytics: true,
        darkMode: true,
        notifications: true,
      });

    // ===== SERVICES =====

    // Using helper methods
    this.service(UserService);
    this.service(ProductApi);
    this.service(OrderApi);

    // With explicit scope (SINGLETON for shared services)
    this.bind({ key: 'services.NotificationService' })
      .toClass(NotificationService)
      .setScope(BindingScopes.SINGLETON)
      .setTags('service', 'notification');

    // ===== REPOSITORIES =====

    this.injectable('repositories', UserRepository);

    // ===== PROVIDERS (Lazy) =====

    this.bind({ key: 'services.WebSocketConnection' })
      .toProvider((container) => {
        const config = container.get({ key: 'config.features' });
        if (!config.notifications) {
          return null;  // Skip WebSocket if disabled
        }
        return new WebSocketConnection();
      });
  }

  async postConfigure(): Promise<void> {
    console.log('Application ready!');
  }
}
```

---

## Related Topics

- [Container Setup →](./container-setup) - Set up your application
- [Injection Patterns →](./injection-patterns) - Inject dependencies
- [Best Practices →](./best-practices) - Registration best practices

## See Also

- [BaseRaApplication →](/api-reference/core/base-ra-application) - Application API
- [CoreBindings →](/api-reference/core/core-bindings) - Standard keys
- [BaseCrudService →](/api-reference/services/base-crud-service) - Service base class

---

**Ready to inject dependencies?** Continue with [Injection Patterns →](./injection-patterns)

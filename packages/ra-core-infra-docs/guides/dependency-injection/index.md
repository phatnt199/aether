# Dependency Injection

Learn how @ra-core-infra uses dependency injection to create flexible, testable, and maintainable React Admin applications.

## What is Dependency Injection?

**Dependency Injection (DI)** is a design pattern where components receive their dependencies from external sources rather than creating them internally. Instead of a service creating its own dependencies, they are "injected" from outside.

**Without DI** (tightly coupled):
```typescript
class UserService {
  private api = new HttpClient('https://api.example.com');  // ❌ Hard-coded dependency

  async getUser(id: string) {
    return this.api.get(`/users/${id}`);
  }
}
```

**With DI** (loosely coupled):
```typescript
class UserService {
  constructor(
    @inject({ key: 'services.HttpClient' })
    private api: HttpClient  // ✅ Injected dependency
  ) {}

  async getUser(id: string) {
    return this.api.get(`/users/${id}`);
  }
}
```

### Why Use Dependency Injection?

**1. Testability**
- Easy to mock dependencies in tests
- Test components in isolation
- No need for complex test setup

**2. Flexibility**
- Swap implementations without changing code
- Configure different environments easily
- Support multiple configurations

**3. Maintainability**
- Clear dependency relationships
- Easier to refactor
- Reduced coupling between components

**4. Type Safety**
- TypeScript integration
- Compile-time error checking
- IDE autocomplete support

## Quick Start Example

Here's a complete working example showing DI in @ra-core-infra:

### Step 1: Create Application with Service Registration

```typescript
// src/application/application.ts
import { BaseRaApplication, CoreBindings, IRestDataProviderOptions } from '@minimaltech/ra-core-infra';
import { BindingScopes } from '@venizia/ignis-inversion';
import { ProductApi } from './services/product.api';

export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    // Register configuration
    this.bind<IRestDataProviderOptions>({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    }).toValue({
      url: 'https://dummyjson.com',
      noAuthPaths: ['/products'],
    });

    // Register service
    this.bind({ key: 'services.ProductApi' })
      .toClass(ProductApi)
      .setScope(BindingScopes.SINGLETON);
  }
}
```

### Step 2: Create Service with Dependency Injection

```typescript
// src/application/services/product.api.ts
import { BaseCrudService, CoreBindings, IDataProvider } from '@minimaltech/ra-core-infra';
import { inject } from '@venizia/ignis-inversion';

export interface IProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  thumbnail: string;
}

export class ProductApi extends BaseCrudService<IProduct> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected dataProvider: IDataProvider  // ✅ Dependency injected automatically
  ) {
    super({
      scope: 'ProductApi',
      dataProvider,
      serviceOptions: { basePath: '/products' },
    });
  }

  // Inherited methods: find(), findById(), create(), updateById(), deleteById()
}
```

### Step 3: Use in React Component

```typescript
// src/screens/products/ProductList.tsx
import { useInjectable } from '@minimaltech/ra-core-infra';
import { useQuery } from '@tanstack/react-query';
import { ProductApi, IProduct } from '@/application/services/product.api';

export function ProductList() {
  // Inject service using type-safe hook
  const productApi = useInjectable<ProductApi>({
    key: 'services.ProductApi',
  });

  const { data: products, isLoading } = useQuery<IProduct[]>({
    queryKey: ['products'],
    queryFn: () => productApi.find({}),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products</h1>
      {products?.map(product => (
        <div key={product.id}>
          <h3>{product.title}</h3>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

**What just happened?**
1. `RaApplication` registered `ProductApi` service in the DI container
2. `ProductApi` received `IDataProvider` through constructor injection
3. `ProductList` component retrieved `ProductApi` using `useInjectable` hook
4. All dependencies resolved automatically - no manual instantiation!

## Venizia DI Container

@ra-core-infra uses **[@venizia/ignis-inversion](https://github.com/minimaltech/venizia)** as its dependency injection container. Venizia is a lightweight, TypeScript-first DI container with decorator support.

### Why Venizia?

**1. TypeScript Native**
- Built for TypeScript from the ground up
- Full type inference
- Decorator metadata support

**2. React Integration**
- Seamless React context integration
- Hooks for component injection
- Provider pattern support

**3. Flexible Binding**
- Class binding (`toClass`)
- Value binding (`toValue`)
- Factory binding (`toProvider`)

**4. Scope Management**
- Singleton instances
- Transient instances
- Request-scoped instances

**5. Lightweight**
- Small bundle size
- Minimal runtime overhead
- No external dependencies (except reflect-metadata)

### Core Concepts

The Venizia DI container has three main concepts:

**1. Container**
- Central registry for all bindings
- Resolves dependencies
- Manages instance lifecycles

**2. Bindings**
- Maps keys to implementations
- Defines how to create instances
- Configures scope (singleton vs transient)

**3. Injection**
- `@inject` decorator for dependencies
- Type-safe key resolution
- Automatic dependency graph resolution

## How It Works in @ra-core-infra

@ra-core-infra integrates DI throughout its architecture:

### 1. Application Lifecycle

```typescript
export class RaApplication extends BaseRaApplication {
  // 1. preConfigure() - called first, invokes bindContext()
  // 2. bindContext() - register all services (you implement this)
  // 3. postConfigure() - post-setup logic
  // 4. start() - orchestrates the lifecycle

  bindContext(): void {
    // Register your services here
    this.service(UserService);
    this.service(ProductApi);
  }
}

// Start application
const app = new RaApplication();
await app.start();
```

### 2. Service Registration

Services are registered in `bindContext()`:

```typescript
bindContext(): void {
  // Register with helper method
  this.service(UserService);  // Key: "services.UserService"

  // Or register with custom key
  this.bind({ key: 'custom.MyService' })
    .toClass(MyService)
    .setScope(BindingScopes.SINGLETON);

  // Register configuration
  this.bind({ key: CoreBindings.REST_DATA_PROVIDER_OPTIONS })
    .toValue({ url: 'https://api.example.com' });
}
```

### 3. Dependency Injection

Services receive dependencies through constructor injection:

```typescript
export class UserService {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected dataProvider: IDataProvider,

    @inject({ key: 'services.AuthService' })
    protected authService: AuthService,
  ) {}
}
```

### 4. Component Injection

React components use `useInjectable` hook:

```typescript
function UserList() {
  const userService = useInjectable<UserService>({
    key: 'services.UserService',
  });

  // Use service...
}
```

### 5. Type Safety

Type augmentation enables autocomplete:

```typescript
// src/types/ra-core-infra.d.ts
declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    'services.UserService': true;
    'services.ProductApi': true;
  }
}

// Now you get autocomplete for these keys!
useInjectable({ key: 'services.' }) // IDE suggests UserService, ProductApi
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. Application Registration (bindContext)              │
│    this.service(ProductApi)                            │
│    this.bind(CoreBindings.REST_DATA_PROVIDER_OPTIONS)  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. DI Container                                         │
│    - Stores all bindings                               │
│    - Resolves dependencies                             │
│    - Manages lifecycles                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Service Instantiation                               │
│    new ProductApi(dataProvider)  // Injected           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Component Consumption                               │
│    useInjectable({ key: 'services.ProductApi' })       │
└─────────────────────────────────────────────────────────┘
```

## Guide Structure

This DI guide is organized into focused sections for progressive learning:

### Fundamentals

1. **[DI Concepts & Venizia](./overview)** ⭐ **Start Here**
   - Deep dive into DI principles
   - Venizia container architecture
   - Bindings, scopes, and decorators
   - Type safety patterns

2. **[Container Setup](./container-setup)**
   - Application lifecycle
   - Creating your application class
   - Container configuration
   - React integration

### Implementation

3. **[Service Registration](./service-registration)**
   - Binding types (toClass, toValue, toProvider)
   - Registration patterns
   - CoreBindings constants
   - Custom binding keys

4. **[Injection Patterns](./injection-patterns)**
   - Constructor injection
   - Property injection
   - Component injection (useInjectable)
   - Advanced patterns

### Best Practices

5. **[Use Cases](./use-cases)**
   - When to use DI
   - When to avoid DI
   - Real-world examples
   - Testing with DI

6. **[Best Practices](./best-practices)**
   - Design principles
   - Naming conventions
   - Performance optimization
   - Common pitfalls

### Recommended Reading Order

**For Beginners:**
1. This overview page (you are here)
2. [DI Concepts & Venizia](./overview) - understand the foundations
3. [Container Setup](./container-setup) - set up your app
4. [Service Registration](./service-registration) - register services
5. [Injection Patterns](./injection-patterns) - use services
6. [Best Practices](./best-practices) - optimize your code

**For Experienced Developers:**
- Skip to [Service Registration](./service-registration) for quick reference
- Review [Injection Patterns](./injection-patterns) for advanced techniques
- Check [Best Practices](./best-practices) for optimization tips

## Common Questions

### Do I need to use DI?

**Yes, if you're using @ra-core-infra.** The framework is built on DI and all core services (data providers, auth providers, i18n) use dependency injection.

### Can I mix DI with other patterns?

**Yes!** DI works alongside:
- React hooks for state management
- React Context for component trees
- Redux/Zustand for global state
- Pure functions for utilities

### Is DI the same as React Context?

**No.** While both provide dependencies to components:

| Feature | DI Container | React Context |
|---------|-------------|---------------|
| **Scope** | Application-wide | Component tree |
| **When Resolved** | Once at startup | Every render |
| **Use Case** | Services, APIs, config | Component props, theme |
| **Lifecycle** | Singleton/Transient | React lifecycle |
| **Testing** | Easy to mock | Requires wrapper |

**Use DI for:** Services, APIs, business logic, cross-cutting concerns
**Use React Context for:** Theme, UI state, component-specific data

### What about performance?

**DI is fast!** The container resolves dependencies once and caches singleton instances. There's no runtime overhead beyond the initial resolution.

Performance comparison:
```typescript
// DI singleton (resolved once, cached)
const service = container.get({ key: 'services.UserApi' });  // ⚡ Fast

// DI transient (new instance)
const service = container.get({ key: 'services.TempService' });  // Fast

// Direct instantiation (manual dependencies)
const service = new UserApi(new HttpClient(), new AuthService());  // Same speed
```

## Complete Example

Here's a complete, copy-paste ready example:

```typescript
// ==================== APPLICATION ====================
// src/application/application.ts
import {BaseRaApplication, CoreBindings} from '@minimaltech/ra-core-infra';
import type {IRestDataProviderOptions} from '@minimaltech/ra-core-infra';
import {BindingScopes} from '@venizia/ignis-inversion';
import {ProductApi} from './services/product.api';
import {UserApi} from './services/user.api';

export class RaApplication extends BaseRaApplication {
    bindContext(): void {
        // Configuration
        this.bind<IRestDataProviderOptions>({
            key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
        }).toValue({
            url: import.meta.env.VITE_API_URL || 'https://dummyjson.com',
            noAuthPaths: ['/products', '/users'],
        });

        // Services
        this.service(ProductApi);
        this.service(UserApi);
    }
}

// ==================== SERVICES ====================
// src/application/services/product.api.ts
import {BaseCrudService, CoreBindings} from '@minimaltech/ra-core-infra';
import type {IDataProvider} from '@minimaltech/ra-core-infra';
import {inject} from '@venizia/ignis-inversion';

export interface IProduct {
    id: number;
    title: string;
    price: number;
    thumbnail: string;
}

export class ProductApi extends BaseCrudService<IProduct> {
    constructor(
        @inject({key: CoreBindings.DEFAULT_REST_DATA_PROVIDER})
        protected dataProvider: IDataProvider
    ) {
        super({
            scope: 'ProductApi',
            dataProvider,
            serviceOptions: {basePath: '/products'},
        });
    }
}

// ==================== CONTEXT ====================
// src/application/ApplicationContext.tsx
import { ApplicationContext as CoreApplicationContext } from '@minimaltech/ra-core-infra';
import { RaApplication } from './application';
import type { ReactNode } from 'react';

let applicationContext = new RaApplication();
await applicationContext.start();


interface Props {
   children: ReactNode;
}

/**
 * Application Context Provider
 * Provides DI container to all child components
 */
export function ApplicationContext({ children }: Props) {
   return (
       <CoreApplicationContext value={{ container: applicationContext, registry: applicationContext, logger: null }}>
            {children}
   </CoreApplicationContext>
);
}

// ==================== COMPONENT ====================
// src/screens/products/ProductList.tsx
import {useInjectable} from '@minimaltech/ra-core-infra';
import {useQuery} from '@tanstack/react-query';
import {ProductApi, IProduct} from '@/application/services/product.api';

export function ProductList() {
    const productApi = useInjectable<ProductApi>({
        key: 'services.ProductApi',
    });

    const {data: products} = useQuery<IProduct[]>({
        queryKey: ['products'],
        queryFn: () => productApi.find({}),
    });

    return (
        <div>
            {products?.map(product => (
                <div key = {product.id} > {product.title} < /div>
            ))
}
    </div>
)
    ;
}

// ==================== TYPE AUGMENTATION ====================
// src/types/ra-core-infra.d.ts
declare module '@minimaltech/ra-core-infra' {
    interface IUseInjectableKeysOverrides {
        'services.ProductApi': true;
        'services.UserApi': true;
    }
}
```

## Next Steps

Now that you understand the basics of dependency injection in @ra-core-infra:

**Learn the Fundamentals:**
- **[DI Concepts & Venizia →](./overview)** - Deep dive into DI architecture
- **[Container Setup →](./container-setup)** - Set up your application
- **[Service Registration →](./service-registration)** - Register services and providers

**Implementation Guides:**
- **[Injection Patterns →](./injection-patterns)** - Master injection techniques
- **[Use Cases →](./use-cases)** - When to use DI vs alternatives

**Optimize Your Code:**
- **[Best Practices →](./best-practices)** - Guidelines and anti-patterns

**Tutorials:**
- **[First Application →](/getting-started/first-application)** - Build your first DI-powered app
- **[Configuration Guide →](/getting-started/configuration)** - Advanced configuration

**API Reference:**
- **[BaseRaApplication →](/api-reference/core/base-ra-application)** - Application class API
- **[useInjectable →](/api-reference/hooks/use-injectable)** - Injection hook API
- **[CoreBindings →](/api-reference/core/core-bindings)** - Standard binding keys

---

**Ready to dive deeper?** Start with [DI Concepts & Venizia →](./overview)

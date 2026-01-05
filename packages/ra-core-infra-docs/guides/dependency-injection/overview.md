# DI Concepts & Venizia

Deep dive into dependency injection principles and the Venizia DI container that powers @ra-core-infra.

## Dependency Injection Fundamentals

### What is a Dependency?

A **dependency** is any object or service that another class needs to function. When class A uses class B, we say "A depends on B".

```typescript
class EmailService {
  send(to: string, message: string) {
    // Send email logic
  }
}

class UserService {
  // EmailService is a dependency of UserService
  constructor(private emailService: EmailService) {}

  async registerUser(user: User) {
    await this.saveToDatabase(user);
    this.emailService.send(user.email, 'Welcome!');
  }
}
```

### Dependency Inversion Principle

The **Dependency Inversion Principle** states:
> "High-level modules should not depend on low-level modules. Both should depend on abstractions."

**Without Inversion** (bad):
```typescript
class UserService {
  private emailService = new EmailService();  // ❌ Depends on concrete class
  private database = new PostgresDatabase();  // ❌ Hard-coded implementation
}
```

**With Inversion** (good):
```typescript
interface IEmailService {
  send(to: string, message: string): Promise<void>;
}

interface IDatabase {
  save(entity: any): Promise<void>;
}

class UserService {
  constructor(
    private emailService: IEmailService,    // ✅ Depends on abstraction
    private database: IDatabase              // ✅ Depends on abstraction
  ) {}
}
```

Benefits:
- Easy to swap implementations (SendGrid → AWS SES)
- Testable with mocks
- Loose coupling

### Control Flow vs Dependency Flow

Understanding the difference between control flow and dependency flow is key to mastering DI:

**Control Flow** (who calls what):
```
UserController → UserService → EmailService → SMTP Client
```

**Dependency Flow** (who creates what):
```
Container → creates EmailService
Container → injects EmailService into UserService
Container → injects UserService into UserController
```

The **DI container inverts** the dependency flow - instead of components creating their dependencies, the container creates dependencies and injects them.

### Constructor Injection vs Property Injection

**Constructor Injection** (recommended):
```typescript
class UserService {
  constructor(
    @inject({ key: 'services.EmailService' })
    private emailService: EmailService  // Injected via constructor
  ) {}
}
```

Advantages:
- ✅ Dependencies are immutable
- ✅ Clear what's required
- ✅ Can't create instance without dependencies
- ✅ Type-safe

**Property Injection** (use sparingly):
```typescript
class UserService {
  @inject({ key: 'services.EmailService' })
  private emailService!: EmailService;  // Injected via property

  constructor() {
    // No constructor parameters
  }
}
```

Advantages:
- Avoids circular dependencies (rare cases)
- Optional dependencies

Disadvantages:
- ❌ Dependencies can be null
- ❌ Less type-safe
- ❌ Hidden dependencies

**Recommendation**: Always use constructor injection unless you have circular dependencies.

### Service Locator Pattern vs DI

Both patterns solve similar problems but differ in implementation:

**Service Locator Pattern**:
```typescript
class UserService {
  private emailService: EmailService;

  constructor() {
    // Component pulls dependencies from container
    this.emailService = ServiceLocator.get('EmailService');  // ❌ Anti-pattern
  }
}
```

**Dependency Injection Pattern**:
```typescript
class UserService {
  constructor(
    @inject({ key: 'services.EmailService' })
    private emailService: EmailService  // ✅ Dependencies pushed in
  ) {}
}
```

| Aspect | Service Locator | Dependency Injection |
|--------|----------------|---------------------|
| **Dependencies** | Hidden | Explicit |
| **Testability** | Harder to test | Easy to test |
| **Type Safety** | Runtime errors | Compile errors |
| **Coupling** | Tight coupling to locator | Loose coupling |

**Verdict**: Use DI, not Service Locator.

---

## Venizia DI Container

@ra-core-infra uses **[@venizia/ignis-inversion](https://github.com/minimaltech/venizia)** - a TypeScript-first dependency injection container.

### Container Architecture

The Venizia container consists of three core components:

```
┌──────────────────────────────────────────┐
│            Container                     │
│  - Stores bindings                       │
│  - Resolves dependencies                 │
│  - Manages lifecycles                    │
└──────────┬───────────────────────────────┘
           │
           ├── Binding
           │   - Key: string | symbol
           │   - Resolver: class | value | provider
           │   - Scope: singleton | transient
           │   - Tags: string[]
           │
           └── Metadata Registry
               - Stores @inject metadata
               - Parameter injection info
               - Property injection info
```

### Container Class

The `Container` class is the heart of the DI system:

```typescript
import { Container } from '@venizia/ignis-inversion';

// Create container
const container = new Container();

// Bind services
container.bind({ key: 'services.EmailService' })
  .toClass(EmailService)
  .setScope(BindingScopes.SINGLETON);

// Retrieve service
const emailService = container.get<EmailService>({
  key: 'services.EmailService'
});
```

**Container Methods**:

| Method | Purpose | Example |
|--------|---------|---------|
| `bind()` | Create binding | `container.bind({ key: 'foo' })` |
| `get()` | Retrieve instance | `container.get({ key: 'foo' })` |
| `unbind()` | Remove binding | `container.unbind({ key: 'foo' })` |
| `isBound()` | Check if bound | `container.isBound({ key: 'foo' })` |
| `findByTag()` | Find by tags | `container.findByTag('api')` |

### Binding Class

A `Binding` connects a key to an implementation:

```typescript
// Binding structure
interface Binding<T> {
  key: string | symbol;           // Unique identifier
  resolver: BindingResolver<T>;   // How to create instance
  scope: TBindingScope;           // Singleton vs transient
  tags: string[];                 // Optional categorization
}
```

**Creating Bindings**:
```typescript
// 1. Bind to class
container.bind({ key: 'services.EmailService' })
  .toClass(EmailService)
  .setScope(BindingScopes.SINGLETON)
  .setTags('service', 'email');

// 2. Bind to value
container.bind({ key: 'config.apiUrl' })
  .toValue('https://api.example.com');

// 3. Bind to provider (factory)
container.bind({ key: 'services.DynamicService' })
  .toProvider((container) => {
    const config = container.get({ key: 'config' });
    return new DynamicService(config);
  });
```

### Metadata System

Venizia uses `reflect-metadata` to store decorator information:

```typescript
import 'reflect-metadata';  // Must be imported first!

class UserService {
  constructor(
    @inject({ key: 'services.EmailService' })
    private emailService: EmailService  // Metadata stored here
  ) {}
}
```

**How it works**:
1. `@inject` decorator stores metadata about the parameter
2. Metadata includes: parameter index, binding key, optional flag
3. Container reads metadata when instantiating class
4. Container resolves dependencies and injects them

**Metadata Registry**:
```typescript
// Internal structure (simplified)
MetadataRegistry = {
  UserService: {
    constructorParams: [
      { index: 0, key: 'services.EmailService', isOptional: false }
    ],
    properties: []
  }
}
```

::: danger Critical
`reflect-metadata` must be imported **first** in your `main.tsx`:
```typescript
import 'reflect-metadata';  // Must be first!
import React from 'react';
// ... other imports
```
:::

### Reflection and Decorators

TypeScript decorators are used to mark injection points:

```typescript
/**
 * @inject decorator
 * Marks a constructor parameter or property for injection
 */
export const inject = (opts: {
  key: string | symbol;
  isOptional?: boolean
}) => {
  return (target: any, propertyName: string | symbol | undefined, parameterIndex?: number) => {
    // Store metadata for later resolution
    MetadataRegistry.setInjectMetadata({
      target,
      index: parameterIndex,
      metadata: { key: opts.key, isOptional: opts.isOptional ?? false },
    });
  };
};
```

**TypeScript Config Required**:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,    // Enable decorators
    "emitDecoratorMetadata": true      // Emit metadata
  }
}
```

---

## Core Concepts

### Bindings

A **binding** is a registration that maps a key to a resolver (how to create the instance).

**Anatomy of a Binding**:
```typescript
container.bind({ key: 'services.EmailService' })  // ← Binding Key
  .toClass(EmailService)                          // ← Resolver Type
  .setScope(BindingScopes.SINGLETON)              // ← Scope
  .setTags('service', 'communication');           // ← Tags (optional)
```

#### Binding Key

The key uniquely identifies a binding:

```typescript
// String key
container.bind({ key: 'services.UserService' })

// Symbol key (for privacy)
const PRIVATE_KEY = Symbol('internal.database');
container.bind({ key: PRIVATE_KEY })

// CoreBindings constants (recommended)
container.bind({ key: CoreBindings.DEFAULT_AUTH_PROVIDER })
```

**Best Practices**:
- Use namespaced strings: `'scope.ServiceName'`
- Use CoreBindings for framework services
- Use symbols for private/internal services

#### Binding Resolver

The resolver defines **how** to create instances:

**1. Class Resolver (toClass)**:
```typescript
container.bind({ key: 'services.EmailService' })
  .toClass(EmailService);  // Container will: new EmailService(dependencies...)
```

**2. Value Resolver (toValue)**:
```typescript
container.bind({ key: 'config.apiUrl' })
  .toValue('https://api.example.com');  // Container returns this value directly
```

**3. Provider Resolver (toProvider)**:
```typescript
container.bind({ key: 'services.DatabaseConnection' })
  .toProvider((container) => {
    const config = container.get({ key: 'config.database' });
    return new DatabaseConnection(config.url, config.port);
  });
```

#### Binding Scope

Scope determines instance lifecycle:

```typescript
// SINGLETON - One instance for entire application
container.bind({ key: 'services.EmailService' })
  .toClass(EmailService)
  .setScope(BindingScopes.SINGLETON);

// TRANSIENT - New instance every time (default)
container.bind({ key: 'services.TempService' })
  .toClass(TempService)
  .setScope(BindingScopes.TRANSIENT);
```

**Scope Comparison**:
```typescript
// Singleton - same instance
const email1 = container.get({ key: 'services.EmailService' });
const email2 = container.get({ key: 'services.EmailService' });
console.log(email1 === email2);  // true ✅

// Transient - different instances
const temp1 = container.get({ key: 'services.TempService' });
const temp2 = container.get({ key: 'services.TempService' });
console.log(temp1 === temp2);  // false ✅
```

### Container Hierarchy

Containers can have parent-child relationships:

```typescript
// Parent container
const parentContainer = new Container();
parentContainer.bind({ key: 'config.global' })
  .toValue({ env: 'production' });

// Child container
const childContainer = new Container(parentContainer);
childContainer.bind({ key: 'config.local' })
  .toValue({ port: 3000 });

// Child can access parent bindings
const global = childContainer.get({ key: 'config.global' });  // ✅ Works
const local = childContainer.get({ key: 'config.local' });    // ✅ Works

// Parent cannot access child bindings
const local2 = parentContainer.get({ key: 'config.local' });  // ❌ Error
```

**Resolution Order**:
1. Check current container
2. If not found, check parent container
3. If not found, check grandparent container
4. Continue up the chain
5. Throw error if not found

**Use Cases**:
- Request-scoped containers (per-request bindings)
- Test containers (override parent bindings)
- Module isolation

### Decorators

The `@inject` decorator marks dependencies for injection:

**Basic Usage**:
```typescript
class UserService {
  constructor(
    @inject({ key: 'services.EmailService' })
    private emailService: EmailService
  ) {}
}
```

**Multiple Dependencies**:
```typescript
class OrderService {
  constructor(
    @inject({ key: 'services.UserService' })
    private userService: UserService,

    @inject({ key: 'services.EmailService' })
    private emailService: EmailService,

    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    private dataProvider: IDataProvider
  ) {}
}
```

**Optional Dependencies**:
```typescript
class AnalyticsService {
  constructor(
    @inject({ key: 'services.Logger', isOptional: true })
    private logger?: Logger  // May be undefined
  ) {}

  log(message: string) {
    this.logger?.info(message);  // Safe optional chaining
  }
}
```

**Property Injection**:
```typescript
class ReportService {
  @inject({ key: 'services.EmailService' })
  private emailService!: EmailService;  // Definite assignment assertion

  constructor() {
    // No constructor parameters
  }

  sendReport() {
    this.emailService.send(/* ... */);
  }
}
```

### Scopes

Scopes control instance lifecycle and caching:

#### SINGLETON Scope

One instance shared across the entire application:

```typescript
container.bind({ key: 'services.DatabaseConnection' })
  .toClass(DatabaseConnection)
  .setScope(BindingScopes.SINGLETON);

// Always returns the same instance
const db1 = container.get({ key: 'services.DatabaseConnection' });
const db2 = container.get({ key: 'services.DatabaseConnection' });
console.log(db1 === db2);  // true
```

**When to Use**:
- Stateless services (APIs, utilities)
- Expensive-to-create services (database connections)
- Shared resources (loggers, caches)

**Internal Implementation**:
```typescript
class Binding<T> {
  private cachedInstance?: T;

  getValue(container: Container): T {
    if (this.scope === BindingScopes.SINGLETON && this.cachedInstance !== undefined) {
      return this.cachedInstance;  // Return cached
    }

    const instance = this.resolve(container);  // Create new

    if (this.scope === BindingScopes.SINGLETON) {
      this.cachedInstance = instance;  // Cache for next time
    }

    return instance;
  }
}
```

#### TRANSIENT Scope

New instance created every time:

```typescript
container.bind({ key: 'services.RequestContext' })
  .toClass(RequestContext)
  .setScope(BindingScopes.TRANSIENT);

// Different instances every time
const ctx1 = container.get({ key: 'services.RequestContext' });
const ctx2 = container.get({ key: 'services.RequestContext' });
console.log(ctx1 === ctx2);  // false
```

**When to Use**:
- Stateful services (per-request context)
- Services with mutable state
- Temporary/disposable objects

#### Scope Comparison Table

| Aspect | SINGLETON | TRANSIENT |
|--------|-----------|-----------|
| **Instance Count** | 1 per container | New every time |
| **Memory** | Efficient (reused) | Higher (new objects) |
| **State** | Shared state | Isolated state |
| **Thread Safety** | Must be thread-safe | Naturally isolated |
| **Use For** | Services, APIs, utilities | Contexts, requests |

---

## Type Safety

Venizia provides excellent TypeScript integration for type-safe dependency injection.

### TypeScript Integration

**Type Inference**:
```typescript
// Container knows the type
container.bind({ key: 'services.EmailService' })
  .toClass(EmailService);

// Type is inferred automatically
const emailService = container.get<EmailService>({
  key: 'services.EmailService'
});
// emailService is typed as EmailService ✅
```

**Generic Constraints**:
```typescript
interface IGenericService<T> {
  process(data: T): Promise<T>;
}

class UserService implements IGenericService<User> {
  async process(user: User): Promise<User> {
    // ...
  }
}

// Type-safe registration
container.bind<IGenericService<User>>({ key: 'services.UserService' })
  .toClass(UserService);

// Type-safe retrieval
const userService = container.get<IGenericService<User>>({
  key: 'services.UserService'
});
```

### Type Augmentation Patterns

Type augmentation enables autocomplete for custom service keys:

**Step 1: Define Services**:
```typescript
// src/application/services/user.service.ts
export class UserService {
  // ...
}

// src/application/services/product.api.ts
export class ProductApi {
  // ...
}
```

**Step 2: Augment Type**:
```typescript
// src/types/ra-core-infra.d.ts
import 'reflect-metadata';

declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    // Add your custom keys here
    'services.UserService': true;
    'services.ProductApi': true;
    'services.OrderService': true;
  }
}
```

**Step 3: Enjoy Autocomplete**:
```typescript
// TypeScript now knows about these keys!
useInjectable({ key: 'services.' })  // IDE suggests: UserService, ProductApi, OrderService
```

### CoreBindings Type System

CoreBindings provides type-safe constants for framework services:

```typescript
export class CoreBindings {
  static readonly APPLICATION_INSTANCE = '@app/application/instance';
  static readonly DEFAULT_AUTH_PROVIDER = '@app/application/auth/default';
  static readonly DEFAULT_I18N_PROVIDER = '@app/application/i18n/default';
  static readonly DEFAULT_REST_DATA_PROVIDER = '@app/application/data/rest/default';
  static readonly AUTH_PROVIDER_OPTIONS = '@app/application/options/auth';
  static readonly DEFAULT_AUTH_SERVICE = '@app/application/service/auth/default';
  static readonly REST_DATA_PROVIDER_OPTIONS = '@app/application/options/rest/data';
  static readonly I18N_PROVIDER_OPTIONS = '@app/application/options/i18n';
}
```

**Type-Safe Usage**:
```typescript
// ✅ Type-safe (autocomplete + compile-time checking)
const dataProvider = useInjectable<IDataProvider>({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER
});

// ❌ Not type-safe (typos caught only at runtime)
const dataProvider = useInjectable<IDataProvider>({
  key: '@app/application/data/rest/defaul'  // Typo!
});
```

**Type-Safe Binding Keys**:
```typescript
type TUseInjectableKeysDefault = Extract<ValueOf<typeof CoreBindings>, string>;
// Result: '@app/application/instance' | '@app/application/auth/default' | ...

type TUseInjectableKeys = TUseInjectableKeysDefault | keyof IUseInjectableKeysOverrides;
// Result: CoreBindings values + custom keys from augmentation
```

---

## Advanced Topics

### Circular Dependencies

Circular dependencies occur when A depends on B and B depends on A:

```typescript
// ❌ Circular dependency
class ServiceA {
  constructor(
    @inject({ key: 'services.ServiceB' })
    private serviceB: ServiceB  // ServiceA needs ServiceB
  ) {}
}

class ServiceB {
  constructor(
    @inject({ key: 'services.ServiceA' })
    private serviceA: ServiceA  // ServiceB needs ServiceA
  ) {}
}
```

**Solutions**:

**1. Redesign** (best):
```typescript
// Extract shared logic to a third service
class SharedService {
  sharedLogic() { /* ... */ }
}

class ServiceA {
  constructor(
    @inject({ key: 'services.SharedService' })
    private shared: SharedService
  ) {}
}

class ServiceB {
  constructor(
    @inject({ key: 'services.SharedService' })
    private shared: SharedService
  ) {}
}
```

**2. Property Injection** (if unavoidable):
```typescript
class ServiceA {
  @inject({ key: 'services.ServiceB' })
  private serviceB!: ServiceB;

  constructor() {}
}

class ServiceB {
  constructor(
    @inject({ key: 'services.ServiceA' })
    private serviceA: ServiceA
  ) {}
}
```

### Lazy Initialization

Use providers for lazy/expensive initialization:

```typescript
// Eager - created immediately
container.bind({ key: 'services.DatabaseConnection' })
  .toValue(new DatabaseConnection('localhost', 5432));  // ❌ Created now

// Lazy - created when first requested
container.bind({ key: 'services.DatabaseConnection' })
  .toProvider((container) => {
    console.log('Creating database connection...');
    return new DatabaseConnection('localhost', 5432);  // ✅ Created on first get()
  });
```

### Tags and Discovery

Use tags to categorize and discover bindings:

```typescript
// Register with tags
container.bind({ key: 'services.EmailService' })
  .toClass(EmailService)
  .setTags('service', 'communication', 'external');

container.bind({ key: 'services.SmsService' })
  .toClass(SmsService)
  .setTags('service', 'communication', 'external');

// Find all communication services
const communicationServices = container.findByTag('communication');
// Returns: [EmailService, SmsService]
```

---

## Related Topics

- **[Container Setup →](./container-setup)** - Set up your application container
- **[Service Registration →](./service-registration)** - Register services and bindings
- **[Injection Patterns →](./injection-patterns)** - Master injection techniques
- **[Best Practices →](./best-practices)** - Design principles and anti-patterns

## See Also

- **[BaseRaApplication →](/api-reference/core/base-ra-application)** - Container initialization
- **[useInjectable →](/api-reference/hooks/use-injectable)** - Component injection hook
- **[CoreBindings →](/api-reference/core/core-bindings)** - Framework binding keys

---

**Ready to set up your container?** Continue with [Container Setup →](./container-setup)

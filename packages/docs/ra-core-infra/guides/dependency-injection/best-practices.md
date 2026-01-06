# Dependency Injection Best Practices

Guidelines, patterns, and anti-patterns for effective dependency injection in @ra-core-infra.

## Design Principles

### ✅ DO: Constructor Injection

**Use constructor injection as the default pattern**:

```typescript
// ✅ GOOD - Constructor injection
export class OrderService {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    private dataProvider: IDataProvider,

    @inject({ key: 'services.UserService' })
    private userService: UserService
  ) {}
}
```

```typescript
// ❌ BAD - Property injection (only for circular dependencies)
export class OrderService {
  @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
  private dataProvider!: IDataProvider;

  @inject({ key: 'services.UserService' })
  private userService!: UserService;
}
```

**Why?**
- Dependencies are immutable (can't be changed after construction)
- Explicit and clear what the service needs
- Can't create instance without dependencies
- Type-safe (TypeScript enforces required dependencies)
- Easy to test (mock in constructor)

---

### ✅ DO: Single Responsibility

**Each service should have one clear purpose**:

```typescript
// ✅ GOOD - Single responsibility
export class EmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    // Send email
  }
}

export class UserNotificationService {
  constructor(
    @inject({ key: 'services.EmailService' })
    private emailService: EmailService
  ) {}

  async notifyUserRegistration(user: IUser): Promise<void> {
    await this.emailService.send(
      user.email,
      'Welcome!',
      'Thanks for registering'
    );
  }
}
```

```typescript
// ❌ BAD - Multiple responsibilities
export class UserService {
  async createUser(data: any): Promise<IUser> { /* ... */ }
  async sendEmail(to: string, subject: string): Promise<void> { /* ... */ }
  async logAnalytics(event: string): Promise<void> { /* ... */ }
  async validatePermissions(user: IUser): boolean { /* ... */ }
}
```

**Why?**
- Easier to understand and maintain
- Easier to test
- Better reusability
- Clearer dependency graph

---

### ✅ DO: Interface-Based Design

**Depend on abstractions (interfaces), not concrete implementations**:

```typescript
// ✅ GOOD - Depend on interface
export interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class OrderService {
  constructor(
    @inject({ key: 'services.EmailService' })
    private emailService: IEmailService  // Interface, not concrete class
  ) {}
}

// Can swap implementations
export class SmtpEmailService implements IEmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    // SMTP implementation
  }
}

export class SendGridEmailService implements IEmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    // SendGrid implementation
  }
}
```

**Why?**
- Easy to swap implementations
- Follows Dependency Inversion Principle
- Better for testing (mock interfaces)
- Decoupled architecture

---

### ✅ DO: Singleton for Stateless Services

**Use SINGLETON scope for services that don't hold state**:

```typescript
// ✅ GOOD - Singleton for stateless API service
bindContext(): void {
  this.bind({ key: 'services.ProductApi' })
    .toClass(ProductApi)
    .setScope(BindingScopes.SINGLETON);  // One instance, reused
}

export class ProductApi extends BaseCrudService<IProduct> {
  // No instance state, just methods
  async find(): Promise<IProduct[]> { /* ... */ }
  async findById(id: string): Promise<IProduct> { /* ... */ }
}
```

```typescript
// ❌ BAD - Transient for frequently-used service (creates many instances)
bindContext(): void {
  this.bind({ key: 'services.ProductApi' })
    .toClass(ProductApi)
    .setScope(BindingScopes.TRANSIENT);  // New instance every time
}
```

**When to use SINGLETON**:
- API services
- Providers (auth, data, i18n)
- Utilities
- Services without instance state

**When to use TRANSIENT**:
- Services with per-request state
- Commands/handlers
- Temporary services

---

### ❌ DON'T: Service Locator in Components

**Avoid direct container access in React components**:

```typescript
// ❌ BAD - Direct container access
export function ProductList() {
  const container = useApplicationContext();
  const productApi = container.get({ key: 'services.ProductApi' });  // Avoid this!

  // ...
}
```

```typescript
// ✅ GOOD - Use useInjectable hook
export function ProductList() {
  const productApi = useInjectable<ProductApi>({
    key: 'services.ProductApi'
  });

  // ...
}
```

**Why?**
- `useInjectable` provides type safety
- Clearer intent
- Consistent pattern
- Better for testing

---

### ❌ DON'T: Circular Dependencies

**Avoid services depending on each other**:

```typescript
// ❌ BAD - Circular dependency
export class ServiceA {
  constructor(
    @inject({ key: 'services.ServiceB' })
    private serviceB: ServiceB
  ) {}
}

export class ServiceB {
  constructor(
    @inject({ key: 'services.ServiceA' })
    private serviceA: ServiceA
  ) {}
}
```

```typescript
// ✅ GOOD - Extract shared dependency
export class SharedService {
  doSomething(): void { /* ... */ }
}

export class ServiceA {
  constructor(
    @inject({ key: 'services.SharedService' })
    private shared: SharedService
  ) {}
}

export class ServiceB {
  constructor(
    @inject({ key: 'services.SharedService' })
    private shared: SharedService
  ) {}
}
```

**If unavoidable**, use property injection on ONE side:
```typescript
export class ServiceA {
  @inject({ key: 'services.ServiceB' })  // Property injection breaks cycle
  private serviceB!: ServiceB;
}

export class ServiceB {
  constructor(
    @inject({ key: 'services.ServiceA' })  // Constructor injection
    private serviceA: ServiceA
  ) {}
}
```

**Why avoid?**
- Hard to test
- Hard to understand
- Usually indicates poor design
- Can cause runtime errors

---

## Naming Conventions

### Binding Keys

**Use consistent, namespaced keys**:

```typescript
// ✅ GOOD - Namespaced pattern
'services.UserService'
'services.ProductApi'
'repositories.UserRepository'
'providers.CustomAuthProvider'
'config.api'
'config.features'
```

```typescript
// ❌ BAD - Inconsistent naming
'UserService'  // No namespace
'product-api'  // Wrong case
'config_api'   // Wrong separator
```

**Pattern**: `scope.ClassName` or `scope.configName`

**Scopes**:
- `services.*` - Business logic services
- `repositories.*` - Data access
- `providers.*` - Framework providers
- `config.*` - Configuration objects
- Custom scopes as needed

---

### Service Classes

**Use descriptive names with suffixes**:

```typescript
// ✅ GOOD - Clear purpose
export class ProductApi extends BaseCrudService<IProduct> { }
export class UserService { }
export class EmailService { }
export class CustomAuthProvider extends BaseProvider<IAuthProvider> { }
export class UserRepository { }
```

**Common suffixes**:
- `*Api` - API services (extends BaseCrudService)
- `*Service` - Business logic services
- `*Provider` - Framework providers (extends BaseProvider)
- `*Repository` - Data access layer
- `*Factory` - Factory pattern services

---

### Type Augmentation

**Enable autocomplete for your custom keys**:

```typescript
// src/types/ra-core-infra.d.ts
import 'reflect-metadata';

declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    // Services
    'services.UserService': true;
    'services.ProductApi': true;
    'services.OrderApi': true;
    'services.EmailService': true;

    // Repositories
    'repositories.UserRepository': true;

    // Config
    'config.features': true;
    'config.api': true;
  }
}
```

**Result**: IDE autocomplete when using `useInjectable`:
```typescript
const userService = useInjectable({
  key: 'services.'  // ← IDE suggests: UserService, ProductApi, OrderApi, EmailService
});
```

---

## Testing Best Practices

### Mock Injection

**Override bindings for testing**:

```typescript
// test/services/order.service.test.ts
import { Container, BindingScopes } from '@venizia/ignis-inversion';
import { OrderService } from '@/application/services/order.service';
import { CoreBindings } from '@minimaltech/ra-core-infra';

describe('OrderService', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();

    // Mock data provider
    const mockDataProvider = {
      create: jest.fn().mockResolvedValue({ id: '1', total: 100 }),
      getOne: jest.fn().mockResolvedValue({ id: '1' }),
    };

    container.bind({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
      .toValue(mockDataProvider);

    // Mock user service
    const mockUserService = {
      getUser: jest.fn().mockResolvedValue({
        id: '123',
        email: 'user@example.com'
      }),
    };

    container.bind({ key: 'services.UserService' })
      .toValue(mockUserService);

    // Register service under test
    container.bind({ key: 'services.OrderService' })
      .toClass(OrderService)
      .setScope(BindingScopes.TRANSIENT);
  });

  it('should create order', async () => {
    const orderService = container.get<OrderService>({
      key: 'services.OrderService'
    });

    const order = await orderService.createOrder({
      userId: '123',
      items: [],
      total: 100,
    });

    expect(order.id).toBe('1');
  });
});
```

**Benefits**:
- Isolated tests
- No real API calls
- Full control over dependencies
- Fast execution

---

### Test Utilities

**Create test helpers for common setups**:

```typescript
// test/utils/test-container.ts
import { Container } from '@venizia/ignis-inversion';
import { CoreBindings } from '@minimaltech/ra-core-infra';

export function createTestContainer(): Container {
  const container = new Container();

  // Default mocks
  container.bind({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    .toValue({
      send: jest.fn(),
      getOne: jest.fn(),
      getList: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    });

  return container;
}

// Usage
describe('MyService', () => {
  let container: Container;

  beforeEach(() => {
    container = createTestContainer();
    // Add specific test setup
  });
});
```

---

## Performance Optimization

### Singleton vs Transient

**Choose the right scope for performance**:

```typescript
// ✅ GOOD - Singleton for expensive initialization
export class DatabaseConnectionService {
  private connection: Connection;

  constructor(
    @inject({ key: 'config.database' })
    private config: IDatabaseConfig
  ) {
    // Expensive: only happens once
    this.connection = createConnection(config);
  }
}

bindContext(): void {
  this.bind({ key: 'services.DatabaseConnection' })
    .toClass(DatabaseConnectionService)
    .setScope(BindingScopes.SINGLETON);  // Reuse single instance
}
```

**Performance Comparison**:
| Scope | Instance Creation | Memory | Use Case |
|-------|------------------|--------|----------|
| **SINGLETON** | Once | Low (1 instance) | Services, providers, utilities |
| **TRANSIENT** | Every `get()` | Higher (N instances) | Per-request state, commands |

---

### Lazy Initialization

**Use Provider pattern for expensive setup**:

```typescript
// ✅ GOOD - Lazy initialization
bindContext(): void {
  this.bind({ key: 'services.DatabaseConnection' })
    .toProvider((container) => {
      console.log('Creating database connection...');
      const config = container.get({ key: 'config.database' });
      return new DatabaseConnection(config);
    });
}

// Connection only created when first requested
const db = container.get({ key: 'services.DatabaseConnection' });  // Logs: "Creating..."
const db2 = container.get({ key: 'services.DatabaseConnection' }); // No log (cached if SINGLETON)
```

**Benefits**:
- Defer expensive operations
- Faster application startup
- Only initialize what's needed

---

## Common Pitfalls

### Pitfall 1: Missing reflect-metadata

**Error**: Decorators don't work, `Cannot read property 'design:paramtypes' of undefined`

```typescript
// ❌ BAD - Missing reflect-metadata
import { RaApplication } from './application';

const app = new RaApplication();
await app.start();  // Error: reflect-metadata not imported
```

```typescript
// ✅ GOOD - Import reflect-metadata first
import 'reflect-metadata';  // MUST be first import
import { RaApplication } from './application';

const app = new RaApplication();
await app.start();
```

**Solution**: Add `import 'reflect-metadata'` as the **very first import** in your entry file (e.g., `main.tsx`).

---

### Pitfall 2: Binding Not Found

**Error**: `No matching bindings found for key: services.UserService`

**Causes**:
1. Typo in key
2. Service not registered
3. Wrong scope/namespace

```typescript
// ❌ BAD - Typo in key
const userService = useInjectable({ key: 'services.UserServcie' });  // Typo!

// ✅ GOOD - Correct key
const userService = useInjectable({ key: 'services.UserService' });
```

**Solution**: Use type augmentation for autocomplete to catch typos:
```typescript
declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    'services.UserService': true;  // Now get autocomplete
  }
}
```

---

### Pitfall 3: Scope Confusion

**Problem**: Creating new instances when you expected a singleton

```typescript
// Registration
bindContext(): void {
  this.bind({ key: 'services.UserService' })
    .toClass(UserService);
    // ⚠️ No .setScope() - defaults to TRANSIENT!
}

// Usage
const user1 = container.get({ key: 'services.UserService' });
const user2 = container.get({ key: 'services.UserService' });
console.log(user1 === user2);  // false - different instances!
```

```typescript
// ✅ GOOD - Explicit SINGLETON scope
bindContext(): void {
  this.bind({ key: 'services.UserService' })
    .toClass(UserService)
    .setScope(BindingScopes.SINGLETON);  // Explicit!
}

const user1 = container.get({ key: 'services.UserService' });
const user2 = container.get({ key: 'services.UserService' });
console.log(user1 === user2);  // true - same instance
```

**Solution**: Always explicitly set scope with `.setScope()`.

---

### Pitfall 4: Injecting React State

**Problem**: Trying to inject component state through DI

```typescript
// ❌ BAD - Don't inject React state
export class ThemeService {
  private theme: string = 'light';

  setTheme(theme: string): void {
    this.theme = theme;
    // Problem: React components won't re-render!
  }
}
```

```typescript
// ✅ GOOD - Use React Context for UI state
export const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}>({ theme: 'light', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Remember**:
- **DI**: Services, APIs, business logic
- **React Context**: UI state, theme, component data

---

## Migration Guide

### From React Context to DI

**When to migrate**:
- Service is used across many components
- Service has complex dependencies
- Service needs testing in isolation
- Service contains business logic (not UI state)

**Before (React Context)**:
```typescript
const DataContext = createContext<IDataProvider | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const dataProvider = useMemo(() => createDataProvider(), []);
  return (
    <DataContext.Provider value={dataProvider}>
      {children}
    </DataContext.Provider>
  );
}

// Usage
function ProductList() {
  const dataProvider = useContext(DataContext);
  // ...
}
```

**After (DI)**:
```typescript
// Application
bindContext(): void {
  this.bind({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    .toProvider(() => createDataProvider())
    .setScope(BindingScopes.SINGLETON);
}

// Usage
function ProductList() {
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER
  });
  // ...
}
```

**Benefits of DI**:
- Services can inject other services
- Easy to test with mocks
- Type-safe
- Application-wide availability

---

### Gradual Adoption

**You can mix DI with other patterns**:

```typescript
export function App() {
  // DI for services
  const productApi = useInjectable<ProductApi>({
    key: 'services.ProductApi'
  });

  // React state for UI
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // React Query for data fetching
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.find({}),
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {/* App content */}
    </ThemeContext.Provider>
  );
}
```

**Hybrid approach**:
- DI for business logic and services
- React Context for UI state
- React Query for server state
- Zustand/Redux for global app state

---

## Quick Reference

### DO's

- ✅ Use constructor injection by default
- ✅ Single responsibility per service
- ✅ Depend on interfaces, not implementations
- ✅ SINGLETON scope for stateless services
- ✅ Use `useInjectable` in components
- ✅ Namespace binding keys (`services.*`)
- ✅ Type augmentation for autocomplete
- ✅ Mock dependencies in tests
- ✅ Import `reflect-metadata` first

### DON'Ts

- ❌ Avoid property injection (except circular deps)
- ❌ Avoid circular dependencies
- ❌ Don't use service locator in components
- ❌ Don't inject React state through DI
- ❌ Don't inject simple utilities
- ❌ Don't forget `.setScope()`
- ❌ Don't use DI for constants

---

## Related Topics

- [Service Registration →](./service-registration) - How to register services
- [Injection Patterns →](./injection-patterns) - How to inject dependencies
- [Use Cases →](./use-cases) - When to use DI vs alternatives

## See Also

- [BaseRaApplication →](/api-reference/core/base-ra-application) - Application API
- [useInjectable →](/api-reference/hooks/use-injectable) - Injection hook
- [CoreBindings →](/api-reference/core/core-bindings) - Standard keys

---

**Congratulations!** You've completed the Dependency Injection guide. You now understand:
- How to design services with DI
- Best practices and anti-patterns
- Testing strategies
- Performance optimization
- Common pitfalls and solutions

**Next Steps**:
- [First Application →](/getting-started/first-application) - Build your first app
- [API Reference →](/api-reference/core/core-bindings) - Explore APIs

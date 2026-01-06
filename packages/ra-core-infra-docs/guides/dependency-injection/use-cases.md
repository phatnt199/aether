# Dependency Injection Use Cases

Learn when to use dependency injection versus alternatives, with real-world examples from @ra-core-infra.

## When to Use DI

### ✅ Perfect for Dependency Injection

**1. Services with External Dependencies**

Services that need other services or providers to function:

```typescript
export class OrderService {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    private dataProvider: IDataProvider,

    @inject({ key: 'services.UserService' })
    private userService: UserService,

    @inject({ key: 'services.EmailService' })
    private emailService: EmailService
  ) {}

  async createOrder(orderData: IOrderInput): Promise<IOrder> {
    // 1. Validate user exists
    const user = await this.userService.getUser(orderData.userId);

    // 2. Create order
    const order = await this.dataProvider.create('orders', {
      data: orderData
    });

    // 3. Send confirmation
    await this.emailService.sendOrderConfirmation(user.email, order);

    return order;
  }
}
```

**Why DI?**
- Easy to mock dependencies in tests
- Can swap implementations without code changes
- Clear dependency relationships
- Type-safe

**2. Framework Providers**

Auth, data, and i18n providers that need configuration:

```typescript
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
      getPermissions: () => this.getPermissions(),
    };
  }

  private async login(params: any): Promise<void> {
    const response = await this.dataProvider.send<IAuthResponse>({
      path: this.options.paths.signIn,
      method: 'POST',
      body: params,
    });

    localStorage.setItem('token', response.token);
  }
}
```

**Why DI?**
- Configuration injected from application
- Framework integration
- Lazy initialization via Provider pattern
- Consistent with @ra-core-infra architecture

**3. Cross-Cutting Concerns**

Logging, analytics, error tracking that many services need:

```typescript
export class LoggingService {
  constructor(
    @inject({ key: 'config.logging' })
    private config: ILoggingConfig
  ) {}

  info(message: string, context?: any): void {
    if (this.config.level === 'info' || this.config.level === 'debug') {
      console.log(`[INFO] ${message}`, context);
    }
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error);
    if (this.config.sendToServer) {
      this.sendErrorToServer(message, error);
    }
  }
}

// Used by many services
export class ProductApi extends BaseCrudService<IProduct> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected dataProvider: IDataProvider,

    @inject({ key: 'services.LoggingService' })
    private logger: LoggingService
  ) {
    super({ scope: 'ProductApi', dataProvider, serviceOptions: { basePath: '/products' } });
  }

  async find(): Promise<IProduct[]> {
    this.logger.info('Fetching products');
    try {
      return await super.find();
    } catch (error) {
      this.logger.error('Failed to fetch products', error as Error);
      throw error;
    }
  }
}
```

**Why DI?**
- Single logger instance shared across app
- Centralized configuration
- Easy to disable in tests
- Consistent logging behavior

**4. Configuration Management**

Environment-specific or feature-flag-driven configuration:

```typescript
// Application
bindContext(): void {
  const isProd = import.meta.env.MODE === 'production';

  this.bind({ key: 'config.features' })
    .toValue({
      analytics: isProd,
      debugMode: !isProd,
      maxRetries: isProd ? 3 : 0,
    });

  this.bind({ key: 'config.api' })
    .toValue({
      baseUrl: isProd ? 'https://api.production.com' : 'http://localhost:3000',
      timeout: isProd ? 30000 : 5000,
    });
}

// Service using config
export class ApiClient {
  constructor(
    @inject({ key: 'config.api' })
    private config: IApiConfig
  ) {}

  async request(path: string): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        signal: controller.signal,
      });
      return response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

**Why DI?**
- Environment-specific config injected at runtime
- No hard-coded values
- Easy to test with different configurations
- Type-safe configuration objects

**5. Testing**

Mock dependencies for isolated unit tests:

```typescript
// Production
const app = new RaApplication();
await app.start();

// Testing
const testApp = new RaApplication();
testApp.bind({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
  .toValue(mockDataProvider);  // Override with mock

testApp.bind({ key: 'services.EmailService' })
  .toValue(mockEmailService);  // No emails sent in tests

const container = testApp.getContainer();
const orderService = container.get<OrderService>({ key: 'services.OrderService' });

// Test with mocks
await orderService.createOrder({ userId: '123', items: [] });
expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalled();
```

**Why DI?**
- Easy to replace real services with mocks
- Test in isolation
- No need to mock global imports
- Consistent test setup

---

## When to Avoid DI

### ⚠️ Consider Alternatives

**1. Simple Utility Functions**

Pure functions with no dependencies - use direct imports:

```typescript
// ❌ DON'T use DI for utilities
export class MathUtils {
  add(a: number, b: number): number {
    return a + b;
  }
}

// ✅ DO use plain functions
export function add(a: number, b: number): number {
  return a + b;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Usage - direct import
import { formatCurrency } from '@/utils/format';
const price = formatCurrency(19.99);
```

**Why No DI?**
- No dependencies to inject
- Stateless, pure functions
- Tree-shakable
- Simpler to use

**2. React State Management**

Component state, context, and hooks - use React patterns:

```typescript
// ❌ DON'T inject component state
export class ThemeService {
  private theme: string = 'light';

  setTheme(theme: string) {
    this.theme = theme;
  }
}

// ✅ DO use React state/context
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Usage
function MyComponent() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <button onClick={() => setTheme('dark')}>Dark Mode</button>;
}
```

**Why No DI?**
- React state belongs to component tree
- Re-renders on state change
- Built-in React patterns
- Better performance

**3. Component-Specific Logic**

Logic tightly coupled to a component:

```typescript
// ❌ DON'T create service for component logic
export class ProductListService {
  filterProducts(products: IProduct[], query: string): IProduct[] {
    return products.filter(p => p.title.includes(query));
  }
}

// ✅ DO use component hooks or helpers
export function ProductList() {
  const [query, setQuery] = useState('');
  const productApi = useInjectable<ProductApi>({ key: 'services.ProductApi' });
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.find({}),
  });

  // Component logic
  const filtered = products?.filter(p => p.title.includes(query)) ?? [];

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {filtered.map(product => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
```

**Why No DI?**
- Logic is specific to this component
- No reuse across app
- Simpler to inline
- Better co-location

**4. Constants and Enums**

Static values - use direct exports:

```typescript
// ❌ DON'T inject constants
this.bind({ key: 'config.APP_NAME' }).toValue('My Admin App');

// ✅ DO export constants
export const APP_NAME = 'My Admin App';
export const API_VERSION = 'v1';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

// Usage
import { APP_NAME, UserRole } from '@/constants';
console.log(APP_NAME);
```

**Why No DI?**
- Never change at runtime
- No dependencies
- Simpler imports
- Better tree-shaking

---

## Decision Guide

Use this table to decide when to use DI:

| Scenario | Use DI? | Alternative | Example |
|----------|---------|-------------|---------|
| **Service with dependencies** | ✅ Yes | N/A | `OrderService` needs `UserService`, `EmailService` |
| **Framework providers** | ✅ Yes | N/A | `AuthProvider`, `DataProvider`, `I18nProvider` |
| **Cross-cutting concerns** | ✅ Yes | N/A | Logging, analytics, error tracking |
| **Configuration** | ✅ Yes | N/A | API URLs, feature flags, environment config |
| **Testing** | ✅ Yes | N/A | Mock dependencies for isolated tests |
| **Pure functions** | ❌ No | Direct export | `formatCurrency()`, `validateEmail()` |
| **React state** | ❌ No | useState/Context | Theme, UI state, form state |
| **Component logic** | ❌ No | Inline/hooks | Filtering, sorting, local calculations |
| **Constants** | ❌ No | Direct export | `APP_NAME`, `API_VERSION`, enums |

---

## Common Use Cases

### Use Case 1: API Service Layer

**Scenario**: Create a service layer for API calls with authentication

```typescript
// src/application/services/product.api.ts
import { BaseCrudService, CoreBindings, IDataProvider } from '@minimaltech/ra-core-infra';
import { inject } from '@venizia/ignis-inversion';

export interface IProduct {
  id: number;
  title: string;
  price: number;
  description: string;
}

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

  // Custom method beyond CRUD
  async getFeatured(): Promise<IProduct[]> {
    return this.dataProvider.send({
      path: '/products/featured',
      method: 'GET',
    });
  }
}

// Registration
bindContext(): void {
  this.service(ProductApi);
}

// Component usage
export function FeaturedProducts() {
  const productApi = useInjectable<ProductApi>({ key: 'services.ProductApi' });
  const { data } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productApi.getFeatured(),
  });

  return <div>{/* Render featured products */}</div>;
}
```

**Benefits**:
- Centralized API logic
- Easy to test with mock DataProvider
- Type-safe
- Reusable across components

---

### Use Case 2: Authentication Flow

**Scenario**: Implement authentication with token management

```typescript
// src/application/providers/auth.provider.ts
import { BaseProvider, CoreBindings, IDataProvider } from '@minimaltech/ra-core-infra';
import { inject } from '@venizia/ignis-inversion';

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
      getPermissions: () => this.getPermissions(),
    };
  }

  private async login(params: { username: string; password: string }): Promise<void> {
    const response = await this.dataProvider.send<{ token: string; user: any }>({
      path: this.options.paths.signIn,
      method: 'POST',
      body: params,
    });

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  private async checkAuth(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Verify token with server
    await this.dataProvider.send({
      path: this.options.paths.checkAuth,
      method: 'GET',
    });
  }

  private async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  private async getPermissions(): Promise<string[]> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.permissions || [];
  }
}

// Registration
bindContext(): void {
  this.bind({ key: CoreBindings.AUTH_PROVIDER_OPTIONS })
    .toValue({
      paths: {
        signIn: '/api/auth/login',
        checkAuth: '/api/auth/verify',
      },
      endpoints: {
        afterLogin: '/dashboard',
      },
    });

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

**Benefits**:
- Configuration injected from application
- Can swap authentication strategy
- Easy to test with mock DataProvider
- Centralized auth logic

---

### Use Case 3: Feature Flags

**Scenario**: Enable/disable features based on configuration

```typescript
// Configuration
bindContext(): void {
  const isProd = import.meta.env.MODE === 'production';

  this.bind({ key: 'config.features' })
    .toValue({
      analytics: isProd,
      debugMode: !isProd,
      darkMode: true,
      notifications: isProd,
    });
}

// Service using feature flags
export class AnalyticsService {
  constructor(
    @inject({ key: 'config.features' })
    private features: IFeatureFlags
  ) {}

  track(event: string, properties?: any): void {
    if (!this.features.analytics) {
      return;  // Analytics disabled
    }

    // Send analytics event
    console.log('Tracking:', event, properties);
  }
}

// Component using feature flags
export function AppSettings() {
  const container = useApplicationContext();
  const features = container.get<IFeatureFlags>({ key: 'config.features' });

  return (
    <div>
      {features.darkMode && <DarkModeToggle />}
      {features.notifications && <NotificationSettings />}
    </div>
  );
}
```

**Benefits**:
- Centralized feature configuration
- Easy to toggle features
- Type-safe
- No hard-coded flags

---

### Use Case 4: Testing with Mocks

**Scenario**: Unit test a service with mocked dependencies

```typescript
// test/services/order.service.test.ts
import { Container, BindingScopes } from '@venizia/ignis-inversion';
import { OrderService } from '@/application/services/order.service';
import { CoreBindings } from '@minimaltech/ra-core-infra';

describe('OrderService', () => {
  let container: Container;
  let mockDataProvider: any;
  let mockUserService: any;
  let mockEmailService: any;

  beforeEach(() => {
    // Create test container
    container = new Container();

    // Create mocks
    mockDataProvider = {
      create: jest.fn().mockResolvedValue({ id: '1', total: 100 }),
    };

    mockUserService = {
      getUser: jest.fn().mockResolvedValue({ id: '123', email: 'user@example.com' }),
    };

    mockEmailService = {
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    };

    // Bind mocks
    container.bind({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
      .toValue(mockDataProvider);

    container.bind({ key: 'services.UserService' })
      .toValue(mockUserService);

    container.bind({ key: 'services.EmailService' })
      .toValue(mockEmailService);

    // Bind service under test
    container.bind({ key: 'services.OrderService' })
      .toClass(OrderService)
      .setScope(BindingScopes.TRANSIENT);
  });

  it('should create order and send confirmation', async () => {
    const orderService = container.get<OrderService>({ key: 'services.OrderService' });

    const order = await orderService.createOrder({
      userId: '123',
      items: [{ productId: '1', quantity: 2 }],
      total: 100,
    });

    expect(order.id).toBe('1');
    expect(mockUserService.getUser).toHaveBeenCalledWith('123');
    expect(mockDataProvider.create).toHaveBeenCalled();
    expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(Object)
    );
  });
});
```

**Benefits**:
- Isolated testing
- Full control over mocks
- No real API calls
- Fast tests

---

## Related Topics

- [Service Registration →](./service-registration) - How to register services
- [Injection Patterns →](./injection-patterns) - How to inject dependencies
- [Best Practices →](./best-practices) - DI guidelines

## See Also

- [BaseCrudService →](/api-reference/services/base-crud-service) - Service base class
- [BaseProvider →](/api-reference/providers/base-provider) - Provider pattern
- [useInjectable →](/api-reference/hooks/use-injectable) - Component injection

---

**Ready to learn best practices?** Continue with [Best Practices →](./best-practices)

# Injection Patterns

Master different techniques for injecting dependencies in services and components.

## Constructor Injection (Recommended)

### Basic Pattern

Inject dependencies through the constructor using `@inject` decorator:

```typescript
import { inject } from '@venizia/ignis-inversion';
import { CoreBindings, IDataProvider } from '@minimaltech/ra-core-infra';

export class UserService {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    private dataProvider: IDataProvider
  ) {}

  async getUser(id: string) {
    return this.dataProvider.getOne('users', { id });
  }
}
```

**Why Recommended?**
- ✅ Dependencies are immutable
- ✅ Explicit and clear
- ✅ Can't create instance without dependencies
- ✅ Type-safe
- ✅ Easy to test (mock in constructor)

### Multiple Dependencies

Inject multiple services:

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

  async createOrder(order: IOrder) {
    const user = await this.userService.getUser(order.userId);
    const created = await this.dataProvider.create('orders', { data: order });
    await this.emailService.sendOrderConfirmation(user.email, created);
    return created;
  }
}
```

### Optional Dependencies

Mark dependencies as optional:

```typescript
export class AnalyticsService {
  constructor(
    @inject({ key: 'services.Logger', isOptional: true })
    private logger?: Logger,

    @inject({ key: 'config.analytics', isOptional: true })
    private config?: IAnalyticsConfig
  ) {}

  track(event: string) {
    if (!this.config?.enabled) {
      return;  // Analytics disabled
    }

    this.logger?.info(`Tracking: ${event}`);
    // Track event...
  }
}
```

**When to Use Optional**:
- Feature flags / conditional features
- Development vs production differences
- Optional integrations

---

## Property Injection

### Basic Pattern

Inject via property decorator (use sparingly):

```typescript
export class ReportService {
  @inject({ key: 'services.EmailService' })
  private emailService!: EmailService;  // Definite assignment assertion

  @inject({ key: 'services.UserService' })
  private userService!: UserService;

  constructor() {
    // No constructor parameters needed
  }

  async generateAndSend(userId: string) {
    const user = await this.userService.getUser(userId);
    const report = this.generateReport(user);
    await this.emailService.send(user.email, report);
  }
}
```

**Disadvantages**:
- ❌ Dependencies can be undefined
- ❌ Hidden dependencies (not in constructor)
- ❌ Less type-safe
- ❌ Harder to test

### When to Use

Only use property injection for:
1. **Circular dependencies** (rare, better to redesign)
2. **Framework constraints** (very rare)

**Circular Dependency Example**:
```typescript
// ServiceA depends on ServiceB
class ServiceA {
  @inject({ key: 'services.ServiceB' })
  private serviceB!: ServiceB;  // Property injection to break cycle

  method() {
    this.serviceB.doSomething();
  }
}

// ServiceB depends on ServiceA
class ServiceB {
  constructor(
    @inject({ key: 'services.ServiceA' })
    private serviceA: ServiceA  // Constructor injection
  ) {}
}
```

---

## Component Injection

### useInjectable Hook

Inject services in React components:

```typescript
import { useInjectable } from '@minimaltech/ra-core-infra';
import { ProductApi } from '@/application/services/product.api';

export function ProductList() {
  // Inject service from container
  const productApi = useInjectable<ProductApi>({
    key: 'services.ProductApi'
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.find(),
  });

  return <div>{/* Render products */}</div>;
}
```

### With CoreBindings

Inject framework providers:

```typescript
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider, IAuthProvider } from '@minimaltech/ra-core-infra';

export function AdminApp() {
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER
  });

  const authProvider = useInjectable<IAuthProvider>({
    key: CoreBindings.DEFAULT_AUTH_PROVIDER
  });

  const i18nProvider = useInjectable({
    key: CoreBindings.DEFAULT_I18N_PROVIDER
  });

  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
    >
      {/* Resources */}
    </Admin>
  );
}
```

### With Custom Container

Override container for specific component tree:

```typescript
import { useInjectable, useApplicationContext } from '@minimaltech/ra-core-infra';

export function FeatureComponent() {
  const mainContainer = useApplicationContext();

  // Use specific container
  const specialService = useInjectable<SpecialService>({
    container: mainContainer,  // Custom container
    key: 'services.SpecialService'
  });

  return <div>{/* Use service */}</div>;
}
```

### useApplicationContext

Access the container directly:

```typescript
import { useApplicationContext } from '@minimaltech/ra-core-infra';

export function AdvancedComponent() {
  const container = useApplicationContext();

  // Direct container access (rare)
  const service = container.get<MyService>({ key: 'services.MyService' });

  // Conditional injection
  const debugService = container.isBound({ key: 'services.Debug' })
    ? container.get({ key: 'services.Debug' })
    : null;

  return <div>{/* Use services */}</div>;
}
```

::: warning
Prefer `useInjectable` over direct container access. Direct access makes testing harder and bypasses type safety.
:::

---

## Advanced Patterns

### Provider Pattern

Lazy initialization with `BaseProvider`:

```typescript
import { BaseProvider } from '@minimaltech/ra-core-infra';
import { Container, inject } from '@venizia/ignis-inversion';

export class CustomI18nProvider extends BaseProvider<I18nProvider> {
  constructor(
    @inject({ key: CoreBindings.I18N_PROVIDER_OPTIONS })
    private options: II18nProviderOptions
  ) {
    super({ scope: 'CustomI18nProvider' });
  }

  // Lazy initialization - called when first accessed
  override value(container: Container): I18nProvider {
    const { i18nSources, listLanguages } = this.options;

    return polyglotI18nProvider(
      locale => i18nSources[locale],
      'en',
      listLanguages
    );
  }
}
```

### Factory Pattern

Dynamic service creation:

```typescript
// Factory service
export class DatabaseConnectionFactory {
  constructor(
    @inject({ key: 'config.databases' })
    private dbConfigs: IDatabaseConfig[]
  ) {}

  createConnection(name: string): DatabaseConnection {
    const config = this.dbConfigs.find(c => c.name === name);
    if (!config) {
      throw new Error(`Database ${name} not configured`);
    }
    return new DatabaseConnection(config);
  }
}

// Registration
bindContext(): void {
  this.bind({ key: 'factories.DatabaseConnectionFactory' })
    .toClass(DatabaseConnectionFactory)
    .setScope(BindingScopes.SINGLETON);

  // Create specific connections using factory
  this.bind({ key: 'services.PrimaryDB' })
    .toProvider((container) => {
      const factory = container.get<DatabaseConnectionFactory>({
        key: 'factories.DatabaseConnectionFactory'
      });
      return factory.createConnection('primary');
    });

  this.bind({ key: 'services.AnalyticsDB' })
    .toProvider((container) => {
      const factory = container.get<DatabaseConnectionFactory>({
        key: 'factories.DatabaseConnectionFactory'
      });
      return factory.createConnection('analytics');
    });
}
```

### Composite Services

Services that depend on other services:

```typescript
export class NotificationService {
  constructor(
    @inject({ key: 'services.EmailService' })
    private emailService: EmailService,

    @inject({ key: 'services.SmsService' })
    private smsService: SmsService,

    @inject({ key: 'services.PushService' })
    private pushService: PushService
  ) {}

  async notify(user: IUser, message: string) {
    // Send via all channels
    await Promise.all([
      this.emailService.send(user.email, message),
      this.smsService.send(user.phone, message),
      this.pushService.send(user.deviceId, message),
    ]);
  }
}
```

---

## Type Safety

### Type Augmentation

Enable autocomplete for custom service keys:

```typescript
// src/types/ra-core-infra.d.ts
import 'reflect-metadata';

declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    'services.UserService': true;
    'services.ProductApi': true;
    'services.OrderApi': true;
  }
}
```

**Result**:
```typescript
// Now get autocomplete!
const userService = useInjectable<UserService>({
  key: 'services.'  // ← IDE suggests: UserService, ProductApi, OrderApi
});
```

### Generic Services

Type-safe generic services:

```typescript
export class CrudService<T extends { id: string }> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    private dataProvider: IDataProvider,

    private resourceName: string
  ) {}

  async getAll(): Promise<T[]> {
    return this.dataProvider.getList(this.resourceName, {
      pagination: { page: 1, perPage: 100 }
    });
  }
}

// Usage with specific type
interface IUser {
  id: string;
  name: string;
  email: string;
}

const userService = new CrudService<IUser>(dataProvider, 'users');
const users: IUser[] = await userService.getAll();
```

---

## Complete Examples

### Service with Multiple Injections

```typescript
// src/application/services/order.service.ts
import { inject } from '@venizia/ignis-inversion';
import { CoreBindings, IDataProvider } from '@minimaltech/ra-core-infra';

export class OrderService {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    private dataProvider: IDataProvider,

    @inject({ key: 'services.UserService' })
    private userService: UserService,

    @inject({ key: 'services.ProductService' })
    private productService: ProductService,

    @inject({ key: 'services.EmailService' })
    private emailService: EmailService,

    @inject({ key: 'services.PaymentService' })
    private paymentService: PaymentService
  ) {}

  async createOrder(orderData: IOrderInput): Promise<IOrder> {
    // 1. Validate user
    const user = await this.userService.getUser(orderData.userId);

    // 2. Validate products
    const products = await Promise.all(
      orderData.items.map(item =>
        this.productService.getProduct(item.productId)
      )
    );

    // 3. Process payment
    const payment = await this.paymentService.charge(
      user.id,
      orderData.total
    );

    // 4. Create order
    const order = await this.dataProvider.create('orders', {
      data: { ...orderData, paymentId: payment.id }
    });

    // 5. Send confirmation
    await this.emailService.sendOrderConfirmation(user.email, order);

    return order;
  }
}
```

### Component with Multiple Injections

```typescript
// src/screens/dashboard/Dashboard.tsx
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import { UserService } from '@/application/services/user.service';
import { OrderService } from '@/application/services/order.service';
import { AnalyticsService } from '@/application/services/analytics.service';

export function Dashboard() {
  // Inject multiple services
  const userService = useInjectable<UserService>({
    key: 'services.UserService'
  });

  const orderService = useInjectable<OrderService>({
    key: 'services.OrderService'
  });

  const analyticsService = useInjectable<AnalyticsService>({
    key: 'services.AnalyticsService'
  });

  const dataProvider = useInjectable({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER
  });

  // Use services
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [users, orders, revenue] = await Promise.all([
        userService.getCount(),
        orderService.getCount(),
        analyticsService.getRevenue()
      ]);

      return { users, orders, revenue };
    }
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <div>Users: {stats?.users}</div>
      <div>Orders: {stats?.orders}</div>
      <div>Revenue: ${stats?.revenue}</div>
    </div>
  );
}
```

---

## Related Topics

- [Service Registration →](./service-registration) - Register services
- [Container Setup →](./container-setup) - Set up application
- [Best Practices →](./best-practices) - Injection best practices

## See Also

- [useInjectable →](/api-reference/hooks/use-injectable) - Injection hook API
- [BaseProvider →](/api-reference/providers/base-provider) - Provider base class
- [CoreBindings →](/api-reference/core/core-bindings) - Standard keys

---

**Ready to learn when to use DI?** Continue with [Use Cases →](./use-cases)

# Core Concepts

Understanding the core concepts of @ra-core-infra will help you build better applications and troubleshoot issues more effectively.

## What You'll Learn

This section covers the fundamental concepts that power @ra-core-infra:

- **[Architecture](./architecture)** - How the layers work together
- **[Application Lifecycle](./application-lifecycle)** - Initialization and startup flow
- **[Project Structure](./project-structure)** - Recommended folder organization

## Key Concepts Overview

### Dependency Injection

@ra-core-infra uses **dependency injection** to manage services and their dependencies:

- Services declare what they need via `@inject` decorators
- The DI container provides dependencies automatically
- Services are easily testable and swappable

```typescript
// Service declares its dependency
export class ProductApi extends BaseCrudService<IProduct> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected dataProvider: IDataProvider  // ← Automatically injected!
  ) {
    super({ /* ... */ });
  }
}
```

### Layered Architecture

The framework follows a clear **separation of concerns**:

1. **Application Layer** - Configuration and DI setup
2. **Provider Layer** - Abstract interfaces (data, auth, i18n)
3. **Service Layer** - Business logic and API calls
4. **UI Layer** - React components

Each layer only knows about the layer directly below it, making the code modular and maintainable.

### Provider Pattern

**Providers** are abstractions that hide implementation details:

- **Data Provider** - Handles all API communication
- **Auth Provider** - Manages authentication and authorization
- **I18n Provider** - Handles internationalization

You can swap implementations (e.g., REST to GraphQL) without changing your application code.

### Service-Oriented Design

Business logic lives in **services**, not components:

```typescript
// ❌ Bad: Logic in component
function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  }, []);

  return /* ... */;
}

// ✅ Good: Logic in service
function ProductList() {
  const productApi = useInjectable<ProductApi>({ key: 'services.ProductApi' });
  const { data: products } = useQuery(['products'], () => productApi.find());

  return /* ... */;
}
```

Benefits:
- **Reusability** - Use the same service in multiple components
- **Testability** - Mock services easily in tests
- **Separation** - UI and business logic are decoupled

## Understanding the Flow

Here's how a typical request flows through @ra-core-infra:

```
User clicks "Load Products"
        ↓
Component calls productApi.find()
        ↓
ProductApi (Service Layer)
        ↓
DataProvider (Provider Layer)
        ↓
NetworkRequestService (Network Layer)
        ↓
HTTP Request to API
        ↓
API Response
        ↓
Data flows back up
        ↓
Component renders
```

Each layer transforms the data:
- **Network Layer** - Raw HTTP → JSON
- **Provider Layer** - JSON → Standardized format
- **Service Layer** - Standardized format → Domain models
- **UI Layer** - Domain models → UI

## Learning Path

### For Beginners

1. Start with **[Architecture](./architecture)** to understand the big picture
2. Read **[Application Lifecycle](./application-lifecycle)** to see how apps start
3. Study **[Project Structure](./project-structure)** for organization

### For Experienced Developers

1. Skim **[Architecture](./architecture)** to understand differences from other frameworks
2. Focus on **[Application Lifecycle](./application-lifecycle)** for lifecycle hooks
3. Use **[Project Structure](./project-structure)** as a reference

## Key Terminology

| Term | Definition |
|------|------------|
| **DI Container** | Manages service creation and dependency resolution |
| **Binding** | Registration of a service or value in the DI container |
| **Provider** | Abstraction layer for data, auth, or i18n |
| **Service** | Business logic class that handles specific domain operations |
| **Scope** | Lifetime of a service (Singleton, Transient, etc.) |
| **Injection** | Automatic provision of dependencies to a class |
| **LoopBack Filter** | Query syntax for complex data filtering |

## Common Patterns

### Constructor Injection

Dependencies are provided through the constructor:

```typescript
class UserService {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    private dataProvider: IDataProvider
  ) {}
}
```

### Hook-Based Injection

React components use hooks to access services:

```typescript
function MyComponent() {
  const userService = useInjectable<UserService>({
    key: 'services.UserService'
  });
}
```

### Provider Registration

Providers are registered in the application class:

```typescript
class RaApplication extends BaseRaApplication {
  bindContext() {
    this.bind({ key: CoreBindings.REST_DATA_PROVIDER_OPTIONS })
      .toValue({ url: 'https://api.example.com' });
  }
}
```

## Design Principles

@ra-core-infra follows these principles:

1. **Separation of Concerns** - Each layer has a single responsibility
2. **Dependency Inversion** - Depend on abstractions, not concrete implementations
3. **Single Responsibility** - Each service handles one domain
4. **Open/Closed** - Open for extension, closed for modification
5. **Interface Segregation** - Small, focused interfaces
6. **DRY (Don't Repeat Yourself)** - Reuse code through services

## Comparison with Traditional React

| Aspect | Traditional React | @ra-core-infra |
|--------|-------------------|----------------|
| State Management | useState, useContext | DI Container + Providers |
| API Calls | fetch/axios in components | Services injected via DI |
| Business Logic | Scattered in components | Centralized in services |
| Testability | Hard to mock | Easy with DI |
| Code Organization | Component-centric | Layer-centric |
| Reusability | Hook composition | Service composition |

## Next Steps

Ready to dive deeper? Choose your path:

- **[Architecture](./architecture)** - Understand the layered architecture
- **[Application Lifecycle](./application-lifecycle)** - Learn initialization flow
- **[Project Structure](./project-structure)** - See recommended organization
- **[Dependency Injection Guide](/guides/dependency-injection/)** - Master DI patterns

---

**Ready to explore?** Start with [architecture →](./architecture)

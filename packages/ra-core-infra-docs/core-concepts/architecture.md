# Architecture

@ra-core-infra follows a **layered architecture** pattern that separates concerns and promotes maintainability. This guide explains how the layers work together.

## High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                   User Interface                     │
│              (React Components)                      │
└─────────────────────────────────────────────────────┘
                        ↓ ↑
┌─────────────────────────────────────────────────────┐
│              Application Context                     │
│          (DI Container + Providers)                  │
└─────────────────────────────────────────────────────┘
                        ↓ ↑
┌─────────────────────────────────────────────────────┐
│                Service Layer                         │
│         (Business Logic + Domain Models)             │
└─────────────────────────────────────────────────────┘
                        ↓ ↑
┌─────────────────────────────────────────────────────┐
│                Provider Layer                        │
│       (Data, Auth, I18n Abstractions)                │
└─────────────────────────────────────────────────────┘
                        ↓ ↑
┌─────────────────────────────────────────────────────┐
│                Network Layer                         │
│        (HTTP Client + Request Handling)              │
└─────────────────────────────────────────────────────┘
                        ↓ ↑
┌─────────────────────────────────────────────────────┐
│                External APIs                         │
│             (REST, GraphQL, etc.)                    │
└─────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. User Interface Layer

**Purpose**: Render UI and handle user interactions

**Components**:
- React components
- Screens/Pages
- UI widgets

**Responsibilities**:
- Display data to users
- Capture user input
- Delegate business logic to services
- Manage local component state

**Example**:
```typescript
function ProductList() {
  // Access service from DI container
  const productApi = useInjectable<ProductApi>({
    key: 'services.ProductApi'
  });

  // Fetch data using service
  const { data: products } = useQuery(['products'], () =>
    productApi.find()
  );

  return <div>{/* Render products */}</div>;
}
```

### 2. Application Context Layer

**Purpose**: Provide dependency injection and global providers

**Components**:
- `RaApplication` class
- `CoreApplicationContext` component
- DI container (Venizia)

**Responsibilities**:
- Configure and initialize DI container
- Register services and providers
- Provide container to React tree
- Manage application lifecycle

**Example**:
```typescript
class RaApplication extends BaseRaApplication {
  bindContext() {
    // Register services
    this.service(ProductApi);
    this.service(UserApi);

    // Configure providers
    this.bind({ key: CoreBindings.REST_DATA_PROVIDER_OPTIONS })
      .toValue({ url: 'https://api.example.com' });
  }
}
```

### 3. Service Layer

**Purpose**: Encapsulate business logic and domain operations

**Components**:
- CRUD services (extending `BaseCrudService`)
- Custom domain services
- Business logic functions

**Responsibilities**:
- Perform domain operations (find, create, update, delete)
- Transform data between API and UI formats
- Validate business rules
- Coordinate multiple provider calls

**Example**:
```typescript
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

  // Custom business logic
  async getPopularProducts(): Promise<IProduct[]> {
    return this.find({
      where: { rating: { gte: 4.5 } },
      order: ['sales DESC'],
      limit: 10,
    });
  }
}
```

### 4. Provider Layer

**Purpose**: Abstract data access, authentication, and internationalization

**Components**:
- `DefaultRestDataProvider`
- `DefaultAuthProvider`
- `DefaultI18nProvider`

**Responsibilities**:
- Implement standardized interfaces (React Admin compatible)
- Convert between different data formats
- Handle provider-specific logic
- Delegate to network layer

**Example**:
```typescript
class DefaultRestDataProvider implements IDataProvider {
  async getList(resource, params) {
    // Build LoopBack filter from params
    const filter = this.buildFilter(params);

    // Use network service
    return this.networkService.doRequest({
      method: 'GET',
      url: `/${resource}`,
      params: { filter: JSON.stringify(filter) },
    });
  }
}
```

### 5. Network Layer

**Purpose**: Handle HTTP communication and request/response processing

**Components**:
- `AxiosNetworkRequest`
- `NodeFetchNetworkRequest`
- `BaseNetworkRequest` (abstract)

**Responsibilities**:
- Execute HTTP requests
- Add authentication headers
- Handle errors and retries
- Transform responses

**Example**:
```typescript
class AxiosNetworkRequest extends BaseNetworkRequest {
  async doRequest(options) {
    // Add auth headers
    const headers = this.getAuthHeaders();

    // Execute request with Axios
    const response = await axios.request({
      ...options,
      headers,
      timeout: this.timeout,
    });

    return this.transformResponse(response);
  }
}
```

### 6. External APIs

**Purpose**: Provide data and services

**Examples**:
- REST APIs
- GraphQL endpoints
- Third-party services

## Data Flow

### Read Operation (GET)

```
1. User clicks "Load Products"
        ↓
2. Component: ProductList
   useQuery(['products'], () => productApi.find())
        ↓
3. Service: ProductApi.find()
   Calls: this.dataProvider.getList('products', { filter })
        ↓
4. Provider: DefaultRestDataProvider.getList()
   Builds LoopBack filter
   Calls: networkService.doRequest({ method: 'GET', ... })
        ↓
5. Network: AxiosNetworkRequest.doRequest()
   Adds auth headers
   Executes: axios.get('/api/products?filter=...')
        ↓
6. External API
   Returns: { data: [...], total: 100 }
        ↓
7. Response flows back up:
   Network → Provider → Service → Component
        ↓
8. Component receives typed IProduct[]
   Renders product list
```

### Write Operation (POST/PUT)

```
1. User submits "Create Product" form
        ↓
2. Component: ProductForm
   useMutation(() => productApi.create(formData))
        ↓
3. Service: ProductApi.create(data)
   Validates data
   Calls: this.dataProvider.create('products', { data })
        ↓
4. Provider: DefaultRestDataProvider.create()
   Formats data for API
   Calls: networkService.doRequest({ method: 'POST', body: data })
        ↓
5. Network: AxiosNetworkRequest.doRequest()
   Adds auth headers + Content-Type
   Executes: axios.post('/api/products', data)
        ↓
6. External API
   Validates and saves
   Returns: { id: 123, ...data }
        ↓
7. Response flows back up:
   Network → Provider → Service → Component
        ↓
8. Component receives created product
   Invalidates query cache
   Shows success message
```

## State Management Layers

@ra-core-infra uses a **three-tier state management** approach:

### 1. React Context (Component Composition)

**Purpose**: Dependency injection and provider composition

**Provided by**: `CoreApplicationContext`, React Admin

**Use for**:
- DI container access
- Provider configuration
- Cross-cutting concerns

```typescript
<CoreApplicationContext container={container}>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</CoreApplicationContext>
```

### 2. Redux (Global UI State)

**Purpose**: Global client-side state

**Use for**:
- Theme settings
- UI preferences (sidebar collapsed, etc.)
- Global notifications
- Cross-component state

```typescript
const reduxStore = configureStore({
  reducer: {
    theme: themeReducer,
    notifications: notificationsReducer,
  },
});
```

::: tip When to Use Redux
Only use Redux for **UI state** that needs to be shared across many components. For server data, use TanStack Query instead.
:::

### 3. TanStack Query (Server State)

**Purpose**: Server state caching and synchronization

**Use for**:
- API data fetching
- Cache management
- Optimistic updates
- Background refetching

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: () => productApi.find(),
  staleTime: 5 * 60 * 1000,  // 5 minutes
});
```

## Dependency Injection Architecture

### DI Container Lifecycle

```
1. Application Creation
   const app = new RaApplication();
        ↓
2. Container Initialization
   Venizia container created
        ↓
3. preConfigure() Hook
   Override for early setup
        ↓
4. bindContext() Hook
   Register all services and providers
        ↓
5. postConfigure() Hook
   Override for post-setup logic
        ↓
6. app.start()
   Finalize and make container available
        ↓
7. Container Ready
   Services can be injected
```

### Service Registration

```typescript
class RaApplication extends BaseRaApplication {
  bindContext() {
    // Option 1: Register with .service() helper (Singleton)
    this.service(ProductApi);

    // Option 2: Register with .bind() (custom scope)
    this.bind({ key: 'services.UserApi' })
      .toClass(UserApi)
      .setScope(BindingScopes.TRANSIENT);

    // Option 3: Register provider
    this.bind({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
      .toProvider(DefaultRestDataProvider);

    // Option 4: Register value
    this.bind({ key: 'config.api' })
      .toValue({ url: 'https://api.example.com', timeout: 30000 });
  }
}
```

### Service Resolution

```
User requests service via useInjectable
        ↓
DI Container checks if service exists
        ↓
If Singleton: Return existing instance
If Transient: Create new instance
If not found: Throw error
        ↓
Resolve dependencies (recursive)
        ↓
Inject dependencies via constructor
        ↓
Return service instance
```

## Architectural Benefits

### 1. Separation of Concerns

Each layer has a **single responsibility**:

- **UI** - Presentation only
- **Services** - Business logic only
- **Providers** - Data access only
- **Network** - HTTP communication only

### 2. Testability

**Easy to mock** at any layer:

```typescript
// Mock service in component test
const mockProductApi = {
  find: jest.fn().mockResolvedValue([{ id: 1, name: 'Product 1' }]),
};

// Mock provider in service test
const mockDataProvider = {
  getList: jest.fn().mockResolvedValue({ data: [...], total: 10 }),
};
```

### 3. Flexibility

**Swap implementations** without changing code:

```typescript
// Development: Use Fetch
this.bind({ key: CoreBindings.NETWORK_REQUEST })
  .toClass(NodeFetchNetworkRequest);

// Production: Use Axios with interceptors
this.bind({ key: CoreBindings.NETWORK_REQUEST })
  .toClass(AxiosNetworkRequest);
```

### 4. Maintainability

**Changes are localized**:

- Change API format? Update provider only.
- Change business rules? Update service only.
- Change UI? Update components only.

### 5. Scalability

**Add features easily**:

```typescript
// Add new resource - just create a service
export class OrderApi extends BaseCrudService<IOrder> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected dataProvider: IDataProvider
  ) {
    super({ scope: 'OrderApi', dataProvider, serviceOptions: { basePath: '/orders' } });
  }
}

// Register it
this.service(OrderApi);

// Use it
const orderApi = useInjectable<OrderApi>({ key: 'services.OrderApi' });
```

## Design Patterns Used

| Pattern | Where Used | Purpose |
|---------|------------|---------|
| **Dependency Injection** | Throughout | Manage dependencies |
| **Provider** | Data, Auth, I18n | Abstract implementations |
| **Repository** | BaseCrudService | Data access abstraction |
| **Singleton** | Services | Single instance |
| **Factory** | Providers | Create complex objects |
| **Observer** | React hooks | Subscribe to changes |
| **Strategy** | Network layer | Swappable algorithms |

## Anti-Patterns to Avoid

### ❌ Business Logic in Components

```typescript
// Bad: Logic in component
function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.filter(p => p.active)));
  }, []);
}
```

### ✅ Business Logic in Services

```typescript
// Good: Logic in service
class ProductApi extends BaseCrudService<IProduct> {
  async getActiveProducts() {
    return this.find({ where: { active: true } });
  }
}

function ProductList() {
  const productApi = useInjectable<ProductApi>({ key: 'services.ProductApi' });
  const { data } = useQuery(['active-products'], () => productApi.getActiveProducts());
}
```

## Summary

@ra-core-infra's architecture provides:

✅ **Clear separation** between UI, business logic, and data access
✅ **Dependency injection** for testability and flexibility
✅ **Provider abstractions** for swappable implementations
✅ **Service layer** for reusable business logic
✅ **Multi-tier state management** for different state types

## Next Steps

- **[Application Lifecycle](./application-lifecycle)** - Understand initialization flow
- **[Project Structure](./project-structure)** - See recommended organization
- **[Dependency Injection Guide](/guides/dependency-injection/)** - Deep dive into DI

---

**Ready to learn the lifecycle?** Continue to [application lifecycle →](./application-lifecycle)

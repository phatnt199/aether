# Project Structure

@ra-core-infra uses **Feature-Sliced Design (FSD)** - a proven architectural methodology for building scalable, maintainable applications. This guide shows how to structure your project using FSD principles integrated with dependency injection.

FSD organizes code by **business features** rather than technical layers, providing:
-  Natural scaling as features grow
-  Isolated changes to specific features
-  Clear code ownership
-  Reduced merge conflicts in teams
-  Simplified testing and refactoring

## FSD Architecture Overview

Feature-Sliced Design is built on three key concepts:

### 1. Layers (Vertical Hierarchy)

FSD defines layers from high-level to low-level, where higher layers can import from lower layers:

```
app/       ──┐
pages/       │
widgets/     │  Can import
features/    │      ↓
entities/    │
shared/    ←─┘
```

**Dependency Rule:** Higher layers can import from lower layers, never the reverse.

### 2. Slices (Business Features)

Within each layer (except `app/` and `shared/`), code is organized by business domain:

```
features/
├── auth/              # Authentication feature
├── product-catalog/   # Product browsing
└── shopping-cart/     # Cart management
```

**Isolation Rule:** Slices at the same layer cannot import from each other.

### 3. Segments (Technical Concerns)

Within each slice, code is organized by technical purpose:

- `ui/` - React components
- `model/` - Business logic, state, hooks
- `api/` - API integration
- `lib/` - Helper functions
- `config/` - Configuration

### 4. Public API (index.ts)

Each slice exports a public API via `index.ts` to control dependencies and maintain encapsulation.

## Complete FSD Structure

Here's the full structure showing @ra-core-infra integration:

```
my-admin-app/
├── public/                         # Static assets
│   ├── favicon.ico
│   └── logo.png
│
├── src/
│   ├── app/                        # Layer 1: Application initialization
│   │   ├── application.ts          # ⭐ RaApplication class (DI setup)
│   │   ├── ApplicationContext.tsx  # ⭐ React context provider
│   │   │
│   │   ├── providers/              # ⭐ Provider configurations
│   │   │   ├── auth/
│   │   │   │   └── authProvider.ts
│   │   │   ├── data/
│   │   │   │   └── dataProvider.ts
│   │   │   └── i18n/
│   │   │       └── i18nProvider.ts
│   │   │
│   │   ├── routes/                 # Route definitions
│   │   │   └── routes.tsx
│   │   │
│   │   ├── locales/                # Internationalization
│   │   │   ├── index.ts
│   │   │   ├── en.ts
│   │   │   └── vi.ts
│   │   │
│   │   └── styles/                 # Global styles
│   │       ├── globals.css
│   │       └── variables.css
│   │
│   ├── pages/                      # Layer 2: Route-level components
│   │   ├── home/
│   │   │   ├── ui/
│   │   │   │   └── HomePage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── product-list/
│   │   │   ├── ui/
│   │   │   │   └── ProductListPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── product-details/
│   │   │   ├── ui/
│   │   │   │   └── ProductDetailsPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── login/
│   │       ├── ui/
│   │       │   └── LoginPage.tsx
│   │       └── index.ts
│   │
│   ├── widgets/                    # Layer 3: Composite UI blocks
│   │   ├── header/
│   │   │   ├── ui/
│   │   │   │   └── Header.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── sidebar/
│   │   │   ├── ui/
│   │   │   │   └── Sidebar.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── product-grid/
│   │       ├── ui/
│   │       │   └── ProductGrid.tsx
│   │       └── index.ts
│   │
│   ├── features/                   # Layer 4: Business features
│   │   ├── auth/
│   │   │   ├── ui/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── LogoutButton.tsx
│   │   │   ├── model/
│   │   │   │   └── useAuth.ts     # ⭐ Uses useInjectable
│   │   │   └── index.ts
│   │   │
│   │   ├── product-filter/
│   │   │   ├── ui/
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   └── CategoryFilter.tsx
│   │   │   ├── model/
│   │   │   │   └── useProductFilter.ts
│   │   │   └── index.ts
│   │   │
│   │   └── add-to-cart/
│   │       ├── ui/
│   │       │   └── AddToCartButton.tsx
│   │       ├── model/
│   │       │   └── useAddToCart.ts
│   │       └── index.ts
│   │
│   ├── entities/                   # Layer 5: Business entities
│   │   ├── product/
│   │   │   ├── ui/
│   │   │   │   └── ProductCard.tsx
│   │   │   ├── model/
│   │   │   │   ├── product.types.ts
│   │   │   │   ├── useProducts.ts
│   │   │   │   ├── useProduct.ts
│   │   │   │   └── useCreateProduct.ts
│   │   │   ├── api/
│   │   │   │   └── productApi.ts  # ⭐ BaseCrudService
│   │   │   └── index.ts
│   │   │
│   │   ├── user/
│   │   │   ├── ui/
│   │   │   │   └── UserAvatar.tsx
│   │   │   ├── model/
│   │   │   │   ├── user.types.ts
│   │   │   │   └── useUsers.ts
│   │   │   ├── api/
│   │   │   │   └── userApi.ts     # ⭐ BaseCrudService
│   │   │   └── index.ts
│   │   │
│   │   └── order/
│   │       ├── ui/
│   │       │   └── OrderStatus.tsx
│   │       ├── model/
│   │       │   ├── order.types.ts
│   │       │   └── useOrders.ts
│   │       ├── api/
│   │       │   └── orderApi.ts    # ⭐ BaseCrudService
│   │       └── index.ts
│   │
│   └── shared/                     # Layer 6: Shared infrastructure
│       ├── ui/
│       │   ├── Button/
│       │   │   ├── Button.tsx
│       │   │   └── index.ts
│       │   ├── Input/
│       │   │   ├── Input.tsx
│       │   │   └── index.ts
│       │   ├── Card/
│       │   │   ├── Card.tsx
│       │   │   └── index.ts
│       │   └── Modal/
│       │       ├── Modal.tsx
│       │       └── index.ts
│       │
│       ├── api/
│       │   └── baseClient.ts
│       │
│       ├── lib/
│       │   ├── format.ts
│       │   ├── validation.ts
│       │   └── date.ts
│       │
│       └── config/
│           └── constants.ts
│
├── types/                          # Global type definitions
│   ├── env.d.ts                    # Environment variables
│   └── ra-core-infra.d.ts          # Type augmentation
│
├── App.tsx                         # Root component
├── main.tsx                        # Application entry point
├── .env                            # Environment variables (local, not committed)
├── .env.example                    # Environment template
├── .gitignore
├── index.html                      # HTML entry point
├── package.json
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.app.json               # App TypeScript config
├── tsconfig.node.json              # Node TypeScript config
├── vite.config.ts                  # Vite configuration
└── README.md
```

::: tip Learn More
For step-by-step FSD setup instructions, see the [Project Setup Guide](../getting-started/project-setup#recommended-folder-structure-feature-sliced-design)
:::

## FSD Layers Explained

### Layer 1: `app/` - Application Initialization

**Purpose:** Global setup, dependency injection container, providers, and routing.

**Key Components:**
- `application.ts` - Extends `BaseRaApplication`, registers all services
- `ApplicationContext.tsx` - React context provider wrapping the app
- `providers/` - Custom provider configurations (auth, data, i18n)
- `routes/` - Application routing setup
- `locales/` - Internationalization files
- `styles/` - Global stylesheets

**Example - `app/application.ts`:**
```typescript
// app/application.ts
// Application setup - registers all services in DI container
// FSD Layer: app/
// Purpose: Configure dependency injection and providers

import { BaseRaApplication } from '@minimaltech/ra-core-infra';
import { ProductApi } from '@/entities/product';
import { UserApi } from '@/entities/user';
import { OrderApi } from '@/entities/order';

export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    // Register entity services
    this.service(ProductApi);
    this.service(UserApi);
    this.service(OrderApi);

    // Services are now available via useInjectable throughout the app
  }
}
```

**Example - `app/ApplicationContext.tsx`:**
```typescript
import { ApplicationContext as CoreApplicationContext } from '@minimaltech/ra-core-infra';
import { ReactNode } from 'react';
import { RaApplication } from './application';

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
```

---

### Layer 2: `pages/` - Route-Level Components

**Purpose:** Map routes to screens, compose widgets and features to create complete pages.

**Structure:**
```
pages/
├── home/
│   ├── ui/
│   │   └── HomePage.tsx
│   └── index.ts
├── product-list/
│   ├── ui/
│   │   └── ProductListPage.tsx
│   └── index.ts
```

**Example - `pages/product-list/ui/ProductListPage.tsx`:**
```typescript
// pages/product-list/ui/ProductListPage.tsx
// FSD Layer: pages/product-list
// Purpose: Product listing page - composes widgets and features

import { ProductGrid } from '@/widgets/product-grid';
import { ProductFilter } from '@/features/product-filter';
import { useProducts } from '@/entities/product';

export function ProductListPage() {
  const { data: products, isLoading } = useProducts();

  return (
    <div>
      <h1>Products</h1>
      <ProductFilter />
      <ProductGrid products={products} loading={isLoading} />
    </div>
  );
}
```

**Example - `pages/product-list/index.ts` (Public API):**
```typescript
// pages/product-list/index.ts
export { ProductListPage } from './ui/ProductListPage';
```

---

### Layer 3: `widgets/` - Composite UI Blocks

**Purpose:** Reusable UI blocks that combine multiple features and entities. Widgets are larger than components but smaller than pages.

**Example - `widgets/header/ui/Header.tsx`:**
```typescript
// widgets/header/ui/Header.tsx
// FSD Layer: widgets/header
// Purpose: Application header with auth controls

import { LogoutButton } from '@/features/auth';
import { useAuth } from '@/features/auth';

export function Header() {
  const { user } = useAuth();

  return (
    <header>
      <div>My Admin App</div>
      {user && (
        <div>
          <span>Welcome, {user.name}</span>
          <LogoutButton />
        </div>
      )}
    </header>
  );
}
```

---

### Layer 4: `features/` - Business Features

**Purpose:** Isolated business features with complete functionality. Each feature is self-contained and cannot depend on other features at the same layer.

**Structure:**
```
features/
├── auth/
│   ├── ui/              # Components
│   ├── model/           # Business logic, hooks
│   ├── api/             # Optional API calls (if not in entities)
│   └── index.ts         # Public API
```

**Example - `features/auth/ui/LoginForm.tsx`:**
```typescript
// features/auth/ui/LoginForm.tsx
// FSD Layer: features/auth/ui
// Purpose: Login form component

import { useState } from 'react';
import { useAuth } from '../model/useAuth';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

**Example - `features/auth/model/useAuth.ts`:**
```typescript
// features/auth/model/useAuth.ts
// FSD Layer: features/auth/model
// Purpose: Authentication business logic

import { useInjectable } from '@minimaltech/ra-core-infra';
import { useMutation } from '@tanstack/react-query';
import { UserApi } from '@/entities/user';

export function useAuth() {
  const userApi = useInjectable<UserApi>({ key: 'services.UserApi' });

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      userApi.login(credentials),
  });

  return {
    login: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    user: null, // Get from context or state
  };
}
```

---

### Layer 5: `entities/` - Business Entities

**Purpose:** Business entities (domain models) and their data access layer. This is where BaseCrudService implementations live.

**Structure:**
```
entities/
├── product/
│   ├── ui/              # Entity-specific UI
│   ├── model/           # Types, hooks
│   ├── api/             # ⭐ BaseCrudService
│   └── index.ts         # Public API
```

**Example - `entities/product/api/productApi.ts`:**
```typescript
// entities/product/api/productApi.ts
// Entity API Service - handles product CRUD operations
// FSD Layer: entities/product/api/
// Purpose: Data access for product entity

import { BaseCrudService, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider } from '@minimaltech/ra-core-infra';
import { inject } from '@venizia/ignis-inversion';
import type { IProduct } from '../model/product.types';

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

**Example - `entities/product/model/product.types.ts`:**
```typescript
// entities/product/model/product.types.ts
// FSD Layer: entities/product/model/
// Purpose: Product entity type definitions

export interface IProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}
```

**Example - `entities/product/model/useProducts.ts`:**
```typescript
// entities/product/model/useProducts.ts
// FSD Layer: entities/product/model/
// Purpose: Hook for fetching products list

import { useInjectable } from '@minimaltech/ra-core-infra';
import { useQuery } from '@tanstack/react-query';
import { ProductApi } from '../api/productApi';

export function useProducts() {
  const productApi = useInjectable<ProductApi>({
    key: 'services.ProductApi'
  });

  return useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.find(),
  });
}
```

**Example - `entities/product/index.ts` (Public API):**
```typescript
// entities/product/index.ts
// Public API for product entity

export * from './model/product.types';
export * from './model/useProducts';
export * from './model/useProduct';
export * from './model/useCreateProduct';
export { ProductApi } from './api/productApi';
export { ProductCard } from './ui/ProductCard';
```

---

### Layer 6: `shared/` - Shared Infrastructure

**Purpose:** Reusable utilities, UI components, and helpers used across all layers. No business logic here.

**Structure:**
```
shared/
├── ui/              # Base UI components
├── api/             # Base API clients
├── lib/             # Utility functions
└── config/          # Shared constants
```

**Example - `shared/ui/Button/Button.tsx`:**
```typescript
// shared/ui/Button/Button.tsx
// FSD Layer: shared/ui
// Purpose: Reusable button component

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Example - `shared/lib/format.ts`:**
```typescript
// shared/lib/format.ts
// FSD Layer: shared/lib
// Purpose: Formatting utilities

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};
```

## @ra-core-infra + FSD Integration

### Where Does DI Setup Belong?

**Answer: `app/` layer**

The application layer (`app/`) is responsible for:
1. Creating the `RaApplication` instance (extends `BaseRaApplication`)
2. Registering services in `bindContext()`
3. Providing the DI container to the React tree via `ApplicationContext`

### Service Registration in FSD

Services can be organized by domain (entities) and registered globally in `app/application.ts`:

```typescript
// app/application.ts
import { BaseRaApplication } from '@minimaltech/ra-core-infra';

// Import entity services
import { ProductApi } from '@/entities/product';
import { UserApi } from '@/entities/user';
import { OrderApi } from '@/entities/order';

export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    // Register all entity services
    this.service(ProductApi);      // entities/product/api/
    this.service(UserApi);         // entities/user/api/
    this.service(OrderApi);        // entities/order/api/

    // Services are now accessible via useInjectable from any layer
  }
}
```

### Where Do Providers Go?

Providers belong in the `app/providers/` directory:

**Directory Structure:**
```
app/
├── providers/
│   ├── auth/
│   │   └── authProvider.ts        # DefaultAuthProvider customization
│   ├── data/
│   │   └── dataProvider.ts        # DefaultRestDataProvider customization
│   └── i18n/
│       └── i18nProvider.ts        # DefaultI18nProvider customization
```

**Example - `app/providers/data/dataProvider.ts`:**
```typescript
import { DefaultRestDataProvider } from '@minimaltech/ra-core-infra';

export class CustomDataProvider extends DefaultRestDataProvider {
  // Customize data provider behavior
}
```

### Using `useInjectable` Across FSD Layers

Services registered in `app/` are available everywhere via `useInjectable`:

**In Pages:**
```typescript
// pages/product-list/ui/ProductListPage.tsx
import { useInjectable } from '@minimaltech/ra-core-infra';
import { ProductApi } from '@/entities/product';

export function ProductListPage() {
  const productApi = useInjectable<ProductApi>({ key: 'services.ProductApi' });
  // Use productApi...
}
```

**In Features:**
```typescript
// features/product-filter/model/useProductFilter.ts
import { useInjectable } from '@minimaltech/ra-core-infra';
import { ProductApi } from '@/entities/product';

export function useProductFilter() {
  const productApi = useInjectable<ProductApi>({ key: 'services.ProductApi' });
  // Use productApi...
}
```

**In Entities:**
```typescript
// entities/product/model/useProducts.ts
import { useInjectable } from '@minimaltech/ra-core-infra';
import { ProductApi } from '../api/productApi';

export function useProducts() {
  const productApi = useInjectable<ProductApi>({ key: 'services.ProductApi' });
  return useQuery(['products'], () => productApi.find());
}
```

::: tip Service Access
Services registered in the DI container are global infrastructure - they can be accessed from any layer using `useInjectable`.
:::

### Cross-Slice Communication Rules

FSD enforces strict dependency rules to prevent coupling:

**✅ Valid Imports (Higher → Lower):**
```typescript
// features/auth → entities/user (higher → lower)
import { useUser } from '@/entities/user';  ✅

// pages/product-list → widgets/product-grid (higher → lower)
import { ProductGrid } from '@/widgets/product-grid';  ✅

// features/cart → entities/product (higher → lower)
import { useProducts } from '@/entities/product';  ✅

// Any layer → shared (any → shared)
import { Button } from '@/shared/ui/Button';  ✅
```

**❌ Invalid Imports (Same Layer or Lower → Higher):**
```typescript
// features/auth → features/cart (same layer)
import { useCart } from '@/features/cart';  ❌ FORBIDDEN!

// entities/user → features/auth (lower → higher)
import { LoginForm } from '@/features/auth';  ❌ FORBIDDEN!

// widgets/header → pages/home (lower → higher)
import { HomePage } from '@/pages/home';  ❌ FORBIDDEN!
```

**Solutions for Same-Layer Communication:**

**Option 1: Extract shared logic to `entities/`**
```typescript
// ❌ Problem: features/cart needs features/auth
// features/cart/model/useCart.ts
import { useAuth } from '@/features/auth';  // FORBIDDEN!

// ✅ Solution: Extract to entities/session
// entities/session/model/useSession.ts
export function useSession() {
  return { user, cart, /* ... */ };
}

// Now both features can import from entities/session
// features/cart/model/useCart.ts
import { useSession } from '@/entities/session';  ✅
```

**Option 2: Lift state to `app/`**
```typescript
// app/stores/globalStore.ts
export const globalStore = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
});

// Both features access global state
// features/auth/ and features/cart/ both use globalStore  ✅
```

**Option 3: Use events via `shared/lib/events`**
```typescript
// shared/lib/events/eventBus.ts
export const eventBus = createEventBus();

// features/auth emits event
eventBus.emit('user:logged-in', user);

// features/cart listens to event
eventBus.on('user:logged-in', (user) => { /* ... */ });
```

::: warning Common Mistake
Never import features from other features! This creates tight coupling and breaks FSD isolation principles.
:::

### Type Augmentation in FSD

Type definitions for `useInjectable` go in the root `types/` directory:

```typescript
// types/ra-core-infra.d.ts
import 'reflect-metadata';

declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    // Entity services
    'services.ProductApi': true;
    'services.UserApi': true;
    'services.OrderApi': true;
  }
}
```

## Naming Conventions

### FSD-Specific Conventions

| Type | Convention | Example |
|------|------------|---------|
| Slices (feature folders) | kebab-case | `product-catalog/`, `user-profile/` |
| Segments (technical folders) | lowercase | `ui/`, `model/`, `api/`, `lib/`, `config/` |
| Public API | Always `index.ts` | Every slice must have `index.ts` |
| Layers | lowercase | `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/` |

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard.tsx`, `LoginForm.tsx` |
| Hooks | camelCase with `use` prefix | `useProducts.ts`, `useAuth.ts` |
| Services (API) | PascalCase with `Api` suffix | `ProductApi.ts`, `UserApi.ts` |
| Types | PascalCase with `I` prefix (interfaces) | `IProduct`, `IUser` |
| Utils | camelCase | `formatCurrency.ts`, `validateEmail.ts` |
| Constants | UPPER_SNAKE_CASE | `API_TIMEOUT`, `MAX_RETRIES` |
| Public API | Always `index.ts` | `index.ts` (not `index.tsx`) |

### Directories

| Type | Convention | Example |
|------|------------|---------|
| FSD Slices | kebab-case | `product-catalog/`, `shopping-cart/` |
| FSD Segments | lowercase, singular | `ui/`, `model/`, `api/`, `lib/` |
| FSD Layers | lowercase, plural (except app, shared) | `pages/`, `widgets/`, `features/`, `entities/` |

### Components

```typescript
// ✅ Good
export function ProductCard({ product }: Props) { }
export function UserProfile({ user }: Props) { }

// ❌ Bad
export function productCard({ product }: Props) { }  // Wrong case
export function Product({ product }: Props) { }       // Too generic
```

### Services

```typescript
// ✅ Good
export class ProductApi extends BaseCrudService<IProduct> { }
export class UserService extends BaseService { }

// ❌ Bad
export class Product extends BaseCrudService<IProduct> { }  // No suffix
export class productApi extends BaseCrudService<IProduct> { }  // Wrong case
```

### Files Organization

```typescript
// ✅ Good - One export per file
// product-card.tsx
export function ProductCard() { }

// ❌ Bad - Multiple unrelated exports
// components.tsx
export function ProductCard() { }
export function UserProfile() { }
export function OrderStatus() { }
```

## Scaling with FSD

FSD naturally scales as your application grows. Here's how structure evolves:

### Small Application (< 5 Features)

Start with minimal layers:

```
src/
├── app/
│   ├── application.ts
│   ├── ApplicationContext.tsx
│   ├── providers/
│   ├── routes/
│   └── styles/
│
├── pages/
│   ├── home/
│   ├── products/
│   └── login/
│
├── features/
│   ├── auth/
│   ├── product-list/
│   └── product-form/
│
├── entities/
│   ├── product/
│   │   ├── ui/
│   │   ├── model/
│   │   ├── api/
│   │   └── index.ts
│   └── user/
│
└── shared/
    ├── ui/
    └── lib/
```

**When to use:**
- ✅ MVP or proof-of-concept
- ✅ Small team (1-3 developers)
- ✅ Single domain focus

---

### Medium Application (5-20 Features)

Add `widgets/` layer for reusable compositions:

```
src/
├── app/
│   ├── application.ts
│   ├── ApplicationContext.tsx
│   ├── providers/
│   │   ├── auth/
│   │   ├── data/
│   │   └── i18n/
│   ├── routes/
│   ├── locales/
│   └── styles/
│
├── pages/
│   ├── home/
│   ├── product-list/
│   ├── product-details/
│   ├── cart/
│   ├── checkout/
│   └── dashboard/
│
├── widgets/
│   ├── header/
│   ├── sidebar/
│   ├── product-grid/
│   └── cart-summary/
│
├── features/
│   ├── auth/
│   ├── product-catalog/
│   ├── product-filter/
│   ├── product-sort/
│   ├── add-to-cart/
│   ├── checkout-form/
│   ├── payment/
│   └── order-tracking/
│
├── entities/
│   ├── product/
│   ├── category/
│   ├── user/
│   ├── cart/
│   └── order/
│
└── shared/
    ├── ui/
    ├── api/
    ├── lib/
    └── config/
```

**When to use:**
- ✅ Production applications
- ✅ Medium team (4-10 developers)
- ✅ Multiple business domains

---

### Large Application (20+ Features)

Use `@x/` prefix for experimental features and organize by business domains:

```
src/
├── app/
│   ├── application.ts
│   ├── ApplicationContext.tsx
│   ├── providers/
│   ├── routes/
│   ├── stores/              # Global state
│   ├── locales/
│   └── styles/
│
├── pages/                   # 20+ pages
│   ├── home/
│   ├── catalog/
│   │   ├── product-list/
│   │   ├── product-details/
│   │   └── category-browse/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── account/
│       ├── profile/
│       ├── settings/
│       └── order-history/
│
├── widgets/                 # 10+ widgets
│   ├── header/
│   ├── sidebar/
│   ├── footer/
│   ├── product-grid/
│   ├── product-recommendations/
│   ├── cart-summary/
│   ├── order-timeline/
│   └── user-dashboard/
│
├── features/                # 20+ features
│   ├── @x/                  # Experimental features
│   │   ├── ai-recommendations/
│   │   └── ar-preview/
│   │
│   ├── auth/
│   ├── product-catalog/
│   ├── product-filter/
│   ├── product-search/
│   ├── product-compare/
│   ├── wishlist/
│   ├── reviews/
│   ├── ratings/
│   ├── shopping-cart/
│   ├── checkout/
│   ├── payment/
│   ├── shipping/
│   ├── order-tracking/
│   ├── notifications/
│   └── analytics/
│
├── entities/                # 10+ entities
│   ├── product/
│   ├── category/
│   ├── brand/
│   ├── user/
│   ├── cart/
│   ├── order/
│   ├── payment/
│   ├── shipping/
│   ├── review/
│   └── wishlist/
│
└── shared/
    ├── ui/                  # Design system
    ├── api/
    ├── lib/
    ├── config/
    └── hooks/
```

**When to use:**
- ✅ Enterprise applications
- ✅ Large teams (10+ developers)
- ✅ Complex business domains
- ✅ Multiple product lines

**FSD Best Practices for Scale:**
- Use `@x/` prefix for experimental features to isolate risk
- Create design system in `shared/ui/`
- Document public APIs with JSDoc/TSDoc
- Use monorepo for shared entities across products

## File Size Guidelines

| File Type | Recommended Max Lines | Action if Exceeded |
|-----------|----------------------|-------------------|
| Component | 200 lines | Split into smaller components |
| Hook | 100 lines | Split into multiple hooks |
| Service | 300 lines | Split into multiple services |
| Utility | 150 lines | Split by function category |

## Import Organization

Follow this import order for FSD:

```typescript
// 1. External dependencies (React, libraries)
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. @ra-core-infra imports
import { useInjectable } from '@minimaltech/ra-core-infra';

// 3. FSD Layer imports (from lower to higher layers - respecting dependency rules)
//    Import from: shared → entities → features → widgets → pages
import { Button } from '@/shared/ui/Button';
import { formatCurrency } from '@/shared/lib/format';

import { ProductApi, useProducts, IProduct } from '@/entities/product';
import { UserApi } from '@/entities/user';

import { ProductFilter } from '@/features/product-filter';
import { AddToCartButton } from '@/features/add-to-cart';

// 4. Relative imports (within same slice)
import { ProductListItem } from './ProductListItem';
import styles from './ProductListPage.module.css';

// 5. Types (if not imported with code)
import type { ComponentProps } from 'react';
```

**FSD Import Best Practices:**

✅ **Use public APIs (index.ts):**
```typescript
// ✅ Good - imports through public API
import { ProductCard, useProducts, IProduct } from '@/entities/product';

// ❌ Bad - direct imports bypass public API
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { useProducts } from '@/entities/product/model/useProducts';
```

✅ **Respect layer hierarchy:**
```typescript
// ✅ Good - higher layer imports from lower layer
// In features/product-filter/
import { useProducts } from '@/entities/product';  // feature → entity

// ❌ Bad - lower layer imports from higher layer
// In entities/product/
import { ProductFilter } from '@/features/product-filter';  // FORBIDDEN!
```

✅ **Use path aliases (@/) for cross-layer imports:**
```typescript
// ✅ Good - clear and maintainable
import { ProductCard } from '@/entities/product';

// ❌ Bad - brittle and hard to refactor
import { ProductCard } from '../../../entities/product';
```

## Best Practices

### ✅ Do

- **Use FSD layers correctly** - Respect the dependency hierarchy (app → pages → widgets → features → entities → shared)
- **Export through index.ts** - Every slice must have a public API via index.ts
- **Use path aliases (`@/`)** - For all cross-layer imports
- **Keep slices isolated** - Features at the same layer should never import from each other
- **Colocate by feature** - Keep ui/, model/, api/ together in the same slice
- **Name slices descriptively** - Use kebab-case (product-catalog, user-profile)
- **Document public APIs** - Add JSDoc comments to exported functions
- **Keep components focused** - Single responsibility principle
- **Use TypeScript strictly** - Define interfaces for all entities

### ❌ Don't

- **Don't violate layer hierarchy** - Never import from higher layers or same-layer slices
- **Don't bypass public APIs** - Always import through index.ts
- **Don't create deep nesting** - Max 3 levels: layer/slice/segment
- **Don't mix concerns** - Separate UI (ui/), logic (model/), and API (api/)
- **Don't use default exports** - Use named exports for better refactoring
- **Don't put business logic in components** - Extract to model/ segment
- **Don't skip type augmentation** - Add services to IUseInjectableKeysOverrides
- **Don't create circular dependencies** - Follow FSD dependency rules strictly

### FSD-Specific Tips

**Public API Pattern:**
```typescript
// entities/product/index.ts
// Export only what other layers need
export type { IProduct } from './model/product.types';
export { useProducts, useProduct } from './model/useProducts';
export { ProductApi } from './api/productApi';
export { ProductCard } from './ui/ProductCard';

// Don't export internal helpers
// ❌ export { formatProductPrice } from './lib/formatters';
```

**Slice Independence:**
```typescript
// ✅ Good - features are independent
features/
├── auth/           # Standalone authentication
├── product-filter/ # Standalone filtering
└── add-to-cart/    # Standalone cart logic

// ❌ Bad - features depend on each other
// features/cart imports from features/auth (FORBIDDEN!)
```

## Summary

Feature-Sliced Design with @ra-core-infra provides:

- **Enforced architecture** - FSD layers prevent spaghetti code
- **Scalable structure** - Grows naturally from 5 to 500+ features
- **Clear dependencies** - Explicit import rules prevent coupling
- **Team-friendly** - Multiple developers work on different slices without conflicts
- **DI integration** - Services registered in app/ accessible from all layers
- **Type safety** - Full TypeScript support with service type augmentation

## Next Steps

- **[Project Setup Guide](../getting-started/project-setup)** - Set up your first FSD project
- **[Architecture](./architecture)** - Understand the layered architecture
- **[Application Lifecycle](./application-lifecycle)** - Learn initialization flow
- **[Dependency Injection Guide](/guides/dependency-injection/)** - Deep dive into DI

**External Resources:**
- [Feature-Sliced Design Official](https://feature-sliced.design/)
- [FSD Concept Map](https://feature-slice-concept-map.netlify.app/)

---

**Ready to build?** Start with [project setup →](../getting-started/project-setup)

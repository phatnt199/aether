# Project Structure

A well-organized project structure makes your @ra-core-infra application maintainable and scalable. This guide explains the recommended folder organization and naming conventions.

## Recommended Structure

```
my-admin-app/
├── public/                         # Static assets
│   ├── favicon.ico
│   └── logo.png
│
├── src/
│   ├── application/                # Application layer (DI & config)
│   │   ├── application.ts          # Main app class (extends BaseRaApplication)
│   │   ├── ApplicationContext.tsx  # React context provider
│   │   │
│   │   ├── constants/              # Application-wide constants
│   │   │   ├── index.ts
│   │   │   ├── endpoints.ts        # API endpoint paths
│   │   │   ├── routes.ts           # Frontend routes
│   │   │   └── common.ts           # Common constants
│   │   │
│   │   ├── locales/                # Internationalization
│   │   │   ├── index.ts
│   │   │   ├── en.ts               # English translations
│   │   │   └── vi.ts               # Vietnamese translations
│   │   │
│   │   ├── providers/              # Custom provider implementations
│   │   │   ├── auth.provider.ts    # Custom auth provider
│   │   │   └── data.provider.ts    # Custom data provider
│   │   │
│   │   └── services/               # Business logic services
│   │       ├── base/               # Base service classes
│   │       │   └── base-crud.api.ts
│   │       └── apis/               # Domain API services
│   │           ├── product.api.ts
│   │           ├── user.api.ts
│   │           └── order.api.ts
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── ui/                     # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── modal.tsx
│   │   │
│   │   ├── features/               # Feature-specific components
│   │   │   ├── product-card.tsx
│   │   │   ├── user-profile.tsx
│   │   │   └── order-status.tsx
│   │   │
│   │   └── layout/                 # Layout components
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── footer.tsx
│   │
│   ├── screens/                    # Page-level components (routes)
│   │   ├── home/
│   │   │   ├── index.tsx
│   │   │   └── home.module.css
│   │   │
│   │   ├── products/
│   │   │   ├── index.tsx           # Product list
│   │   │   ├── create.tsx          # Create product
│   │   │   ├── edit.tsx            # Edit product
│   │   │   └── show.tsx            # Product details
│   │   │
│   │   ├── users/
│   │   │   ├── index.tsx
│   │   │   ├── create.tsx
│   │   │   └── edit.tsx
│   │   │
│   │   └── login/
│   │       └── index.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── api/                    # Data fetching hooks
│   │   │   ├── use-get-data.ts
│   │   │   ├── use-mutation-data.ts
│   │   │   └── use-products.ts
│   │   │
│   │   └── view/                   # UI/view hooks
│   │       ├── use-modal.ts
│   │       ├── use-toast.ts
│   │       └── use-pagination.ts
│   │
│   ├── redux/                      # Redux state management (optional)
│   │   ├── slices/
│   │   │   ├── theme.slice.ts
│   │   │   └── notifications.slice.ts
│   │   └── store.ts                # Redux store configuration
│   │
│   ├── libs/                       # Library configurations
│   │   ├── tanstack/
│   │   │   └── react-query.ts      # TanStack Query setup
│   │   └── router/
│   │       └── routes.tsx          # Route definitions
│   │
│   ├── interfaces/                 # TypeScript types & interfaces
│   │   ├── models/                 # Data models
│   │   │   ├── product.interface.ts
│   │   │   ├── user.interface.ts
│   │   │   └── order.interface.ts
│   │   │
│   │   └── api/                    # API types
│   │       ├── request.types.ts
│   │       └── response.types.ts
│   │
│   ├── utils/                      # Utility functions
│   │   ├── format.ts               # Formatting helpers
│   │   ├── validation.ts           # Validation helpers
│   │   └── date.ts                 # Date utilities
│   │
│   ├── styles/                     # Global styles
│   │   ├── globals.css
│   │   └── variables.css
│   │
│   ├── types/                      # Global type definitions
│   │   ├── env.d.ts                # Environment variables
│   │   └── ra-core-infra.d.ts      # Type augmentation
│   │
│   ├── App.tsx                     # Root component & routing
│   ├── main.tsx                    # Application entry point
│   └── vite-env.d.ts               # Vite types
│
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

## Directory Explanations

### `/application` - Application Layer

**Purpose**: Core application configuration, DI setup, and business services

**Key files**:
- `application.ts` - Main application class where services are registered
- `ApplicationContext.tsx` - React context provider that wraps the app
- `constants/` - Centralized constants (endpoints, routes, common values)
- `locales/` - Translation files for internationalization
- `providers/` - Custom provider implementations
- `services/apis/` - API service classes

**Example - `application.ts`**:
```typescript
export class RaApplication extends BaseRaApplication {
  bindContext() {
    // Register all services here
    this.service(ProductApi);
    this.service(UserApi);
  }
}
```

### `/components` - UI Components

**Purpose**: Reusable UI components organized by type

**Subdirectories**:
- `ui/` - Base components (buttons, inputs, cards, modals)
- `features/` - Feature-specific components (ProductCard, UserProfile)
- `layout/` - Layout components (Header, Sidebar, Footer)

**Naming convention**: `kebab-case.tsx`

**Example**:
```typescript
// components/features/product-card.tsx
export function ProductCard({ product }: { product: IProduct }) {
  return <div>...</div>;
}
```

### `/screens` - Pages

**Purpose**: Page-level components that map to routes

**Organization**: One folder per resource/feature

**Example structure**:
```
screens/
├── products/
│   ├── index.tsx      // List view (/products)
│   ├── create.tsx     // Create view (/products/create)
│   ├── edit.tsx       // Edit view (/products/:id/edit)
│   └── show.tsx       // Detail view (/products/:id)
```

### `/hooks` - Custom Hooks

**Purpose**: Reusable React hooks

**Subdirectories**:
- `api/` - Data fetching and mutation hooks
- `view/` - UI/view-related hooks

**Example - `hooks/api/use-products.ts`**:
```typescript
export function useProducts() {
  const productApi = useInjectable<ProductApi>({
    key: 'services.ProductApi'
  });

  return useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.find()
  });
}
```

### `/interfaces` - TypeScript Types

**Purpose**: Centralized type definitions

**Subdirectories**:
- `models/` - Domain models (Product, User, Order)
- `api/` - API request/response types

**Example - `interfaces/models/product.interface.ts`**:
```typescript
export interface IProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
}
```

### `/utils` - Utilities

**Purpose**: Pure helper functions (no React dependencies)

**Examples**:
- `format.ts` - Currency, date formatting
- `validation.ts` - Form validation
- `string.ts` - String manipulation

### `/types` - Global Types

**Purpose**: Global type definitions and augmentation

**Files**:
- `env.d.ts` - Environment variable types
- `ra-core-infra.d.ts` - Type augmentation for @ra-core-infra

**Example - `types/ra-core-infra.d.ts`**:
```typescript
declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    'services.ProductApi': true;
    'services.UserApi': true;
  }
}
```

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase with `use` prefix | `useProducts.ts` |
| Services | PascalCase with suffix | `ProductApi.ts` |
| Interfaces | PascalCase with `I` prefix | `IProduct` |
| Utils | camelCase | `formatCurrency.ts` |
| Constants | UPPER_SNAKE_CASE | `API_TIMEOUT` |

### Directories

| Type | Convention | Example |
|------|------------|---------|
| All directories | kebab-case | `api-services/` |
| Plurals for collections | Use plurals | `components/`, `screens/` |

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

## Scaling Patterns

### Small Application (< 10 Resources)

```
src/
├── application/
│   ├── application.ts
│   └── services/
│       └── apis/
│           ├── product.api.ts
│           └── user.api.ts
├── components/
│   └── ui/
├── screens/
│   ├── products/
│   └── users/
└── hooks/
```

### Medium Application (10-50 Resources)

```
src/
├── application/
│   ├── application.ts
│   ├── constants/
│   ├── locales/
│   ├── providers/
│   └── services/
│       ├── base/
│       └── apis/
│           ├── catalog/        # Group by domain
│           │   ├── product.api.ts
│           │   └── category.api.ts
│           └── users/
│               ├── user.api.ts
│               └── role.api.ts
├── components/
│   ├── ui/
│   └── features/
│       ├── catalog/
│       └── users/
└── screens/
    ├── catalog/
    └── users/
```

### Large Application (> 50 Resources)

Consider breaking into **feature modules**:

```
src/
├── modules/
│   ├── catalog/
│   │   ├── services/
│   │   ├── components/
│   │   ├── screens/
│   │   └── hooks/
│   │
│   ├── users/
│   │   ├── services/
│   │   ├── components/
│   │   ├── screens/
│   │   └── hooks/
│   │
│   └── orders/
│       ├── services/
│       ├── components/
│       ├── screens/
│       └── hooks/
│
└── shared/                    # Shared across modules
    ├── components/
    ├── hooks/
    └── utils/
```

## File Size Guidelines

| File Type | Recommended Max Lines | Action if Exceeded |
|-----------|----------------------|-------------------|
| Component | 200 lines | Split into smaller components |
| Hook | 100 lines | Split into multiple hooks |
| Service | 300 lines | Split into multiple services |
| Utility | 150 lines | Split by function category |

## Import Organization

Follow this import order:

```typescript
// 1. External dependencies (React, libraries)
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. @ra-core-infra imports
import { useInjectable } from '@minimaltech/ra-core-infra';

// 3. Application imports (using @ alias)
import { ProductApi } from '@/application/services/apis/product.api';
import { ROUTES } from '@/application/constants';

// 4. Relative imports
import { ProductCard } from './components/product-card';
import styles from './styles.module.css';

// 5. Types (separate or with code)
import type { IProduct } from '@/interfaces/models/product.interface';
```

## Best Practices

### ✅ Do

- Use path aliases (`@/`) for absolute imports
- Group related files in directories
- Keep components focused and small
- Colocate related files (component + styles + tests)
- Use index files for cleaner imports

### ❌ Don't

- Don't create deeply nested structures (max 3-4 levels)
- Don't mix concerns in a single file
- Don't use default exports (prefer named exports)
- Don't put business logic in components
- Don't skip TypeScript types

## Summary

A well-organized project structure provides:

✅ **Clear separation of concerns** - Each directory has a specific purpose
✅ **Easy navigation** - Developers can quickly find what they need
✅ **Scalability** - Structure grows naturally with the application
✅ **Maintainability** - Changes are localized and predictable

## Next Steps

- **[Architecture](./architecture)** - Understand the layered architecture
- **[Application Lifecycle](./application-lifecycle)** - Learn initialization flow
- **[Dependency Injection Guide](/guides/dependency-injection/)** - Deep dive into DI

---

**Ready to build?** Start with [dependency injection →](/guides/dependency-injection/)

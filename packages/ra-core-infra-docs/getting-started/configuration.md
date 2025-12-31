# Configuration

This guide covers how to configure your @ra-core-infra application with constants, environment variables, and best practices for managing configuration across different environments.

## Application Constants

Organize your configuration using constants to avoid magic strings and enable easy updates.

### Create Constants Structure

```bash
mkdir -p src/application/constants
```

### Endpoints Configuration

Create `src/application/constants/endpoints.ts`:

```typescript
/**
 * API Endpoints Configuration
 * Centralize all API endpoint paths
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const ENDPOINTS = {
  // Base API URL
  BASE_URL: API_BASE,

  // Authentication
  AUTH: {
    SIGN_IN: '/auth/sign-in',
    SIGN_UP: '/auth/sign-up',
    SIGN_OUT: '/auth/sign-out',
    WHOAMI: '/auth/whoami',
    REFRESH_TOKEN: '/auth/refresh-token',
  },

  // Resources
  PRODUCTS: '/products',
  USERS: '/users',
  ORDERS: '/orders',
  CATEGORIES: '/categories',

  // Custom endpoints
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_ACTIVITY: '/dashboard/recent-activity',
  },
} as const;

// Export type for TypeScript autocomplete
export type Endpoints = typeof ENDPOINTS;
```

### Routes Configuration

Create `src/application/constants/routes.ts`:

```typescript
/**
 * Application Routes Configuration
 * Centralize all frontend route paths
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Protected routes
  DASHBOARD: '/dashboard',

  // Resource routes
  PRODUCTS: {
    LIST: '/products',
    CREATE: '/products/create',
    EDIT: (id: string | number) => `/products/${id}/edit`,
    SHOW: (id: string | number) => `/products/${id}`,
  },

  USERS: {
    LIST: '/users',
    CREATE: '/users/create',
    EDIT: (id: string | number) => `/users/${id}/edit`,
    SHOW: (id: string | number) => `/users/${id}`,
  },

  ORDERS: {
    LIST: '/orders',
    SHOW: (id: string | number) => `/orders/${id}`,
  },

  // Settings
  SETTINGS: {
    PROFILE: '/settings/profile',
    ACCOUNT: '/settings/account',
    SECURITY: '/settings/security',
  },
} as const;

// Export type
export type Routes = typeof ROUTES;
```

### Common Configuration

Create `src/application/constants/common.ts`:

```typescript
/**
 * Common Application Constants
 */

export const COMMON = {
  // Application
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Admin Panel',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],

  // Date formats
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  TIME_FORMAT: 'HH:mm:ss',

  // Timeouts (milliseconds)
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  DEBOUNCE_DELAY: 300,

  // Local storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: '@app/auth/token',
    USER_PREFERENCES: '@app/user/preferences',
    THEME: '@app/theme',
    LANGUAGE: '@app/language',
  },

  // Validation
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,

  // File upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
} as const;

// Export type
export type Common = typeof COMMON;
```

### Export All Constants

Create `src/application/constants/index.ts`:

```typescript
export * from './endpoints';
export * from './routes';
export * from './common';
```

## Using Constants in Your Application

### In Application Class

```typescript
import { BaseRaApplication, CoreBindings, IRestDataProviderOptions } from '@minimaltech/ra-core-infra';
import { ENDPOINTS } from './constants';

export class RaApplication extends BaseRaApplication {
  bindContext(): void {
    // Use constants for configuration
    this.bind<IRestDataProviderOptions>({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    }).toValue({
      url: ENDPOINTS.BASE_URL,
      noAuthPaths: [
        ENDPOINTS.AUTH.SIGN_IN,
        ENDPOINTS.AUTH.SIGN_UP,
        ENDPOINTS.PRODUCTS,
      ],
    });
  }
}
```

### In Components

```typescript
import { ROUTES, COMMON } from '@/application/constants';

export function ProductList() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>{COMMON.APP_NAME} - Products</h1>
      <button onClick={() => navigate(ROUTES.PRODUCTS.CREATE)}>
        Add Product
      </button>
      {/* ... */}
    </div>
  );
}
```

### In Services

```typescript
import { ENDPOINTS, COMMON } from '@/application/constants';

export class ProductApi extends BaseCrudService<IProduct> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected dataProvider: IDataProvider
  ) {
    super({
      scope: 'ProductApi',
      dataProvider,
      serviceOptions: {
        basePath: ENDPOINTS.PRODUCTS,
        timeout: COMMON.API_TIMEOUT,
      },
    });
  }
}
```

## Environment Variables

### Development (.env.development)

Create `.env.development`:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_ENDPOINT=/auth/sign-in
VITE_AUTH_CHECK_ENDPOINT=/auth/whoami

# Application
VITE_APP_NAME=Admin Panel (Dev)
VITE_APP_VERSION=1.0.0-dev

# Features
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_DEBUG_LOGS=true

# External Services
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
VITE_GOOGLE_ANALYTICS_ID=
```

### Production (.env.production)

Create `.env.production`:

```bash
# API Configuration
VITE_API_URL=https://api.production.com/api
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_ENDPOINT=/auth/sign-in
VITE_AUTH_CHECK_ENDPOINT=/auth/whoami

# Application
VITE_APP_NAME=Admin Panel
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_DEBUG_LOGS=false

# External Services
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
VITE_GOOGLE_ANALYTICS_ID=UA-XXXXX-X
```

### Accessing Environment Variables

```typescript
// In any TypeScript file
const apiUrl = import.meta.env.VITE_API_URL;
const isDevMode = import.meta.env.DEV;  // true in development
const isProdMode = import.meta.env.PROD; // true in production

// With fallback
const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');
```

### Type-Safe Environment Variables

Create `src/types/env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_AUTH_ENDPOINT: string;
  readonly VITE_AUTH_CHECK_ENDPOINT: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_DEVTOOLS: string;
  readonly VITE_ENABLE_DEBUG_LOGS: string;
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  readonly VITE_GOOGLE_ANALYTICS_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Now you get autocomplete and type checking for environment variables!

## Advanced Configuration Patterns

### Feature Flags

Create `src/application/constants/features.ts`:

```typescript
/**
 * Feature Flags Configuration
 * Enable/disable features based on environment
 */

export const FEATURES = {
  // Development features
  DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
  DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',

  // Application features
  AUTHENTICATION: true,
  MULTI_LANGUAGE: true,
  DARK_MODE: true,
  EXPORT_DATA: true,

  // Beta features
  BETA_DASHBOARD: import.meta.env.DEV,
  BETA_AI_ASSISTANT: false,

  // Payment features
  STRIPE_ENABLED: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY,
} as const;

// Helper function
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}
```

Usage:

```typescript
import { FEATURES, isFeatureEnabled } from '@/application/constants/features';

export function Dashboard() {
  return (
    <div>
      {isFeatureEnabled('BETA_DASHBOARD') && <BetaDashboard />}
      {FEATURES.DARK_MODE && <ThemeToggle />}
    </div>
  );
}
```

### Per-Environment Configuration

Create `src/application/config/index.ts`:

```typescript
interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  auth: {
    tokenKey: string;
    refreshEnabled: boolean;
  };
  features: {
    analytics: boolean;
    errorReporting: boolean;
  };
}

const development: AppConfig = {
  api: {
    baseUrl: 'http://localhost:3001/api',
    timeout: 60000,  // Longer timeout for debugging
  },
  auth: {
    tokenKey: '@app-dev/auth/token',
    refreshEnabled: false,
  },
  features: {
    analytics: false,
    errorReporting: false,
  },
};

const production: AppConfig = {
  api: {
    baseUrl: 'https://api.production.com/api',
    timeout: 30000,
  },
  auth: {
    tokenKey: '@app/auth/token',
    refreshEnabled: true,
  },
  features: {
    analytics: true,
    errorReporting: true,
  },
};

// Export config based on environment
export const config: AppConfig = import.meta.env.PROD ? production : development;
```

Usage:

```typescript
import { config } from '@/application/config';

console.log('API URL:', config.api.baseUrl);
console.log('Analytics enabled:', config.features.analytics);
```

## Best Practices

### 1. Never Hardcode Sensitive Data

❌ **Bad**:
```typescript
const apiKey = 'sk_live_1234567890';  // Never hardcode!
```

✅ **Good**:
```typescript
const apiKey = import.meta.env.VITE_API_KEY;
```

### 2. Use Constants for Repeated Values

❌ **Bad**:
```typescript
fetch('http://localhost:3001/api/products');
// ... later in another file
fetch('http://localhost:3001/api/users');
```

✅ **Good**:
```typescript
import { ENDPOINTS } from '@/application/constants';

fetch(`${ENDPOINTS.BASE_URL}${ENDPOINTS.PRODUCTS}`);
fetch(`${ENDPOINTS.BASE_URL}${ENDPOINTS.USERS}`);
```

### 3. Provide Sensible Defaults

```typescript
const pageSize = parseInt(import.meta.env.VITE_PAGE_SIZE || '20');
const apiTimeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');
```

### 4. Document Your Configuration

Add comments to explain non-obvious configuration:

```typescript
export const COMMON = {
  // Cache TTL in milliseconds (5 minutes)
  CACHE_TTL: 5 * 60 * 1000,

  // Number of retry attempts before giving up
  MAX_RETRY_ATTEMPTS: 3,

  // Exponential backoff multiplier for retries
  RETRY_BACKOFF_MULTIPLIER: 2,
} as const;
```

## Testing Configuration

### Mock Environment Variables in Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Configuration', () => {
  beforeEach(() => {
    // Reset environment
    import.meta.env.VITE_API_URL = 'http://test-api.com';
  });

  it('should use correct API URL', () => {
    expect(ENDPOINTS.BASE_URL).toBe('http://test-api.com');
  });
});
```

## Summary

You now know how to:

✅ **Organize constants** in a structured way
✅ **Use environment variables** for different environments
✅ **Create type-safe configuration** with TypeScript
✅ **Implement feature flags** for conditional functionality
✅ **Follow best practices** for configuration management

## Next Steps

Configuration is complete! Now you're ready to:

- **[Learn Core Concepts](/core-concepts/)** - Understand the architecture
- **[Master Dependency Injection](/guides/dependency-injection/)** - Advanced DI patterns
- **[Build a Todo App](/tutorials/todo-app)** - Complete hands-on tutorial

---

**Ready to dive deeper?** Explore [core concepts →](/core-concepts/)

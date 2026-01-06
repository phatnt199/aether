# Project Setup

This guide will help you create a new Vite + React + TypeScript project with the recommended folder structure for @ra-core-infra applications.

## Create a New Vite Project

### Step 1: Initialize Project

Using Bun (recommended):

```bash
bun create vite my-admin-app --template react-ts
cd my-admin-app
```

Using npm:

```bash
npm create vite@latest my-admin-app -- --template react-ts
cd my-admin-app
```

### Step 2: Install Dependencies

Follow the [Installation Guide](./installation) to install @ra-core-infra and its dependencies.

Quick reference:

```bash
bun add @minimaltech/ra-core-infra@0.0.3-2 ra-core
bun add @venizia/ignis-inversion reflect-metadata
bun add @loopback/filter
bun add react react-dom react-router-dom
bun add -d prettier
```

## Recommended Folder Structure: Feature-Sliced Design

@ra-core-infra uses **Feature-Sliced Design (FSD)** - an architectural methodology that organizes code by business features rather than technical layers.

### FSD Quick Overview

**Layers (vertical hierarchy):**
```
app/       → Application initialization
pages/     → Route-level components
widgets/   → Composite UI blocks
features/  → Business features
entities/  → Business entities & data
shared/    → Shared infrastructure
```

**Dependency Rule:** Higher layers can import from lower layers, never the reverse.

### Complete FSD Structure for @ra-core-infra

Here's the full structure showing where framework components belong:

```
src/
├── app/                              # Layer 1: Application
│   ├── application.ts                # ⭐ RaApplication class (DI setup)
│   ├── ApplicationContext.tsx        # ⭐ React context provider
│   │
│   ├── providers/                    # ⭐ Provider configurations
│   │   ├── auth/
│   │   │   └── authProvider.ts       # Custom auth provider
│   │   ├── data/
│   │   │   └── dataProvider.ts       # Custom data provider
│   │   └── i18n/
│   │       └── i18nProvider.ts       # Custom i18n provider
│   │
│   ├── routes/                       # Route definitions
│   │   └── routes.tsx
│   │
│   ├── locales/                      # Internationalization
│   │   ├── index.ts
│   │   ├── en.ts
│   │   └── vi.ts
│   │
│   └── styles/                       # Global styles
│       ├── globals.css
│       └── variables.css
│
├── pages/                            # Layer 2: Pages
│   ├── home/
│   │   ├── ui/
│   │   │   └── HomePage.tsx
│   │   └── index.ts
│   │
│   ├── product-list/
│   │   ├── ui/
│   │   │   └── ProductListPage.tsx
│   │   └── index.ts
│   │
│   └── login/
│       ├── ui/
│       │   └── LoginPage.tsx
│       └── index.ts
│
├── widgets/                          # Layer 3: Widgets
│   ├── header/
│   │   ├── ui/
│   │   │   └── Header.tsx
│   │   └── index.ts
│   │
│   └── product-grid/
│       ├── ui/
│       │   └── ProductGrid.tsx
│       └── index.ts
│
├── features/                         # Layer 4: Features
│   ├── auth/
│   │   ├── ui/
│   │   │   ├── LoginForm.tsx
│   │   │   └── LogoutButton.tsx
│   │   ├── model/
│   │   │   └── useAuth.ts            # ⭐ Uses useInjectable
│   │   └── index.ts
│   │
│   ├── product-filter/
│   │   ├── ui/
│   │   │   └── FilterPanel.tsx
│   │   ├── model/
│   │   │   └── useProductFilter.ts
│   │   └── index.ts
│   │
│   └── add-to-cart/
│       ├── ui/
│       │   └── AddToCartButton.tsx
│       ├── model/
│       │   └── useAddToCart.ts
│       └── index.ts
│
├── entities/                         # Layer 5: Entities
│   ├── product/
│   │   ├── ui/
│   │   │   └── ProductCard.tsx
│   │   ├── model/
│   │   │   ├── product.types.ts
│   │   │   ├── useProducts.ts
│   │   │   └── useProduct.ts
│   │   ├── api/
│   │   │   └── productApi.ts         # ⭐ BaseCrudService
│   │   └── index.ts                  # Public API
│   │
│   ├── user/
│   │   ├── ui/
│   │   │   └── UserAvatar.tsx
│   │   ├── model/
│   │   │   ├── user.types.ts
│   │   │   └── useUsers.ts
│   │   ├── api/
│   │   │   └── userApi.ts            # ⭐ BaseCrudService
│   │   └── index.ts
│   │
│   └── order/
│       ├── ui/
│       │   └── OrderStatus.tsx
│       ├── model/
│       │   ├── order.types.ts
│       │   └── useOrders.ts
│       ├── api/
│       │   └── orderApi.ts           # ⭐ BaseCrudService
│       └── index.ts
│
└── shared/                           # Layer 6: Shared
    ├── ui/                           # Reusable components
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   └── index.ts
    │   ├── Input/
    │   │   ├── Input.tsx
    │   │   └── index.ts
    │   └── Card/
    │       ├── Card.tsx
    │       └── index.ts
    │
    ├── api/                          # Base API clients
    │   └── baseClient.ts
    │
    ├── lib/                          # Utility functions
    │   ├── format.ts
    │   ├── validation.ts
    │   └── date.ts
    │
    └── config/                       # Shared constants
        └── constants.ts
```

::: tip @ra-core-infra Integration
- **`app/application.ts`** - Extends `BaseRaApplication`, registers all services
- **`app/providers/`** - Custom provider implementations (auth, data, i18n)
- **`entities/*/api/`** - `BaseCrudService` implementations for data access
- **`**/model/`** - Hooks using `useInjectable` to access services
- **`index.ts`** - Every slice exports a public API for encapsulation
:::

::: tip Learn More
For detailed FSD layer explanations, see [Project Structure Guide](../core-concepts/project-structure)
:::


## Configure Vite

Update your `vite.config.ts` to include path aliases and proper port configuration:

```typescript
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,  // Automatically open browser
  },
});
```

::: tip Path Aliases
The `@` alias allows you to import from `src` without relative paths:

```typescript
// Instead of: import { ProductApi } from '../../../entities/product/api/productApi';
import { ProductApi } from '@/entities/product';  // Uses public API (index.ts)
```
:::

## Environment Variables

### Create .env File

Create a `.env` file in your project root:

```bash
# API Configuration
VITE_API_URL=https://fakestoreapi.com
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_ENDPOINT=/auth/sign-in
VITE_AUTH_CHECK_ENDPOINT=/auth/whoami

# Application
VITE_APP_NAME=My Admin App
VITE_APP_VERSION=1.0.0

# Development
VITE_DEBUG=true
```

### Create .env.example

Create `.env.example` as a template (commit this to git):

```bash
# API Configuration
VITE_API_URL=
VITE_API_TIMEOUT=30000

# Authentication
VITE_AUTH_ENDPOINT=/auth/sign-in
VITE_AUTH_CHECK_ENDPOINT=/auth/whoami

# Application
VITE_APP_NAME=
VITE_APP_VERSION=

# Development
VITE_DEBUG=false
```

::: warning .env Security
Never commit `.env` files with real credentials to version control. Add `.env` to your `.gitignore`:

```bash
echo ".env" >> .gitignore
```
:::

### Using Environment Variables

Access environment variables in your code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

## Update .gitignore

Ensure your `.gitignore` includes:

```bash
# Dependencies
node_modules/
.pnp/
.pnp.js

# Build
dist/
dist-ssr/
*.local

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
```

## Package.json Scripts

Update your `package.json` with useful scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

## Verify Setup

Test your setup by running the development server:

```bash
bun run dev
# or
npm run dev
```

You should see output like:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

## Understanding FSD Layers

Your FSD structure is organized into 6 layers, each with a specific purpose:

**Layer Hierarchy:**
```
app/       ─→ Application setup (DI, providers, routes)
pages/     ─→ Route-level screens
widgets/   ─→ Reusable UI compositions
features/  ─→ Business features
entities/  ─→ Business entities & data
shared/    ─→ Shared utilities
```

**Key FSD Principles:**

1. **Dependency Flow**: Higher layers can import from lower layers only
   ```typescript
   // ✅ Valid: page imports from entity
   import { useProducts } from '@/entities/product';

   // ❌ Invalid: entity imports from page
   import { ProductPage } from '@/pages/product-list';
   ```

2. **Slice Isolation**: Features at the same layer cannot import from each other
   ```typescript
   // ❌ Invalid: feature imports from another feature
   import { useAuth } from '@/features/auth';  // FORBIDDEN!
   ```

3. **Public API**: All slices export through `index.ts`
   ```typescript
   // ✅ Import through public API
   import { ProductApi } from '@/entities/product';

   // ❌ Don't bypass public API
   import { ProductApi } from '@/entities/product/api/productApi';
   ```

::: tip Learn More
For detailed FSD setup, code examples, and integration patterns, see:
- **[Project Structure Guide](../core-concepts/project-structure)** - Comprehensive FSD guide
- **[First Application](./first-application)** - Hands-on tutorial
:::



## Next Steps

Now that you understand FSD structure and setup:

- **[Project Structure Guide](../core-concepts/project-structure)** - Deep dive into FSD layers, integration patterns, and best practices
- **[Create Your First Application](./first-application)** - Build a minimal working app
- **[Configuration Guide](./configuration)** - Set up constants and configuration
- **[Architecture Overview](../core-concepts/architecture)** - Understand the layered architecture
- **[Dependency Injection Guide](/guides/dependency-injection/)** - Master DI patterns

**External FSD Resources:**
- [Feature-Sliced Design Official](https://feature-sliced.design/) - FSD methodology
- [FSD Concept Map](https://feature-slice-concept-map.netlify.app/) - Visual guide

---

**Ready to build?** Let's [create your first app →](./first-application)

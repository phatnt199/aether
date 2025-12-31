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
bun add @minimaltech/ra-core-infra ra-core
bun add @venizia/ignis-inversion reflect-metadata
bun add @loopback/filter
bun add react react-dom react-router-dom
```

## Recommended Folder Structure

Organize your project following this structure for scalability and maintainability:

```
src/
├── app/
│   ├── providers/
│   ├── routes/
│   ├── locales/
│   ├── services/
│   ├── models(entities)/
│   └── styles/
├── pages/
│   ├── home/
│   │   ├── ui/
│   │   └── index.ts
│   └── profile/
├── widgets/
│   └── header/
├── features/
│   ├── add-to-cart/
│   │   ├── ui/
│   │   ├── model/
│   │   ├── api/
│   │   └── index.ts
│   └── auth/
└── shared/
    ├── ui/
    ├── api/
    └── lib/

```


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
// Instead of: import { ProductService } from '../../../application/services/apis/product.api';
import { ProductService } from '@/application/services/apis/product.api';
```
:::

## Environment Variables

### Create .env File

Create a `.env` file in your project root:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api
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
    "type-check": "tsc --noEmit"
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

## Architecture Layers Explained

Understanding the folder structure:

### Application Layer (`src/application/`)

The **core** of your app where dependency injection is configured:

- **`application.ts`** - Extends `BaseRaApplication`, configures DI container
- **`providers/`** - Custom provider implementations (auth, data, i18n)

### Pages Layer (`src/pages/`)

Page-level components mapped to routes:

- Each screen is a top-level feature (Home, Products, Login)
- Screens compose components and hooks

### Widgets Layer (`src/widgets/`)
Widget is a block of UI that can be reused across pages

### features Layer (`src/features/`)
Feature-specific components and logic. A good indication of a new feature when it is used accross multiple pages

### shared Layer (`src/shared/`)
Shared components and logic across the app

### Dependency rules (import flow)
- Top → Down Only: App → Pages → Widgets → Features → Entities → Shared
- Same Layer: Slices cannot import from each other
- Lower Risk: The lower the layer, the riskier changes become (more dependents)
- Public API: All imports go through index.ts/js files



## Next Steps

Now that your project structure is ready:

- **[Feature slice architecture](https://feature-sliced.design/)** FSD - a pattern for building scalable and maintainable software
- **[Feature slice architecture concept map](https://feature-slice-concept-map.netlify.app/)** Read concepts and patterns in a visual way
- **[Create Your First Application](./first-application)** - Build a minimal working app
- **[Configuration Guide](./configuration)** - Set up constants and configuration
- **Skip to [Core Concepts](/core-concepts/)** - Understand the architecture

---

**Project structure ready?** Let's [build your first app →](./first-application)

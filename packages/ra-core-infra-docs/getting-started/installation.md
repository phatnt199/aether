# Installation

This guide will walk you through installing @ra-core-infra and its dependencies, then configuring TypeScript to support decorators.

## System Requirements

Before installing, ensure your system meets these requirements:

- **Node.js 18+** or **Bun 1.0+**
- **React 18+**
- **TypeScript 5.0+**
- **Modern browser** (ES2020+ support)

## Package Installation

### Using Bun (Recommended)

@ra-core-infra works great with Bun for faster installation and execution:

```bash
# Core dependencies (required)
bun add @minimaltech/ra-core-infra ra-core
bun add @venizia/ignis-inversion reflect-metadata
bun add -d @loopback/filter
bun add react react-dom
```

### Using npm

```bash
# Core dependencies (required)
npm install @minimaltech/ra-core-infra ra-core
npm install @venizia/ignis-inversion reflect-metadata
npm install --save-dev @loopback/filter
npm install react react-dom
```

## Understanding the Dependencies

Let's break down what each dependency does:

### Core Framework

- **`@minimaltech/ra-core-infra`** - The main framework
- **`ra-core`** - React Admin core library (UI components and hooks)
- **`react`** + **`react-dom`** - React framework

### Dependency Injection

- **`@venizia/ignis-inversion`** - Lightweight DI container
- **`reflect-metadata`** - Required for TypeScript decorator metadata

::: warning CRITICAL: Import reflect-metadata First
You must import `reflect-metadata` before any other imports in your entry file:

```typescript
import 'reflect-metadata'; // Must be first!
import React from 'react';
// ... other imports
```

Forgetting this will cause decorator errors. See [Troubleshooting](/troubleshooting/reflect-metadata) for details.
:::

### Data Filtering

- **`@loopback/filter`** - Advanced query filter syntax

## TypeScript Configuration

@ra-core-infra uses TypeScript decorators, which require specific compiler options.

### Step 1: Configure tsconfig.json

Create or update your `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "emitDecoratorMetadata": true,    // Required for DI
    "experimentalDecorators": true,   // Required for DI
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]  // Optional: Path aliases
    }
  }
}
```

Alternative `tsconfig.json` for Vite: using Ignis-dev config

### Step 2: Configure tsconfig.app.json

Create `tsconfig.app.json` for your application code:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Decorators - CRITICAL */
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src"]
}
```

::: tip Decorator Options
Both `experimentalDecorators` and `emitDecoratorMetadata` must be `true`. These options enable:
- **experimentalDecorators**: Allows using `@decorator` syntax
- **emitDecoratorMetadata**: Emits type information for dependency injection
:::

### Step 3: Configure tsconfig.node.json

Create `tsconfig.node.json` for build tooling (Vite config, etc.):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

## Optional Dependencies

Depending on your use case, you might want these additional packages:

### Routing

```bash
bun add react-router-dom  # For multi-page apps
```

### State Management

```bash
bun add @tanstack/react-query          # Server state (recommended)
bun add @tanstack/react-query-devtools # Dev tools

bun add @reduxjs/toolkit react-redux   # Global client state (optional)
```

### HTTP Client (if not using Fetch)

```bash
bun add axios  # Alternative to native Fetch API
```

### Forms & Validation

```bash
bun add react-hook-form    # Form state management
bun add @hookform/resolvers zod  # Validation with Zod
```

### UI Libraries

```bash
# Example: Tailwind CSS
bun add tailwindcss @tailwindcss/vite
bun add class-variance-authority clsx tailwind-merge

# Example: Icons
bun add lucide-react
```

## Verification

Verify your installation is correct:

### Step 1: Check package.json

Your `package.json` should include at minimum:

```json
{
  "dependencies": {
    "@loopback/filter": "^x.x.x",
    "@minimaltech/ra-core-infra": "^x.x.x",
    "@venizia/ignis-inversion": "^x.x.x",
    "ra-core": "^5.x.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "reflect-metadata": "^x.x.x"
  },
  "devDependencies": {
    "@types/react": "^18.x.x",
    "@types/react-dom": "^18.x.x",
    "typescript": "^5.x.x"
  }
}
```

### Step 2: Test TypeScript Configuration

Create a test file `src/test.ts`:

```typescript
import 'reflect-metadata';

function TestDecorator() {
  return function (target: any) {
    console.log('Decorator works!');
  };
}

@TestDecorator()
class TestClass {}
```

If this compiles without errors, your TypeScript configuration is correct!

### Step 3: Test Import

Create a test file to verify the package imports:

```typescript
import 'reflect-metadata';
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';

console.log('Import successful!', BaseRaApplication, CoreBindings);
```

Run with:

```bash
bun run src/test.ts
# or
npx tsx src/test.ts
```

## Troubleshooting

### Common Issues

#### "Cannot find module '@minimaltech/ra-core-infra'"

**Solution**: Ensure you ran the installation command. Try:

```bash
rm -rf node_modules bun.lockb  # or package-lock.json
bun install
```

#### "experimentalDecorators is not enabled"

**Solution**: Check that `tsconfig.json` and `tsconfig.app.json` both have:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

#### "reflect-metadata must be imported"

**Solution**: Add `import 'reflect-metadata';` as the **very first line** in your entry file (e.g., `src/main.tsx`).

For more issues, see the [Troubleshooting Guide](/troubleshooting/).

## Next Steps

Now that you have everything installed and configured:

- **Continue to [Project Setup](./project-setup)** to create your project structure
- **Skip to [First Application](./first-application)** if you already have a project
- **Read [Core Concepts](/core-concepts/)** to understand the architecture

---

**Installation complete?** Let's [set up your project →](./project-setup)

# Getting Started

Welcome to @ra-core-infra! This guide will help you set up and build your first React Admin application with dependency injection in under 30 minutes.

## What You'll Learn

By the end of this section, you'll know how to:

- Install @ra-core-infra and its dependencies
- Set up a new Vite + React + TypeScript project
- Create your first application with dependency injection
- Configure data providers, auth providers, and services
- Run a working CRUD application

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** or **Bun 1.0+** installed
- Basic knowledge of **React** and **TypeScript**
- Familiarity with **REST APIs** (helpful but not required)
- A code editor (we recommend **VS Code** or **WebStorm**)

## Learning Path

Follow these pages in order for the smoothest experience:

### 1. [Installation](./installation)
Install @ra-core-infra and configure TypeScript with decorator support.

**Time**: ~5 minutes

### 2. [Project Setup](./project-setup)
Create a new Vite project and set up the recommended folder structure.

**Time**: ~5 minutes

### 3. [First Application](./first-application)
Build a minimal working application to understand the basics.

**Time**: ~15 minutes

### 4. [Configuration](./configuration)
Configure your application with constants, environment variables, and path aliases.

**Time**: ~5 minutes

## Quick Start (For Experienced Developers)

If you're already familiar with React Admin and TypeScript, you can get started quickly:

```bash
# 1. Install dependencies
bun install @minimaltech/ra-core-infra @venizia/ignis-inversion reflect-metadata @loopback/filter ra-core react react-dom

# 2. Create application class
import 'reflect-metadata';
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';

class App extends BaseRaApplication {
  bindContext(): void {
        // Bind REST data provider options
        this.bind<IRestDataProviderOptions>({
            key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
        }).toValue({
            url: import.meta.env.VITE_API_URL || 'https://fakestoreapi.com',
            noAuthPaths: ['/products', '/users'],
        });

        // Bind the default REST data provider
        this.bind({
            key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
        }).toClass(DefaultRestDataProvider)
            .setScope(BindingScopes.SINGLETON);

        // Bind application services
        this.bind({ key: 'services.ProductApi' })
            .toClass(ProductApi)
            .setScope(BindingScopes.SINGLETON);
    }
}

const app = new App();
await app.start();

# 3. Use in React
// ... wrap with CoreApplicationContext
```

For detailed explanations, continue with the full guides.

## Alternative Paths

### Coming from React Admin?

If you're migrating from React Admin, check out our [Migration Guide](/migration/from-react-admin) to understand the differences and migration strategies.

### Want a Tutorial Instead?

Prefer learning by building a complete app? Try our [Todo App Tutorial](/tutorials/todo-app) for a hands-on experience.

## Getting Help

If you encounter issues during setup:

1. Check the [Troubleshooting Guide](/troubleshooting/)
2. Search existing [GitHub Issues](https://github.com/phatnt199/aether/issues)
3. Ask in [GitHub Discussions](https://github.com/phatnt199/aether/discussions)

## What's Next?

Ready to install? Let's start with [Installation →](./installation)

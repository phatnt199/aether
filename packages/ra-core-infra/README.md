# @minimaltech/ra-core-infra

Minimal Technology ReactJS Core Infrastructure - A React Admin Core framework built on LoopBack 4 for browser applications.

## 🚀 Quick Start

### Installation

```bash
npm install @minimaltech/ra-core-infra @loopback/context @loopback/filter
# or
yarn add @minimaltech/ra-core-infra @loopback/context @loopback/filter
# or
pnpm add @minimaltech/ra-core-infra @loopback/context @loopback/filter
```

### Browser Setup (Required for Vite!)

Since this package uses LoopBack 4 (which requires Node.js APIs), you need to install and configure polyfills:

**1. Install the polyfill plugin:**

```bash
npm install -D vite-plugin-node-polyfills
# or
yarn add -D vite-plugin-node-polyfills
# or
pnpm add -D vite-plugin-node-polyfills
```

**2. Configure your `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
});
```

**That's it!** The plugin automatically handles all Node.js polyfills (Buffer, process, global).

**📖 [Complete Vite Setup Guide](./VITE_SETUP.md)** | [Browser Compatibility](https://github.com/phatnt199/aether/wiki/Browser-Compatibility-Setup)

## Customization

### Hooks

#### `useInjectable`

If you're using TypeScript, you'll need to specify your new keys, using [module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation).

```typescript
declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    ['services.yourServices']: true;
  }
}
```

## 📚 Documentation

- [Browser Compatibility Setup](https://github.com/phatnt199/aether/wiki/Browser-Compatibility-Setup) - **Read this first!**
- [Project WIKI](https://github.com/phatnt199/aether/wiki)

## ⚡ Features

- 🎯 React Admin Core integration
- 💉 Dependency Injection with LoopBack 4
- 🔍 Advanced data filtering
- 🌐 Browser-compatible (with polyfills)
- 📦 Tree-shakeable ES modules
- 🌍 i18n support

## 🛠️ Tech Stack

- React 18+
- React Admin Core 5+
- LoopBack 4 (Context & Filter)
- TypeScript

## 📦 What's Included

- **Base Applications**: Abstract application classes with DI
- **Providers**: Data providers, auth providers, i18n providers
- **Services**: Network services, CRUD services
- **Utilities**: Helper functions and utilities

## 🤝 Contributing

Please read the [Project WIKI](https://github.com/phatnt199/aether/wiki) for contribution guidelines.

## 📄 License

MIT - See LICENSE file for details

## 🐛 Issues

Report issues at [GitHub Issues](https://github.com/phatnt199/aether/issues)

---

Please checkout these references for more guiding:

- [Browser Setup Guide](https://github.com/phatnt199/aether/wiki/Browser-Compatibility-Setup) ⭐ **Important!**
- [Project WIKI](https://github.com/phatnt199/aether/wiki)

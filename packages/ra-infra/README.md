# @minimaltech/ra-infra

Minimal Technology ReactJS Infrastructure - A React Admin framework built on LoopBack 4 for browser applications.

## 🚀 Quick Start

### Installation

```bash
npm install @minimaltech/ra-infra @loopback/context @loopback/filter
# or
yarn add @minimaltech/ra-infra @loopback/context @loopback/filter
# or
pnpm add @minimaltech/ra-infra @loopback/context @loopback/filter
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

**📖 [Complete Vite Setup Guide](./VITE_SETUP.md)** | [Browser Compatibility](https://github.com/phatnt199/ra-infra/wiki/Browser-Compatibility-Setup)

## 📚 Documentation

- [Browser Compatibility Setup](https://github.com/phatnt199/ra-infra/wiki/Browser-Compatibility-Setup) - **Read this first!**
- [Project WIKI](https://github.com/phatnt199/ra-infra/wiki)

## ⚡ Features

- 🎯 React Admin integration
- 💉 Dependency Injection with LoopBack 4
- 🔍 Advanced data filtering
- 🌐 Browser-compatible (with polyfills)
- 📦 Tree-shakeable ES modules
- 🎨 Material-UI components
- 🌍 i18n support

## 🛠️ Tech Stack

- React 18+
- React Admin 5+
- LoopBack 4 (Context & Filter)
- Material-UI 5+
- TypeScript

## 📦 What's Included

- **Base Applications**: Abstract application classes with DI
- **Providers**: Data providers, auth providers, i18n providers
- **UI Components**: Custom React Admin components
- **Services**: Network services, CRUD services
- **Utilities**: Helper functions and utilities

## 🤝 Contributing

Please read the [Project WIKI](https://github.com/phatnt199/ra-infra/wiki) for contribution guidelines.

## 📄 License

MIT - See LICENSE file for details

## 🐛 Issues

Report issues at [GitHub Issues](https://github.com/phatnt199/ra-infra/issues)

---

Please checkout these references for more guiding:

- [Browser Setup Guide](https://github.com/phatnt199/ra-infra/wiki/Browser-Compatibility-Setup) ⭐ **Important!**
- [Project WIKI](https://github.com/phatnt199/ra-infra/wiki)

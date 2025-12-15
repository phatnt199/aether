# @minimaltech/ra-core-infra

Minimal Technology ReactJS Core Infrastructure - A React Admin Core framework built on Venizia and LoopBack 4 for browser applications.

## 🚀 Quick Start

### Installation

```bash
npm install @minimaltech/ra-core-infra @venizia/ignis-inversion @loopback/filter reflect-metadata
# or
yarn add @minimaltech/ra-core-infra @venizia/ignis-inversion @loopback/filter reflect-metadata
# or
pnpm add @minimaltech/ra-core-infra @venizia/ignis-inversion @loopback/filter reflect-metadata
# or
bun add @minimaltech/ra-core-infra @venizia/ignis-inversion @loopback/filter reflect-metadata
```

### Setup (Required)

Since this package uses reflect-metadata, you need to configure:

**Configure your `application.ts`:**

```typescript
import 'reflect-metadata';
```

### Customization

#### Hooks

##### `useInjectable`

If you're using TypeScript, you'll need to specify your new keys, using [module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation).

```typescript
declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides {
    ['services.yourServices']: true;
  }
}
```

##### `useTranslate`

If you're need to `useTranslate` with key suggestion from your language files.

```typescript
declare module '@minimaltech/ra-core-infra' {
  interface IUseTranslateKeysOverrides
    extends Record<TFullPaths<typeof yourEnglishMessages>, unknown> {}
}
```

Usage:

```typescript
import { useTranslate } from '@minimaltech/ra-core-infra';
```

## 📚 Documentation

- [Setup](https://github.com/phatnt199/aether/wiki/Setup) - **Read this first!**
- [Project WIKI](https://github.com/phatnt199/aether/wiki)

## ⚡ Features

- 🎯 React Admin Core integration
- 💉 Dependency Injection with Venizia
- 🔍 Advanced data filtering
- 🌐 Browser-compatible
- 📦 Tree-shakeable ES modules
- 🌍 i18n support

## 🛠️ Tech Stack

- React 18+
- React Admin Core 5+
- LoopBack 4 (Context)
- Venizia (Ignis Inversion)
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

- [Setup Guide](https://github.com/phatnt199/aether/wiki/Setup) ⭐ **Important!**
- [Project WIKI](https://github.com/phatnt199/aether/wiki)

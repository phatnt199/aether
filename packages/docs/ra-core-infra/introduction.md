# Introduction

## What is @ra-core-infra?

**@ra-core-infra** (React Admin Core Infrastructure) is a TypeScript framework for building production-ready admin applications in React. It combines the power of **React Admin** with **dependency injection**, **advanced data filtering**, and a **clean architectural pattern** to create maintainable, testable, and scalable applications.

Unlike traditional React approaches where business logic scatters across components, @ra-core-infra promotes a **service-oriented architecture** where concerns are clearly separated:

- **Application Layer** - Manages dependency injection and service registration
- **Provider Layer** - Abstracts data access, authentication, and internationalization
- **Service Layer** - Contains business logic and API communication
- **UI Layer** - Pure React components that consume services via hooks

## Key Value Propositions

### 1. Dependency Injection with Venizia

Built on **Venizia's Ignis Inversion** container, @ra-core-infra brings enterprise-grade dependency injection to React:

- **Type-safe injection** with TypeScript decorators
- **Multiple scopes** - Singleton, transient, and custom scopes
- **React integration** - Use services in components via `useInjectable` hook
- **Testability** - Easily mock services for unit and integration tests
- **Modularity** - Swap implementations without changing application code

### 2. Advanced Data Filtering

Integrates **LoopBack filter syntax** for powerful, database-like queries in the browser:

```typescript
// Complex queries made simple
productService.find({
  where: {
    active: true,
    price: { lt: 100 }
  },
  include: ['category', 'reviews'],
  order: ['createdAt DESC'],
  limit: 20,
  skip: 0
})
```

### 3. Type Safety Throughout

Full TypeScript support with advanced features:

- Decorator metadata for runtime reflection
- Type augmentation for service keys and translation strings
- Compile-time safety across all layers
- IntelliSense autocomplete for injected services

### 4. React Admin Compatible

Implements standard **React Admin provider interfaces**:

- **Data Provider** - `getList`, `getOne`, `create`, `update`, `delete`, `send`
- **Auth Provider** - `login`, `logout`, `checkAuth`, `checkError`, `getPermissions`
- **I18n Provider** - Multi-language support with Polyglot

This means you can use the entire React Admin ecosystem (components, hooks, utilities) while benefiting from @ra-core-infra's architecture.

### 5. Lightweight & Browser-Ready

- **< 50KB** bundle size with tree-shaking
- **Zero Node.js dependencies** - runs entirely in the browser
- **ES modules** for optimal bundling
- **No side effects** - dead code elimination friendly

### 6. Flexible Network Layer

Choose your HTTP client without changing application code:

- **AxiosNetworkRequest** - Full Axios feature set with interceptors
- **NodeFetchNetworkRequest** - Native Fetch API, lighter weight
- Custom implementations - Extend `BaseNetworkRequest` for specialized needs

## When to Use @ra-core-infra

### ✅ Perfect For:

- **Admin Panels & Dashboards** - CRUD operations, data tables, forms
- **Enterprise Applications** - Multiple services, complex business logic
- **Multi-tenant Systems** - Different configurations per tenant
- **Testable Codebases** - Applications requiring high test coverage
- **Scalable Architectures** - Applications that will grow over time

### ⚠️ Consider Alternatives If:

- **Simple Landing Pages** - Overkill for static content
- **No Server State** - If you don't need API communication
- **Already Using Similar DI** - If you have established patterns (e.g., InversifyJS)
- **SSR/SSG Required** - Limited server-side rendering support (browser-focused)

## Comparison with Alternatives

### vs React Admin (Plain)

| Feature | React Admin | @ra-core-infra |
|---------|-------------|----------------|
| Data Provider | ✅ Built-in | ✅ Enhanced with DI |
| Auth Provider | ✅ Built-in | ✅ Enhanced with DI |
| Service Layer | ❌ Manual | ✅ Built-in with DI |
| Type Safety | ⚠️ Partial | ✅ Full TypeScript |
| Testability | ⚠️ Moderate | ✅ High (DI mocking) |
| Bundle Size | ~150KB | ~50KB (core) |


### vs Building from Scratch

| Aspect | From Scratch | @ra-core-infra |
|--------|--------------|----------------|
| Setup Time | Days/Weeks | Hours |
| Architecture | Custom | Proven patterns |
| Auth Handling | Manual | Built-in |
| Data Fetching | Manual | Providers included |
| Testing Setup | Manual | DI-ready |
| Maintenance | High effort | Framework updates |

## Architecture Overview

@ra-core-infra follows a **layered architecture** pattern:

```
┌─────────────────────────────────────────────┐
│          React Components (UI)              │
│  ↓ useInjectable  ↓ useTranslate  ↓ hooks  │
├─────────────────────────────────────────────┤
│      Application Context (DI Container)     │
│         CoreApplicationContext              │
├─────────────────────────────────────────────┤
│              Providers Layer                │
│  DataProvider │ AuthProvider │ I18nProvider │
├─────────────────────────────────────────────┤
│              Services Layer                 │
│   ProductService │ UserService │ etc.       │
├─────────────────────────────────────────────┤
│            Network Layer                    │
│    AxiosNetworkRequest │ NodeFetchRequest   │
├─────────────────────────────────────────────┤
│              External APIs                  │
│         REST │ GraphQL │ etc.               │
└─────────────────────────────────────────────┘
```

### Data Flow Example

1. **Component** calls `productService.find()` via `useInjectable`
2. **Service** delegates to `dataProvider.send()`
3. **Provider** uses `networkRequest.doRequest()`
4. **Network layer** makes HTTP call with authentication headers
5. **Response** flows back up, transformed at each layer
6. **Component** receives typed data and renders

## Core Technologies

@ra-core-infra is built on top of:

- **[React Admin (ra-core)](https://marmelab.com/react-admin/)** - Admin UI framework
- **[Venizia](https://github.com/minimaltech/venizia)** - Lightweight DI container
- **[LoopBack Filter](https://loopback.io/doc/en/lb4/Querying-data.html)** - Advanced query syntax
- **[TypeScript 5+](https://www.typescriptlang.org/)** - Type safety and decorators
- **[React 18+](https://react.dev/)** - UI framework

### Optional Integrations

- **[Redux Toolkit](https://redux-toolkit.js.org/)** - Global state management
- **[TanStack Query](https://tanstack.com/query)** - Server state management
- **[Axios](https://axios-http.com/)** - HTTP client (alternative to Fetch)

## Next Steps

Ready to dive in? Here's your learning path:

1. **[Installation](/getting-started/installation)** - Set up your development environment
2. **[First Application](/getting-started/first-application)** - Build a minimal working app in 15 minutes
3. **[Core Concepts](/core-concepts/)** - Understand the architecture and lifecycle
4. **[Feature Guides](/guides/)** - Deep dive into DI, data providers, auth, and React integration

### Quick Links

- [GitHub Repository](https://github.com/phatnt199/aether/tree/main/packages/ra-core-infra)
- [NPM Package](https://www.npmjs.com/package/@minimaltech/ra-core-infra)
- [API Reference](/api-reference/)
- [Troubleshooting](/troubleshooting/)

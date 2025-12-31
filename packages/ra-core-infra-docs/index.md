---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "@ra-core-infra"
  text: "React Admin Core Infrastructure"
  tagline: Build production-ready admin apps with dependency injection, type safety, and advanced data handling
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: Introduction
      link: /introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/phatnt199/aether/tree/main/packages/ra-core-infra

features:
  - icon: 🎯
    title: Dependency Injection
    details: Clean service architecture powered by Venizia container. Type-safe injection with decorators, singleton/transient scopes, and React hooks integration.

  - icon: 🔍
    title: Advanced Data Filtering
    details: LoopBack-compatible queries for complex data operations. Supports where clauses, relations, includes, ordering, and pagination out of the box.

  - icon: 🛡️
    title: Type-Safe Development
    details: Full TypeScript support with decorator metadata, type augmentation, and compile-time safety. Catch errors before runtime.

  - icon: 🔌
    title: React Admin Compatible
    details: Seamlessly integrates with React Admin (ra-core) ecosystem. Implements standard data provider, auth provider, and i18n provider interfaces.

  - icon: ⚡
    title: Lightweight & Fast
    details: Under 50KB with tree-shakeable ES modules. No Node.js-specific APIs - runs entirely in the browser with zero backend dependencies.

  - icon: 🏗️
    title: Provider Architecture
    details: Multi-provider system for data, auth, and i18n. Easily swap implementations (Axios vs Fetch, JWT vs OAuth) without changing application code.
---

## Why @ra-core-infra?

Building admin panels in React often leads to tightly coupled code, scattered business logic, and difficult-to-test components. **@ra-core-infra** solves this with a clean, layered architecture that separates concerns and promotes maintainability.

### Perfect for:

- 🏢 **Enterprise Applications** - Scale with confidence using DI patterns and modular services
- 🚀 **Rapid Development** - Get CRUD functionality up and running in minutes with minimal boilerplate
- 🧪 **Testable Code** - Mock services easily with dependency injection for comprehensive testing
- 🌐 **Multi-tenant Apps** - Configure different services per tenant using the DI container

## Quick Preview

```typescript
// 1. Define your application with dependency injection
class RaApplication extends BaseRaApplication {
  bindContext() {
    // Configure data provider
    this.bind({ key: CoreBindings.REST_DATA_PROVIDER_OPTIONS })
      .toValue({ url: 'https://api.example.com' });

    // Register services
    this.service(ProductService);
    this.service(UserService);
  }
}

// 2. Use services in React components with type-safe hooks
function ProductList() {
  const productService = useInjectable<ProductService>({
    key: 'services.ProductService'
  });

  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.find({ where: { active: true } })
  });

  return <div>{/* Render products */}</div>;
}
```

## What's Inside?

- **BaseRaApplication** - DI container with lifecycle hooks for initialization
- **Data Providers** - REST API integration with LoopBack filters and network abstraction
- **Auth Providers** - JWT/OAuth authentication with token management and RBAC
- **CRUD Services** - Base service classes for standard database operations
- **React Hooks** - `useInjectable`, `useTranslate`, `useApplicationContext` for seamless integration
- **i18n Support** - Multi-language with Polyglot and type-safe translation keys
- **Network Layer** - Axios or Fetch implementations with request/response interceptors

## Ready to Build?

<div class="vp-doc" style="margin-top: 2rem;">
  <a href="/getting-started/installation" class="vp-button brand" style="margin-right: 1rem;">Installation Guide →</a>
  <a href="/getting-started/first-application" class="vp-button alt">First Application →</a>
</div>

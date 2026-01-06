# API Reference

Complete reference documentation for all public APIs in `@minimaltech/ra-core-infra`.

## Overview

This API reference provides detailed documentation for all classes, interfaces, hooks, utilities, and constants exported by @ra-core-infra. The library is organized into five main categories:

- **[Core](#core-apis)** - Application classes, bindings, and core types
- **[Providers](#provider-apis)** - Data, authentication, and i18n providers
- **[Services](#service-apis)** - Business logic and network services
- **[Hooks](#react-hooks)** - React hooks for DI and utilities
- **[Utilities](#utility-apis)** - Helper functions and error handling

## Quick Reference

Common APIs you'll use most frequently:

| API | Category | Purpose |
|-----|----------|---------|
| [useInjectable](/api-reference/hooks/use-injectable) | Hook | Inject services from DI container |
| [BaseRaApplication](/api-reference/core/base-ra-application) | Core | Application base class |
| [CoreBindings](/api-reference/core/core-bindings) | Core | DI binding constants |
| [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) | Provider | REST API integration |
| [BaseCrudService](/api-reference/services/base-crud-service) | Service | CRUD operations base class |
| [useTranslate](/api-reference/hooks/use-translate) | Hook | i18n translations |
| [DefaultAuthProvider](/api-reference/providers/default-auth-provider) | Provider | Authentication |

## Core APIs

Foundation classes for building your React Admin application.

### Application Classes

- **[BaseRaApplication](/api-reference/core/base-ra-application)** - Main application class with lifecycle hooks
- **[CoreBindings](/api-reference/core/core-bindings)** - Dependency injection binding constants
- **[Types](/api-reference/core/types)** - Core TypeScript types and interfaces

**Use case**: Setting up your application, configuring DI container, managing lifecycle.

## Provider APIs

Providers integrate with React Admin's architecture for data, auth, and i18n.

### Data Providers

- **[DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider)** - REST API data provider with LoopBack filters
- **[BaseProvider](/api-reference/providers/base-provider)** - Abstract base class for custom providers

### Authentication Providers

- **[DefaultAuthProvider](/api-reference/providers/default-auth-provider)** - JWT/token-based authentication
- **[BaseProvider](/api-reference/providers/base-provider)** - Base class for custom auth providers

### Internationalization Providers

- **[DefaultI18nProvider](/api-reference/providers/default-i18n-provider)** - Polyglot-based translations

**Use case**: Connecting to APIs, implementing authentication, adding translations.

## Service APIs

Service classes encapsulate business logic and infrastructure concerns.

### CRUD Services

- **[BaseCrudService](/api-reference/services/base-crud-service)** - Base class for CRUD operations
- **[BaseService](/api-reference/services/base-service)** - Simple service base with logging

### Infrastructure Services

- **[DefaultAuthService](/api-reference/services/default-auth-service)** - Token storage and management
- **[DefaultNetworkRequestService](/api-reference/services/default-network-request-service)** - HTTP request abstraction

**Use case**: Implementing domain logic, managing authentication state, customizing network layer.

## React Hooks

React hooks for accessing services and utilities.

### Dependency Injection Hooks

- **[useInjectable](/api-reference/hooks/use-injectable)** - Inject services from DI container
- **[useApplicationContext](/api-reference/hooks/use-application-context)** - Access DI container directly

### Feature Hooks

- **[useTranslate](/api-reference/hooks/use-translate)** - i18n translations
- **[Other Hooks](/api-reference/hooks/other-hooks)** - Utility hooks (debounce, autosave, clipboard, etc.)

**Use case**: Accessing services in components, translations, common UI patterns.

## Utility APIs

Helper functions for common operations.

### Error Handling

- **[Error Utilities](/api-reference/utilities/error-utilities)** - ApplicationError, getError, getClientError

### Data Utilities

- **[Other Utilities](/api-reference/utilities/other-utilities)** - Parse, boolean, and URL utilities

**Use case**: Error handling, data validation, URL manipulation.

## How to Use This Reference

### Finding What You Need

1. **Search**: Use the search bar (top right) to find specific APIs
2. **Browse by Category**: Use the sections above to explore by function
3. **Quick Reference**: Check the table above for commonly-used APIs
4. **Cross-Links**: Each API page links to related APIs

### Understanding API Pages

Each API documentation page follows this structure:

- **Import**: How to import the API
- **Signature**: TypeScript signature with types
- **Parameters**: Detailed parameter descriptions
- **Return Value**: What the API returns
- **Description**: What it does and when to use it
- **Examples**: Basic and advanced usage examples
- **Related APIs**: Links to related functionality
- **Common Issues**: Troubleshooting tips

### Code Examples

All code examples are:
- Written in TypeScript
- Tested and verified to work
- Copy-paste ready
- Include necessary imports

### Type Information

Type signatures use TypeScript notation:
- `T` - Generic type parameter
- `?` - Optional parameter
- `Promise<T>` - Async return value
- `T | U` - Union type (T or U)

## Search Tips

The search function (powered by VitePress) can find:
- API names (e.g., "useInjectable")
- Method names (e.g., "getList")
- Concepts (e.g., "dependency injection")
- Code snippets

**Pro tip**: Search for error messages to find troubleshooting guidance.

## API Stability

- **Stable APIs**: Most APIs are stable and follow semantic versioning
- **Experimental**: APIs marked as experimental may change
- **Deprecated**: Deprecated APIs show migration paths

## TypeScript Support

All APIs are written in TypeScript and include:
- Full type definitions
- Generic type support
- Type augmentation guides (for DI container)
- Strict type checking

## Next Steps

- **New to @ra-core-infra?** Start with [Getting Started](/getting-started/)
- **Building an app?** Check [First Application](/getting-started/first-application)
- **Need examples?** See [Tutorials](/tutorials/)
- **Having issues?** Visit [Troubleshooting](/troubleshooting/)

## Contributing

Found an error in the docs? Want to improve an example?

- [GitHub Repository](https://github.com/phatnt199/aether/tree/main/packages/ra-core-infra)
- [Report an Issue](https://github.com/phatnt199/aether/issues)

---

**Ready to dive in?** Start with [useInjectable](/api-reference/hooks/use-injectable), the most commonly-used API.

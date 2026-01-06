# Core Types

TypeScript type definitions and interfaces for @ra-core-infra.

## Import

```typescript
import type {
  // Primitive types
  IdType,
  AnyType,
  AnyObject,
  ValueOrPromise,

  // Provider interfaces
  IDataProvider,
  IAuthProvider,

  // Configuration
  IRestDataProviderOptions,
  IAuthProviderOptions,
  II18nProviderOptions,

  // Service interfaces
  ICrudService,

  // Application
  ICoreRaApplication,

  // Utility types
  TPaths,
  TFullPaths,
} from '@minimaltech/ra-core-infra';
```

## Overview

This page documents all TypeScript types and interfaces exported by @ra-core-infra. These types provide type safety, autocomplete, and documentation for the entire framework.

**Categories**:
- [Primitive Types](#primitive-types) - Basic type aliases
- [Utility Types](#utility-types) - Advanced TypeScript utilities
- [Provider Interfaces](#provider-interfaces) - Data, Auth, and i18n providers
- [Configuration Interfaces](#configuration-interfaces) - Provider configuration
- [Service Interfaces](#service-interfaces) - Service abstractions
- [Application Interfaces](#application-interfaces) - Application lifecycle
- [Request/Response Types](#request-response-types) - HTTP types
- [Path Types](#path-types) - Type-safe path generation

---

## Primitive Types

### IdType

Type for entity IDs (string or number).

```typescript
type IdType = string | number
```

**Usage**:

```typescript
interface User {
  id: IdType;  // Can be string or number
  name: string;
}

const userId: IdType = '123';        // ✓ OK
const numericId: IdType = 456;       // ✓ OK
const invalidId: IdType = true;      // ✗ Error
```

### AnyObject

Object with any properties.

```typescript
type AnyObject = Record<string | symbol | number, any>
```

**Usage**:
```typescript
const config: AnyObject = {
  apiUrl: 'https://api.example.com',
  timeout: 3000,
  [Symbol('custom')]: 'value',
};
```

---

### ValueOrPromise\<T\>

Value that can be synchronous or asynchronous.

```typescript
type ValueOrPromise<T> = T | Promise<T>
```

**Usage**:
```typescript
function getData(): ValueOrPromise<User> {
  if (cached) {
    return cachedUser;  // Return synchronously
  }
  return fetchUser();   // Return Promise
}
```

---

### ValueOf\<T\>

Extract all value types from an object.

```typescript
type ValueOf<T> = T[keyof T]
```

**Usage**:
```typescript
const Colors = {
  RED: 'red',
  GREEN: 'green',
  BLUE: 'blue',
} as const;

type Color = ValueOf<typeof Colors>;  // 'red' | 'green' | 'blue'
```

---

## Utility Types

### ValueOptional\<T, K\>

Make specific properties optional.

```typescript
type ValueOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
```

**Usage**:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// Make email and age optional
type UserInput = ValueOptional<User, 'email' | 'age'>;

const user: UserInput = {
  id: '123',
  name: 'John',
  // email and age are optional
};
```

---

### ValueOptionalExcept\<T, K\>

Make all properties optional except specified ones.

```typescript
type ValueOptionalExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>
```

**Usage**:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// Only id and name are required
type UserUpdate = ValueOptionalExcept<User, 'id' | 'name'>;

const update: UserUpdate = {
  id: '123',
  name: 'John',
  // email and age are optional
};
```

---

### TPrettify\<T\>

Format complex type for better IDE display.

```typescript
type TPrettify<T> = { [K in keyof T]: T[K] } & {}
```

**Usage**:
```typescript
type ComplexType = { a: string } & { b: number } & { c: boolean };

// Hard to read in IDE
// type ComplexType = { a: string } & { b: number } & { c: boolean }

type PrettyType = TPrettify<ComplexType>;

// Easy to read in IDE
// type PrettyType = { a: string; b: number; c: boolean }
```

---

## Provider Interfaces

### IDataProvider

Data provider interface for CRUD operations.

```typescript
interface IDataProvider<TResource extends string = string>
  extends IReactAdminDataProvider<TResource> {
  // React Admin methods
  getList<RecordType>(resource: TResource, params: GetListParams): Promise<GetListResult<RecordType>>;
  getOne<RecordType>(resource: TResource, params: GetOneParams): Promise<GetOneResult<RecordType>>;
  getMany<RecordType>(resource: TResource, params: GetManyParams): Promise<GetManyResult<RecordType>>;
  getManyReference<RecordType>(resource: TResource, params: GetManyReferenceParams): Promise<GetManyReferenceResult<RecordType>>;
  create<RecordType>(resource: TResource, params: CreateParams): Promise<CreateResult<RecordType>>;
  update<RecordType>(resource: TResource, params: UpdateParams): Promise<UpdateResult<RecordType>>;
  updateMany<RecordType>(resource: TResource, params: UpdateManyParams): Promise<UpdateManyResult<RecordType>>;
  delete<RecordType>(resource: TResource, params: DeleteParams): Promise<DeleteResult<RecordType>>;
  deleteMany<RecordType>(resource: TResource, params: DeleteManyParams): Promise<DeleteManyResult<RecordType>>;

  // Custom methods
  send<ReturnType>(opts: { resource: TResource; params: ISendParams }): Promise<ISendResponse<ReturnType>>;
  getNetworkService(): DefaultNetworkRequestService;
}
```

**Usage**:
```typescript
const dataProvider: IDataProvider = useInjectable({
  key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
});

const users = await dataProvider.getList('users', {
  pagination: { page: 1, perPage: 10 },
  sort: { field: 'name', order: 'ASC' },
  filter: {},
});
```

---

### IAuthProvider

Authentication provider interface.

```typescript
interface IAuthProvider extends IReactAdminAuthProvider {
  // React Admin methods
  login(params: any): Promise<{ redirectTo?: string | boolean } | void | any>;
  logout(params: any): Promise<void | false | string>;
  checkAuth(params: any): Promise<void>;
  checkError(error: any): Promise<void>;
  getIdentity?(params?: any): Promise<UserIdentity>;
  getPermissions(params: any): Promise<any>;

  // Custom methods
  getRoles(params?: any): Promise<Set<string>>;
}
```

**Usage**:
```typescript
const authProvider: IAuthProvider = useInjectable({
  key: CoreBindings.DEFAULT_AUTH_PROVIDER,
});

await authProvider.login({ username: 'admin', password: 'secret' });
const roles = await authProvider.getRoles();
console.log(roles.has('admin'));  // true
```

---

## Configuration Interfaces

### IRestDataProviderOptions

REST data provider configuration.

```typescript
interface IRestDataProviderOptions {
  url: string;                    // API base URL (required)
  noAuthPaths?: string[];         // Paths that don't require auth
  headers?: HeadersInit;          // Default headers
}
```

**Usage**:
```typescript
const options: IRestDataProviderOptions = {
  url: 'https://api.example.com',
  noAuthPaths: ['/auth/login', '/auth/register'],
  headers: {
    'X-App-Version': '1.0.0',
  },
};

this.container.bind({
  key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
  value: options,
});
```

---

### IAuthProviderOptions

Authentication provider configuration.

```typescript
interface IAuthProviderOptions {
  endpoints?: {
    afterLogin?: string;          // Redirect after login (default: '/')
  };
  paths?: {
    signIn?: string;              // Login endpoint (default: '/auth/login')
    signUp?: string;              // Signup endpoint
    checkAuth?: string;           // Token validation endpoint
  };
}
```

**Usage**:
```typescript
const authOptions: IAuthProviderOptions = {
  paths: {
    signIn: '/api/auth/login',
    checkAuth: '/api/auth/verify',
  },
  endpoints: {
    afterLogin: '/dashboard',
  },
};

this.container.bind({
  key: CoreBindings.AUTH_PROVIDER_OPTIONS,
  value: authOptions,
});
```

---

### II18nProviderOptions

Internationalization provider configuration.

```typescript
interface II18nProviderOptions {
  i18nSources?: Record<string | symbol, any>;  // Translation messages by locale
  listLanguages?: Locale[];                    // Available languages
}
```

**Usage**:
```typescript
import englishMessages from 'ra-language-english';
import frenchMessages from 'ra-language-french';

const i18nOptions: II18nProviderOptions = {
  i18nSources: {
    en: englishMessages,
    fr: frenchMessages,
  },
  listLanguages: [
    { locale: 'en', name: 'English' },
    { locale: 'fr', name: 'Français' },
  ],
};

this.container.bind({
  key: CoreBindings.I18N_PROVIDER_OPTIONS,
  value: i18nOptions,
});
```

---

## Service Interfaces

### ICrudService\<E\>

Generic CRUD service interface.

```typescript
interface ICrudService<E extends { id: IdType; [extra: string | symbol]: any }>
  extends IService {
  // Read operations
  find(filter: Filter<E>): Promise<Array<E & EntityRelationType>>;
  findById(id: IdType, filter: Filter<E>): Promise<E & EntityRelationType>;
  findOne(filter: Filter<E>): Promise<(E & EntityRelationType) | null>;
  count(where: Where<E>): Promise<{ count: number }>;

  // Write operations
  create(data: Omit<E, 'id'>): Promise<E>;
  updateAll(data: Partial<E>, where: Where<E>): Promise<{ count: number }>;
  updateById(id: IdType, data: Partial<E>): Promise<E>;
  replaceById(id: IdType, data: E): Promise<E>;
  deleteById(id: IdType): Promise<{ id: IdType }>;
}
```

**Usage**:
```typescript
interface User {
  id: IdType;
  name: string;
  email: string;
}

class UserService extends BaseCrudService<User> implements ICrudService<User> {
  // All CRUD methods are implemented by BaseCrudService
}
```

---

## Application Interfaces

### ICoreRaApplication

Application lifecycle interface.

```typescript
interface ICoreRaApplication {
  // Lifecycle methods
  preConfigure(): ValueOrPromise<void>;
  postConfigure(): ValueOrPromise<void>;
  bindContext(): ValueOrPromise<void>;
  start(): ValueOrPromise<void>;

  // Registration methods
  injectable<T>(scope: string, value: TClass<T>, tags?: string[]): void;
  service<T>(value: TClass<T>): void;
}
```

**Usage**:
```typescript
export class MyApplication extends BaseRaApplication implements ICoreRaApplication {
  bindContext() {
    super.bindContext();

    this.service(UserService);
    this.injectable('repositories', UserRepository);
  }

  async postConfigure() {
    console.log('Application configured');
  }
}
```

---

## Request/Response Types

### ISendParams

Parameters for custom HTTP requests.

```typescript
interface ISendParams {
  id?: string | number;                         // Resource ID (optional)
  method?: TRequestMethod;                      // HTTP method
  bodyType?: TRequestBodyType;                  // Body format (json, form-data, form-urlencoded)
  body?: any;                                   // Request body
  file?: any;                                   // File for upload
  query?: { [key: string]: any };               // Query parameters
  headers?: { [key: string]: string | number }; // Custom headers
  [key: string]: any;                           // Additional params
}
```

**Usage**:
```typescript
const params: ISendParams = {
  method: 'POST',
  bodyType: 'json',
  body: { name: 'John', email: 'john@example.com' },
  query: { notify: true },
};

const response = await dataProvider.send({
  resource: 'users',
  params,
});
```

---

### ISendResponse\<T\>

Response from custom HTTP requests.

```typescript
interface ISendResponse<T = AnyType> {
  data: T;                  // Response data
  [key: string]: any;       // Additional response fields
}
```

**Usage**:
```typescript
interface User {
  id: string;
  name: string;
}

const response: ISendResponse<User> = await dataProvider.send({
  resource: 'users',
  params: { id: '123', method: 'GET' },
});

const user: User = response.data;
```

---

### TRequestMethod

HTTP method type.

```typescript
type TRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```

**Usage**:
```typescript
const method: TRequestMethod = 'POST';

const params: ISendParams = {
  method: method,
  body: { /* ... */ },
};
```

---

### TRequestBodyType

Request body format type.

```typescript
type TRequestBodyType = 'json' | 'form-data' | 'form-urlencoded'
```

**Usage**:
```typescript
// JSON request
const jsonParams: ISendParams = {
  bodyType: 'json',
  body: { name: 'John' },
};

// File upload
const formParams: ISendParams = {
  bodyType: 'form-data',
  file: fileInput.files[0],
};

// URL-encoded form
const urlEncodedParams: ISendParams = {
  bodyType: 'form-urlencoded',
  body: { username: 'admin', password: 'secret' },
};
```

---

## Path Types

### TPaths\<T\>

Generate all possible paths in an object (including intermediate paths).

```typescript
type TPaths<T, DeepLevel extends number = 10> = // ... complex type
```

**Usage**:
```typescript
interface User {
  profile: {
    name: string;
    address: {
      street: string;
      city: string;
    };
  };
  settings: {
    theme: string;
  };
}

type UserPaths = TPaths<User>;
// 'profile' | 'profile.name' | 'profile.address' | 'profile.address.street' |
// 'profile.address.city' | 'settings' | 'settings.theme'

// Use for type-safe property access
function getProperty<T, P extends TPaths<T>>(obj: T, path: P) {
  // ... implementation
}

const user: User = { /* ... */ };
getProperty(user, 'profile.address.city');  // ✓ OK
getProperty(user, 'invalid.path');          // ✗ Error
```

---

### TFullPaths\<T\>

Generate only leaf paths in an object (excluding intermediate objects).

```typescript
type TFullPaths<T, DeepLevel extends number = 10> = // ... complex type
```

**Usage**:
```typescript
interface User {
  profile: {
    name: string;
    address: {
      street: string;
      city: string;
    };
  };
  settings: {
    theme: string;
  };
}

type UserLeafPaths = TFullPaths<User>;
// 'profile.name' | 'profile.address.street' | 'profile.address.city' | 'settings.theme'
// (Does NOT include 'profile', 'profile.address', or 'settings')

// Use for translation keys
type TranslationKeys = TFullPaths<typeof messages>;
```

**Translation example**:
```typescript
const messages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
  },
  users: {
    title: 'Users',
    fields: {
      name: 'Name',
      email: 'Email',
    },
  },
};

type MessageKeys = TFullPaths<typeof messages>;
// 'common.save' | 'common.cancel' | 'users.title' |
// 'users.fields.name' | 'users.fields.email'

function translate(key: MessageKeys): string {
  // Type-safe translation
}

translate('users.fields.name');  // ✓ OK
translate('users.fields');       // ✗ Error (not a leaf)
translate('invalid.key');        // ✗ Error
```

---

## Complete Examples

### Type-Safe Service

```typescript
import type { ICrudService, IdType, ValueOrPromise } from '@minimaltech/ra-core-infra';
import { BaseCrudService } from '@minimaltech/ra-core-infra';

interface Product {
  id: IdType;
  name: string;
  price: number;
  category: string;
}

class ProductService extends BaseCrudService<Product> implements ICrudService<Product> {
  // Custom method with type-safe return
  async findByCategory(category: string): Promise<Product[]> {
    return this.find({
      where: { category },
    });
  }

  // Using ValueOrPromise for flexible return
  getPrice(productId: IdType): ValueOrPromise<number> {
    if (this.cached.has(productId)) {
      return this.cached.get(productId).price;  // Sync
    }
    return this.findById(productId, {}).then(p => p.price);  // Async
  }
}
```

---

### Type-Safe Configuration

```typescript
import type {
  IRestDataProviderOptions,
  IAuthProviderOptions,
  II18nProviderOptions,
} from '@minimaltech/ra-core-infra';
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Type-safe configuration
    const dataConfig: IRestDataProviderOptions = {
      url: process.env.API_URL!,
      noAuthPaths: ['/auth/login'],
      headers: {
        'X-App-Version': '1.0.0',
      },
    };

    const authConfig: IAuthProviderOptions = {
      paths: {
        signIn: '/api/auth/login',
        checkAuth: '/api/auth/verify',
      },
      endpoints: {
        afterLogin: '/dashboard',
      },
    };

    const i18nConfig: II18nProviderOptions = {
      i18nSources: {
        en: englishMessages,
        fr: frenchMessages,
      },
      listLanguages: [
        { locale: 'en', name: 'English' },
        { locale: 'fr', name: 'Français' },
      ],
    };

    this.container.bind({ key: CoreBindings.REST_DATA_PROVIDER_OPTIONS, value: dataConfig });
    this.container.bind({ key: CoreBindings.AUTH_PROVIDER_OPTIONS, value: authConfig });
    this.container.bind({ key: CoreBindings.I18N_PROVIDER_OPTIONS, value: i18nConfig });
  }
}
```

---

### Type-Safe Translation Keys

```typescript
import type { TFullPaths } from '@minimaltech/ra-core-infra';

const messages = {
  auth: {
    login: 'Login',
    logout: 'Logout',
    errors: {
      invalidCredentials: 'Invalid username or password',
      sessionExpired: 'Your session has expired',
    },
  },
  users: {
    title: 'Users',
    fields: {
      name: 'Name',
      email: 'Email',
      role: 'Role',
    },
  },
};

// Generate type-safe keys
type TranslationKey = TFullPaths<typeof messages>;
// 'auth.login' | 'auth.logout' | 'auth.errors.invalidCredentials' |
// 'auth.errors.sessionExpired' | 'users.title' | 'users.fields.name' | ...

// Type-safe translate function
function translate(key: TranslationKey): string {
  const keys = key.split('.');
  let result: any = messages;

  for (const k of keys) {
    result = result[k];
  }

  return result;
}

// Usage with autocomplete and type checking
translate('auth.errors.invalidCredentials');  // ✓ OK
translate('auth.errors');                     // ✗ Error (not a leaf)
translate('invalid.key');                     // ✗ Error
```

---

### Custom Provider with Type Safety

```typescript
import type { IDataProvider, ISendParams, ISendResponse, IdType } from '@minimaltech/ra-core-infra';
import { DefaultRestDataProvider } from '@minimaltech/ra-core-infra';

interface CustomSendParams extends ISendParams {
  cacheable?: boolean;
  retries?: number;
}

class CustomDataProvider extends DefaultRestDataProvider implements IDataProvider {
  async send<ReturnType = any>(opts: {
    resource: string;
    params: CustomSendParams;
  }): Promise<ISendResponse<ReturnType>> {
    const { cacheable = false, retries = 3, ...sendParams } = opts.params;

    // Custom logic
    if (cacheable && this.cache.has(opts.resource)) {
      return { data: this.cache.get(opts.resource) };
    }

    // Retry logic
    let lastError: Error | undefined;
    for (let i = 0; i < retries; i++) {
      try {
        const result = await super.send(opts);

        if (cacheable) {
          this.cache.set(opts.resource, result.data);
        }

        return result;
      } catch (error) {
        lastError = error as Error;
      }
    }

    throw lastError;
  }
}
```

---

## Related APIs

- [BaseRaApplication](/api-reference/core/base-ra-application) - Uses ICoreRaApplication
- [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) - Implements IDataProvider
- [DefaultAuthProvider](/api-reference/providers/default-auth-provider) - Implements IAuthProvider
- [BaseCrudService](/api-reference/services/base-crud-service) - Implements ICrudService
- [useInjectable](/api-reference/hooks/use-injectable) - Uses type-safe injection

## TypeScript Tips

### Use Const Assertions

```typescript
const Config = {
  API_URL: 'https://api.example.com',
  TIMEOUT: 3000,
} as const;

type ConfigKey = keyof typeof Config;  // 'API_URL' | 'TIMEOUT'
type ConfigValue = ValueOf<typeof Config>;  // 'https://api.example.com' | 3000
```

### Combine Utility Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Create input type (no id, password optional)
type UserInput = ValueOptional<Omit<User, 'id'>, 'password'>;

const input: UserInput = {
  name: 'John',
  email: 'john@example.com',
  // password is optional
};
```

### Type Guards

```typescript
function isValidId(id: unknown): id is IdType {
  return typeof id === 'string' || typeof id === 'number';
}

const maybeId: unknown = getUserInput();
if (isValidId(maybeId)) {
  // maybeId is typed as IdType here
  await service.findById(maybeId, {});
}
```

## See Also

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) - TypeScript documentation

---

**Congratulations!** You've completed Phase 2 of the API Reference documentation.

**Phase 2 Summary** (6 files completed):
- ✅ DefaultAuthProvider
- ✅ DefaultAuthService
- ✅ DefaultNetworkRequestService
- ✅ DefaultI18nProvider
- ✅ useApplicationContext
- ✅ Core Types

Continue with Phase 3 for base classes, utilities, and additional hooks, or explore other documentation sections.

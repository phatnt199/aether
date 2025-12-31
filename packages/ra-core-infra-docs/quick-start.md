# Quickstart Guide: React + Vite + ra-core-infra + shadcn/ui

A step-by-step guide to set up a production-ready React application with dependency injection, React Admin core, and shadcn/ui components.

---

## Table of Contents

1. [Project Initialization](#1-project-initialization)
2. [Install Dependencies](#2-install-dependencies)
3. [TypeScript Configuration](#3-typescript-configuration)
4. [Project Structure](#4-project-structure)
5. [Application Setup](#5-application-setup)
6. [Provider Configuration](#6-provider-configuration)
7. [Routing Setup](#7-routing-setup)
8. [shadcn/ui Integration](#8-shadcnui-integration)
9. [Create First API Service](#9-create-first-api-service)
10. [Create First CRUD Screen](#10-create-first-crud-screen)
11. [Run the Application](#11-run-the-application)

---

## 1. Project Initialization

### Create Vite Project

```bash
# Using npm
npm create vite@latest my-app -- --template react-ts

# Using bun (recommended for this stack)
bun create vite my-app --template react-ts

cd my-app
```

---

## 2. Install Dependencies

### Core Dependencies

```bash
bun add react react-dom react-router-dom
bun add @minimaltech/ra-core-infra@0.0.3-2 ra-core
bun add @venizia/ignis-inversion reflect-metadata
```

### State Management & Data Fetching

```bash
bun add @tanstack/react-query @tanstack/react-query-devtools
bun add @reduxjs/toolkit react-redux
```

### UI & Styling

```bash
bun add tailwindcss @tailwindcss/vite
bun add class-variance-authority clsx tailwind-merge
bun add lucide-react
```

### Form & Validation

```bash
bun add react-hook-form @hookform/resolvers zod
```

### Dev Dependencies

```bash
bun add -D @types/react @types/react-dom
bun add -D typescript @types/node
bun add -D prettier eslint
```

---

## 3. TypeScript Configuration

### `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `tsconfig.app.json`

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

    /* Decorators */
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src"]
}
```

### `vite.config.ts`

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
```

---

## 4. Project Structure

Create the following folder structure:

```
src/
├── application/
│   ├── providers/          # Auth, Data, i18n providers
│   ├── services/
│   │   └── apis/           # API service classes
│   ├── locales/            # i18n translations
│   ├── application.ts      # DI container setup
│   └── ApplicationContext.tsx
├── components/
│   ├── ui/                 # shadcn components
│   └── core/               # Custom components
├── screens/                # Page components
├── hooks/
│   ├── api/                # API hooks (useGetData, useMutationData)
│   └── view/               # View hooks
├── redux/
│   ├── slices/
│   └── store.ts
├── libs/
│   └── tanstack/
│       └── react-query.ts
├── constants/
│   ├── endpoints.ts
│   └── routes.ts
├── interfaces/             # TypeScript interfaces
├── utilities/              # Helper functions
├── themes/
│   └── index.css          # Global styles
├── App.tsx                 # Route configuration
└── main.tsx                # Entry point
```

---

## 5. Application Setup

### Step 5.1: Create Constants

**`src/constants/endpoints.ts`**

```typescript
export const RestEndpoints = {
  // Auth
  AUTH_SIGN_IN: '/auth/sign-in',
  AUTH_SIGN_UP: '/auth/sign-up',
  AUTH_WHO_AM_I: '/auth/whoami',

  // Resources
  PRODUCTS: '/products',
  USERS: '/users',
  CATEGORIES: '/categories',
} as const;
```

**`src/constants/routes.ts`**

```typescript
export const AppRoutes = {
  HOME: '/',
  LOGIN: '/login',
  PRODUCTS: '/products',
  USERS: '/users',
} as const;
```

**`src/constants/common.ts`**

```typescript
export const AppConst = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
} as const;

export const AppLanguages = {
  listLanguages: [
    { locale: 'en', name: 'English' },
    { locale: 'vi', name: 'Tiếng Việt' },
  ],
};
```

### Step 5.2: Create Application Class

**`src/application/application.ts`**

```typescript
import 'reflect-metadata';

import {
  BaseRaApplication,
  CoreBindings,
  DefaultAuthService,
  DefaultI18nProvider,
  DefaultRestDataProvider,
  englishMessages,
  IAuthProvider,
  IAuthProviderOptions,
  IDataProvider,
  II18nProviderOptions,
  IRestDataProviderOptions,
  ValueOrPromise,
  vietnameseMessages,
} from '@minimaltech/ra-core-infra';
import { BindingScopes, TConstructor } from '@venizia/ignis-inversion';
import { I18nProvider } from 'ra-core';

import { AppConst, AppLanguages } from '@/constants/common';
import { RestEndpoints } from '@/constants/endpoints';
import { AppRoutes } from '@/constants/routes';
import { en, vi } from './locales';
import { AuthProvider } from './providers/auth.provider';
import { ProductApi } from './services/apis/product.api';

class RaApplication extends BaseRaApplication {
  constructor() {
    super();
  }

  // --------------------------------------------------
  // Service Registry
  // --------------------------------------------------
  private bindingList() {
    return {
      'services.ProductApi': ProductApi,
      // Add more services here
    } as const;
  }

  // --------------------------------------------------
  // Data Provider Configuration
  // --------------------------------------------------
  private bindDataProviders() {
    this.bind<IRestDataProviderOptions>({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
    }).toValue({
      url: AppConst.BASE_URL,
      noAuthPaths: [
        RestEndpoints.AUTH_SIGN_IN,
        RestEndpoints.AUTH_SIGN_UP,
      ],
      headers: {
        'x-locale': localStorage.getItem('locale') || 'en',
      },
    });

    this.bind<IDataProvider>({
      key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
    }).toProvider(DefaultRestDataProvider);
  }

  // --------------------------------------------------
  // Auth Provider Configuration
  // --------------------------------------------------
  private bindAuthProviders() {
    this.bind<IAuthProviderOptions>({
      key: CoreBindings.AUTH_PROVIDER_OPTIONS,
    }).toValue({
      endpoints: {
        afterLogin: AppRoutes.HOME,
      },
      paths: {
        signIn: RestEndpoints.AUTH_SIGN_IN,
        signUp: RestEndpoints.AUTH_SIGN_UP,
      },
    });

    this.bind({ key: CoreBindings.DEFAULT_AUTH_SERVICE })
      .toClass(DefaultAuthService);

    this.bind({ key: CoreBindings.DEFAULT_AUTH_PROVIDER })
      .toProvider(AuthProvider);
  }

  // --------------------------------------------------
  // i18n Provider Configuration
  // --------------------------------------------------
  private bindI18nProviders() {
    this.bind<II18nProviderOptions>({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
    }).toValue({
      i18nSources: {
        en: { ...englishMessages, ...en },
        vi: { ...vietnameseMessages, ...vi },
      },
      listLanguages: AppLanguages.listLanguages,
    });

    this.bind({ key: CoreBindings.DEFAULT_I18N_PROVIDER })
      .toProvider(DefaultI18nProvider);
  }

  // --------------------------------------------------
  // Service Bindings
  // --------------------------------------------------
  private bindServices() {
    const bindings = this.bindingList();
    Object.entries(bindings).forEach(([key, bindingClass]) => {
      this.bind({ key })
        .toClass(bindingClass as TConstructor<any>)
        .setScope(BindingScopes.SINGLETON);
    });
  }

  // --------------------------------------------------
  // Core Bindings
  // --------------------------------------------------
  protected registerCoreBindings() {
    this.bind<typeof this>({
      key: CoreBindings.APPLICATION_INSTANCE,
    }).toProvider(() => this);
  }

  // --------------------------------------------------
  // Main Binding Method
  // --------------------------------------------------
  override bindContext(): ValueOrPromise<void> {
    this.registerCoreBindings();
    this.bindDataProviders();
    this.bindAuthProviders();
    this.bindI18nProviders();
    this.bindServices();
  }
}

// --------------------------------------------------
// Export Singleton Instances
// --------------------------------------------------
let applicationContext: RaApplication;
let authProvider: IAuthProvider;
let dataProvider: { base: IDataProvider };
let i18nProvider: I18nProvider;

export const initAppContext = async () => {
  applicationContext = new RaApplication();
  await applicationContext.start();

  const baseDataProvider = applicationContext.get<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  dataProvider = { base: baseDataProvider };

  authProvider = applicationContext.get<IAuthProvider>({
    key: CoreBindings.DEFAULT_AUTH_PROVIDER,
  });

  i18nProvider = applicationContext.get<I18nProvider>({
    key: CoreBindings.DEFAULT_I18N_PROVIDER,
  });
};

export { applicationContext, authProvider, dataProvider, i18nProvider };

// --------------------------------------------------
// TypeScript Type Augmentation
// --------------------------------------------------
declare module '@minimaltech/ra-core-infra' {
  interface IUseInjectableKeysOverrides
    extends Record<keyof ReturnType<RaApplication['bindingList']>, unknown> {}
}
```

### Step 5.3: Create Locales

**`src/application/locales/en.ts`**

```typescript
export const en = {
  app: {
    name: 'My Application',
  },
  resources: {
    products: {
      name: 'Product |||| Products',
      fields: {
        name: 'Name',
        price: 'Price',
      },
    },
  },
};
```

**`src/application/locales/vi.ts`**

```typescript
export const vi = {
  app: {
    name: 'Ứng dụng của tôi',
  },
  resources: {
    products: {
      name: 'Sản phẩm',
      fields: {
        name: 'Tên',
        price: 'Giá',
      },
    },
  },
};
```

**`src/application/locales/index.ts`**

```typescript
export { en } from './en';
export { vi } from './vi';
```

---

## 6. Provider Configuration

### Step 6.1: Create Auth Provider

**`src/application/providers/auth.provider.ts`**

```typescript
import {
  DefaultAuthProvider,
  getClientError,
  RequestMethods,
} from '@minimaltech/ra-core-infra';
import { removeDoubleSlashes } from 'ra-core';

import { RestEndpoints } from '@/constants/endpoints';
import { AppRoutes } from '@/constants/routes';

interface SignInPayload {
  username: string;
  password: string;
}

interface SignInResponse {
  userId: string;
  token: string;
}

export class AuthProvider extends DefaultAuthProvider {
  override login(params: SignInPayload) {
    return new Promise((resolve, reject) => {
      this.restDataProvider
        .send({
          resource: RestEndpoints.AUTH_SIGN_IN,
          params: {
            method: RequestMethods.POST,
            body: params,
          },
        })
        .then((rs: { data: SignInResponse }) => {
          const { userId, token } = rs.data;
          this.authService.saveAuth({
            token,
            userId,
            username: params.username,
          });
          resolve({
            ...rs,
            redirectTo: removeDoubleSlashes(
              `/${this.authProviderOptions.endpoints?.afterLogin ?? AppRoutes.HOME}`,
            ),
          });
        })
        .catch((error) => {
          reject(getClientError(error));
        });
    });
  }

  override logout(_params: any) {
    return new Promise<void>((resolve) => {
      this.authService.cleanUp();
      resolve();
    });
  }

  override async checkAuth(_params: any) {
    const token = this.authService.getAuth();

    if (!token?.value) {
      return Promise.reject({ redirectTo: AppRoutes.LOGIN });
    }

    return Promise.resolve();
  }

  override checkError(params: any) {
    const { status } = params;

    if (status === 401) {
      this.authService.cleanUp();
      return Promise.reject({ redirectTo: AppRoutes.LOGIN });
    }

    return Promise.resolve();
  }

  override getIdentity(_params: any) {
    const user = this.authService.getUser();

    if (!user?.userId) {
      return Promise.reject({ message: 'No user found' });
    }

    return Promise.resolve(user);
  }

  override getPermissions(_params: any) {
    return Promise.resolve();
  }
}
```

**`src/application/providers/index.ts`**

```typescript
export { AuthProvider } from './auth.provider';
```

### Step 6.2: Create Application Context

**`src/application/ApplicationContext.tsx`**

```typescript
import { CoreApplicationContext } from '@minimaltech/ra-core-infra';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { applicationContext } from './application';
import { store } from '@/redux/store';

export const ApplicationContext: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <CoreApplicationContext
      value={{
        container: applicationContext,
        registry: applicationContext,
        logger: applicationContext,
      }}
    >
      <ReduxProvider store={store}>
        {children}
      </ReduxProvider>
    </CoreApplicationContext>
  );
};
```

### Step 6.3: Setup Redux Store

**`src/redux/store.ts`**

```typescript
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Add your slices here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Step 6.4: Setup TanStack Query

**`src/libs/tanstack/react-query.ts`**

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 0,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 10_000, // 10 seconds
    },
  },
});
```

---

## 7. Routing Setup

### Step 7.1: Create Main Entry Point

**`src/main.tsx`**

```typescript
import { createRoot } from 'react-dom/client';
import { initAppContext } from '@/application';
import Application from './App';
import '@/themes/index.css';

const main = async () => {
  await initAppContext();
  createRoot(document.getElementById('root')!).render(<Application />);
};

main();
```

### Step 7.2: Create App Component

**`src/App.tsx`**

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CoreAdmin, CustomRoutes } from 'ra-core';
import { Route } from 'react-router-dom';

import {
  ApplicationContext,
  authProvider,
  dataProvider,
  i18nProvider,
} from '@/application';
import { queryClient } from '@/libs/tanstack/react-query';
import { AppRoutes } from '@/constants/routes';
import { HomeScreen } from '@/screens/home';
import { LoginScreen } from '@/screens/login';
import { ProductScreen } from '@/screens/products/list';

const Application = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ApplicationContext>
        <CoreAdmin
          dataProvider={dataProvider.base}
          authProvider={authProvider}
          i18nProvider={i18nProvider}
          loginPage={LoginScreen}
          dashboard={HomeScreen}
        >
          <CustomRoutes>
            <Route path={AppRoutes.PRODUCTS} element={<ProductScreen />} />
          </CustomRoutes>
        </CoreAdmin>
      </ApplicationContext>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default Application;
```

---

## 8. shadcn/ui Integration

### Step 8.1: Initialize shadcn

```bash
bunx shadcn@latest init
```

Follow the prompts:
- ✔ Would you like to use TypeScript? **Yes**
- ✔ Which style would you like to use? **Default**
- ✔ Which color would you like to use as base color? **Slate**
- ✔ Where is your global CSS file? **src/themes/index.css**
- ✔ Would you like to use CSS variables for colors? **Yes**
- ✔ Where is your tailwind.config.js located? **tailwind.config.ts**
- ✔ Configure the import alias for components: **@/components**
- ✔ Configure the import alias for utils: **@/utilities**

### Step 8.2: Install shadcn Components

```bash
bunx shadcn@latest add button
bunx shadcn@latest add input
bunx shadcn@latest add form
bunx shadcn@latest add table
bunx shadcn@latest add dialog
```

### Step 8.3: Create Global CSS

**`src/themes/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}
```

---

## 9. Create First API Service

### Step 9.1: Create Base CRUD API Service

**`src/application/services/apis/base-crud.api.ts`**

```typescript
import {
  CoreBindings,
  IDataProvider,
  ISendParams,
  RequestMethods,
} from '@minimaltech/ra-core-infra';
import { inject } from '@venizia/ignis-inversion';

export interface IBaseCrudApi<TEntity, TPayload> {
  find(opts?: { filter?: any }): Promise<TEntity[]>;
  findById(opts: { id: number | string }): Promise<TEntity>;
  count(opts?: { where?: any }): Promise<{ count: number }>;
  create(opts: { data: TPayload }): Promise<TEntity>;
  updateById(opts: { id: number | string; data: TPayload }): Promise<TEntity>;
  deleteById(opts: { id: number | string }): Promise<{ id: number | string }>;
  search(opts?: { filter?: any; q?: string }): Promise<TEntity[]>;
  searchCount(opts?: { where?: any; q?: string }): Promise<{ count: number }>;
}

export abstract class BaseCrudApiService<TEntity, TPayload>
  implements IBaseCrudApi<TEntity, TPayload>
{
  protected dataProvider: IDataProvider;
  protected resource: string;

  constructor(opts: {
    scope: string;
    dataProvider: IDataProvider;
    resource: string;
  }) {
    this.dataProvider = opts.dataProvider;
    this.resource = opts.resource;
  }

  async find(opts?: { filter?: any }): Promise<TEntity[]> {
    const params: ISendParams = {
      method: RequestMethods.GET,
      query: { filter: opts?.filter ? JSON.stringify(opts.filter) : undefined },
    };

    const response = await this.dataProvider.send<TEntity[]>({
      resource: this.resource,
      params,
    });

    return response.data;
  }

  async findById(opts: { id: number | string }): Promise<TEntity> {
    const params: ISendParams = {
      method: RequestMethods.GET,
    };

    const response = await this.dataProvider.send<TEntity>({
      resource: `${this.resource}/${opts.id}`,
      params,
    });

    return response.data;
  }

  async count(opts?: { where?: any }): Promise<{ count: number }> {
    const params: ISendParams = {
      method: RequestMethods.GET,
      query: { where: opts?.where ? JSON.stringify(opts.where) : undefined },
    };

    const response = await this.dataProvider.send<{ count: number }>({
      resource: `${this.resource}/count`,
      params,
    });

    return response.data;
  }

  async create(opts: { data: TPayload }): Promise<TEntity> {
    const params: ISendParams = {
      method: RequestMethods.POST,
      body: opts.data,
    };

    const response = await this.dataProvider.send<TEntity>({
      resource: this.resource,
      params,
    });

    return response.data;
  }

  async updateById(opts: {
    id: number | string;
    data: TPayload;
  }): Promise<TEntity> {
    const params: ISendParams = {
      method: RequestMethods.PATCH,
      body: opts.data,
    };

    const response = await this.dataProvider.send<TEntity>({
      resource: `${this.resource}/${opts.id}`,
      params,
    });

    return response.data;
  }

  async deleteById(opts: {
    id: number | string;
  }): Promise<{ id: number | string }> {
    const params: ISendParams = {
      method: RequestMethods.DELETE,
    };

    await this.dataProvider.send({
      resource: `${this.resource}/${opts.id}`,
      params,
    });

    return { id: opts.id };
  }

  async search(opts?: { filter?: any; q?: string }): Promise<TEntity[]> {
    const params: ISendParams = {
      method: RequestMethods.GET,
      query: {
        filter: opts?.filter ? JSON.stringify(opts.filter) : undefined,
        q: opts?.q,
      },
    };

    const response = await this.dataProvider.send<TEntity[]>({
      resource: `${this.resource}/search`,
      params,
    });

    return response.data;
  }

  async searchCount(opts?: {
    where?: any;
    q?: string;
  }): Promise<{ count: number }> {
    const params: ISendParams = {
      method: RequestMethods.GET,
      query: {
        where: opts?.where ? JSON.stringify(opts.where) : undefined,
        q: opts?.q,
      },
    };

    const response = await this.dataProvider.send<{ count: number }>({
      resource: `${this.resource}/search/count`,
      params,
    });

    return response.data;
  }
}
```

### Step 9.2: Create Product API

**`src/interfaces/product.interface.ts`**

```typescript
export interface IProduct {
  id: number;
  name: string;
  price: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TProductPayload {
  name: string;
  price: number;
  description?: string;
}
```

**`src/application/services/apis/product.api.ts`**

```typescript
import {
  CoreBindings,
  IDataProvider,
} from '@minimaltech/ra-core-infra';
import { inject } from '@venizia/ignis-inversion';

import { RestEndpoints } from '@/constants/endpoints';
import { IProduct, TProductPayload } from '@/interfaces/product.interface';
import { BaseCrudApiService } from './base-crud.api';

export class ProductApi extends BaseCrudApiService<IProduct, TProductPayload> {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    protected dataProvider: IDataProvider,
  ) {
    super({
      scope: ProductApi.name,
      dataProvider,
      resource: RestEndpoints.PRODUCTS,
    });
  }

  // Add custom methods here if needed
}
```

**`src/application/services/apis/index.ts`**

```typescript
export { ProductApi } from './product.api';
export { BaseCrudApiService } from './base-crud.api';
```

**Update `application.ts` to register ProductApi:**

```typescript
// In bindingList() method
'services.ProductApi': ProductApi,
```

---

## 10. Create First CRUD Screen

### Step 10.1: Create API Hooks

**`src/hooks/api/useGetData.tsx`**

```typescript
import { useInjectable } from '@minimaltech/ra-core-infra';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface UseGetDataOptions<T> {
  apiKey: string;
  queryParams?: any;
  queryFn: (params: any) => Promise<T>;
  queryOptions?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>;
}

export function useGetData<T>({
  apiKey,
  queryParams,
  queryFn,
  queryOptions,
}: UseGetDataOptions<T>) {
  const apiService = useInjectable<any>({ key: apiKey });

  return useQuery<T>({
    queryKey: [apiKey, queryParams],
    queryFn: () => queryFn.call(apiService, queryParams),
    ...queryOptions,
  });
}
```

**`src/hooks/api/useMutationData.tsx`**

```typescript
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useInjectable } from '@minimaltech/ra-core-infra';

interface UseMutationDataOptions<TData, TVariables> {
  apiKey: string;
  mutationFn: (variables: TVariables) => Promise<TData>;
  mutationOptions?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>;
}

export function useMutationData<TData, TVariables>({
  apiKey,
  mutationFn,
  mutationOptions,
}: UseMutationDataOptions<TData, TVariables>) {
  const apiService = useInjectable<any>({ key: apiKey });

  const mutation = useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => mutationFn.call(apiService, variables),
    ...mutationOptions,
  });

  return [mutation.mutate, mutation] as const;
}
```

### Step 10.2: Create Product List Screen

**`src/screens/products/list.tsx`**

```typescript
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetData } from '@/hooks/api/useGetData';
import { useMutationData } from '@/hooks/api/useMutationData';
import { IProduct } from '@/interfaces/product.interface';

export const ProductScreen = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Fetch products
  const { data: products, isLoading } = useGetData<IProduct[]>({
    apiKey: 'services.ProductApi',
    queryParams: { filter: { limit, skip: (page - 1) * limit } },
    queryFn: (params) => params.find(params.filter),
  });

  // Delete mutation
  const [deleteProduct] = useMutationData<{ id: number }, { id: number }>({
    apiKey: 'services.ProductApi',
    mutationFn: (variables) => variables.deleteById(variables),
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['services.ProductApi'] });
      },
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button>Create Product</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.id}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>${product.price}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteProduct({ id: product.id })}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-2 mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <Button onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
};
```

### Step 10.3: Create Login Screen

**`src/screens/login/index.tsx`**

```typescript
import { useState } from 'react';
import { useLogin } from 'ra-core';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-96 space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </div>
  );
};
```

### Step 10.4: Create Home Screen

**`src/screens/home/index.tsx`**

```typescript
export const HomeScreen = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Welcome to My App</h1>
      <p className="mt-2 text-gray-600">
        This is a quickstart template with ra-core-infra
      </p>
    </div>
  );
};
```

---

## 11. Run the Application

### Step 11.1: Setup Environment Variables

**`.env`**

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Step 11.2: Start Development Server

```bash
bun run dev
```

Navigate to `http://localhost:3000`

---

## Next Steps

### Add More Features

1. **Create Form Screen**: Add product creation form
2. **Edit Screen**: Add product edit functionality
3. **Search & Filter**: Implement search and filtering
4. **Pagination**: Add proper pagination with page info
5. **Error Handling**: Add global error boundary
6. **Loading States**: Add skeleton loaders
7. **Notifications**: Add toast notifications

### Recommended Packages

```bash
bun add sonner  # Toast notifications
bun add @tanstack/react-table  # Advanced tables
bun add react-day-picker  # Date picker
```

---

## Architecture Summary

### Data Flow

```
User Action
  ↓
Component (useGetData/useMutationData)
  ↓
Inject API Service via useInjectable
  ↓
API Service extends BaseCrudApiService
  ↓
DefaultRestDataProvider.send()
  ↓
REST API
```

### State Management Layers

1. **React Context**: Component composition (via ra-core)
2. **Redux**: Global UI state
3. **TanStack Query**: Server state caching

### Dependency Injection

- All services registered in `RaApplication.bindContext()`
- Accessed via `useInjectable({ key: 'services.ProductApi' })`
- Type-safe with TypeScript augmentation
- Singleton scope by default

---

## Troubleshooting

### Issue: "reflect-metadata" errors

**Solution**: Ensure `import 'reflect-metadata';` is at the top of `application.ts`

### Issue: TypeScript errors with decorators

**Solution**: Check `tsconfig.json` has:
```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

### Issue: Path aliases not working

**Solution**: Update both `tsconfig.json` and `vite.config.ts` with matching paths

---

## Resources

- [ra-core Documentation](https://marmelab.com/react-admin/ReferenceManyField.html)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vite](https://vitejs.dev/)

---

**You now have a fully functional React application with dependency injection, type safety, and modern tooling!** 🎉

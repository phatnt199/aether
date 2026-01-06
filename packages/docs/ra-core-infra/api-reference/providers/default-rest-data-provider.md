# DefaultRestDataProvider

REST API data provider implementing React Admin's `IDataProvider` interface with LoopBack filter support.

## Import

```typescript
import { DefaultRestDataProvider, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IRestDataProviderOptions } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
class DefaultRestDataProvider<TResource extends string = string>
  extends BaseProvider<IDataProvider<TResource>>

interface IRestDataProviderOptions {
  url: string;
  noAuthPaths?: string[];
  headers?: HeadersInit;
}

constructor(
  @inject({ key: CoreBindings.REST_DATA_PROVIDER_OPTIONS })
  restDataProviderOptions: IRestDataProviderOptions
)
```

## Type Parameters

| Parameter | Description |
|-----------|-------------|
| `TResource` | Resource name type (defaults to `string`) |

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `url` | `string` | Yes | Base API URL (e.g., `"https://api.example.com"`) |
| `noAuthPaths` | `string[]` | No | Paths that don't require authentication |
| `headers` | `HeadersInit` | No | Default headers for all requests |

## Description

`DefaultRestDataProvider` is the main data access layer for React Admin applications. It translates React Admin's data operations into REST API calls with LoopBack filter syntax support.

**Key features**:
- 10 React Admin methods (getList, getOne, create, update, delete, etc.)
- Custom `send()` method for arbitrary HTTP requests
- LoopBack filter translation (where, include, order, limit, skip)
- Automatic pagination handling
- Built-in authentication header injection
- Network request abstraction via DefaultNetworkRequestService

**When to use**:
- Connect React Admin to REST APIs
- Build admin panels with CRUD operations
- Use LoopBack-style querying with REST backends
- Customize HTTP requests per resource

## Methods Overview

### Read Operations
- **[getList](#getlist)** - Retrieve paginated list of records
- **[getOne](#getone)** - Retrieve single record by ID
- **[getMany](#getmany)** - Retrieve multiple records by IDs
- **[getManyReference](#getmanyreference)** - Retrieve records by foreign key

### Write Operations
- **[create](#create)** - Create new record
- **[update](#update)** - Update single record (PATCH)
- **[updateMany](#updatemany)** - Update multiple records
- **[delete](#delete)** - Delete single record
- **[deleteMany](#deletemany)** - Delete multiple records

### Custom Operations
- **[send](#send)** - Send custom HTTP request
- **[getNetworkService](#getnetworkservice)** - Access network service

---

## getList()

Retrieve a paginated list of records with filtering, sorting, and field selection.

**Signature**:
```typescript
getList<RecordType extends RaRecord = any>(opts: {
  resource: TResource;
  params: GetListParams & QueryFunctionContext & ICustomParams;
}): Promise<GetListResult<RecordType>>
```

**Parameters**:
- `opts.resource` - Resource name (e.g., `"users"`)
- `opts.params.pagination` - Pagination ({ page, perPage })
- `opts.params.sort` - Sorting ({ field, order: 'ASC' | 'DESC' })
- `opts.params.filter` - LoopBack filter object
- `opts.params.meta` - Additional query parameters

**Returns**: `{ data: RecordType[], total: number }`

**Example**:
```typescript
const result = await dataProvider.getList({
  resource: 'users',
  params: {
    pagination: { page: 1, perPage: 10 },
    sort: { field: 'name', order: 'ASC' },
    filter: {
      where: { status: 'active' },
      include: [{ relation: 'posts' }],
    },
  },
});

console.log(result.data); // Array of 10 users
console.log(result.total); // Total count
```

**Generated Request**:
```
GET /users?filter={"where":{"status":"active"},"include":[{"relation":"posts"}],"order":["name ASC"],"limit":10,"skip":0}
```

---

## getOne()

Retrieve a single record by ID.

**Signature**:
```typescript
getOne<RecordType extends RaRecord = any>(opts: {
  resource: TResource;
  params: GetOneParams<RecordType> & QueryFunctionContext & ICustomParams;
}): Promise<GetOneResult<RecordType>>
```

**Parameters**:
- `opts.resource` - Resource name
- `opts.params.id` - Record ID
- `opts.params.meta.filter` - Optional LoopBack filter (for including relations)

**Returns**: `{ data: RecordType }`

**Example**:
```typescript
const result = await dataProvider.getOne({
  resource: 'users',
  params: {
    id: 'user-123',
    meta: {
      filter: {
        include: [{ relation: 'posts' }],
      },
    },
  },
});

console.log(result.data); // User with posts included
```

**Generated Request**:
```
GET /users/user-123?filter={"include":[{"relation":"posts"}]}
```

---

## getMany()

Retrieve multiple records by their IDs.

**Signature**:
```typescript
getMany<RecordType extends RaRecord = any>(opts: {
  resource: TResource;
  params: GetManyParams<RecordType> & QueryFunctionContext & ICustomParams;
}): Promise<GetManyResult<RecordType>>
```

**Parameters**:
- `opts.resource` - Resource name
- `opts.params.ids` - Array of record IDs
- `opts.params.meta.filter` - Optional LoopBack filter

**Returns**: `{ data: RecordType[] }`

**Example**:
```typescript
const result = await dataProvider.getMany({
  resource: 'users',
  params: {
    ids: ['user-1', 'user-2', 'user-3'],
  },
});

console.log(result.data); // Array of 3 users
```

**Generated Request**:
```
GET /users?filter={"where":{"id":{"inq":["user-1","user-2","user-3"]}}}
```

---

## getManyReference()

Retrieve records that reference another record (foreign key relationship).

**Signature**:
```typescript
getManyReference<RecordType extends RaRecord = any>(opts: {
  resource: TResource;
  params: GetManyReferenceParams & QueryFunctionContext & ICustomParams;
}): Promise<GetManyReferenceResult<RecordType>>
```

**Parameters**:
- `opts.resource` - Resource name
- `opts.params.target` - Foreign key field name
- `opts.params.id` - ID of the referenced record
- `opts.params.pagination` - Pagination
- `opts.params.sort` - Sorting
- `opts.params.filter` - Additional filters

**Returns**: `{ data: RecordType[], total: number }`

**Example**:
```typescript
// Get all posts by a specific user
const result = await dataProvider.getManyReference({
  resource: 'posts',
  params: {
    target: 'userId',
    id: 'user-123',
    pagination: { page: 1, perPage: 10 },
    sort: { field: 'createdAt', order: 'DESC' },
    filter: {
      where: { published: true },
    },
  },
});

console.log(result.data); // User's published posts
```

**Generated Request**:
```
GET /posts?filter={"where":{"userId":"user-123","published":true},"order":["createdAt DESC"],"limit":10,"skip":0}
```

---

## create()

Create a new record.

**Signature**:
```typescript
create<
  RecordType extends Omit<RaRecord, 'id'> = any,
  ResultRecordType extends RaRecord = RecordType & { id: Identifier }
>(opts: {
  resource: TResource;
  params: CreateParams;
}): Promise<CreateResult<ResultRecordType>>
```

**Parameters**:
- `opts.resource` - Resource name
- `opts.params.data` - Record data (without `id`)

**Returns**: `{ data: ResultRecordType }` (with generated `id`)

**Example**:
```typescript
const result = await dataProvider.create({
  resource: 'users',
  params: {
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
    },
  },
});

console.log(result.data.id); // Generated ID
```

**Generated Request**:
```
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active"
}
```

---

## update()

Update a single record (partial update using PATCH).

**Signature**:
```typescript
update<RecordType extends RaRecord = any>(opts: {
  resource: TResource;
  params: UpdateParams;
}): Promise<UpdateResult<RecordType>>
```

**Parameters**:
- `opts.resource` - Resource name
- `opts.params.id` - Record ID
- `opts.params.data` - Partial record data
- `opts.params.previousData` - Previous record state (for optimistic updates)

**Returns**: `{ data: RecordType }`

**Example**:
```typescript
const result = await dataProvider.update({
  resource: 'users',
  params: {
    id: 'user-123',
    data: {
      email: 'newemail@example.com',
      status: 'inactive',
    },
    previousData: { /* ... */ },
  },
});

console.log(result.data); // Updated user
```

**Generated Request**:
```
PATCH /users/user-123
Content-Type: application/json

{
  "email": "newemail@example.com",
  "status": "inactive"
}
```

---

## updateMany()

Update multiple records at once.

**Signature**:
```typescript
updateMany<RecordType extends RaRecord = any>(opts: {
  resource: TResource;
  params: UpdateManyParams;
}): Promise<UpdateManyResult<RecordType>>
```

**Parameters**:
- `opts.resource` - Resource name
- `opts.params.ids` - Array of record IDs to update
- `opts.params.data` - Partial data to apply to all records

**Returns**: `{ data: RecordType['id'][] }` (array of updated IDs)

**Example**:
```typescript
// Deactivate multiple users
const result = await dataProvider.updateMany({
  resource: 'users',
  params: {
    ids: ['user-1', 'user-2', 'user-3'],
    data: {
      status: 'inactive',
    },
  },
});

console.log(result.data); // ['user-1', 'user-2', 'user-3']
```

**Generated Request**:
```
PATCH /users?filter={"where":{"id":{"inq":["user-1","user-2","user-3"]}}}
Content-Type: application/json

{
  "status": "inactive"
}
```

---

## delete()

Delete a single record.

**Signature**:
```typescript
delete<RecordType extends RaRecord = any>(opts: {
  resource: TResource;
  params: DeleteParams<RecordType>;
}): Promise<DeleteResult<RecordType>>
```

**Parameters**:
- `opts.resource` - Resource name
- `opts.params.id` - Record ID
- `opts.params.previousData` - Previous record state (for optimistic updates)

**Returns**: `{ data: RecordType }`

**Example**:
```typescript
const result = await dataProvider.delete({
  resource: 'users',
  params: {
    id: 'user-123',
    previousData: { /* ... */ },
  },
});

console.log(result.data); // Deleted user
```

**Generated Request**:
```
DELETE /users/user-123
```

---

## deleteMany()

Delete multiple records.

**Signature**:
```typescript
deleteMany<RecordType extends RaRecord = any>(opts: {
  resource: TResource;
  params: DeleteManyParams<RecordType>;
}): Promise<DeleteManyResult<RecordType>>
```

**Parameters**:
- `opts.resource` - Resource name
- `opts.params.ids` - Array of record IDs to delete

**Returns**: `{ data: RecordType['id'][] }` (array of deleted IDs)

**Example**:
```typescript
const result = await dataProvider.deleteMany({
  resource: 'users',
  params: {
    ids: ['user-1', 'user-2', 'user-3'],
  },
});

console.log(result.data); // ['user-1', 'user-2', 'user-3']
```

**Implementation**:
Executes individual DELETE requests in parallel using `Promise.all()`.

**Generated Requests**:
```
DELETE /users/user-1
DELETE /users/user-2
DELETE /users/user-3
```

---

## send()

Send a custom HTTP request (not covered by standard React Admin methods).

**Signature**:
```typescript
send<ReturnType = any>(opts: {
  resource: TResource;
  params: ISendParams;
}): Promise<ISendResponse<ReturnType>>

interface ISendParams {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Record<string, any>;
  body?: any;
  headers?: HeadersInit;
}
```

**Parameters**:
- `opts.resource` - Resource name
- `opts.params.method` - HTTP method
- `opts.params.query` - Query parameters
- `opts.params.body` - Request body
- `opts.params.headers` - Custom headers

**Returns**: `{ data: ReturnType }`

**Example**:
```typescript
// Custom endpoint: POST /users/bulk-import
const result = await dataProvider.send({
  resource: 'users/bulk-import',
  params: {
    method: 'POST',
    body: {
      users: [
        { name: 'User 1', email: 'user1@example.com' },
        { name: 'User 2', email: 'user2@example.com' },
      ],
    },
  },
});

// Custom endpoint: GET /stats/summary
const stats = await dataProvider.send({
  resource: 'stats/summary',
  params: {
    method: 'GET',
    query: {
      from: '2024-01-01',
      to: '2024-12-31',
    },
  },
});
```

---

## getNetworkService()

Access the underlying network service for low-level customization.

**Signature**:
```typescript
getNetworkService(): DefaultNetworkRequestService
```

**Returns**: DefaultNetworkRequestService instance

**Example**:
```typescript
const networkService = dataProvider.getNetworkService();

// Access low-level network configuration
console.log(networkService.baseUrl);

// Make custom requests
const response = await networkService.doRequest({
  type: 'CUSTOM',
  method: 'GET',
  paths: ['custom', 'endpoint'],
});
```

---

## Configuration Example

### Basic Setup

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IRestDataProviderOptions } from '@minimaltech/ra-core-infra';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Configure data provider
    const restDataProviderOptions: IRestDataProviderOptions = {
      url: 'https://api.example.com',
      headers: {
        'X-Custom-Header': 'value',
      },
    };

    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: restDataProviderOptions,
    });
  }
}
```

### With Authentication

```typescript
const restDataProviderOptions: IRestDataProviderOptions = {
  url: 'https://api.example.com',
  headers: {
    'X-API-Key': 'your-api-key',
  },
  noAuthPaths: ['/auth/login', '/auth/register'],
};
```

### Multiple Environments

```typescript
const restDataProviderOptions: IRestDataProviderOptions = {
  url: process.env.NODE_ENV === 'production'
    ? 'https://api.production.com'
    : 'http://localhost:3000/api',
  headers: {
    'X-Environment': process.env.NODE_ENV,
  },
};
```

---

## Using in React Admin

### With React Admin Components

```typescript
import { Admin, Resource } from 'react-admin';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';

function App() {
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  return (
    <Admin dataProvider={dataProvider}>
      <Resource name="users" list={UserList} />
      <Resource name="posts" list={PostList} />
    </Admin>
  );
}
```

### Direct Usage in Components

```typescript
import React from 'react';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';

function UserStats() {
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    dataProvider.send({
      resource: 'stats/users',
      params: { method: 'GET' },
    }).then(result => setStats(result.data));
  }, [dataProvider]);

  return <div>{/* Display stats */}</div>;
}
```

---

## LoopBack Filter Features

### Pagination

```typescript
// Automatic pagination
dataProvider.getList({
  resource: 'users',
  params: {
    pagination: { page: 2, perPage: 20 },
  },
});
// Generates: ?filter={"limit":20,"skip":20}

// Disable pagination
dataProvider.getList({
  resource: 'users',
  params: {
    filter: { noLimit: true },
  },
});
// Generates: ?filter={}
```

### Including Relations

```typescript
dataProvider.getOne({
  resource: 'users',
  params: {
    id: 'user-123',
    meta: {
      filter: {
        include: [
          { relation: 'posts' },
          {
            relation: 'comments',
            scope: {
              where: { published: true },
              limit: 5,
            },
          },
        ],
      },
    },
  },
});
```

### Field Selection

```typescript
dataProvider.getList({
  resource: 'users',
  params: {
    filter: {
      fields: { id: true, name: true, email: true },
    },
  },
});
```

### Complex Queries

```typescript
dataProvider.getList({
  resource: 'posts',
  params: {
    filter: {
      where: {
        or: [
          { status: 'published' },
          { featured: true },
        ],
        createdAt: { gte: '2024-01-01' },
      },
      order: ['createdAt DESC'],
      limit: 10,
    },
  },
});
```

---

## Related APIs

- [BaseCrudService](/api-reference/services/base-crud-service) - Service layer using this provider
- [DefaultNetworkRequestService](/api-reference/services/default-network-request-service) - Underlying network layer
- [useInjectable](/api-reference/hooks/use-injectable) - Inject provider in components
- [CoreBindings](/api-reference/core/core-bindings) - DI binding keys

## Common Issues

### 401 Unauthorized errors

**Cause**: Missing or invalid authentication headers.

**Solution**: Ensure auth token is injected by DefaultNetworkRequestService:

```typescript
// DefaultNetworkRequestService automatically adds auth headers
// from localStorage based on CoreBindings.DEFAULT_AUTH_SERVICE
```

### Filter not working

**Cause**: Incorrect filter structure or backend doesn't support LoopBack syntax.

**Solution**: Check filter syntax and ensure backend supports LoopBack filters:

```typescript
// ✅ Correct
filter: {
  where: { status: 'active' },
  order: ['name ASC'],
}

// ❌ Wrong
filter: {
  status: 'active',  // Missing 'where'
  sort: 'name',      // Should be 'order'
}
```

### CORS errors

**Cause**: API doesn't allow requests from your domain.

**Solution**: Configure CORS on your backend to allow your frontend origin.

### Large response timeouts

**Cause**: Fetching too many records or relations.

**Solution**: Use pagination and limit included relations:

```typescript
dataProvider.getList({
  resource: 'users',
  params: {
    pagination: { page: 1, perPage: 50 },  // Limit records
    filter: {
      include: [
        {
          relation: 'posts',
          scope: { limit: 5 },  // Limit nested records
        },
      ],
    },
  },
});
```

## Best Practices

### 1. Use Type-Safe Resources

Define resource names as const types:

```typescript
const RESOURCES = {
  USERS: 'users',
  POSTS: 'posts',
  COMMENTS: 'comments',
} as const;

dataProvider.getList({
  resource: RESOURCES.USERS,
  params: { /* ... */ },
});
```

### 2. Leverage send() for Custom Endpoints

Use `send()` for non-standard operations:

```typescript
// Bulk operations
await dataProvider.send({
  resource: 'users/bulk-activate',
  params: {
    method: 'POST',
    body: { ids: ['1', '2', '3'] },
  },
});

// Stats and reports
await dataProvider.send({
  resource: 'reports/monthly',
  params: {
    method: 'GET',
    query: { month: '2024-01' },
  },
});
```

### 3. Extract Common Filters

Define reusable filter constants:

```typescript
const FILTERS = {
  ACTIVE_USERS: {
    where: { status: 'active' },
  },
  PUBLISHED_POSTS: {
    where: { published: true },
    order: ['createdAt DESC'],
  },
};

dataProvider.getList({
  resource: 'users',
  params: { filter: FILTERS.ACTIVE_USERS },
});
```

### 4. Handle Errors Gracefully

Wrap calls in try-catch:

```typescript
try {
  const result = await dataProvider.getList({
    resource: 'users',
    params: { /* ... */ },
  });
} catch (error) {
  console.error('Failed to fetch users:', error);
  // Show user-friendly error message
}
```

### 5. Optimize with Field Selection

Only fetch needed fields:

```typescript
dataProvider.getList({
  resource: 'users',
  params: {
    filter: {
      fields: { id: true, name: true, email: true },
      // Omit large fields like 'avatar', 'bio', etc.
    },
  },
});
```

## Performance Tips

1. **Use pagination**: Always paginate large datasets
2. **Limit relations**: Use `scope.limit` when including relations
3. **Select fields**: Use `fields` filter to fetch only needed data
4. **Batch operations**: Use `updateMany` / `deleteMany` instead of loops
5. **Cache with TanStack Query**: React Admin integrates with React Query for caching

## See Also

- [Data Provider Guide](/guides/data-providers/) - Complete data provider guide
- [LoopBack Filters](/guides/data-providers/loopback-filters) - Filter syntax reference
- [Network Customization](/guides/advanced/network-customization) - Customize HTTP layer
- [React Admin Data Provider](https://marmelab.com/react-admin/DataProviderIntroduction.html) - React Admin docs

---

**Next**: Learn about [BaseCrudService](/api-reference/services/base-crud-service) for the service layer.

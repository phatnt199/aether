# DefaultNetworkRequestService

Low-level HTTP request service with authentication, header management, and response transformation.

## Import

```typescript
import { DefaultNetworkRequestService } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
class DefaultNetworkRequestService extends BaseService {
  constructor(opts: {
    name: string;
    baseUrl?: string;
    headers?: HeadersInit;
    noAuthPaths?: string[];
  });

  // Authentication
  getRequestAuthorizationHeader(): { provider: string; token: string };
  setAuthToken(opts: { type?: string; value: string }): void;

  // Headers
  setHeaders(headers: HeadersInit): void;
  getRequestHeader(opts: { resource: string }): HeadersInit;

  // Request Building
  getRequestProps(params: IGetRequestPropsParams): IGetRequestPropsResult;
  convertResponse<TData>(opts: {
    response: { data: TData; headers: Record<string, any> };
    type: string;
  }): { data: TData; total?: number };

  // Execution
  doRequest<ReturnType>(opts: {
    baseUrl?: string;
    query?: any;
    type: TRequestType;
    method: TRequestMethod;
    paths: string[];
    body?: any;
    headers?: HeadersInit;
  }): Promise<{ data: ReturnType; total?: number }>;
}

interface IGetRequestPropsParams {
  bodyType?: 'json' | 'form-data' | 'form-urlencoded';
  body: any;
  resource: string;
}

interface IGetRequestPropsResult {
  headers: HeadersInit;
  body: any;
}
```

## Description

`DefaultNetworkRequestService` is a comprehensive HTTP client service that handles authentication, request formatting, header management, and response transformation. It's used internally by `DefaultRestDataProvider` for all API calls.

**Key features**:
- Automatic JWT token injection in Authorization header
- Support for JSON, FormData, and URL-encoded request bodies
- Timezone header injection
- Content-Range parsing for pagination
- Binary response handling (Blob/octet-stream)
- No-auth paths configuration
- Custom header management
- Built on Node.js Fetch API

**When to use**:
- Implement custom data providers
- Make authenticated API calls outside React Admin
- Handle file uploads with FormData
- Debug network requests
- Extend with custom request/response transformation

**Request flow**:
1. Build headers with auth token (unless path is in noAuthPaths)
2. Format request body based on bodyType
3. Execute request via NodeFetchNetworkRequest
4. Transform response based on request type
5. Return data with optional total count

## Constructor Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | Yes | Service name for logging |
| `baseUrl` | `string` | No | Base API URL (e.g., `https://api.example.com`) |
| `headers` | `HeadersInit` | No | Default headers for all requests |
| `noAuthPaths` | `string[]` | No | Paths that don't require authentication |

**Example**:
```typescript
const networkService = new DefaultNetworkRequestService({
  name: 'MyNetworkService',
  baseUrl: 'https://api.example.com',
  headers: {
    'X-App-Version': '1.0.0',
  },
  noAuthPaths: ['/auth/login', '/auth/register'],
});
```

---

## Methods

### getRequestAuthorizationHeader()

Get authorization header with JWT token from localStorage.

**Signature**:
```typescript
getRequestAuthorizationHeader(): { provider: string; token: string }
```

**Returns**: Object with `provider` and formatted `token`

**Throws**: 401 error if token is invalid or missing

**Example**:
```typescript
try {
  const authHeader = networkService.getRequestAuthorizationHeader();
  console.log(authHeader.token);     // 'Bearer eyJhbGc...'
  console.log(authHeader.provider);  // 'local' or 'oauth2'
} catch (error) {
  console.error('No valid token');
}
```

**Token Format**: `${type} ${value}` (e.g., `Bearer eyJhbGc...`)

**Storage**: Reads from `LocalStorageKeys.KEY_AUTH_TOKEN` (`@app/auth/token`)

**Note**: This method is called automatically for authenticated endpoints.

---

### setAuthToken()

Set authentication token programmatically (overrides localStorage).

**Signature**:
```typescript
setAuthToken(opts: { type?: string; value: string }): void
```

**Parameters**:
- `type` - Token type (optional, default: `'Bearer'`)
- `value` - Token value (required)

**Example**:
```typescript
// Set custom token
networkService.setAuthToken({
  type: 'Bearer',
  value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
});

// Now all requests use this token instead of localStorage
```

**Use case**: Testing with custom tokens, server-side rendering

---

### setHeaders()

Merge custom headers with existing headers.

**Signature**:
```typescript
setHeaders(headers: HeadersInit): void
```

**Parameters**:
- `headers` - Headers to merge

**Example**:
```typescript
// Add custom headers
networkService.setHeaders({
  'X-Custom-Header': 'value',
  'X-Request-ID': '12345',
});

// Headers are merged, not replaced
```

**Note**: Uses lodash `merge()`, so nested objects are deep-merged.

---

### getRequestHeader()

Build complete request headers including auth and timezone.

**Signature**:
```typescript
getRequestHeader(opts: { resource: string }): HeadersInit
```

**Parameters**:
- `resource` - API path (used to check noAuthPaths)

**Returns**: Complete headers object

**Example**:
```typescript
// For authenticated endpoint
const headers = networkService.getRequestHeader({
  resource: '/users',
});
// Returns:
// {
//   'Timezone': 'America/New_York',
//   'Timezone-Offset': '-300',
//   'x-auth-provider': 'local',
//   'authorization': 'Bearer eyJhbGc...',
//   ...customHeaders
// }

// For public endpoint (in noAuthPaths)
const publicHeaders = networkService.getRequestHeader({
  resource: '/auth/login',
});
// Returns:
// {
//   'Timezone': 'America/New_York',
//   'Timezone-Offset': '-300',
//   ...customHeaders
// }
// (No authorization header)
```

**Headers injected**:
- `Timezone` - User's timezone (from `App.TIMEZONE`)
- `Timezone-Offset` - Timezone offset in minutes
- `x-auth-provider` - Auth provider name
- `authorization` - JWT token
- Custom headers from constructor/setHeaders

---

### getRequestProps()

Format request properties based on body type.

**Signature**:
```typescript
getRequestProps(params: {
  bodyType?: 'json' | 'form-data' | 'form-urlencoded';
  body: any;
  resource: string;
}): { headers: HeadersInit; body: any }
```

**Parameters**:
- `bodyType` - Request body format (optional, default: `'json'`)
- `body` - Request payload
- `resource` - API path

**Returns**: Object with formatted `headers` and `body`

**Body Types**:

#### JSON (default)
```typescript
const props = networkService.getRequestProps({
  bodyType: 'json',
  body: { name: 'John', email: 'john@example.com' },
  resource: '/users',
});

// Headers: { 'Content-Type': 'application/json', ... }
// Body: { name: 'John', email: 'john@example.com' }
```

#### FormData (for file uploads)
```typescript
const props = networkService.getRequestProps({
  bodyType: 'form-data',
  body: {
    avatar: fileInput.files[0],        // Single file
    documents: fileInput.files,        // FileList
    photos: [file1, file2],            // File array
  },
  resource: '/users/upload',
});

// Headers: { ...authHeaders } (no Content-Type, browser sets it)
// Body: FormData instance
```

#### Form URL Encoded
```typescript
const props = networkService.getRequestProps({
  bodyType: 'form-urlencoded',
  body: { username: 'admin', password: 'secret' },
  resource: '/auth/login',
});

// Headers: { 'Content-Type': 'application/x-www-form-urlencoded', ... }
// Body: FormData instance
```

---

### convertResponse()

Transform API response based on request type.

**Signature**:
```typescript
convertResponse<TData>(opts: {
  response: { data: TData; headers: Record<string, any> };
  type: string;
}): { data: TData; total?: number }
```

**Parameters**:
- `response.data` - Response data
- `response.headers` - Response headers
- `type` - Request type (e.g., `'GET_LIST'`, `'GET_ONE'`)

**Returns**: Object with `data` and optional `total`

**Example**:
```typescript
// For GET_LIST (pagination)
const result = networkService.convertResponse({
  response: {
    data: [{ id: 1 }, { id: 2 }],
    headers: new Headers({
      'Content-Range': 'users 0-9/42',
    }),
  },
  type: 'GET_LIST',
});
// Returns: { data: [{ id: 1 }, { id: 2 }], total: 42 }

// For GET_ONE (single record)
const result = networkService.convertResponse({
  response: {
    data: { id: 1, name: 'John' },
    headers: new Headers(),
  },
  type: 'GET_ONE',
});
// Returns: { data: { id: 1, name: 'John' } }
```

**Content-Range parsing**:
- Format: `<unit> <start>-<end>/<total>`
- Example: `users 0-9/42` → total = 42
- Used for React Admin pagination

---

### doRequest()

Execute HTTP request with full configuration.

**Signature**:
```typescript
doRequest<ReturnType>(opts: {
  baseUrl?: string;
  query?: any;
  type: TRequestType;
  method: TRequestMethod;
  paths: string[];
  body?: any;
  headers?: HeadersInit;
}): Promise<{ data: ReturnType; total?: number }>
```

**Parameters**:
- `baseUrl` - Override base URL (optional)
- `query` - URL query parameters
- `type` - Request type (for response conversion)
- `method` - HTTP method (GET, POST, PUT, PATCH, DELETE)
- `paths` - URL path segments
- `body` - Request body (ignored for GET)
- `headers` - Request headers

**Returns**: Promise with `data` and optional `total`

**Example**:
```typescript
// GET request
const users = await networkService.doRequest({
  type: 'GET_LIST',
  method: 'GET',
  paths: ['/users'],
  query: { page: 1, limit: 10 },
  headers: { 'Accept': 'application/json' },
});
// users.data = [...]
// users.total = 42

// POST request
const newUser = await networkService.doRequest({
  type: 'CREATE',
  method: 'POST',
  paths: ['/users'],
  body: { name: 'John', email: 'john@example.com' },
  headers: { 'Content-Type': 'application/json' },
});
// newUser.data = { id: 123, name: 'John', ... }

// File download (binary response)
const file = await networkService.doRequest({
  type: 'GET_ONE',
  method: 'GET',
  paths: ['/files', '123', 'download'],
  headers: { 'Accept': 'application/octet-stream' },
});
// file.data = Blob instance
```

**Status Handling**:
- **2xx**: Success, parse JSON or Blob
- **204**: No content, return empty object
- **4xx/5xx**: Throw error with response body

**Response Types**:
- `application/json` → Parsed JSON
- `application/octet-stream` → Blob
- Status 204 → Empty object `{}`

---

## Complete Examples

### Creating Custom Data Provider

```typescript
import { injectable } from '@venizia/ignis-inversion';
import { DefaultNetworkRequestService } from '@minimaltech/ra-core-infra';
import type { IDataProvider } from '@minimaltech/ra-core-infra';

@injectable()
export class MyDataProvider implements IDataProvider {
  private networkService: DefaultNetworkRequestService;

  constructor() {
    this.networkService = new DefaultNetworkRequestService({
      name: 'MyDataProvider',
      baseUrl: 'https://api.example.com',
      noAuthPaths: ['/auth/login'],
    });
  }

  async getList(resource: string, params: any) {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const result = await this.networkService.doRequest({
      type: 'GET_LIST',
      method: 'GET',
      paths: [`/${resource}`],
      query: {
        _page: page,
        _limit: perPage,
        _sort: field,
        _order: order,
      },
      headers: this.networkService.getRequestHeader({ resource }),
    });

    return {
      data: result.data,
      total: result.total || 0,
    };
  }

  async getOne(resource: string, params: any) {
    const result = await this.networkService.doRequest({
      type: 'GET_ONE',
      method: 'GET',
      paths: [`/${resource}`, params.id],
      headers: this.networkService.getRequestHeader({ resource }),
    });

    return { data: result.data };
  }

  async create(resource: string, params: any) {
    const result = await this.networkService.doRequest({
      type: 'CREATE',
      method: 'POST',
      paths: [`/${resource}`],
      body: params.data,
      headers: this.networkService.getRequestHeader({ resource }),
    });

    return { data: result.data };
  }

  // ... other methods
}
```

---

### File Upload with FormData

```typescript
import { DefaultNetworkRequestService } from '@minimaltech/ra-core-infra';

const networkService = new DefaultNetworkRequestService({
  name: 'FileUploadService',
  baseUrl: 'https://api.example.com',
});

async function uploadUserAvatar(userId: string, file: File) {
  // Build FormData request
  const requestProps = networkService.getRequestProps({
    bodyType: 'form-data',
    body: {
      avatar: file,
      userId: userId,
    },
    resource: '/users/avatar',
  });

  // Execute upload
  const result = await networkService.doRequest({
    type: 'UPDATE',
    method: 'POST',
    paths: ['/users', userId, 'avatar'],
    body: requestProps.body,
    headers: requestProps.headers,
  });

  return result.data;
}

// Usage
const fileInput = document.querySelector('input[type=file]');
const file = fileInput.files[0];
await uploadUserAvatar('user-123', file);
```

---

### Custom Authentication Flow

```typescript
import { DefaultNetworkRequestService, LocalStorageKeys } from '@minimaltech/ra-core-infra';

const networkService = new DefaultNetworkRequestService({
  name: 'AuthService',
  baseUrl: 'https://api.example.com',
  noAuthPaths: ['/auth/login', '/auth/register'],
});

async function login(username: string, password: string) {
  // Login request (no auth required)
  const requestProps = networkService.getRequestProps({
    bodyType: 'json',
    body: { username, password },
    resource: '/auth/login',
  });

  const result = await networkService.doRequest({
    type: 'CREATE',
    method: 'POST',
    paths: ['/auth/login'],
    body: requestProps.body,
    headers: requestProps.headers,
  });

  // Save token to localStorage
  const { token, userId } = result.data;
  localStorage.setItem(
    LocalStorageKeys.KEY_AUTH_TOKEN,
    JSON.stringify({ value: token, type: 'Bearer' })
  );

  // Set token in service for immediate use
  networkService.setAuthToken({ value: token, type: 'Bearer' });

  return result.data;
}

async function fetchProtectedData() {
  // This request will automatically include Authorization header
  const result = await networkService.doRequest({
    type: 'GET_LIST',
    method: 'GET',
    paths: ['/users/me/data'],
    headers: networkService.getRequestHeader({ resource: '/users/me/data' }),
  });

  return result.data;
}
```

---

### Binary File Download

```typescript
import { DefaultNetworkRequestService } from '@minimaltech/ra-core-infra';

const networkService = new DefaultNetworkRequestService({
  name: 'FileDownloadService',
  baseUrl: 'https://api.example.com',
});

async function downloadFile(fileId: string) {
  const result = await networkService.doRequest({
    type: 'GET_ONE',
    method: 'GET',
    paths: ['/files', fileId, 'download'],
    headers: {
      ...networkService.getRequestHeader({ resource: '/files' }),
      'Accept': 'application/octet-stream',
    },
  });

  // result.data is a Blob
  const blob = result.data as Blob;

  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `file-${fileId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

---

### Request/Response Interceptor Pattern

```typescript
import { DefaultNetworkRequestService } from '@minimaltech/ra-core-infra';

export class InterceptedNetworkService extends DefaultNetworkRequestService {
  async doRequest<ReturnType>(opts: any): Promise<any> {
    // Pre-request interceptor
    console.log('Request:', opts.method, opts.paths.join('/'));
    console.log('Query:', opts.query);

    const startTime = Date.now();

    try {
      // Execute request
      const result = await super.doRequest<ReturnType>(opts);

      // Post-response interceptor (success)
      const duration = Date.now() - startTime;
      console.log(`Response: ${duration}ms`, result);

      return result;
    } catch (error) {
      // Post-response interceptor (error)
      const duration = Date.now() - startTime;
      console.error(`Error: ${duration}ms`, error);

      // Transform error or retry
      if (error.statusCode === 401) {
        console.log('Unauthorized, redirecting to login...');
        window.location.href = '/login';
      }

      throw error;
    }
  }
}
```

---

## Related APIs

- [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) - Uses this service
- [DefaultAuthService](/api-reference/services/default-auth-service) - Token management
- [BaseService](/api-reference/services/base-service) - Parent service class
- [CoreBindings](/api-reference/core/core-bindings) - DI binding keys

## Common Issues

### "Invalid auth token to fetch"

**Cause**: No token in localStorage or `setAuthToken()` not called.

**Solution**: Ensure user is logged in or add path to noAuthPaths:

```typescript
const networkService = new DefaultNetworkRequestService({
  name: 'Service',
  baseUrl: 'https://api.example.com',
  noAuthPaths: ['/public-endpoint'],  // No auth required
});
```

### "Invalid baseUrl to send request"

**Cause**: baseUrl not provided in constructor or doRequest.

**Solution**: Provide baseUrl:

```typescript
const networkService = new DefaultNetworkRequestService({
  name: 'Service',
  baseUrl: 'https://api.example.com',  // Required!
});
```

### FormData not working

**Cause**: Setting Content-Type header manually.

**Solution**: Don't set Content-Type for FormData (browser sets it automatically):

```typescript
// ❌ Wrong
const props = networkService.getRequestProps({
  bodyType: 'form-data',
  body: { file: fileInput.files[0] },
  resource: '/upload',
});

await networkService.doRequest({
  method: 'POST',
  paths: ['/upload'],
  body: props.body,
  headers: {
    ...props.headers,
    'Content-Type': 'multipart/form-data',  // Don't do this!
  },
});

// ✅ Correct
await networkService.doRequest({
  method: 'POST',
  paths: ['/upload'],
  body: props.body,
  headers: props.headers,  // Let browser set Content-Type
});
```

### CORS errors

**Cause**: Missing CORS configuration on backend.

**Solution**: Configure backend to allow requests from your frontend origin:

```javascript
// Backend (Express example)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

## Best Practices

### 1. Configure noAuthPaths

Always specify public endpoints:

```typescript
const networkService = new DefaultNetworkRequestService({
  name: 'Service',
  baseUrl: 'https://api.example.com',
  noAuthPaths: [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/public/*',  // All public paths
  ],
});
```

### 2. Use getRequestProps for Body Formatting

Let the service handle Content-Type:

```typescript
// ✅ Correct
const props = networkService.getRequestProps({
  bodyType: 'json',  // or 'form-data' or 'form-urlencoded'
  body: data,
  resource: '/endpoint',
});

await networkService.doRequest({
  method: 'POST',
  paths: ['/endpoint'],
  body: props.body,
  headers: props.headers,  // Correct Content-Type set
});
```

### 3. Handle Errors Gracefully

Wrap requests in try-catch:

```typescript
async function fetchData() {
  try {
    const result = await networkService.doRequest({
      type: 'GET_LIST',
      method: 'GET',
      paths: ['/users'],
      headers: networkService.getRequestHeader({ resource: '/users' }),
    });
    return result.data;
  } catch (error) {
    if (error.statusCode === 401) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.statusCode === 403) {
      // Show access denied
      alert('Access denied');
    } else {
      // Show generic error
      console.error('Request failed:', error);
    }
    throw error;
  }
}
```

### 4. Extend for Custom Logic

Create service subclass for application-specific behavior:

```typescript
export class MyNetworkService extends DefaultNetworkRequestService {
  // Override to add request ID
  getRequestHeader(opts: { resource: string }) {
    const headers = super.getRequestHeader(opts);
    return {
      ...headers,
      'X-Request-ID': this.generateRequestId(),
    };
  }

  private generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add retry logic
  async doRequest<ReturnType>(opts: any): Promise<any> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        return await super.doRequest<ReturnType>(opts);
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts || error.statusCode < 500) {
          throw error;
        }
        // Retry on 5xx errors
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }
}
```

### 5. Type Your Responses

Use TypeScript generics for type safety:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserListResponse {
  data: User[];
  total: number;
}

async function getUsers() {
  const result = await networkService.doRequest<User[]>({
    type: 'GET_LIST',
    method: 'GET',
    paths: ['/users'],
    headers: networkService.getRequestHeader({ resource: '/users' }),
  });

  // result.data is typed as User[]
  const users: User[] = result.data;
  const total: number = result.total || 0;

  return { users, total };
}
```

## Performance Tips

1. **Reuse service instances**: Create once, use throughout application
2. **Use getRequestProps**: Avoid recreating FormData/headers manually
3. **Set auth token once**: Call `setAuthToken()` after login, not per request
4. **Cache responses**: Combine with TanStack Query or similar
5. **Use Content-Range**: Let server send total count in header instead of separate query

## Security Considerations

### 1. Secure Token Storage

Tokens in localStorage are vulnerable to XSS:

```typescript
// Consider using httpOnly cookies instead (requires backend support)
// Or implement token refresh with short expiration
```

### 2. Validate Responses

Always validate API responses:

```typescript
async function fetchUser(id: string) {
  const result = await networkService.doRequest({
    type: 'GET_ONE',
    method: 'GET',
    paths: ['/users', id],
    headers: networkService.getRequestHeader({ resource: '/users' }),
  });

  // Validate response structure
  if (!result.data || typeof result.data.id !== 'string') {
    throw new Error('Invalid response from server');
  }

  return result.data;
}
```

### 3. Sanitize User Input

Never trust user input in URLs or bodies:

```typescript
// ❌ Wrong - vulnerable to injection
const userId = userInput;  // Could be: "123'; DROP TABLE users--"
await networkService.doRequest({
  method: 'GET',
  paths: ['/users', userId],  // Dangerous!
});

// ✅ Correct - validate and sanitize
function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9-_]+$/.test(id);
}

const userId = userInput;
if (!isValidId(userId)) {
  throw new Error('Invalid user ID');
}
await networkService.doRequest({
  method: 'GET',
  paths: ['/users', userId],
});
```

## See Also

- [HTTP Requests Guide](/guides/networking/http-requests) - Complete networking guide
- [DefaultRestDataProvider](/api-reference/providers/default-rest-data-provider) - Data provider implementation
- [Authentication Guide](/guides/authentication/) - Auth setup
- [File Upload Guide](/guides/networking/file-uploads) - File handling

---

**Next**: Learn about [DefaultI18nProvider](/api-reference/providers/default-i18n-provider) for internationalization.

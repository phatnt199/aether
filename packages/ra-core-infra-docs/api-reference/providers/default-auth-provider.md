# DefaultAuthProvider

JWT/token-based authentication provider implementing React Admin's `IAuthProvider` interface.

## Import

```typescript
import { DefaultAuthProvider, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IAuthProviderOptions } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
class DefaultAuthProvider<TResource extends string = string>
  extends BaseProvider<IAuthProvider>

interface IAuthProviderOptions {
  endpoints?: {
    afterLogin?: string;
  };
  paths?: {
    signIn?: string;
    signUp?: string;
    checkAuth?: string;
  };
}

constructor(
  @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
  restDataProvider: IDataProvider<TResource>,
  @inject({ key: CoreBindings.AUTH_PROVIDER_OPTIONS })
  authProviderOptions: IAuthProviderOptions,
  @inject({ key: CoreBindings.DEFAULT_AUTH_SERVICE })
  authService: DefaultAuthService
)
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoints.afterLogin` | `string` | `"/"` | Redirect path after successful login |
| `paths.signIn` | `string` | `"/auth/login"` | Login API endpoint |
| `paths.signUp` | `string` | - | Signup API endpoint |
| `paths.checkAuth` | `string` | - | Token validation endpoint (optional) |

## Description

`DefaultAuthProvider` provides JWT/token-based authentication for React Admin applications. It handles login, logout, token validation, and user identity management using localStorage for token persistence.

**Key features**:
- Token-based authentication (JWT)
- Automatic token storage in localStorage
- HTTP error handling (401, 403)
- User identity management
- Role-based access control (RBAC)
- Integration with DefaultAuthService for token management

**When to use**:
- JWT authentication flows
- Token-based API authentication
- Standard login/logout functionality
- Protected routes and permissions

## Methods

### login()

Authenticate user with credentials and store auth token.

**Signature**:
```typescript
login(params: any): Promise<{ redirectTo: string }>
```

**Parameters**:
- `params` - Login credentials (typically `{ username, password }`)

**Returns**: Promise resolving to redirect configuration

**Flow**:
1. POST credentials to login endpoint
2. Extract `token` and `userId` from response
3. Save token to localStorage via DefaultAuthService
4. Return redirect path

**Example**:
```typescript
const authProvider = useInjectable<IAuthProvider>({
  key: CoreBindings.DEFAULT_AUTH_PROVIDER,
});

// Login with credentials
await authProvider.login({
  username: 'admin',
  password: 'password123',
});

// Redirects to configured afterLogin path
```

**API Request**:
```
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**Expected Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user-123"
}
```

---

### logout()

Clear authentication data and log user out.

**Signature**:
```typescript
logout(params: any): Promise<void>
```

**Parameters**:
- `params` - Logout parameters (currently unused)

**Returns**: Promise resolving when logout complete

**Flow**:
1. Call `authService.cleanUp()`
2. Clear token from localStorage
3. Clear user identity

**Example**:
```typescript
// Simple logout
await authProvider.logout({});

// User is logged out, token cleared
```

---

### checkAuth()

Verify user is authenticated (for protected routes).

**Signature**:
```typescript
checkAuth(params: any): Promise<void>
```

**Parameters**:
- `params` - Check parameters (currently unused)

**Returns**: Promise resolving if authenticated, rejecting if not

**Rejection**: `{ redirectTo: 'login' }` when not authenticated

**Flow**:
1. Check if token exists in localStorage
2. If no token → reject with redirect to login
3. If `paths.checkAuth` configured → validate token with API
4. If validation fails → reject with redirect to login
5. Otherwise → resolve (authenticated)

**Example**:
```typescript
// Check if user is authenticated
try {
  await authProvider.checkAuth({});
  console.log('User is authenticated');
} catch (error) {
  console.log('User is not authenticated', error.redirectTo);
  // error = { redirectTo: 'login' }
}
```

**With Token Validation** (optional):
```typescript
// Configure in application
const authProviderOptions: IAuthProviderOptions = {
  paths: {
    signIn: '/auth/login',
    checkAuth: '/auth/verify',  // API endpoint to validate token
  },
};

// Calls GET /auth/verify with auth header
// Validates token server-side
```

---

### checkError()

Handle HTTP authentication errors.

**Signature**:
```typescript
checkError(params: { status: number }): Promise<void>
```

**Parameters**:
- `params.status` - HTTP status code

**Returns**: Promise resolving or rejecting based on status

**Behavior**:
- **401 Unauthorized**: Clear auth, redirect to login
- **403 Forbidden**: Redirect to /unauthorized, keep user logged in
- **Other statuses**: Resolve (no action)

**Example**:
```typescript
// Automatically called by React Admin on HTTP errors
// You typically don't call this manually

// 401 handling
try {
  await authProvider.checkError({ status: 401 });
} catch (error) {
  console.log(error.redirectTo);  // 'login'
  // Token cleared, user logged out
}

// 403 handling
try {
  await authProvider.checkError({ status: 403 });
} catch (error) {
  console.log(error.redirectTo);  // '/unauthorized'
  console.log(error.logoutUser);  // false
  // User stays logged in, redirected to unauthorized page
}

// Other errors (e.g., 500)
await authProvider.checkError({ status: 500 });
// Resolves, no action taken
```

---

### getIdentity()

Get current user's identity information.

**Signature**:
```typescript
getIdentity(params: any): Promise<UserIdentity>
```

**Parameters**:
- `params` - Identity parameters (currently unused)

**Returns**: Promise resolving to user identity object

**Example**:
```typescript
const identity = await authProvider.getIdentity({});

console.log(identity.userId);    // 'user-123'
console.log(identity.username);  // 'admin'
console.log(identity.token);     // JWT token

// Use in component
function UserProfile() {
  const [identity, setIdentity] = React.useState(null);

  React.useEffect(() => {
    authProvider.getIdentity({}).then(setIdentity);
  }, []);

  return <div>Welcome, {identity?.username}</div>;
}
```

**Identity Object Structure**:
```typescript
interface UserIdentity {
  userId: string;
  username?: string;
  token?: string;
  // ... other fields from localStorage
}
```

---

### getPermissions()

Get current user's permissions.

**Signature**:
```typescript
getPermissions(params: any): Promise<any>
```

**Parameters**:
- `params` - Permission parameters (currently unused)

**Returns**: Promise resolving to permissions (currently undefined)

**Note**: Default implementation returns `Promise.resolve()`. Override for custom permission logic.

**Example**:
```typescript
const permissions = await authProvider.getPermissions({});
// Currently returns undefined
```

**Custom Implementation**:
```typescript
// Extend DefaultAuthProvider for custom permissions
export class MyAuthProvider extends DefaultAuthProvider {
  async getPermissions(_params: any) {
    const user = this.authService.getUser();
    const identity = await this.authService.getIdentity();

    // Fetch permissions from API
    const response = await this.restDataProvider.send({
      resource: '/auth/permissions',
      params: { method: 'GET' },
    });

    return response.data.permissions;
  }
}
```

---

### getRoles()

Get current user's roles.

**Signature**:
```typescript
getRoles(params: any): Promise<string[]>
```

**Parameters**:
- `params` - Role parameters (currently unused)

**Returns**: Promise resolving to array of role names

**Example**:
```typescript
const roles = await authProvider.getRoles({});
console.log(roles);  // ['admin', 'editor']

// Use in component for role-based rendering
function AdminPanel() {
  const [roles, setRoles] = React.useState([]);

  React.useEffect(() => {
    authProvider.getRoles({}).then(setRoles);
  }, []);

  if (!roles.includes('admin')) {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

---

## Configuration Example

### Basic Setup

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IAuthProviderOptions } from '@minimaltech/ra-core-infra';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    const authProviderOptions: IAuthProviderOptions = {
      paths: {
        signIn: '/auth/login',
        checkAuth: '/auth/verify',  // Optional token validation
      },
      endpoints: {
        afterLogin: '/dashboard',
      },
    };

    this.container.bind({
      key: CoreBindings.AUTH_PROVIDER_OPTIONS,
      value: authProviderOptions,
    });
  }
}
```

### Custom Paths

```typescript
const authProviderOptions: IAuthProviderOptions = {
  paths: {
    signIn: '/api/v1/auth/signin',
    signUp: '/api/v1/auth/signup',
    checkAuth: '/api/v1/auth/check',
  },
  endpoints: {
    afterLogin: '/admin/dashboard',
  },
};
```

### Without Token Validation

```typescript
// If you don't need server-side token validation
const authProviderOptions: IAuthProviderOptions = {
  paths: {
    signIn: '/auth/login',
    // No checkAuth path - only checks localStorage
  },
  endpoints: {
    afterLogin: '/',
  },
};
```

---

## Using in React Admin

### With Admin Component

```typescript
import { Admin, Resource } from 'react-admin';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IAuthProvider } from '@minimaltech/ra-core-infra';

function App() {
  const authProvider = useInjectable<IAuthProvider>({
    key: CoreBindings.DEFAULT_AUTH_PROVIDER,
  });

  return (
    <Admin authProvider={authProvider}>
      <Resource name="users" />
      <Resource name="posts" />
    </Admin>
  );
}
```

### Custom Login Page

```typescript
import { Login, LoginForm } from 'react-admin';

function MyLoginPage() {
  return (
    <Login>
      <LoginForm />
    </Login>
  );
}

// Use in Admin
<Admin authProvider={authProvider} loginPage={MyLoginPage}>
  {/* ... */}
</Admin>
```

### Protected Routes

```typescript
import { Admin, Resource } from 'react-admin';

// Admin component automatically protects all routes
// checkAuth() is called before each route
<Admin authProvider={authProvider}>
  <Resource name="admin-panel" />  {/* Protected */}
  <Resource name="settings" />      {/* Protected */}
</Admin>
```

---

## Complete Example

### Full Authentication Flow

```typescript
// Application setup
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Data provider
    this.container.bind({
      key: CoreBindings.REST_DATA_PROVIDER_OPTIONS,
      value: { url: 'https://api.example.com' },
    });

    // Auth provider
    this.container.bind({
      key: CoreBindings.AUTH_PROVIDER_OPTIONS,
      value: {
        paths: {
          signIn: '/auth/login',
          checkAuth: '/auth/verify',
        },
        endpoints: {
          afterLogin: '/dashboard',
        },
      },
    });
  }
}

// React App
import React from 'react';
import { Admin, Resource, ListGuesser } from 'react-admin';
import { ApplicationContext, useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IAuthProvider, IDataProvider } from '@minimaltech/ra-core-infra';

export function App() {
  const [app] = React.useState(() => {
    const application = new MyApplication();
    application.start();
    return application;
  });

  return (
    <ApplicationContext.Provider
      value={{
        container: app.container,
        logger: app.logger,
        registry: app.registry,
      }}
    >
      <AdminApp />
    </ApplicationContext.Provider>
  );
}

function AdminApp() {
  const authProvider = useInjectable<IAuthProvider>({
    key: CoreBindings.DEFAULT_AUTH_PROVIDER,
  });

  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  return (
    <Admin authProvider={authProvider} dataProvider={dataProvider}>
      <Resource name="users" list={ListGuesser} />
      <Resource name="posts" list={ListGuesser} />
    </Admin>
  );
}
```

---

## Related APIs

- [DefaultAuthService](/api-reference/services/default-auth-service) - Token management service
- [useInjectable](/api-reference/hooks/use-injectable) - Inject auth provider
- [CoreBindings](/api-reference/core/core-bindings) - DI binding keys
- [React Admin Auth](https://marmelab.com/react-admin/Authentication.html) - React Admin auth docs

## Common Issues

### "No userId to get user identity"

**Cause**: User is not logged in or token is missing.

**Solution**: Ensure user is logged in before calling `getIdentity()`:

```typescript
try {
  await authProvider.checkAuth({});
  const identity = await authProvider.getIdentity({});
} catch (error) {
  // User not logged in
}
```

### Login fails with CORS error

**Cause**: API doesn't allow requests from frontend domain.

**Solution**: Configure CORS on your backend to allow your frontend origin.

### Token expires too quickly

**Cause**: Backend token expiration is short.

**Solution**: Implement token refresh logic:

```typescript
export class MyAuthProvider extends DefaultAuthProvider {
  async checkAuth(params: any) {
    const token = this.authService.getAuth();

    if (this.isTokenExpired(token)) {
      // Refresh token
      const newToken = await this.refreshToken();
      this.authService.saveAuth(newToken);
    }

    return super.checkAuth(params);
  }

  private isTokenExpired(token: any): boolean {
    // Decode JWT and check expiration
    // ...
  }

  private async refreshToken() {
    // Call refresh endpoint
    // ...
  }
}
```

### 401 errors not redirecting to login

**Cause**: React Admin not configured to use auth provider.

**Solution**: Ensure `authProvider` prop is passed to `<Admin>`:

```typescript
<Admin authProvider={authProvider}>
  {/* ... */}
</Admin>
```

## Best Practices

### 1. Enable Token Validation

Configure `checkAuth` endpoint for server-side validation:

```typescript
const authProviderOptions: IAuthProviderOptions = {
  paths: {
    signIn: '/auth/login',
    checkAuth: '/auth/verify',  // Validates token on server
  },
};
```

### 2. Handle Token Expiration

Implement token refresh or re-authentication:

```typescript
export class MyAuthProvider extends DefaultAuthProvider {
  async checkAuth(params: any) {
    try {
      return await super.checkAuth(params);
    } catch (error) {
      // Token expired, try refresh
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return Promise.resolve();
      }
      throw error;
    }
  }
}
```

### 3. Customize Redirect Paths

Configure different redirect paths for different scenarios:

```typescript
const authProviderOptions: IAuthProviderOptions = {
  endpoints: {
    afterLogin: '/dashboard',  // After successful login
  },
};

// Handle 403 redirects
export class MyAuthProvider extends DefaultAuthProvider {
  checkError(params: any) {
    if (params.status === 403) {
      return Promise.reject({
        redirectTo: '/access-denied',
        message: 'You do not have permission',
      });
    }
    return super.checkError(params);
  }
}
```

### 4. Extend for Custom Logic

Extend DefaultAuthProvider for application-specific auth logic:

```typescript
export class MyAuthProvider extends DefaultAuthProvider {
  async login(params: any) {
    // Custom pre-login logic
    console.log('Logging in user:', params.username);

    const result = await super.login(params);

    // Custom post-login logic
    await this.trackLoginEvent(params.username);

    return result;
  }

  async logout(params: any) {
    // Custom pre-logout logic
    await this.trackLogoutEvent();

    return super.logout(params);
  }
}
```

### 5. Implement Permissions

Override `getPermissions()` for RBAC:

```typescript
export class MyAuthProvider extends DefaultAuthProvider {
  async getPermissions(_params: any) {
    const user = this.authService.getUser();

    const response = await this.restDataProvider.send({
      resource: `/users/${user.userId}/permissions`,
      params: { method: 'GET' },
    });

    return response.data.permissions;
  }
}

// Use in components
function DeleteButton() {
  const { permissions } = usePermissions();

  if (!permissions?.includes('delete')) {
    return null;
  }

  return <button>Delete</button>;
}
```

## See Also

- [Authentication Guide](/guides/authentication/) - Complete auth guide
- [Auth Provider Setup](/guides/authentication/auth-provider-setup) - Setup instructions
- [Login & Logout](/guides/authentication/login-logout) - Login/logout flows
- [Permissions](/guides/authentication/permissions) - RBAC implementation

---

**Next**: Learn about [DefaultAuthService](/api-reference/services/default-auth-service) for token management.

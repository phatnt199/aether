# DefaultAuthService

Low-level authentication service for token and user identity management using localStorage.

## Import

```typescript
import { DefaultAuthService, CoreBindings } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
class DefaultAuthService extends BaseService {
  constructor();

  getUser(): UserIdentity;
  getRoles(): Set<string>;
  getAuth(): any | null;
  saveAuth(opts: SaveAuthOptions): void;
  cleanUp(): void;
}

interface SaveAuthOptions {
  userId: number | string;
  username?: string;
  provider?: string;
  referenceId?: IdType;
  token: { value: string; type: string };
}

interface UserIdentity {
  userId: number | string;
  username?: string;
  provider?: string;
  referenceId?: IdType;
}
```

## Description

`DefaultAuthService` is a low-level service that manages authentication tokens and user identity using browser localStorage. It's used internally by `DefaultAuthProvider` for token persistence.

**Key features**:
- Token storage and retrieval using localStorage
- User identity management (userId, username, referenceId)
- Role-based access control (RBAC) storage
- OAuth2 provider tracking
- Safe cleanup of authentication data

**When to use**:
- Extend DefaultAuthProvider with custom auth logic
- Access user identity outside React Admin's auth context
- Implement custom token refresh logic
- Debug authentication issues

**Storage keys**:
- `@app/auth/token` - Authentication token object
- `@app/auth/identity` - User identity information
- `@app/auth/permission` - User roles array

## Methods

### getUser()

Get current user's identity from localStorage.

**Signature**:
```typescript
getUser(): UserIdentity
```

**Returns**: User identity object with userId, username, referenceId, and provider

**Example**:
```typescript
const authService = useInjectable<DefaultAuthService>({
  key: CoreBindings.DEFAULT_AUTH_SERVICE,
});

const user = authService.getUser();
console.log(user.userId);     // 'user-123'
console.log(user.username);   // 'admin'
console.log(user.provider);   // 'local' or 'oauth2'
```

**Storage Key**: `LocalStorageKeys.KEY_AUTH_IDENTITY` (`@app/auth/identity`)

**Default Value**: `{}` (empty object if not logged in)

---

### getRoles()

Get current user's roles from localStorage.

**Signature**:
```typescript
getRoles(): Set<string>
```

**Returns**: Set of role names

**Example**:
```typescript
const roles = authService.getRoles();

if (roles.has('admin')) {
  console.log('User is an admin');
}

// Convert to array
const roleArray = Array.from(roles);
console.log(roleArray); // ['admin', 'editor']
```

**Storage Key**: `LocalStorageKeys.KEY_AUTH_PERMISSION` (`@app/auth/permission`)

**Default Value**: `Set([])` (empty set if no roles stored)

**Note**: Returns a `Set<string>` for efficient membership checking.

---

### getAuth()

Get authentication token from localStorage.

**Signature**:
```typescript
getAuth(): any | null
```

**Returns**: Token object or `null` if not authenticated or parsing fails

**Example**:
```typescript
const auth = authService.getAuth();

if (auth) {
  console.log(auth.value);    // JWT token string
  console.log(auth.type);     // 'Bearer'
  console.log(auth.provider); // 'local' or 'oauth2'
} else {
  console.log('User not authenticated');
}
```

**Storage Key**: `LocalStorageKeys.KEY_AUTH_TOKEN` (`@app/auth/token`)

**Error Handling**: Returns `null` if:
- No token exists in localStorage
- Token JSON parsing fails (corrupted data)

**Token Object Structure**:
```typescript
{
  value: string;    // JWT token
  type: string;     // Usually 'Bearer'
  provider: string; // 'local', 'oauth2', etc.
}
```

---

### saveAuth()

Save authentication token and user identity to localStorage.

**Signature**:
```typescript
saveAuth(opts: {
  userId: number | string;
  username?: string;
  provider?: string;
  referenceId?: IdType;
  token: { value: string; type: string };
}): void
```

**Parameters**:
- `userId` - User ID (required)
- `username` - Username (optional, default: `''`)
- `provider` - Auth provider name (optional, default: `''`)
- `referenceId` - External reference ID (optional, default: `''`)
- `token.value` - JWT token string (required)
- `token.type` - Token type, e.g., 'Bearer' (required)

**Example**:
```typescript
// Save after successful login
authService.saveAuth({
  userId: 'user-123',
  username: 'admin',
  provider: 'local',
  token: {
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: 'Bearer',
  },
});

// User and token now persisted in localStorage
```

**What it stores**:
1. **Token object** in `@app/auth/token`:
   ```json
   {
     "value": "jwt-token-here",
     "type": "Bearer",
     "provider": "local"
   }
   ```

2. **User identity** in `@app/auth/identity`:
   ```json
   {
     "userId": "user-123",
     "username": "admin",
     "referenceId": "",
     "provider": "local"
   }
   ```

---

### cleanUp()

Remove all authentication-related data from localStorage.

**Signature**:
```typescript
cleanUp(): void
```

**Example**:
```typescript
// Called during logout
authService.cleanUp();

// All auth data cleared from localStorage
```

**What it removes**:
- All keys starting with `@app/auth/`
- All keys starting with `@app/oauth2/`

**Keys removed**:
- `@app/auth/token` - Auth token
- `@app/auth/identity` - User identity
- `@app/auth/permission` - User roles
- Any OAuth2-related keys

**Note**: This is called automatically by `DefaultAuthProvider.logout()`.

---

## Configuration

### LocalStorage Keys

The service uses predefined keys from `LocalStorageKeys`:

| Constant | Value | Purpose |
|----------|-------|---------|
| `KEY_AUTH_TOKEN` | `@app/auth/token` | Store auth token |
| `KEY_AUTH_IDENTITY` | `@app/auth/identity` | Store user identity |
| `KEY_AUTH_PERMISSION` | `@app/auth/permission` | Store user roles |

**Example**:
```typescript
import { LocalStorageKeys } from '@minimaltech/ra-core-infra';

// Direct localStorage access (not recommended)
const token = localStorage.getItem(LocalStorageKeys.KEY_AUTH_TOKEN);

// Prefer using the service methods
const auth = authService.getAuth();
```

---

## Using in Custom Auth Provider

### Extending DefaultAuthProvider

```typescript
import { injectable } from '@venizia/ignis-inversion';
import { DefaultAuthProvider, DefaultAuthService, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider } from '@minimaltech/ra-core-infra';

@injectable()
export class MyAuthProvider extends DefaultAuthProvider {
  constructor(
    @inject({ key: CoreBindings.DEFAULT_REST_DATA_PROVIDER })
    restDataProvider: IDataProvider,
    @inject({ key: CoreBindings.AUTH_PROVIDER_OPTIONS })
    authProviderOptions: any,
    @inject({ key: CoreBindings.DEFAULT_AUTH_SERVICE })
    authService: DefaultAuthService
  ) {
    super(restDataProvider, authProviderOptions, authService);
  }

  // Override login to add custom logic
  async login(params: any) {
    const result = await super.login(params);

    // Access auth service for custom logic
    const user = this.authService.getUser();
    console.log('User logged in:', user.username);

    // Track login event
    await this.trackLogin(user.userId);

    return result;
  }

  private async trackLogin(userId: string) {
    // Custom analytics tracking
  }
}
```

---

## Direct Usage in Components

### Accessing Auth Service

```typescript
import React from 'react';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { DefaultAuthService } from '@minimaltech/ra-core-infra';

function UserProfile() {
  const authService = useInjectable<DefaultAuthService>({
    key: CoreBindings.DEFAULT_AUTH_SERVICE,
  });

  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, [authService]);

  if (!user?.userId) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <h2>Welcome, {user.username}</h2>
      <p>User ID: {user.userId}</p>
      <p>Provider: {user.provider}</p>
    </div>
  );
}
```

### Role-Based Rendering

```typescript
import React from 'react';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { DefaultAuthService } from '@minimaltech/ra-core-infra';

function AdminPanel() {
  const authService = useInjectable<DefaultAuthService>({
    key: CoreBindings.DEFAULT_AUTH_SERVICE,
  });

  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const roles = authService.getRoles();
    setIsAdmin(roles.has('admin'));
  }, [authService]);

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

---

## Complete Example

### Custom Token Refresh Logic

```typescript
import { injectable } from '@venizia/ignis-inversion';
import { DefaultAuthService } from '@minimaltech/ra-core-infra';

@injectable()
export class MyAuthService extends DefaultAuthService {
  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const auth = this.getAuth();
    if (!auth?.value) return true;

    try {
      // Decode JWT (simple base64 decode)
      const payload = JSON.parse(atob(auth.value.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiry;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token with auto-refresh
   */
  async getAuthWithRefresh(): Promise<any> {
    const auth = this.getAuth();

    if (!auth) return null;

    if (this.isTokenExpired()) {
      // Refresh token logic here
      const newToken = await this.refreshToken(auth.value);

      if (newToken) {
        const user = this.getUser();
        this.saveAuth({
          userId: user.userId,
          username: user.username,
          provider: user.provider,
          token: newToken,
        });
        return newToken;
      }

      // Refresh failed, clear auth
      this.cleanUp();
      return null;
    }

    return auth;
  }

  private async refreshToken(oldToken: string) {
    // Call refresh endpoint
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oldToken}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      value: data.token,
      type: 'Bearer',
    };
  }
}
```

### Register Custom Service

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import { MyAuthService } from '@/services/MyAuthService';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Override default auth service
    this.container.rebind({
      key: CoreBindings.DEFAULT_AUTH_SERVICE,
      value: MyAuthService,
    });
  }
}
```

---

## Related APIs

- [DefaultAuthProvider](/api-reference/providers/default-auth-provider) - Uses this service for auth
- [useInjectable](/api-reference/hooks/use-injectable) - Inject service in components
- [CoreBindings](/api-reference/core/core-bindings) - DI binding keys
- [BaseService](/api-reference/services/base-service) - Parent service class

## Common Issues

### "Cannot read properties of undefined (reading 'userId')"

**Cause**: User is not logged in, `getUser()` returns empty object.

**Solution**: Check if userId exists before accessing:

```typescript
const user = authService.getUser();

if (!user?.userId) {
  console.log('User not logged in');
  return;
}

// Safe to use user.userId now
console.log(user.userId);
```

### Token parsing fails silently

**Cause**: `getAuth()` returns `null` when token is corrupted.

**Solution**: Check for `null` return value:

```typescript
const auth = authService.getAuth();

if (!auth) {
  console.log('No valid token found');
  // Redirect to login or refresh token
}
```

### Roles not updating after login

**Cause**: Roles are not stored during `saveAuth()`.

**Solution**: Store roles separately after login:

```typescript
// After successful login
authService.saveAuth({
  userId: 'user-123',
  username: 'admin',
  token: { value: 'jwt-token', type: 'Bearer' },
});

// Manually store roles
localStorage.setItem(
  LocalStorageKeys.KEY_AUTH_PERMISSION,
  JSON.stringify(['admin', 'editor'])
);
```

### cleanUp() doesn't remove custom keys

**Cause**: `cleanUp()` only removes keys starting with `@app/auth/` or `@app/oauth2/`.

**Solution**: Extend the service for custom cleanup:

```typescript
export class MyAuthService extends DefaultAuthService {
  cleanUp() {
    super.cleanUp();

    // Remove additional custom keys
    localStorage.removeItem('custom-auth-key');
  }
}
```

## Best Practices

### 1. Use Service Methods Instead of Direct localStorage

Prefer service methods over direct localStorage access:

```typescript
// ❌ Wrong - direct localStorage access
const token = localStorage.getItem('@app/auth/token');
const user = JSON.parse(localStorage.getItem('@app/auth/identity') || '{}');

// ✅ Correct - use service methods
const auth = authService.getAuth();
const user = authService.getUser();
```

### 2. Check Authentication Before Accessing

Always verify user is logged in:

```typescript
const user = authService.getUser();

if (!user?.userId) {
  // Handle not logged in
  return;
}

// Safe to proceed
```

### 3. Handle Token Expiration

Implement token refresh logic:

```typescript
export class MyAuthService extends DefaultAuthService {
  async getValidToken() {
    const auth = this.getAuth();

    if (!auth) return null;

    if (this.isExpired(auth)) {
      return await this.refreshToken();
    }

    return auth;
  }
}
```

### 4. Extend for Application-Specific Logic

Create custom auth service for your needs:

```typescript
@injectable()
export class MyAuthService extends DefaultAuthService {
  // Add custom methods
  async logoutEverywhere() {
    const user = this.getUser();

    // Call API to invalidate all sessions
    await fetch('/api/auth/logout-all', {
      method: 'POST',
      body: JSON.stringify({ userId: user.userId }),
    });

    // Clean up local storage
    this.cleanUp();
  }

  getTokenExpiry(): Date | null {
    const auth = this.getAuth();
    if (!auth?.value) return null;

    try {
      const payload = JSON.parse(atob(auth.value.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }
}
```

### 5. Type Safety with Interfaces

Define interfaces for your auth data:

```typescript
interface MyUserIdentity {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  provider: 'local' | 'google' | 'github';
}

export class MyAuthService extends DefaultAuthService {
  getUser(): MyUserIdentity {
    const user = super.getUser();
    return {
      userId: user.userId || '',
      username: user.username || '',
      email: user.email || '',
      roles: Array.from(this.getRoles()),
      provider: user.provider || 'local',
    };
  }
}
```

## Security Considerations

### 1. Token Storage

**localStorage is vulnerable to XSS attacks**. Consider:

- Use `httpOnly` cookies for token storage (backend changes required)
- Implement short token expiration (15-30 minutes)
- Use refresh tokens with longer expiration

```typescript
// Implement token rotation
export class SecureAuthService extends DefaultAuthService {
  async rotateToken() {
    const current = this.getAuth();
    const newToken = await this.refreshToken(current.value);

    if (newToken) {
      const user = this.getUser();
      this.saveAuth({
        ...user,
        token: newToken,
      });
    }
  }
}
```

### 2. Sensitive Data

Don't store sensitive information in localStorage:

```typescript
// ❌ Wrong - storing sensitive data
authService.saveAuth({
  userId: 'user-123',
  username: 'admin',
  password: 'secret123',  // Never do this!
  token: { value: 'jwt', type: 'Bearer' },
});

// ✅ Correct - only store necessary data
authService.saveAuth({
  userId: 'user-123',
  username: 'admin',
  token: { value: 'jwt', type: 'Bearer' },
});
```

### 3. Clean Up on Logout

Always clean up auth data on logout:

```typescript
async function logout() {
  // Invalidate token on server
  await fetch('/api/auth/logout', { method: 'POST' });

  // Clean up client-side data
  authService.cleanUp();

  // Redirect to login
  window.location.href = '/login';
}
```

## Performance Tips

1. **Minimize localStorage reads**: Cache user data in React state/context
2. **Use Set for roles**: `getRoles()` returns Set for O(1) membership checks
3. **Avoid repeated parsing**: Cache parsed token in memory for current session

```typescript
// Example: Cache user in context
const UserContext = React.createContext<UserIdentity | null>(null);

export function UserProvider({ children }) {
  const authService = useInjectable<DefaultAuthService>({
    key: CoreBindings.DEFAULT_AUTH_SERVICE,
  });

  const [user, setUser] = React.useState(() => authService.getUser());

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}
```

## See Also

- [Authentication Guide](/guides/authentication/) - Complete authentication guide
- [DefaultAuthProvider](/api-reference/providers/default-auth-provider) - High-level auth provider
- [Token Management](/guides/authentication/token-management) - Token handling guide
- [Security Best Practices](/guides/security/best-practices) - Security guidelines

---

**Next**: Learn about [DefaultNetworkRequestService](/api-reference/services/default-network-request-service) for HTTP request handling.

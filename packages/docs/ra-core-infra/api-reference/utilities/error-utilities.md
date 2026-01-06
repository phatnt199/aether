# Error Utilities

Custom error handling utilities including ApplicationError class and error factory functions.

## Import

```typescript
import { ApplicationError, getError, getClientError } from '@minimaltech/ra-core-infra';
```

## Overview

The @ra-core-infra library provides error handling utilities for consistent error management across your application:

| Utility | Purpose | Use Case |
|---------|---------|----------|
| [ApplicationError](#applicationerror) | Custom error class | Structured errors with statusCode, messageCode, payload |
| [getError](#geterror) | Create ApplicationError | Factory function for creating errors |
| [getClientError](#getclienterror) | Convert to ApplicationError | Normalize unknown errors to ApplicationError |

---

## ApplicationError

Custom error class extending JavaScript `Error` with additional metadata.

### Signature

```typescript
class ApplicationError extends Error {
  statusCode: number;
  messageCode?: string;
  payload?: any;

  constructor(opts: {
    statusCode?: number;
    messageCode?: string;
    message: string;
    payload?: any;
  });
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| statusCode | `number` | `400` | HTTP-style status code |
| messageCode | `string \| undefined` | - | Machine-readable error code |
| message | `string` | - | Human-readable error message |
| payload | `any` | - | Additional error data/context |

### Constructor Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| statusCode | `number` | No | `400` | HTTP status code |
| messageCode | `string` | No | - | Error code for i18n or logging |
| message | `string` | Yes | - | Error message |
| payload | `any` | No | - | Additional error context |

### Examples

#### Basic Error

```typescript
import { ApplicationError } from '@minimaltech/ra-core-infra';

function validateUser(user: any) {
  if (!user.email) {
    throw new ApplicationError({
      statusCode: 400,
      message: 'Email is required',
    });
  }

  if (!user.email.includes('@')) {
    throw new ApplicationError({
      statusCode: 400,
      messageCode: 'INVALID_EMAIL_FORMAT',
      message: 'Email must be a valid email address',
    });
  }
}
```

---

#### Error with Payload

```typescript
function processPayment(amount: number, card: any) {
  if (amount <= 0) {
    throw new ApplicationError({
      statusCode: 400,
      messageCode: 'INVALID_AMOUNT',
      message: 'Payment amount must be greater than 0',
      payload: { amount, minAmount: 0 },
    });
  }

  if (!card.cvv || card.cvv.length !== 3) {
    throw new ApplicationError({
      statusCode: 400,
      messageCode: 'INVALID_CVV',
      message: 'CVV must be 3 digits',
      payload: { providedLength: card.cvv?.length, expectedLength: 3 },
    });
  }
}
```

---

#### HTTP Status Codes

```typescript
class UserService {
  async findUser(id: string) {
    const user = await db.users.findById(id);

    if (!user) {
      throw new ApplicationError({
        statusCode: 404,
        messageCode: 'USER_NOT_FOUND',
        message: `User with ID ${id} not found`,
        payload: { userId: id },
      });
    }

    return user;
  }

  async createUser(data: any) {
    const existing = await db.users.findByEmail(data.email);

    if (existing) {
      throw new ApplicationError({
        statusCode: 409,  // Conflict
        messageCode: 'USER_ALREADY_EXISTS',
        message: `User with email ${data.email} already exists`,
        payload: { email: data.email },
      });
    }

    return await db.users.create(data);
  }

  async updateUser(id: string, data: any) {
    if (!this.hasPermission(id)) {
      throw new ApplicationError({
        statusCode: 403,  // Forbidden
        messageCode: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to update this user',
        payload: { userId: id },
      });
    }

    return await db.users.update(id, data);
  }
}
```

---

#### Internationalization with Message Codes

```typescript
import { ApplicationError } from '@minimaltech/ra-core-infra';
import { useTranslate } from '@minimaltech/ra-core-infra';

function MyComponent() {
  const translate = useTranslate();

  function handleError(error: ApplicationError) {
    // Use messageCode for i18n lookup
    const translatedMessage = error.messageCode
      ? translate(error.messageCode, error.payload)
      : error.message;

    showNotification(translatedMessage, 'error');
  }

  async function submitForm(data: any) {
    try {
      await saveData(data);
    } catch (error) {
      if (error instanceof ApplicationError) {
        handleError(error);
      }
    }
  }

  return <form onSubmit={submitForm}>...</form>;
}
```

---

## getError

Factory function to create `ApplicationError` instances.

### Signature

```typescript
function getError(opts: {
  statusCode?: number;
  messageCode?: string;
  message: string;
  payload?: any;
}): ApplicationError
```

### Parameters

Same as `ApplicationError` constructor parameters.

### Returns

`ApplicationError` instance

### Examples

#### Basic Usage

```typescript
import { getError } from '@minimaltech/ra-core-infra';

function validateAge(age: number) {
  if (age < 18) {
    throw getError({
      statusCode: 400,
      messageCode: 'AGE_TOO_YOUNG',
      message: 'User must be at least 18 years old',
      payload: { age, minAge: 18 },
    });
  }
}
```

---

#### Service Error Handling

```typescript
import { getError } from '@minimaltech/ra-core-infra';

class OrderService {
  async cancelOrder(orderId: string) {
    const order = await this.findOrder(orderId);

    if (order.status === 'SHIPPED') {
      throw getError({
        statusCode: 400,
        messageCode: 'ORDER_ALREADY_SHIPPED',
        message: 'Cannot cancel order that has already been shipped',
        payload: { orderId, status: order.status },
      });
    }

    if (order.status === 'CANCELLED') {
      throw getError({
        statusCode: 400,
        messageCode: 'ORDER_ALREADY_CANCELLED',
        message: 'Order is already cancelled',
        payload: { orderId },
      });
    }

    return await this.updateOrderStatus(orderId, 'CANCELLED');
  }
}
```

---

#### Validation Errors

```typescript
import { getError } from '@minimaltech/ra-core-infra';

function validateForm(formData: any) {
  const errors: string[] = [];

  if (!formData.name) errors.push('Name is required');
  if (!formData.email) errors.push('Email is required');
  if (!formData.phone) errors.push('Phone is required');

  if (errors.length > 0) {
    throw getError({
      statusCode: 400,
      messageCode: 'VALIDATION_FAILED',
      message: 'Form validation failed',
      payload: { errors },
    });
  }
}
```

---

## getClientError

Convert unknown errors to `ApplicationError` for consistent error handling.

### Signature

```typescript
function getClientError(e: unknown): ApplicationError
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| e | `unknown` | Yes | Error of any type |

### Returns

`ApplicationError` instance

### Behavior

- **ApplicationError input**: Preserves `messageCode`, converts to client error (statusCode 400)
- **Error input**: Uses `error.message` as both message and messageCode
- **Other types**: Converts to string for both message and messageCode

### Examples

#### API Error Handling

```typescript
import { getClientError } from '@minimaltech/ra-core-infra';

async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Normalize any error to ApplicationError
    const appError = getClientError(error);

    console.error('Fetch failed:', appError.message);
    console.error('Error code:', appError.messageCode);

    throw appError;
  }
}
```

---

#### Try-Catch Error Normalization

```typescript
import { getClientError, ApplicationError } from '@minimaltech/ra-core-infra';

async function processData(data: any) {
  try {
    // May throw various error types
    const result = await externalAPI.process(data);
    return result;
  } catch (error) {
    // Convert to ApplicationError
    const appError = getClientError(error);

    // Log with consistent structure
    logger.error('Processing failed', {
      message: appError.message,
      code: appError.messageCode,
      statusCode: appError.statusCode,
      payload: appError.payload,
    });

    throw appError;
  }
}
```

---

#### React Error Boundary

```typescript
import React from 'react';
import { getClientError } from '@minimaltech/ra-core-infra';

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error: any) {
    // Normalize error
    const appError = getClientError(error);

    return { error: appError };
  }

  componentDidCatch(error: any, errorInfo: any) {
    const appError = getClientError(error);

    // Send to error tracking
    sendToErrorTracking({
      message: appError.message,
      code: appError.messageCode,
      stack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div>
          <h1>Something went wrong</h1>
          <p>{this.state.error.message}</p>
          <code>{this.state.error.messageCode}</code>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

#### Promise Rejection Handler

```typescript
import { getClientError } from '@minimaltech/ra-core-infra';

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();

  const appError = getClientError(event.reason);

  console.error('Unhandled promise rejection:', {
    message: appError.message,
    code: appError.messageCode,
  });

  // Show user-friendly error
  showNotification(appError.message, 'error');
});
```

---

## Complete Example

### Full Error Handling Pattern

```typescript
import { ApplicationError, getError, getClientError } from '@minimaltech/ra-core-infra';

// Service with custom errors
class UserService {
  async createUser(userData: any) {
    // Validation error
    if (!userData.email) {
      throw getError({
        statusCode: 400,
        messageCode: 'EMAIL_REQUIRED',
        message: 'Email address is required',
      });
    }

    try {
      // External API call
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Normalize unknown errors
      const appError = getClientError(error);

      // Log
      console.error('User creation failed:', {
        message: appError.message,
        code: appError.messageCode,
      });

      // Re-throw normalized error
      throw appError;
    }
  }
}

// React component with error handling
function UserForm() {
  const [error, setError] = React.useState<ApplicationError | null>(null);

  async function handleSubmit(formData: any) {
    try {
      setError(null);

      const userService = new UserService();
      await userService.createUser(formData);

      alert('User created successfully!');
    } catch (err) {
      const appError = err instanceof ApplicationError
        ? err
        : getClientError(err);

      setError(appError);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="error">
          <h3>Error {error.statusCode}</h3>
          <p>{error.message}</p>
          {error.messageCode && <code>{error.messageCode}</code>}
          {error.payload && (
            <pre>{JSON.stringify(error.payload, null, 2)}</pre>
          )}
        </div>
      )}

      {/* Form fields */}
    </form>
  );
}
```

---

## Best Practices

### 1. Use Descriptive Message Codes

```typescript
// ✅ Good - descriptive codes
throw getError({
  messageCode: 'USER_EMAIL_ALREADY_EXISTS',
  message: 'Email already registered',
});

throw getError({
  messageCode: 'PAYMENT_INSUFFICIENT_FUNDS',
  message: 'Insufficient funds for payment',
});

// ❌ Bad - generic codes
throw getError({
  messageCode: 'ERROR_1',
  message: 'Something went wrong',
});
```

---

### 2. Include Relevant Payload

```typescript
// ✅ Good - helpful payload
throw getError({
  messageCode: 'INVALID_PASSWORD_LENGTH',
  message: 'Password must be between 8 and 128 characters',
  payload: { minLength: 8, maxLength: 128, providedLength: password.length },
});

// ❌ Bad - no context
throw getError({
  message: 'Invalid password',
});
```

---

### 3. Use Appropriate Status Codes

```typescript
// ✅ Good - correct HTTP codes
throw getError({ statusCode: 400, message: 'Invalid input' });      // Bad Request
throw getError({ statusCode: 401, message: 'Not authenticated' });   // Unauthorized
throw getError({ statusCode: 403, message: 'Access denied' });       // Forbidden
throw getError({ statusCode: 404, message: 'Resource not found' });  // Not Found
throw getError({ statusCode: 409, message: 'Already exists' });      // Conflict
throw getError({ statusCode: 500, message: 'Server error' });        // Internal Error

// ❌ Bad - always 400
throw getError({ statusCode: 400, message: 'User not found' });  // Should be 404
```

---

### 4. Normalize Unknown Errors

```typescript
// ✅ Good - normalize errors
try {
  await doSomething();
} catch (error) {
  const appError = getClientError(error);
  handleError(appError);
}

// ❌ Bad - assume error type
try {
  await doSomething();
} catch (error) {
  console.log(error.message);  // May not have message property
}
```

---

### 5. Don't Expose Sensitive Information

```typescript
// ✅ Good - safe error messages
throw getError({
  statusCode: 401,
  messageCode: 'AUTHENTICATION_FAILED',
  message: 'Invalid credentials',
  // Don't include actual credentials in payload
});

// ❌ Bad - exposes sensitive data
throw getError({
  message: 'Invalid credentials',
  payload: { username, password },  // Never include passwords!
});
```

---

## TypeScript Tips

### Type Guards

```typescript
import { ApplicationError } from '@minimaltech/ra-core-infra';

function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

// Usage
try {
  await doSomething();
} catch (error) {
  if (isApplicationError(error)) {
    console.log('Status:', error.statusCode);
    console.log('Code:', error.messageCode);
  } else {
    console.log('Unknown error:', error);
  }
}
```

---

### Error Payload Typing

```typescript
interface ValidationErrorPayload {
  field: string;
  value: any;
  constraint: string;
}

function createValidationError(payload: ValidationErrorPayload): ApplicationError {
  return getError({
    statusCode: 400,
    messageCode: 'VALIDATION_ERROR',
    message: `Validation failed for ${payload.field}`,
    payload,
  });
}

// Usage
const error = createValidationError({
  field: 'email',
  value: 'invalid',
  constraint: 'must be valid email',
});
```

---

## Common Issues

### messageCode vs message

**Issue**: Confusion about when to use `messageCode` vs `message`.

**Solution**:
- `message`: Human-readable, for display to users
- `messageCode`: Machine-readable, for i18n lookups or logging

```typescript
// For i18n
throw getError({
  messageCode: 'errors.user.emailInvalid',  // i18n key
  message: 'Email is invalid',  // Fallback
});

// For logging/tracking
throw getError({
  messageCode: 'DB_CONNECTION_TIMEOUT',  // Tracking code
  message: 'Database connection timeout',  // Human-readable
});
```

---

### Losing Error Stack

**Issue**: `getClientError` creates new error, losing original stack trace.

**Solution**: Log original error before converting:

```typescript
try {
  await doSomething();
} catch (error) {
  // Log original error with stack
  console.error('Original error:', error);

  // Then normalize
  const appError = getClientError(error);
  throw appError;
}
```

---

## See Also

- [BaseService](/api-reference/services/base-service) - Services using error utilities
- [DefaultAuthService](/api-reference/services/default-auth-service) - Error handling in auth
- [Other Utilities](/api-reference/utilities/other-utilities) - Additional utility functions
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) - React error handling

---

**Next**: Learn about [Other Utilities](/api-reference/utilities/other-utilities) for parse, boolean, and URL utilities.

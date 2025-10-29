# Error Handling Package 🚀

A comprehensive, production-ready error handling package for Go applications, especially designed for HTTP APIs.

## 🎓 Learning Path for Go Beginners

This package is built to teach you core Go concepts:

### **Phase 1: Understanding Error Codes (`codes.go`)**

**Go Concepts You'll Learn:**

- ✅ Custom types (`type ErrorCode string`)
- ✅ Constants and grouping (`const (...)`)
- ✅ Maps for lookups (`map[ErrorCode]int`)
- ✅ Methods on types (`func (c ErrorCode) HTTPStatus()`)
- ✅ Interfaces (`Stringer` interface)

**What It Does:**

- Defines standard error codes for your application
- Maps error codes to HTTP status codes
- Provides default user-friendly messages

### **Phase 2: Core Error Types (`error.go`)**

**Go Concepts You'll Learn:**

- ✅ Structs for complex data (`type AppError struct`)
- ✅ The `error` interface implementation
- ✅ Error wrapping (Go 1.13+ `Unwrap()`)
- ✅ Method chaining (fluent API)
- ✅ Constructor functions (`New`, `Wrap`)
- ✅ Stack trace capture with `runtime` package
- ✅ Time handling

**What It Does:**

- Creates rich error objects with context
- Wraps existing errors while preserving the chain
- Captures stack traces for debugging
- Provides type-safe error checking

### **Phase 3: HTTP Integration (`handler.go`)**

**Go Concepts You'll Learn:**

- ✅ JSON encoding/decoding
- ✅ HTTP handlers and middleware
- ✅ Panic recovery with `defer` and `recover`
- ✅ Configuration patterns
- ✅ Struct tags for JSON serialization

**What It Does:**

- Converts errors to JSON responses
- Provides middleware for automatic error handling
- Supports both development and production modes

## 📚 Quick Start

### 1. Basic Error Creation

```go
import "local/go-infra/pkg/errors"

// Simple errors
err := errors.NotFound("User")
err := errors.Unauthorized("Invalid token")
err := errors.Validation("Email is required")
```

### 2. Error Wrapping (Important!)

```go
// Wrap existing errors to add context
func GetUser(id int) error {
    user, err := db.FindUser(id)
    if err != nil {
        // Wrap the database error with your error code
        return errors.Wrap(err, errors.CodeDatabaseError, "Failed to fetch user")
    }
    return nil
}
```

### 3. Adding Context

```go
err := errors.NotFound("Order").
    WithContext("user_id", userID).
    WithContext("order_id", orderID).
    WithContext("request_id", requestID)
```

### 4. HTTP Handler Usage

```go
func GetUserHandler(w http.ResponseWriter, r *http.Request) {
    user, err := fetchUser(userID)
    if err != nil {
        // Automatically converts error to JSON response
        errors.RespondWithError(w, err)
        return
    }

    // Your success response
    json.NewEncoder(w).Encode(user)
}
```

### 5. Middleware Setup

```go
func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/users", GetUserHandler)

    // Wrap with error recovery middleware
    handler := errors.RecoveryMiddleware()(mux)

    http.ListenAndServe(":8080", handler)
}
```

## 🔍 Error Response Format

### Standard Error Response

```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "User not found",
		"timestamp": "2025-10-23T10:30:00Z",
		"request_id": "req-abc-123"
	}
}
```

### Validation Error Response

```json
{
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Validation failed",
		"timestamp": "2025-10-23T10:30:00Z",
		"fields": [
			{
				"field": "email",
				"message": "Email is required"
			},
			{
				"field": "password",
				"message": "Password must be at least 8 characters"
			}
		]
	}
}
```

## 🎯 Available Error Codes

### Generic Errors

- `CodeInternal` - Internal server error (500)
- `CodeUnknown` - Unknown error (500)
- `CodeNotImplemented` - Feature not implemented (501)

### Request Errors (4xx)

- `CodeBadRequest` - Bad request (400)
- `CodeInvalidInput` - Invalid input (400)
- `CodeValidation` - Validation error (400)
- `CodeMissingField` - Required field missing (400)

### Authentication & Authorization

- `CodeUnauthorized` - Authentication required (401)
- `CodeForbidden` - Permission denied (403)
- `CodeInvalidToken` - Invalid auth token (401)
- `CodeTokenExpired` - Token expired (401)

### Resource Errors

- `CodeNotFound` - Resource not found (404)
- `CodeAlreadyExists` - Resource exists (409)
- `CodeConflict` - Request conflicts (409)
- `CodeGone` - Resource no longer available (410)

### Rate Limiting

- `CodeTooManyRequests` - Too many requests (429)
- `CodeRateLimitExceeded` - Rate limit exceeded (429)

### External Services

- `CodeServiceUnavailable` - Service unavailable (503)
- `CodeTimeout` - Request timeout (503)
- `CodeExternalService` - External service error (503)

### Database

- `CodeDatabaseError` - Database error (500)
- `CodeDuplicateKey` - Duplicate key (409)
- `CodeForeignKeyViolation` - Foreign key violation (500)

## 🛠️ Advanced Usage

### Custom Error Codes

Add your own error codes in `codes.go`:

```go
const (
    CodePaymentFailed ErrorCode = "PAYMENT_FAILED"
)

// Add to maps
var codeToHTTPStatus = map[ErrorCode]int{
    // ... existing codes
    CodePaymentFailed: http.StatusPaymentRequired,
}

var codeToMessage = map[ErrorCode]string{
    // ... existing messages
    CodePaymentFailed: "Payment processing failed",
}
```

### Development vs Production

```go
// Production (safe for users)
config := errors.DefaultConfig()

// Development (shows all details)
config := errors.DevelopmentConfig()

errors.WriteJSON(w, err, config)
```

### Checking Error Types

```go
err := GetUser(123)

// Check if it's a specific error code
if errors.Is(err, errors.CodeNotFound) {
    // Handle not found
}

// Get the AppError for more details
if appErr, ok := errors.As(err); ok {
    log.Printf("Error code: %s", appErr.Code)
    log.Printf("Context: %+v", appErr.Context)
    log.Printf("Stack trace: %s", appErr.GetStackTrace())
}

// Just get the code
code := errors.GetCode(err)
```

## 🧪 Testing

Run the test suite:

```bash
cd pkg/errors
go test -v
```

Run benchmarks:

```bash
go test -bench=. -benchmem
```

## 📖 Examples

See `examples/errors_example.go` for comprehensive examples of:

- Basic error creation
- Error wrapping
- Adding context
- Error checking
- HTTP handler integration
- Validation errors

Run the examples:

```bash
go run examples/errors_example.go
```

## 🎓 Key Go Concepts Demonstrated

1. **Interfaces**: The `error` interface and `Stringer` interface
2. **Structs**: Complex data structures with methods
3. **Error Wrapping**: Go 1.13+ error chains
4. **Methods vs Functions**: When to use each
5. **Constructor Functions**: The `New*` pattern
6. **Method Chaining**: Fluent APIs
7. **JSON Tags**: Controlling JSON serialization
8. **Middleware Pattern**: HTTP middleware
9. **Panic Recovery**: `defer` and `recover`
10. **Testing**: Table-driven tests and benchmarks

## 🚀 Best Practices

1. **Always wrap errors** when crossing package boundaries
2. **Add context** (user_id, request_id, etc.) to errors
3. **Use specific error codes** instead of generic ones
4. **Never expose internal details** to users in production
5. **Log the full error** (including stack trace) server-side
6. **Use middleware** to catch panics automatically
7. **Test your error handling** paths

## 📝 Next Steps

Now that you understand error handling, you can:

1. **Integrate with your logger** package
2. **Add metrics** to track error rates
3. **Implement retry logic** for transient errors
4. **Add internationalization** for error messages
5. **Create error budgets** for SLOs
6. **Build alerting** based on error codes

## 💡 Tips for Learning Go

1. Read the code comments marked with 🎓
2. Run the examples and modify them
3. Run the tests to see how everything works
4. Try breaking things to understand error cases
5. Use `go doc` to read documentation:
   ```bash
   go doc local/go-infra/pkg/errors
   go doc local/go-infra/pkg/errors.New
   ```

## 🤝 Contributing

This is your learning project! Feel free to:

- Add more error codes
- Improve error messages
- Add more examples
- Write more tests
- Experiment with the code

Happy coding! 🎉

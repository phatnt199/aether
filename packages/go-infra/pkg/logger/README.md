# Logger Package 📝

A production-ready, high-performance structured logging package for Go applications. Part of the `go-infra` infrastructure framework.

## 🎯 Features

- **Simple API** - Import only `go-infra/pkg/logger`, no external dependencies needed
- **High Performance** - Built on Uber's Zap (hidden from users)
- **Structured Logging** - Type-safe fields with auto-complete
- **Context-Aware** - Propagate logger through context for request tracing
- **Scoped Logging** - Organize logs by application component
- **Environment-Based** - Automatic configuration based on APP_ENV
- **Zero External Imports** - Users only import go-infra

## 📚 Quick Start

### 1. Basic Usage

```go
package main

import (
    "local/go-infra/pkg/logger"
)

func main() {
    // Use default logger (auto-initialized)
    logger.Info("Application started")
    logger.Info("User logged in", logger.String("user_id", "12345"))

    // Always sync before exit
    defer logger.Sync()
}
```

### 2. Initialize with Custom Configuration

```go
package main

import (
    "local/go-infra/pkg/logger"
)

func main() {
    // Create custom configuration
    config := &logger.Config{
        Environment:      "production",
        Level:            "info",  // debug, info, warn, error, fatal, panic
        OutputPaths:      []string{"stdout", "/var/log/app/app.log"},
        ErrorOutputPaths: []string{"stderr", "/var/log/app/error.log"},
        EnableCaller:     true,
        EnableStacktrace: true,
        Encoding:         "json",  // json or console
        ServiceName:      "my-service",
    }

    // Initialize the default logger
    if err := logger.Init(config); err != nil {
        panic(err)
    }
    defer logger.Sync()

    logger.Info("Application started with custom config")
}
```

## 🔧 Configuration

### Config Options

```go
type Config struct {
    // Environment (development, production, staging, etc.)
    Environment string

    // Level is the minimum log level: "debug", "info", "warn", "error", "fatal", "panic"
    Level string

    // OutputPaths is a list of URLs or file paths to write logging output
    // Examples: ["stdout", "/var/log/app.log"]
    OutputPaths []string

    // ErrorOutputPaths is a list of URLs to write internal logger errors
    ErrorOutputPaths []string

    // EnableCaller enables caller (file:line) annotation
    EnableCaller bool

    // EnableStacktrace enables stacktrace on errors
    EnableStacktrace bool

    // Encoding sets the logger's encoding ("json" or "console")
    Encoding string

    // ServiceName is the name of the service (added to all logs)
    ServiceName string
}
```

### Default Configuration

```go
config := logger.DefaultConfig()
// Automatically sets based on APP_ENV environment variable:
// - Environment: from APP_ENV (defaults to "development")
// - Level: "debug" for dev, "info" for production
// - OutputPaths: ["stdout"]
// - ErrorOutputPaths: ["stderr"]
// - EnableCaller: true
// - EnableStacktrace: true
// - Encoding: "console" for dev, "json" for production
// - ServiceName: from SERVICE_NAME environment variable
```

### Environment Variables

- `APP_ENV` - Sets the environment (development, production, staging, etc.)
- `SERVICE_NAME` - Sets the service name (added to all logs)

## 📖 Field Types

All field types are provided by `go-infra/pkg/logger` - **no need to import anything else**:

```go
import "local/go-infra/pkg/logger"

// String fields
logger.String("key", "value")

// Numeric fields
logger.Int("count", 42)
logger.Int64("id", 123456789)
logger.Float64("price", 99.99)

// Boolean fields
logger.Bool("is_active", true)

// Time-related fields
logger.Time("created_at", time.Now())
logger.Duration("elapsed", 150*time.Millisecond)

// Error fields
logger.Err(err)

// Any type (uses reflection)
logger.Any("data", complexStruct)
```

## 📖 Usage Examples

### Structured Logging with Fields

```go
import (
    "local/go-infra/pkg/logger"
    "time"
)

// Log with multiple fields - all type-safe!
logger.Info("User action",
    logger.String("user_id", "user-123"),
    logger.String("action", "login"),
    logger.String("ip", "192.168.1.1"),
    logger.Duration("duration", 150*time.Millisecond),
)

// Output (JSON in production):
// {
//   "level": "info",
//   "timestamp": "2025-10-24T16:06:46.709+0700",
//   "caller": "main.go:42",
//   "message": "User action",
//   "environment": "production",
//   "user_id": "user-123",
//   "action": "login",
//   "ip": "192.168.1.1",
//   "duration": 0.15
// }
```

### Logger with Persistent Fields

```go
// Create a logger with fields that persist across all logs
userLogger := logger.WithFields(
    logger.String("user_id", "user-456"),
    logger.String("session_id", "sess-789"),
)

// All logs from this logger include these fields automatically
userLogger.Info("Viewing profile")
userLogger.Info("Updating settings")
userLogger.Info("Logging out")
```

### Scoped Logging

```go
// Create scoped loggers for different parts of your application
authLogger := logger.WithScope("auth")
dbLogger := logger.WithScope("database")
apiLogger := logger.WithScope("api")

authLogger.Info("User authentication started")
dbLogger.Info("Database connection established")
apiLogger.Info("API server listening", logger.Int("port", 8080))

// You can chain scopes and fields
userAuthLogger := authLogger.WithFields(logger.String("user_id", "user-999"))
userAuthLogger.Info("Password verified")
```

### Context-Based Logging

```go
import (
    "context"
    "local/go-infra/pkg/logger"
)

func HandleRequest(w http.ResponseWriter, r *http.Request) {
    // Create a logger for this request
    requestLogger := logger.GetDefault().WithFields(
        logger.String("request_id", generateRequestID()),
        logger.String("method", r.Method),
        logger.String("path", r.URL.Path),
    )

    // Add logger to context
    ctx := requestLogger.ToContext(r.Context())

    // Pass context through your application
    ProcessOrder(ctx)
}

func ProcessOrder(ctx context.Context) {
    // Retrieve logger from context
    log := logger.FromContext(ctx)

    log.Info("Order processing started")
    // All logs will include request_id, method, path automatically
}
```

### Error Logging

```go
import (
    "errors"
    "local/go-infra/pkg/logger"
)

func FetchUser(id int) error {
    err := database.Find(id)
    if err != nil {
        // Log error with context and stack trace
        logger.Error("Failed to fetch user",
            logger.Err(err),  // Error field
            logger.Int("user_id", id),
            logger.String("database", "postgres"),
        )
        return err
    }
    return nil
}
```

### Log Levels

```go
// Debug - Detailed information for diagnosing problems
logger.Debug("Processing item", logger.Int("item_id", 123))

// Info - General informational messages
logger.Info("Server started", logger.Int("port", 8080))

// Warn - Warning messages for potentially harmful situations
logger.Warn("High memory usage", logger.Int64("bytes", memUsage))

// Error - Error messages for error events
logger.Error("Database connection failed", logger.Err(err))

// Fatal - Severe error events that will cause the application to exit
logger.Fatal("Cannot start server", logger.Err(err))

// Panic - Severe error events that will cause a panic
logger.Panic("Critical failure", logger.Err(err))
```

## 🎓 Advanced Usage

### Custom Logger Instance

```go
// Create multiple logger instances with different configurations
productionLogger, err := logger.New(&logger.Config{
    Environment: "production",
    Level:       "info",
    Encoding:    "json",
})

debugLogger, err := logger.New(&logger.Config{
    Environment: "debug",
    Level:       "debug",
    Encoding:    "console",
})
```

### File Output

```go
config := &logger.Config{
    Environment: "production",
    Level:       "info",
    OutputPaths: []string{
        "stdout",                    // Console output
        "/var/log/app/app.log",      // Application logs
    },
    ErrorOutputPaths: []string{
        "stderr",                    // Console errors
        "/var/log/app/error.log",    // Error logs
    },
    Encoding: "json",
}
```

### Integration with HTTP Middleware

```go
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // Create request logger
        requestLogger := logger.GetDefault().WithFields(
            logger.String("request_id", generateRequestID()),
            logger.String("method", r.Method),
            logger.String("path", r.URL.Path),
            logger.String("remote_addr", r.RemoteAddr),
        )

        // Add to context
        ctx := requestLogger.ToContext(r.Context())
        r = r.WithContext(ctx)

        requestLogger.Info("Request started")

        // Call next handler
        next.ServeHTTP(w, r)

        // Log completion
        duration := time.Since(start)
        requestLogger.Info("Request completed",
            logger.Duration("duration", duration),
        )
    })
}
```

## 🏗️ Best Practices

### 1. Initialize Logger at Startup

```go
func main() {
    // Initialize logger first
    config := logger.DefaultConfig()
    if err := logger.Init(config); err != nil {
        panic(err)
    }
    defer logger.Sync() // Flush logs before exit

    // Rest of application
}
```

### 2. Use Context for Request Tracing

```go
// Add logger to context at entry points
ctx = logger.GetDefault().
    WithFields(logger.String("request_id", reqID)).
    ToContext(ctx)

// Retrieve logger from context in handlers
log := logger.FromContext(ctx)
```

### 3. Scope Loggers by Domain

```go
var (
    authLogger = logger.WithScope("auth")
    dbLogger   = logger.WithScope("database")
    apiLogger  = logger.WithScope("api")
)
```

### 4. Log Errors with Context

```go
if err != nil {
    logger.Error("Operation failed",
        logger.Err(err),
        logger.String("operation", "user_creation"),
        logger.String("user_id", userID),
    )
    return err
}
```

### 5. Use Appropriate Log Levels

- **Debug**: Development and troubleshooting
- **Info**: Normal application flow
- **Warn**: Potential issues that don't stop operation
- **Error**: Errors that should be investigated
- **Fatal/Panic**: Critical errors (use sparingly)

## 🔗 Integration with Error Package

The logger integrates seamlessly with `go-infra/pkg/errors`:

```go
import (
    "local/go-infra/pkg/errors"
    "local/go-infra/pkg/logger"
)

func GetUser(id int) error {
    user, err := db.FindUser(id)
    if err != nil {
        // Create structured error
        appErr := errors.Wrap(err, errors.CodeDatabaseError, "Failed to fetch user")

        // Log with error context
        logger.Error("Database operation failed",
            logger.Err(appErr),
            logger.Int("user_id", id),
            logger.String("error_code", string(appErr.Code)),
        )

        return appErr
    }
    return nil
}
```

## 📊 Performance

Built on Uber's Zap, one of the fastest Go logging libraries:

- **Zero-allocation** logging in hot paths
- **10x faster** than standard library log
- **Benchmarked** at over 4 million logs/second

The abstraction layer adds minimal overhead while providing a cleaner API.

## 🎯 Real-World Example

```go
package main

import (
    "context"
    "net/http"
    "time"

    "local/go-infra/pkg/logger"
)

func main() {
    // Initialize logger
    config := &logger.Config{
        Environment:      "production",
        Level:            "info",
        OutputPaths:      []string{"stdout", "/var/log/app/app.log"},
        ErrorOutputPaths: []string{"stderr", "/var/log/app/error.log"},
        EnableCaller:     true,
        EnableStacktrace: true,
        Encoding:         "json",
        ServiceName:      "user-service",
    }

    if err := logger.Init(config); err != nil {
        panic(err)
    }
    defer logger.Sync()

    // Log application startup
    logger.Info("Application starting",
        logger.String("version", "1.0.0"),
        logger.String("environment", config.Environment),
    )

    // Set up HTTP server with logging middleware
    mux := http.NewServeMux()
    mux.HandleFunc("/api/users", GetUsersHandler)

    server := &http.Server{
        Addr:    ":8080",
        Handler: LoggingMiddleware(mux),
    }

    logger.Info("Server listening", logger.Int("port", 8080))

    if err := server.ListenAndServe(); err != nil {
        logger.Fatal("Server failed to start", logger.Err(err))
    }
}

func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        requestLogger := logger.GetDefault().WithFields(
            logger.String("request_id", generateRequestID()),
            logger.String("method", r.Method),
            logger.String("path", r.URL.Path),
        )

        ctx := requestLogger.ToContext(r.Context())
        r = r.WithContext(ctx)

        requestLogger.Info("Request started")

        next.ServeHTTP(w, r)

        requestLogger.Info("Request completed",
            logger.Duration("duration", time.Since(start)),
        )
    })
}

func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
    log := logger.FromContext(r.Context())

    log.Info("Fetching users")
    // ... handler logic ...
}

func generateRequestID() string {
    return "req-" + time.Now().Format("20060102150405")
}
```

## 📚 Resources

### Running Examples

```bash
# Run the logger example (comprehensive feature demonstration)
go run examples/logger_example/main.go

# Run the integration example (logger + errors)
go run examples/integration_example/main.go
```

### Package Documentation

```bash
# View package docs
go doc local/go-infra/pkg/logger

# View specific function
go doc local/go-infra/pkg/logger.New

# View all documentation
go doc -all local/go-infra/pkg/logger
```

## 💡 Why This Approach?

### ✅ Advantages

1. **Single Import** - Users only import `go-infra/pkg/logger`
2. **No External Dependencies** - Hidden implementation details
3. **Type-Safe API** - Auto-complete works perfectly
4. **Consistent Style** - All go-infra packages follow same pattern
5. **Easy to Maintain** - Can change underlying implementation without breaking users
6. **Clean API** - No zap references leak to user code

### 📦 go-infra Philosophy

```
┌─────────────────────────────────────────┐
│  Your Application                        │
│  ├── import "local/go-infra/pkg/logger" │
│  ├── import "local/go-infra/pkg/errors" │
│  └── import "local/go-infra/pkg/config" │
│                                          │
│  NO external imports needed!             │
└─────────────────────────────────────────┘
```

All infrastructure complexity is hidden inside go-infra. Your application code stays clean and simple.

## 🚀 What's Next?

Now that you have logging set up, you can:

1. **Add Metrics** - Track application metrics
2. **Add Tracing** - Distributed tracing
3. **Log Aggregation** - Send logs to ELK, Loki
4. **Alerting** - Set up alerts based on logs

Happy logging! 📝

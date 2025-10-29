# Configuration Management

A comprehensive, production-ready configuration management package for Go applications. This package provides structured configuration loading from environment variables with validation, type safety, and sensible defaults.

## Features

✅ **Environment Variable Loading** - Automatic loading from environment variables  
✅ **Type Safety** - Strongly-typed configuration structs  
✅ **Validation** - Comprehensive validation rules with detailed error messages  
✅ **Default Values** - Sensible defaults for all configurations  
✅ **Multiple Sections** - Organized into logical sections (App, Server, Database, etc.)  
✅ **Helper Methods** - Convenient methods for common operations  
✅ **Singleton Pattern** - Built-in singleton support with `LoadOnce()`  
✅ **Thread-Safe** - Safe for concurrent access  
✅ **Zero Dependencies** - Uses only Go standard library

## Installation

```bash
# In your project that uses go-infra
import "local/go-infra/pkg/application/config"
```

## Quick Start

### 1. Create a `.env` file (or set environment variables)

```bash
# App Configuration
APP_NAME=my-awesome-app
APP_VERSION=1.0.0
APP_ENV=development
APP_DEBUG=true

# HTTP Server
HTTP_HOST=0.0.0.0
HTTP_PORT=8080

# Database
DB_DRIVER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=myuser
DB_PASSWORD=mypassword
DB_DATABASE=mydb

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. Load configuration in your application

```go
package main

import (
    "log"
    "local/go-infra/pkg/application/config"
)

func main() {
    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // Use configuration
    log.Printf("Starting %s on %s", cfg.App.Name, cfg.Server.HTTP.Address())
}
```

## Configuration Sections

### 1. App Configuration

General application settings.

```go
type AppConfig struct {
    Name        string        // Application name
    Version     string        // Application version
    Environment string        // development, staging, production
    Debug       bool          // Debug mode
    Timezone    string        // Timezone (e.g., "UTC", "America/New_York")
    Timeout     time.Duration // Global timeout
}
```

**Environment Variables:**

- `APP_NAME` - Application name (default: "go-app")
- `APP_VERSION` - Version (default: "1.0.0")
- `APP_ENV` - Environment (default: "development")
- `APP_DEBUG` - Debug mode (default: false)
- `APP_TIMEZONE` - Timezone (default: "UTC")
- `APP_TIMEOUT` - Global timeout (default: "30s")

**Helper Methods:**

```go
cfg.App.IsDevelopment() // Returns true if env is development/local
cfg.App.IsProduction()  // Returns true if env is production
cfg.App.IsStaging()     // Returns true if env is staging
```

### 2. Server Configuration

HTTP and gRPC server settings.

```go
type ServerConfig struct {
    HTTP HTTPConfig
    GRPC GRPCConfig
}
```

#### HTTP Configuration

```go
type HTTPConfig struct {
    Host            string        // Host address
    Port            int           // Port number
    ReadTimeout     time.Duration // Read timeout
    WriteTimeout    time.Duration // Write timeout
    IdleTimeout     time.Duration // Idle timeout
    ShutdownTimeout time.Duration // Graceful shutdown timeout
    CORS            CORSConfig    // CORS settings
    TLS             TLSConfig     // TLS/SSL settings
}
```

**Environment Variables:**

- `HTTP_HOST` - Host (default: "0.0.0.0")
- `HTTP_PORT` - Port (default: 8080)
- `HTTP_READ_TIMEOUT` - Read timeout (default: "10s")
- `HTTP_WRITE_TIMEOUT` - Write timeout (default: "10s")
- `HTTP_IDLE_TIMEOUT` - Idle timeout (default: "120s")
- `HTTP_SHUTDOWN_TIMEOUT` - Shutdown timeout (default: "15s")

**CORS Environment Variables:**

- `CORS_ENABLED` - Enable CORS (default: true)
- `CORS_ALLOWED_ORIGINS` - Allowed origins, comma-separated (default: "\*")
- `CORS_ALLOWED_METHODS` - Allowed methods (default: "GET,POST,PUT,DELETE,OPTIONS")
- `CORS_ALLOWED_HEADERS` - Allowed headers (default: "\*")
- `CORS_ALLOW_CREDENTIALS` - Allow credentials (default: true)
- `CORS_MAX_AGE` - Max age in seconds (default: 86400)

**TLS Environment Variables:**

- `TLS_ENABLED` - Enable TLS (default: false)
- `TLS_CERT_FILE` - Certificate file path
- `TLS_KEY_FILE` - Key file path

**Helper Methods:**

```go
cfg.Server.HTTP.Address() // Returns "host:port"
```

#### gRPC Configuration

```go
type GRPCConfig struct {
    Host                  string
    Port                  int
    MaxConnectionIdle     time.Duration
    MaxConnectionAge      time.Duration
    MaxConnectionAgeGrace time.Duration
    KeepAliveTime         time.Duration
    KeepAliveTimeout      time.Duration
}
```

**Environment Variables:**

- `GRPC_HOST` - Host (default: "0.0.0.0")
- `GRPC_PORT` - Port (default: 9090)
- `GRPC_MAX_CONNECTION_IDLE` - Max connection idle (default: "5m")
- `GRPC_MAX_CONNECTION_AGE` - Max connection age (default: "30m")
- `GRPC_MAX_CONNECTION_AGE_GRACE` - Grace period (default: "5m")
- `GRPC_KEEPALIVE_TIME` - Keepalive time (default: "2h")
- `GRPC_KEEPALIVE_TIMEOUT` - Keepalive timeout (default: "20s")

### 3. Database Configuration

Database connection settings.

```go
type DatabaseConfig struct {
    Driver          string        // postgres, mysql, sqlite
    Host            string
    Port            int
    Username        string
    Password        string
    Database        string
    SSLMode         string
    MaxOpenConns    int
    MaxIdleConns    int
    ConnMaxLifetime time.Duration
    ConnMaxIdleTime time.Duration
    MigrationPath   string
}
```

**Environment Variables:**

- `DB_DRIVER` - Driver (default: "postgres")
- `DB_HOST` - Host (default: "localhost")
- `DB_PORT` - Port (default: 5432)
- `DB_USERNAME` - Username (default: "postgres")
- `DB_PASSWORD` - Password
- `DB_DATABASE` - Database name (default: "myapp")
- `DB_SSL_MODE` - SSL mode (default: "disable")
- `DB_MAX_OPEN_CONNS` - Max open connections (default: 25)
- `DB_MAX_IDLE_CONNS` - Max idle connections (default: 5)
- `DB_CONN_MAX_LIFETIME` - Connection max lifetime (default: "5m")
- `DB_CONN_MAX_IDLE_TIME` - Connection max idle time (default: "10m")
- `DB_MIGRATION_PATH` - Migration files path (default: "migrations")

**Helper Methods:**

```go
cfg.Database.DSN() // Returns connection string for the driver
// Postgres: "host=localhost port=5432 user=... dbname=... sslmode=..."
// MySQL: "user:pass@tcp(host:port)/dbname?parseTime=true"
// SQLite: "path/to/db.sqlite"
```

### 4. Redis Configuration

Redis connection settings.

```go
type RedisConfig struct {
    Host         string
    Port         int
    Password     string
    DB           int
    MaxRetries   int
    DialTimeout  time.Duration
    ReadTimeout  time.Duration
    WriteTimeout time.Duration
    PoolSize     int
    MinIdleConns int
    TLS          bool
}
```

**Environment Variables:**

- `REDIS_HOST` - Host (default: "localhost")
- `REDIS_PORT` - Port (default: 6379)
- `REDIS_PASSWORD` - Password
- `REDIS_DB` - Database number (default: 0)
- `REDIS_MAX_RETRIES` - Max retries (default: 3)
- `REDIS_DIAL_TIMEOUT` - Dial timeout (default: "5s")
- `REDIS_READ_TIMEOUT` - Read timeout (default: "3s")
- `REDIS_WRITE_TIMEOUT` - Write timeout (default: "3s")
- `REDIS_POOL_SIZE` - Pool size (default: 10)
- `REDIS_MIN_IDLE_CONNS` - Min idle connections (default: 2)
- `REDIS_TLS` - Enable TLS (default: false)

**Helper Methods:**

```go
cfg.Redis.Address() // Returns "host:port"
```

### 5. Queue Configuration

Message queue settings.

```go
type QueueConfig struct {
    Driver      string // rabbitmq, kafka, sqs, redis
    URL         string
    MaxRetries  int
    Concurrency int
    Prefetch    int
}
```

**Environment Variables:**

- `QUEUE_DRIVER` - Driver (default: "redis")
- `QUEUE_URL` - Connection URL
- `QUEUE_MAX_RETRIES` - Max retries (default: 3)
- `QUEUE_CONCURRENCY` - Concurrency (default: 10)
- `QUEUE_PREFETCH` - Prefetch count (default: 10)

### 6. Storage Configuration

Object storage settings (S3, MinIO, GCS, local).

```go
type StorageConfig struct {
    Driver          string // s3, minio, gcs, local
    Endpoint        string
    Region          string
    Bucket          string
    AccessKeyID     string
    SecretAccessKey string
    UseSSL          bool
    BasePath        string
}
```

**Environment Variables:**

- `STORAGE_DRIVER` - Driver (default: "local")
- `STORAGE_ENDPOINT` - Endpoint (for MinIO/S3-compatible)
- `STORAGE_REGION` - Region (default: "us-east-1")
- `STORAGE_BUCKET` - Bucket name
- `STORAGE_ACCESS_KEY_ID` - Access key ID
- `STORAGE_SECRET_ACCESS_KEY` - Secret access key
- `STORAGE_USE_SSL` - Use SSL (default: true)
- `STORAGE_BASE_PATH` - Base path (default: "uploads")

### 7. Logger Configuration

Logging settings.

```go
type LoggerConfig struct {
    Level            string   // debug, info, warn, error
    Format           string   // json, console
    OutputPaths      []string
    ErrorOutputPaths []string
    EnableCaller     bool
    EnableStacktrace bool
}
```

**Environment Variables:**

- `LOG_LEVEL` - Level (default: "info" in prod, "debug" in dev)
- `LOG_FORMAT` - Format (default: "json" in prod, "console" in dev)
- `LOG_OUTPUT_PATHS` - Output paths, comma-separated (default: "stdout")
- `LOG_ERROR_OUTPUT_PATHS` - Error output paths (default: "stderr")
- `LOG_ENABLE_CALLER` - Enable caller info (default: true)
- `LOG_ENABLE_STACKTRACE` - Enable stacktrace (default: true)

### 8. Auth Configuration

Authentication and authorization settings.

```go
type AuthConfig struct {
    JWT      JWTConfig
    OAuth    OAuthConfig
    Session  SessionConfig
    Password PasswordConfig
}
```

#### JWT Configuration

```go
type JWTConfig struct {
    Secret         string
    Issuer         string
    Audience       string
    AccessExpiry   time.Duration
    RefreshExpiry  time.Duration
    Algorithm      string // HS256, RS256
    PrivateKeyPath string
    PublicKeyPath  string
}
```

**Environment Variables:**

- `JWT_SECRET` - Secret key (for HS256)
- `JWT_ISSUER` - Issuer (default: "go-infra")
- `JWT_AUDIENCE` - Audience (default: "go-infra-api")
- `JWT_ACCESS_EXPIRY` - Access token expiry (default: "15m")
- `JWT_REFRESH_EXPIRY` - Refresh token expiry (default: "168h" = 7 days)
- `JWT_ALGORITHM` - Algorithm (default: "HS256")
- `JWT_PRIVATE_KEY_PATH` - Private key path (for RS256)
- `JWT_PUBLIC_KEY_PATH` - Public key path (for RS256)

#### OAuth Configuration

```go
type OAuthConfig struct {
    Google   OAuthProvider
    GitHub   OAuthProvider
    Facebook OAuthProvider
}

type OAuthProvider struct {
    Enabled      bool
    ClientID     string
    ClientSecret string
    RedirectURL  string
    Scopes       []string
}
```

**Environment Variables (example for Google):**

- `OAUTH_GOOGLE_ENABLED` - Enable Google OAuth (default: false)
- `OAUTH_GOOGLE_CLIENT_ID` - Client ID
- `OAUTH_GOOGLE_CLIENT_SECRET` - Client secret
- `OAUTH_GOOGLE_REDIRECT_URL` - Redirect URL
- `OAUTH_GOOGLE_SCOPES` - Scopes, comma-separated (default: "email,profile")

Similar patterns for `OAUTH_GITHUB_*` and `OAUTH_FACEBOOK_*`.

#### Session Configuration

```go
type SessionConfig struct {
    CookieName string
    Secret     string
    MaxAge     time.Duration
    Secure     bool
    HTTPOnly   bool
    SameSite   string // strict, lax, none
}
```

**Environment Variables:**

- `SESSION_COOKIE_NAME` - Cookie name (default: "session")
- `SESSION_SECRET` - Secret key
- `SESSION_MAX_AGE` - Max age (default: "24h")
- `SESSION_SECURE` - Secure flag (default: false)
- `SESSION_HTTP_ONLY` - HTTP only flag (default: true)
- `SESSION_SAME_SITE` - SameSite attribute (default: "lax")

#### Password Configuration

```go
type PasswordConfig struct {
    MinLength      int
    RequireUpper   bool
    RequireLower   bool
    RequireNumber  bool
    RequireSpecial bool
    BcryptCost     int
}
```

**Environment Variables:**

- `PASSWORD_MIN_LENGTH` - Min length (default: 8)
- `PASSWORD_REQUIRE_UPPER` - Require uppercase (default: true)
- `PASSWORD_REQUIRE_LOWER` - Require lowercase (default: true)
- `PASSWORD_REQUIRE_NUMBER` - Require number (default: true)
- `PASSWORD_REQUIRE_SPECIAL` - Require special char (default: true)
- `PASSWORD_BCRYPT_COST` - Bcrypt cost (default: 12)

## Usage Examples

### Basic Usage

```go
package main

import (
    "log"
    "local/go-infra/pkg/application/config"
)

func main() {
    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("Config error: %v", err)
    }

    // Use it
    log.Printf("Starting %s v%s", cfg.App.Name, cfg.App.Version)
}
```

### Singleton Pattern

```go
// Load once and reuse
cfg, err := config.LoadOnce()

// Get global config
config.Set(cfg)
globalCfg := config.Get()
```

### HTTP Server Example

```go
import (
    "net/http"
    "local/go-infra/pkg/application/config"
)

func main() {
    cfg, _ := config.Load()

    server := &http.Server{
        Addr:         cfg.Server.HTTP.Address(),
        ReadTimeout:  cfg.Server.HTTP.ReadTimeout,
        WriteTimeout: cfg.Server.HTTP.WriteTimeout,
        IdleTimeout:  cfg.Server.HTTP.IdleTimeout,
    }

    log.Fatal(server.ListenAndServe())
}
```

### Database Connection Example

```go
import (
    "database/sql"
    _ "github.com/lib/pq"
    "local/go-infra/pkg/application/config"
)

func main() {
    cfg, _ := config.Load()

    db, err := sql.Open(cfg.Database.Driver, cfg.Database.DSN())
    if err != nil {
        log.Fatal(err)
    }

    db.SetMaxOpenConns(cfg.Database.MaxOpenConns)
    db.SetMaxIdleConns(cfg.Database.MaxIdleConns)
    db.SetConnMaxLifetime(cfg.Database.ConnMaxLifetime)
}
```

### Environment-Specific Logic

```go
cfg, _ := config.Load()

if cfg.App.IsDevelopment() {
    // Enable debug features
    log.Println("Running in development mode")
} else if cfg.App.IsProduction() {
    // Production optimizations
    log.Println("Running in production mode")
}
```

## Validation

All configuration is automatically validated when loaded. Validation errors are detailed and helpful:

```go
cfg, err := config.Load()
if err != nil {
    // err contains all validation errors
    log.Fatalf("Configuration validation failed: %v", err)
}
```

Example validation error:

```
Configuration validation failed:
  server.http.port: port must be between 1 and 65535;
  database.host: host is required;
  auth.jwt.secret: JWT secret is required for HS256 algorithm
```

## Best Practices

### 1. Load Configuration Early

```go
func main() {
    // Load config as the first thing
    cfg, err := config.LoadOnce()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // Pass config to components that need it
    server := NewServer(cfg.Server)
    db := NewDatabase(cfg.Database)
}
```

### 2. Use Environment-Specific Defaults

The package automatically adjusts defaults based on `APP_ENV`:

- Development: `LOG_LEVEL=debug`, `LOG_FORMAT=console`
- Production: `LOG_LEVEL=info`, `LOG_FORMAT=json`

### 3. Never Hardcode Secrets

❌ **Bad:**

```go
cfg.Database.Password = "hardcoded-password"
```

✅ **Good:**

```bash
# Use environment variables
export DB_PASSWORD="secure-password"
```

### 4. Use Helper Methods

```go
// Use helper methods instead of string comparison
if cfg.App.IsDevelopment() {
    // ...
}

// Use built-in methods
address := cfg.Server.HTTP.Address()
dsn := cfg.Database.DSN()
```

### 5. Validate Early

```go
cfg, err := config.Load()
if err != nil {
    // Fail fast if configuration is invalid
    log.Fatalf("Invalid configuration: %v", err)
}
```

## Testing

### Setting Configuration for Tests

```go
import (
    "testing"
    "local/go-infra/pkg/application/config"
)

func TestSomething(t *testing.T) {
    // Create test configuration
    testCfg := &config.Config{
        App: config.AppConfig{
            Name:        "test-app",
            Environment: "development",
        },
        // ... other config
    }

    // Set for testing
    config.Set(testCfg)

    // Run tests
    // ...
}
```

### Using Environment Variables in Tests

```go
func TestWithEnv(t *testing.T) {
    // Set environment variables
    os.Setenv("APP_NAME", "test-app")
    os.Setenv("HTTP_PORT", "8888")
    defer os.Unsetenv("APP_NAME")
    defer os.Unsetenv("HTTP_PORT")

    // Load config
    cfg, err := config.Load()
    if err != nil {
        t.Fatal(err)
    }

    // Assert
    if cfg.App.Name != "test-app" {
        t.Errorf("Expected test-app, got %s", cfg.App.Name)
    }
}
```

## Integration with Other Packages

### With Logger

```go
import (
    "local/go-infra/pkg/application/config"
    "local/go-infra/pkg/logger"
)

func main() {
    cfg, _ := config.Load()

    // Use config to initialize logger
    logCfg := &logger.Config{
        Environment:      cfg.App.Environment,
        Level:            cfg.Logger.Level,
        Encoding:         cfg.Logger.Format,
        OutputPaths:      cfg.Logger.OutputPaths,
        ErrorOutputPaths: cfg.Logger.ErrorOutputPaths,
        EnableCaller:     cfg.Logger.EnableCaller,
        EnableStacktrace: cfg.Logger.EnableStacktrace,
        ServiceName:      cfg.App.Name,
    }

    log, _ := logger.New(logCfg)
    log.Info("Application started", logger.String("version", cfg.App.Version))
}
```

## Migration Guide

If you're migrating from another configuration system:

### From Viper

```go
// Before (Viper)
viper.GetString("app.name")
viper.GetInt("http.port")

// After (go-infra)
cfg, _ := config.Load()
cfg.App.Name
cfg.Server.HTTP.Port
```

### From Environment Variables

```go
// Before
appName := os.Getenv("APP_NAME")
port, _ := strconv.Atoi(os.Getenv("HTTP_PORT"))

// After
cfg, _ := config.Load()
cfg.App.Name
cfg.Server.HTTP.Port
```

## Contributing

When adding new configuration options:

1. Add fields to the appropriate struct in `config.go`
2. Add loader function logic
3. Add validation rules in `validation.go`
4. Update this README
5. Add example usage

## License

Part of the go-infra project.

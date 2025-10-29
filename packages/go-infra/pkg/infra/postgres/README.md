# PostgreSQL Infrastructure Package

The PostgreSQL infrastructure package provides a comprehensive, production-ready PostgreSQL integration for Go applications using GORM. It follows Go's idiomatic patterns and integrates seamlessly with the existing logger, error, and config packages.

## Features

- ✅ **Connection Management**: Automatic connection pooling and health checks
- ✅ **Generic Repository**: Type-safe repository pattern with generics
- ✅ **Migration System**: Comprehensive database migration management
- ✅ **Transaction Support**: Easy-to-use transaction handling
- ✅ **Query Builder**: GORM-powered query building
- ✅ **Pagination**: Built-in pagination support
- ✅ **Error Handling**: Integrated with custom error system
- ✅ **Logging**: Automatic query logging with configurable levels
- ✅ **Health Checks**: Database health monitoring
- ✅ **Statistics**: Connection pool statistics

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Client](#client)
- [Repository](#repository)
- [Migrations](#migrations)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Installation

```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres
```

## Quick Start

### 1. Setup Configuration

Set environment variables or use the config package:

```bash
export DB_DRIVER=postgres
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=myuser
export DB_PASSWORD=mypassword
export DB_DATABASE=mydb
export DB_SSL_MODE=disable
export DB_MAX_OPEN_CONNS=25
export DB_MAX_IDLE_CONNS=5
```

### 2. Initialize PostgreSQL Client

```go
package main

import (
    "context"
    "local/go-infra/pkg/application/config"
    "local/go-infra/pkg/infra/postgres"
    "local/go-infra/pkg/logger"
)

func main() {
    // Initialize logger
    log, _ := logger.New(nil)
    defer log.Sync()

    // Load config
    cfg, _ := config.Load()

    // Create PostgreSQL client
    pgClient, err := postgres.NewFromAppConfig(&cfg.Database, log)
    if err != nil {
        log.Fatal("failed to create postgres client", logger.Err(err))
    }
    defer pgClient.Close()

    // Check health
    ctx := context.Background()
    if err := pgClient.Health(ctx); err != nil {
        log.Fatal("database health check failed", logger.Err(err))
    }

    log.Info("database connection is healthy")
}
```

### 3. Define Your Models

```go
package models

import (
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID        uint           `gorm:"primaryKey"`
    Email     string         `gorm:"uniqueIndex;not null"`
    Name      string         `gorm:"not null"`
    Age       int            `gorm:"default:0"`
    Active    bool           `gorm:"default:true"`
    CreatedAt time.Time      `gorm:"autoCreateTime"`
    UpdatedAt time.Time      `gorm:"autoUpdateTime"`
    DeletedAt gorm.DeletedAt `gorm:"index"`
}

type Post struct {
    ID        uint      `gorm:"primaryKey"`
    UserID    uint      `gorm:"not null;index"`
    Title     string    `gorm:"not null"`
    Content   string    `gorm:"type:text"`
    Published bool      `gorm:"default:false"`
    User      User      `gorm:"foreignKey:UserID"`
    CreatedAt time.Time `gorm:"autoCreateTime"`
    UpdatedAt time.Time `gorm:"autoUpdateTime"`
}
```

### 4. Use the Repository

```go
// Create repository
userRepo := postgres.NewRepository[User, uint](pgClient.DB())

// Create a user
user := &User{
    Email: "john@example.com",
    Name:  "John Doe",
    Age:   30,
}
err := userRepo.Create(ctx, user)

// Find by ID
user, err := userRepo.FindByID(ctx, 1)

// Update
user.Age = 31
err := userRepo.Update(ctx, user)

// Delete
err := userRepo.Delete(ctx, 1)
```

## Configuration

### Using Application Config

```go
cfg, err := config.Load()
pgClient, err := postgres.NewFromAppConfig(&cfg.Database, log)
```

### Manual Configuration

```go
pgConfig := &postgres.Config{
    DSN:             "host=localhost port=5432 user=myuser password=mypass dbname=mydb sslmode=disable",
    MaxOpenConns:    25,
    MaxIdleConns:    5,
    ConnMaxLifetime: 5 * time.Minute,
    ConnMaxIdleTime: 10 * time.Minute,
    LogLevel:        gormlogger.Info,
    SlowThreshold:   200 * time.Millisecond,
}

pgClient, err := postgres.New(pgConfig, log)
```

## Client

### Basic Operations

```go
// Get underlying GORM DB
db := pgClient.DB()

// Get DB with context
db := pgClient.WithContext(ctx)

// Health check
err := pgClient.Health(ctx)

// Connection statistics
stats, err := pgClient.Stats()
log.Info("database stats",
    logger.Int("open_connections", stats.OpenConnections),
    logger.Int("in_use", stats.InUse),
    logger.Int("idle", stats.Idle),
)

// Close connection
err := pgClient.Close()
```

### Transactions

```go
// Simple transaction
err := pgClient.Transaction(ctx, func(tx *gorm.DB) error {
    // Use tx for database operations
    userRepo := postgres.NewRepository[User, uint](tx)

    if err := userRepo.Create(ctx, &user); err != nil {
        return err // Automatically rolls back
    }

    return nil // Commits transaction
})

// Transaction with options
err := pgClient.TransactionWithOptions(ctx, &postgres.TxOptions{
    ReadOnly: true,
}, func(tx *gorm.DB) error {
    // Read-only operations
    return nil
})

// Note: TxOptions.ReadOnly is passed to the underlying DB transaction options when possible
// (GORM will create the transaction using sql.TxOptions). This means ReadOnly transactions
// will be used where supported by the driver/DB.
```

### Auto-Migration

```go
// Auto-migrate models
err := pgClient.AutoMigrate(&User{}, &Post{}, &Comment{})
```

### Raw SQL

```go
// Execute raw SQL
err := pgClient.Exec(ctx, "UPDATE users SET active = ? WHERE age < ?", true, 18)

// Raw query with results
type Result struct {
    Active bool  `json:"active"`
    Count  int64 `json:"count"`
}

var results []Result
sql := "SELECT active, COUNT(*) as count FROM users GROUP BY active"
err := pgClient.Raw(ctx, &results, sql)
```

## Repository

### Creating a Repository

```go
// Generic repository with type safety
// Repository[EntityType, PrimaryKeyType]
userRepo := postgres.NewRepository[User, uint](pgClient.DB())
postRepo := postgres.NewRepository[Post, uint](pgClient.DB())
```

### CRUD Operations

```go
// Create
user := &User{Email: "john@example.com", Name: "John Doe"}
err := userRepo.Create(ctx, user)

// Create in batches
users := []User{{...}, {...}, {...}}
err := userRepo.CreateInBatches(ctx, users, 100)

// Find by ID
user, err := userRepo.FindByID(ctx, 1)

// Find one with conditions
user, err := userRepo.FindOne(ctx, map[string]interface{}{
    "email": "john@example.com",
})

// Find all with conditions
users, err := userRepo.FindAll(ctx, map[string]interface{}{
    "active": true,
})

// Update
user.Age = 31
err := userRepo.Update(ctx, user)

// Update specific columns
err := userRepo.UpdateColumns(ctx, 1, map[string]interface{}{
    "name": "John Updated",
    "age":  32,
})

// Delete
err := userRepo.Delete(ctx, 1)

// Soft delete (requires DeletedAt field)
err := userRepo.SoftDelete(ctx, 1)

// Restore soft-deleted entity
err := userRepo.Restore(ctx, 1)

// Delete with conditions
deletedCount, err := userRepo.DeleteWhere(ctx, map[string]interface{}{
    "active": false,
})
```

### Checking Existence and Counting

```go
// Check if entity exists
exists, err := userRepo.Exists(ctx, 1)

// Count entities
count, err := userRepo.Count(ctx, map[string]interface{}{
    "active": true,
})
```

### Pagination

```go
// List with pagination
result, err := userRepo.List(ctx, &postgres.ListOptions{
    Page:     1,
    PageSize: 20,
    OrderBy:  "created_at DESC",
    Conditions: map[string]interface{}{
        "active": true,
    },
    Where:     "age >= ?",
    WhereArgs: []interface{}{18},
    Preloads:  []string{"Posts", "Profile"},
})

// Access results
log.Info("pagination",
    logger.Int("page", result.Page),
    logger.Int("total", int(result.Total)),
    logger.Int("total_pages", result.TotalPages),
    logger.Bool("has_next", result.HasNextPage()),
    logger.Bool("has_prev", result.HasPrevPage()),
)

for _, user := range result.Items {
    // Process each user
}
```

### Upsert (Insert or Update)

```go
// Upsert based on unique constraint
user := &User{
    Email: "john@example.com",
    Name:  "John Doe",
}

// If email exists, update all fields; otherwise, insert
err := userRepo.Upsert(ctx, user, []string{"email"})
```

### Custom Queries

```go
// Get the underlying GORM DB for custom queries
db := userRepo.Query(ctx)

var users []User
err := db.
    Where("age >= ?", 18).
    Where("active = ?", true).
    Order("created_at DESC").
    Limit(10).
    Find(&users).
    Error
```

### Transactions with Repository

```go
// Execute operations in a transaction
err := userRepo.Transaction(ctx, func(tx *gorm.DB) error {
    // Create a new repository instance using the transaction
    txUserRepo := userRepo.WithDB(tx)
    txPostRepo := postRepo.WithDB(tx)

    // Perform operations
    if err := txUserRepo.Create(ctx, &user); err != nil {
        return err
    }

    post.UserID = user.ID
    if err := txPostRepo.Create(ctx, &post); err != nil {
        return err
    }

    return nil
})
```

## Migrations

### Manual Migrations

```go
// Create migrator
migrator := postgres.NewMigrator(pgClient.DB(), log)

// Initialize migrations table
err := migrator.Init(ctx)

// Define migrations
migrations := []postgres.Migration{
    {
        Version: "20240101000001",
        Name:    "create_users_table",
        Up: func(tx *gorm.DB) error {
            return tx.AutoMigrate(&User{})
        },
        Down: func(tx *gorm.DB) error {
            return tx.Migrator().DropTable(&User{})
        },
    },
    {
        Version: "20240101000002",
        Name:    "add_email_verification",
        Up: func(tx *gorm.DB) error {
            return tx.Exec("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE").Error
        },
        Down: func(tx *gorm.DB) error {
            return tx.Exec("ALTER TABLE users DROP COLUMN email_verified").Error
        },
    },
}

// Run migrations
err := migrator.Up(ctx, migrations)

// Rollback last migration
err := migrator.Down(ctx, migrations)

// Check migration status
status, err := migrator.Status(ctx, migrations)
log.Info("migration status",
    logger.Int("total", status.Total),
    logger.Int("applied", status.Applied),
    logger.Int("pending", status.Pending),
)
```

### Auto-Migration

```go
// Simple auto-migration (for development)
err := migrator.AutoMigrate(&User{}, &Post{}, &Comment{})
```

### Migration Status

```go
status, err := migrator.Status(ctx, migrations)

// Check last applied migration
if status.Last != nil {
    log.Info("last migration",
        logger.String("version", status.Last.Version),
        logger.String("name", status.Last.Name),
    )
}

// List all migrations
for _, mig := range status.Migrations {
    log.Info("migration",
        logger.String("version", mig.Version),
        logger.String("name", mig.Name),
        logger.Bool("applied", mig.Applied),
    )
}
```

## Advanced Usage

### Complex Queries with Preloading

```go
result, err := userRepo.List(ctx, &postgres.ListOptions{
    Page:     1,
    PageSize: 10,
    Preloads: []string{
        "Posts",
        "Posts.Comments",
        "Profile",
    },
    Where:     "age >= ? AND active = ?",
    WhereArgs: []interface{}{18, true},
    OrderBy:   "created_at DESC",
})
```

### Batch Operations

```go
// Create multiple entities at once
users := []User{
    {Email: "user1@example.com", Name: "User 1"},
    {Email: "user2@example.com", Name: "User 2"},
    {Email: "user3@example.com", Name: "User 3"},
}

// Insert in batches of 100
err := userRepo.CreateInBatches(ctx, users, 100)
```

### Soft Deletes

```go
// Soft delete (sets DeletedAt field)
err := userRepo.SoftDelete(ctx, userId)

// Query won't return soft-deleted records by default
users, err := userRepo.FindAll(ctx, nil)

// Include soft-deleted records
db := userRepo.Query(ctx).Unscoped()
var allUsers []User
err := db.Find(&allUsers).Error

// Restore soft-deleted entity
err := userRepo.Restore(ctx, userId)
```

### Multiple Database Connections

```go
// Primary database
primaryClient, err := postgres.NewFromAppConfig(&cfg.Database, log)

// Read-only replica
replicaConfig := &postgres.Config{
    DSN:          "host=replica.example.com ...",
    MaxOpenConns: 50,
    // ...
}
replicaClient, err := postgres.New(replicaConfig, log)

// Use different connections
writeRepo := postgres.NewRepository[User, uint](primaryClient.DB())
readRepo := postgres.NewRepository[User, uint](replicaClient.DB())

// Write to primary
err := writeRepo.Create(ctx, &user)

// Read from replica
users, err := readRepo.FindAll(ctx, nil)
```

## Best Practices

### 1. Always Use Context

```go
// Good
user, err := userRepo.FindByID(ctx, id)

// Bad - no timeout control
user, err := userRepo.FindByID(context.Background(), id)
```

### 2. Handle Errors Properly

```go
user, err := userRepo.FindByID(ctx, id)
if err != nil {
    // Check if it's a not found error
    if errors.Is(err, errors.CodeNotFound) {
        return nil, errors.NotFound("user")
    }
    return nil, err
}
```

### 3. Use Transactions for Multiple Operations

```go
err := pgClient.Transaction(ctx, func(tx *gorm.DB) error {
    userRepo := postgres.NewRepository[User, uint](tx)
    postRepo := postgres.NewRepository[Post, uint](tx)

    // All operations will be rolled back if any fails
    if err := userRepo.Create(ctx, &user); err != nil {
        return err
    }

    if err := postRepo.Create(ctx, &post); err != nil {
        return err
    }

    return nil
})
```

### 4. Close Connections Gracefully

```go
defer func() {
    if err := pgClient.Close(); err != nil {
        log.Error("failed to close database connection", logger.Err(err))
    }
}()
```

### 5. Use Pagination for Large Datasets

```go
// Bad - loads everything into memory
users, err := userRepo.FindAll(ctx, nil)

// Good - paginate
result, err := userRepo.List(ctx, &postgres.ListOptions{
    Page:     page,
    PageSize: 50,
})
```

### 6. Index Your Database

```go
type User struct {
    ID    uint   `gorm:"primaryKey"`
    Email string `gorm:"uniqueIndex;not null"` // Unique index
    Name  string `gorm:"index"`                 // Regular index
}
```

### 7. Use Prepared Statements for Security

The repository automatically uses prepared statements for all queries, protecting against SQL injection:

```go
// Safe - uses prepared statements internally
users, err := userRepo.FindAll(ctx, map[string]interface{}{
    "email": userInput, // Safe from SQL injection
})
```

## Examples

See the `examples/` directory for complete examples:

- `examples/postgres_example/main.go` - Basic repository operations
- `examples/postgres_migration_example/main.go` - Database migrations

Run examples:

```bash
# Set up your database first
export DB_DRIVER=postgres
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_DATABASE=testdb
export DB_SSL_MODE=disable

# Run basic example
go run examples/postgres_example/main.go

# Run migration example
go run examples/postgres_migration_example/main.go
```

## Integration with Other Packages

### With Logger

The PostgreSQL package automatically integrates with the logger package:

```go
// Slow queries are automatically logged
// SQL errors are automatically logged
// Query execution times are logged in debug mode
```

### With Error Package

All database errors are wrapped with the custom error system:

```go
user, err := userRepo.FindByID(ctx, 999)
if err != nil {
    // Error is automatically an AppError
    appErr, ok := errors.As(err)
    if ok {
        log.Error("database error",
            logger.String("code", string(appErr.Code)),
            logger.Int("http_status", appErr.GetHTTPStatus()),
        )
    }
}
```

### With Config Package

Configuration is seamlessly loaded from environment variables:

```go
cfg, _ := config.Load()
pgClient, _ := postgres.NewFromAppConfig(&cfg.Database, log)
```

## Troubleshooting

### Connection Issues

```go
// Check health
if err := pgClient.Health(ctx); err != nil {
    log.Error("health check failed", logger.Err(err))
}

// Check statistics
stats, _ := pgClient.Stats()
log.Info("connection pool",
    logger.Int("open", stats.OpenConnections),
    logger.Int("in_use", stats.InUse),
    logger.Int("idle", stats.Idle),
)
```

### Slow Queries

Adjust the slow query threshold:

```go
pgConfig := &postgres.Config{
    // ...
    SlowThreshold: 500 * time.Millisecond, // Log queries taking > 500ms
}
```

### Too Many Connections

```go
pgConfig := &postgres.Config{
    MaxOpenConns:    10, // Reduce max connections
    MaxIdleConns:    2,  // Reduce idle connections
    ConnMaxLifetime: 5 * time.Minute,
}
```

## License

This package is part of the go-infra project.

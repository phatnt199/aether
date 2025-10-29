# go-infra 🚀

**A comprehensive, production-ready infrastructure framework for building Go applications**

[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)](https://golang.org/doc/devel/release.html)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

go-infra is a battle-tested, modular infrastructure framework that provides everything you need to build production-ready Go applications. From error handling to CRUD APIs, from logging to cryptography - it's all here, following Go's idiomatic patterns.

### ✨ Key Features

- 🎯 **Zero-Boilerplate CRUD** - Build REST APIs in minutes with automatic CRUD generation
- 🛡️ **Production-Ready Error Handling** - 30+ error codes with automatic HTTP mapping
- 📝 **Structured Logging** - High-performance logging with context propagation
- 🔐 **Security Built-in** - Password hashing, JWT, AES encryption
- 🗄️ **Database Integration** - PostgreSQL with GORM, migrations, transactions
- 🧰 **Rich Utilities** - 117+ utility functions for common tasks
- ⚙️ **Configuration Management** - Environment-based config with validation
- 🔄 **Type-Safe** - Leverages Go generics for type safety

## Quick Start

### Install

```bash
# Add to your go.mod
require local/go-infra v0.0.0

# For local development
replace local/go-infra => /path/to/go-infra
```

### Build Your First API (60 seconds)

```go
package main

import (
    "local/go-infra/pkg/adapter/http/crud"
    "local/go-infra/pkg/adapter/http/fiber"
    "local/go-infra/pkg/domain/entity"
    "local/go-infra/pkg/infra/postgres"
    "local/go-infra/pkg/logger"
)

type User struct {
    entity.BaseModel
    Name  string `json:"name" validate:"required"`
    Email string `json:"email" validate:"required,email"`
}

func main() {
    logger.Init()
    db, _ := postgres.Connect(&postgres.Config{
        Host: "localhost", Port: 5432, User: "postgres",
        Password: "postgres", Database: "myapp",
    })
    db.AutoMigrate(&User{})

    app, router := fiber.New()
    crud.RegisterCRUD[*User](router, db, &crud.CRUDOptions[*User, string]{
        BasePath: "/api/users",
    })

    app.Listen(":3000")
}
```

**That's it!** You now have a complete REST API with CREATE, READ, UPDATE, DELETE, LIST, and COUNT endpoints.

## 📚 Documentation

**[Complete Documentation →](./docs/README.md)**

### Quick Links

- [Quick Start Guide](./docs/01-QUICK-START.md) - Get running in 5 minutes
- [CRUD System](./docs/crud/CRUD-QUICK-START.md) - Build APIs fast
- [Error Handling](./docs/packages/ERRORS.md) - Production-ready errors
- [All Examples](./examples/) - Working code examples

## What's Included

### Core Packages

| Package      | Description           | Key Features                               |
| ------------ | --------------------- | ------------------------------------------ |
| **errors**   | Error handling system | 30+ codes, HTTP mapping, context tracking  |
| **logger**   | Structured logging    | Zap-based, type-safe, high-performance     |
| **crypto**   | Security utilities    | Password hashing, JWT, AES encryption      |
| **utils**    | Common utilities      | 117+ functions for everyday tasks          |
| **config**   | Configuration         | Environment-based, validated               |
| **postgres** | Database client       | GORM integration, migrations, transactions |
| **crud**     | Auto CRUD APIs        | Zero-boilerplate REST endpoints            |

## Examples

```bash
# Complete CRUD API
go run examples/complete-crud-api/main.go

# All features demo
go run examples/crypto_example/main.go
go run examples/logger_example/main.go
go run examples/utils_example/main.go
```

## License

MIT License - Built with ❤️ for the Go community

# Crypto Package

The `crypto` package provides production-ready cryptographic utilities for password hashing, JWT token management, and data encryption/decryption.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Password Hashing](#password-hashing)
- [JWT Tokens](#jwt-tokens)
- [Encryption/Decryption](#encryptiondecryption)
- [Security Best Practices](#security-best-practices)
- [API Reference](#api-reference)

## Features

### Password Hashing

- ✅ **Bcrypt** - Industry standard password hashing
- ✅ **Argon2id** - Modern, memory-hard password hashing (OWASP recommended)
- ✅ Automatic algorithm detection
- ✅ Configurable work factors
- ✅ Constant-time comparison (timing attack prevention)

### JWT Tokens

- ✅ **HMAC algorithms** (HS256, HS384, HS512)
- ✅ **RSA algorithms** (RS256, RS384, RS512)
- ✅ Access and refresh token generation
- ✅ Token validation and parsing
- ✅ Custom claims support
- ✅ Token expiration management

### Encryption

- ✅ **AES-GCM** encryption (AES-128, AES-192, AES-256)
- ✅ Authenticated encryption
- ✅ Automatic key generation
- ✅ String and byte encryption
- ✅ Base64 encoding for storage

## Installation

The crypto package is part of `go-infra`. Import it in your project:

```go
import "local/go-infra/pkg/crypto"
```

Required dependencies (already included):

```bash
go get golang.org/x/crypto
go get github.com/golang-jwt/jwt/v5
```

## Quick Start

### Password Hashing

```go
package main

import (
    "fmt"
    "local/go-infra/pkg/crypto"
)

func main() {
    password := "MySecurePassword123!"

    // Hash with Bcrypt
    hash, err := crypto.HashPasswordBcrypt(password)
    if err != nil {
        panic(err)
    }

    // Verify password
    match, err := crypto.ComparePassword(password, hash)
    if err != nil {
        panic(err)
    }

    fmt.Printf("Password matches: %v\n", match)
}
```

### JWT Tokens

```go
package main

import (
    "fmt"
    "time"
    "local/go-infra/pkg/crypto"
)

func main() {
    // Initialize JWT
    config := &crypto.JWTConfig{
        Secret:            "your-secret-key",
        Algorithm:         crypto.AlgorithmHS256,
        AccessTokenExpiry: 15 * time.Minute,
    }

    crypto.InitDefaultJWT(config)

    // Create claims
    claims := &crypto.Claims{
        UserID:   "user123",
        Username: "john",
        Email:    "john@example.com",
        Roles:    []string{"admin"},
    }

    // Generate token
    token, err := crypto.GenerateAccessToken(claims)
    if err != nil {
        panic(err)
    }

    // Parse token
    parsed, err := crypto.ParseJWT(token)
    if err != nil {
        panic(err)
    }

    fmt.Printf("User: %s\n", parsed.Username)
}
```

### Encryption

```go
package main

import (
    "fmt"
    "local/go-infra/pkg/crypto"
)

func main() {
    // Generate key
    key, err := crypto.GenerateAES256Key()
    if err != nil {
        panic(err)
    }

    // Initialize encryptor
    crypto.InitDefaultEncryptor(key)

    // Encrypt
    plaintext := "Secret data"
    ciphertext, err := crypto.Encrypt(plaintext)
    if err != nil {
        panic(err)
    }

    // Decrypt
    decrypted, err := crypto.Decrypt(ciphertext)
    if err != nil {
        panic(err)
    }

    fmt.Printf("Decrypted: %s\n", decrypted)
}
```

## Password Hashing

### Bcrypt Hashing

Bcrypt is a widely-used, battle-tested password hashing algorithm.

```go
// Hash password with default cost (10)
hash, err := crypto.HashPasswordBcrypt("password123")

// Hash with custom cost
hasher := crypto.NewHasher(&crypto.HashConfig{
    BcryptCost: 12, // Higher = more secure, but slower
})
hash, err := hasher.HashPassword("password123", crypto.AlgorithmBcrypt)
```

### Argon2 Hashing

Argon2id is the modern standard, recommended by OWASP for password hashing.

```go
// Hash with default parameters
hash, err := crypto.HashPasswordArgon2("password123")

// Hash with custom parameters
hasher := crypto.NewHasher(&crypto.HashConfig{
    Argon2Time:    2,        // Number of iterations
    Argon2Memory:  64 * 1024, // 64 MB
    Argon2Threads: 4,        // Parallelism
    Argon2KeyLen:  32,       // Output length
})
hash, err := hasher.HashPassword("password123", crypto.AlgorithmArgon2)
```

### Password Verification

```go
// Automatically detects algorithm
match, err := crypto.ComparePassword("password123", hash)
if err != nil {
    // Handle error
}

if match {
    // Password is correct
} else {
    // Password is incorrect
}

// Alternative name
match, err := crypto.VerifyPassword("password123", hash)
```

### Example: User Registration

```go
func RegisterUser(username, password string) error {
    // Validate password strength
    if len(password) < 8 {
        return errors.BadRequest("password must be at least 8 characters")
    }

    // Hash password
    hash, err := crypto.HashPasswordArgon2(password)
    if err != nil {
        return errors.Wrap(err, errors.CodeInternal, "failed to hash password")
    }

    // Store user with hashed password
    user := &User{
        Username: username,
        Password: hash,
    }

    return db.Create(user).Error
}

func LoginUser(username, password string) (*User, error) {
    // Fetch user
    var user User
    if err := db.Where("username = ?", username).First(&user).Error; err != nil {
        return nil, errors.NotFound("user")
    }

    // Verify password
    match, err := crypto.ComparePassword(password, user.Password)
    if err != nil {
        return nil, err
    }

    if !match {
        return nil, errors.Unauthorized("invalid credentials")
    }

    return &user, nil
}
```

## JWT Tokens

### Configuration

```go
// HMAC configuration (symmetric)
config := &crypto.JWTConfig{
    Secret:             "your-secret-key-here",
    Algorithm:          crypto.AlgorithmHS256,
    Issuer:             "your-app-name",
    Audience:           "your-api",
    AccessTokenExpiry:  15 * time.Minute,
    RefreshTokenExpiry: 7 * 24 * time.Hour,
}

// RSA configuration (asymmetric)
privateKey, _ := crypto.LoadRSAPrivateKeyFromFile("private.pem")
publicKey, _ := crypto.LoadRSAPublicKeyFromFile("public.pem")

config := &crypto.JWTConfig{
    PrivateKey:         privateKey,
    PublicKey:          publicKey,
    Algorithm:          crypto.AlgorithmRS256,
    Issuer:             "your-app-name",
    Audience:           "your-api",
    AccessTokenExpiry:  15 * time.Minute,
    RefreshTokenExpiry: 7 * 24 * time.Hour,
}
```

### Token Generation

```go
// Create claims
claims := &crypto.Claims{
    UserID:   "user123",
    Username: "johndoe",
    Email:    "john@example.com",
    Roles:    []string{"admin", "user"},
    Custom: map[string]interface{}{
        "department": "engineering",
        "level":      5,
    },
}

// Generate access token
accessToken, err := manager.GenerateToken(claims, crypto.AccessToken)

// Generate refresh token
refreshToken, err := manager.GenerateToken(claims, crypto.RefreshToken)

// Generate both at once
accessToken, refreshToken, err := manager.GenerateTokenPair(claims)
```

### Token Validation

```go
// Parse and validate token
claims, err := manager.ParseToken(tokenString)
if err != nil {
    // Handle invalid token
    if errors.Is(err, errors.CodeTokenExpired) {
        // Token expired
    } else if errors.Is(err, errors.CodeInvalidToken) {
        // Token invalid
    }
}

// Access claims
userID := claims.UserID
roles := claims.Roles
expiresAt := claims.ExpiresAt.Time

// Just validate without parsing
err := manager.ValidateToken(tokenString)
```

### Token Refresh

```go
// Refresh an access token using a refresh token
newAccessToken, err := manager.RefreshToken(refreshToken)
```

### Example: Auth Middleware

```go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Extract token from header
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "missing authorization header", http.StatusUnauthorized)
            return
        }

        // Format: "Bearer <token>"
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            http.Error(w, "invalid authorization format", http.StatusUnauthorized)
            return
        }

        token := parts[1]

        // Validate token
        claims, err := crypto.ParseJWT(token)
        if err != nil {
            http.Error(w, "invalid token", http.StatusUnauthorized)
            return
        }

        // Add claims to context
        ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
        ctx = context.WithValue(ctx, "roles", claims.Roles)

        // Call next handler
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## Encryption/Decryption

### Key Generation

```go
// Generate AES-256 key (recommended)
key, err := crypto.GenerateAES256Key()

// Generate AES-192 key
key, err := crypto.GenerateAES192Key()

// Generate AES-128 key
key, err := crypto.GenerateAES128Key()

// Convert key to string for storage
keyStr := crypto.KeyToString(key)

// Convert string back to key
key, err := crypto.KeyFromString(keyStr)
```

### String Encryption

```go
// Initialize default encryptor
key, _ := crypto.GenerateAES256Key()
crypto.InitDefaultEncryptor(key)

// Encrypt string
plaintext := "Sensitive data"
ciphertext, err := crypto.Encrypt(plaintext)

// Decrypt string
decrypted, err := crypto.Decrypt(ciphertext)
```

### Byte Encryption

```go
// Encrypt bytes
data := []byte("Binary data")
encrypted, err := crypto.EncryptBytes(data)

// Decrypt bytes
decrypted, err := crypto.DecryptBytes(encrypted)
```

### Custom Encryptor

```go
// Create custom encryptor for specific use case
key, _ := crypto.GenerateAES128Key()
encryptor, err := crypto.NewEncryptor(&crypto.EncryptionConfig{
    Key: key,
})

// Use custom encryptor
ciphertext, err := encryptor.Encrypt("data")
plaintext, err := encryptor.Decrypt(ciphertext)
```

### Example: Encrypting Database Fields

```go
type User struct {
    ID       uint
    Username string
    Email    string
    SSN      string // Encrypted field
}

func (u *User) EncryptSSN(ssn string) error {
    encrypted, err := crypto.Encrypt(ssn)
    if err != nil {
        return err
    }
    u.SSN = encrypted
    return nil
}

func (u *User) DecryptSSN() (string, error) {
    return crypto.Decrypt(u.SSN)
}

// Usage
user := &User{
    Username: "john",
    Email:    "john@example.com",
}

// Encrypt before saving
if err := user.EncryptSSN("123-45-6789"); err != nil {
    return err
}

db.Create(user)

// Decrypt when reading
ssn, err := user.DecryptSSN()
```

## Security Best Practices

### Password Hashing

1. **Use Argon2 for new projects**: It's the modern standard
2. **Never store plain passwords**: Always hash before storage
3. **Use appropriate work factors**:
   - Bcrypt: Cost 12-14 for production
   - Argon2: Default parameters are secure
4. **Don't roll your own crypto**: Use this library's implementations

### JWT Tokens

1. **Use strong secrets**: At least 32 random bytes
2. **Keep secrets secret**: Never commit to version control
3. **Use short expiry times**: 15 minutes for access tokens
4. **Validate all claims**: Don't trust unvalidated tokens
5. **Use HTTPS only**: Never send tokens over HTTP
6. **Store tokens securely**:
   - httpOnly cookies for web
   - Secure storage for mobile
7. **Implement token rotation**: Use refresh tokens
8. **Consider RSA for microservices**: Easier key distribution

### Encryption

1. **Use AES-256**: Unless you have size constraints
2. **Generate keys securely**: Use `GenerateAES256Key()`
3. **Store keys securely**:
   - Environment variables
   - Key management services (AWS KMS, HashiCorp Vault)
   - Hardware security modules
4. **Rotate keys regularly**: Plan for key rotation
5. **Use different keys**: Don't reuse encryption keys
6. **Never store keys with encrypted data**: Keep them separate

### General

1. **Keep dependencies updated**: Security patches are important
2. **Use TLS/HTTPS**: Crypto doesn't protect data in transit
3. **Log security events**: But never log secrets
4. **Handle errors properly**: Don't leak information
5. **Test your security**: Regular security audits

## API Reference

### Password Hashing

#### Types

- `HashAlgorithm`: Algorithm type (`AlgorithmBcrypt`, `AlgorithmArgon2`)
- `HashConfig`: Configuration for password hashing
- `Hasher`: Password hasher instance

#### Functions

```go
func HashPasswordBcrypt(password string) (string, error)
func HashPasswordArgon2(password string) (string, error)
func ComparePassword(password, hash string) (bool, error)
func VerifyPassword(password, hash string) (bool, error)
func NewHasher(config *HashConfig) *Hasher
func DefaultHashConfig() *HashConfig
```

#### Methods

```go
func (h *Hasher) HashPassword(password string, algorithm HashAlgorithm) (string, error)
func (h *Hasher) ComparePassword(password, hash string) (bool, error)
```

### JWT Tokens

#### Types

- `JWTAlgorithm`: JWT signing algorithm
- `JWTConfig`: JWT configuration
- `Claims`: JWT claims structure
- `JWTManager`: JWT manager instance
- `TokenType`: Token type (`AccessToken`, `RefreshToken`)

#### Functions

```go
func NewJWTManager(config *JWTConfig) (*JWTManager, error)
func DefaultJWTConfig() *JWTConfig
func InitDefaultJWT(config *JWTConfig) error
func GenerateAccessToken(claims *Claims) (string, error)
func GenerateRefreshToken(claims *Claims) (string, error)
func ParseJWT(tokenString string) (*Claims, error)
func ValidateJWT(tokenString string) error
func LoadRSAPrivateKeyFromFile(path string) (*rsa.PrivateKey, error)
func LoadRSAPublicKeyFromFile(path string) (*rsa.PublicKey, error)
```

#### Methods

```go
func (m *JWTManager) GenerateToken(claims *Claims, tokenType TokenType) (string, error)
func (m *JWTManager) ParseToken(tokenString string) (*Claims, error)
func (m *JWTManager) ValidateToken(tokenString string) error
func (m *JWTManager) RefreshToken(refreshToken string) (string, error)
func (m *JWTManager) GenerateTokenPair(claims *Claims) (accessToken, refreshToken string, err error)
```

### Encryption

#### Types

- `EncryptionConfig`: Encryption configuration
- `Encryptor`: Encryptor instance

#### Functions

```go
func NewEncryptor(config *EncryptionConfig) (*Encryptor, error)
func GenerateAESKey(size int) ([]byte, error)
func GenerateAES256Key() ([]byte, error)
func GenerateAES192Key() ([]byte, error)
func GenerateAES128Key() ([]byte, error)
func KeyToString(key []byte) string
func KeyFromString(keyStr string) ([]byte, error)
func InitDefaultEncryptor(key []byte) error
func Encrypt(plaintext string) (string, error)
func Decrypt(ciphertext string) (string, error)
func EncryptBytes(plaintext []byte) ([]byte, error)
func DecryptBytes(ciphertext []byte) ([]byte, error)
```

#### Methods

```go
func (e *Encryptor) Encrypt(plaintext string) (string, error)
func (e *Encryptor) Decrypt(encodedCiphertext string) (string, error)
func (e *Encryptor) EncryptBytes(plaintext []byte) ([]byte, error)
func (e *Encryptor) DecryptBytes(ciphertext []byte) ([]byte, error)
```

## Integration with Config

The crypto package integrates seamlessly with the config package:

```go
import (
    "local/go-infra/pkg/application/config"
    "local/go-infra/pkg/crypto"
)

// Load configuration
cfg, err := config.Load()
if err != nil {
    panic(err)
}

// Initialize JWT from config
jwtConfig := &crypto.JWTConfig{
    Secret:             cfg.Auth.JWT.Secret,
    Algorithm:          crypto.JWTAlgorithm(cfg.Auth.JWT.Algorithm),
    Issuer:             cfg.Auth.JWT.Issuer,
    Audience:           cfg.Auth.JWT.Audience,
    AccessTokenExpiry:  cfg.Auth.JWT.AccessExpiry,
    RefreshTokenExpiry: cfg.Auth.JWT.RefreshExpiry,
}

if err := crypto.InitDefaultJWT(jwtConfig); err != nil {
    panic(err)
}

// Initialize password hasher from config
hasher := crypto.NewHasher(&crypto.HashConfig{
    BcryptCost: cfg.Auth.Password.BcryptCost,
})
```

## Examples

See the complete examples in:

- `examples/crypto_example/main.go` - Comprehensive examples
- `examples/with-auth/` - Full authentication system

## Error Handling

The crypto package uses the `pkg/errors` package for consistent error handling:

```go
import "local/go-infra/pkg/errors"

// Check for specific error codes
if err != nil {
    if errors.Is(err, errors.CodeTokenExpired) {
        // Handle expired token
    } else if errors.Is(err, errors.CodeInvalidToken) {
        // Handle invalid token
    }
}
```

## Contributing

When contributing to the crypto package:

1. Follow Go's idiomatic patterns
2. Add comprehensive tests
3. Document security considerations
4. Never commit secrets or keys
5. Follow the project's error handling conventions

## License

Part of the go-infra project.

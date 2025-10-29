package crypto

import (
	"crypto/rsa"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"local/go-infra/pkg/errors"
)

// JWTAlgorithm represents the JWT signing algorithm
type JWTAlgorithm string

const (
	// Symmetric algorithms (HMAC)
	AlgorithmHS256 JWTAlgorithm = "HS256"
	AlgorithmHS384 JWTAlgorithm = "HS384"
	AlgorithmHS512 JWTAlgorithm = "HS512"

	// Asymmetric algorithms (RSA)
	AlgorithmRS256 JWTAlgorithm = "RS256"
	AlgorithmRS384 JWTAlgorithm = "RS384"
	AlgorithmRS512 JWTAlgorithm = "RS512"
)

// JWTConfig holds JWT configuration
type JWTConfig struct {
	// Secret is used for HMAC algorithms
	Secret string

	// PrivateKey is used for RSA algorithms (signing)
	PrivateKey *rsa.PrivateKey

	// PublicKey is used for RSA algorithms (verification)
	PublicKey *rsa.PublicKey

	// Algorithm specifies the signing algorithm
	Algorithm JWTAlgorithm

	// Issuer identifies the JWT issuer
	Issuer string

	// Audience identifies the recipients
	Audience string

	// AccessTokenExpiry is the duration for access tokens
	AccessTokenExpiry time.Duration

	// RefreshTokenExpiry is the duration for refresh tokens
	RefreshTokenExpiry time.Duration
}

// DefaultJWTConfig returns default JWT configuration
func DefaultJWTConfig() *JWTConfig {
	return &JWTConfig{
		Algorithm:          AlgorithmHS256,
		Issuer:             "go-infra",
		Audience:           "go-infra-api",
		AccessTokenExpiry:  15 * time.Minute,
		RefreshTokenExpiry: 7 * 24 * time.Hour,
	}
}

// Claims represents JWT claims
type Claims struct {
	jwt.RegisteredClaims
	UserID   string                 `json:"user_id,omitempty"`
	Username string                 `json:"username,omitempty"`
	Email    string                 `json:"email,omitempty"`
	Roles    []string               `json:"roles,omitempty"`
	Custom   map[string]interface{} `json:"custom,omitempty"`
}

// JWTManager handles JWT token operations
type JWTManager struct {
	config *JWTConfig
}

// NewJWTManager creates a new JWT manager
func NewJWTManager(config *JWTConfig) (*JWTManager, error) {
	if config == nil {
		config = DefaultJWTConfig()
	}

	// Validate configuration
	if err := validateJWTConfig(config); err != nil {
		return nil, err
	}

	return &JWTManager{config: config}, nil
}

// validateJWTConfig validates the JWT configuration
func validateJWTConfig(config *JWTConfig) error {
	// Check if secret or keys are provided based on algorithm
	switch config.Algorithm {
	case AlgorithmHS256, AlgorithmHS384, AlgorithmHS512:
		if config.Secret == "" {
			return errors.BadRequest("secret is required for HMAC algorithms")
		}
	case AlgorithmRS256, AlgorithmRS384, AlgorithmRS512:
		if config.PrivateKey == nil {
			return errors.BadRequest("private key is required for RSA algorithms")
		}
		if config.PublicKey == nil {
			return errors.BadRequest("public key is required for RSA algorithms")
		}
	default:
		return errors.BadRequest("unsupported JWT algorithm").
			WithDetails(fmt.Sprintf("algorithm: %s", config.Algorithm))
	}

	return nil
}

// TokenType represents the type of token
type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

// GenerateToken generates a new JWT token
func (m *JWTManager) GenerateToken(claims *Claims, tokenType TokenType) (string, error) {
	if claims == nil {
		return "", errors.BadRequest("claims cannot be nil")
	}

	// Set standard claims
	now := time.Now()
	var expiry time.Duration

	if tokenType == AccessToken {
		expiry = m.config.AccessTokenExpiry
	} else {
		expiry = m.config.RefreshTokenExpiry
	}

	claims.Issuer = m.config.Issuer
	claims.Audience = jwt.ClaimStrings{m.config.Audience}
	claims.IssuedAt = jwt.NewNumericDate(now)
	claims.ExpiresAt = jwt.NewNumericDate(now.Add(expiry))
	claims.NotBefore = jwt.NewNumericDate(now)

	// Create token
	token := jwt.NewWithClaims(m.getSigningMethod(), claims)

	// Sign token
	signedToken, err := token.SignedString(m.getSigningKey())
	if err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to sign JWT token")
	}

	return signedToken, nil
}

// ParseToken parses and validates a JWT token
func (m *JWTManager) ParseToken(tokenString string) (*Claims, error) {
	if tokenString == "" {
		return nil, errors.BadRequest("token cannot be empty")
	}

	// Parse token
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			// Validate algorithm
			if token.Method.Alg() != string(m.config.Algorithm) {
				return nil, errors.Unauthorized("invalid token algorithm").
					WithDetails(fmt.Sprintf("expected %s, got %s", m.config.Algorithm, token.Method.Alg()))
			}
			return m.getVerificationKey(), nil
		},
	)

	if err != nil {
		return nil, m.handleParseError(err)
	}

	// Extract claims
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.Unauthorized("invalid token")
	}

	// Validate issuer
	if claims.Issuer != m.config.Issuer {
		return nil, errors.Unauthorized("invalid token issuer")
	}

	// Validate audience
	validAudience := false
	for _, aud := range claims.Audience {
		if aud == m.config.Audience {
			validAudience = true
			break
		}
	}
	if !validAudience {
		return nil, errors.Unauthorized("invalid token audience")
	}

	return claims, nil
}

// ValidateToken validates a JWT token without parsing claims
func (m *JWTManager) ValidateToken(tokenString string) error {
	_, err := m.ParseToken(tokenString)
	return err
}

// RefreshToken generates a new access token from a refresh token
func (m *JWTManager) RefreshToken(refreshToken string) (string, error) {
	// Parse refresh token
	claims, err := m.ParseToken(refreshToken)
	if err != nil {
		return "", err
	}

	// Generate new access token with the same claims
	newClaims := &Claims{
		UserID:   claims.UserID,
		Username: claims.Username,
		Email:    claims.Email,
		Roles:    claims.Roles,
		Custom:   claims.Custom,
	}

	return m.GenerateToken(newClaims, AccessToken)
}

// GenerateTokenPair generates both access and refresh tokens
func (m *JWTManager) GenerateTokenPair(claims *Claims) (accessToken, refreshToken string, err error) {
	// Generate access token
	accessToken, err = m.GenerateToken(claims, AccessToken)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshToken, err = m.GenerateToken(claims, RefreshToken)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

// getSigningMethod returns the JWT signing method
func (m *JWTManager) getSigningMethod() jwt.SigningMethod {
	switch m.config.Algorithm {
	case AlgorithmHS256:
		return jwt.SigningMethodHS256
	case AlgorithmHS384:
		return jwt.SigningMethodHS384
	case AlgorithmHS512:
		return jwt.SigningMethodHS512
	case AlgorithmRS256:
		return jwt.SigningMethodRS256
	case AlgorithmRS384:
		return jwt.SigningMethodRS384
	case AlgorithmRS512:
		return jwt.SigningMethodRS512
	default:
		return jwt.SigningMethodHS256
	}
}

// getSigningKey returns the key for signing tokens
func (m *JWTManager) getSigningKey() interface{} {
	switch m.config.Algorithm {
	case AlgorithmHS256, AlgorithmHS384, AlgorithmHS512:
		return []byte(m.config.Secret)
	case AlgorithmRS256, AlgorithmRS384, AlgorithmRS512:
		return m.config.PrivateKey
	default:
		return []byte(m.config.Secret)
	}
}

// getVerificationKey returns the key for verifying tokens
func (m *JWTManager) getVerificationKey() interface{} {
	switch m.config.Algorithm {
	case AlgorithmHS256, AlgorithmHS384, AlgorithmHS512:
		return []byte(m.config.Secret)
	case AlgorithmRS256, AlgorithmRS384, AlgorithmRS512:
		return m.config.PublicKey
	default:
		return []byte(m.config.Secret)
	}
}

// handleParseError converts JWT parsing errors to application errors
func (m *JWTManager) handleParseError(err error) error {
	// Check for specific JWT validation errors
	errMsg := err.Error()

	if contains(errMsg, "token is expired") || contains(errMsg, "exp") {
		return errors.New(errors.CodeTokenExpired, "token has expired")
	}

	if contains(errMsg, "not valid yet") || contains(errMsg, "nbf") {
		return errors.Unauthorized("token is not valid yet")
	}

	if contains(errMsg, "used before issued") || contains(errMsg, "iat") {
		return errors.Unauthorized("token used before issued")
	}

	return errors.Wrap(err, errors.CodeInvalidToken, "failed to parse token")
}

// contains is a helper function to check if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || containsHelper(s, substr)))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// LoadRSAPrivateKeyFromFile loads an RSA private key from a PEM file
func LoadRSAPrivateKeyFromFile(path string) (*rsa.PrivateKey, error) {
	keyData, err := os.ReadFile(path)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to read private key file")
	}

	key, err := jwt.ParseRSAPrivateKeyFromPEM(keyData)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to parse RSA private key")
	}

	return key, nil
}

// LoadRSAPublicKeyFromFile loads an RSA public key from a PEM file
func LoadRSAPublicKeyFromFile(path string) (*rsa.PublicKey, error) {
	keyData, err := os.ReadFile(path)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to read public key file")
	}

	key, err := jwt.ParseRSAPublicKeyFromPEM(keyData)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to parse RSA public key")
	}

	return key, nil
}

// Package-level convenience functions (using default configuration)
var defaultJWTManager *JWTManager

// InitDefaultJWT initializes the default JWT manager
func InitDefaultJWT(config *JWTConfig) error {
	manager, err := NewJWTManager(config)
	if err != nil {
		return err
	}
	defaultJWTManager = manager
	return nil
}

// GenerateAccessToken generates an access token using default configuration
func GenerateAccessToken(claims *Claims) (string, error) {
	if defaultJWTManager == nil {
		return "", errors.Internal("JWT manager not initialized")
	}
	return defaultJWTManager.GenerateToken(claims, AccessToken)
}

// GenerateRefreshToken generates a refresh token using default configuration
func GenerateRefreshToken(claims *Claims) (string, error) {
	if defaultJWTManager == nil {
		return "", errors.Internal("JWT manager not initialized")
	}
	return defaultJWTManager.GenerateToken(claims, RefreshToken)
}

// ParseJWT parses a JWT token using default configuration
func ParseJWT(tokenString string) (*Claims, error) {
	if defaultJWTManager == nil {
		return nil, errors.Internal("JWT manager not initialized")
	}
	return defaultJWTManager.ParseToken(tokenString)
}

// ValidateJWT validates a JWT token using default configuration
func ValidateJWT(tokenString string) error {
	if defaultJWTManager == nil {
		return errors.Internal("JWT manager not initialized")
	}
	return defaultJWTManager.ValidateToken(tokenString)
}

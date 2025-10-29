package crypto

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"

	"local/go-infra/pkg/errors"
)

// HashAlgorithm represents the hashing algorithm type
type HashAlgorithm string

const (
	AlgorithmBcrypt HashAlgorithm = "bcrypt"
	AlgorithmArgon2 HashAlgorithm = "argon2"
)

// HashConfig holds configuration for password hashing
type HashConfig struct {
	// Bcrypt specific
	BcryptCost int

	// Argon2 specific
	Argon2Time    uint32 // Number of iterations
	Argon2Memory  uint32 // Memory in KiB
	Argon2Threads uint8  // Number of threads
	Argon2KeyLen  uint32 // Length of the generated key
	Argon2SaltLen uint32 // Length of the salt
}

// DefaultHashConfig returns default hashing configuration
func DefaultHashConfig() *HashConfig {
	return &HashConfig{
		// Bcrypt defaults
		BcryptCost: bcrypt.DefaultCost, // 10

		// Argon2 defaults (recommended by OWASP)
		Argon2Time:    1,         // 1 iteration
		Argon2Memory:  64 * 1024, // 64 MB
		Argon2Threads: 4,         // 4 threads
		Argon2KeyLen:  32,        // 32 bytes
		Argon2SaltLen: 16,        // 16 bytes
	}
}

// Hasher provides password hashing functionality
type Hasher struct {
	config *HashConfig
}

// NewHasher creates a new password hasher
func NewHasher(config *HashConfig) *Hasher {
	if config == nil {
		config = DefaultHashConfig()
	}
	return &Hasher{config: config}
}

// HashPassword hashes a password using the specified algorithm
func (h *Hasher) HashPassword(password string, algorithm HashAlgorithm) (string, error) {
	if password == "" {
		return "", errors.BadRequest("password cannot be empty")
	}

	switch algorithm {
	case AlgorithmBcrypt:
		return h.hashBcrypt(password)
	case AlgorithmArgon2:
		return h.hashArgon2(password)
	default:
		return "", errors.BadRequest("unsupported hashing algorithm").
			WithDetails(fmt.Sprintf("algorithm: %s", algorithm))
	}
}

// ComparePassword compares a password with a hash
func (h *Hasher) ComparePassword(password, hash string) (bool, error) {
	if password == "" || hash == "" {
		return false, errors.BadRequest("password and hash cannot be empty")
	}

	// Try to detect the algorithm from the hash format
	// Bcrypt hashes start with $2a$, $2b$, or $2y$
	if len(hash) > 4 && hash[0] == '$' && hash[1] == '2' {
		return h.compareBcrypt(password, hash)
	}

	// Try Argon2 format
	return h.compareArgon2(password, hash)
}

// hashBcrypt hashes a password using bcrypt
func (h *Hasher) hashBcrypt(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), h.config.BcryptCost)
	if err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to hash password with bcrypt")
	}
	return string(hash), nil
}

// compareBcrypt compares a password with a bcrypt hash
func (h *Hasher) compareBcrypt(password, hash string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			return false, nil
		}
		return false, errors.Wrap(err, errors.CodeInternal, "failed to compare bcrypt hash")
	}
	return true, nil
}

// hashArgon2 hashes a password using Argon2id
func (h *Hasher) hashArgon2(password string) (string, error) {
	// Generate a random salt
	salt := make([]byte, h.config.Argon2SaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to generate salt")
	}

	// Generate the hash
	hash := argon2.IDKey(
		[]byte(password),
		salt,
		h.config.Argon2Time,
		h.config.Argon2Memory,
		h.config.Argon2Threads,
		h.config.Argon2KeyLen,
	)

	// Encode the hash in the PHC string format
	// $argon2id$v=19$m=65536,t=1,p=4$base64salt$base64hash
	encodedHash := fmt.Sprintf(
		"$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version,
		h.config.Argon2Memory,
		h.config.Argon2Time,
		h.config.Argon2Threads,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash),
	)

	return encodedHash, nil
}

// compareArgon2 compares a password with an Argon2 hash
func (h *Hasher) compareArgon2(password, encodedHash string) (bool, error) {
	// Parse the encoded hash manually
	// Format: $argon2id$v=19$m=65536,t=1,p=4$salt$hash
	parts := splitArgon2Hash(encodedHash)
	if len(parts) != 6 {
		return false, errors.BadRequest("invalid argon2 hash format")
	}

	// parts[0] is empty (before first $)
	// parts[1] should be "argon2id"
	if parts[1] != "argon2id" {
		return false, errors.BadRequest("unsupported argon2 variant")
	}

	// Parse version
	var version int
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil {
		return false, errors.Wrap(err, errors.CodeInternal, "failed to parse version")
	}

	// Parse parameters
	var memory, time uint32
	var threads uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &time, &threads); err != nil {
		return false, errors.Wrap(err, errors.CodeInternal, "failed to parse parameters")
	}

	// Decode salt and hash
	decodedSalt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, errors.Wrap(err, errors.CodeInternal, "failed to decode salt")
	}

	decodedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false, errors.Wrap(err, errors.CodeInternal, "failed to decode hash")
	}

	// Generate hash from the password with the same parameters
	computedHash := argon2.IDKey(
		[]byte(password),
		decodedSalt,
		time,
		memory,
		threads,
		uint32(len(decodedHash)),
	)

	// Use constant-time comparison to prevent timing attacks
	if subtle.ConstantTimeCompare(decodedHash, computedHash) == 1 {
		return true, nil
	}

	return false, nil
}

// splitArgon2Hash splits an Argon2 hash string by $ delimiter
func splitArgon2Hash(hash string) []string {
	var parts []string
	var current string

	for _, ch := range hash {
		if ch == '$' {
			parts = append(parts, current)
			current = ""
		} else {
			current += string(ch)
		}
	}
	if current != "" {
		parts = append(parts, current)
	}

	return parts
}

// Package-level convenience functions using default configuration
var defaultHasher = NewHasher(nil)

// HashPasswordBcrypt hashes a password using bcrypt with default configuration
func HashPasswordBcrypt(password string) (string, error) {
	return defaultHasher.HashPassword(password, AlgorithmBcrypt)
}

// HashPasswordArgon2 hashes a password using Argon2 with default configuration
func HashPasswordArgon2(password string) (string, error) {
	return defaultHasher.HashPassword(password, AlgorithmArgon2)
}

// ComparePassword compares a password with a hash using default configuration
func ComparePassword(password, hash string) (bool, error) {
	return defaultHasher.ComparePassword(password, hash)
}

// VerifyPassword is an alias for ComparePassword for better readability
func VerifyPassword(password, hash string) (bool, error) {
	return ComparePassword(password, hash)
}

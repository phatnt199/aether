package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"io"

	"local/go-infra/pkg/errors"
)

// EncryptionConfig holds encryption configuration
type EncryptionConfig struct {
	// Key is the encryption key (must be 16, 24, or 32 bytes for AES-128, AES-192, or AES-256)
	Key []byte
}

// Encryptor provides encryption and decryption functionality
type Encryptor struct {
	config *EncryptionConfig
}

// NewEncryptor creates a new encryptor with the given configuration
func NewEncryptor(config *EncryptionConfig) (*Encryptor, error) {
	if config == nil {
		return nil, errors.BadRequest("encryption config cannot be nil")
	}

	// Validate key length
	keyLen := len(config.Key)
	if keyLen != 16 && keyLen != 24 && keyLen != 32 {
		return nil, errors.BadRequest("encryption key must be 16, 24, or 32 bytes").
			WithDetails("use GenerateAESKey() to generate a valid key")
	}

	return &Encryptor{config: config}, nil
}

// Encrypt encrypts plaintext using AES-GCM
// Returns base64-encoded ciphertext with nonce prepended
func (e *Encryptor) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", errors.BadRequest("plaintext cannot be empty")
	}

	// Create cipher block
	block, err := aes.NewCipher(e.config.Key)
	if err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to create cipher")
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to create GCM")
	}

	// Generate nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to generate nonce")
	}

	// Encrypt
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)

	// Encode to base64
	encoded := base64.StdEncoding.EncodeToString(ciphertext)

	return encoded, nil
}

// Decrypt decrypts base64-encoded ciphertext using AES-GCM
func (e *Encryptor) Decrypt(encodedCiphertext string) (string, error) {
	if encodedCiphertext == "" {
		return "", errors.BadRequest("ciphertext cannot be empty")
	}

	// Decode from base64
	ciphertext, err := base64.StdEncoding.DecodeString(encodedCiphertext)
	if err != nil {
		return "", errors.Wrap(err, errors.CodeBadRequest, "failed to decode ciphertext")
	}

	// Create cipher block
	block, err := aes.NewCipher(e.config.Key)
	if err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to create cipher")
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to create GCM")
	}

	// Extract nonce
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.BadRequest("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	// Decrypt
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", errors.Wrap(err, errors.CodeBadRequest, "failed to decrypt: invalid ciphertext or key")
	}

	return string(plaintext), nil
}

// EncryptBytes encrypts byte data using AES-GCM
// Returns raw ciphertext with nonce prepended
func (e *Encryptor) EncryptBytes(plaintext []byte) ([]byte, error) {
	if len(plaintext) == 0 {
		return nil, errors.BadRequest("plaintext cannot be empty")
	}

	// Create cipher block
	block, err := aes.NewCipher(e.config.Key)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to create cipher")
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to create GCM")
	}

	// Generate nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to generate nonce")
	}

	// Encrypt
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)

	return ciphertext, nil
}

// DecryptBytes decrypts byte data using AES-GCM
func (e *Encryptor) DecryptBytes(ciphertext []byte) ([]byte, error) {
	if len(ciphertext) == 0 {
		return nil, errors.BadRequest("ciphertext cannot be empty")
	}

	// Create cipher block
	block, err := aes.NewCipher(e.config.Key)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to create cipher")
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to create GCM")
	}

	// Extract nonce
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, errors.BadRequest("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	// Decrypt
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeBadRequest, "failed to decrypt: invalid ciphertext or key")
	}

	return plaintext, nil
}

// Key generation utilities

// GenerateAESKey generates a random AES key of the specified size
// size should be 16 (AES-128), 24 (AES-192), or 32 (AES-256) bytes
func GenerateAESKey(size int) ([]byte, error) {
	if size != 16 && size != 24 && size != 32 {
		return nil, errors.BadRequest("key size must be 16, 24, or 32 bytes")
	}

	key := make([]byte, size)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return nil, errors.Wrap(err, errors.CodeInternal, "failed to generate key")
	}

	return key, nil
}

// GenerateAES256Key generates a random AES-256 key (32 bytes)
func GenerateAES256Key() ([]byte, error) {
	return GenerateAESKey(32)
}

// GenerateAES192Key generates a random AES-192 key (24 bytes)
func GenerateAES192Key() ([]byte, error) {
	return GenerateAESKey(24)
}

// GenerateAES128Key generates a random AES-128 key (16 bytes)
func GenerateAES128Key() ([]byte, error) {
	return GenerateAESKey(16)
}

// KeyToString converts a key to a base64 string for storage
func KeyToString(key []byte) string {
	return base64.StdEncoding.EncodeToString(key)
}

// KeyFromString converts a base64 string to a key
func KeyFromString(keyStr string) ([]byte, error) {
	key, err := base64.StdEncoding.DecodeString(keyStr)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeBadRequest, "failed to decode key")
	}
	return key, nil
}

// Package-level convenience functions using a default encryptor
var defaultEncryptor *Encryptor

// InitDefaultEncryptor initializes the default encryptor
func InitDefaultEncryptor(key []byte) error {
	encryptor, err := NewEncryptor(&EncryptionConfig{Key: key})
	if err != nil {
		return err
	}
	defaultEncryptor = encryptor
	return nil
}

// Encrypt encrypts plaintext using the default encryptor
func Encrypt(plaintext string) (string, error) {
	if defaultEncryptor == nil {
		return "", errors.Internal("encryptor not initialized")
	}
	return defaultEncryptor.Encrypt(plaintext)
}

// Decrypt decrypts ciphertext using the default encryptor
func Decrypt(ciphertext string) (string, error) {
	if defaultEncryptor == nil {
		return "", errors.Internal("encryptor not initialized")
	}
	return defaultEncryptor.Decrypt(ciphertext)
}

// EncryptBytes encrypts byte data using the default encryptor
func EncryptBytes(plaintext []byte) ([]byte, error) {
	if defaultEncryptor == nil {
		return nil, errors.Internal("encryptor not initialized")
	}
	return defaultEncryptor.EncryptBytes(plaintext)
}

// DecryptBytes decrypts byte data using the default encryptor
func DecryptBytes(ciphertext []byte) ([]byte, error) {
	if defaultEncryptor == nil {
		return nil, errors.Internal("encryptor not initialized")
	}
	return defaultEncryptor.DecryptBytes(ciphertext)
}

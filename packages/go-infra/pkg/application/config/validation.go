package config

import (
	"fmt"
	"strings"
)

// ValidationError represents a configuration validation error
type ValidationError struct {
	Field   string
	Message string
}

// Error implements the error interface
func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidationErrors is a collection of validation errors
type ValidationErrors []ValidationError

// Error implements the error interface
func (e ValidationErrors) Error() string {
	if len(e) == 0 {
		return ""
	}

	var messages []string
	for _, err := range e {
		messages = append(messages, err.Error())
	}
	return strings.Join(messages, "; ")
}

// Add adds a validation error
func (e *ValidationErrors) Add(field, message string) {
	*e = append(*e, ValidationError{
		Field:   field,
		Message: message,
	})
}

// HasErrors returns true if there are validation errors
func (e ValidationErrors) HasErrors() bool {
	return len(e) > 0
}

// Validate validates the entire configuration
func (c *Config) Validate() error {
	var errs ValidationErrors

	// Validate App config
	if err := c.App.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate Server config
	if err := c.Server.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate Database config
	if err := c.Database.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate Redis config
	if err := c.Redis.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate Queue config
	if err := c.Queue.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate Storage config
	if err := c.Storage.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate Logger config
	if err := c.Logger.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate Auth config
	if err := c.Auth.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	if errs.HasErrors() {
		return errs
	}

	return nil
}

// Validate validates app configuration
func (a *AppConfig) Validate() error {
	var errs ValidationErrors

	if a.Name == "" {
		errs.Add("app.name", "app name is required")
	}

	if a.Environment == "" {
		errs.Add("app.environment", "environment is required")
	}

	validEnvs := []string{"development", "local", "staging", "production"}
	if !contains(validEnvs, a.Environment) {
		errs.Add("app.environment", fmt.Sprintf("environment must be one of: %s", strings.Join(validEnvs, ", ")))
	}

	if a.Timeout <= 0 {
		errs.Add("app.timeout", "timeout must be greater than 0")
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates server configuration
func (s *ServerConfig) Validate() error {
	var errs ValidationErrors

	// Validate HTTP config
	if err := s.HTTP.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate gRPC config
	if err := s.GRPC.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates HTTP configuration
func (h *HTTPConfig) Validate() error {
	var errs ValidationErrors

	if h.Port <= 0 || h.Port > 65535 {
		errs.Add("server.http.port", "port must be between 1 and 65535")
	}

	if h.ReadTimeout <= 0 {
		errs.Add("server.http.read_timeout", "read timeout must be greater than 0")
	}

	if h.WriteTimeout <= 0 {
		errs.Add("server.http.write_timeout", "write timeout must be greater than 0")
	}

	// Validate TLS config if enabled
	if h.TLS.Enabled {
		if h.TLS.CertFile == "" {
			errs.Add("server.http.tls.cert_file", "cert file is required when TLS is enabled")
		}
		if h.TLS.KeyFile == "" {
			errs.Add("server.http.tls.key_file", "key file is required when TLS is enabled")
		}
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates gRPC configuration
func (g *GRPCConfig) Validate() error {
	var errs ValidationErrors

	if g.Port <= 0 || g.Port > 65535 {
		errs.Add("server.grpc.port", "port must be between 1 and 65535")
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates database configuration
func (d *DatabaseConfig) Validate() error {
	var errs ValidationErrors

	if d.Driver == "" {
		errs.Add("database.driver", "driver is required")
	}

	validDrivers := []string{"postgres", "mysql", "sqlite"}
	if !contains(validDrivers, d.Driver) {
		errs.Add("database.driver", fmt.Sprintf("driver must be one of: %s", strings.Join(validDrivers, ", ")))
	}

	// SQLite doesn't need host/port validation
	if d.Driver != "sqlite" {
		if d.Host == "" {
			errs.Add("database.host", "host is required")
		}

		if d.Port <= 0 || d.Port > 65535 {
			errs.Add("database.port", "port must be between 1 and 65535")
		}

		if d.Username == "" {
			errs.Add("database.username", "username is required")
		}
	}

	if d.Database == "" {
		errs.Add("database.database", "database name is required")
	}

	if d.MaxOpenConns <= 0 {
		errs.Add("database.max_open_conns", "max open connections must be greater than 0")
	}

	if d.MaxIdleConns < 0 {
		errs.Add("database.max_idle_conns", "max idle connections cannot be negative")
	}

	if d.MaxIdleConns > d.MaxOpenConns {
		errs.Add("database.max_idle_conns", "max idle connections cannot exceed max open connections")
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates Redis configuration
func (r *RedisConfig) Validate() error {
	var errs ValidationErrors

	if r.Host == "" {
		errs.Add("redis.host", "host is required")
	}

	if r.Port <= 0 || r.Port > 65535 {
		errs.Add("redis.port", "port must be between 1 and 65535")
	}

	if r.DB < 0 {
		errs.Add("redis.db", "db number cannot be negative")
	}

	if r.PoolSize <= 0 {
		errs.Add("redis.pool_size", "pool size must be greater than 0")
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates queue configuration
func (q *QueueConfig) Validate() error {
	var errs ValidationErrors

	if q.Driver == "" {
		errs.Add("queue.driver", "driver is required")
	}

	validDrivers := []string{"rabbitmq", "kafka", "sqs", "redis"}
	if !contains(validDrivers, q.Driver) {
		errs.Add("queue.driver", fmt.Sprintf("driver must be one of: %s", strings.Join(validDrivers, ", ")))
	}

	if q.Concurrency <= 0 {
		errs.Add("queue.concurrency", "concurrency must be greater than 0")
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates storage configuration
func (s *StorageConfig) Validate() error {
	var errs ValidationErrors

	if s.Driver == "" {
		errs.Add("storage.driver", "driver is required")
	}

	validDrivers := []string{"s3", "minio", "gcs", "local"}
	if !contains(validDrivers, s.Driver) {
		errs.Add("storage.driver", fmt.Sprintf("driver must be one of: %s", strings.Join(validDrivers, ", ")))
	}

	// Cloud storage providers require credentials
	if s.Driver == "s3" || s.Driver == "minio" || s.Driver == "gcs" {
		if s.AccessKeyID == "" {
			errs.Add("storage.access_key_id", "access key ID is required for cloud storage")
		}
		if s.SecretAccessKey == "" {
			errs.Add("storage.secret_access_key", "secret access key is required for cloud storage")
		}
		if s.Bucket == "" {
			errs.Add("storage.bucket", "bucket is required for cloud storage")
		}
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates logger configuration
func (l *LoggerConfig) Validate() error {
	var errs ValidationErrors

	if l.Level == "" {
		errs.Add("logger.level", "level is required")
	}

	validLevels := []string{"debug", "info", "warn", "error", "fatal", "panic"}
	if !contains(validLevels, l.Level) {
		errs.Add("logger.level", fmt.Sprintf("level must be one of: %s", strings.Join(validLevels, ", ")))
	}

	if l.Format == "" {
		errs.Add("logger.format", "format is required")
	}

	validFormats := []string{"json", "console"}
	if !contains(validFormats, l.Format) {
		errs.Add("logger.format", fmt.Sprintf("format must be one of: %s", strings.Join(validFormats, ", ")))
	}

	if len(l.OutputPaths) == 0 {
		errs.Add("logger.output_paths", "at least one output path is required")
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates auth configuration
func (a *AuthConfig) Validate() error {
	var errs ValidationErrors

	// Validate JWT config
	if err := a.JWT.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate Session config
	if err := a.Session.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	// Validate Password config
	if err := a.Password.Validate(); err != nil {
		if valErrs, ok := err.(ValidationErrors); ok {
			errs = append(errs, valErrs...)
		}
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates JWT configuration
func (j *JWTConfig) Validate() error {
	var errs ValidationErrors

	// JWT secret is required for HS256
	if j.Algorithm == "HS256" && j.Secret == "" {
		errs.Add("auth.jwt.secret", "JWT secret is required for HS256 algorithm")
	}

	// Private/public keys are required for RS256
	if j.Algorithm == "RS256" {
		if j.PrivateKeyPath == "" {
			errs.Add("auth.jwt.private_key_path", "private key path is required for RS256 algorithm")
		}
		if j.PublicKeyPath == "" {
			errs.Add("auth.jwt.public_key_path", "public key path is required for RS256 algorithm")
		}
	}

	if j.AccessExpiry <= 0 {
		errs.Add("auth.jwt.access_expiry", "access expiry must be greater than 0")
	}

	if j.RefreshExpiry <= 0 {
		errs.Add("auth.jwt.refresh_expiry", "refresh expiry must be greater than 0")
	}

	if j.RefreshExpiry <= j.AccessExpiry {
		errs.Add("auth.jwt.refresh_expiry", "refresh expiry must be greater than access expiry")
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates session configuration
func (s *SessionConfig) Validate() error {
	var errs ValidationErrors

	if s.CookieName == "" {
		errs.Add("auth.session.cookie_name", "cookie name is required")
	}

	if s.Secret == "" {
		errs.Add("auth.session.secret", "session secret is required")
	}

	if s.MaxAge <= 0 {
		errs.Add("auth.session.max_age", "max age must be greater than 0")
	}

	validSameSite := []string{"strict", "lax", "none"}
	if !contains(validSameSite, s.SameSite) {
		errs.Add("auth.session.same_site", fmt.Sprintf("same_site must be one of: %s", strings.Join(validSameSite, ", ")))
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Validate validates password configuration
func (p *PasswordConfig) Validate() error {
	var errs ValidationErrors

	if p.MinLength < 4 {
		errs.Add("auth.password.min_length", "minimum length must be at least 4")
	}

	if p.BcryptCost < 4 || p.BcryptCost > 31 {
		errs.Add("auth.password.bcrypt_cost", "bcrypt cost must be between 4 and 31")
	}

	if errs.HasErrors() {
		return errs
	}
	return nil
}

// Helper function to check if a slice contains a string
func contains(slice []string, str string) bool {
	for _, s := range slice {
		if s == str {
			return true
		}
	}
	return false
}

package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Config is the main configuration struct containing all application settings
type Config struct {
	App      AppConfig      `json:"app"`
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	Redis    RedisConfig    `json:"redis"`
	Queue    QueueConfig    `json:"queue"`
	Storage  StorageConfig  `json:"storage"`
	Logger   LoggerConfig   `json:"logger"`
	Auth     AuthConfig     `json:"auth"`
}

// AppConfig contains general application settings
type AppConfig struct {
	Name        string        `json:"name"`
	Version     string        `json:"version"`
	Environment string        `json:"environment"` // development, staging, production
	Debug       bool          `json:"debug"`
	Timezone    string        `json:"timezone"`
	Timeout     time.Duration `json:"timeout"`
}

// ServerConfig contains HTTP/gRPC server settings
type ServerConfig struct {
	HTTP HTTPConfig `json:"http"`
	GRPC GRPCConfig `json:"grpc"`
}

// HTTPConfig contains HTTP server settings
type HTTPConfig struct {
	Host            string        `json:"host"`
	Port            int           `json:"port"`
	ReadTimeout     time.Duration `json:"read_timeout"`
	WriteTimeout    time.Duration `json:"write_timeout"`
	IdleTimeout     time.Duration `json:"idle_timeout"`
	ShutdownTimeout time.Duration `json:"shutdown_timeout"`
	CORS            CORSConfig    `json:"cors"`
	TLS             TLSConfig     `json:"tls"`
}

// GRPCConfig contains gRPC server settings
type GRPCConfig struct {
	Host                  string        `json:"host"`
	Port                  int           `json:"port"`
	MaxConnectionIdle     time.Duration `json:"max_connection_idle"`
	MaxConnectionAge      time.Duration `json:"max_connection_age"`
	MaxConnectionAgeGrace time.Duration `json:"max_connection_age_grace"`
	KeepAliveTime         time.Duration `json:"keepalive_time"`
	KeepAliveTimeout      time.Duration `json:"keepalive_timeout"`
}

// CORSConfig contains CORS settings
type CORSConfig struct {
	Enabled          bool     `json:"enabled"`
	AllowedOrigins   []string `json:"allowed_origins"`
	AllowedMethods   []string `json:"allowed_methods"`
	AllowedHeaders   []string `json:"allowed_headers"`
	ExposedHeaders   []string `json:"exposed_headers"`
	AllowCredentials bool     `json:"allow_credentials"`
	MaxAge           int      `json:"max_age"`
}

// TLSConfig contains TLS/SSL settings
type TLSConfig struct {
	Enabled  bool   `json:"enabled"`
	CertFile string `json:"cert_file"`
	KeyFile  string `json:"key_file"`
}

// DatabaseConfig contains database connection settings
type DatabaseConfig struct {
	Driver          string        `json:"driver"` // postgres, mysql, sqlite
	Host            string        `json:"host"`
	Port            int           `json:"port"`
	Username        string        `json:"username"`
	Password        string        `json:"-"` // Never log passwords
	Database        string        `json:"database"`
	SSLMode         string        `json:"ssl_mode"`
	MaxOpenConns    int           `json:"max_open_conns"`
	MaxIdleConns    int           `json:"max_idle_conns"`
	ConnMaxLifetime time.Duration `json:"conn_max_lifetime"`
	ConnMaxIdleTime time.Duration `json:"conn_max_idle_time"`
	MigrationPath   string        `json:"migration_path"`
}

// RedisConfig contains Redis connection settings
type RedisConfig struct {
	Host         string        `json:"host"`
	Port         int           `json:"port"`
	Password     string        `json:"-"` // Never log passwords
	DB           int           `json:"db"`
	MaxRetries   int           `json:"max_retries"`
	DialTimeout  time.Duration `json:"dial_timeout"`
	ReadTimeout  time.Duration `json:"read_timeout"`
	WriteTimeout time.Duration `json:"write_timeout"`
	PoolSize     int           `json:"pool_size"`
	MinIdleConns int           `json:"min_idle_conns"`
	TLS          bool          `json:"tls"`
}

// QueueConfig contains message queue settings
type QueueConfig struct {
	Driver      string `json:"driver"` // rabbitmq, kafka, sqs, redis
	URL         string `json:"url"`
	MaxRetries  int    `json:"max_retries"`
	Concurrency int    `json:"concurrency"`
	Prefetch    int    `json:"prefetch"`
}

// StorageConfig contains object storage settings (S3, MinIO, etc.)
type StorageConfig struct {
	Driver          string `json:"driver"` // s3, minio, gcs, local
	Endpoint        string `json:"endpoint"`
	Region          string `json:"region"`
	Bucket          string `json:"bucket"`
	AccessKeyID     string `json:"access_key_id"`
	SecretAccessKey string `json:"-"` // Never log secrets
	UseSSL          bool   `json:"use_ssl"`
	BasePath        string `json:"base_path"`
}

// LoggerConfig contains logging settings
type LoggerConfig struct {
	Level            string   `json:"level"`  // debug, info, warn, error
	Format           string   `json:"format"` // json, console
	OutputPaths      []string `json:"output_paths"`
	ErrorOutputPaths []string `json:"error_output_paths"`
	EnableCaller     bool     `json:"enable_caller"`
	EnableStacktrace bool     `json:"enable_stacktrace"`
}

// AuthConfig contains authentication and authorization settings
type AuthConfig struct {
	JWT      JWTConfig      `json:"jwt"`
	OAuth    OAuthConfig    `json:"oauth"`
	Session  SessionConfig  `json:"session"`
	Password PasswordConfig `json:"password"`
}

// JWTConfig contains JWT token settings
type JWTConfig struct {
	Secret         string        `json:"-"` // Never log secrets
	Issuer         string        `json:"issuer"`
	Audience       string        `json:"audience"`
	AccessExpiry   time.Duration `json:"access_expiry"`
	RefreshExpiry  time.Duration `json:"refresh_expiry"`
	Algorithm      string        `json:"algorithm"` // HS256, RS256
	PrivateKeyPath string        `json:"private_key_path"`
	PublicKeyPath  string        `json:"public_key_path"`
}

// OAuthConfig contains OAuth settings
type OAuthConfig struct {
	Google   OAuthProvider `json:"google"`
	GitHub   OAuthProvider `json:"github"`
	Facebook OAuthProvider `json:"facebook"`
}

// OAuthProvider contains OAuth provider settings
type OAuthProvider struct {
	Enabled      bool     `json:"enabled"`
	ClientID     string   `json:"client_id"`
	ClientSecret string   `json:"-"` // Never log secrets
	RedirectURL  string   `json:"redirect_url"`
	Scopes       []string `json:"scopes"`
}

// SessionConfig contains session settings
type SessionConfig struct {
	CookieName string        `json:"cookie_name"`
	Secret     string        `json:"-"` // Never log secrets
	MaxAge     time.Duration `json:"max_age"`
	Secure     bool          `json:"secure"`
	HTTPOnly   bool          `json:"http_only"`
	SameSite   string        `json:"same_site"` // strict, lax, none
}

// PasswordConfig contains password hashing settings
type PasswordConfig struct {
	MinLength      int  `json:"min_length"`
	RequireUpper   bool `json:"require_upper"`
	RequireLower   bool `json:"require_lower"`
	RequireNumber  bool `json:"require_number"`
	RequireSpecial bool `json:"require_special"`
	BcryptCost     int  `json:"bcrypt_cost"`
}

var (
	globalConfig *Config
	configOnce   sync.Once
	configMu     sync.RWMutex
)

// Load loads configuration from environment variables
func Load() (*Config, error) {
	config := &Config{
		App:      loadAppConfig(),
		Server:   loadServerConfig(),
		Database: loadDatabaseConfig(),
		Redis:    loadRedisConfig(),
		Queue:    loadQueueConfig(),
		Storage:  loadStorageConfig(),
		Logger:   loadLoggerConfig(),
		Auth:     loadAuthConfig(),
	}

	// Validate configuration
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return config, nil
}

// LoadOnce loads configuration once and caches it
func LoadOnce() (*Config, error) {
	var err error
	configOnce.Do(func() {
		globalConfig, err = Load()
	})
	return globalConfig, err
}

// Get returns the global configuration
func Get() *Config {
	configMu.RLock()
	defer configMu.RUnlock()
	return globalConfig
}

// Set sets the global configuration (useful for testing)
func Set(config *Config) {
	configMu.Lock()
	defer configMu.Unlock()
	globalConfig = config
}

// loadAppConfig loads application configuration from environment
func loadAppConfig() AppConfig {
	return AppConfig{
		Name:        getEnv("APP_NAME", "go-app"),
		Version:     getEnv("APP_VERSION", "1.0.0"),
		Environment: getEnv("APP_ENV", "development"),
		Debug:       getEnvAsBool("APP_DEBUG", false),
		Timezone:    getEnv("APP_TIMEZONE", "UTC"),
		Timeout:     getEnvAsDuration("APP_TIMEOUT", 30*time.Second),
	}
}

// loadServerConfig loads server configuration from environment
func loadServerConfig() ServerConfig {
	return ServerConfig{
		HTTP: HTTPConfig{
			Host:            getEnv("HTTP_HOST", "0.0.0.0"),
			Port:            getEnvAsInt("HTTP_PORT", 8080),
			ReadTimeout:     getEnvAsDuration("HTTP_READ_TIMEOUT", 10*time.Second),
			WriteTimeout:    getEnvAsDuration("HTTP_WRITE_TIMEOUT", 10*time.Second),
			IdleTimeout:     getEnvAsDuration("HTTP_IDLE_TIMEOUT", 120*time.Second),
			ShutdownTimeout: getEnvAsDuration("HTTP_SHUTDOWN_TIMEOUT", 15*time.Second),
			CORS: CORSConfig{
				Enabled:          getEnvAsBool("CORS_ENABLED", true),
				AllowedOrigins:   getEnvAsSlice("CORS_ALLOWED_ORIGINS", []string{"*"}),
				AllowedMethods:   getEnvAsSlice("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
				AllowedHeaders:   getEnvAsSlice("CORS_ALLOWED_HEADERS", []string{"*"}),
				ExposedHeaders:   getEnvAsSlice("CORS_EXPOSED_HEADERS", []string{}),
				AllowCredentials: getEnvAsBool("CORS_ALLOW_CREDENTIALS", true),
				MaxAge:           getEnvAsInt("CORS_MAX_AGE", 86400),
			},
			TLS: TLSConfig{
				Enabled:  getEnvAsBool("TLS_ENABLED", false),
				CertFile: getEnv("TLS_CERT_FILE", ""),
				KeyFile:  getEnv("TLS_KEY_FILE", ""),
			},
		},
		GRPC: GRPCConfig{
			Host:                  getEnv("GRPC_HOST", "0.0.0.0"),
			Port:                  getEnvAsInt("GRPC_PORT", 9090),
			MaxConnectionIdle:     getEnvAsDuration("GRPC_MAX_CONNECTION_IDLE", 5*time.Minute),
			MaxConnectionAge:      getEnvAsDuration("GRPC_MAX_CONNECTION_AGE", 30*time.Minute),
			MaxConnectionAgeGrace: getEnvAsDuration("GRPC_MAX_CONNECTION_AGE_GRACE", 5*time.Minute),
			KeepAliveTime:         getEnvAsDuration("GRPC_KEEPALIVE_TIME", 2*time.Hour),
			KeepAliveTimeout:      getEnvAsDuration("GRPC_KEEPALIVE_TIMEOUT", 20*time.Second),
		},
	}
}

// loadDatabaseConfig loads database configuration from environment
func loadDatabaseConfig() DatabaseConfig {
	return DatabaseConfig{
		Driver:          getEnv("DB_DRIVER", "postgres"),
		Host:            getEnv("DB_HOST", "localhost"),
		Port:            getEnvAsInt("DB_PORT", 5432),
		Username:        getEnv("DB_USERNAME", "postgres"),
		Password:        getEnv("DB_PASSWORD", ""),
		Database:        getEnv("DB_DATABASE", "myapp"),
		SSLMode:         getEnv("DB_SSL_MODE", "disable"),
		MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
		MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 5),
		ConnMaxLifetime: getEnvAsDuration("DB_CONN_MAX_LIFETIME", 5*time.Minute),
		ConnMaxIdleTime: getEnvAsDuration("DB_CONN_MAX_IDLE_TIME", 10*time.Minute),
		MigrationPath:   getEnv("DB_MIGRATION_PATH", "migrations"),
	}
}

// loadRedisConfig loads Redis configuration from environment
func loadRedisConfig() RedisConfig {
	return RedisConfig{
		Host:         getEnv("REDIS_HOST", "localhost"),
		Port:         getEnvAsInt("REDIS_PORT", 6379),
		Password:     getEnv("REDIS_PASSWORD", ""),
		DB:           getEnvAsInt("REDIS_DB", 0),
		MaxRetries:   getEnvAsInt("REDIS_MAX_RETRIES", 3),
		DialTimeout:  getEnvAsDuration("REDIS_DIAL_TIMEOUT", 5*time.Second),
		ReadTimeout:  getEnvAsDuration("REDIS_READ_TIMEOUT", 3*time.Second),
		WriteTimeout: getEnvAsDuration("REDIS_WRITE_TIMEOUT", 3*time.Second),
		PoolSize:     getEnvAsInt("REDIS_POOL_SIZE", 10),
		MinIdleConns: getEnvAsInt("REDIS_MIN_IDLE_CONNS", 2),
		TLS:          getEnvAsBool("REDIS_TLS", false),
	}
}

// loadQueueConfig loads queue configuration from environment
func loadQueueConfig() QueueConfig {
	return QueueConfig{
		Driver:      getEnv("QUEUE_DRIVER", "redis"),
		URL:         getEnv("QUEUE_URL", ""),
		MaxRetries:  getEnvAsInt("QUEUE_MAX_RETRIES", 3),
		Concurrency: getEnvAsInt("QUEUE_CONCURRENCY", 10),
		Prefetch:    getEnvAsInt("QUEUE_PREFETCH", 10),
	}
}

// loadStorageConfig loads storage configuration from environment
func loadStorageConfig() StorageConfig {
	return StorageConfig{
		Driver:          getEnv("STORAGE_DRIVER", "local"),
		Endpoint:        getEnv("STORAGE_ENDPOINT", ""),
		Region:          getEnv("STORAGE_REGION", "us-east-1"),
		Bucket:          getEnv("STORAGE_BUCKET", ""),
		AccessKeyID:     getEnv("STORAGE_ACCESS_KEY_ID", ""),
		SecretAccessKey: getEnv("STORAGE_SECRET_ACCESS_KEY", ""),
		UseSSL:          getEnvAsBool("STORAGE_USE_SSL", true),
		BasePath:        getEnv("STORAGE_BASE_PATH", "uploads"),
	}
}

// loadLoggerConfig loads logger configuration from environment
func loadLoggerConfig() LoggerConfig {
	env := getEnv("APP_ENV", "development")
	isDev := env == "development" || env == "local"

	level := getEnv("LOG_LEVEL", "info")
	if isDev {
		level = getEnv("LOG_LEVEL", "debug")
	}

	format := getEnv("LOG_FORMAT", "json")
	if isDev {
		format = getEnv("LOG_FORMAT", "console")
	}

	return LoggerConfig{
		Level:            level,
		Format:           format,
		OutputPaths:      getEnvAsSlice("LOG_OUTPUT_PATHS", []string{"stdout"}),
		ErrorOutputPaths: getEnvAsSlice("LOG_ERROR_OUTPUT_PATHS", []string{"stderr"}),
		EnableCaller:     getEnvAsBool("LOG_ENABLE_CALLER", true),
		EnableStacktrace: getEnvAsBool("LOG_ENABLE_STACKTRACE", true),
	}
}

// loadAuthConfig loads authentication configuration from environment
func loadAuthConfig() AuthConfig {
	return AuthConfig{
		JWT: JWTConfig{
			Secret:         getEnv("JWT_SECRET", ""),
			Issuer:         getEnv("JWT_ISSUER", "go-infra"),
			Audience:       getEnv("JWT_AUDIENCE", "go-infra-api"),
			AccessExpiry:   getEnvAsDuration("JWT_ACCESS_EXPIRY", 15*time.Minute),
			RefreshExpiry:  getEnvAsDuration("JWT_REFRESH_EXPIRY", 7*24*time.Hour),
			Algorithm:      getEnv("JWT_ALGORITHM", "HS256"),
			PrivateKeyPath: getEnv("JWT_PRIVATE_KEY_PATH", ""),
			PublicKeyPath:  getEnv("JWT_PUBLIC_KEY_PATH", ""),
		},
		OAuth: OAuthConfig{
			Google: OAuthProvider{
				Enabled:      getEnvAsBool("OAUTH_GOOGLE_ENABLED", false),
				ClientID:     getEnv("OAUTH_GOOGLE_CLIENT_ID", ""),
				ClientSecret: getEnv("OAUTH_GOOGLE_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("OAUTH_GOOGLE_REDIRECT_URL", ""),
				Scopes:       getEnvAsSlice("OAUTH_GOOGLE_SCOPES", []string{"email", "profile"}),
			},
			GitHub: OAuthProvider{
				Enabled:      getEnvAsBool("OAUTH_GITHUB_ENABLED", false),
				ClientID:     getEnv("OAUTH_GITHUB_CLIENT_ID", ""),
				ClientSecret: getEnv("OAUTH_GITHUB_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("OAUTH_GITHUB_REDIRECT_URL", ""),
				Scopes:       getEnvAsSlice("OAUTH_GITHUB_SCOPES", []string{"user:email"}),
			},
			Facebook: OAuthProvider{
				Enabled:      getEnvAsBool("OAUTH_FACEBOOK_ENABLED", false),
				ClientID:     getEnv("OAUTH_FACEBOOK_CLIENT_ID", ""),
				ClientSecret: getEnv("OAUTH_FACEBOOK_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("OAUTH_FACEBOOK_REDIRECT_URL", ""),
				Scopes:       getEnvAsSlice("OAUTH_FACEBOOK_SCOPES", []string{"email"}),
			},
		},
		Session: SessionConfig{
			CookieName: getEnv("SESSION_COOKIE_NAME", "session"),
			Secret:     getEnv("SESSION_SECRET", ""),
			MaxAge:     getEnvAsDuration("SESSION_MAX_AGE", 24*time.Hour),
			Secure:     getEnvAsBool("SESSION_SECURE", false),
			HTTPOnly:   getEnvAsBool("SESSION_HTTP_ONLY", true),
			SameSite:   getEnv("SESSION_SAME_SITE", "lax"),
		},
		Password: PasswordConfig{
			MinLength:      getEnvAsInt("PASSWORD_MIN_LENGTH", 8),
			RequireUpper:   getEnvAsBool("PASSWORD_REQUIRE_UPPER", true),
			RequireLower:   getEnvAsBool("PASSWORD_REQUIRE_LOWER", true),
			RequireNumber:  getEnvAsBool("PASSWORD_REQUIRE_NUMBER", true),
			RequireSpecial: getEnvAsBool("PASSWORD_REQUIRE_SPECIAL", true),
			BcryptCost:     getEnvAsInt("PASSWORD_BCRYPT_COST", 12),
		},
	}
}

// Helper functions for environment variable parsing

// getEnv gets an environment variable or returns a default value
func getEnv(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvAsInt gets an environment variable as an integer
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

// getEnvAsBool gets an environment variable as a boolean
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

// getEnvAsDuration gets an environment variable as a duration
func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	value, err := time.ParseDuration(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

// getEnvAsSlice gets an environment variable as a slice (comma-separated)
func getEnvAsSlice(key string, defaultValue []string) []string {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	return strings.Split(valueStr, ",")
}

// Address returns the HTTP server address (host:port)
func (h HTTPConfig) Address() string {
	return fmt.Sprintf("%s:%d", h.Host, h.Port)
}

// Address returns the gRPC server address (host:port)
func (g GRPCConfig) Address() string {
	return fmt.Sprintf("%s:%d", g.Host, g.Port)
}

// DSN returns the database connection string
func (d DatabaseConfig) DSN() string {
	switch d.Driver {
	case "postgres":
		return fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			d.Host, d.Port, d.Username, d.Password, d.Database, d.SSLMode,
		)
	case "mysql":
		return fmt.Sprintf(
			"%s:%s@tcp(%s:%d)/%s?parseTime=true",
			d.Username, d.Password, d.Host, d.Port, d.Database,
		)
	case "sqlite":
		return d.Database
	default:
		return ""
	}
}

// Address returns the Redis address (host:port)
func (r RedisConfig) Address() string {
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

// IsDevelopment returns true if the environment is development
func (a AppConfig) IsDevelopment() bool {
	return a.Environment == "development" || a.Environment == "local"
}

// IsProduction returns true if the environment is production
func (a AppConfig) IsProduction() bool {
	return a.Environment == "production"
}

// IsStaging returns true if the environment is staging
func (a AppConfig) IsStaging() bool {
	return a.Environment == "staging"
}

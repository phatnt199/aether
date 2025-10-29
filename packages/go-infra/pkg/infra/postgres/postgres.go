package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"local/go-infra/pkg/errors"
	"local/go-infra/pkg/logger"
	defaultLogger "local/go-infra/pkg/logger/default_logger"
)

// Client represents a PostgreSQL database client
type Client struct {
	db     *gorm.DB
	logger logger.Logger
}

// Config holds PostgreSQL client configuration
type Config struct {
	DSN             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
	LogLevel        gormlogger.LogLevel
	SlowThreshold   time.Duration
}

// DatabaseConfig represents database configuration (simplified version matching the existing config structure)
type DatabaseConfig struct {
	Driver          string        `mapstructure:"driver" json:"driver"`
	Host            string        `mapstructure:"host" json:"host"`
	Port            int           `mapstructure:"port" json:"port"`
	User            string        `mapstructure:"user" json:"user"`
	Password        string        `mapstructure:"password" json:"password"`
	DBName          string        `mapstructure:"dbName" json:"dbName"`
	SSLMode         string        `mapstructure:"sslMode" json:"sslMode"`
	MaxOpenConns    int           `mapstructure:"maxOpenConns" json:"maxOpenConns"`
	MaxIdleConns    int           `mapstructure:"maxIdleConns" json:"maxIdleConns"`
	ConnMaxLifetime time.Duration `mapstructure:"connMaxLifetime" json:"connMaxLifetime"`
	ConnMaxIdleTime time.Duration `mapstructure:"connMaxIdleTime" json:"connMaxIdleTime"`
}

// DSN returns the PostgreSQL DSN connection string
func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode)
}

// New creates a new PostgreSQL client with the given configuration
func New(cfg *Config, log logger.Logger) (*Client, error) {
	if cfg == nil {
		return nil, errors.BadRequest("postgres configuration is required")
	}

	if cfg.DSN == "" {
		return nil, errors.BadRequest("postgres DSN is required")
	}

	if log == nil {
		log = defaultLogger.GetLogger()
	}

	// Create custom GORM logger that uses our logger
	gormLog := newGormLogger(log, cfg.LogLevel, cfg.SlowThreshold)

	// Configure GORM
	gormConfig := &gorm.Config{
		Logger:                 gormLog,
		SkipDefaultTransaction: true, // Disable default transaction for better performance
		PrepareStmt:            true, // Prepare statements for better performance
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	// Open database connection
	db, err := gorm.Open(postgres.Open(cfg.DSN), gormConfig)
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeDatabaseError, "failed to connect to postgres")
	}

	// Get underlying sql.DB to configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeDatabaseError, "failed to get database instance")
	}

	// Set connection pool settings
	if cfg.MaxOpenConns > 0 {
		sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	}
	if cfg.MaxIdleConns > 0 {
		sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	}
	if cfg.ConnMaxLifetime > 0 {
		sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	}
	if cfg.ConnMaxIdleTime > 0 {
		sqlDB.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)
	}

	client := &Client{
		db:     db,
		logger: log,
	}

	log.Infow("postgres client initialized successfully", logger.Fields{
		"max_open_conns": cfg.MaxOpenConns,
		"max_idle_conns": cfg.MaxIdleConns,
	})

	return client, nil
}

// NewFromAppConfig creates a new PostgreSQL client from application config
func NewFromAppConfig(cfg *DatabaseConfig, log logger.Logger) (*Client, error) {
	if cfg == nil {
		return nil, errors.BadRequest("database configuration is required")
	}

	if cfg.Driver != "postgres" && cfg.Driver != "postgresql" {
		return nil, errors.BadRequest(fmt.Sprintf("invalid driver: %s, expected postgres", cfg.Driver))
	}

	// Default to silent; enable Info logging for postgres when a logger is provided.
	logLevel := gormlogger.Silent
	if log != nil {
		if cfg.Driver == "postgres" || cfg.Driver == "postgresql" {
			logLevel = gormlogger.Info
		}
	}

	pgConfig := &Config{
		DSN:             cfg.DSN(),
		MaxOpenConns:    cfg.MaxOpenConns,
		MaxIdleConns:    cfg.MaxIdleConns,
		ConnMaxLifetime: cfg.ConnMaxLifetime,
		ConnMaxIdleTime: cfg.ConnMaxIdleTime,
		LogLevel:        logLevel,
		SlowThreshold:   200 * time.Millisecond,
	}

	client, err := New(pgConfig, log)
	if err != nil {
		return nil, err
	}

	return client, nil
}

// DB returns the underlying GORM database instance
func (c *Client) DB() *gorm.DB {
	return c.db
}

// WithContext returns a new GORM DB instance with the given context
func (c *Client) WithContext(ctx context.Context) *gorm.DB {
	return c.db.WithContext(ctx)
}

// Health checks the database connection health
func (c *Client) Health(ctx context.Context) error {
	sqlDB, err := c.db.DB()
	if err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to get database instance")
	}

	// Ping with context to check connection
	if err := sqlDB.PingContext(ctx); err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "database ping failed")
	}

	return nil
}

// Stats returns database statistics
func (c *Client) Stats() (*Stats, error) {
	sqlDB, err := c.db.DB()
	if err != nil {
		return nil, errors.Wrap(err, errors.CodeDatabaseError, "failed to get database instance")
	}

	stats := sqlDB.Stats()
	return &Stats{
		MaxOpenConnections: stats.MaxOpenConnections,
		OpenConnections:    stats.OpenConnections,
		InUse:              stats.InUse,
		Idle:               stats.Idle,
		WaitCount:          stats.WaitCount,
		WaitDuration:       stats.WaitDuration,
		MaxIdleClosed:      stats.MaxIdleClosed,
		MaxLifetimeClosed:  stats.MaxLifetimeClosed,
	}, nil
}

// Stats represents database connection pool statistics
type Stats struct {
	MaxOpenConnections int           // Maximum number of open connections to the database.
	OpenConnections    int           // The number of established connections both in use and idle.
	InUse              int           // The number of connections currently in use.
	Idle               int           // The number of idle connections.
	WaitCount          int64         // The total number of connections waited for.
	WaitDuration       time.Duration // The total time blocked waiting for a new connection.
	MaxIdleClosed      int64         // The total number of connections closed due to SetMaxIdleConns.
	MaxLifetimeClosed  int64         // The total number of connections closed due to SetConnMaxLifetime.
}

// Close closes the database connection
func (c *Client) Close() error {
	sqlDB, err := c.db.DB()
	if err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to get database instance")
	}

	if err := sqlDB.Close(); err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to close database connection")
	}

	c.logger.Info("postgres client closed successfully")
	return nil
}

// Transaction executes a function within a database transaction
func (c *Client) Transaction(ctx context.Context, fn func(tx *gorm.DB) error) error {
	return c.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := fn(tx); err != nil {
			// Check if it's already an AppError
			if _, ok := errors.As(err); ok {
				return err
			}
			return errors.Wrap(err, errors.CodeDatabaseError, "transaction failed")
		}
		return nil
	})
}

// TransactionWithOptions executes a function within a database transaction with custom options
func (c *Client) TransactionWithOptions(ctx context.Context, opts *TxOptions, fn func(tx *gorm.DB) error) error {
	txOpts := &TxOptions{}
	if opts != nil {
		txOpts.ReadOnly = opts.ReadOnly
	}

	// Pass SQL transaction options to GORM's Transaction helper so ReadOnly is enforced when supported.
	sqlOpts := &sql.TxOptions{ReadOnly: txOpts.ReadOnly}
	return c.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := fn(tx); err != nil {
			// Check if it's already an AppError
			if _, ok := errors.As(err); ok {
				return err
			}
			return errors.Wrap(err, errors.CodeDatabaseError, "transaction failed")
		}
		return nil
	}, sqlOpts)
}

// TxOptions represents transaction options
type TxOptions struct {
	ReadOnly bool
}

// AutoMigrate runs auto migration for the given models
func (c *Client) AutoMigrate(models ...interface{}) error {
	if err := c.db.AutoMigrate(models...); err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "auto migration failed")
	}

	c.logger.Infow("auto migration completed successfully", logger.Fields{
		"models_count": len(models),
	})

	return nil
}

// Exec executes raw SQL
func (c *Client) Exec(ctx context.Context, sql string, values ...interface{}) error {
	if err := c.db.WithContext(ctx).Exec(sql, values...).Error; err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to execute query")
	}
	return nil
}

// Raw executes raw SQL query and scans results
func (c *Client) Raw(ctx context.Context, dest interface{}, sql string, values ...interface{}) error {
	if err := c.db.WithContext(ctx).Raw(sql, values...).Scan(dest).Error; err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to execute raw query")
	}
	return nil
}

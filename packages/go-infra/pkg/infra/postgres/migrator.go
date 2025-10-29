package postgres

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"

	"local/go-infra/pkg/errors"
	"local/go-infra/pkg/logger"
	defaultLogger "local/go-infra/pkg/logger/default_logger"
)

// Migrator handles database migrations
type Migrator struct {
	db            *gorm.DB
	logger        logger.Logger
	tableName     string
	migrationsDir string
}

// MigrationRecord represents a migration record in the database
type MigrationRecord struct {
	ID        uint      `gorm:"primaryKey"`
	Version   string    `gorm:"uniqueIndex;not null"`
	Name      string    `gorm:"not null"`
	AppliedAt time.Time `gorm:"not null"`
	CreatedAt time.Time
}

// TableName specifies the table name for MigrationRecord
func (MigrationRecord) TableName() string {
	return "schema_migrations"
}

// Migration represents a database migration
type Migration struct {
	Version string
	Name    string
	Up      func(tx *gorm.DB) error
	Down    func(tx *gorm.DB) error
}

// NewMigrator creates a new migrator instance
func NewMigrator(db *gorm.DB, log logger.Logger) *Migrator {
	if log == nil {
		log = defaultLogger.GetLogger()
	}

	return &Migrator{
		db:        db,
		logger:    log,
		tableName: "schema_migrations",
	}
}

// NewMigratorWithPath creates a new migrator with a migrations directory
func NewMigratorWithPath(db *gorm.DB, migrationsDir string, log logger.Logger) *Migrator {
	m := NewMigrator(db, log)
	m.migrationsDir = migrationsDir
	return m
}

// Init initializes the migrations table
func (m *Migrator) Init(ctx context.Context) error {
	if err := m.db.WithContext(ctx).AutoMigrate(&MigrationRecord{}); err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to initialize migrations table")
	}

	m.logger.Info("migrations table initialized successfully")
	return nil
}

// Up runs all pending migrations
func (m *Migrator) Up(ctx context.Context, migrations []Migration) error {
	if err := m.Init(ctx); err != nil {
		return err
	}

	// Get applied migrations
	applied, err := m.getAppliedMigrations(ctx)
	if err != nil {
		return err
	}

	// Sort migrations by version
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	// Run pending migrations
	pending := m.getPendingMigrations(migrations, applied)
	if len(pending) == 0 {
		m.logger.Info("no pending migrations to apply")
		return nil
	}

	m.logger.Infow("applying migrations", logger.Fields{
		"count": len(pending),
	})

	for _, migration := range pending {
		if err := m.applyMigration(ctx, migration); err != nil {
			return err
		}
	}

	m.logger.Info("all migrations applied successfully")
	return nil
}

// Down rolls back the last migration
func (m *Migrator) Down(ctx context.Context, migrations []Migration) error {
	// Get applied migrations
	applied, err := m.getAppliedMigrations(ctx)
	if err != nil {
		return err
	}

	if len(applied) == 0 {
		m.logger.Info("no migrations to rollback")
		return nil
	}

	// Get the last applied migration
	lastApplied := applied[len(applied)-1]

	// Find the migration
	var migration *Migration
	for i, mig := range migrations {
		if mig.Version == lastApplied.Version {
			migration = &migrations[i]
			break
		}
	}

	if migration == nil {
		return errors.NotFound(fmt.Sprintf("migration %s", lastApplied.Version))
	}

	if migration.Down == nil {
		return errors.BadRequest(fmt.Sprintf("migration %s has no down function", migration.Version))
	}

	m.logger.Infow("rolling back migration", logger.Fields{
		"version": migration.Version,
		"name":    migration.Name,
	})

	// Run migration in transaction
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := migration.Down(tx); err != nil {
			return errors.Wrap(err, errors.CodeDatabaseError,
				fmt.Sprintf("failed to rollback migration %s", migration.Version))
		}

		// Remove migration record
		if err := tx.Where("version = ?", migration.Version).Delete(&MigrationRecord{}).Error; err != nil {
			return errors.Wrap(err, errors.CodeDatabaseError, "failed to remove migration record")
		}

		m.logger.Infow("migration rolled back successfully", logger.Fields{
			"version": migration.Version,
		})

		return nil
	})
}

// Status returns the current migration status
func (m *Migrator) Status(ctx context.Context, migrations []Migration) (*MigrationStatus, error) {
	if err := m.Init(ctx); err != nil {
		return nil, err
	}

	applied, err := m.getAppliedMigrations(ctx)
	if err != nil {
		return nil, err
	}

	pending := m.getPendingMigrations(migrations, applied)

	return &MigrationStatus{
		Total:      len(migrations),
		Applied:    len(applied),
		Pending:    len(pending),
		Last:       m.getLastApplied(applied),
		Migrations: m.buildMigrationInfoList(migrations, applied),
	}, nil
}

// MigrationStatus represents the current migration status
type MigrationStatus struct {
	Total      int              // Total number of migrations
	Applied    int              // Number of applied migrations
	Pending    int              // Number of pending migrations
	Last       *MigrationRecord // Last applied migration
	Migrations []MigrationInfo  // List of all migrations with their status
}

// MigrationInfo represents information about a migration
type MigrationInfo struct {
	Version   string
	Name      string
	Applied   bool
	AppliedAt *time.Time
}

// AutoMigrate runs GORM auto-migration for the given models
func (m *Migrator) AutoMigrate(models ...interface{}) error {
	if len(models) == 0 {
		return nil
	}

	m.logger.Infow("running auto-migration", logger.Fields{
		"models": len(models),
	})

	if err := m.db.AutoMigrate(models...); err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "auto-migration failed")
	}

	m.logger.Info("auto-migration completed successfully")
	return nil
}

// CreateMigrationFile creates a new migration file
func (m *Migrator) CreateMigrationFile(name string) (string, error) {
	if m.migrationsDir == "" {
		return "", errors.BadRequest("migrations directory not configured")
	}

	// Create migrations directory if it doesn't exist
	if err := os.MkdirAll(m.migrationsDir, 0755); err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to create migrations directory")
	}

	// Generate version (timestamp)
	version := time.Now().Format("20060102150405")

	// Clean name
	cleanName := strings.ToLower(name)
	cleanName = strings.ReplaceAll(cleanName, " ", "_")

	// Create filename
	filename := fmt.Sprintf("%s_%s.go", version, cleanName)
	filepath := filepath.Join(m.migrationsDir, filename)

	// Create file content
	content := fmt.Sprintf(`package migrations

import (
	"gorm.io/gorm"
)

func init() {
	Register(Migration{
		Version: "%s",
		Name:    "%s",
		Up: func(tx *gorm.DB) error {
			// TODO: Implement migration
			return nil
		},
		Down: func(tx *gorm.DB) error {
			// TODO: Implement rollback
			return nil
		},
	})
}
`, version, name)

	// Write file
	if err := os.WriteFile(filepath, []byte(content), 0644); err != nil {
		return "", errors.Wrap(err, errors.CodeInternal, "failed to write migration file")
	}

	m.logger.Infow("migration file created", logger.Fields{
		"file": filepath,
	})

	return filepath, nil
}

// applyMigration applies a single migration
func (m *Migrator) applyMigration(ctx context.Context, migration Migration) error {
	m.logger.Infow("applying migration", logger.Fields{
		"version": migration.Version,
		"name":    migration.Name,
	})

	// Run migration in transaction
	return m.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := migration.Up(tx); err != nil {
			return errors.Wrap(err, errors.CodeDatabaseError,
				fmt.Sprintf("failed to apply migration %s", migration.Version))
		}

		// Record migration
		record := &MigrationRecord{
			Version:   migration.Version,
			Name:      migration.Name,
			AppliedAt: time.Now().UTC(),
		}

		if err := tx.Create(record).Error; err != nil {
			return errors.Wrap(err, errors.CodeDatabaseError, "failed to record migration")
		}

		m.logger.Infow("migration applied successfully", logger.Fields{
			"version": migration.Version,
		})

		return nil
	})
}

// getAppliedMigrations returns all applied migrations
func (m *Migrator) getAppliedMigrations(ctx context.Context) ([]MigrationRecord, error) {
	var records []MigrationRecord
	if err := m.db.WithContext(ctx).Order("version ASC").Find(&records).Error; err != nil {
		return nil, errors.Wrap(err, errors.CodeDatabaseError, "failed to get applied migrations")
	}
	return records, nil
}

// getPendingMigrations returns migrations that haven't been applied yet
func (m *Migrator) getPendingMigrations(migrations []Migration, applied []MigrationRecord) []Migration {
	appliedMap := make(map[string]bool)
	for _, record := range applied {
		appliedMap[record.Version] = true
	}

	var pending []Migration
	for _, migration := range migrations {
		if !appliedMap[migration.Version] {
			pending = append(pending, migration)
		}
	}

	return pending
}

// getLastApplied returns the last applied migration
func (m *Migrator) getLastApplied(applied []MigrationRecord) *MigrationRecord {
	if len(applied) == 0 {
		return nil
	}
	return &applied[len(applied)-1]
}

// buildMigrationInfoList builds a list of migration info
func (m *Migrator) buildMigrationInfoList(migrations []Migration, applied []MigrationRecord) []MigrationInfo {
	appliedMap := make(map[string]MigrationRecord)
	for _, record := range applied {
		appliedMap[record.Version] = record
	}

	var list []MigrationInfo
	for _, migration := range migrations {
		info := MigrationInfo{
			Version: migration.Version,
			Name:    migration.Name,
			Applied: false,
		}

		if record, ok := appliedMap[migration.Version]; ok {
			info.Applied = true
			info.AppliedAt = &record.AppliedAt
		}

		list = append(list, info)
	}

	return list
}

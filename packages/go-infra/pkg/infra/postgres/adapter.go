package postgres

import (
	"gorm.io/gorm"
)

// RepositoryAdapter adapts the postgres.Repository to implement repository.IRepository
// This provides a clean interface for the service layer
type RepositoryAdapter[T any, ID comparable] struct {
	*Repository[T, ID]
}

// NewRepositoryAdapter creates a new repository adapter
func NewRepositoryAdapter[T any, ID comparable](db *gorm.DB) *RepositoryAdapter[T, ID] {
	return &RepositoryAdapter[T, ID]{
		Repository: NewRepository[T, ID](db),
	}
}

// WithDB returns a new repository instance with a different DB
func (r *RepositoryAdapter[T, ID]) WithDB(db *gorm.DB) interface{} {
	// Return the underlying Repository pointer to match the IRepository expected signature
	return r.Repository.WithDB(db)
}

// Note: RepositoryAdapter wraps Repository to provide a clean interface

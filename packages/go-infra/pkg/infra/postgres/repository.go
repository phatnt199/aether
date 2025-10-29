package postgres

import (
	"context"
	"fmt"
	"reflect"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"local/go-infra/pkg/errors"
)

// Repository is a generic GORM repository implementation
// T is the entity type, ID is the primary key type
type Repository[T any, ID comparable] struct {
	db *gorm.DB
}

// NewRepository creates a new generic repository
func NewRepository[T any, ID comparable](db *gorm.DB) *Repository[T, ID] {
	return &Repository[T, ID]{
		db: db,
	}
}

// Create creates a new entity
func (r *Repository[T, ID]) Create(ctx context.Context, entity *T) error {
	if err := r.db.WithContext(ctx).Create(entity).Error; err != nil {
		// Check for unique constraint violation
		if errors.IsUniqueViolation(err) {
			return errors.AlreadyExists(r.getEntityName())
		}
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to create entity")
	}
	return nil
}

// CreateInBatches creates multiple entities in batches
func (r *Repository[T, ID]) CreateInBatches(ctx context.Context, entities []T, batchSize int) error {
	if len(entities) == 0 {
		return nil
	}

	if batchSize <= 0 {
		batchSize = 100
	}

	if err := r.db.WithContext(ctx).CreateInBatches(entities, batchSize).Error; err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to create entities in batches")
	}
	return nil
}

// FindByID finds an entity by its ID
func (r *Repository[T, ID]) FindByID(ctx context.Context, id ID) (*T, error) {
	var entity T
	// Use explicit WHERE clause for clarity and to avoid ambiguity with GORM's primary key detection
	// This is more explicit than First(&entity, id) and works consistently with all ID types
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.NotFound(r.getEntityName())
		}
		return nil, errors.Wrap(err, errors.CodeDatabaseError, "failed to find entity by id")
	}
	return &entity, nil
}

// FindOne finds a single entity matching the conditions
func (r *Repository[T, ID]) FindOne(ctx context.Context, conditions map[string]interface{}) (*T, error) {
	var entity T
	query := r.db.WithContext(ctx)

	if len(conditions) == 0 {
		return nil, errors.BadRequest("at least one condition is required for FindOne")
	}

	for key, value := range conditions {
		query = query.Where(fmt.Sprintf("%s = ?", key), value)
	}

	if err := query.First(&entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.NotFound(r.getEntityName())
		}
		return nil, errors.Wrap(err, errors.CodeDatabaseError, "failed to find entity")
	}
	return &entity, nil
}

// FindAll finds all entities matching the conditions
func (r *Repository[T, ID]) FindAll(ctx context.Context, conditions map[string]interface{}) ([]T, error) {
	var entities []T
	query := r.db.WithContext(ctx)

	for key, value := range conditions {
		query = query.Where(fmt.Sprintf("%s = ?", key), value)
	}

	if err := query.Find(&entities).Error; err != nil {
		return nil, errors.Wrap(err, errors.CodeDatabaseError, "failed to find entities")
	}
	return entities, nil
}

// List retrieves entities with pagination and optional conditions
func (r *Repository[T, ID]) List(ctx context.Context, opts *ListOptions) (*ListResult[T], error) {
	if opts == nil {
		opts = &ListOptions{
			Page:     1,
			PageSize: 20,
		}
	}

	// Ensure page and page size are valid
	if opts.Page < 1 {
		opts.Page = 1
	}
	if opts.PageSize < 1 {
		opts.PageSize = 20
	}
	if opts.PageSize > 100 {
		opts.PageSize = 100
	}

	var entities []T
	query := r.db.WithContext(ctx)

	// Apply conditions
	for key, value := range opts.Conditions {
		query = query.Where(fmt.Sprintf("%s = ?", key), value)
	}

	// Apply custom where clause
	if opts.Where != "" {
		query = query.Where(opts.Where, opts.WhereArgs...)
	}

	// Apply preloads
	for _, preload := range opts.Preloads {
		if preload != "" {
			query = query.Preload(preload)
		}
	}

	// Count total before pagination
	var total int64
	countQuery := query.Session(&gorm.Session{}) // Clone query for count
	if err := countQuery.Model(new(T)).Count(&total).Error; err != nil {
		return nil, errors.Wrap(err, errors.CodeDatabaseError, "failed to count entities")
	}

	// Apply sorting
	if opts.OrderBy != "" {
		query = query.Order(opts.OrderBy)
	} else {
		// Default sort by created_at descending if the field exists
		query = query.Order("created_at DESC")
	}

	// Apply pagination
	offset := (opts.Page - 1) * opts.PageSize
	query = query.Limit(opts.PageSize).Offset(offset)

	// Fetch data
	if err := query.Find(&entities).Error; err != nil {
		return nil, errors.Wrap(err, errors.CodeDatabaseError, "failed to list entities")
	}

	totalPages := (total + int64(opts.PageSize) - 1) / int64(opts.PageSize)
	if totalPages < 1 {
		totalPages = 1
	}

	return &ListResult[T]{
		Items:      entities,
		Total:      total,
		Page:       opts.Page,
		PageSize:   opts.PageSize,
		TotalPages: int(totalPages),
	}, nil
}

// Update updates an entity
func (r *Repository[T, ID]) Update(ctx context.Context, entity *T) error {
	if err := r.db.WithContext(ctx).Save(entity).Error; err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to update entity")
	}
	return nil
}

// UpdateColumns updates specific columns of an entity
func (r *Repository[T, ID]) UpdateColumns(ctx context.Context, id ID, columns map[string]interface{}) error {
	var entity T
	result := r.db.WithContext(ctx).Model(&entity).Where("id = ?", id).Updates(columns)

	if result.Error != nil {
		return errors.Wrap(result.Error, errors.CodeDatabaseError, "failed to update columns")
	}

	if result.RowsAffected == 0 {
		return errors.NotFound(r.getEntityName())
	}

	return nil
}

// Delete deletes an entity by ID
func (r *Repository[T, ID]) Delete(ctx context.Context, id ID) error {
	var entity T
	// Use explicit WHERE clause to avoid SQL parsing issues with UUID types
	result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&entity)

	if result.Error != nil {
		return errors.Wrap(result.Error, errors.CodeDatabaseError, "failed to delete entity")
	}

	if result.RowsAffected == 0 {
		return errors.NotFound(r.getEntityName())
	}

	return nil
}

// DeleteWhere deletes entities matching conditions
func (r *Repository[T, ID]) DeleteWhere(ctx context.Context, conditions map[string]interface{}) (int64, error) {
	var entity T
	query := r.db.WithContext(ctx).Model(&entity)

	for key, value := range conditions {
		query = query.Where(fmt.Sprintf("%s = ?", key), value)
	}

	result := query.Delete(&entity)
	if result.Error != nil {
		return 0, errors.Wrap(result.Error, errors.CodeDatabaseError, "failed to delete entities")
	}

	return result.RowsAffected, nil
}

// SoftDelete soft deletes an entity by ID (requires deleted_at column)
func (r *Repository[T, ID]) SoftDelete(ctx context.Context, id ID) error {
	var entity T
	// Use explicit WHERE clause to avoid SQL parsing issues with UUID types
	result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&entity)

	if result.Error != nil {
		return errors.Wrap(result.Error, errors.CodeDatabaseError, "failed to soft delete entity")
	}

	if result.RowsAffected == 0 {
		return errors.NotFound(r.getEntityName())
	}

	return nil
}

// Restore restores a soft deleted entity
func (r *Repository[T, ID]) Restore(ctx context.Context, id ID) error {
	var entity T
	result := r.db.WithContext(ctx).Model(&entity).Unscoped().Where("id = ?", id).Update("deleted_at", nil)

	if result.Error != nil {
		return errors.Wrap(result.Error, errors.CodeDatabaseError, "failed to restore entity")
	}

	if result.RowsAffected == 0 {
		return errors.NotFound(r.getEntityName())
	}

	return nil
}

// Exists checks if an entity exists by ID
func (r *Repository[T, ID]) Exists(ctx context.Context, id ID) (bool, error) {
	var count int64
	var entity T

	if err := r.db.WithContext(ctx).Model(&entity).Where("id = ?", id).Count(&count).Error; err != nil {
		return false, errors.Wrap(err, errors.CodeDatabaseError, "failed to check entity existence")
	}

	return count > 0, nil
}

// Count counts entities matching conditions
func (r *Repository[T, ID]) Count(ctx context.Context, conditions map[string]interface{}) (int64, error) {
	var count int64
	var entity T
	query := r.db.WithContext(ctx).Model(&entity)

	for key, value := range conditions {
		query = query.Where(fmt.Sprintf("%s = ?", key), value)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, errors.Wrap(err, errors.CodeDatabaseError, "failed to count entities")
	}

	return count, nil
}

// Upsert creates or updates an entity (requires unique constraints)
func (r *Repository[T, ID]) Upsert(ctx context.Context, entity *T, conflictColumns []string) error {
	if len(conflictColumns) == 0 {
		return errors.BadRequest("conflict columns must be specified for upsert")
	}

	columns := make([]clause.Column, len(conflictColumns))
	for i, col := range conflictColumns {
		columns[i] = clause.Column{Name: col}
	}

	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   columns,
		UpdateAll: true,
	}).Create(entity).Error; err != nil {
		return errors.Wrap(err, errors.CodeDatabaseError, "failed to upsert entity")
	}

	return nil
}

// Transaction executes a function within a transaction
func (r *Repository[T, ID]) Transaction(ctx context.Context, fn func(*gorm.DB) error) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := fn(tx); err != nil {
			if _, ok := errors.As(err); ok {
				return err
			}
			return errors.Wrap(err, errors.CodeDatabaseError, "transaction failed")
		}
		return nil
	})
}

// Query returns the underlying GORM DB for custom queries
func (r *Repository[T, ID]) Query(ctx context.Context) *gorm.DB {
	return r.db.WithContext(ctx)
}

// WithDB returns a new repository instance with a different DB (useful for transactions)
func (r *Repository[T, ID]) WithDB(db *gorm.DB) *Repository[T, ID] {
	return &Repository[T, ID]{
		db: db,
	}
}

// getEntityName returns the name of the entity type
func (r *Repository[T, ID]) getEntityName() string {
	var entity T
	t := reflect.TypeOf(entity)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}
	return t.Name()
}

// ListOptions represents options for listing entities
type ListOptions struct {
	Page       int                    // Current page (1-based)
	PageSize   int                    // Items per page
	OrderBy    string                 // Order by clause (e.g., "created_at DESC")
	Conditions map[string]interface{} // Simple equality conditions
	Where      string                 // Custom where clause
	WhereArgs  []interface{}          // Arguments for custom where clause
	Preloads   []string               // Relations to preload
}

// ListResult represents the result of a list operation
type ListResult[T any] struct {
	Items      []T   // The items in the current page
	Total      int64 // Total number of items
	Page       int   // Current page
	PageSize   int   // Items per page
	TotalPages int   // Total number of pages
}

// HasNextPage returns true if there are more pages
func (r *ListResult[T]) HasNextPage() bool {
	return r.Page < r.TotalPages
}

// HasPrevPage returns true if there is a previous page
func (r *ListResult[T]) HasPrevPage() bool {
	return r.Page > 1
}

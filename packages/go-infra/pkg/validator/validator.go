package validator

import (
	"sync"

	"github.com/go-playground/validator/v10"
)

var (
	// defaultValidator is the global validator instance
	defaultValidator *Validator
	once             sync.Once
)

// Validator wraps go-playground/validator with additional features
type Validator struct {
	validate *validator.Validate
}

// New creates a new Validator
func New() *Validator {
	v := validator.New()

	// Register custom validators here if needed
	// v.RegisterValidation("custom", customValidator)

	return &Validator{
		validate: v,
	}
}

// Init initializes the default validator
func Init() {
	once.Do(func() {
		defaultValidator = New()
	})
}

// GetDefault returns the default validator instance
func GetDefault() *Validator {
	if defaultValidator == nil {
		Init()
	}
	return defaultValidator
}

// Struct validates a struct
func (v *Validator) Struct(s interface{}) error {
	return v.validate.Struct(s)
}

// Var validates a single variable
func (v *Validator) Var(field interface{}, tag string) error {
	return v.validate.Var(field, tag)
}

// VarWithValue validates a variable with a value to compare
func (v *Validator) VarWithValue(field interface{}, other interface{}, tag string) error {
	return v.validate.VarWithValue(field, other, tag)
}

// RegisterValidation registers a custom validation function
func (v *Validator) RegisterValidation(tag string, fn validator.Func, callValidationEvenIfNull ...bool) error {
	return v.validate.RegisterValidation(tag, fn, callValidationEvenIfNull...)
}

// Package-level convenience functions

// Struct validates a struct using the default validator
func Struct(s interface{}) error {
	return GetDefault().Struct(s)
}

// Var validates a single variable using the default validator
func Var(field interface{}, tag string) error {
	return GetDefault().Var(field, tag)
}

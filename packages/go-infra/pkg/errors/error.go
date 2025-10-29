package errors

import (
	"fmt"
	"runtime"
	"strings"
	"time"
)

// 🎓 LEARNING: Interfaces in Go
// The error interface is built into Go and only requires one method: Error() string
// Any type that implements Error() string is an error!

// AppError is our custom error type that implements the error interface
// 🎓 Structs group related data together (like classes in other languages, but no inheritance)
type AppError struct {
	Code       ErrorCode              // Our custom error code
	Message    string                 // User-friendly message
	Details    string                 // Technical details (for logs, not users)
	Cause      error                  // The underlying error (for wrapping)
	Context    map[string]interface{} // Additional context (user_id, request_id, etc.)
	Stack      []StackFrame           // Stack trace for debugging
	Timestamp  time.Time              // When the error occurred
	HTTPStatus int                    // HTTP status code override
}

// StackFrame represents a single frame in the stack trace
type StackFrame struct {
	Function string // Function name
	File     string // File path
	Line     int    // Line number
}

// 🎓 LEARNING: Methods
// Methods are functions attached to a type
// (e *AppError) means this method belongs to AppError type
// The 'e' is called the receiver (like 'this' or 'self' in other languages)

// Error implements the error interface
// This is the only method required to make AppError an error type
func (e *AppError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return e.Code.Message()
}

// Unwrap returns the underlying error
// 🎓 This is part of Go 1.13+ error wrapping
// It allows errors.Is() and errors.As() to work
func (e *AppError) Unwrap() error {
	return e.Cause
}

// WithContext adds context to the error
// 🎓 This is a "fluent" method - it returns *AppError so you can chain calls
// Example: err.WithContext("user_id", 123).WithContext("action", "login")
func (e *AppError) WithContext(key string, value interface{}) *AppError {
	if e.Context == nil {
		e.Context = make(map[string]interface{})
	}
	e.Context[key] = value
	return e
}

// WithDetails adds technical details (for logging)
func (e *AppError) WithDetails(details string) *AppError {
	e.Details = details
	return e
}

// WithHTTPStatus overrides the default HTTP status
func (e *AppError) WithHTTPStatus(status int) *AppError {
	e.HTTPStatus = status
	return e
}

// GetHTTPStatus returns the HTTP status code
func (e *AppError) GetHTTPStatus() int {
	if e.HTTPStatus != 0 {
		return e.HTTPStatus
	}
	return e.Code.HTTPStatus()
}

// GetStackTrace returns a formatted stack trace string
func (e *AppError) GetStackTrace() string {
	if len(e.Stack) == 0 {
		return ""
	}

	var sb strings.Builder
	for _, frame := range e.Stack {
		sb.WriteString(fmt.Sprintf("\n  %s\n    %s:%d", frame.Function, frame.File, frame.Line))
	}
	return sb.String()
}

// 🎓 LEARNING: Constructor functions
// Go doesn't have constructors like other languages
// Instead, we use functions that start with "New" to create instances
// These are called "constructor functions" or "factory functions"

// New creates a new AppError with a code and optional message
// If message is empty, uses the default message for the code
func New(code ErrorCode, message ...string) *AppError {
	msg := code.Message()
	if len(message) > 0 && message[0] != "" {
		msg = message[0]
	}

	return &AppError{
		Code:      code,
		Message:   msg,
		Context:   make(map[string]interface{}),
		Stack:     captureStack(2), // Skip 2 frames (captureStack and New)
		Timestamp: time.Now(),
	}
}

// Wrap wraps an existing error with our AppError
// 🎓 This is crucial for error handling in Go
// It allows you to add context while preserving the original error
func Wrap(err error, code ErrorCode, message ...string) *AppError {
	if err == nil {
		return nil
	}

	// If it's already an AppError, just add to the context
	if appErr, ok := err.(*AppError); ok {
		if len(message) > 0 && message[0] != "" {
			appErr.Details = message[0]
		}
		return appErr
	}

	msg := code.Message()
	if len(message) > 0 && message[0] != "" {
		msg = message[0]
	}

	return &AppError{
		Code:      code,
		Message:   msg,
		Details:   err.Error(),
		Cause:     err,
		Context:   make(map[string]interface{}),
		Stack:     captureStack(2),
		Timestamp: time.Now(),
	}
}

// Wrapf wraps an error with formatted message
// 🎓 The 'f' suffix is a Go convention for formatted strings (like printf)
func Wrapf(err error, code ErrorCode, format string, args ...interface{}) *AppError {
	return Wrap(err, code, fmt.Sprintf(format, args...))
}

// 🎓 LEARNING: Helper functions for common error types
// These make it easier to create specific types of errors

// Internal creates an internal server error
func Internal(message ...string) *AppError {
	return New(CodeInternal, message...)
}

// NotFound creates a not found error
func NotFound(resource string) *AppError {
	return New(CodeNotFound, fmt.Sprintf("%s not found", resource))
}

// BadRequest creates a bad request error
func BadRequest(message ...string) *AppError {
	return New(CodeBadRequest, message...)
}

// Unauthorized creates an unauthorized error
func Unauthorized(message ...string) *AppError {
	return New(CodeUnauthorized, message...)
}

// Forbidden creates a forbidden error
func Forbidden(message ...string) *AppError {
	return New(CodeForbidden, message...)
}

// Validation creates a validation error
func Validation(message string) *AppError {
	return New(CodeValidation, message)
}

// AlreadyExists creates an already exists error
func AlreadyExists(resource string) *AppError {
	return New(CodeAlreadyExists, fmt.Sprintf("%s already exists", resource))
}

// Conflict creates a conflict error
func Conflict(message ...string) *AppError {
	return New(CodeConflict, message...)
}

// 🎓 LEARNING: Stack trace capture
// This uses Go's runtime package to capture where the error occurred

// captureStack captures the current stack trace
func captureStack(skip int) []StackFrame {
	const maxDepth = 32
	var pcs [maxDepth]uintptr

	// skip: number of frames to skip (captureStack itself, and caller)
	n := runtime.Callers(skip, pcs[:])

	frames := make([]StackFrame, 0, n)
	for _, pc := range pcs[:n] {
		fn := runtime.FuncForPC(pc)
		if fn == nil {
			continue
		}

		file, line := fn.FileLine(pc)
		frames = append(frames, StackFrame{
			Function: fn.Name(),
			File:     file,
			Line:     line,
		})
	}

	return frames
}

// 🎓 LEARNING: Type checking and conversion
// Is checks if an error is of a specific error code
// This works with wrapped errors too!
func Is(err error, code ErrorCode) bool {
	if err == nil {
		return false
	}

	if appErr, ok := err.(*AppError); ok {
		return appErr.Code == code
	}

	return false
}

// As finds the first error in err's chain that matches target
// This is useful for checking if any error in the chain is an AppError
func As(err error) (*AppError, bool) {
	if err == nil {
		return nil, false
	}

	if appErr, ok := err.(*AppError); ok {
		return appErr, true
	}

	// Check if it's a wrapped error
	if unwrapped, ok := err.(interface{ Unwrap() error }); ok {
		return As(unwrapped.Unwrap())
	}

	return nil, false
}

// GetCode extracts the error code from an error
// Returns CodeUnknown if the error is not an AppError
func GetCode(err error) ErrorCode {
	if appErr, ok := As(err); ok {
		return appErr.Code
	}
	return CodeUnknown
}

// IsUniqueViolation checks if an error is a unique constraint violation
// This is useful for database errors
func IsUniqueViolation(err error) bool {
	if err == nil {
		return false
	}

	errMsg := err.Error()
	// PostgreSQL unique violation error code is 23505
	// GORM wraps these errors, so we check the error message
	return strings.Contains(errMsg, "duplicate key") ||
		strings.Contains(errMsg, "unique constraint") ||
		strings.Contains(errMsg, "UNIQUE constraint failed") ||
		strings.Contains(errMsg, "violates unique constraint")
}

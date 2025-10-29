package errors

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// 🎓 LEARNING: JSON and HTTP in Go
// JSON tags control how structs are serialized to JSON
// The format is: `json:"field_name,options"`
// Common options: omitempty (skip if zero value), - (always skip)

// ErrorResponse is the JSON structure returned to clients
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail contains the error information
type ErrorDetail struct {
	Code      string                 `json:"code"`                 // Error code
	Message   string                 `json:"message"`              // User-friendly message
	Details   string                 `json:"details,omitempty"`    // Technical details (only in dev mode)
	Timestamp string                 `json:"timestamp"`            // ISO 8601 timestamp
	RequestID string                 `json:"request_id,omitempty"` // Request ID for tracking
	Context   map[string]interface{} `json:"context,omitempty"`    // Additional context
}

// ValidationErrorResponse is for validation errors with field-level details
type ValidationErrorResponse struct {
	Error ValidationErrorDetail `json:"error"`
}

// ValidationErrorDetail contains validation error information
type ValidationErrorDetail struct {
	Code      string            `json:"code"`
	Message   string            `json:"message"`
	Timestamp string            `json:"timestamp"`
	RequestID string            `json:"request_id,omitempty"`
	Fields    []ValidationField `json:"fields,omitempty"` // Field-specific errors
}

// ValidationField represents a single field validation error
type ValidationField struct {
	Field   string `json:"field"`           // Field name
	Message string `json:"message"`         // Error message for this field
	Value   string `json:"value,omitempty"` // The invalid value (be careful with sensitive data!)
}

// HandlerConfig configures the error handler behavior
type HandlerConfig struct {
	ShowDetails   bool   // Show technical details in response
	ShowStack     bool   // Show stack trace (never do this in production!)
	ShowContext   bool   // Show error context
	DefaultStatus int    // Default HTTP status for unknown errors
	RequestIDKey  string // Key to extract request ID from context
}

// DefaultConfig returns a production-safe configuration
func DefaultConfig() HandlerConfig {
	return HandlerConfig{
		ShowDetails:   false,
		ShowStack:     false,
		ShowContext:   false,
		DefaultStatus: http.StatusInternalServerError,
		RequestIDKey:  "request_id",
	}
}

// DevelopmentConfig returns a development-friendly configuration
func DevelopmentConfig() HandlerConfig {
	return HandlerConfig{
		ShowDetails:   true,
		ShowStack:     true,
		ShowContext:   true,
		DefaultStatus: http.StatusInternalServerError,
		RequestIDKey:  "request_id",
	}
}

// 🎓 LEARNING: HTTP handlers in Go
// The standard signature for HTTP handlers is: func(w http.ResponseWriter, r *http.Request)
// w is where you write the response, r contains the request data

// WriteJSON writes an error response as JSON to the HTTP response writer
func WriteJSON(w http.ResponseWriter, err error, config HandlerConfig) {
	appErr, ok := As(err)
	if !ok {
		// Not an AppError, wrap it
		appErr = Wrap(err, CodeInternal)
	}

	// Build the error response
	response := ErrorResponse{
		Error: ErrorDetail{
			Code:      string(appErr.Code),
			Message:   appErr.Message,
			Timestamp: appErr.Timestamp.Format("2006-01-02T15:04:05Z07:00"), // ISO 8601
		},
	}

	// Add optional fields based on config
	if config.ShowDetails && appErr.Details != "" {
		response.Error.Details = appErr.Details
	}

	if config.ShowContext && len(appErr.Context) > 0 {
		response.Error.Context = appErr.Context
	}

	// Try to get request ID from context
	if config.RequestIDKey != "" {
		if reqID, ok := appErr.Context[config.RequestIDKey].(string); ok {
			response.Error.RequestID = reqID
		}
	}

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(appErr.GetHTTPStatus())

	// Encode and write JSON
	// 🎓 json.NewEncoder creates an encoder that writes directly to w
	_ = json.NewEncoder(w).Encode(response)
}

// WriteValidationJSON writes a validation error response
func WriteValidationJSON(w http.ResponseWriter, err error, fields []ValidationField, config HandlerConfig) {
	appErr, ok := As(err)
	if !ok {
		appErr = Wrap(err, CodeValidation)
	}

	response := ValidationErrorResponse{
		Error: ValidationErrorDetail{
			Code:      string(appErr.Code),
			Message:   appErr.Message,
			Timestamp: appErr.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
			Fields:    fields,
		},
	}

	// Try to get request ID
	if config.RequestIDKey != "" {
		if reqID, ok := appErr.Context[config.RequestIDKey].(string); ok {
			response.Error.RequestID = reqID
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(appErr.GetHTTPStatus())
	_ = json.NewEncoder(w).Encode(response)
}

// 🎓 LEARNING: Middleware in Go
// Middleware is a pattern for wrapping HTTP handlers to add functionality
// It takes a handler and returns a new handler that wraps it

// Middleware is a function that wraps an HTTP handler to catch panics
// and convert them to proper error responses
func Middleware(config HandlerConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 🎓 defer + recover is Go's way of catching panics (like try/catch)
			defer func() {
				if rec := recover(); rec != nil {
					// A panic occurred! Convert it to an error response
					var err error

					// Check if the panic value is already an error
					if e, ok := rec.(error); ok {
						err = e
					} else {
						// Create a new error from the panic value
						err = Internal(fmt.Sprintf("panic: %v", rec))
					}

					WriteJSON(w, err, config)
				}
			}()

			// Call the next handler
			next.ServeHTTP(w, r)
		})
	}
}

// RecoveryMiddleware is a simpler middleware that only handles panics
func RecoveryMiddleware() func(http.Handler) http.Handler {
	return Middleware(DefaultConfig())
}

// 🎓 LEARNING: Helper functions for common HTTP operations

// RespondWithError is a convenience function to write an error response
func RespondWithError(w http.ResponseWriter, err error) {
	WriteJSON(w, err, DefaultConfig())
}

// RespondWithErrorDev writes an error response with development settings
func RespondWithErrorDev(w http.ResponseWriter, err error) {
	WriteJSON(w, err, DevelopmentConfig())
}

// FromHTTPStatus creates an AppError from an HTTP status code
// Useful when working with standard HTTP errors
func FromHTTPStatus(status int) *AppError {
	var code ErrorCode

	switch status {
	case http.StatusBadRequest:
		code = CodeBadRequest
	case http.StatusUnauthorized:
		code = CodeUnauthorized
	case http.StatusForbidden:
		code = CodeForbidden
	case http.StatusNotFound:
		code = CodeNotFound
	case http.StatusConflict:
		code = CodeConflict
	case http.StatusTooManyRequests:
		code = CodeTooManyRequests
	case http.StatusInternalServerError:
		code = CodeInternal
	case http.StatusNotImplemented:
		code = CodeNotImplemented
	case http.StatusServiceUnavailable:
		code = CodeServiceUnavailable
	default:
		code = CodeUnknown
	}

	return New(code).WithHTTPStatus(status)
}

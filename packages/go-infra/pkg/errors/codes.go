package errors

import "net/http"

type ErrorCode string

// 🎓 LEARNING: Constants and iota
// const groups related constants together
// iota is a special identifier that auto-increments (0, 1, 2, ...)
// We're using string constants here for better debugging

// Application-level error codes
const (
	// Generic errors
	CodeInternal       ErrorCode = "INTERNAL_ERROR"
	CodeUnknown        ErrorCode = "UNKNOWN_ERROR"
	CodeNotImplemented ErrorCode = "NOT_IMPLEMENTED"

	// Request errors
	CodeBadRequest   ErrorCode = "BAD_REQUEST"
	CodeInvalidInput ErrorCode = "INVALID_INPUT"
	CodeValidation   ErrorCode = "VALIDATION_ERROR"
	CodeMissingField ErrorCode = "MISSING_FIELD"

	// Authentication & Authorization
	CodeUnauthorized ErrorCode = "UNAUTHORIZED"
	CodeForbidden    ErrorCode = "FORBIDDEN"
	CodeInvalidToken ErrorCode = "INVALID_TOKEN"
	CodeTokenExpired ErrorCode = "TOKEN_EXPIRED"

	// Resource errors
	CodeNotFound      ErrorCode = "NOT_FOUND"
	CodeAlreadyExists ErrorCode = "ALREADY_EXISTS"
	CodeConflict      ErrorCode = "CONFLICT"
	CodeGone          ErrorCode = "GONE"

	// Rate limiting
	CodeTooManyRequests   ErrorCode = "TOO_MANY_REQUESTS"
	CodeRateLimitExceeded ErrorCode = "RATE_LIMIT_EXCEEDED"

	// External service errors
	CodeServiceUnavailable ErrorCode = "SERVICE_UNAVAILABLE"
	CodeTimeout            ErrorCode = "TIMEOUT"
	CodeExternalService    ErrorCode = "EXTERNAL_SERVICE_ERROR"

	// Database errors
	CodeDatabaseError       ErrorCode = "DATABASE_ERROR"
	CodeDuplicateKey        ErrorCode = "DUPLICATE_KEY"
	CodeForeignKeyViolation ErrorCode = "FOREIGN_KEY_VIOLATION"
)

// 🎓 LEARNING: Maps in Go
// map[keyType]valueType is how you declare a map (like a dictionary/hashmap)
// This maps our error codes to HTTP status codes
var codeToHTTPStatus = map[ErrorCode]int{
	// 400 Bad Request
	CodeBadRequest:   http.StatusBadRequest,
	CodeInvalidInput: http.StatusBadRequest,
	CodeValidation:   http.StatusBadRequest,
	CodeMissingField: http.StatusBadRequest,

	// 401 Unauthorized
	CodeUnauthorized: http.StatusUnauthorized,
	CodeInvalidToken: http.StatusUnauthorized,
	CodeTokenExpired: http.StatusUnauthorized,

	// 403 Forbidden
	CodeForbidden: http.StatusForbidden,

	// 404 Not Found
	CodeNotFound: http.StatusNotFound,

	// 409 Conflict
	CodeAlreadyExists: http.StatusConflict,
	CodeConflict:      http.StatusConflict,
	CodeDuplicateKey:  http.StatusConflict,

	// 410 Gone
	CodeGone: http.StatusGone,

	// 429 Too Many Requests
	CodeTooManyRequests:   http.StatusTooManyRequests,
	CodeRateLimitExceeded: http.StatusTooManyRequests,

	// 500 Internal Server Error
	CodeInternal:            http.StatusInternalServerError,
	CodeUnknown:             http.StatusInternalServerError,
	CodeDatabaseError:       http.StatusInternalServerError,
	CodeForeignKeyViolation: http.StatusInternalServerError,

	// 501 Not Implemented
	CodeNotImplemented: http.StatusNotImplemented,

	// 503 Service Unavailable
	CodeServiceUnavailable: http.StatusServiceUnavailable,
	CodeTimeout:            http.StatusServiceUnavailable,
	CodeExternalService:    http.StatusServiceUnavailable,
}

// Default user-friendly messages for each error code
var codeToMessage = map[ErrorCode]string{
	// Generic
	CodeInternal:       "An internal error occurred. Please try again later.",
	CodeUnknown:        "An unknown error occurred.",
	CodeNotImplemented: "This feature is not yet implemented.",

	// Request
	CodeBadRequest:   "The request could not be understood.",
	CodeInvalidInput: "The input provided is invalid.",
	CodeValidation:   "Validation failed for one or more fields.",
	CodeMissingField: "A required field is missing.",

	// Auth
	CodeUnauthorized: "Authentication is required to access this resource.",
	CodeForbidden:    "You don't have permission to access this resource.",
	CodeInvalidToken: "The authentication token is invalid.",
	CodeTokenExpired: "The authentication token has expired.",

	// Resources
	CodeNotFound:      "The requested resource was not found.",
	CodeAlreadyExists: "A resource with this identifier already exists.",
	CodeConflict:      "The request conflicts with the current state.",
	CodeGone:          "The resource is no longer available.",

	// Rate limiting
	CodeTooManyRequests:   "Too many requests. Please slow down.",
	CodeRateLimitExceeded: "Rate limit exceeded. Please try again later.",

	// External
	CodeServiceUnavailable: "The service is temporarily unavailable.",
	CodeTimeout:            "The request timed out.",
	CodeExternalService:    "An external service error occurred.",

	// Database
	CodeDatabaseError:       "A database error occurred.",
	CodeDuplicateKey:        "A record with this key already exists.",
	CodeForeignKeyViolation: "Cannot complete operation due to related records.",
}

// 🎓 LEARNING: Functions and methods
// Functions that don't belong to a type start with func name(params) returnType

// HTTPStatus returns the HTTP status code for an error code
// If the code is not found, returns 500 Internal Server Error
func (c ErrorCode) HTTPStatus() int {
	if status, ok := codeToHTTPStatus[c]; ok {
		return status
	}
	return http.StatusInternalServerError
}

// Message returns the default message for an error code
func (c ErrorCode) Message() string {
	if msg, ok := codeToMessage[c]; ok {
		return msg
	}
	return "An error occurred."
}

// String implements the Stringer interface
// This is called automatically when you print an ErrorCode
func (c ErrorCode) String() string {
	return string(c)
}

// IsClientError returns true if the error code represents a client error (4xx)
func (c ErrorCode) IsClientError() bool {
	status := c.HTTPStatus()
	return status >= 400 && status < 500
}

// IsServerError returns true if the error code represents a server error (5xx)
func (c ErrorCode) IsServerError() bool {
	status := c.HTTPStatus()
	return status >= 500 && status < 600
}

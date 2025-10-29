package errors

import (
	"fmt"
	"net/http"
	"testing"
)

// 🎓 LEARNING: Testing in Go
// Test files end with _test.go
// Test functions start with Test and take *testing.T
// Use t.Error/t.Errorf for failures, t.Fatal/t.Fatalf to stop the test

// TestErrorCodes tests error code functionality
func TestErrorCodes(t *testing.T) {
	tests := []struct {
		name       string
		code       ErrorCode
		wantStatus int
		wantClient bool
		wantServer bool
	}{
		{
			name:       "NotFound is client error",
			code:       CodeNotFound,
			wantStatus: http.StatusNotFound,
			wantClient: true,
			wantServer: false,
		},
		{
			name:       "Internal is server error",
			code:       CodeInternal,
			wantStatus: http.StatusInternalServerError,
			wantClient: false,
			wantServer: true,
		},
		{
			name:       "Unauthorized is client error",
			code:       CodeUnauthorized,
			wantStatus: http.StatusUnauthorized,
			wantClient: true,
			wantServer: false,
		},
	}

	for _, tt := range tests {
		// 🎓 t.Run creates a subtest - helps organize test output
		t.Run(tt.name, func(t *testing.T) {
			status := tt.code.HTTPStatus()
			if status != tt.wantStatus {
				t.Errorf("HTTPStatus() = %d, want %d", status, tt.wantStatus)
			}

			isClient := tt.code.IsClientError()
			if isClient != tt.wantClient {
				t.Errorf("IsClientError() = %v, want %v", isClient, tt.wantClient)
			}

			isServer := tt.code.IsServerError()
			if isServer != tt.wantServer {
				t.Errorf("IsServerError() = %v, want %v", isServer, tt.wantServer)
			}

			// Check that message exists
			msg := tt.code.Message()
			if msg == "" {
				t.Error("Message() returned empty string")
			}
		})
	}
}

// TestNew tests error creation
func TestNew(t *testing.T) {
	err := New(CodeNotFound, "User not found")

	if err.Code != CodeNotFound {
		t.Errorf("Code = %s, want %s", err.Code, CodeNotFound)
	}

	if err.Message != "User not found" {
		t.Errorf("Message = %s, want 'User not found'", err.Message)
	}

	if err.Error() != "User not found" {
		t.Errorf("Error() = %s, want 'User not found'", err.Error())
	}

	if len(err.Stack) == 0 {
		t.Error("Stack trace is empty")
	}

	if err.Context == nil {
		t.Error("Context is nil")
	}
}

// TestNewDefaultMessage tests error creation with default message
func TestNewDefaultMessage(t *testing.T) {
	err := New(CodeNotFound)

	defaultMsg := CodeNotFound.Message()
	if err.Message != defaultMsg {
		t.Errorf("Message = %s, want %s", err.Message, defaultMsg)
	}
}

// TestWrap tests error wrapping
func TestWrap(t *testing.T) {
	originalErr := fmt.Errorf("database connection failed")
	wrapped := Wrap(originalErr, CodeDatabaseError, "Failed to fetch user")

	if wrapped.Code != CodeDatabaseError {
		t.Errorf("Code = %s, want %s", wrapped.Code, CodeDatabaseError)
	}

	if wrapped.Message != "Failed to fetch user" {
		t.Errorf("Message = %s, want 'Failed to fetch user'", wrapped.Message)
	}

	if wrapped.Cause != originalErr {
		t.Error("Cause is not the original error")
	}

	if wrapped.Details != originalErr.Error() {
		t.Errorf("Details = %s, want %s", wrapped.Details, originalErr.Error())
	}

	// Test Unwrap
	if wrapped.Unwrap() != originalErr {
		t.Error("Unwrap() did not return original error")
	}
}

// TestWrapNil tests that wrapping nil returns nil
func TestWrapNil(t *testing.T) {
	wrapped := Wrap(nil, CodeInternal, "test")
	if wrapped != nil {
		t.Error("Wrapping nil should return nil")
	}
}

// TestWithContext tests adding context to errors
func TestWithContext(t *testing.T) {
	err := New(CodeNotFound).
		WithContext("user_id", 123).
		WithContext("action", "login")

	if err.Context["user_id"] != 123 {
		t.Errorf("Context user_id = %v, want 123", err.Context["user_id"])
	}

	if err.Context["action"] != "login" {
		t.Errorf("Context action = %v, want 'login'", err.Context["action"])
	}
}

// TestWithDetails tests adding details to errors
func TestWithDetails(t *testing.T) {
	err := New(CodeInternal).WithDetails("SQL query failed")

	if err.Details != "SQL query failed" {
		t.Errorf("Details = %s, want 'SQL query failed'", err.Details)
	}
}

// TestWithHTTPStatus tests overriding HTTP status
func TestWithHTTPStatus(t *testing.T) {
	err := New(CodeInternal).WithHTTPStatus(http.StatusBadGateway)

	if err.GetHTTPStatus() != http.StatusBadGateway {
		t.Errorf("GetHTTPStatus() = %d, want %d", err.GetHTTPStatus(), http.StatusBadGateway)
	}
}

// TestIs tests error code checking
func TestIs(t *testing.T) {
	err := New(CodeNotFound)

	if !Is(err, CodeNotFound) {
		t.Error("Is() should return true for matching code")
	}

	if Is(err, CodeInternal) {
		t.Error("Is() should return false for non-matching code")
	}

	if Is(nil, CodeNotFound) {
		t.Error("Is() should return false for nil error")
	}
}

// TestAs tests error type assertion
func TestAs(t *testing.T) {
	err := New(CodeNotFound)

	appErr, ok := As(err)
	if !ok {
		t.Fatal("As() should return true for AppError")
	}

	if appErr.Code != CodeNotFound {
		t.Errorf("Code = %s, want %s", appErr.Code, CodeNotFound)
	}

	// Test with nil
	_, ok = As(nil)
	if ok {
		t.Error("As() should return false for nil")
	}

	// Test with non-AppError
	regularErr := fmt.Errorf("regular error")
	_, ok = As(regularErr)
	if ok {
		t.Error("As() should return false for non-AppError")
	}
}

// TestGetCode tests extracting error code
func TestGetCode(t *testing.T) {
	err := New(CodeNotFound)

	code := GetCode(err)
	if code != CodeNotFound {
		t.Errorf("GetCode() = %s, want %s", code, CodeNotFound)
	}

	// Test with non-AppError
	regularErr := fmt.Errorf("regular error")
	code = GetCode(regularErr)
	if code != CodeUnknown {
		t.Errorf("GetCode() = %s, want %s", code, CodeUnknown)
	}
}

// TestHelperFunctions tests convenience functions
func TestHelperFunctions(t *testing.T) {
	tests := []struct {
		name     string
		createFn func() *AppError
		wantCode ErrorCode
	}{
		{
			name:     "Internal",
			createFn: func() *AppError { return Internal() },
			wantCode: CodeInternal,
		},
		{
			name:     "NotFound",
			createFn: func() *AppError { return NotFound("User") },
			wantCode: CodeNotFound,
		},
		{
			name:     "BadRequest",
			createFn: func() *AppError { return BadRequest() },
			wantCode: CodeBadRequest,
		},
		{
			name:     "Unauthorized",
			createFn: func() *AppError { return Unauthorized() },
			wantCode: CodeUnauthorized,
		},
		{
			name:     "Forbidden",
			createFn: func() *AppError { return Forbidden() },
			wantCode: CodeForbidden,
		},
		{
			name:     "Validation",
			createFn: func() *AppError { return Validation("invalid input") },
			wantCode: CodeValidation,
		},
		{
			name:     "AlreadyExists",
			createFn: func() *AppError { return AlreadyExists("User") },
			wantCode: CodeAlreadyExists,
		},
		{
			name:     "Conflict",
			createFn: func() *AppError { return Conflict() },
			wantCode: CodeConflict,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.createFn()

			if err.Code != tt.wantCode {
				t.Errorf("Code = %s, want %s", err.Code, tt.wantCode)
			}

			if err.Message == "" {
				t.Error("Message is empty")
			}
		})
	}
}

// TestStackTrace tests stack trace capture
func TestStackTrace(t *testing.T) {
	err := New(CodeInternal)

	if len(err.Stack) == 0 {
		t.Fatal("Stack is empty")
	}

	// Check that stack frames have data
	frame := err.Stack[0]
	if frame.Function == "" {
		t.Error("Stack frame function is empty")
	}
	if frame.File == "" {
		t.Error("Stack frame file is empty")
	}
	if frame.Line == 0 {
		t.Error("Stack frame line is 0")
	}

	// Test formatted stack trace
	trace := err.GetStackTrace()
	if trace == "" {
		t.Error("GetStackTrace() returned empty string")
	}
}

// TestFromHTTPStatus tests creating errors from HTTP status codes
func TestFromHTTPStatus(t *testing.T) {
	tests := []struct {
		status   int
		wantCode ErrorCode
	}{
		{http.StatusBadRequest, CodeBadRequest},
		{http.StatusUnauthorized, CodeUnauthorized},
		{http.StatusForbidden, CodeForbidden},
		{http.StatusNotFound, CodeNotFound},
		{http.StatusConflict, CodeConflict},
		{http.StatusTooManyRequests, CodeTooManyRequests},
		{http.StatusInternalServerError, CodeInternal},
		{http.StatusNotImplemented, CodeNotImplemented},
		{http.StatusServiceUnavailable, CodeServiceUnavailable},
		{999, CodeUnknown}, // Unknown status
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("Status_%d", tt.status), func(t *testing.T) {
			err := FromHTTPStatus(tt.status)

			if err.Code != tt.wantCode {
				t.Errorf("Code = %s, want %s", err.Code, tt.wantCode)
			}

			if err.GetHTTPStatus() != tt.status {
				t.Errorf("GetHTTPStatus() = %d, want %d", err.GetHTTPStatus(), tt.status)
			}
		})
	}
}

// BenchmarkNew benchmarks error creation
func BenchmarkNew(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = New(CodeInternal, "test error")
	}
}

// BenchmarkWrap benchmarks error wrapping
func BenchmarkWrap(b *testing.B) {
	originalErr := fmt.Errorf("original error")
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = Wrap(originalErr, CodeInternal, "wrapped")
	}
}

// BenchmarkWithContext benchmarks adding context
func BenchmarkWithContext(b *testing.B) {
	err := New(CodeInternal)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		err.WithContext("key", "value")
	}
}

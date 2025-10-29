// Package contracts
package contracts

import (
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
)

// Context represents a framework-agnostic HTTP context
// Both Echo and Fiber adapters will implement this interface
type Context interface {
	// Request returns the HTTP request
	Request() *http.Request

	// Response returns a response writer interface
	ResponseWriter() http.ResponseWriter

	// Param returns path parameter by name
	Param(name string) string

	// QueryParam returns the query parameter by name
	QueryParam(name string) string

	// QueryParams returns the query parameters as url.Values
	QueryParams() url.Values

	// FormValue returns the form field value by name
	FormValue(name string) string

	// FormFile returns the multipart form file for the given key
	FormFile(name string) (*multipart.FileHeader, error)

	// MultipartForm returns the multipart form
	MultipartForm() (*multipart.Form, error)

	// Get retrieves data from the context
	Get(key string) interface{}

	// Set saves data in the context
	Set(key string, val interface{})

	// Bind binds the request body into provided type
	// Supports JSON, XML, form data based on Content-Type
	Bind(i interface{}) error

	// Validate validates provided struct
	Validate(i interface{}) error

	// JSON sends a JSON response with status code
	JSON(code int, i interface{}) error

	// JSONBlob sends a JSON blob response with status code
	JSONBlob(code int, b []byte) error

	// XML sends an XML response with status code
	XML(code int, i interface{}) error

	// String sends a string response with status code
	String(code int, s string) error

	// HTML sends an HTML response with status code
	HTML(code int, html string) error

	// Blob sends a blob response with status code and content type
	Blob(code int, contentType string, b []byte) error

	// Stream sends a streaming response with status code and content type
	Stream(code int, contentType string, r io.Reader) error

	// NoContent sends a response with no body and status code
	NoContent(code int) error

	// Redirect redirects the request to a provided URL with status code
	Redirect(code int, url string) error

	// Error invokes the registered error handler
	Error(err error)

	// Handler returns the matched handler by router
	Handler() interface{}

	// SetHandler sets the matched handler by router
	SetHandler(h interface{})

	// Path returns the registered path for the handler
	Path() string

	// RealIP returns the client's real IP address
	RealIP() string

	// Scheme returns the HTTP protocol scheme, http or https
	Scheme() string
}

// HandlerFunc defines a function to serve HTTP requests
type HandlerFunc func(Context) error

// MiddlewareFunc defines a function to process middleware
type MiddlewareFunc func(HandlerFunc) HandlerFunc

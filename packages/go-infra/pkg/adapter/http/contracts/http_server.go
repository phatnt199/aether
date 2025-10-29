package contracts

import (
	"context"
	"local/go-infra/pkg/logger"
	"net/http"
)

// HttpServer defines a framework-agnostic HTTP server interface
// Both Echo and Fiber implementations will satisfy this interface
type HttpServer interface {
	// RunHttpServer starts the HTTP server with optional configuration
	RunHttpServer(configFunc ...func(instance interface{})) error

	// GracefulShutdown gracefully shuts down the server
	GracefulShutdown(ctx context.Context) error

	// ApplyVersioningFromHeader enables API versioning from headers
	ApplyVersioningFromHeader()

	// GetServerInstance returns the underlying framework instance
	GetServerInstance() interface{}

	// Logger returns the logger instance
	Logger() logger.Logger

	// Cfg returns the server configuration
	Cfg() HttpOptions

	// SetupDefaultMiddlewares configures default middlewares
	SetupDefaultMiddlewares()

	// RouteBuilder returns the route builder
	RouteBuilder() RouteBuilder

	// AddMiddlewares adds custom middlewares
	AddMiddlewares(middlewares ...MiddlewareFunc)

	// ConfigGroup configures a route group
	ConfigGroup(groupName string, groupFunc func(group RouteGroup))
}

// HttpOptions defines common HTTP server configuration
type HttpOptions interface {
	GetPort() string
	GetHost() string
	GetName() string
	GetBasePath() string
	IsDevelopment() bool
}

// RouteGroup defines a route group interface for organizing routes
type RouteGroup interface {
	// GET registers a new GET route
	GET(path string, handler HandlerFunc, middleware ...MiddlewareFunc)

	// POST registers a new POST route
	POST(path string, handler HandlerFunc, middleware ...MiddlewareFunc)

	// PUT registers a new PUT route
	PUT(path string, handler HandlerFunc, middleware ...MiddlewareFunc)

	// DELETE registers a new DELETE route
	DELETE(path string, handler HandlerFunc, middleware ...MiddlewareFunc)

	// PATCH registers a new PATCH route
	PATCH(path string, handler HandlerFunc, middleware ...MiddlewareFunc)

	// Group creates a new route group
	Group(prefix string, middleware ...MiddlewareFunc) RouteGroup

	// RegisterHandler registers a handler function that receives the server instance
	RegisterHttpHandler(method string, path string, handler http.Handler)
}

// RouteBuilder defines an interface for building routes
type RouteBuilder interface {
	// GET registers a new GET route
	GET(path string, handler HandlerFunc, middleware ...MiddlewareFunc) RouteBuilder

	// POST registers a new POST route
	POST(path string, handler HandlerFunc, middleware ...MiddlewareFunc) RouteBuilder

	// PUT registers a new PUT route
	PUT(path string, handler HandlerFunc, middleware ...MiddlewareFunc) RouteBuilder

	// DELETE registers a new DELETE route
	DELETE(path string, handler HandlerFunc, middleware ...MiddlewareFunc) RouteBuilder

	// PATCH registers a new PATCH route
	PATCH(path string, handler HandlerFunc, middleware ...MiddlewareFunc) RouteBuilder

	// Group creates a new route group
	Group(prefix string, middleware ...MiddlewareFunc) RouteGroup

	// RegisterHandler registers a handler function that receives the server instance
	RegisterHandler(builder func(instance interface{})) RouteBuilder

	// RegisterHttpHandler registers a standard http.Handler
	RegisterHttpHandler(method string, path string, handler http.Handler) RouteBuilder
}

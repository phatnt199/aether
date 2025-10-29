package customfiber

import (
	"local/go-infra/pkg/adapter/http/contracts"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
)

// fiberRouteBuilder implements contracts.RouteBuilder for Fiber
type fiberRouteBuilder struct {
	app *fiber.App
}

// NewFiberRouteBuilder creates a new Fiber route builder
func NewFiberRouteBuilder(app *fiber.App) contracts.RouteBuilder {
	return &fiberRouteBuilder{app: app}
}

func (r *fiberRouteBuilder) GET(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) contracts.RouteBuilder {
	handlers := r.convertMiddlewares(middleware, handler)
	r.app.Get(path, handlers...)
	return r
}

func (r *fiberRouteBuilder) POST(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) contracts.RouteBuilder {
	handlers := r.convertMiddlewares(middleware, handler)
	r.app.Post(path, handlers...)
	return r
}

func (r *fiberRouteBuilder) PUT(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) contracts.RouteBuilder {
	handlers := r.convertMiddlewares(middleware, handler)
	r.app.Put(path, handlers...)
	return r
}

func (r *fiberRouteBuilder) DELETE(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) contracts.RouteBuilder {
	handlers := r.convertMiddlewares(middleware, handler)
	r.app.Delete(path, handlers...)
	return r
}

func (r *fiberRouteBuilder) PATCH(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) contracts.RouteBuilder {
	handlers := r.convertMiddlewares(middleware, handler)
	r.app.Patch(path, handlers...)
	return r
}

func (r *fiberRouteBuilder) Group(prefix string, middleware ...contracts.MiddlewareFunc) contracts.RouteGroup {
	group := r.app.Group(prefix)
	for _, m := range middleware {
		group.Use(ConvertFiberMiddleware(m))
	}
	return &fiberRouteGroup{group: group}
}

func (r *fiberRouteBuilder) RegisterHandler(builder func(instance interface{})) contracts.RouteBuilder {
	builder(r.app)
	return r
}

func (r *fiberRouteBuilder) convertMiddlewares(middleware []contracts.MiddlewareFunc, handler contracts.HandlerFunc) []fiber.Handler {
	handlers := make([]fiber.Handler, 0, len(middleware)+1)
	for _, m := range middleware {
		handlers = append(handlers, ConvertFiberMiddleware(m))
	}
	handlers = append(handlers, ConvertFiberHandler(handler))
	return handlers
}

// fiberRouteGroup implements contracts.RouteGroup for Fiber
type fiberRouteGroup struct {
	group fiber.Router
}

func (g *fiberRouteGroup) GET(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) {
	handlers := g.convertMiddlewares(middleware, handler)
	g.group.Get(path, handlers...)
}

func (g *fiberRouteGroup) POST(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) {
	handlers := g.convertMiddlewares(middleware, handler)
	g.group.Post(path, handlers...)
}

func (g *fiberRouteGroup) PUT(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) {
	handlers := g.convertMiddlewares(middleware, handler)
	g.group.Put(path, handlers...)
}

func (g *fiberRouteGroup) DELETE(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) {
	handlers := g.convertMiddlewares(middleware, handler)
	g.group.Delete(path, handlers...)
}

func (g *fiberRouteGroup) PATCH(path string, handler contracts.HandlerFunc, middleware ...contracts.MiddlewareFunc) {
	handlers := g.convertMiddlewares(middleware, handler)
	g.group.Patch(path, handlers...)
}

func (g *fiberRouteGroup) Group(prefix string, middleware ...contracts.MiddlewareFunc) contracts.RouteGroup {
	subGroup := g.group.Group(prefix)
	for _, m := range middleware {
		subGroup.Use(ConvertFiberMiddleware(m))
	}
	return &fiberRouteGroup{group: subGroup}
}

func (g *fiberRouteGroup) convertMiddlewares(middleware []contracts.MiddlewareFunc, handler contracts.HandlerFunc) []fiber.Handler {
	handlers := make([]fiber.Handler, 0, len(middleware)+1)
	for _, m := range middleware {
		handlers = append(handlers, ConvertFiberMiddleware(m))
	}
	handlers = append(handlers, ConvertFiberHandler(handler))
	return handlers
}

// RegisterHttpHandler wraps a standard http.Handler and registers it
func (r *fiberRouteBuilder) RegisterHttpHandler(method string, path string, handler http.Handler) contracts.RouteBuilder {
	// Convert the http.Handler to a Fiber handler
	fiberHandler := adaptor.HTTPHandler(handler)
	r.app.Add(method, path, fiberHandler)
	return r
}

// Implement for the group builder
func (g *fiberRouteGroup) RegisterHttpHandler(method string, path string, handler http.Handler) {
	fiberHandler := adaptor.HTTPHandler(handler)
	g.group.Add(method, path, fiberHandler)
}

package customfiber

import (
	"context"
	"fmt"
	"strings"

	"local/go-infra/pkg/adapter/http/contracts"
	"local/go-infra/pkg/adapter/http/fiber_adapter/config"
	"local/go-infra/pkg/adapter/http/fiber_adapter/handlers"
	"local/go-infra/pkg/adapter/http/fiber_adapter/middlewares/log"
	"local/go-infra/pkg/application/constants"
	"local/go-infra/pkg/logger"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"go.opentelemetry.io/otel/metric"
)

type fiberHttpServer struct {
	app          *fiber.App
	config       *config.FiberHttpOptions
	log          logger.Logger
	meter        metric.Meter
	routeBuilder contracts.RouteBuilder
}

// Compile-time assertion that fiberHttpServer implements contracts.HttpServer
var _ contracts.HttpServer = (*fiberHttpServer)(nil)

func NewFiberHttpServer(
	cfg *config.FiberHttpOptions,
	logger logger.Logger,
	meter metric.Meter,
) contracts.HttpServer {
	app := fiber.New(fiber.Config{
		AppName:      cfg.Name,
		ReadTimeout:  constants.ReadTimeout,
		WriteTimeout: constants.WriteTimeout,
		BodyLimit:    2 * 1024 * 1024, // 2MB
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			// Use custom error handler
			return handlers.ProblemDetailErrorHandlerFunc(err, c, logger)
		},
	})

	return &fiberHttpServer{
		app:          app,
		config:       cfg,
		log:          logger,
		meter:        meter,
		routeBuilder: NewFiberRouteBuilder(app),
	}
}

func (s *fiberHttpServer) RunHttpServer(configFunc ...func(instance interface{})) error {
	if len(configFunc) > 0 && configFunc[0] != nil {
		configFunc[0](s.app)
	}

	return s.app.Listen(s.config.Port)
}

func (s *fiberHttpServer) GracefulShutdown(ctx context.Context) error {
	return s.app.ShutdownWithContext(ctx)
}

func (s *fiberHttpServer) ApplyVersioningFromHeader() {
	s.app.Use(func(c *fiber.Ctx) error {
		apiVersion := c.Get("version")
		if apiVersion != "" {
			c.Path(fmt.Sprintf("/%s%s", apiVersion, c.Path()))
		}
		return c.Next()
	})
}

func (s *fiberHttpServer) GetServerInstance() interface{} {
	return s.app
}

func (s *fiberHttpServer) Logger() logger.Logger {
	return s.log
}

func (s *fiberHttpServer) Cfg() contracts.HttpOptions {
	return s.config
}

func (s *fiberHttpServer) RouteBuilder() contracts.RouteBuilder {
	return s.routeBuilder
}

func (s *fiberHttpServer) AddMiddlewares(middlewares ...contracts.MiddlewareFunc) {
	if len(middlewares) > 0 {
		for _, m := range middlewares {
			s.app.Use(convertFiberMiddleware(m))
		}
	}
}

// convertFiberMiddleware converts contracts.MiddlewareFunc to fiber middleware
func convertFiberMiddleware(m contracts.MiddlewareFunc) fiber.Handler {
	return func(c *fiber.Ctx) error {
		adapter := NewFiberContextAdapter(c)
		handler := m(func(ctx contracts.Context) error {
			return c.Next()
		})
		return handler(adapter)
	}
}

func (s *fiberHttpServer) ConfigGroup(groupName string, groupFunc func(group contracts.RouteGroup)) {
	fiberGroup := s.app.Group(groupName)
	routeGroup := &fiberRouteGroup{group: fiberGroup}
	groupFunc(routeGroup)
}

func (s *fiberHttpServer) SetupDefaultMiddlewares() {
	skipper := func(c *fiber.Ctx) bool {
		path := c.Path()
		return strings.Contains(path, "swagger") ||
			strings.Contains(path, "metrics") ||
			strings.Contains(path, "health") ||
			strings.Contains(path, "favicon.ico")
	}

	// Request ID middleware
	s.app.Use(requestid.New())

	// Logger middleware
	s.app.Use(log.FiberLogger(s.log, log.WithSkipper(skipper)))

	// Compression middleware
	s.app.Use(compress.New(compress.Config{
		Level: constants.GzipLevel,
		Next:  skipper,
	}))

	// TODO: Add more middlewares as needed:
	// - OpenTelemetry tracing
	// - OpenTelemetry metrics
	// - Rate limiting
	// - Problem detail middleware
}

// Helper to create skipper from URL patterns
func createSkipper(patterns ...string) func(*fiber.Ctx) bool {
	return func(c *fiber.Ctx) bool {
		path := c.Path()
		for _, pattern := range patterns {
			if strings.Contains(path, pattern) {
				return true
			}
		}
		return false
	}
}

// apiVersionMiddleware adds API version to path from header
func apiVersionMiddleware(c *fiber.Ctx) error {
	apiVersion := c.Get("version")
	if apiVersion != "" {
		originalPath := c.Path()
		newPath := fmt.Sprintf("/%s%s", apiVersion, originalPath)
		c.Path(newPath)
	}
	return c.Next()
}

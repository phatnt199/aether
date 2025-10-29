package log

import (
	"fmt"
	"time"

	"local/go-infra/pkg/logger"

	"github.com/gofiber/fiber/v2"
)

// FiberLogger returns a Fiber middleware which will log incoming requests
func FiberLogger(l logger.Logger, opts ...Option) fiber.Handler {
	cfg := config{}
	for _, opt := range opts {
		opt.apply(&cfg)
	}

	if cfg.Skipper == nil {
		cfg.Skipper = func(c *fiber.Ctx) bool { return false }
	}

	return func(c *fiber.Ctx) error {
		if cfg.Skipper(c) {
			return c.Next()
		}

		start := time.Now()

		// Process request
		err := c.Next()

		// Log after request is processed
		latency := time.Since(start)

		fields := map[string]interface{}{
			"remote_ip":  c.IP(),
			"latency":    latency.String(),
			"host":       c.Hostname(),
			"request":    fmt.Sprintf("%s %s", c.Method(), c.OriginalURL()),
			"status":     c.Response().StatusCode(),
			"size":       len(c.Response().Body()),
			"user_agent": c.Get(fiber.HeaderUserAgent),
			"request_id": c.Get(fiber.HeaderXRequestID),
		}

		if err != nil {
			fields["error"] = err.Error()
		}

		status := c.Response().StatusCode()
		switch {
		case status >= 500:
			l.Errorw("FiberServer logger middleware: Server error", fields)
		case status >= 400:
			l.Errorw("FiberServer logger middleware: Client error", fields)
		case status >= 300:
			l.Infow("FiberServer logger middleware: Redirection", fields)
		default:
			l.Infow("FiberServer logger middleware: Success", fields)
		}

		return err
	}
}

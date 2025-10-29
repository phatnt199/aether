package log

import "github.com/gofiber/fiber/v2"

type config struct {
	Skipper func(c *fiber.Ctx) bool
}

type Option interface {
	apply(*config)
}

type skipperOption struct {
	skipper func(c *fiber.Ctx) bool
}

func (o skipperOption) apply(c *config) {
	c.Skipper = o.skipper
}

func WithSkipper(skipper func(c *fiber.Ctx) bool) Option {
	return skipperOption{skipper: skipper}
}

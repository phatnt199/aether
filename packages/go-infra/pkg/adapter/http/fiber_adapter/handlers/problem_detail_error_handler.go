package handlers

import (
	"local/go-infra/pkg/logger"

	"local/go-infra/pkg/adapter/http/httperrors/problemdetails"

	"emperror.dev/errors"
	"github.com/gofiber/fiber/v2"
)

func ProblemDetailErrorHandlerFunc(
	err error,
	c *fiber.Ctx,
	logger logger.Logger,
) error {
	var problem problemdetails.ProblemDetailErr

	// if error was not problem detail we will convert the error to a problem detail
	if ok := errors.As(err, &problem); !ok {
		problem = problemdetails.ParseError(err)
	}

	if problem != nil {
		// Write problem detail to response
		c.Set(fiber.HeaderContentType, "application/problem+json")
		c.Status(problem.GetStatus())
		return c.JSON(problem)
	}

	return err
}

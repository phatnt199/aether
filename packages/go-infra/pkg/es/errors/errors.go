package errors

import (
	"fmt"

	customErrors "local/go-infra/pkg/adapter/http/httperrors/customerrors"

	"emperror.dev/errors"
)

var (
	EventAlreadyExistsError = customErrors.NewConflictError(
		fmt.Sprintf("domain_events event already exists in event registry"),
	)
	InvalidEventTypeError = errors.New("invalid event type")
)

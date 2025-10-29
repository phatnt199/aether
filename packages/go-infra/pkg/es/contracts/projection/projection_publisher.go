package projection

import (
	"context"

	"local/go-infra/pkg/es/models"
)

type IProjectionPublisher interface {
	Publish(ctx context.Context, streamEvent *models.StreamEvent) error
}

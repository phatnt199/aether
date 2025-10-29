package projection

import (
	"context"

	"local/go-infra/pkg/es/models"
)

type IProjection interface {
	ProcessEvent(ctx context.Context, streamEvent *models.StreamEvent) error
}

package consumer

import (
	"context"

	"local/go-infra/pkg/core/messaging/types"
)

type ConsumerHandler interface {
	Handle(ctx context.Context, consumeContext types.MessageConsumeContext) error
}

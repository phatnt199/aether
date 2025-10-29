package consumer

import (
	"context"

	"local/go-infra/pkg/core/messaging/types"
)

type Consumer interface {
	Start(ctx context.Context) error
	Stop() error
	ConnectHandler(handler ConsumerHandler)
	IsConsumed(func(message types.IMessage))
	GetName() string
}

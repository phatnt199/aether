package producer

import (
	"context"

	"local/go-infra/pkg/core/messaging/types"
	"local/go-infra/pkg/core/metadata"
)

type Producer interface {
	PublishMessage(ctx context.Context, message types.IMessage, meta metadata.Metadata) error
	PublishMessageWithTopicName(
		ctx context.Context,
		message types.IMessage,
		meta metadata.Metadata,
		topicOrExchangeName string,
	) error
	IsProduced(func(message types.IMessage))
}

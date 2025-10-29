package bus

import (
	consumer2 "local/go-infra/pkg/core/messaging/consumer"
	"local/go-infra/pkg/core/messaging/producer"
)

type Bus interface {
	producer.Producer
	consumer2.BusControl
	consumer2.ConsumerConnector
}

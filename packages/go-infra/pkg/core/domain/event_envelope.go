package domain

import (
	"local/go-infra/pkg/core/metadata"
)

type EventEnvelope struct {
	EventData interface{}
	Metadata  metadata.Metadata
}

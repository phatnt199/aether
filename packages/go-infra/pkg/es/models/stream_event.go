package models

import (
	"local/go-infra/pkg/core/domain"
	"local/go-infra/pkg/core/metadata"

	uuid "github.com/satori/go.uuid"
)

type StreamEvent struct {
	EventID  uuid.UUID
	Version  int64
	Position int64
	Event    domain.IDomainEvent
	Metadata metadata.Metadata
}

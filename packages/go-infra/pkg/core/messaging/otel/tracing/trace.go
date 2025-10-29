package tracing

import (
	"local/go-infra/pkg/otel/tracing"

	"go.opentelemetry.io/otel/trace"
)

var MessagingTracer trace.Tracer

func init() {
	MessagingTracer = tracing.NewAppTracer(
		"local/go-infra/pkg/messaging",
	) // instrumentation name
}

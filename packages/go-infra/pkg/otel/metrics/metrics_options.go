package metrics

import (
	"local/go-infra/pkg/application/config"
	"local/go-infra/pkg/application/environment"
	typeMapper "local/go-infra/pkg/reflection/typemapper"

	"github.com/iancoleman/strcase"
)

type OTLPProvider struct {
	Name         string            `mapstructure:"name"`
	Enabled      bool              `mapstructure:"enabled"`
	OTLPEndpoint string            `mapstructure:"otlpEndpoint"`
	OTLPHeaders  map[string]string `mapstructure:"otlpHeaders"`
}

type MetricsOptions struct {
	Host                      string         `mapstructure:"host"`
	Port                      string         `mapstructure:"port"`
	ServiceName               string         `mapstructure:"serviceName"`
	Version                   string         `mapstructure:"version"`
	MetricsRoutePath          string         `mapstructure:"metricsRoutePath"`
	EnableHostMetrics         bool           `mapstructure:"enableHostMetrics"`
	UseStdout                 bool           `mapstructure:"useStdout"`
	InstrumentationName       string         `mapstructure:"instrumentationName"`
	UseOTLP                   bool           `mapstructure:"useOTLP"`
	OTLPProviders             []OTLPProvider `mapstructure:"otlpProviders"`
	ElasticApmExporterOptions *OTLPProvider  `mapstructure:"elasticApmExporterOptions"`
	UptraceExporterOptions    *OTLPProvider  `mapstructure:"uptraceExporterOptions"`
	SignozExporterOptions     *OTLPProvider  `mapstructure:"signozExporterOptions"`
}

func ProvideMetricsConfig(
	environment environment.Environment,
) (*MetricsOptions, error) {
	optionName := strcase.ToLowerCamel(
		typeMapper.GetGenericTypeNameByT[MetricsOptions](),
	)

	return config.BindConfigKey[*MetricsOptions](optionName, environment)
}

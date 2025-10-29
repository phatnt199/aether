package fxapp

import (
	"local/go-infra/pkg/adapter/fxapp/contracts"
	"local/go-infra/pkg/application/environment"
	"local/go-infra/pkg/logger"
	loggerConfig "local/go-infra/pkg/logger/config"
	"local/go-infra/pkg/logger/zap"

	"go.uber.org/fx"
)

type applicationBuilder struct {
	provides    []interface{}
	decorates   []interface{}
	options     []fx.Option
	logger      logger.Logger
	environment environment.Environment
}

func NewApplicationBuilder(environments ...environment.Environment) contracts.ApplicationBuilder {
	env := environment.ConfigAppEnv(environments...)

	var logger logger.Logger
	logoption, err := loggerConfig.ProvideLogConfig(env)
	if err != nil || logoption == nil {
		logger = zap.NewZapLogger(logoption, env)
	} else {
		logger = zap.NewZapLogger(logoption, env)
	}

	return &applicationBuilder{logger: logger, environment: env}
}

func (a *applicationBuilder) ProvideModule(module fx.Option) {
	a.options = append(a.options, module)
}

func (a *applicationBuilder) Provide(constructors ...interface{}) {
	a.provides = append(a.provides, constructors...)
}

func (a *applicationBuilder) Decorate(constructors ...interface{}) {
	a.decorates = append(a.decorates, constructors...)
}

func (a *applicationBuilder) Build() contracts.Application {
	app := NewApplication(a.provides, a.decorates, a.options, a.logger, a.environment)

	return app
}

func (a *applicationBuilder) GetProvides() []interface{} {
	return a.provides
}

func (a *applicationBuilder) GetDecorates() []interface{} {
	return a.decorates
}

func (a *applicationBuilder) Options() []fx.Option {
	return a.options
}

func (a *applicationBuilder) Logger() logger.Logger {
	return a.logger
}

func (a *applicationBuilder) Environment() environment.Environment {
	return a.environment
}

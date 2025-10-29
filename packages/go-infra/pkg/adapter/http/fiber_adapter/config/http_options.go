package config

import (
	"fmt"
	"local/go-infra/pkg/application/config"
	"local/go-infra/pkg/application/environment"
	typeMapper "local/go-infra/pkg/reflection/typemapper"
	"net/url"

	"github.com/iancoleman/strcase"
)

var optionName = strcase.ToLowerCamel(typeMapper.GetGenericTypeNameByT[FiberHttpOptions]())

type FiberHttpOptions struct {
	Port                string   `mapstructure:"port"                validate:"required" env:"TcpPort"`
	Development         bool     `mapstructure:"development"                             env:"Development"`
	BasePath            string   `mapstructure:"basePath"            validate:"required" env:"BasePath"`
	DebugErrorsResponse bool     `mapstructure:"debugErrorsResponse"                     env:"DebugErrorsResponse"`
	IgnoreLogUrls       []string `mapstructure:"ignoreLogUrls"`
	Timeout             int      `mapstructure:"timeout"                                 env:"Timeout"`
	Host                string   `mapstructure:"host"                                    env:"Host"`
	Name                string   `mapstructure:"name"                                    env:"ShortTypeName"`
}

func (c *FiberHttpOptions) GetPort() string {
	return c.Port
}

func (c *FiberHttpOptions) GetHost() string {
	return c.Host
}

func (c *FiberHttpOptions) GetName() string {
	return c.Name
}

func (c *FiberHttpOptions) GetBasePath() string {
	return c.BasePath
}

func (c *FiberHttpOptions) IsDevelopment() bool {
	return c.Development
}

func (c *FiberHttpOptions) Address() string {
	return fmt.Sprintf("%s%s", c.Host, c.Port)
}

func (c *FiberHttpOptions) BasePathAddress() string {
	path, err := url.JoinPath(c.Address(), c.BasePath)
	if err != nil {
		return ""
	}
	return path
}

func ProvideConfig(environment environment.Environment) (*FiberHttpOptions, error) {
	return config.BindConfigKey[*FiberHttpOptions](optionName, environment)
}

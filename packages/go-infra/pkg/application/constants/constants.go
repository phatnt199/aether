package constants

import "time"

const (
	ConfigPath    = "CONFIG_PATH"
	APP_ENV       = "APP_ENV"
	APP_NAME      = "Go Project"
	APP_ROOT_PATH = "APP_ROOT"
	APP_VERSION   = "1.0.0"
	Json          = "json"
	GRPC          = "GRPC"
	METHOD        = "METHOD"
	NAME          = "NAME"
	METADATA      = "METADATA"
	REQUEST       = "REQUEST"
	REPLY         = "REPLY"
	TIME          = "TIME"
	BodyLimit     = "2M"
	GzipLevel     = 5
	ReadTimeout   = 15 * time.Second
	WriteTimeout  = 15 * time.Second
	DEV_ENV       = "development"
	PROD_ENV      = "production"
	STAGING_ENV   = "staging"
)

const (
	ErrBadRequestTitle          = "Bad Request"
	ErrConflictTitle            = "Conflict Error"
	ErrNotFoundTitle            = "Not Found"
	ErrUnauthorizedTitle        = "Unauthorized"
	ErrForbiddenTitle           = "Forbidden"
	ErrRequestTimeoutTitle      = "Request Timeout"
	ErrInternalServerErrorTitle = "Internal Server Error"
	ErrDomainTitle              = "Domain Model Error"
	ErrApplicationTitle         = "Application Service Error"
	ErrApiTitle                 = "Api Error"
)

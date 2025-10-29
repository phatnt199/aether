package defaultlogger

import (
	"local/go-infra/pkg/application/constants"
	"local/go-infra/pkg/logger"
	"local/go-infra/pkg/logger/config"
	"local/go-infra/pkg/logger/models"
	"local/go-infra/pkg/logger/zap"
	"os"
)

var l logger.Logger

func initLogger() {
	logType := os.Getenv("LogConfig_LogType")

	switch logType {
	case "Zap", "":
		l = zap.NewZapLogger(
			&config.LogOptions{LogType: models.Zap, CallerEnabled: false},
			constants.DEV_ENV,
		)
	default:
	}
}

func GetLogger() logger.Logger {
	if l == nil {
		initLogger()
	}

	return l
}

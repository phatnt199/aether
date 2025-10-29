package postgres

import (
	"context"
	"time"

	gormlogger "gorm.io/gorm/logger"

	"local/go-infra/pkg/logger"
)

// gormLogger implements GORM's logger interface using our custom logger
type gormLogger struct {
	logger        logger.Logger
	logLevel      gormlogger.LogLevel
	slowThreshold time.Duration
}

// newGormLogger creates a new GORM logger
func newGormLogger(log logger.Logger, level gormlogger.LogLevel, slowThreshold time.Duration) gormlogger.Interface {
	if slowThreshold == 0 {
		slowThreshold = 200 * time.Millisecond
	}

	return &gormLogger{
		logger:        log,
		logLevel:      level,
		slowThreshold: slowThreshold,
	}
}

// LogMode sets log level
func (l *gormLogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	newLogger := *l
	newLogger.logLevel = level
	return &newLogger
}

// Info logs info level message
func (l *gormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	if l.logLevel >= gormlogger.Info {
		l.logger.Infof(msg, data...)
	}
}

// Warn logs warn level message
func (l *gormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	if l.logLevel >= gormlogger.Warn {
		l.logger.Warnf(msg, data...)
	}
}

// Error logs error level message
func (l *gormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	if l.logLevel >= gormlogger.Error {
		l.logger.Errorf(msg, data...)
	}
}

// Trace logs SQL queries
func (l *gormLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	if l.logLevel <= gormlogger.Silent {
		return
	}

	elapsed := time.Since(begin)
	sql, rows := fc()

	fields := logger.Fields{
		"elapsed": elapsed,
		"rows":    rows,
		"sql":     sql,
	}

	switch {
	case err != nil && l.logLevel >= gormlogger.Error:
		fields["error"] = err.Error()
		l.logger.Errorw("database query error", fields)

	case elapsed > l.slowThreshold && l.slowThreshold != 0 && l.logLevel >= gormlogger.Warn:
		fields["threshold"] = l.slowThreshold
		l.logger.Errorw("slow query detected", fields)

	case l.logLevel >= gormlogger.Info:
		l.logger.Debugw("database query executed", fields)
	}
}

package utils

import (
	"fmt"
	"strconv"
	"time"
)

// ToString converts any value to a string representation.
// It handles various types intelligently:
// - string: returns as-is
// - int, int8, int16, int32, int64: converted using strconv
// - uint, uint8, uint16, uint32, uint64: converted using strconv
// - float32, float64: converted using strconv
// - bool: returns "true" or "false"
// - []byte: converts to string
// - other types: uses fmt.Sprintf("%v")
//
// Example:
//
//	str := utils.ToString(42)           // "42"
//	str = utils.ToString(3.14)          // "3.14"
//	str = utils.ToString(true)          // "true"
//	str = utils.ToString([]byte("hi"))  // "hi"
func ToString(value interface{}) string {
	if value == nil {
		return ""
	}

	switch v := value.(type) {
	case string:
		return v
	case int:
		return strconv.Itoa(v)
	case int8:
		return strconv.FormatInt(int64(v), 10)
	case int16:
		return strconv.FormatInt(int64(v), 10)
	case int32:
		return strconv.FormatInt(int64(v), 10)
	case int64:
		return strconv.FormatInt(v, 10)
	case uint:
		return strconv.FormatUint(uint64(v), 10)
	case uint8:
		return strconv.FormatUint(uint64(v), 10)
	case uint16:
		return strconv.FormatUint(uint64(v), 10)
	case uint32:
		return strconv.FormatUint(uint64(v), 10)
	case uint64:
		return strconv.FormatUint(v, 10)
	case float32:
		return strconv.FormatFloat(float64(v), 'f', -1, 32)
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(v)
	case []byte:
		return string(v)
	case fmt.Stringer:
		return v.String()
	default:
		return fmt.Sprintf("%v", v)
	}
}

// ToInt converts a value to an int.
// It handles string, numeric types, and returns 0 for unconvertible values.
//
// Example:
//
//	num := utils.ToInt("42")      // 42
//	num = utils.ToInt(3.14)       // 3
//	num = utils.ToInt("invalid")  // 0
func ToInt(value interface{}) int {
	if value == nil {
		return 0
	}

	switch v := value.(type) {
	case int:
		return v
	case int8:
		return int(v)
	case int16:
		return int(v)
	case int32:
		return int(v)
	case int64:
		return int(v)
	case uint:
		return int(v)
	case uint8:
		return int(v)
	case uint16:
		return int(v)
	case uint32:
		return int(v)
	case uint64:
		return int(v)
	case float32:
		return int(v)
	case float64:
		return int(v)
	case string:
		i, _ := strconv.Atoi(v)
		return i
	case bool:
		if v {
			return 1
		}
		return 0
	default:
		return 0
	}
}

// ToInt64 converts a value to an int64.
// Similar to ToInt but returns int64.
//
// Example:
//
//	num := utils.ToInt64("42")     // 42
//	num = utils.ToInt64(3.14)      // 3
func ToInt64(value interface{}) int64 {
	if value == nil {
		return 0
	}

	switch v := value.(type) {
	case int:
		return int64(v)
	case int8:
		return int64(v)
	case int16:
		return int64(v)
	case int32:
		return int64(v)
	case int64:
		return v
	case uint:
		return int64(v)
	case uint8:
		return int64(v)
	case uint16:
		return int64(v)
	case uint32:
		return int64(v)
	case uint64:
		return int64(v)
	case float32:
		return int64(v)
	case float64:
		return int64(v)
	case string:
		i, _ := strconv.ParseInt(v, 10, 64)
		return i
	case bool:
		if v {
			return 1
		}
		return 0
	default:
		return 0
	}
}

// ToFloat64 converts a value to a float64.
//
// Example:
//
//	num := utils.ToFloat64("3.14")  // 3.14
//	num = utils.ToFloat64(42)       // 42.0
func ToFloat64(value interface{}) float64 {
	if value == nil {
		return 0
	}

	switch v := value.(type) {
	case float32:
		return float64(v)
	case float64:
		return v
	case int:
		return float64(v)
	case int8:
		return float64(v)
	case int16:
		return float64(v)
	case int32:
		return float64(v)
	case int64:
		return float64(v)
	case uint:
		return float64(v)
	case uint8:
		return float64(v)
	case uint16:
		return float64(v)
	case uint32:
		return float64(v)
	case uint64:
		return float64(v)
	case string:
		f, _ := strconv.ParseFloat(v, 64)
		return f
	case bool:
		if v {
			return 1.0
		}
		return 0.0
	default:
		return 0
	}
}

// ToBool converts a value to a boolean.
// The following are considered true:
// - boolean true
// - non-zero numbers
// - strings: "1", "t", "T", "true", "TRUE", "True", "yes", "YES", "Yes", "y", "Y"
//
// Example:
//
//	b := utils.ToBool("true")  // true
//	b = utils.ToBool(1)        // true
//	b = utils.ToBool("yes")    // true
//	b = utils.ToBool(0)        // false
func ToBool(value interface{}) bool {
	if value == nil {
		return false
	}

	switch v := value.(type) {
	case bool:
		return v
	case int, int8, int16, int32, int64:
		return ToInt64(v) != 0
	case uint, uint8, uint16, uint32, uint64:
		return ToInt64(v) != 0
	case float32, float64:
		return ToFloat64(v) != 0
	case string:
		// Try parsing as boolean first
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
		// Check common affirmative strings
		switch v {
		case "yes", "YES", "Yes", "y", "Y", "1":
			return true
		}
		return false
	default:
		return false
	}
}

// ParseDuration parses a duration string.
// Supports Go's time.Duration format (e.g., "1h30m", "45s", "100ms").
// Returns zero duration and error for invalid inputs.
//
// Example:
//
//	d, err := utils.ParseDuration("1h30m")  // 1.5 hours
//	d, err = utils.ParseDuration("45s")     // 45 seconds
//	d, err = utils.ParseDuration("100ms")   // 100 milliseconds
func ParseDuration(s string) (time.Duration, error) {
	return time.ParseDuration(s)
}

// MustParseDuration parses a duration string and panics on error.
// Use this only for constants or when you're certain the input is valid.
//
// Example:
//
//	timeout := utils.MustParseDuration("30s")  // 30 seconds
//	// utils.MustParseDuration("invalid") // panics
func MustParseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		panic(fmt.Sprintf("invalid duration: %s", s))
	}
	return d
}

// ParseTime parses a time string using the provided layout.
// Returns zero time and error for invalid inputs.
//
// Common layouts:
// - RFC3339: "2006-01-02T15:04:05Z07:00"
// - RFC3339Nano: "2006-01-02T15:04:05.999999999Z07:00"
// - DateOnly: "2006-01-02"
// - DateTime: "2006-01-02 15:04:05"
//
// Example:
//
//	t, err := utils.ParseTime("2024-01-15T10:30:00Z", time.RFC3339)
//	t, err = utils.ParseTime("2024-01-15", "2006-01-02")
func ParseTime(value, layout string) (time.Time, error) {
	return time.Parse(layout, value)
}

// ParseTimeRFC3339 parses a time string in RFC3339 format.
// This is a convenience function for the most common time format.
//
// Example:
//
//	t, err := utils.ParseTimeRFC3339("2024-01-15T10:30:00Z")
func ParseTimeRFC3339(value string) (time.Time, error) {
	return time.Parse(time.RFC3339, value)
}

// ParseTimeDate parses a date string in "YYYY-MM-DD" format.
//
// Example:
//
//	t, err := utils.ParseTimeDate("2024-01-15")
func ParseTimeDate(value string) (time.Time, error) {
	return time.Parse("2006-01-02", value)
}

// ParseTimeDateTime parses a datetime string in "YYYY-MM-DD HH:MM:SS" format.
//
// Example:
//
//	t, err := utils.ParseTimeDateTime("2024-01-15 10:30:00")
func ParseTimeDateTime(value string) (time.Time, error) {
	return time.Parse("2006-01-02 15:04:05", value)
}

// MustParseTime parses a time string and panics on error.
// Use this only for constants or when you're certain the input is valid.
//
// Example:
//
//	t := utils.MustParseTime("2024-01-15T10:30:00Z", time.RFC3339)
func MustParseTime(value, layout string) time.Time {
	t, err := time.Parse(layout, value)
	if err != nil {
		panic(fmt.Sprintf("invalid time: %s", value))
	}
	return t
}

// FormatTime formats a time value using the provided layout.
//
// Example:
//
//	str := utils.FormatTime(time.Now(), time.RFC3339)
//	str = utils.FormatTime(time.Now(), "2006-01-02")
func FormatTime(t time.Time, layout string) string {
	return t.Format(layout)
}

// FormatTimeRFC3339 formats a time value in RFC3339 format.
//
// Example:
//
//	str := utils.FormatTimeRFC3339(time.Now())  // "2024-01-15T10:30:00Z"
func FormatTimeRFC3339(t time.Time) string {
	return t.Format(time.RFC3339)
}

// FormatTimeDate formats a time value as a date string.
//
// Example:
//
//	str := utils.FormatTimeDate(time.Now())  // "2024-01-15"
func FormatTimeDate(t time.Time) string {
	return t.Format("2006-01-02")
}

// FormatTimeDateTime formats a time value as a datetime string.
//
// Example:
//
//	str := utils.FormatTimeDateTime(time.Now())  // "2024-01-15 10:30:00"
func FormatTimeDateTime(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}

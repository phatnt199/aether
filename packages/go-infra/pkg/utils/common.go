package utils

import "fmt"

// Ternary is a generic ternary operator that returns trueVal if condition is true,
// otherwise returns falseVal.
//
// Example:
//
//	result := utils.Ternary(age >= 18, "adult", "minor")
//	max := utils.Ternary(a > b, a, b)
func Ternary[T any](condition bool, trueVal, falseVal T) T {
	if condition {
		return trueVal
	}
	return falseVal
}

// Min returns the minimum value among the provided values.
// Requires at least one value.
//
// Example:
//
//	min := utils.Min(5, 2, 8, 1, 9)  // 1
func Min[T interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64 | ~string
}](values ...T) T {
	if len(values) == 0 {
		var zero T
		return zero
	}

	min := values[0]
	for _, v := range values[1:] {
		if v < min {
			min = v
		}
	}
	return min
}

// Max returns the maximum value among the provided values.
// Requires at least one value.
//
// Example:
//
//	max := utils.Max(5, 2, 8, 1, 9)  // 9
func Max[T interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64 | ~string
}](values ...T) T {
	if len(values) == 0 {
		var zero T
		return zero
	}

	max := values[0]
	for _, v := range values[1:] {
		if v > max {
			max = v
		}
	}
	return max
}

// Clamp restricts a value to be within the specified range [min, max].
//
// Example:
//
//	val := utils.Clamp(15, 0, 10)   // 10 (clamped to max)
//	val = utils.Clamp(-5, 0, 10)    // 0 (clamped to min)
//	val = utils.Clamp(5, 0, 10)     // 5 (within range)
func Clamp[T interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64
}](value, min, max T) T {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

// InRange checks if a value is within the specified range [min, max] (inclusive).
//
// Example:
//
//	utils.InRange(5, 0, 10)   // true
//	utils.InRange(15, 0, 10)  // false
func InRange[T interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64
}](value, min, max T) bool {
	return value >= min && value <= max
}

// Abs returns the absolute value of a number.
//
// Example:
//
//	abs := utils.Abs(-5)    // 5
//	abs = utils.Abs(3.14)   // 3.14
func Abs[T interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~float32 | ~float64
}](value T) T {
	if value < 0 {
		return -value
	}
	return value
}

// Sum returns the sum of all provided values.
//
// Example:
//
//	sum := utils.Sum(1, 2, 3, 4, 5)  // 15
func Sum[T interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64
}](values ...T) T {
	var sum T
	for _, v := range values {
		sum += v
	}
	return sum
}

// Average calculates the average of all provided values.
// Returns 0 if no values are provided.
//
// Example:
//
//	avg := utils.Average(1.0, 2.0, 3.0, 4.0, 5.0)  // 3.0
func Average[T interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64
}](values ...T) float64 {
	if len(values) == 0 {
		return 0
	}
	var sum T
	for _, v := range values {
		sum += v
	}
	return float64(sum) / float64(len(values))
}

// IsZero checks if a value is the zero value for its type.
//
// Example:
//
//	utils.IsZero(0)      // true
//	utils.IsZero("")     // true
//	utils.IsZero(false)  // true
//	utils.IsZero(42)     // false
func IsZero[T comparable](value T) bool {
	var zero T
	return value == zero
}

// IsNotZero checks if a value is not the zero value for its type.
//
// Example:
//
//	utils.IsNotZero(42)    // true
//	utils.IsNotZero(0)     // false
func IsNotZero[T comparable](value T) bool {
	return !IsZero(value)
}

// DefaultIfZero returns the default value if the value is zero, otherwise returns the value.
//
// Example:
//
//	val := utils.DefaultIfZero(0, 42)       // 42
//	val = utils.DefaultIfZero(10, 42)       // 10
//	str := utils.DefaultIfZero("", "default")  // "default"
func DefaultIfZero[T comparable](value, defaultValue T) T {
	if IsZero(value) {
		return defaultValue
	}
	return value
}

// Swap swaps two values.
//
// Example:
//
//	a, b := 1, 2
//	a, b = utils.Swap(a, b)  // a = 2, b = 1
func Swap[T any](a, b T) (T, T) {
	return b, a
}

// Between checks if a value is between min and max (exclusive).
//
// Example:
//
//	utils.Between(5, 0, 10)   // true
//	utils.Between(0, 0, 10)   // false
//	utils.Between(10, 0, 10)  // false
func Between[T interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
		~float32 | ~float64
}](value, min, max T) bool {
	return value > min && value < max
}

// RetryFunc retries a function up to maxAttempts times until it succeeds.
// Returns the error from the last attempt if all attempts fail.
//
// Example:
//
//	err := utils.RetryFunc(3, func() error {
//	    return makeAPICall()
//	})
func RetryFunc(maxAttempts int, fn func() error) error {
	var err error
	for i := 0; i < maxAttempts; i++ {
		err = fn()
		if err == nil {
			return nil
		}
	}
	return err
}

// Must panics if the error is not nil, otherwise returns the value.
// Use this for initialization code where errors should never happen.
//
// Example:
//
//	config := utils.Must(loadConfig())
//	// If loadConfig() returns an error, the program panics
func Must[T any](value T, err error) T {
	if err != nil {
		panic(err)
	}
	return value
}

// MustNoError panics if the error is not nil.
// Use this when you have an operation that returns only an error.
//
// Example:
//
//	utils.MustNoError(db.Ping())
//	// If db.Ping() returns an error, the program panics
func MustNoError(err error) {
	if err != nil {
		panic(err)
	}
}

// IgnoreError returns the value and ignores the error.
// Use this sparingly and only when you're certain the error can be safely ignored.
//
// Example:
//
//	count := utils.IgnoreError(strconv.Atoi("not a number"))
//	// count = 0, error is ignored
func IgnoreError[T any](value T, _ error) T {
	return value
}

// Try executes a function and returns its result and any error.
// This is a convenience wrapper for better error handling syntax.
//
// Example:
//
//	result, err := utils.Try(func() (int, error) {
//	    return someOperation()
//	})
func Try[T any](fn func() (T, error)) (T, error) {
	return fn()
}

// TryValue executes a function that returns only a value and wraps any panic as an error.
//
// Example:
//
//	result, err := utils.TryValue(func() int {
//	    return riskyOperation()  // might panic
//	})
func TryValue[T any](fn func() T) (result T, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic: %v", r)
		}
	}()
	result = fn()
	return
}

// TryNoValue executes a function that returns nothing and wraps any panic as an error.
//
// Example:
//
//	err := utils.TryNoValue(func() {
//	    riskyOperation()  // might panic
//	})
func TryNoValue(fn func()) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic: %v", r)
		}
	}()
	fn()
	return
}

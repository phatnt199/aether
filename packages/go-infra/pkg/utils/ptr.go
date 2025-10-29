package utils

// Ptr returns a pointer to the given value of any type.
// This is useful when you need to pass a pointer to a literal value or
// convert a value to a pointer inline.
//
// Example:
//
//	name := utils.Ptr("John Doe")
//	age := utils.Ptr(30)
//	config := Config{
//	    MaxRetries: utils.Ptr(3),
//	    Timeout:    utils.Ptr(time.Second * 30),
//	}
func Ptr[T any](v T) *T {
	return &v
}

// Value returns the value of a pointer or a default value if the pointer is nil.
// This is safer than dereferencing a pointer directly as it handles nil cases.
//
// Example:
//
//	var name *string
//	str := utils.Value(name, "default") // returns "default"
//
//	userName := utils.Ptr("John")
//	str = utils.Value(userName, "default") // returns "John"
func Value[T any](ptr *T, defaultValue T) T {
	if ptr == nil {
		return defaultValue
	}
	return *ptr
}

// ValueOrZero returns the value of a pointer or the zero value of type T if nil.
// This is useful when you want to safely dereference a pointer without providing
// an explicit default value.
//
// Example:
//
//	var count *int
//	num := utils.ValueOrZero(count) // returns 0
//
//	value := utils.Ptr(42)
//	num = utils.ValueOrZero(value) // returns 42
func ValueOrZero[T any](ptr *T) T {
	if ptr == nil {
		var zero T
		return zero
	}
	return *ptr
}

// IsNil checks if a pointer is nil.
// While this seems trivial, it's useful in generic contexts and provides
// a consistent API with the rest of the pointer utilities.
//
// Example:
//
//	var name *string
//	if utils.IsNil(name) {
//	    // handle nil case
//	}
func IsNil[T any](ptr *T) bool {
	return ptr == nil
}

// IsNotNil checks if a pointer is not nil.
// This is the opposite of IsNil and can make code more readable in certain contexts.
//
// Example:
//
//	if utils.IsNotNil(user.Email) {
//	    sendEmail(*user.Email)
//	}
func IsNotNil[T any](ptr *T) bool {
	return ptr != nil
}

// Equal compares two pointers for equality, handling nil cases.
// Two pointers are considered equal if:
// - Both are nil, or
// - Both point to equal values
//
// Example:
//
//	a := utils.Ptr(42)
//	b := utils.Ptr(42)
//	c := utils.Ptr(43)
//	utils.Equal(a, b) // true (same value)
//	utils.Equal(a, c) // false (different values)
//	utils.Equal[int](nil, nil) // true (both nil)
func Equal[T comparable](a, b *T) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return *a == *b
}

// CoalescePtr returns the first non-nil pointer from the provided list,
// or nil if all pointers are nil. This is useful for providing fallback values.
//
// Example:
//
//	var primary *string
//	secondary := utils.Ptr("fallback")
//	result := utils.CoalescePtr(primary, secondary) // returns pointer to "fallback"
func CoalescePtr[T any](ptrs ...*T) *T {
	for _, ptr := range ptrs {
		if ptr != nil {
			return ptr
		}
	}
	return nil
}

// Coalesce returns the first non-nil pointer's value from the provided list,
// or the default value if all pointers are nil.
//
// Example:
//
//	var primary *string
//	var secondary *string
//	result := utils.Coalesce(primary, secondary, nil, "default") // returns "default"
//
//	name := utils.Ptr("John")
//	result = utils.Coalesce(primary, name, "default") // returns "John"
func Coalesce[T any](defaultValue T, ptrs ...*T) T {
	for _, ptr := range ptrs {
		if ptr != nil {
			return *ptr
		}
	}
	return defaultValue
}

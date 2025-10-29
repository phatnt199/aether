/*
Package utils provides a comprehensive collection of utility functions for common programming tasks.
This package follows Go's idiomatic patterns and integrates seamlessly with the go-infra project.

The utils package is organized into the following modules:

# Pointer Utilities (ptr.go)

Safe pointer operations with generics:
  - Ptr: Convert value to pointer
  - Value: Safely dereference pointer with default
  - ValueOrZero: Dereference or return zero value
  - Equal: Compare pointers safely
  - Coalesce: Get first non-nil value

# Type Conversion (convert.go)

Type conversion and parsing utilities:
  - ToString, ToInt, ToInt64, ToFloat64, ToBool: Safe type conversions
  - ParseDuration, ParseTime: Parse time values
  - FormatTime: Format time values

# Slice Operations (slice.go)

Functional programming utilities for slices:
  - Map: Transform slice elements
  - Filter: Filter slice by predicate
  - Reduce: Reduce slice to single value
  - Contains, Find: Search operations
  - Unique: Remove duplicates
  - Chunk: Split into chunks
  - Flatten: Flatten nested slices
  - GroupBy: Group by key function
  - Partition: Split by predicate

# Pagination (pagination.go)

Comprehensive pagination support:
  - Pagination: Offset-based pagination
  - CursorPagination: Cursor-based pagination
  - PageToOffset: Convert page/size to offset/limit
  - PaginationResult: Wrap paginated data

# String Operations (string.go)

String manipulation utilities:
  - IsEmpty, IsNotEmpty: Check string emptiness
  - Truncate, TruncateWords: Truncate strings
  - CamelCase, PascalCase, SnakeCase, KebabCase: Case conversion
  - Slugify: Create URL-friendly slugs
  - MaskString: Mask sensitive data
  - RandomString: Generate random strings

# Common Utilities (common.go)

General-purpose utilities:
  - Ternary: Conditional expression
  - Min, Max, Clamp: Numeric operations
  - IsZero, IsNotZero: Zero value checks
  - Must, MustNoError: Panic on error
  - Try: Safe function execution
  - RetryFunc: Retry with attempts

# Usage Examples

Pointer operations:

	name := utils.Ptr("John Doe")
	age := utils.ValueOrZero(user.Age)
	displayName := utils.Coalesce("Guest", user.Name, user.Email)

Type conversion:

	str := utils.ToString(42)
	num := utils.ToInt("42")
	duration := utils.MustParseDuration("30s")

Slice operations:

	numbers := []int{1, 2, 3, 4, 5}
	doubled := utils.Map(numbers, func(n int) int { return n * 2 })
	evens := utils.Filter(numbers, func(n int) bool { return n%2 == 0 })
	sum := utils.Reduce(numbers, 0, func(acc, n int) int { return acc + n })

Pagination:

	p := utils.NewPagination(2, 20, 100)
	offset := p.Offset()  // Use in database query
	limit := p.Limit()

String operations:

	slug := utils.Slugify("Hello World! 123")
	camel := utils.CamelCase("hello_world")
	masked := utils.MaskString("1234567890", 2, 2, '*')

Common utilities:

	max := utils.Max(1, 5, 3, 9, 2)
	result := utils.Ternary(age >= 18, "adult", "minor")
	config := utils.Must(loadConfig())

# Integration with go-infra

This package is designed to work seamlessly with other go-infra components:
  - Uses the same error handling patterns as pkg/errors
  - Compatible with logger from pkg/logger
  - Follows config patterns from pkg/application/config

# Best Practices

1. Use generics where appropriate for type safety
2. Prefer returning (value, error) over panicking
3. Use Must* functions only in initialization code
4. Always check for nil when working with pointers
5. Use semantic names that clearly describe behavior

# Performance Considerations

All utilities are designed for production use with careful attention to:
  - Memory allocation patterns
  - Avoiding unnecessary copying
  - Efficient algorithms
  - Minimal allocations in hot paths
*/
package utils

const (
	// Version is the utils package version
	Version = "1.0.0"
)

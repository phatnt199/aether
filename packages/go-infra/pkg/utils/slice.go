package utils

// Map transforms each element of a slice using the provided function.
// This is similar to Array.map() in JavaScript or map() in Python.
//
// Example:
//
//	numbers := []int{1, 2, 3, 4}
//	doubled := utils.Map(numbers, func(n int) int { return n * 2 })
//	// doubled = [2, 4, 6, 8]
//
//	words := []string{"hello", "world"}
//	lengths := utils.Map(words, func(s string) int { return len(s) })
//	// lengths = [5, 5]
func Map[T any, R any](slice []T, fn func(T) R) []R {
	if slice == nil {
		return nil
	}

	result := make([]R, len(slice))
	for i, v := range slice {
		result[i] = fn(v)
	}
	return result
}

// Filter returns a new slice containing only elements that satisfy the predicate.
// This is similar to Array.filter() in JavaScript or filter() in Python.
//
// Example:
//
//	numbers := []int{1, 2, 3, 4, 5, 6}
//	evens := utils.Filter(numbers, func(n int) bool { return n%2 == 0 })
//	// evens = [2, 4, 6]
//
//	words := []string{"apple", "banana", "apricot"}
//	aWords := utils.Filter(words, func(s string) bool { return s[0] == 'a' })
//	// aWords = ["apple", "apricot"]
func Filter[T any](slice []T, predicate func(T) bool) []T {
	if slice == nil {
		return nil
	}

	result := make([]T, 0, len(slice))
	for _, v := range slice {
		if predicate(v) {
			result = append(result, v)
		}
	}
	return result
}

// Reduce reduces a slice to a single value using the provided function.
// This is similar to Array.reduce() in JavaScript or reduce() in Python.
//
// Example:
//
//	numbers := []int{1, 2, 3, 4}
//	sum := utils.Reduce(numbers, 0, func(acc, n int) int { return acc + n })
//	// sum = 10
//
//	words := []string{"hello", "world"}
//	concat := utils.Reduce(words, "", func(acc, s string) string { return acc + s })
//	// concat = "helloworld"
func Reduce[T any, R any](slice []T, initial R, fn func(R, T) R) R {
	result := initial
	for _, v := range slice {
		result = fn(result, v)
	}
	return result
}

// Contains checks if a slice contains a specific value.
// The type must be comparable (implements == operator).
//
// Example:
//
//	numbers := []int{1, 2, 3, 4}
//	found := utils.Contains(numbers, 3)  // true
//	found = utils.Contains(numbers, 5)   // false
//
//	words := []string{"apple", "banana"}
//	found = utils.Contains(words, "apple")  // true
func Contains[T comparable](slice []T, value T) bool {
	for _, v := range slice {
		if v == value {
			return true
		}
	}
	return false
}

// ContainsFunc checks if a slice contains an element satisfying the predicate.
// Use this when you need custom comparison logic or for non-comparable types.
//
// Example:
//
//	type User struct { ID int; Name string }
//	users := []User{{1, "Alice"}, {2, "Bob"}}
//	found := utils.ContainsFunc(users, func(u User) bool { return u.ID == 2 })
//	// found = true
func ContainsFunc[T any](slice []T, predicate func(T) bool) bool {
	for _, v := range slice {
		if predicate(v) {
			return true
		}
	}
	return false
}

// Find returns the first element that satisfies the predicate.
// Returns the zero value and false if no element is found.
//
// Example:
//
//	numbers := []int{1, 2, 3, 4}
//	val, ok := utils.Find(numbers, func(n int) bool { return n > 2 })
//	// val = 3, ok = true
//
//	val, ok = utils.Find(numbers, func(n int) bool { return n > 10 })
//	// val = 0, ok = false
func Find[T any](slice []T, predicate func(T) bool) (T, bool) {
	for _, v := range slice {
		if predicate(v) {
			return v, true
		}
	}
	var zero T
	return zero, false
}

// FindIndex returns the index of the first element that satisfies the predicate.
// Returns -1 if no element is found.
//
// Example:
//
//	numbers := []int{1, 2, 3, 4}
//	idx := utils.FindIndex(numbers, func(n int) bool { return n > 2 })
//	// idx = 2 (element 3 is at index 2)
func FindIndex[T any](slice []T, predicate func(T) bool) int {
	for i, v := range slice {
		if predicate(v) {
			return i
		}
	}
	return -1
}

// Unique returns a new slice with duplicate values removed.
// Preserves the order of first occurrence.
//
// Example:
//
//	numbers := []int{1, 2, 2, 3, 3, 3, 4}
//	unique := utils.Unique(numbers)
//	// unique = [1, 2, 3, 4]
func Unique[T comparable](slice []T) []T {
	if slice == nil {
		return nil
	}

	seen := make(map[T]bool, len(slice))
	result := make([]T, 0, len(slice))

	for _, v := range slice {
		if !seen[v] {
			seen[v] = true
			result = append(result, v)
		}
	}

	return result
}

// UniqueFunc returns a new slice with duplicate values removed using a key function.
// Use this when the type is not comparable or you need custom uniqueness logic.
//
// Example:
//
//	type User struct { ID int; Name string }
//	users := []User{{1, "Alice"}, {2, "Bob"}, {1, "Alice2"}}
//	unique := utils.UniqueFunc(users, func(u User) int { return u.ID })
//	// unique = [{1, "Alice"}, {2, "Bob"}]
func UniqueFunc[T any, K comparable](slice []T, keyFn func(T) K) []T {
	if slice == nil {
		return nil
	}

	seen := make(map[K]bool, len(slice))
	result := make([]T, 0, len(slice))

	for _, v := range slice {
		key := keyFn(v)
		if !seen[key] {
			seen[key] = true
			result = append(result, v)
		}
	}

	return result
}

// Chunk splits a slice into chunks of the specified size.
// The last chunk may be smaller than the chunk size.
//
// Example:
//
//	numbers := []int{1, 2, 3, 4, 5, 6, 7}
//	chunks := utils.Chunk(numbers, 3)
//	// chunks = [[1, 2, 3], [4, 5, 6], [7]]
func Chunk[T any](slice []T, size int) [][]T {
	if slice == nil {
		return nil
	}
	if size <= 0 {
		return [][]T{slice}
	}

	var chunks [][]T
	for i := 0; i < len(slice); i += size {
		end := i + size
		if end > len(slice) {
			end = len(slice)
		}
		chunks = append(chunks, slice[i:end])
	}

	return chunks
}

// Reverse returns a new slice with elements in reverse order.
// The original slice is not modified.
//
// Example:
//
//	numbers := []int{1, 2, 3, 4}
//	reversed := utils.Reverse(numbers)
//	// reversed = [4, 3, 2, 1]
func Reverse[T any](slice []T) []T {
	if slice == nil {
		return nil
	}

	result := make([]T, len(slice))
	for i, v := range slice {
		result[len(slice)-1-i] = v
	}
	return result
}

// Flatten flattens a slice of slices into a single slice.
//
// Example:
//
//	nested := [][]int{{1, 2}, {3, 4}, {5}}
//	flat := utils.Flatten(nested)
//	// flat = [1, 2, 3, 4, 5]
func Flatten[T any](slices [][]T) []T {
	if slices == nil {
		return nil
	}

	// Calculate total length
	totalLen := 0
	for _, s := range slices {
		totalLen += len(s)
	}

	result := make([]T, 0, totalLen)
	for _, s := range slices {
		result = append(result, s...)
	}
	return result
}

// GroupBy groups slice elements by the result of the key function.
//
// Example:
//
//	type Person struct { Name string; Age int }
//	people := []Person{
//	    {"Alice", 30}, {"Bob", 25}, {"Charlie", 30},
//	}
//	grouped := utils.GroupBy(people, func(p Person) int { return p.Age })
//	// grouped = map[30:[{Alice 30} {Charlie 30}] 25:[{Bob 25}]]
func GroupBy[T any, K comparable](slice []T, keyFn func(T) K) map[K][]T {
	result := make(map[K][]T)
	for _, v := range slice {
		key := keyFn(v)
		result[key] = append(result[key], v)
	}
	return result
}

// Partition splits a slice into two slices based on the predicate.
// The first slice contains elements that satisfy the predicate,
// the second contains elements that don't.
//
// Example:
//
//	numbers := []int{1, 2, 3, 4, 5, 6}
//	evens, odds := utils.Partition(numbers, func(n int) bool { return n%2 == 0 })
//	// evens = [2, 4, 6], odds = [1, 3, 5]
func Partition[T any](slice []T, predicate func(T) bool) ([]T, []T) {
	if slice == nil {
		return nil, nil
	}

	truthy := make([]T, 0)
	falsy := make([]T, 0)

	for _, v := range slice {
		if predicate(v) {
			truthy = append(truthy, v)
		} else {
			falsy = append(falsy, v)
		}
	}

	return truthy, falsy
}

// Every checks if all elements satisfy the predicate.
//
// Example:
//
//	numbers := []int{2, 4, 6, 8}
//	allEven := utils.Every(numbers, func(n int) bool { return n%2 == 0 })
//	// allEven = true
func Every[T any](slice []T, predicate func(T) bool) bool {
	for _, v := range slice {
		if !predicate(v) {
			return false
		}
	}
	return true
}

// Some checks if at least one element satisfies the predicate.
//
// Example:
//
//	numbers := []int{1, 3, 4, 5}
//	hasEven := utils.Some(numbers, func(n int) bool { return n%2 == 0 })
//	// hasEven = true
func Some[T any](slice []T, predicate func(T) bool) bool {
	for _, v := range slice {
		if predicate(v) {
			return true
		}
	}
	return false
}

// First returns the first element of the slice.
// Returns zero value and false if the slice is empty.
//
// Example:
//
//	numbers := []int{1, 2, 3}
//	val, ok := utils.First(numbers)  // val = 1, ok = true
//
//	empty := []int{}
//	val, ok = utils.First(empty)  // val = 0, ok = false
func First[T any](slice []T) (T, bool) {
	if len(slice) == 0 {
		var zero T
		return zero, false
	}
	return slice[0], true
}

// Last returns the last element of the slice.
// Returns zero value and false if the slice is empty.
//
// Example:
//
//	numbers := []int{1, 2, 3}
//	val, ok := utils.Last(numbers)  // val = 3, ok = true
func Last[T any](slice []T) (T, bool) {
	if len(slice) == 0 {
		var zero T
		return zero, false
	}
	return slice[len(slice)-1], true
}

// Compact removes zero values from the slice.
//
// Example:
//
//	numbers := []int{1, 0, 2, 0, 3}
//	compact := utils.Compact(numbers)
//	// compact = [1, 2, 3]
func Compact[T comparable](slice []T) []T {
	if slice == nil {
		return nil
	}

	var zero T
	result := make([]T, 0, len(slice))

	for _, v := range slice {
		if v != zero {
			result = append(result, v)
		}
	}

	return result
}

// Intersection returns elements that exist in all provided slices.
//
// Example:
//
//	a := []int{1, 2, 3, 4}
//	b := []int{2, 3, 4, 5}
//	c := []int{3, 4, 5, 6}
//	common := utils.Intersection(a, b, c)
//	// common = [3, 4]
func Intersection[T comparable](slices ...[]T) []T {
	if len(slices) == 0 {
		return nil
	}
	if len(slices) == 1 {
		return slices[0]
	}

	// Count occurrences
	counts := make(map[T]int)
	for _, slice := range slices {
		seen := make(map[T]bool)
		for _, v := range slice {
			if !seen[v] {
				counts[v]++
				seen[v] = true
			}
		}
	}

	// Collect values that appear in all slices
	result := make([]T, 0)
	for v, count := range counts {
		if count == len(slices) {
			result = append(result, v)
		}
	}

	return result
}

// Difference returns elements from the first slice that don't exist in other slices.
//
// Example:
//
//	a := []int{1, 2, 3, 4}
//	b := []int{2, 3}
//	diff := utils.Difference(a, b)
//	// diff = [1, 4]
func Difference[T comparable](slice []T, others ...[]T) []T {
	if len(others) == 0 {
		return slice
	}

	// Build exclusion set from other slices
	exclude := make(map[T]bool)
	for _, other := range others {
		for _, v := range other {
			exclude[v] = true
		}
	}

	// Filter first slice
	result := make([]T, 0, len(slice))
	for _, v := range slice {
		if !exclude[v] {
			result = append(result, v)
		}
	}

	return result
}

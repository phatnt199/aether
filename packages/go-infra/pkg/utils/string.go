package utils

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// IsEmpty checks if a string is empty or contains only whitespace.
//
// Example:
//
//	utils.IsEmpty("")        // true
//	utils.IsEmpty("  ")      // true
//	utils.IsEmpty("hello")   // false
func IsEmpty(s string) bool {
	return strings.TrimSpace(s) == ""
}

// IsNotEmpty checks if a string is not empty and contains non-whitespace characters.
//
// Example:
//
//	utils.IsNotEmpty("hello")  // true
//	utils.IsNotEmpty("")       // false
func IsNotEmpty(s string) bool {
	return !IsEmpty(s)
}

// Truncate truncates a string to the specified length and adds suffix if truncated.
//
// Example:
//
//	str := utils.Truncate("Hello, World!", 8, "...")
//	// str = "Hello..."
func Truncate(s string, length int, suffix string) string {
	if len(s) <= length {
		return s
	}
	return s[:length-len(suffix)] + suffix
}

// TruncateWords truncates a string to the specified number of words.
//
// Example:
//
//	str := utils.TruncateWords("Hello beautiful world today", 2, "...")
//	// str = "Hello beautiful..."
func TruncateWords(s string, wordCount int, suffix string) string {
	words := strings.Fields(s)
	if len(words) <= wordCount {
		return s
	}
	return strings.Join(words[:wordCount], " ") + suffix
}

// PadLeft pads a string on the left with the specified character.
//
// Example:
//
//	str := utils.PadLeft("42", 5, '0')
//	// str = "00042"
func PadLeft(s string, length int, pad rune) string {
	if len(s) >= length {
		return s
	}
	return strings.Repeat(string(pad), length-len(s)) + s
}

// PadRight pads a string on the right with the specified character.
//
// Example:
//
//	str := utils.PadRight("42", 5, '0')
//	// str = "42000"
func PadRight(s string, length int, pad rune) string {
	if len(s) >= length {
		return s
	}
	return s + strings.Repeat(string(pad), length-len(s))
}

// Capitalize capitalizes the first letter of a string.
//
// Example:
//
//	str := utils.Capitalize("hello")  // "Hello"
func Capitalize(s string) string {
	if s == "" {
		return s
	}
	runes := []rune(s)
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}

// Title converts a string to title case (first letter of each word capitalized).
//
// Example:
//
//	str := utils.Title("hello world")  // "Hello World"
func Title(s string) string {
	return strings.Title(strings.ToLower(s))
}

// CamelCase converts a string to camelCase.
//
// Example:
//
//	str := utils.CamelCase("hello_world")     // "helloWorld"
//	str = utils.CamelCase("Hello World")      // "helloWorld"
func CamelCase(s string) string {
	// Replace special characters with spaces
	s = regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(s, " ")

	words := strings.Fields(s)
	if len(words) == 0 {
		return ""
	}

	// First word lowercase, rest capitalized
	result := strings.ToLower(words[0])
	for _, word := range words[1:] {
		result += Capitalize(strings.ToLower(word))
	}
	return result
}

// PascalCase converts a string to PascalCase.
//
// Example:
//
//	str := utils.PascalCase("hello_world")    // "HelloWorld"
//	str = utils.PascalCase("hello world")     // "HelloWorld"
func PascalCase(s string) string {
	// Replace special characters with spaces
	s = regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(s, " ")

	words := strings.Fields(s)
	result := ""
	for _, word := range words {
		result += Capitalize(strings.ToLower(word))
	}
	return result
}

// SnakeCase converts a string to snake_case.
//
// Example:
//
//	str := utils.SnakeCase("HelloWorld")      // "hello_world"
//	str = utils.SnakeCase("Hello World")      // "hello_world"
func SnakeCase(s string) string {
	// Insert underscore before uppercase letters
	s = regexp.MustCompile(`([a-z0-9])([A-Z])`).ReplaceAllString(s, "${1}_${2}")

	// Replace special characters and spaces with underscore
	s = regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(s, "_")

	// Convert to lowercase and trim underscores
	return strings.Trim(strings.ToLower(s), "_")
}

// KebabCase converts a string to kebab-case.
//
// Example:
//
//	str := utils.KebabCase("HelloWorld")      // "hello-world"
//	str = utils.KebabCase("Hello World")      // "hello-world"
func KebabCase(s string) string {
	// Insert hyphen before uppercase letters
	s = regexp.MustCompile(`([a-z0-9])([A-Z])`).ReplaceAllString(s, "${1}-${2}")

	// Replace special characters and spaces with hyphen
	s = regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(s, "-")

	// Convert to lowercase and trim hyphens
	return strings.Trim(strings.ToLower(s), "-")
}

// Reverse reverses a string.
//
// Example:
//
//	str := utils.Reverse("hello")  // "olleh"
func ReverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}

// RemoveNonAlphanumeric removes all non-alphanumeric characters from a string.
//
// Example:
//
//	str := utils.RemoveNonAlphanumeric("Hello, World!")  // "HelloWorld"
func RemoveNonAlphanumeric(s string) string {
	return regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(s, "")
}

// RemoveWhitespace removes all whitespace from a string.
//
// Example:
//
//	str := utils.RemoveWhitespace("Hello World")  // "HelloWorld"
func RemoveWhitespace(s string) string {
	return regexp.MustCompile(`\s+`).ReplaceAllString(s, "")
}

// ContainsAny checks if a string contains any of the substrings.
//
// Example:
//
//	found := utils.ContainsAny("hello world", []string{"foo", "world"})  // true
func ContainsAny(s string, substrings []string) bool {
	for _, substr := range substrings {
		if strings.Contains(s, substr) {
			return true
		}
	}
	return false
}

// ContainsAll checks if a string contains all of the substrings.
//
// Example:
//
//	found := utils.ContainsAll("hello world", []string{"hello", "world"})  // true
func ContainsAll(s string, substrings []string) bool {
	for _, substr := range substrings {
		if !strings.Contains(s, substr) {
			return false
		}
	}
	return true
}

// RandomString generates a random string of the specified length.
// Uses cryptographically secure random number generator.
//
// Example:
//
//	str, err := utils.RandomString(16)
//	// str might be "a3f5c8d9e2b7f1a4"
func RandomString(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes)[:length], nil
}

// RandomBytes generates random bytes of the specified length.
// Uses cryptographically secure random number generator.
//
// Example:
//
//	bytes, err := utils.RandomBytes(32)
func RandomBytes(length int) ([]byte, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return nil, err
	}
	return bytes, nil
}

// RandomBase64 generates a random base64-encoded string.
//
// Example:
//
//	str, err := utils.RandomBase64(32)
//	// str might be "xJ9k3mP2qW7..."
func RandomBase64(length int) (string, error) {
	bytes, err := RandomBytes(length)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// MaskString masks a string, showing only the first and last n characters.
// Useful for masking sensitive data like credit cards, emails, etc.
//
// Example:
//
//	str := utils.MaskString("1234567890", 2, 2, '*')
//	// str = "12******90"
func MaskString(s string, showFirst, showLast int, maskChar rune) string {
	length := len(s)
	if length <= showFirst+showLast {
		return s
	}

	masked := s[:showFirst] +
		strings.Repeat(string(maskChar), length-showFirst-showLast) +
		s[length-showLast:]
	return masked
}

// SplitLines splits a string by line breaks, handling different line ending styles.
//
// Example:
//
//	lines := utils.SplitLines("line1\nline2\r\nline3")
//	// lines = ["line1", "line2", "line3"]
func SplitLines(s string) []string {
	// Normalize line endings
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\r", "\n")
	return strings.Split(s, "\n")
}

// Slugify converts a string to a URL-friendly slug.
//
// Example:
//
//	slug := utils.Slugify("Hello World! 123")
//	// slug = "hello-world-123"
func Slugify(s string) string {
	// Convert to lowercase
	s = strings.ToLower(s)

	// Replace special characters with hyphen
	s = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(s, "-")

	// Remove leading/trailing hyphens
	s = strings.Trim(s, "-")

	// Replace multiple hyphens with single hyphen
	s = regexp.MustCompile(`-+`).ReplaceAllString(s, "-")

	return s
}

// WordCount counts the number of words in a string.
//
// Example:
//
//	count := utils.WordCount("Hello beautiful world")  // 3
func WordCount(s string) int {
	return len(strings.Fields(s))
}

// LineCount counts the number of lines in a string.
//
// Example:
//
//	count := utils.LineCount("line1\nline2\nline3")  // 3
func LineCount(s string) int {
	return len(SplitLines(s))
}

// Repeat repeats a string n times.
//
// Example:
//
//	str := utils.Repeat("Go", 3)  // "GoGoGo"
func Repeat(s string, count int) string {
	return strings.Repeat(s, count)
}

// ReplaceMultiple replaces multiple substrings in a single pass.
// Replacements is a map where keys are substrings to find and values are replacements.
//
// Example:
//
//	replacements := map[string]string{"foo": "bar", "hello": "hi"}
//	str := utils.ReplaceMultiple("foo says hello", replacements)
//	// str = "bar says hi"
func ReplaceMultiple(s string, replacements map[string]string) string {
	for old, new := range replacements {
		s = strings.ReplaceAll(s, old, new)
	}
	return s
}

// EscapeHTML escapes special HTML characters.
//
// Example:
//
//	str := utils.EscapeHTML("<script>alert('xss')</script>")
//	// str = "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
func EscapeHTML(s string) string {
	replacer := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		"\"", "&quot;",
		"'", "&#39;",
	)
	return replacer.Replace(s)
}

// DefaultString returns the default value if the string is empty.
//
// Example:
//
//	str := utils.DefaultString("", "default")  // "default"
//	str = utils.DefaultString("value", "default")  // "value"
func DefaultString(s, defaultValue string) string {
	if s == "" {
		return defaultValue
	}
	return s
}

// Ellipsis truncates a string and adds ellipsis if it exceeds the length.
//
// Example:
//
//	str := utils.Ellipsis("This is a long text", 10)
//	// str = "This is..."
func Ellipsis(s string, length int) string {
	return Truncate(s, length, "...")
}

// IsNumeric checks if a string contains only numeric characters.
//
// Example:
//
//	utils.IsNumeric("12345")  // true
//	utils.IsNumeric("123.45")  // false
func IsNumeric(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

// IsAlpha checks if a string contains only alphabetic characters.
//
// Example:
//
//	utils.IsAlpha("Hello")  // true
//	utils.IsAlpha("Hello123")  // false
func IsAlpha(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if !unicode.IsLetter(r) {
			return false
		}
	}
	return true
}

// IsAlphanumeric checks if a string contains only alphanumeric characters.
//
// Example:
//
//	utils.IsAlphanumeric("Hello123")  // true
//	utils.IsAlphanumeric("Hello 123")  // false
func IsAlphanumeric(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

// Join joins elements with a separator, handling various types.
//
// Example:
//
//	str := utils.Join([]interface{}{1, "hello", 3.14}, ", ")
//	// str = "1, hello, 3.14"
func Join(elements []interface{}, separator string) string {
	strs := make([]string, len(elements))
	for i, elem := range elements {
		strs[i] = fmt.Sprintf("%v", elem)
	}
	return strings.Join(strs, separator)
}

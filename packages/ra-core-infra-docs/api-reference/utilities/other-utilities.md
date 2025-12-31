# Other Utilities

Utility functions for parsing, type checking, and URL manipulation.

## Import

```typescript
import {
  // Parse utilities
  getUID,
  toCamel,
  keysToCamel,
  isInt,
  isFloat,
  int,
  float,
  toBoolean,
  toStringDecimal,
  getNumberValue,

  // Boolean utilities
  isDefined,
  isString,
  isNumber,
  isObject,
  isBrowser,
  isValidDate,

  // URL utilities
  stringify,
  parse,
} from '@minimaltech/ra-core-infra';
```

## Overview

The @ra-core-infra library provides three categories of utility functions:

### Parse Utilities

| Function | Purpose |
|----------|---------|
| [getUID](#getuid) | Generate unique ID |
| [toCamel](#tocamel) | Convert to camelCase |
| [keysToCamel](#keystocamel) | Convert object keys to camelCase |
| [isInt](#isint) | Check if integer |
| [isFloat](#isfloat) | Check if float |
| [int](#int) | Parse to integer |
| [float](#float) | Parse to float |
| [toBoolean](#toboolean) | Parse to boolean |
| [toStringDecimal](#tostringdecimal) | Format number as decimal |
| [getNumberValue](#getnumbervalue) | Extract number from string |

### Boolean Utilities

| Function | Purpose |
|----------|---------|
| [isDefined](#isdefined) | Check if defined |
| [isString](#isstring) | Type guard for string |
| [isNumber](#isnumber) | Type guard for number |
| [isObject](#isobject) | Check if plain object |
| [isBrowser](#isbrowser) | Check if browser environment |
| [isValidDate](#isvaliddate) | Check if valid date |

### URL Utilities

| Function | Purpose |
|----------|---------|
| [stringify](#stringify) | Object to query string |
| [parse](#parse) | Query string to object |

---

## Parse Utilities

### getUID

Generate a random unique identifier.

**Signature**:
```typescript
function getUID(): string
```

**Returns**: Random uppercase alphanumeric string

**Example**:
```typescript
import { getUID } from '@minimaltech/ra-core-infra';

const id = getUID();  // "K3N8QX9"
const userId = `user_${getUID()}`;  // "user_M7P2RZ4"
```

---

### toCamel

Convert string to camelCase.

**Signature**:
```typescript
function toCamel(s: string): string
```

**Parameters**:
- `s`: String to convert (kebab-case or snake_case)

**Returns**: camelCase string

**Example**:
```typescript
import { toCamel } from '@minimaltech/ra-core-infra';

toCamel('user-name');      // "userName"
toCamel('first_name');     // "firstName"
toCamel('api-endpoint');   // "apiEndpoint"
```

---

### keysToCamel

Convert all object keys to camelCase recursively.

**Signature**:
```typescript
function keysToCamel(object: object): any
```

**Parameters**:
- `object`: Object with keys to convert

**Returns**: New object with camelCase keys

**Example**:
```typescript
import { keysToCamel } from '@minimaltech/ra-core-infra';

const input = {
  'user-name': 'John',
  'user_age': 30,
  'user-address': {
    'street-name': 'Main St',
    'zip_code': '12345',
  },
};

const output = keysToCamel(input);
// {
//   userName: 'John',
//   userAge: 30,
//   userAddress: {
//     streetName: 'Main St',
//     zipCode: '12345',
//   },
// }
```

---

### isInt

Check if value is an integer.

**Signature**:
```typescript
function isInt(n: any): boolean
```

**Returns**: `true` if integer, `false` otherwise

**Example**:
```typescript
import { isInt } from '@minimaltech/ra-core-infra';

isInt(42);       // true
isInt(42.0);     // true
isInt(42.5);     // false
isInt('42');     // true
isInt('42.5');   // false
isInt(NaN);      // false
```

---

### isFloat

Check if value is a floating-point number.

**Signature**:
```typescript
function isFloat(n: any): boolean
```

**Returns**: `true` if float, `false` otherwise

**Example**:
```typescript
import { isFloat } from '@minimaltech/ra-core-infra';

isFloat(42.5);    // true
isFloat(3.14);    // true
isFloat(42);      // false
isFloat(42.0);    // false
isFloat('42.5');  // true
isFloat(NaN);     // false
```

---

### int

Parse value to integer.

**Signature**:
```typescript
function int(input: any): number
```

**Parameters**:
- `input`: Value to parse (handles commas)

**Returns**: Parsed integer (defaults to `0` if invalid)

**Example**:
```typescript
import { int } from '@minimaltech/ra-core-infra';

int('42');        // 42
int('1,234');     // 1234
int('42.99');     // 42
int('abc');       // 0
int(null);        // 0
int(undefined);   // 0
```

---

### float

Parse value to floating-point number.

**Signature**:
```typescript
function float(input: any, digit?: number): number
```

**Parameters**:
- `input`: Value to parse
- `digit`: Decimal places (default: `2`)

**Returns**: Parsed float (defaults to `0` if invalid)

**Example**:
```typescript
import { float } from '@minimaltech/ra-core-infra';

float('42.567');         // 42.57 (2 decimals by default)
float('42.567', 1);      // 42.6
float('1,234.56');       // 1234.56
float('3.14159', 3);     // 3.142
float('abc');            // 0
```

---

### toBoolean

Parse value to boolean.

**Signature**:
```typescript
function toBoolean(input: any): boolean
```

**Returns**: `false` for: `'false'`, `'0'`, `false`, `0`, `null`, `undefined`. `true` otherwise.

**Example**:
```typescript
import { toBoolean } from '@minimaltech/ra-core-infra';

toBoolean(true);         // true
toBoolean('true');       // true
toBoolean(1);            // true
toBoolean('1');          // true

toBoolean(false);        // false
toBoolean('false');      // false
toBoolean(0);            // false
toBoolean('0');          // false
toBoolean(null);         // false
toBoolean(undefined);    // false
```

---

### toStringDecimal

Format number as decimal string with locale support.

**Signature**:
```typescript
function toStringDecimal(
  input: any,
  digit?: number,
  options?: { localeFormat: boolean }
): string | number
```

**Parameters**:
- `input`: Number to format
- `digit`: Decimal places (default: `2`)
- `options.localeFormat`: Use locale formatting (default: `true`)

**Returns**: Formatted string (or `0` if invalid)

**Example**:
```typescript
import { toStringDecimal } from '@minimaltech/ra-core-infra';

toStringDecimal(1234.567);                // "1,234.57"
toStringDecimal(1234.567, 1);             // "1,234.6"
toStringDecimal(1234, 0);                 // "1,234"
toStringDecimal(1234.567, 2, { localeFormat: false });  // "1234.57"
```

---

### getNumberValue

Extract number from string, removing separators.

**Signature**:
```typescript
function getNumberValue(input: string, method?: 'int' | 'float'): number
```

**Parameters**:
- `input`: String containing number
- `method`: Parse as `'int'` or `'float'` (default: `'int'`)

**Returns**: Parsed number

**Example**:
```typescript
import { getNumberValue } from '@minimaltech/ra-core-infra';

getNumberValue('1,234.56', 'int');     // 123456
getNumberValue('1,234.56', 'float');   // 123456.00
getNumberValue('$1,234.56', 'float');  // 123456.00
```

---

## Boolean Utilities

### isDefined

Type guard checking if value is not null or undefined.

**Signature**:
```typescript
function isDefined<T>(value: T | null | undefined): value is T
```

**Returns**: Type guard boolean

**Example**:
```typescript
import { isDefined } from '@minimaltech/ra-core-infra';

const value: string | null = getValue();

if (isDefined(value)) {
  // TypeScript knows value is string here
  console.log(value.toUpperCase());
}

isDefined('hello');     // true
isDefined(0);           // true
isDefined(false);       // true
isDefined(null);        // false
isDefined(undefined);   // false
```

---

### isString

Type guard for string.

**Signature**:
```typescript
function isString(value: unknown): value is string
```

**Returns**: Type guard boolean

**Example**:
```typescript
import { isString } from '@minimaltech/ra-core-infra';

const value: unknown = getUnknownValue();

if (isString(value)) {
  // TypeScript knows value is string
  console.log(value.length);
}

isString('hello');     // true
isString(123);         // false
isString(null);        // false
```

---

### isNumber

Type guard for number (with optional exact mode).

**Signature**:
```typescript
function isNumber(value: unknown, exact?: boolean): value is number
```

**Parameters**:
- `value`: Value to check
- `exact`: If `true`, only accepts `number` type (not numeric strings)

**Returns**: Type guard boolean

**Example**:
```typescript
import { isNumber } from '@minimaltech/ra-core-infra';

isNumber(123);           // true
isNumber('123');         // true (parseable as number)
isNumber('123', true);   // false (exact mode: not number type)
isNumber(123, true);     // true

isNumber('abc');         // false
isNumber(NaN);           // false
isNumber(Infinity);      // true
```

---

### isObject

Check if value is a plain object (not array or null).

**Signature**:
```typescript
function isObject(value: any): boolean
```

**Returns**: `true` if plain object

**Example**:
```typescript
import { isObject } from '@minimaltech/ra-core-infra';

isObject({});              // true
isObject({ a: 1 });        // true
isObject([]);              // false
isObject(null);            // false
isObject(new Date());      // true (object, not array)
```

---

### isBrowser

Check if code is running in browser environment.

**Signature**:
```typescript
function isBrowser(): boolean
```

**Returns**: `true` if `window` exists

**Example**:
```typescript
import { isBrowser } from '@minimaltech/ra-core-infra';

if (isBrowser()) {
  // Safe to access window, document, localStorage, etc.
  localStorage.setItem('key', 'value');
} else {
  // Running in Node.js/server environment
  console.log('Server-side rendering');
}
```

---

### isValidDate

Check if value is a valid date.

**Signature**:
```typescript
function isValidDate(value: any): boolean
```

**Returns**: `true` if valid date

**Example**:
```typescript
import { isValidDate } from '@minimaltech/ra-core-infra';

isValidDate('2025-01-15');           // true
isValidDate('2025-12-31T10:00:00');  // true
isValidDate(new Date());             // true
isValidDate('invalid');              // false
isValidDate(null);                   // false
```

---

## URL Utilities

### stringify

Convert object to URL query string.

**Signature**:
```typescript
function stringify(params: Record<string | symbol, any>): string
```

**Parameters**:
- `params`: Object to convert (null/undefined values ignored)

**Returns**: URL-encoded query string

**Behavior**:
- Skips `null` and `undefined` values
- Numbers and strings passed directly
- Objects/arrays JSON-stringified

**Example**:
```typescript
import { stringify } from '@minimaltech/ra-core-infra';

stringify({ name: 'John', age: 30 });
// "name=John&age=30"

stringify({ search: 'hello world', page: 1, limit: 10 });
// "search=hello+world&page=1&limit=10"

stringify({ filter: { status: 'active' }, sort: ['name', 'asc'] });
// "filter=%7B%22status%22%3A%22active%22%7D&sort=%5B%22name%22%2C%22asc%22%5D"

stringify({ name: 'John', email: null, age: undefined });
// "name=John" (null/undefined skipped)
```

---

### parse

Parse URL query string to object.

**Signature**:
```typescript
function parse(searchString: string): Record<string, string>
```

**Parameters**:
- `searchString`: Query string (with or without leading `?`)

**Returns**: Object with string values

**Example**:
```typescript
import { parse } from '@minimaltech/ra-core-infra';

parse('name=John&age=30');
// { name: 'John', age: '30' }

parse('?search=hello+world&page=1');
// { search: 'hello world', page: '1' }

parse('filter=%7B%22status%22%3A%22active%22%7D');
// { filter: '{"status":"active"}' }
// Note: JSON values need JSON.parse() separately

// Full example with JSON
const query = parse(window.location.search);
const filter = query.filter ? JSON.parse(query.filter) : {};
```

---

## Complete Examples

### Form Data Parsing

```typescript
import { int, float, toBoolean, isDefined } from '@minimaltech/ra-core-infra';

interface FormData {
  name: string;
  age: number;
  salary: number;
  isActive: boolean;
}

function parseFormData(raw: Record<string, any>): FormData {
  return {
    name: raw.name || '',
    age: int(raw.age),
    salary: float(raw.salary, 2),
    isActive: toBoolean(raw.isActive),
  };
}

// Usage
const formData = parseFormData({
  name: 'John',
  age: '30',
  salary: '50,000.50',
  isActive: '1',
});
// {
//   name: 'John',
//   age: 30,
//   salary: 50000.50,
//   isActive: true
// }
```

---

### API Response Normalization

```typescript
import { keysToCamel, isDefined } from '@minimaltech/ra-core-infra';

async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  // Convert snake_case to camelCase
  const normalized = keysToCamel(data);

  return normalized;
}

// API returns:
// { user_name: 'John', first_name: 'John', last_name: 'Doe' }

// Becomes:
// { userName: 'John', firstName: 'John', lastName: 'Doe' }
```

---

### URL Query Builder

```typescript
import { stringify, parse } from '@minimaltech/ra-core-infra';

function buildSearchURL(filters: any) {
  const baseURL = '/api/products';
  const queryString = stringify(filters);

  return `${baseURL}?${queryString}`;
}

// Usage
const url = buildSearchURL({
  category: 'electronics',
  minPrice: 100,
  maxPrice: 1000,
  inStock: true,
});
// "/api/products?category=electronics&minPrice=100&maxPrice=1000&inStock=true"

// Parse back
const filters = parse(window.location.search);
console.log(filters.category);  // "electronics"
```

---

### Type-Safe Data Validation

```typescript
import { isString, isNumber, isObject, isDefined } from '@minimaltech/ra-core-infra';

interface User {
  id: number;
  name: string;
  email: string;
  metadata?: Record<string, any>;
}

function validateUser(data: unknown): User | null {
  if (!isObject(data)) return null;

  const { id, name, email, metadata } = data as any;

  if (!isNumber(id, true)) return null;
  if (!isString(name)) return null;
  if (!isString(email)) return null;
  if (isDefined(metadata) && !isObject(metadata)) return null;

  return { id, name, email, metadata };
}
```

---

### Number Formatting

```typescript
import { toStringDecimal, int, float } from '@minimaltech/ra-core-infra';

function formatCurrency(amount: any): string {
  const value = float(amount, 2);
  return `$${toStringDecimal(value, 2)}`;
}

function formatPercentage(value: any): string {
  const percent = float(value, 1);
  return `${percent}%`;
}

// Usage
formatCurrency('1234.567');    // "$1,234.57"
formatCurrency('1,234.56');    // "$1,234.56"
formatPercentage('45.678');    // "45.7%"
```

---

### Environment Detection

```typescript
import { isBrowser } from '@minimaltech/ra-core-infra';

function getStorageAdapter() {
  if (isBrowser()) {
    return {
      get: (key: string) => localStorage.getItem(key),
      set: (key: string, value: string) => localStorage.setItem(key, value),
    };
  } else {
    // Server-side storage (e.g., in-memory or database)
    const storage = new Map<string, string>();
    return {
      get: (key: string) => storage.get(key) || null,
      set: (key: string, value: string) => storage.set(key, value),
    };
  }
}
```

---

## Best Practices

### 1. Use Type Guards for Type Safety

```typescript
// ✅ Good - type-safe
function processValue(value: unknown) {
  if (isString(value)) {
    return value.toUpperCase();  // TypeScript knows it's string
  }
  if (isNumber(value, true)) {
    return value * 2;  // TypeScript knows it's number
  }
  return null;
}

// ❌ Bad - type assertions
function processValue(value: unknown) {
  return (value as string).toUpperCase();  // Might crash
}
```

---

### 2. Validate External Data

```typescript
// ✅ Good - validate API responses
const data = await fetchData();

if (isDefined(data.user) && isObject(data.user)) {
  const userId = int(data.user.id);
  const userName = data.user.name;
}

// ❌ Bad - assume structure
const userId = data.user.id;  // Might be undefined
```

---

### 3. Handle Parse Failures Gracefully

```typescript
// ✅ Good - default to safe values
const age = int(userInput) || 18;  // Default to 18
const price = float(priceInput) || 0.00;

// ❌ Bad - no fallback
const age = int(userInput);  // Could be 0 for invalid input
```

---

## See Also

- [Error Utilities](/api-reference/utilities/error-utilities) - Error handling utilities
- [Core Types](/api-reference/core/types) - TypeScript type definitions
- [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) - Browser API
- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) - Number formatting API

---

**Congratulations!** You've completed the entire API Reference documentation for @ra-core-infra.

## Phase Summary

**Phase 3 Complete** - 5 low-priority files:
- ✅ BaseService
- ✅ BaseProvider
- ✅ Utility Hooks (8 hooks)
- ✅ Error Utilities
- ✅ Other Utilities

**All Phases Complete**:
- ✅ Phase 1 (7 high-priority files)
- ✅ Phase 2 (6 medium-priority files)
- ✅ Phase 3 (5 low-priority files)

**Total**: 18 comprehensive API reference documents created!

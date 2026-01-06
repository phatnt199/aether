# useTranslate

React hook for accessing type-safe internationalization (i18n) translations in your components.

## Import

```typescript
import { useTranslate } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
function useTranslate(): TUseTranslateFn

// Return type
type TUseTranslateFn = (key: TUseTranslateKeys, options?: any) => string

// Translation keys (type-safe paths)
type TUseTranslateKeys = TUseTranslateKeysDefault | keyof IUseTranslateKeysOverrides;
type TUseTranslateKeysDefault = TFullPaths<typeof englishMessages>;

// For type augmentation (custom translation keys)
interface IUseTranslateKeysOverrides {
  // Add your custom translation keys here
}
```

## Return Value

**Type**: `TUseTranslateFn` (Translation function)

Returns a function that translates message keys into localized strings.

**Translation function signature**:
```typescript
(key: TUseTranslateKeys, options?: any) => string
```

**Parameters**:
- `key` - Translation key (dot-separated path like `"ra.action.save"`)
- `options` - Optional interpolation variables or Polyglot options

## Description

`useTranslate` provides access to the i18n provider's translation function with full TypeScript type safety. It uses React Admin's i18n system powered by Polyglot for translations.

**When to use**:
- Display translated text in UI components
- Translate validation messages
- Localize button labels, headings, and descriptions
- Show error messages in the user's language

**How it works**:
1. Retrieves the i18n provider from React Admin context
2. Wraps the provider's `translate()` method in a memoized callback
3. Returns a type-safe translation function
4. Falls back to identity function (returns key as-is) if no provider exists

## Examples

### Basic Translation

Translate simple text using predefined keys:

```typescript
import React from 'react';
import { useTranslate } from '@minimaltech/ra-core-infra';

function SaveButton() {
  const translate = useTranslate();

  return (
    <button>
      {translate('ra.action.save')}
    </button>
  );
}

// Renders: <button>Save</button>
```

### Common Translation Keys

Access React Admin's built-in translations:

```typescript
import { useTranslate } from '@minimaltech/ra-core-infra';

function MyComponent() {
  const translate = useTranslate();

  return (
    <div>
      <button>{translate('ra.action.create')}</button>  {/* "Create" */}
      <button>{translate('ra.action.edit')}</button>    {/* "Edit" */}
      <button>{translate('ra.action.delete')}</button>  {/* "Delete" */}
      <button>{translate('ra.action.cancel')}</button>  {/* "Cancel" */}

      <span>{translate('ra.boolean.true')}</span>       {/* "Yes" */}
      <span>{translate('ra.boolean.false')}</span>      {/* "No" */}

      <p>{translate('ra.notification.created')}</p>     {/* "Element created" */}
      <p>{translate('ra.notification.updated')}</p>     {/* "Element updated" */}
    </div>
  );
}
```

### String Interpolation

Insert variables into translations using `%{variable}` syntax:

```typescript
import { useTranslate } from '@minimaltech/ra-core-infra';

function WelcomeMessage({ user }: { user: { name: string } }) {
  const translate = useTranslate();

  return (
    <h1>
      {translate('app.welcome', { name: user.name })}
    </h1>
  );
}

// With custom translation: "app.welcome": "Welcome, %{name}!"
// Renders: <h1>Welcome, John!</h1>
```

### Pluralization

Use Polyglot's pluralization syntax with `smart_count`:

```typescript
import { useTranslate } from '@minimaltech/ra-core-infra';

function ItemCount({ count }: { count: number }) {
  const translate = useTranslate();

  return (
    <p>
      {translate('app.items_selected', { smart_count: count })}
    </p>
  );
}

// With translation: "app.items_selected": "%{smart_count} item |||| %{smart_count} items"
// count = 1: "1 item"
// count = 5: "5 items"
```

### Custom Translations with Type Augmentation

**Step 1**: Define custom translations

```typescript
// locales/en.ts
export const customEnglishMessages = {
  app: {
    title: 'My Admin App',
    welcome: 'Welcome, %{name}!',
    items_selected: '%{smart_count} item selected |||| %{smart_count} items selected',
    errors: {
      network: 'Network error. Please try again.',
      unauthorized: 'You are not authorized.',
    },
  },
};
```

**Step 2**: Augment types for TypeScript

```typescript
// types/translate.d.ts
import { customEnglishMessages } from '@/locales/en';
import type { TFullPaths } from '@minimaltech/ra-core-infra';

declare module '@minimaltech/ra-core-infra' {
  interface IUseTranslateKeysOverrides {
    // Generate type-safe keys from your custom messages
    [K in TFullPaths<typeof customEnglishMessages>]: string;
  }
}
```

**Step 3**: Register translations in i18n provider

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import { englishMessages } from '@minimaltech/ra-core-infra/common/locales/en';
import { customEnglishMessages } from '@/locales/en';
import polyglotI18nProvider from 'ra-i18n-polyglot';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Merge custom translations with defaults
    const messages = {
      en: { ...englishMessages, ...customEnglishMessages },
    };

    const i18nProvider = polyglotI18nProvider(() => messages['en'], 'en');

    this.container.bind({
      key: CoreBindings.DEFAULT_I18N_PROVIDER,
      value: i18nProvider,
    });
  }
}
```

**Step 4**: Use with type safety

```typescript
import { useTranslate } from '@minimaltech/ra-core-infra';

function MyComponent() {
  const translate = useTranslate();

  // TypeScript now autocompletes your custom keys!
  return (
    <div>
      <h1>{translate('app.title')}</h1>
      <p>{translate('app.errors.network')}</p>
    </div>
  );
}
```

### Conditional Translation

Translate based on conditions:

```typescript
import { useTranslate } from '@minimaltech/ra-core-infra';

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  const translate = useTranslate();

  const key = status === 'active'
    ? 'app.status.active'
    : 'app.status.inactive';

  return <span>{translate(key)}</span>;
}
```

### Error Messages

Translate error messages from API:

```typescript
import { useTranslate } from '@minimaltech/ra-core-infra';

function FormError({ error }: { error?: string }) {
  const translate = useTranslate();

  if (!error) return null;

  // Map error codes to translation keys
  const errorKey = `app.errors.${error}`;

  return (
    <div className="error">
      {translate(errorKey)}
    </div>
  );
}
```

### Form Validation

Use translations for validation messages:

```typescript
import { useTranslate } from '@minimaltech/ra-core-infra';

function useFormValidation() {
  const translate = useTranslate();

  return {
    required: (value: any) =>
      value ? undefined : translate('ra.validation.required'),

    minLength: (min: number) => (value: string) =>
      value?.length >= min
        ? undefined
        : translate('ra.validation.minLength', { min }),

    email: (value: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? undefined
        : translate('ra.validation.email'),
  };
}

// Usage in form
function UserForm() {
  const validate = useFormValidation();

  return (
    <form>
      <input
        name="email"
        validate={validate.email}
      />
    </form>
  );
}
```

## Related APIs

- [DefaultI18nProvider](/api-reference/providers/default-i18n-provider) - i18n provider configuration
- [useInjectable](/api-reference/hooks/use-injectable) - Direct access to i18n provider
- [CoreBindings](/api-reference/core/core-bindings) - DI binding keys

## Common Issues

### Translation key not found

**Symptom**: Key is returned instead of translation (e.g., shows `"app.welcome"` instead of `"Welcome"`)

**Cause**: Translation key doesn't exist in your message dictionary.

**Solution**: Add the key to your translations:

```typescript
// locales/en.ts
export const messages = {
  app: {
    welcome: 'Welcome to our app!',
  },
};
```

### TypeScript: Key not recognized

**Cause**: Custom translation key not added to type augmentation.

**Solution**: Augment `IUseTranslateKeysOverrides` (see type augmentation example above).

### Interpolation not working

**Symptom**: Shows `%{name}` literally instead of interpolating.

**Cause**: Missing variable in options or incorrect syntax.

**Solution**: Pass variables in options object:

```typescript
// ❌ Wrong
translate('app.welcome', name);

// ✅ Correct
translate('app.welcome', { name: 'John' });
```

### Pluralization not working

**Cause**: Missing or incorrect `smart_count` in options.

**Solution**: Use Polyglot's pluralization syntax with `smart_count`:

```typescript
// Translation: "item |||| items"
translate('app.items', { smart_count: count });
```

### Translation changes not reflecting

**Cause**: i18n provider caches translations.

**Solution**: Restart dev server or reload page after changing translation files.

## Type Safety

### Generated Translation Keys

The `TFullPaths` type utility generates dot-separated paths from your translation objects:

```typescript
const messages = {
  app: {
    user: {
      name: 'Name',
      email: 'Email',
    },
  },
};

// Generated keys:
// "app.user.name"
// "app.user.email"
```

### Type Augmentation Pattern

For custom translations, always augment types to get autocomplete and type checking:

```typescript
declare module '@minimaltech/ra-core-infra' {
  interface IUseTranslateKeysOverrides {
    'app.custom.key': string;
    'app.another.key': string;
  }
}
```

This enables:
- Autocomplete for translation keys
- Type errors for non-existent keys
- Safer refactoring

## Performance

`useTranslate` is optimized for performance:

1. **Memoization**: The translate function is memoized with `useCallback`
2. **No re-renders**: Hook doesn't subscribe to language changes (handled by React Admin)
3. **Fallback**: Fast fallback to identity function if no provider exists

**Tip**: Extract `translate` to a variable instead of calling `useTranslate()` multiple times:

```typescript
// ✅ Efficient - call hook once
function MyComponent() {
  const translate = useTranslate();

  return (
    <>
      <h1>{translate('app.title')}</h1>
      <p>{translate('app.description')}</p>
    </>
  );
}

// ❌ Inefficient - multiple hook calls
function MyComponent() {
  return (
    <>
      <h1>{useTranslate()('app.title')}</h1>
      <p>{useTranslate()('app.description')}</p>
    </>
  );
}
```

## Best Practices

### 1. Use Consistent Key Structure

Organize translation keys hierarchically:

```typescript
{
  app: {
    // UI sections
    header: { ... },
    footer: { ... },

    // Features
    user: { ... },
    products: { ... },

    // Common messages
    errors: { ... },
    validation: { ... },
  }
}
```

### 2. Extract Translation Keys

Define key constants for reusability:

```typescript
// constants/translationKeys.ts
export const TRANSLATION_KEYS = {
  SAVE: 'ra.action.save',
  CANCEL: 'ra.action.cancel',
  WELCOME: 'app.welcome',
} as const;

// Usage
function MyComponent() {
  const translate = useTranslate();
  return <button>{translate(TRANSLATION_KEYS.SAVE)}</button>;
}
```

### 3. Create Custom Translation Hook

Wrap common translation patterns:

```typescript
// hooks/useAppTranslate.ts
import { useTranslate } from '@minimaltech/ra-core-infra';

export function useAppTranslate() {
  const translate = useTranslate();

  return {
    t: translate,
    tError: (code: string) => translate(`app.errors.${code}`),
    tValidation: (rule: string) => translate(`app.validation.${rule}`),
  };
}

// Usage
function MyComponent() {
  const { tError } = useAppTranslate();
  return <div>{tError('network')}</div>;
}
```

### 4. Leverage Polyglot Features

Use Polyglot's advanced features:

```typescript
// Nested interpolation
translate('app.greeting', {
  name: user.name,
  role: translate('app.roles.admin')
});

// Conditional phrases
translate('app.age', {
  _: '%{smart_count} year old',
  plural: '%{smart_count} years old'
});
```

### 5. Keep Translations Close to Features

Organize translation files by feature:

```
locales/
  en/
    common.ts        # Shared translations
    auth.ts          # Authentication
    users.ts         # User management
    products.ts      # Product management
  index.ts           # Merge all translations
```

## See Also

- [Internationalization Guide](/guides/internationalization/) - Complete i18n guide
- [Polyglot Documentation](https://airbnb.io/polyglot.js/) - Polyglot.js docs
- [React Admin i18n](https://marmelab.com/react-admin/Translation.html) - React Admin translations
- [DefaultI18nProvider](/api-reference/providers/default-i18n-provider) - i18n provider API

---

**Next**: Learn about [DefaultI18nProvider](/api-reference/providers/default-i18n-provider) to configure translations.

# DefaultI18nProvider

Internationalization (i18n) provider using Polyglot.js for multi-language support in React Admin applications.

## Import

```typescript
import { DefaultI18nProvider, CoreBindings } from '@minimaltech/ra-core-infra';
import type { II18nProviderOptions } from '@minimaltech/ra-core-infra';
```

## Signature

```typescript
class DefaultI18nProvider extends BaseProvider<I18nProvider>

interface II18nProviderOptions {
  i18nSources?: Record<string, any>;
  listLanguages?: Locale[];
}

interface Locale {
  locale: string;
  name: string;
}

constructor(
  @inject({ key: CoreBindings.I18N_PROVIDER_OPTIONS })
  i18nProviderOptions: II18nProviderOptions
)
```

## Description

`DefaultI18nProvider` provides internationalization (i18n) for React Admin applications using Polyglot.js. It handles translations, locale switching, and automatic browser language detection.

**Key features**:
- Built on Polyglot.js for translations
- Automatic browser language detection
- Fallback to English for missing translations
- Support for multiple languages
- Interpolation and pluralization
- Missing key handling (returns key as-is)
- Default English messages included

**When to use**:
- Add multi-language support to React Admin apps
- Translate UI labels, messages, and validation errors
- Support international users
- Customize React Admin default messages

**Integration**:
- Works seamlessly with React Admin's `<Admin>` component
- Accessible via `useTranslate()` hook
- Automatic language detection from browser settings

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `i18nSources` | `Record<string, any>` | `{ en: englishMessages }` | Translation messages by locale |
| `listLanguages` | `Locale[]` | `[{ locale: 'en', name: 'English' }]` | Available languages |

**Locale Interface**:
```typescript
interface Locale {
  locale: string;  // Locale code (e.g., 'en', 'fr', 'es')
  name: string;    // Display name (e.g., 'English', 'Français')
}
```

---

## Basic Configuration

### Single Language (English only)

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import type { II18nProviderOptions } from '@minimaltech/ra-core-infra';
import englishMessages from 'ra-language-english';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    const i18nOptions: II18nProviderOptions = {
      i18nSources: {
        en: englishMessages,
      },
      listLanguages: [
        { locale: 'en', name: 'English' },
      ],
    };

    this.container.bind({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
      value: i18nOptions,
    });
  }
}
```

---

### Multiple Languages

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import type { II18nProviderOptions } from '@minimaltech/ra-core-infra';
import englishMessages from 'ra-language-english';
import frenchMessages from 'ra-language-french';
import spanishMessages from 'ra-language-spanish';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    const i18nOptions: II18nProviderOptions = {
      i18nSources: {
        en: englishMessages,
        fr: frenchMessages,
        es: spanishMessages,
      },
      listLanguages: [
        { locale: 'en', name: 'English' },
        { locale: 'fr', name: 'Français' },
        { locale: 'es', name: 'Español' },
      ],
    };

    this.container.bind({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
      value: i18nOptions,
    });
  }
}
```

---

### Custom Messages

```typescript
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import type { II18nProviderOptions } from '@minimaltech/ra-core-infra';
import englishMessages from 'ra-language-english';

// Custom English messages
const customEnglishMessages = {
  ...englishMessages,
  resources: {
    users: {
      name: 'User |||| Users',
      fields: {
        name: 'Full Name',
        email: 'Email Address',
        role: 'User Role',
      },
    },
    posts: {
      name: 'Article |||| Articles',
      fields: {
        title: 'Article Title',
        body: 'Content',
        published: 'Published',
      },
    },
  },
  custom: {
    welcome: 'Welcome to our application!',
    logout_confirm: 'Are you sure you want to log out?',
  },
};

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    const i18nOptions: II18nProviderOptions = {
      i18nSources: {
        en: customEnglishMessages,
      },
      listLanguages: [
        { locale: 'en', name: 'English' },
      ],
    };

    this.container.bind({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
      value: i18nOptions,
    });
  }
}
```

---

## Using in React Admin

### With Admin Component

```typescript
import React from 'react';
import { Admin, Resource } from 'react-admin';
import { useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { IDataProvider, IAuthProvider, II18nProvider } from '@minimaltech/ra-core-infra';

function App() {
  const dataProvider = useInjectable<IDataProvider>({
    key: CoreBindings.DEFAULT_REST_DATA_PROVIDER,
  });

  const authProvider = useInjectable<IAuthProvider>({
    key: CoreBindings.DEFAULT_AUTH_PROVIDER,
  });

  const i18nProvider = useInjectable<II18nProvider>({
    key: CoreBindings.DEFAULT_I18N_PROVIDER,
  });

  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
    >
      <Resource name="users" />
      <Resource name="posts" />
    </Admin>
  );
}
```

---

### Using Translations in Components

```typescript
import React from 'react';
import { useTranslate } from 'react-admin';

function WelcomeMessage() {
  const translate = useTranslate();

  return (
    <div>
      <h1>{translate('custom.welcome')}</h1>
      <p>{translate('ra.page.dashboard')}</p>
    </div>
  );
}
```

---

### Language Switcher

```typescript
import React from 'react';
import { useSetLocale, useLocaleState } from 'react-admin';
import { Button, Menu, MenuItem } from '@mui/material';

function LanguageSwitcher() {
  const [locale] = useLocaleState();
  const setLocale = useSetLocale();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (newLocale: string) => {
    setLocale(newLocale);
    handleClose();
  };

  return (
    <>
      <Button onClick={handleClick}>
        {locale.toUpperCase()}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
        <MenuItem onClick={() => changeLanguage('fr')}>Français</MenuItem>
        <MenuItem onClick={() => changeLanguage('es')}>Español</MenuItem>
      </Menu>
    </>
  );
}
```

---

## Translation Message Structure

### React Admin Resource Translations

```typescript
const messages = {
  resources: {
    users: {
      name: 'User |||| Users',  // Singular |||| Plural
      fields: {
        id: 'ID',
        name: 'Name',
        email: 'Email',
        role: 'Role',
      },
      actions: {
        create: 'Create User',
        edit: 'Edit User',
        delete: 'Delete User',
      },
    },
  },
};
```

---

### Custom Translations

```typescript
const messages = {
  custom: {
    // Simple strings
    app_name: 'My Application',
    welcome: 'Welcome!',

    // Interpolation
    greeting: 'Hello, %{name}!',
    items_count: 'You have %{count} items',

    // Pluralization
    notifications: 'No notifications |||| One notification |||| %{smart_count} notifications',
  },
};
```

**Usage**:
```typescript
const translate = useTranslate();

// Simple
translate('custom.app_name');  // 'My Application'

// Interpolation
translate('custom.greeting', { name: 'John' });  // 'Hello, John!'

// Pluralization
translate('custom.notifications', { smart_count: 0 });  // 'No notifications'
translate('custom.notifications', { smart_count: 1 });  // 'One notification'
translate('custom.notifications', { smart_count: 5 });  // '5 notifications'
```

---

## Complete Examples

### Multi-Language Application

```typescript
// Application setup
import { BaseRaApplication, CoreBindings } from '@minimaltech/ra-core-infra';
import type { II18nProviderOptions } from '@minimaltech/ra-core-infra';
import englishMessages from 'ra-language-english';
import frenchMessages from 'ra-language-french';

export class MyApplication extends BaseRaApplication {
  bindContext() {
    super.bindContext();

    // Custom translations
    const customEnglish = {
      ...englishMessages,
      resources: {
        products: {
          name: 'Product |||| Products',
          fields: {
            name: 'Product Name',
            price: 'Price',
            stock: 'Stock Level',
          },
        },
      },
      custom: {
        dashboard: {
          title: 'Dashboard',
          welcome: 'Welcome back, %{name}!',
          stats: {
            sales: 'Total Sales',
            orders: 'Orders Today',
            revenue: 'Revenue',
          },
        },
      },
    };

    const customFrench = {
      ...frenchMessages,
      resources: {
        products: {
          name: 'Produit |||| Produits',
          fields: {
            name: 'Nom du Produit',
            price: 'Prix',
            stock: 'Niveau de Stock',
          },
        },
      },
      custom: {
        dashboard: {
          title: 'Tableau de Bord',
          welcome: 'Bon retour, %{name}!',
          stats: {
            sales: 'Ventes Totales',
            orders: 'Commandes Aujourd\'hui',
            revenue: 'Revenu',
          },
        },
      },
    };

    const i18nOptions: II18nProviderOptions = {
      i18nSources: {
        en: customEnglish,
        fr: customFrench,
      },
      listLanguages: [
        { locale: 'en', name: 'English' },
        { locale: 'fr', name: 'Français' },
      ],
    };

    this.container.bind({
      key: CoreBindings.I18N_PROVIDER_OPTIONS,
      value: i18nOptions,
    });
  }
}
```

**React App**:
```typescript
import React from 'react';
import { Admin, Resource, ListGuesser } from 'react-admin';
import { ApplicationContext, useInjectable, CoreBindings } from '@minimaltech/ra-core-infra';
import type { II18nProvider } from '@minimaltech/ra-core-infra';
import { MyApplication } from './MyApplication';

export function App() {
  const [app] = React.useState(() => {
    const application = new MyApplication();
    application.start();
    return application;
  });

  return (
    <ApplicationContext.Provider
      value={{
        container: app.container,
        logger: app.logger,
        registry: app.registry,
      }}
    >
      <AdminApp />
    </ApplicationContext.Provider>
  );
}

function AdminApp() {
  const i18nProvider = useInjectable<II18nProvider>({
    key: CoreBindings.DEFAULT_I18N_PROVIDER,
  });

  return (
    <Admin i18nProvider={i18nProvider}>
      <Resource name="products" list={ListGuesser} />
    </Admin>
  );
}
```

---

### Custom Dashboard with Translations

```typescript
import React from 'react';
import { useTranslate } from 'react-admin';
import { Card, CardContent, Typography, Grid } from '@mui/material';

function Dashboard() {
  const translate = useTranslate();
  const userName = 'John Doe';

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {translate('custom.dashboard.title')}
      </Typography>

      <Typography variant="h6" gutterBottom>
        {translate('custom.dashboard.welcome', { name: userName })}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {translate('custom.dashboard.stats.sales')}
              </Typography>
              <Typography variant="h4">$12,345</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {translate('custom.dashboard.stats.orders')}
              </Typography>
              <Typography variant="h4">42</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {translate('custom.dashboard.stats.revenue')}
              </Typography>
              <Typography variant="h4">$8,765</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

export default Dashboard;
```

---

### Validation Messages

```typescript
// Custom validation messages
const customEnglishMessages = {
  ...englishMessages,
  validation: {
    required: 'This field is required',
    minLength: 'Must be at least %{min} characters',
    maxLength: 'Must be at most %{max} characters',
    email: 'Must be a valid email',
    url: 'Must be a valid URL',
  },
};

// Using in form validation
import { required, minLength, email } from 'react-admin';
import { useTranslate } from 'react-admin';

function UserForm() {
  const translate = useTranslate();

  const validateEmail = [
    required(translate('validation.required')),
    email(translate('validation.email')),
  ];

  const validateName = [
    required(translate('validation.required')),
    minLength(3, translate('validation.minLength', { min: 3 })),
  ];

  return (
    <SimpleForm>
      <TextInput source="name" validate={validateName} />
      <TextInput source="email" validate={validateEmail} />
    </SimpleForm>
  );
}
```

---

## Related APIs

- [useTranslate](/api-reference/hooks/use-translate) - Hook for translating messages
- [CoreBindings](/api-reference/core/core-bindings) - DI binding keys
- [BaseRaApplication](/api-reference/core/base-ra-application) - Application setup
- [Polyglot.js](https://airbnb.io/polyglot.js/) - Translation library
- [React Admin i18n](https://marmelab.com/react-admin/Translation.html) - React Admin i18n docs

## Common Issues

### Browser language not detected

**Cause**: Browser language code doesn't match available locales.

**Solution**: Add fallback logic or more locales:

```typescript
const i18nOptions: II18nProviderOptions = {
  i18nSources: {
    en: englishMessages,
    'en-US': englishMessages,  // Support both 'en' and 'en-US'
    'en-GB': englishMessages,
  },
  listLanguages: [
    { locale: 'en', name: 'English' },
  ],
};
```

### Missing translations show keys

**Cause**: This is expected behavior (configured with `allowMissing: true`).

**Solution**: Add missing translations or accept showing keys:

```typescript
// The provider returns the key itself for missing translations
translate('custom.missing_key');  // Returns: 'custom.missing_key'

// Add the translation:
const messages = {
  custom: {
    missing_key: 'Actual translation',
  },
};
```

### Language doesn't change

**Cause**: Not using `useSetLocale()` hook properly.

**Solution**: Use React Admin's locale management:

```typescript
import { useSetLocale } from 'react-admin';

function LanguageSwitcher() {
  const setLocale = useSetLocale();

  return (
    <button onClick={() => setLocale('fr')}>
      Switch to French
    </button>
  );
}
```

### Pluralization not working

**Cause**: Incorrect pluralization syntax.

**Solution**: Use `||||` separator with `smart_count`:

```typescript
// ❌ Wrong
const messages = {
  items: '%{count} items',
};

// ✅ Correct
const messages = {
  items: 'No items |||| One item |||| %{smart_count} items',
};

// Usage
translate('items', { smart_count: 0 });  // 'No items'
translate('items', { smart_count: 1 });  // 'One item'
translate('items', { smart_count: 5 });  // '5 items'
```

## Best Practices

### 1. Organize Translations by Domain

Structure messages logically:

```typescript
const messages = {
  resources: {
    // Resource-specific translations
    users: { /* ... */ },
    posts: { /* ... */ },
  },
  custom: {
    // Custom app translations
    dashboard: { /* ... */ },
    auth: { /* ... */ },
    navigation: { /* ... */ },
  },
  validation: {
    // Validation messages
    required: 'Required',
    email: 'Invalid email',
  },
};
```

### 2. Use Interpolation for Dynamic Content

Replace hardcoded values with placeholders:

```typescript
// ❌ Wrong - hardcoded
const messages = {
  welcome: 'Welcome, John!',
};

// ✅ Correct - interpolation
const messages = {
  welcome: 'Welcome, %{name}!',
};

translate('welcome', { name: userName });
```

### 3. Extract Common Translations

Avoid duplication:

```typescript
const messages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm: 'Confirm',
  },
  users: {
    save_user: translate('common.save'),  // Reuse
  },
};
```

### 4. Type-Safe Translation Keys

Use TypeScript for autocomplete:

```typescript
// Define message keys
type MessageKeys =
  | 'custom.welcome'
  | 'custom.dashboard.title'
  | 'resources.users.name';

// Type-safe translate function
function useTypedTranslate() {
  const translate = useTranslate();
  return (key: MessageKeys, options?: any) => translate(key, options);
}

// Usage with autocomplete
const t = useTypedTranslate();
t('custom.welcome');  // TypeScript checks this!
```

### 5. Lazy Load Translation Files

For large applications, split translations:

```typescript
async function loadMessages(locale: string) {
  const messages = await import(`./i18n/${locale}.json`);
  return messages.default;
}

const i18nOptions: II18nProviderOptions = {
  i18nSources: {
    en: await loadMessages('en'),
    fr: await loadMessages('fr'),
  },
  listLanguages: [
    { locale: 'en', name: 'English' },
    { locale: 'fr', name: 'Français' },
  ],
};
```

## Performance Tips

1. **Memoize translation results**: Cache frequently used translations
2. **Split large translation files**: Lazy load translations by feature
3. **Avoid inline translations**: Define all translations upfront
4. **Use string keys**: Faster lookup than nested object access

```typescript
// Cache translations in React
function useCachedTranslate(key: string) {
  const translate = useTranslate();
  return React.useMemo(() => translate(key), [translate, key]);
}
```

## Accessibility

Ensure translations support accessibility:

```typescript
const messages = {
  custom: {
    close_button: 'Close',
    close_button_aria: 'Close dialog',  // Separate ARIA label
  },
};

<button
  aria-label={translate('custom.close_button_aria')}
>
  {translate('custom.close_button')}
</button>
```

## See Also

- [Internationalization Guide](/guides/i18n/) - Complete i18n guide
- [useTranslate Hook](/api-reference/hooks/use-translate) - Translation hook
- [React Admin Translation](https://marmelab.com/react-admin/Translation.html) - React Admin i18n
- [Polyglot.js Documentation](https://airbnb.io/polyglot.js/) - Polyglot library docs

---

**Next**: Learn about [useApplicationContext](/api-reference/hooks/use-application-context) for accessing the DI container.

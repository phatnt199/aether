# Utility Hooks

Collection of React hooks for common UI patterns including auto-save, debouncing, confirmation dialogs, clipboard, browser events, and responsive design.

## Import

```typescript
import {
  useAutosave,
  useDebounce,
  useConfirm,
  useCopyToClipboard,
  useBeforeUnload,
  useDocumentTitle,
  useSizer,
  useWindowDimensions,
} from '@minimaltech/ra-core-infra';
```

## Overview

The @ra-core-infra library provides 8 utility hooks for common React patterns:

| Hook | Purpose | Use Case |
|------|---------|----------|
| [useAutosave](#useautosave) | Auto-save form data | Forms with auto-save functionality |
| [useDebounce](#usedebounce) | Debounce value changes | Search inputs, expensive operations |
| [useConfirm](#useconfirm) | Confirmation dialogs | Delete confirmations, destructive actions |
| [useCopyToClipboard](#usecopytoclipboard) | Copy to clipboard | Share links, copy codes |
| [useBeforeUnload](#usebeforeunload) | Prevent page unload | Unsaved form changes warning |
| [useDocumentTitle](#usedocumenttitle) | Set page title | Dynamic page titles |
| [useSizer](#usesizer) | Track element size | Responsive components |
| [useWindowDimensions](#usewindowdimensions) | Track window size | Responsive layouts |

---

## useAutosave

Auto-save form data with debouncing and optional save on unmount.

### Signature

```typescript
function useAutosave<TData, TReturn>(params: {
  data: TData;
  onSave: (data: TData) => Promise<TReturn> | TReturn | void;
  interval?: number;  // default: 2000ms
  enableSaveOnUnmount?: boolean;
  disabled?: boolean;
}): void
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| data | `TData` | Yes | - | Form data to auto-save |
| onSave | `(data: TData) => Promise<TReturn> \| TReturn \| void` | Yes | - | Save callback function |
| interval | `number` | No | `2000` | Milliseconds between saves |
| enableSaveOnUnmount | `boolean` | No | `undefined` | Save on component unmount |
| disabled | `boolean` | No | `false` | Disable auto-save |

### Examples

#### Basic Form Auto-Save

```typescript
import React from 'react';
import { useAutosave } from '@minimaltech/ra-core-infra';

interface IFormData {
  title: string;
  content: string;
}

function BlogEditor() {
  const [formData, setFormData] = React.useState<IFormData>({
    title: '',
    content: '',
  });

  // Auto-save every 2 seconds
  useAutosave({
    data: formData,
    onSave: async (data) => {
      await fetch('/api/drafts/save', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('Draft saved!');
    },
  });

  return (
    <form>
      <input
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Title"
      />
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        placeholder="Content"
      />
    </form>
  );
}
```

#### Custom Interval and Save on Unmount

```typescript
function NoteEditor() {
  const [note, setNote] = React.useState('');

  useAutosave({
    data: note,
    onSave: async (content) => {
      await saveNote(content);
    },
    interval: 5000,  // Save every 5 seconds
    enableSaveOnUnmount: true,  // Save when component unmounts
  });

  return (
    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Take notes..."
    />
  );
}
```

#### Conditional Auto-Save

```typescript
function TodoForm() {
  const [todo, setTodo] = React.useState({ title: '', done: false });
  const [isDirty, setIsDirty] = React.useState(false);

  useAutosave({
    data: todo,
    onSave: async (data) => {
      await saveTodo(data);
      setIsDirty(false);
    },
    disabled: !isDirty,  // Only auto-save when form is dirty
  });

  return (
    <input
      value={todo.title}
      onChange={(e) => {
        setTodo({ ...todo, title: e.target.value });
        setIsDirty(true);
      }}
    />
  );
}
```

---

## useDebounce

Debounce value changes to reduce expensive operations.

### Signature

```typescript
function useDebounce<TValue>(params: {
  value: TValue;
  delay?: number;
  disabled?: boolean;
}): {
  debouncedValue: TValue;
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| value | `TValue` | Yes | - | Value to debounce |
| delay | `number` | No | App.DEFAULT_DEBOUNCE_TIME | Delay in milliseconds |
| disabled | `boolean` | No | `false` | Disable debouncing |

### Returns

`{ debouncedValue: TValue }` - Debounced value

### Examples

#### Search Input Debouncing

```typescript
import React from 'react';
import { useDebounce } from '@minimaltech/ra-core-infra';

function UserSearch() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { debouncedValue } = useDebounce({
    value: searchTerm,
    delay: 500,  // 500ms delay
  });

  React.useEffect(() => {
    if (debouncedValue) {
      // Only search after user stops typing for 500ms
      searchUsers(debouncedValue);
    }
  }, [debouncedValue]);

  return (
    <input
      type="search"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search users..."
    />
  );
}
```

#### API Call Debouncing

```typescript
function AutocompleteInput() {
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState([]);

  const { debouncedValue: debouncedQuery } = useDebounce({
    value: query,
    delay: 300,
  });

  React.useEffect(() => {
    async function fetchSuggestions() {
      if (debouncedQuery.length >= 3) {
        const results = await fetch(`/api/suggestions?q=${debouncedQuery}`);
        setSuggestions(await results.json());
      }
    }

    fetchSuggestions();
  }, [debouncedQuery]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search..."
      />
      <ul>
        {suggestions.map(s => <li key={s.id}>{s.name}</li>)}
      </ul>
    </div>
  );
}
```

---

## useConfirm

Promise-based confirmation dialogs for user actions.

### Signature

```typescript
function useConfirm(): {
  message?: string;
  confirm: (opts: { message: string }) => Promise<boolean>;
  handleClose: () => void;
  handleConfirm: () => void;
  handleAbort: () => void;
}
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| message | `string \| undefined` | Current confirmation message |
| confirm | `(opts: { message: string }) => Promise<boolean>` | Trigger confirmation dialog |
| handleClose | `() => void` | Close dialog without action |
| handleConfirm | `() => void` | Confirm action (resolves to `true`) |
| handleAbort | `() => void` | Cancel action (resolves to `false`) |

### Examples

#### Delete Confirmation

```typescript
import React from 'react';
import { useConfirm } from '@minimaltech/ra-core-infra';

function UserList() {
  const { message, confirm, handleConfirm, handleAbort } = useConfirm();

  async function handleDelete(userId: string) {
    const confirmed = await confirm({
      message: 'Are you sure you want to delete this user?',
    });

    if (confirmed) {
      await deleteUser(userId);
    }
  }

  return (
    <div>
      <button onClick={() => handleDelete('user-123')}>
        Delete User
      </button>

      {message && (
        <div className="modal">
          <p>{message}</p>
          <button onClick={handleConfirm}>Confirm</button>
          <button onClick={handleAbort}>Cancel</button>
        </div>
      )}
    </div>
  );
}
```

#### Discard Changes Confirmation

```typescript
function FormEditor() {
  const { message, confirm, handleConfirm, handleAbort, handleClose } = useConfirm();
  const [hasChanges, setHasChanges] = React.useState(false);

  async function handleExit() {
    if (!hasChanges) {
      exitEditor();
      return;
    }

    const shouldExit = await confirm({
      message: 'You have unsaved changes. Do you want to discard them?',
    });

    if (shouldExit) {
      exitEditor();
    }
  }

  return (
    <>
      <button onClick={handleExit}>Exit</button>

      {message && (
        <dialog open>
          <h3>Confirm</h3>
          <p>{message}</p>
          <button onClick={handleConfirm}>Discard</button>
          <button onClick={handleAbort}>Keep Editing</button>
        </dialog>
      )}
    </>
  );
}
```

---

## useCopyToClipboard

Copy text to clipboard using the Clipboard API.

### Signature

```typescript
function useCopyToClipboard(): {
  copy: (opts: { value: string }) => Promise<boolean>;
}
```

### Returns

`{ copy: (opts: { value: string }) => Promise<boolean> }` - Copy function that returns `true` on success

### Examples

#### Copy Button

```typescript
import React from 'react';
import { useCopyToClipboard } from '@minimaltech/ra-core-infra';

function ShareLink({ url }: { url: string }) {
  const { copy } = useCopyToClipboard();
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    const success = await copy({ value: url });

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      <input value={url} readOnly />
      <button onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
```

#### Copy Code Snippet

```typescript
function CodeBlock({ code }: { code: string }) {
  const { copy } = useCopyToClipboard();

  return (
    <pre>
      <code>{code}</code>
      <button
        onClick={async () => {
          const success = await copy({ value: code });
          if (success) {
            alert('Code copied to clipboard!');
          }
        }}
      >
        Copy
      </button>
    </pre>
  );
}
```

---

## useBeforeUnload

Prevent browser unload with custom warning message.

### Signature

```typescript
function useBeforeUnload(params: {
  enabled: boolean | (() => boolean);
  message?: string;
}): void
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| enabled | `boolean \| (() => boolean)` | Yes | Enable/disable warning (can be function) |
| message | `string` | No | Custom warning message |

### Examples

#### Unsaved Changes Warning

```typescript
import React from 'react';
import { useBeforeUnload } from '@minimaltech/ra-core-infra';

function FormEditor() {
  const [formData, setFormData] = React.useState({ title: '', content: '' });
  const [saved, setSaved] = React.useState(true);

  // Warn if form has unsaved changes
  useBeforeUnload({
    enabled: !saved,
    message: 'You have unsaved changes. Are you sure you want to leave?',
  });

  return (
    <form>
      <input
        value={formData.title}
        onChange={(e) => {
          setFormData({ ...formData, title: e.target.value });
          setSaved(false);
        }}
      />
      <button onClick={() => setSaved(true)}>Save</button>
    </form>
  );
}
```

#### Conditional Warning with Function

```typescript
function GameEditor() {
  const [gameState, setGameState] = React.useState({ started: false, saved: true });

  // Only warn if game is started and not saved
  useBeforeUnload({
    enabled: () => gameState.started && !gameState.saved,
    message: 'Your game progress will be lost!',
  });

  return <div>Game content</div>;
}
```

---

## useDocumentTitle

Set document title with automatic cleanup.

### Signature

```typescript
function useDocumentTitle(params: {
  value?: string;
  defaultValue?: string;
}): void
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| value | `string` | No | `''` | New document title |
| defaultValue | `string` | No | `''` | Title to restore on unmount |

### Examples

#### Dynamic Page Title

```typescript
import React from 'react';
import { useDocumentTitle } from '@minimaltech/ra-core-infra';

function UserProfile({ userName }: { userName: string }) {
  useDocumentTitle({
    value: `${userName} - User Profile`,
    defaultValue: 'My App',
  });

  return <div>User profile for {userName}</div>;
}
```

#### Route-Based Title

```typescript
function ProductPage({ productName }: { productName: string }) {
  useDocumentTitle({
    value: `${productName} | Store`,
    defaultValue: 'Store | Home',
  });

  return <div>Product: {productName}</div>;
}
```

---

## useSizer

Track element dimensions using ResizeObserver.

### Signature

```typescript
function useSizer(props: {
  containerId: string;
}): {
  width: number;
  height: number;
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| containerId | `string` | Yes | DOM element ID to observe |

### Returns

`{ width: number, height: number }` - Element dimensions

### Examples

#### Responsive Chart

```typescript
import React from 'react';
import { useSizer } from '@minimaltech/ra-core-infra';

function ResponsiveChart() {
  const { width, height } = useSizer({ containerId: 'chart-container' });

  return (
    <div id="chart-container" style={{ width: '100%', height: '400px' }}>
      <svg width={width} height={height}>
        {/* Chart rendered at container size */}
        <rect width={width} height={height} fill="lightblue" />
      </svg>
    </div>
  );
}
```

#### Adaptive Layout

```typescript
function AdaptiveGrid() {
  const { width } = useSizer({ containerId: 'grid-container' });

  const columns = width > 1200 ? 4 : width > 768 ? 3 : width > 480 ? 2 : 1;

  return (
    <div
      id="grid-container"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {/* Grid items */}
    </div>
  );
}
```

---

## useWindowDimensions

Track window dimensions with resize listener.

### Signature

```typescript
function useWindowDimensions(): {
  width: number;
  height: number;
}
```

### Returns

`{ width: number, height: number }` - Window dimensions

### Examples

#### Responsive Layout

```typescript
import React from 'react';
import { useWindowDimensions } from '@minimaltech/ra-core-infra';

function ResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return (
    <div>
      <p>Window size: {width}x{height}</p>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

#### Conditional Rendering

```typescript
function NavigationBar() {
  const { width } = useWindowDimensions();

  return (
    <nav>
      {width > 768 ? (
        <FullNavigation />
      ) : (
        <MobileNavigation />
      )}
    </nav>
  );
}
```

---

## Best Practices

### useAutosave

```typescript
// ✅ Good - clean save function
useAutosave({
  data: formData,
  onSave: async (data) => {
    await api.save(data);
  },
  interval: 3000,
});

// ❌ Bad - side effects in onSave
useAutosave({
  data: formData,
  onSave: (data) => {
    setSaved(true);  // Causes re-render
    showToast('Saved!');  // Side effect
    api.save(data);
  },
});
```

### useDebounce

```typescript
// ✅ Good - use debounced value in effect
const { debouncedValue } = useDebounce({ value: search, delay: 500 });

React.useEffect(() => {
  searchAPI(debouncedValue);
}, [debouncedValue]);

// ❌ Bad - debouncing in onChange
<input onChange={(e) => {
  const debounced = debounce(e.target.value, 500);  // Wrong!
  setSearch(debounced);
}} />
```

### useConfirm

```typescript
// ✅ Good - await confirmation
const confirmed = await confirm({ message: 'Delete?' });
if (confirmed) {
  deleteItem();
}

// ❌ Bad - not awaiting
confirm({ message: 'Delete?' });
deleteItem();  // Deletes immediately!
```

### useCopyToClipboard

```typescript
// ✅ Good - check success
const success = await copy({ value: text });
if (success) {
  showToast('Copied!');
} else {
  showToast('Failed to copy');
}

// ❌ Bad - assume success
await copy({ value: text });
showToast('Copied!');  // May not be true
```

---

## Common Issues

### useAutosave not saving

**Cause**: `data` reference not changing.

**Solution**: Ensure `data` is a new object/array reference:

```typescript
// ✅ Good - new object
setFormData({ ...formData, title: newTitle });

// ❌ Bad - mutating
formData.title = newTitle;
```

### useDebounce not debouncing

**Cause**: Creating hook in wrong scope.

**Solution**: Call `useDebounce` at component top level:

```typescript
// ✅ Good
function Component() {
  const [value, setValue] = React.useState('');
  const { debouncedValue } = useDebounce({ value, delay: 500 });
}

// ❌ Bad - inside handler
function handleChange(val) {
  const { debouncedValue } = useDebounce({ value: val, delay: 500 });
}
```

### useSizer returning 0

**Cause**: Element doesn't exist when hook mounts.

**Solution**: Ensure element exists:

```typescript
// ✅ Good - element exists
<div id="container">
  <Component />
</div>

function Component() {
  const { width } = useSizer({ containerId: 'container' });
}

// ❌ Bad - container doesn't exist
function Component() {
  const { width } = useSizer({ containerId: 'nonexistent' });
}
```

---

## See Also

- [useInjectable](/api-reference/hooks/use-injectable) - Dependency injection hook
- [useTranslate](/api-reference/hooks/use-translate) - Translation hook
- [useApplicationContext](/api-reference/hooks/use-application-context) - Application context hooks
- [React Hooks Documentation](https://react.dev/reference/react) - Official React hooks

---

**Next**: Learn about [Error Utilities](/api-reference/utilities/error-utilities) for error handling.

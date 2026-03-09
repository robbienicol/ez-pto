# Coding Standards

## Core Philosophy

- **Avoid over-engineering.** Write the minimum complexity needed for the current task.
- **Prefer derived state over synced state.** If you can compute something from existing data, use `useMemo` rather than a `useState` + `useEffect` pair.
- **Minimize `useEffect`.** If you find yourself writing a `useEffect` to sync state, stop and rethink. Most `useEffect` usage is a sign that state should be restructured or derived differently.
- **Extract business logic into hooks.** Components should be presentational; hooks own data fetching, mutations, and derived state.

---

## Project Structure

```
src/
├── api/
│   ├── client/          # authFetch, client wrapper, types, mock data
│   ├── hooks/           # React Query hooks (one file per resource)
│   ├── alertApi/
│   ├── deviceApi/
│   ├── siteApi/
│   └── ...              # one folder per API domain
├── components/
│   ├── atoms/           # base primitives (ThemedText, ThemedButton, etc.)
│   ├── molecules/       # composed from atoms
│   └── organisms/       # composed from molecules, may own local state
├── screens/             # one folder per route/stack
├── state/               # React context providers (auth, selectedSite, theme)
├── config/              # CONFIG, DEBUG flags
├── navigation/
└── utils/
```

---

## TypeScript

- Strict mode is always on. Never use `any`.
- Use `interface` for component props.
- Use `type` for unions, intersections, and aliases.
- Prefer type inference where the type is obvious.
- Extend existing types with intersection rather than redefining fields:

```typescript
// Good
type ParsedDevice = Device & { isOnline: boolean };

// Bad
type ParsedDevice = {
  id: string;
  name: string;
  isOnline: boolean;
};
```

---

## Components

### Structure

```typescript
import { useCallback, useMemo } from 'react';
import { TouchableOpacity } from 'react-native';

interface MyComponentProps {
  itemId: string;
  onPress?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ itemId, onPress }) => {
  // 1. Hooks (data, context, navigation)
  // 2. Derived state (useMemo)
  // 3. Handlers (useCallback)
  // 4. Early returns for loading/error
  // 5. Return JSX
};
```

### Key Rules

- Use `React.FC<Props>` for all components.
- Use `useCallback` for all event handlers passed as props.
- Use `useMemo` for derived state that requires computation.
- Use `React.memo()` on list item components and any component that receives stable props.

```typescript
function DeviceCardInner({ device }: { device: Device }) {
  return <View>{/* ... */}</View>;
}
export const DeviceCard = memo(DeviceCardInner);
```

---

## Data Fetching

### React Query + REST

We use **React Query for caching and async state**, and **`fetchWithAuth`** for executing REST API calls. React Query is the single source of truth for all server state — never store API responses in local `useState`.

**Hook pattern** — one file per resource in `src/api/hooks/`:

```typescript
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@src/state/auth/AuthProvider';
import { useSelectedSite } from '@src/state/SelectedSiteProvider';
import { fetchWithAuth, AuthenticatedFetchOptions } from '@src/api/client/authFetch';
import { CONFIG } from '@src/config';
import { Device } from '@src/api/client/MockTypes';

type AuthContext = Pick<AuthenticatedFetchOptions, 'accessToken' | 'getAccessToken'>;

// Export query key so other hooks can invalidate it
export function devicesQueryKey(siteId: string) {
  return ['DEVICES', siteId] as const;
}

async function fetchDevices(siteId: string, auth: AuthContext): Promise<Device[]> {
  const response = await fetchWithAuth(
    `${CONFIG.apiBaseUrl}api/devices/devices?siteId=${encodeURIComponent(siteId)}`,
    { ...auth },
  );
  if (!response.ok) {
    throw new Error(`Failed to get devices (status ${response.status})`);
  }
  return response.json();
}

export function useDevices() {
  const { accessToken, getAccessToken } = useAuth();
  const { selectedSiteId } = useSelectedSite();

  const enabled = !!accessToken && !!selectedSiteId;
  const queryKey = useMemo(
    () => (selectedSiteId ? devicesQueryKey(selectedSiteId) : (['DEVICES', ''] as const)),
    [selectedSiteId],
  );

  const { data, status: queryStatus, isFetching, error, refetch } = useQuery({
    queryKey,
    enabled,
    queryFn: () => fetchDevices(selectedSiteId!, { accessToken, getAccessToken }),
    retry: 1,
  });

  const status =
    !enabled
      ? 'loading'
      : queryStatus === 'pending'
        ? 'loading'
        : queryStatus === 'success'
          ? 'success'
          : 'error';

  return {
    devices: data ?? [],
    status,
    isLoading: enabled ? queryStatus === 'pending' : false,
    isFetching,
    error: error?.message ?? null,
    refetch,
  };
}
```

### Query Keys

Each hook **exports its own query key function** and other hooks import it when they need to invalidate:

```typescript
// In useDevices.ts
export function devicesQueryKey(siteId: string) {
  return ['DEVICES', siteId] as const;
}

// In a mutation hook that needs to invalidate devices
import { devicesQueryKey } from '@src/api/hooks/useDevices';
queryClient.invalidateQueries({ queryKey: devicesQueryKey(siteId) });
```

Never hardcode a raw array inline — always use the exported key function.

### Conditional Queries

Use the `enabled` option — never conditionally return inside `queryFn`:

```typescript
// Good
useQuery({
  queryKey: deviceQueryKey(deviceId),
  queryFn: () => fetchDevice(deviceId, { accessToken, getAccessToken }),
  enabled: !!accessToken && !!deviceId,
});

// Bad
queryFn: async () => {
  if (!deviceId) return; // never do this
  return fetchDevice(deviceId);
},
```

### Mutations

```typescript
const { mutate: renameDevice, isPending: isRenaming } = useMutation({
  mutationFn: (name: string) =>
    updateDeviceName(deviceId, name, { accessToken, getAccessToken }),
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});

// Return from hook
return { renameDevice, isRenaming, error: mutation.error ?? null };
```

### Optimistic Updates

Use `onMutate` + `onError` rollback for instant UI feedback:

```typescript
const { mutate } = useMutation({
  mutationFn: updateDeviceName,

  onMutate: async (name) => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData<Device>(queryKey);
    if (previous) {
      queryClient.setQueryData<Device>(queryKey, { ...previous, name });
    }
    return { previous };
  },

  onError: (_err, _name, ctx) => {
    if (ctx?.previous) {
      queryClient.setQueryData(queryKey, ctx.previous);
    }
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});
```

### Retry Strategy (for critical queries)

```typescript
retry: 6,
retryDelay: (failureCount) => {
  if (failureCount <= 2) return 500;
  return Math.min(1000 * 2 ** (failureCount - 2), 10_000);
},
```

---

## Avoiding `useEffect`

`useEffect` should be a last resort. Before writing one, ask:

| What you want                  | Better approach                          |
| ------------------------------ | ---------------------------------------- |
| Compute value from state/props | `useMemo`                                |
| Handle event/user interaction  | `useCallback` / event handler            |
| Fetch data on mount            | `useQuery` with `enabled`                |
| Sync state from prop changes   | Derive from props directly               |
| Update one state from another  | Merge into a single state object         |

**Acceptable `useEffect` uses:**
- Syncing a Reanimated `sharedValue` with React state
- Subscribing to native event listeners (focus, keyboard, etc.)
- Running imperative code after render (calling `.expand()` on a ref)

**Not acceptable:**
- Fetching data (`useQuery` handles this)
- Syncing one `useState` from another `useState`
- Computing derived state that could be a `useMemo`

---

## Hook Conventions

- A hook that returns query data must also return `status`, `isLoading`, and `error`.
- A hook that wraps a mutation must return `{ mutate/mutateAsync, isPending, error }`.
- Hooks that combine multiple concerns (query + mutation for the same resource) live in the same file.

---

## Common Patterns

| Scenario                  | Pattern                                                        |
| ------------------------- | -------------------------------------------------------------- |
| Data fetching             | `useQuery` + `fetchWithAuth` + exported query key function     |
| Optimistic UI             | `onMutate` + `onError` rollback in `useMutation`               |
| Auth-conditional queries  | `enabled: !!accessToken && !!requiredParam`                    |
| Derived state             | `useMemo` (never `useState` + `useEffect`)                     |
| Event handlers            | `useCallback` with explicit dependency arrays                  |
| Cross-hook invalidation   | Import the other hook's exported query key function            |
| Mock support              | Check `DEBUG.enableMocking` in `queryFn`, fall back to `apiGet`|

import { useEffect, useRef, useState } from 'react';
import { getVariantStorageKey } from '../config/appVariant';

const LOCAL_STORAGE_EVENT = 'hercare-local-storage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const storageKey = getVariantStorageKey(key);

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(storageKey);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${storageKey}":`, error);
      return initialValue;
    }
  });
  const valueRef = useRef(storedValue);

  useEffect(() => {
    valueRef.current = storedValue;
  }, [storedValue]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== storageKey) {
        return;
      }

      try {
        const nextValue = event.newValue ? (JSON.parse(event.newValue) as T) : initialValue;
        valueRef.current = nextValue;
        setStoredValue(nextValue);
      } catch (error) {
        console.warn(`Error syncing localStorage key "${storageKey}":`, error);
      }
    };

    const handleLocalEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ key: string; value: T }>;

      if (!customEvent.detail || customEvent.detail.key !== storageKey) {
        return;
      }

      valueRef.current = customEvent.detail.value;
      setStoredValue(customEvent.detail.value);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(LOCAL_STORAGE_EVENT, handleLocalEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(LOCAL_STORAGE_EVENT, handleLocalEvent as EventListener);
    };
  }, [initialValue, storageKey]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const currentValue = valueRef.current;
      const valueToStore = value instanceof Function ? value(currentValue) : value;

      valueRef.current = valueToStore;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(valueToStore));
        window.dispatchEvent(
          new CustomEvent(LOCAL_STORAGE_EVENT, {
            detail: {
              key: storageKey,
              value: valueToStore,
            },
          }),
        );
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${storageKey}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

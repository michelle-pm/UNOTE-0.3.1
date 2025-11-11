import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function getInitialValue<T>(key: string, initialValue: T, userId?: string | null): T {
  const prefixedKey = userId ? `${userId}_${key}` : key;

  if (typeof window === 'undefined') {
    return initialValue;
  }

  const item = window.localStorage.getItem(prefixedKey);

  // Explicitly check for null or the literal string "undefined", which can be stored by mistake.
  if (item === null || item === "undefined") {
    return initialValue;
  }

  try {
    // Attempt to parse, which correctly handles valid JSON strings like "null".
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error parsing JSON for localStorage key “${prefixedKey}”:`, error);
    // If parsing fails, fall back to the initial value to prevent a crash.
    return initialValue;
  }
}

/**
 * A hook to manage state in localStorage, safely handling user authentication changes.
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T,
  userId?: string | null
): [T, Dispatch<SetStateAction<T>>] {
  
  const prefixedKey = userId ? `${userId}_${key}` : key;

  // Initialize state using our safe getter function.
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getInitialValue(key, initialValue, userId);
  });
  
  // This effect re-initializes the state when the user logs in or out (prefixedKey changes).
  useEffect(() => {
    setStoredValue(getInitialValue(key, initialValue, userId));
  // This effect MUST run only when the user context changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefixedKey]);


  // This effect persists any change in state back to localStorage.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Prevent storing the literal string "undefined".
        if (storedValue === undefined) {
          window.localStorage.removeItem(prefixedKey);
        } else {
          window.localStorage.setItem(prefixedKey, JSON.stringify(storedValue));
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${prefixedKey}”:`, error);
    }
  }, [prefixedKey, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      
      // Try to parse the JSON
      const parsed = JSON.parse(item);
      return parsed;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      // Clear the corrupted value from localStorage
      try {
        window.localStorage.removeItem(key);
        console.log(`Cleared corrupted localStorage key "${key}"`);
      } catch (clearError) {
        console.error(`Error clearing corrupted localStorage key "${key}":`, clearError);
      }
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

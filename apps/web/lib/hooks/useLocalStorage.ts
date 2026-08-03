'use client';

import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) {
      try {
        setValue(JSON.parse(stored));
      } catch {
        // 손상된 값 무시, defaultValue 유지
      }
    }
  }, [key]);

  const setStoredValue = (next: T) => {
    setValue(next);
    window.localStorage.setItem(key, JSON.stringify(next));
  };

  return [value, setStoredValue];
}

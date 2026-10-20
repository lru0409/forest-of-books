'use client';

import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch {
      // 저장소 접근 불가 또는 손상된 값 무시, defaultValue 유지
    }
  }, [key]);

  const setStoredValue = (next: T) => {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // 저장소 접근 불가 또는 용량 초과 시 무시
    }
  };

  return [value, setStoredValue];
}

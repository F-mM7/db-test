import { useState, useEffect } from 'react';

function readStoredValue(key, initialValue) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : initialValue;
  } catch (err) {
    console.error(`Failed to read localStorage key "${key}":`, err);
    return initialValue;
  }
}

// localStorage と同期する useState。値は JSON でシリアライズ可能な型に限る
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(key, initialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Failed to write localStorage key "${key}":`, err);
    }
  }, [key, value]);

  return [value, setValue];
}

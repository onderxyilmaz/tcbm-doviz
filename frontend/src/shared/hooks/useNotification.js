import { useState, useCallback } from 'react';

export function useNotification() {
  const [notification, setNotification] = useState({ message: null, type: 'info' });

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification({ message: null, type: 'info' });
  }, []);

  return {
    notification,
    showNotification,
    hideNotification
  };
}

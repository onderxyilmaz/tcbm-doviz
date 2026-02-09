import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tcmb_dark_mode';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // localStorage'dan yükle
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
      // Eğer localStorage'da değer yoksa, sistem tercihini kontrol et ve varsayılan olarak false döndür
      return false;
    } catch (error) {
      console.error('Error loading dark mode preference:', error);
      return false;
    }
  });

  // İlk render'da HTML elementine dark class'ını ekle/çıkar
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []); // Sadece ilk render'da çalış

  // isDark değiştiğinde HTML elementini güncelle ve localStorage'a kaydet
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // localStorage'a kaydet
    try {
      localStorage.setItem(STORAGE_KEY, isDark.toString());
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  return {
    isDark,
    toggleDarkMode
  };
}

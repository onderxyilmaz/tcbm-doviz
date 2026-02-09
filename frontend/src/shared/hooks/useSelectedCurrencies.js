import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tcmb_selected_currencies';
const DEFAULT_CURRENCIES = ['USD', 'EUR', 'CHF'];

export function useSelectedCurrencies() {
  const [selectedCurrencies, setSelectedCurrencies] = useState(() => {
    // localStorage'dan yükle
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CURRENCIES;
      }
    } catch (error) {
      console.error('Error loading currencies from localStorage:', error);
    }
    return DEFAULT_CURRENCIES;
  });

  // localStorage'a kaydet
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCurrencies));
      console.log('Döviz kurları localStorage\'a kaydedildi:', selectedCurrencies);
    } catch (error) {
      console.error('Error saving currencies to localStorage:', error);
    }
  }, [selectedCurrencies]);

  const addCurrency = (currencyCode) => {
    if (!selectedCurrencies.includes(currencyCode)) {
      setSelectedCurrencies([...selectedCurrencies, currencyCode]);
    }
  };

  const removeCurrency = (currencyCode) => {
    // En az bir döviz kuru kalmalı
    if (selectedCurrencies.length > 1) {
      setSelectedCurrencies(selectedCurrencies.filter(c => c !== currencyCode));
    }
  };

  const toggleCurrency = (currencyCode) => {
    if (selectedCurrencies.includes(currencyCode)) {
      removeCurrency(currencyCode);
    } else {
      addCurrency(currencyCode);
    }
  };

  const resetToDefault = () => {
    setSelectedCurrencies(DEFAULT_CURRENCIES);
  };

  return {
    selectedCurrencies,
    addCurrency,
    removeCurrency,
    toggleCurrency,
    resetToDefault,
    setSelectedCurrencies
  };
}

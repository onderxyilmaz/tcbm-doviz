const CACHE_KEY = 'tcmb_rates_cache';

/**
 * Türkiye saat diliminde bugünün tarihini DD-MM-YYYY formatında döndürür.
 */
function getTodayTurkey() {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' });
  const iso = formatter.format(new Date()); // "YYYY-MM-DD"
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`; // DD-MM-YYYY
}

/**
 * Seçili para birimleri için cache'in geçerli olup olmadığını kontrol eder.
 * Cache geçerliyse rate verilerini döndürür, değilse null.
 */
export function getCachedRates(currencies) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const { rates, date, currencies: cachedCurrencies } = JSON.parse(raw);
    const today = getTodayTurkey();

    const currenciesMatch =
      JSON.stringify([...currencies].sort()) === JSON.stringify([...cachedCurrencies].sort());

    if (date === today && currenciesMatch && Array.isArray(rates) && rates.length > 0) {
      return rates;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * API'den alınan rate verilerini cache'e yazar.
 */
export function setCachedRates(rates, currencies) {
  try {
    const date = rates[0]?.date || getTodayTurkey();
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        rates,
        date,
        currencies,
      })
    );
  } catch (e) {
    console.warn('Failed to cache rates:', e);
  }
}

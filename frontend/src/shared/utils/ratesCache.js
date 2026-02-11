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
 * Cache'teki tüm rate verilerini döndürür. Geçersizse null.
 */
function getFullCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const { rates, date } = JSON.parse(raw);
    const today = getTodayTurkey();

    if (date === today && Array.isArray(rates) && rates.length > 0) {
      return { rates, date };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Seçili para birimleri için cache'te veri var mı kontrol eder.
 * Tümü varsa rate listesini döndürür, eksik varsa null.
 */
export function getCachedRates(currencies) {
  const cache = getFullCache();
  if (!cache || currencies.length === 0) return null;

  const ratesByCurrency = Object.fromEntries(cache.rates.map((r) => [r.currency, r]));
  const result = [];

  for (const code of currencies) {
    if (!ratesByCurrency[code]) return null;
    result.push(ratesByCurrency[code]);
  }

  return result;
}

/**
 * Cache'te hangi para birimlerinin eksik olduğunu döndürür.
 */
export function getMissingCurrencies(currencies) {
  const cache = getFullCache();
  if (!cache) return [...currencies];

  const cachedCodes = new Set(cache.rates.map((r) => r.currency));
  return currencies.filter((code) => !cachedCodes.has(code));
}

/**
 * Yeni rate verilerini cache'e ekler veya günceller (merge).
 */
export function mergeCachedRates(newRates) {
  try {
    const today = getTodayTurkey();
    const cache = getFullCache();

    let rates = cache ? [...cache.rates] : [];
    const byCurrency = new Map(rates.map((r) => [r.currency, r]));

    for (const rate of newRates) {
      byCurrency.set(rate.currency, rate);
    }

    rates = Array.from(byCurrency.values());

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        rates,
        date: newRates[0]?.date || today,
      })
    );
  } catch (e) {
    console.warn('Failed to cache rates:', e);
  }
}

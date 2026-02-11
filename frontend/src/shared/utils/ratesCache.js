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

// --- Geçmiş (Historical) Kurlar Cache ---

const HISTORICAL_CACHE_KEY = 'tcmb_historical_cache';

function getHistoricalCache() {
  try {
    const raw = localStorage.getItem(HISTORICAL_CACHE_KEY);
    if (!raw) return null;

    const { data, date } = JSON.parse(raw);
    const today = getTodayTurkey();

    if (date === today && data && typeof data === 'object') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Geçmiş kurlar için cache anahtarı oluşturur.
 */
function historicalCacheKey(currency, startDate, endDate) {
  return `${currency}|${startDate}|${endDate}`;
}

/**
 * Cache'te geçmiş kur verisi var mı kontrol eder. Varsa döndürür.
 */
export function getCachedHistoricalRates(currency, startDate, endDate) {
  const data = getHistoricalCache();
  if (!data) return null;

  const key = historicalCacheKey(currency, startDate, endDate);
  const cached = data[key];
  return Array.isArray(cached) && cached.length > 0 ? cached : null;
}

/**
 * Geçmiş kur verilerini cache'e yazar.
 */
export function setCachedHistoricalRates(currency, startDate, endDate, rates) {
  try {
    const today = getTodayTurkey();
    const raw = localStorage.getItem(HISTORICAL_CACHE_KEY);
    let data = {};

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.date === today && parsed.data) {
          data = { ...parsed.data };
        }
      } catch {}
    }

    const key = historicalCacheKey(currency, startDate, endDate);
    data[key] = rates;

    localStorage.setItem(
      HISTORICAL_CACHE_KEY,
      JSON.stringify({ data, date: today })
    );
  } catch (e) {
    console.warn('Failed to cache historical rates:', e);
  }
}

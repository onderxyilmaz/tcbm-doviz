import axios from 'axios';

const FRANKFURTER_API = 'https://api.frankfurter.app';

// Para birimi kodları ve isimleri (Frankfurter desteklediği para birimleri)
export const CURRENCY_CODES = {
  USD: { name: 'ABD Doları', nameEn: 'US Dollar' },
  EUR: { name: 'Euro', nameEn: 'Euro' },
  CHF: { name: 'İsviçre Frangı', nameEn: 'Swiss Franc' },
  GBP: { name: 'İngiliz Sterlini', nameEn: 'British Pound' },
  JPY: { name: 'Japon Yeni', nameEn: 'Japanese Yen' },
  AUD: { name: 'Avustralya Doları', nameEn: 'Australian Dollar' },
  CAD: { name: 'Kanada Doları', nameEn: 'Canadian Dollar' },
  SEK: { name: 'İsveç Kronu', nameEn: 'Swedish Krona' },
  NOK: { name: 'Norveç Kronu', nameEn: 'Norwegian Krone' },
  DKK: { name: 'Danimarka Kronu', nameEn: 'Danish Krone' },
  SAR: { name: 'Suudi Arabistan Riyali', nameEn: 'Saudi Riyal' },
  KWD: { name: 'Kuveyt Dinarı', nameEn: 'Kuwaiti Dinar' },
  QAR: { name: 'Katar Riyali', nameEn: 'Qatari Riyal' },
  BGN: { name: 'Bulgar Levası', nameEn: 'Bulgarian Lev' },
  RON: { name: 'Rumen Leyi', nameEn: 'Romanian Leu' },
  RUB: { name: 'Rus Rublesi', nameEn: 'Russian Ruble' },
  CNY: { name: 'Çin Yuanı', nameEn: 'Chinese Yuan' },
  PKR: { name: 'Pakistan Rupisi', nameEn: 'Pakistani Rupee' },
  IRR: { name: 'İran Riyali', nameEn: 'Iranian Rial' }
};

export function getAllCurrencies() {
  return Object.keys(CURRENCY_CODES).map(code => ({
    code,
    name: CURRENCY_CODES[code].name,
    nameEn: CURRENCY_CODES[code].nameEn
  }));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function getTodayFormatted() {
  return formatDate(new Date().toISOString().split('T')[0]);
}

export async function getCurrentRates(currencies = ['USD', 'EUR', 'CHF']) {
  const validCurrencies = currencies.filter(c => CURRENCY_CODES[c]);
  if (validCurrencies.length === 0) return [];

  try {
    const symbols = ['TRY', ...validCurrencies].filter((v, i, a) => a.indexOf(v) === i).join(',');
    const response = await axios.get(`${FRANKFURTER_API}/latest?from=EUR&to=${symbols}`, { timeout: 10000 });
    if (!response.data?.rates?.TRY) return [];

    const r = response.data.rates;
    const eurToTry = r.TRY;
    const rates = [];
    const dateFormatted = response.data.date ? formatDate(response.data.date) : getTodayFormatted();

    for (const currency of validCurrencies) {
      let rateToTry;
      if (currency === 'EUR') {
        rateToTry = eurToTry;
      } else {
        const currencyPerEur = r[currency];
        if (currencyPerEur == null) continue;
        rateToTry = eurToTry / currencyPerEur;
      }
      if (rateToTry != null && !isNaN(parseFloat(rateToTry))) {
        rates.push({
          currency,
          buyRate: rateToTry,
          sellRate: rateToTry,
          date: dateFormatted
        });
      }
    }
    return rates;
  } catch (err) {
    console.error('Frankfurter API hatası:', err.message);
    throw new Error('Döviz kurları alınamadı. İnternet bağlantınızı kontrol edin.');
  }
}

export async function getHistoricalRates(currency, startDate, endDate) {
  if (!CURRENCY_CODES[currency]) {
    throw new Error(`Desteklenmeyen para birimi: ${currency}`);
  }

  try {
    const toYMD = (d) => {
      const s = String(d);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const m = s.match(/(\d{2})-(\d{2})-(\d{4})/);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
    };
    const response = await axios.get(
      `${FRANKFURTER_API}/${toYMD(startDate)}..${toYMD(endDate)}?from=${currency}&to=TRY`,
      { timeout: 10000 }
    );
    if (!response.data?.rates) return [];

    const rates = [];
    for (const [dateStr, data] of Object.entries(response.data.rates)) {
      const tryRate = data?.TRY;
      if (tryRate != null && !isNaN(parseFloat(tryRate))) {
        rates.push({ date: formatDate(dateStr), buyRate: tryRate, sellRate: tryRate });
      }
    }
    rates.sort((a, b) => {
      const dA = new Date(a.date.split('-').reverse().join('-'));
      const dB = new Date(b.date.split('-').reverse().join('-'));
      return dB - dA;
    });
    return rates;
  } catch (err) {
    console.error('Frankfurter historical API hatası:', err.message);
    throw new Error('Geçmiş döviz kurları alınamadı.');
  }
}

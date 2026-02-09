import axios from 'axios';

const TCMB_API_URL = process.env.TCMB_API_URL || 'https://evds2.tcmb.gov.tr/service/evds';
const TCMB_API_KEY = process.env.TCMB_API_KEY || '8bC8YP8pNM';

// Para birimi kodları ve isimleri
export const CURRENCY_CODES = {
  USD: { buy: 'TP.DK.USD.A', sell: 'TP.DK.USD.S', name: 'ABD Doları', nameEn: 'US Dollar' },
  EUR: { buy: 'TP.DK.EUR.A', sell: 'TP.DK.EUR.S', name: 'Euro', nameEn: 'Euro' },
  CHF: { buy: 'TP.DK.CHF.A', sell: 'TP.DK.CHF.S', name: 'İsviçre Frangı', nameEn: 'Swiss Franc' },
  GBP: { buy: 'TP.DK.GBP.A', sell: 'TP.DK.GBP.S', name: 'İngiliz Sterlini', nameEn: 'British Pound' },
  JPY: { buy: 'TP.DK.JPY.A', sell: 'TP.DK.JPY.S', name: 'Japon Yeni', nameEn: 'Japanese Yen' },
  AUD: { buy: 'TP.DK.AUD.A', sell: 'TP.DK.AUD.S', name: 'Avustralya Doları', nameEn: 'Australian Dollar' },
  CAD: { buy: 'TP.DK.CAD.A', sell: 'TP.DK.CAD.S', name: 'Kanada Doları', nameEn: 'Canadian Dollar' },
  SEK: { buy: 'TP.DK.SEK.A', sell: 'TP.DK.SEK.S', name: 'İsveç Kronu', nameEn: 'Swedish Krona' },
  NOK: { buy: 'TP.DK.NOK.A', sell: 'TP.DK.NOK.S', name: 'Norveç Kronu', nameEn: 'Norwegian Krone' },
  DKK: { buy: 'TP.DK.DKK.A', sell: 'TP.DK.DKK.S', name: 'Danimarka Kronu', nameEn: 'Danish Krone' },
  SAR: { buy: 'TP.DK.SAR.A', sell: 'TP.DK.SAR.S', name: 'Suudi Arabistan Riyali', nameEn: 'Saudi Riyal' },
  KWD: { buy: 'TP.DK.KWD.A', sell: 'TP.DK.KWD.S', name: 'Kuveyt Dinarı', nameEn: 'Kuwaiti Dinar' },
  QAR: { buy: 'TP.DK.QAR.A', sell: 'TP.DK.QAR.S', name: 'Katar Riyali', nameEn: 'Qatari Riyal' },
  BGN: { buy: 'TP.DK.BGN.A', sell: 'TP.DK.BGN.S', name: 'Bulgar Levası', nameEn: 'Bulgarian Lev' },
  RON: { buy: 'TP.DK.RON.A', sell: 'TP.DK.RON.S', name: 'Rumen Leyi', nameEn: 'Romanian Leu' },
  RUB: { buy: 'TP.DK.RUB.A', sell: 'TP.DK.RUB.S', name: 'Rus Rublesi', nameEn: 'Russian Ruble' },
  CNY: { buy: 'TP.DK.CNY.A', sell: 'TP.DK.CNY.S', name: 'Çin Yuanı', nameEn: 'Chinese Yuan' },
  PKR: { buy: 'TP.DK.PKR.A', sell: 'TP.DK.PKR.S', name: 'Pakistan Rupisi', nameEn: 'Pakistani Rupee' },
  IRR: { buy: 'TP.DK.IRR.A', sell: 'TP.DK.IRR.S', name: 'İran Riyali', nameEn: 'Iranian Rial' }
};

// Tüm desteklenen para birimlerini döndür
export function getAllCurrencies() {
  return Object.keys(CURRENCY_CODES).map(code => ({
    code,
    name: CURRENCY_CODES[code].name,
    nameEn: CURRENCY_CODES[code].nameEn
  }));
}

// Tarih formatını dönüştür (YYYY-MM-DD -> DD-MM-YYYY)
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Bugünün tarihini DD-MM-YYYY formatında döndür
function getTodayFormatted() {
  return formatDate(new Date().toISOString().split('T')[0]);
}

// TCMB API'den veri çek
async function fetchTCMBData(series, startDate, endDate) {
  try {
    // TCMB API dokümantasyonuna göre:
    // - API anahtarı HTTP Request Header'da "key" olarak gönderilmeli
    // - URL formatı: baseUrl/series=SERIES&startDate=DD-MM-YYYY&endDate=DD-MM-YYYY&type=json
    
    // Base URL'in sonunda / olmamalı
    const baseUrl = TCMB_API_URL.endsWith('/') ? TCMB_API_URL.slice(0, -1) : TCMB_API_URL;
    // API anahtarı URL'de DEĞİL, header'da gönderilmeli!
    const url = `${baseUrl}/series=${encodeURIComponent(series)}&startDate=${startDate}&endDate=${endDate}&type=json`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'key': TCMB_API_KEY  // API anahtarı header'da gönderilmeli!
      },
      validateStatus: function (status) {
        return status < 500; // 5xx hariç tüm status kodlarını kabul et
      }
    });

    // TCMB API hata kontrolü
    if (response.status === 403) {
      throw new Error('TCMB API erişim hatası (403). API anahtarınızı kontrol edin veya https://evds2.tcmb.gov.tr/ adresinden yeni bir anahtar alın.');
    }
    
    if (response.status !== 200) {
      const errorMsg = response.data ? JSON.stringify(response.data) : response.statusText;
      throw new Error(`TCMB API Error: ${response.status} - ${errorMsg}`);
    }

    // Response yapısını kontrol et
    if (!response.data) {
      throw new Error('TCMB API\'den veri alınamadı. Boş yanıt döndü.');
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 403) {
        throw new Error('TCMB API erişim hatası (403). API anahtarınızı kontrol edin veya https://evds2.tcmb.gov.tr/ adresinden yeni bir anahtar alın.');
      }
      
      throw new Error(`TCMB API Error: ${status} - ${data ? JSON.stringify(data) : error.response.statusText}`);
    } else if (error.request) {
      throw new Error('TCMB API\'ye bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
}

// Güncel döviz kurlarını getir
export async function getCurrentRates(currencies = ['USD', 'EUR', 'CHF']) {
  const today = getTodayFormatted();
  const rates = [];

  for (const currency of currencies) {
    if (!CURRENCY_CODES[currency]) {
      continue;
    }

    try {
      const buySeries = CURRENCY_CODES[currency].buy;
      const sellSeries = CURRENCY_CODES[currency].sell;

      // Son 30 günü çek (hafta sonları ve tatiller olabilir, en son geçerli veriyi bulmak için)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const buyData = await fetchTCMBData(buySeries, formatDate(startDate.toISOString().split('T')[0]), today);
      const sellData = await fetchTCMBData(sellSeries, formatDate(startDate.toISOString().split('T')[0]), today);

      // En son geçerli veriyi bul
      let buyRate = null;
      let sellRate = null;
      let lastDate = null;

      // Response yapısını kontrol et
      let buyItems = [];
      let sellItems = [];
      
      if (buyData) {
        if (Array.isArray(buyData)) {
          buyItems = buyData;
        } else if (buyData.items && Array.isArray(buyData.items)) {
          buyItems = buyData.items;
        } else if (buyData.data && Array.isArray(buyData.data)) {
          buyItems = buyData.data;
        } else if (buyData.data && buyData.data.items && Array.isArray(buyData.data.items)) {
          buyItems = buyData.data.items;
        }
      }
      
      if (sellData) {
        if (Array.isArray(sellData)) {
          sellItems = sellData;
        } else if (sellData.items && Array.isArray(sellData.items)) {
          sellItems = sellData.items;
        } else if (sellData.data && Array.isArray(sellData.data)) {
          sellItems = sellData.data;
        } else if (sellData.data && sellData.data.items && Array.isArray(sellData.data.items)) {
          sellItems = sellData.data.items;
        }
      }

      if (buyItems && buyItems.length > 0) {
        // Ters sırada döngüye al (en yeni önce)
        for (let i = buyItems.length - 1; i >= 0; i--) {
          const item = buyItems[i];
          
          // TCMB API response'unda value alanını bul
          let value = null;
          const seriesCode = CURRENCY_CODES[currency].buy;
          const seriesKey = seriesCode.replace(/\./g, '_');
          
          value = item?.value || item?.VALUE || item?.[seriesKey] || item?.[seriesCode];
          
          if (!value && item) {
            const keys = Object.keys(item);
            const matchingKey = keys.find(k => k.includes(seriesCode.split('.').pop()) || k.includes(currency));
            if (matchingKey) {
              value = item[matchingKey];
            }
          }
          
          const tarih = item?.Tarih || item?.tarih || item?.DATE || item?.date;
          
          if (value !== null && value !== undefined && value !== '' && !isNaN(parseFloat(value))) {
            buyRate = parseFloat(value);
            lastDate = tarih;
            break;
          }
        }
      }

      if (sellItems && sellItems.length > 0) {
        for (let i = sellItems.length - 1; i >= 0; i--) {
          const item = sellItems[i];
          
          let value = null;
          const seriesCode = CURRENCY_CODES[currency].sell;
          const seriesKey = seriesCode.replace(/\./g, '_');
          
          value = item?.value || item?.VALUE || item?.[seriesKey] || item?.[seriesCode];
          
          if (!value && item) {
            const keys = Object.keys(item);
            const matchingKey = keys.find(k => k.includes(seriesCode.split('.').pop()) || k.includes(currency));
            if (matchingKey) {
              value = item[matchingKey];
            }
          }
          
          const tarih = item?.Tarih || item?.tarih || item?.DATE || item?.date;
          
          if (value !== null && value !== undefined && value !== '' && !isNaN(parseFloat(value))) {
            sellRate = parseFloat(value);
            if (!lastDate) {
              lastDate = tarih;
            }
            break;
          }
        }
      }

      if (buyRate !== null && sellRate !== null) {
        rates.push({
          currency,
          buyRate,
          sellRate,
          date: lastDate || today
        });
      }
    } catch (error) {
      console.error(`Error fetching ${currency} rates:`, error.message);
    }
  }

  return rates;
}

// Tarih aralığına göre döviz kurlarını getir
export async function getHistoricalRates(currency, startDate, endDate) {
  if (!CURRENCY_CODES[currency]) {
    throw new Error(`Desteklenmeyen para birimi: ${currency}`);
  }

  const buySeries = CURRENCY_CODES[currency].buy;
  const sellSeries = CURRENCY_CODES[currency].sell;

  // Tarih formatını dönüştür
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  const buyData = await fetchTCMBData(buySeries, formattedStartDate, formattedEndDate);
  const sellData = await fetchTCMBData(sellSeries, formattedStartDate, formattedEndDate);

  const rates = [];
  const buyMap = new Map();
  const sellMap = new Map();

  // Response yapısını kontrol et
  let buyItems = [];
  let sellItems = [];
  
  if (buyData) {
    if (Array.isArray(buyData)) {
      buyItems = buyData;
    } else if (buyData.items && Array.isArray(buyData.items)) {
      buyItems = buyData.items;
    } else if (buyData.data && Array.isArray(buyData.data)) {
      buyItems = buyData.data;
    } else if (buyData.data && buyData.data.items && Array.isArray(buyData.data.items)) {
      buyItems = buyData.data.items;
    }
  }
  
  if (sellData) {
    if (Array.isArray(sellData)) {
      sellItems = sellData;
    } else if (sellData.items && Array.isArray(sellData.items)) {
      sellItems = sellData.items;
    } else if (sellData.data && Array.isArray(sellData.data)) {
      sellItems = sellData.data;
    } else if (sellData.data && sellData.data.items && Array.isArray(sellData.data.items)) {
      sellItems = sellData.data.items;
    }
  }

  // Alış kurlarını map'e ekle
  if (buyItems && buyItems.length > 0) {
    buyItems.forEach((item) => {
      let value = null;
      const seriesKey = buySeries.replace(/\./g, '_');
      
      value = item?.value || item?.VALUE || item?.[seriesKey] || item?.[buySeries];
      
      if (!value && item) {
        const keys = Object.keys(item);
        const matchingKey = keys.find(k => 
          k.includes(buySeries.split('.').pop()) || 
          k.includes(currency) ||
          k.toUpperCase().includes('VALUE') ||
          k.toUpperCase().includes('RATE')
        );
        if (matchingKey) {
          value = item[matchingKey];
        }
      }
      
      const date = item?.Tarih || item?.tarih || item?.DATE || item?.date;
      
      if (value !== null && value !== undefined && value !== '' && !isNaN(parseFloat(value)) && date) {
        buyMap.set(date, parseFloat(value));
      }
    });
  }

  // Satış kurlarını map'e ekle
  if (sellItems && sellItems.length > 0) {
    sellItems.forEach((item) => {
      let value = null;
      const seriesKey = sellSeries.replace(/\./g, '_');
      
      value = item?.value || item?.VALUE || item?.[seriesKey] || item?.[sellSeries];
      
      if (!value && item) {
        const keys = Object.keys(item);
        const matchingKey = keys.find(k => 
          k.includes(sellSeries.split('.').pop()) || 
          k.includes(currency) ||
          k.toUpperCase().includes('VALUE') ||
          k.toUpperCase().includes('RATE')
        );
        if (matchingKey) {
          value = item[matchingKey];
        }
      }
      
      const date = item?.Tarih || item?.tarih || item?.DATE || item?.date;
      
      if (value !== null && value !== undefined && value !== '' && !isNaN(parseFloat(value)) && date) {
        sellMap.set(date, parseFloat(value));
      }
    });
  }

  // Tüm tarihleri birleştir
  const allDates = new Set();
  
  buyItems.forEach(item => {
    const date = item?.Tarih || item?.tarih || item?.DATE || item?.date;
    if (date) {
      allDates.add(date);
    }
  });
  
  sellItems.forEach(item => {
    const date = item?.Tarih || item?.tarih || item?.DATE || item?.date;
    if (date) {
      allDates.add(date);
    }
  });
  
  // Tarihleri sırala (en güncel tarih en üstte)
  const sortedDates = Array.from(allDates).sort((a, b) => {
    try {
      const dateA = new Date(a.split('-').reverse().join('-'));
      const dateB = new Date(b.split('-').reverse().join('-'));
      return dateB - dateA; // Ters sıralama: yeni tarih önce
    } catch {
      return 0;
    }
  });

  // Her tarih için rate'leri oluştur
  sortedDates.forEach(date => {
    rates.push({
      date,
      buyRate: buyMap.get(date) || null,
      sellRate: sellMap.get(date) || null
    });
  });

  return rates;
}

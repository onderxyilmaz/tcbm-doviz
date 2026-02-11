import { useState, useEffect } from 'react';
import { ratesApi } from '../../../shared/services/api';
import { useSelectedCurrencies } from '../../../shared/hooks/useSelectedCurrencies';
import {
  getCachedRates,
  getMissingCurrencies,
  mergeCachedRates,
  getCachedHistoricalRates,
  setCachedHistoricalRates,
} from '../../../shared/utils/ratesCache';
import { useNotification } from '../../../shared/hooks/useNotification';
import Notification from '../../../shared/components/Notification';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Modal from '../../../shared/components/Modal';

function HomePage() {
  const [rates, setRates] = useState([]);
  const [currencyNames, setCurrencyNames] = useState({});
  const [allCurrencies, setAllCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [historicalRates, setHistoricalRates] = useState([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  // Döviz çeviri state'leri
  const [convertAmount, setConvertAmount] = useState('');
  const [convertFrom, setConvertFrom] = useState('EUR');
  const [convertTo, setConvertTo] = useState('TRY');
  const { selectedCurrencies } = useSelectedCurrencies();
  const { notification, showNotification, hideNotification } = useNotification();

  // Para birimi isimlerini yükle
  useEffect(() => {
    const loadCurrencyNames = async () => {
      try {
        const response = await ratesApi.getAllCurrencies();
        if (response.success) {
          const names = {};
          response.data.forEach(currency => {
            names[currency.code] = currency.name;
          });
          setCurrencyNames(names);
          // TRY'yi de ekle
          const currenciesWithTRY = [
            ...response.data,
            { code: 'TRY', name: 'Türk Lirası', nameEn: 'Turkish Lira' }
          ];
          setAllCurrencies(currenciesWithTRY);
        }
      } catch (error) {
        console.error('Error loading currency names:', error);
      }
    };
    loadCurrencyNames();
  }, []);

  useEffect(() => {
    if (selectedCurrencies.length > 0) {
      fetchRates();
    }
  }, [selectedCurrencies]);

  const fetchRates = async () => {
    try {
      setLoading(true);

      // Önce cache'i kontrol et - seçili kurların hepsi varsa API'ye gitme
      const cached = getCachedRates(selectedCurrencies);
      if (cached) {
        setRates(cached);
        setLoading(false);
        return;
      }

      // Sadece cache'te eksik olan kurları çek
      const missing = getMissingCurrencies(selectedCurrencies);
      const response = await ratesApi.getCurrentRates(missing);

      if (response.success) {
        mergeCachedRates(response.data);
        setRates(getCachedRates(selectedCurrencies));
      } else {
        showNotification('Döviz kurları yüklenirken bir hata oluştu.', 'error');
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      showNotification(
        error.response?.data?.error || 'Döviz kurları yüklenirken bir hata oluştu. İnternet bağlantınızı kontrol edin.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value);
  };

  // Mobil görünüm için kısa format (virgülden sonra 2 hane)
  const formatCurrencyShort = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      // DD-MM-YYYY formatından Date'e çevir
      const [day, month, year] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Mobil görünüm için kısa tarih formatı (01.01.26)
  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    try {
      // DD-MM-YYYY formatından Date'e çevir
      const [day, month, year] = dateString.split('-');
      // Son 2 haneyi al (2026 -> 26)
      const shortYear = year.slice(-2);
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${shortYear}`;
    } catch {
      return dateString;
    }
  };

  // Hızlı tarih aralığı hesapla
  const getDateRange = (period) => {
    const today = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1week':
        startDate.setDate(today.getDate() - 7);
        break;
      case '1month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate.setDate(today.getDate() - 7);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };

  // Geçmiş verileri getir
  const fetchHistoricalRates = async (currency, period = null, customStartDate = null, customEndDate = null) => {
    let startDate, endDate;
    if (customStartDate && customEndDate) {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const dateRange = getDateRange(period || '1month');
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    // Önce cache'i kontrol et
    const cached = getCachedHistoricalRates(currency, startDate, endDate);
    if (cached) {
      setHistoricalRates(cached);
      setSelectedCurrency({ currency, period: period || 'custom', startDate, endDate });
      return;
    }

    try {
      setLoadingHistorical(true);

      const response = await ratesApi.getHistoricalRates(currency, startDate, endDate);

      if (response.success) {
        setHistoricalRates(response.data);
        setSelectedCurrency({ currency, period: period || 'custom', startDate, endDate });
        setCachedHistoricalRates(currency, startDate, endDate, response.data);
        if (response.data.length === 0) {
          showNotification('Seçilen tarih aralığında veri bulunamadı.', 'info');
        }
      } else {
        showNotification('Geçmiş veriler yüklenirken bir hata oluştu.', 'error');
      }
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      showNotification(
        error.response?.data?.error || 'Geçmiş veriler yüklenirken bir hata oluştu.',
        'error'
      );
    } finally {
      setLoadingHistorical(false);
    }
  };

  // Kur satırına tıklandığında
  const handleCurrencyClick = (currency) => {
    // Varsayılan tarihleri ayarla (1 hafta)
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    setCustomStartDate(oneWeekAgo.toISOString().split('T')[0]);
    setCustomEndDate(today.toISOString().split('T')[0]);
    setUseCustomDate(false);
    
    // Varsayılan olarak 1 hafta göster
    fetchHistoricalRates(currency, '1week');
  };

  // Modal kapatıldığında state'leri temizle
  const handleModalClose = () => {
    setSelectedCurrency(null);
    setHistoricalRates([]);
    setUseCustomDate(false);
  };

  // Hızlı tarih seçeneği tıklandığında
  const handleQuickPeriodClick = (period) => {
    if (selectedCurrency) {
      setUseCustomDate(false);
      fetchHistoricalRates(selectedCurrency.currency, period);
    }
  };

  // Özel tarih ile getir
  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) {
      showNotification('Lütfen başlangıç ve bitiş tarihlerini seçin.', 'warning');
      return;
    }

    if (new Date(customStartDate) > new Date(customEndDate)) {
      showNotification('Başlangıç tarihi bitiş tarihinden sonra olamaz.', 'error');
      return;
    }

    if (selectedCurrency) {
      setUseCustomDate(true);
      fetchHistoricalRates(selectedCurrency.currency, null, customStartDate, customEndDate);
    }
  };

  const formatDateLong = (dateString) => {
    if (!dateString) return '-';
    try {
      const [day, month, year] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Formatlanmış değeri panoya kopyala (virgül ile)
  const copyFormatted = async (value, type) => {
    try {
      const formattedValue = formatCurrency(value);
      await navigator.clipboard.writeText(formattedValue);
      showNotification(`${type} kopyalandı (formatlı): ${formattedValue}`, 'success');
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback: Eski yöntem
      const textArea = document.createElement('textarea');
      textArea.value = formatCurrency(value);
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showNotification(`${type} kopyalandı (formatlı): ${formatCurrency(value)}`, 'success');
      } catch (err) {
        showNotification('Kopyalama başarısız oldu', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  // Ham değeri panoya kopyala (virgülsüz, noktasız - sadece rakamlar)
  const copyRaw = async (value, type) => {
    try {
      // Ham değeri nokta ve virgül olmadan kopyala (örn: 43.4542 -> 434542)
      const rawValue = value.toString().replace(/[.,]/g, '');
      await navigator.clipboard.writeText(rawValue);
      showNotification(`${type} kopyalandı (ham): ${rawValue}`, 'success');
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback: Eski yöntem
      const textArea = document.createElement('textarea');
      const rawValue = value.toString().replace(/[.,]/g, '');
      textArea.value = rawValue;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showNotification(`${type} kopyalandı (ham): ${rawValue}`, 'success');
      } catch (err) {
        showNotification('Kopyalama başarısız oldu', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Döviz çeviri hesaplama
  const calculateConversion = () => {
    if (!convertAmount || isNaN(convertAmount) || parseFloat(convertAmount) <= 0) {
      return '';
    }

    const amount = parseFloat(convertAmount);
    
    // TRY'den başka bir para birimine çevirme
    if (convertFrom === 'TRY') {
      const toRate = rates.find(r => r.currency === convertTo);
      if (!toRate) return '';
      // TRY -> Döviz: TRY miktarı / döviz satış kuru
      return (amount / toRate.sellRate).toFixed(4);
    }
    
    // Dövizden TRY'ye çevirme
    if (convertTo === 'TRY') {
      const fromRate = rates.find(r => r.currency === convertFrom);
      if (!fromRate) return '';
      // Döviz -> TRY: Döviz miktarı * döviz satış kuru
      return (amount * fromRate.sellRate).toFixed(2);
    }
    
    // Dövizden dövize çevirme (TRY üzerinden)
    const fromRate = rates.find(r => r.currency === convertFrom);
    const toRate = rates.find(r => r.currency === convertTo);
    if (!fromRate || !toRate) return '';
    
    // Döviz1 -> TRY -> Döviz2
    const tryAmount = amount * fromRate.sellRate;
    return (tryAmount / toRate.sellRate).toFixed(4);
  };

  const convertedAmount = calculateConversion();

  return (
    <div className="px-4 py-6">
      {/* Döviz Çeviri Bölümü */}
      <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Döviz Çevirici</h3>
        <div className="flex flex-row items-center gap-1 min-[375px]:gap-1.5 min-[425px]:gap-2 sm:gap-4 overflow-x-auto">
          {/* Miktar Input */}
          <input
            type="number"
            value={convertAmount}
            onChange={(e) => setConvertAmount(e.target.value)}
            placeholder="Miktar"
            className="flex-shrink-0 w-[58px] min-[375px]:w-[70px] min-[425px]:w-[84px] sm:flex-1 px-1.5 min-[375px]:px-2 min-[425px]:px-2.5 sm:px-3 py-1.5 min-[375px]:py-2 min-[425px]:py-2 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-[10px] min-[375px]:text-xs min-[425px]:text-sm sm:text-base"
            autoFocus
            autoComplete="off"
            step="any"
            min="0"
          />
          
          {/* From Dropdown */}
          <select
            value={convertFrom}
            onChange={(e) => setConvertFrom(e.target.value)}
            className="flex-shrink-0 w-[46px] min-[375px]:w-[52px] min-[425px]:w-[60px] sm:w-auto px-1 min-[375px]:px-1.5 min-[425px]:px-2 sm:px-3 py-1.5 min-[375px]:py-2 min-[425px]:py-2 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-[10px] min-[375px]:text-xs min-[425px]:text-xs sm:text-base"
          >
            {allCurrencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code}
              </option>
            ))}
          </select>

          {/* Çift yönlü ok ikonu */}
          <button
            onClick={() => {
              // Sadece dropdown'ları yer değiştir, miktar aynı kalsın
              const temp = convertFrom;
              setConvertFrom(convertTo);
              setConvertTo(temp);
            }}
            className="flex-shrink-0 p-1 min-[375px]:p-1.5 min-[425px]:p-1.5 sm:p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Para birimlerini değiştir"
          >
            <svg className="w-3.5 h-3.5 min-[375px]:w-4 min-[375px]:h-4 min-[425px]:w-5 min-[425px]:h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          {/* Sonuç alanı */}
          <div className="flex-shrink-0 w-[58px] min-[375px]:w-[70px] min-[425px]:w-[84px] sm:flex-1 px-1.5 min-[375px]:px-2 min-[425px]:px-2.5 sm:px-3 py-1.5 min-[375px]:py-2 min-[425px]:py-2 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-[10px] min-[375px]:text-xs min-[425px]:text-sm sm:text-base flex items-center">
            {convertedAmount ? (
              <span className="font-medium truncate text-[10px] min-[375px]:text-xs min-[425px]:text-xs sm:text-sm">
                {parseFloat(convertedAmount).toLocaleString('tr-TR', {
                  minimumFractionDigits: convertTo === 'TRY' ? 2 : 4,
                  maximumFractionDigits: convertTo === 'TRY' ? 2 : 4
                })}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-[10px] min-[375px]:text-xs min-[425px]:text-xs sm:text-sm">-</span>
            )}
          </div>

          {/* To Dropdown */}
          <select
            value={convertTo}
            onChange={(e) => setConvertTo(e.target.value)}
            className="flex-shrink-0 w-[46px] min-[375px]:w-[52px] min-[425px]:w-[60px] sm:w-auto px-1 min-[375px]:px-1.5 min-[425px]:px-2 sm:px-3 py-1.5 min-[375px]:py-2 min-[425px]:py-2 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-[10px] min-[375px]:text-xs min-[425px]:text-xs sm:text-base"
          >
            {allCurrencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code}
              </option>
            ))}
          </select>
        </div>
        {(!rates.find(r => r.currency === convertFrom) && convertFrom !== 'TRY') || 
         (!rates.find(r => r.currency === convertTo) && convertTo !== 'TRY') ? (
          <p className="mt-3 text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Çeviri için seçilen para birimlerinin "Güncel Kurlar" listesinde olması gerekiyor. Lütfen Ayarlar sayfasından ilgili para birimlerini seçin.
          </p>
        ) : null}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Güncel Döviz Kurları</h2>
        <p className="text-gray-600 dark:text-gray-400">
          TCMB'den alınan güncel döviz kurları - Geçmiş verileri görmek için bir döviz kuruna tıklayın
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <span className="hidden sm:inline">Para Birimi</span>
                  <span className="sm:hidden">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <span className="hidden sm:inline">Alış</span>
                  <span className="sm:hidden">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </span>
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <span className="hidden sm:inline">Satış</span>
                  <span className="sm:hidden">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  </span>
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <span className="hidden sm:inline">Tarih</span>
                  <span className="sm:hidden">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {rates.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Veri bulunamadı
                  </td>
                </tr>
              ) : (
                rates.map((rate) => (
                  <tr 
                    key={rate.currency} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleCurrencyClick(rate.currency)}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            <span className="sm:hidden">{rate.currency}</span>
                            <span className="hidden sm:inline">{currencyNames[rate.currency] || rate.currency}</span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{rate.currency}</div>
                        </div>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm">
                          <span className="sm:hidden">{formatCurrencyShort(rate.buyRate)} ₺</span>
                          <span className="hidden sm:inline">{formatCurrency(rate.buyRate)} ₺</span>
                        </span>
                        <div className="hidden sm:flex items-center gap-1 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyFormatted(rate.buyRate, 'Alış');
                            }}
                            className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                            title="Alış fiyatını formatlı kopyala (virgül ile)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyRaw(rate.buyRate, 'Alış');
                            }}
                            className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1"
                            title="Alış fiyatını ham kopyala (sadece rakamlar)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <span className="text-xs sm:text-sm">
                          <span className="sm:hidden">{formatCurrencyShort(rate.sellRate)} ₺</span>
                          <span className="hidden sm:inline">{formatCurrency(rate.sellRate)} ₺</span>
                        </span>
                        <div className="hidden sm:flex items-center gap-1 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyFormatted(rate.sellRate, 'Satış');
                            }}
                            className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                            title="Satış fiyatını formatlı kopyala (virgül ile)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyRaw(rate.sellRate, 'Satış');
                            }}
                            className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1"
                            title="Satış fiyatını ham kopyala (sadece rakamlar)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <span className="sm:hidden">{formatDateShort(rate.date)}</span>
                      <span className="hidden sm:inline">{formatDate(rate.date)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geçmiş Veriler Modal */}
      <Modal
        isOpen={selectedCurrency !== null}
        onClose={handleModalClose}
        title={`${currencyNames[selectedCurrency?.currency] || selectedCurrency?.currency} - Geçmiş Kurlar`}
      >
        {/* Hızlı Tarih Seçenekleri */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Hızlı tarih seçenekleri:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleQuickPeriodClick('1week')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedCurrency?.period === '1week' && !useCustomDate
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              1 Hafta
            </button>
            <button
              onClick={() => handleQuickPeriodClick('1month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedCurrency?.period === '1month' && !useCustomDate
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              1 Ay
            </button>
            <button
              onClick={() => handleQuickPeriodClick('3months')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedCurrency?.period === '3months' && !useCustomDate
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              3 Ay
            </button>
            <button
              onClick={() => handleQuickPeriodClick('6months')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedCurrency?.period === '6months' && !useCustomDate
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              6 Ay
            </button>
            <button
              onClick={() => handleQuickPeriodClick('1year')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedCurrency?.period === '1year' && !useCustomDate
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              1 Yıl
            </button>
          </div>

          {/* Özel Tarih Seçimi */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Özel tarih aralığı:</p>
            <form onSubmit={handleCustomDateSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="modalStartDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  id="modalStartDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm"
                  autoComplete="off"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="modalEndDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  id="modalEndDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm"
                  autoComplete="off"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loadingHistorical}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loadingHistorical ? 'Yükleniyor...' : 'Getir'}
                </button>
              </div>
            </form>
            {useCustomDate && selectedCurrency?.startDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Gösterilen aralık: {new Date(selectedCurrency.startDate).toLocaleDateString('tr-TR')} - {new Date(selectedCurrency.endDate).toLocaleDateString('tr-TR')}
              </p>
            )}
          </div>
        </div>

        {/* Geçmiş Veriler Tablosu */}
        {loadingHistorical ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : historicalRates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <span className="hidden sm:inline">Tarih</span>
                    <span className="sm:hidden">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <span className="hidden sm:inline">Alış</span>
                    <span className="sm:hidden">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </span>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <span className="hidden sm:inline">Satış</span>
                    <span className="sm:hidden">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {historicalRates.map((rate, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      <span className="sm:hidden">{formatDateShort(rate.date)}</span>
                      <span className="hidden sm:inline">{formatDateLong(rate.date)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <span>
                          <span className="sm:hidden">{formatCurrencyShort(rate.buyRate)} ₺</span>
                          <span className="hidden sm:inline">{formatCurrency(rate.buyRate)} ₺</span>
                        </span>
                        {rate.buyRate && (
                          <div className="hidden sm:flex items-center gap-1 ml-1">
                            <button
                              onClick={() => copyFormatted(rate.buyRate, 'Alış')}
                              className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                              title="Alış fiyatını formatlı kopyala (virgül ile)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => copyRaw(rate.buyRate, 'Alış')}
                              className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1"
                              title="Alış fiyatını ham kopyala (sadece rakamlar)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <span>
                          <span className="sm:hidden">{formatCurrencyShort(rate.sellRate)} ₺</span>
                          <span className="hidden sm:inline">{formatCurrency(rate.sellRate)} ₺</span>
                        </span>
                        {rate.sellRate && (
                          <div className="hidden sm:flex items-center gap-1 ml-1">
                            <button
                              onClick={() => copyFormatted(rate.sellRate, 'Satış')}
                              className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                              title="Satış fiyatını formatlı kopyala (virgül ile)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => copyRaw(rate.sellRate, 'Satış')}
                              className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1"
                              title="Satış fiyatını ham kopyala (sadece rakamlar)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            Seçilen tarih aralığında veri bulunamadı.
          </div>
        )}
      </Modal>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </div>
  );
}

export default HomePage;

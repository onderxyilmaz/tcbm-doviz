import { useState, useEffect } from 'react';
import { ratesApi } from '../../../shared/services/api';
import { useSelectedCurrencies } from '../../../shared/hooks/useSelectedCurrencies';
import { useNotification } from '../../../shared/hooks/useNotification';
import Notification from '../../../shared/components/Notification';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';

function HistoricalPage() {
  const [currency, setCurrency] = useState('');
  const [currencies, setCurrencies] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const { selectedCurrencies } = useSelectedCurrencies();
  const { notification, showNotification, hideNotification } = useNotification();

  // Para birimlerini yükle
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const response = await ratesApi.getAllCurrencies();
        if (response.success) {
          // Sadece seçili para birimlerini göster
          const filtered = response.data.filter(c => selectedCurrencies.includes(c.code));
          setCurrencies(filtered);
          // İlk seçili para birimini varsayılan olarak ayarla
          if (filtered.length > 0 && !currency) {
            setCurrency(filtered[0].code);
          }
        }
      } catch (error) {
        console.error('Error loading currencies:', error);
      }
    };
    loadCurrencies();
  }, [selectedCurrencies]);

  // Varsayılan tarihleri ayarla (bugünden 10 gün önce - bugün)
  useEffect(() => {
    const today = new Date();
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(today.getDate() - 10);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(tenDaysAgo.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      showNotification('Lütfen başlangıç ve bitiş tarihlerini seçin.', 'warning');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showNotification('Başlangıç tarihi bitiş tarihinden sonra olamaz.', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await ratesApi.getHistoricalRates(currency, startDate, endDate);
      
      if (response.success) {
        setRates(response.data);
        if (response.data.length === 0) {
          showNotification('Seçilen tarih aralığında veri bulunamadı.', 'info');
        } else {
          showNotification(`${response.data.length} adet kayıt bulundu.`, 'success');
        }
      } else {
        showNotification('Geçmiş veriler yüklenirken bir hata oluştu.', 'error');
      }
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      showNotification(
        error.response?.data?.error || 'Geçmiş veriler yüklenirken bir hata oluştu. İnternet bağlantınızı kontrol edin.',
        'error'
      );
      setRates([]);
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      // DD-MM-YYYY formatından Date'e çevir
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

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Geçmiş Döviz Kurları</h2>
        <p className="text-gray-600">Tarih aralığına göre geçmiş döviz kurlarını görüntüleyin</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Para Birimi
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
                disabled={currencies.length === 0}
              >
                {currencies.length === 0 ? (
                  <option value="">Para birimi yükleniyor...</option>
                ) : (
                  currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.name} ({curr.code})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Tarihi
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Tarihi
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yükleniyor...
                </>
              ) : (
                'Verileri Getir'
              )}
            </button>
          </div>
        </form>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && rates.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {currencies.find(c => c.code === currency)?.name || currency} - Geçmiş Kurlar
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alış
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Satış
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rates.map((rate, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(rate.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <span>{formatCurrency(rate.buyRate)} ₺</span>
                        {rate.buyRate && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => copyFormatted(rate.buyRate, 'Alış')}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                              title="Alış fiyatını formatlı kopyala (virgül ile)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => copyRaw(rate.buyRate, 'Alış')}
                              className="text-gray-400 hover:text-green-600 transition-colors p-1"
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <span>{formatCurrency(rate.sellRate)} ₺</span>
                        {rate.sellRate && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => copyFormatted(rate.sellRate, 'Satış')}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                              title="Satış fiyatını formatlı kopyala (virgül ile)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => copyRaw(rate.sellRate, 'Satış')}
                              className="text-gray-400 hover:text-green-600 transition-colors p-1"
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
        </div>
      )}

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </div>
  );
}

export default HistoricalPage;

import { useState, useEffect } from 'react';
import { ratesApi } from '../../../shared/services/api';
import { useSelectedCurrencies } from '../../../shared/hooks/useSelectedCurrencies';
import { useNotification } from '../../../shared/hooks/useNotification';
import Notification from '../../../shared/components/Notification';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';

function SettingsPage() {
  const [allCurrencies, setAllCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedCurrencies, toggleCurrency, resetToDefault } = useSelectedCurrencies();
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    fetchAllCurrencies();
  }, []);

  const fetchAllCurrencies = async () => {
    try {
      setLoading(true);
      const response = await ratesApi.getAllCurrencies();
      
      if (response.success) {
        setAllCurrencies(response.data);
      } else {
        showNotification('Döviz kurları listesi yüklenirken bir hata oluştu.', 'error');
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      showNotification('Döviz kurları listesi yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (currencyCode) => {
    // En az bir döviz kuru seçili kalmalı
    if (selectedCurrencies.length === 1 && selectedCurrencies.includes(currencyCode)) {
      showNotification('En az bir döviz kuru seçili olmalıdır.', 'warning');
      return;
    }
    
    toggleCurrency(currencyCode);
    showNotification(
      selectedCurrencies.includes(currencyCode)
        ? `${allCurrencies.find(c => c.code === currencyCode)?.name} kaldırıldı`
        : `${allCurrencies.find(c => c.code === currencyCode)?.name} eklendi`,
      'success'
    );
  };

  const handleReset = () => {
    resetToDefault();
    showNotification('Varsayılan döviz kurlarına dönüldü (USD, EUR, CHF)', 'success');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Döviz Kuru Ayarları</h2>
        <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">Görüntülemek istediğiniz döviz kurlarını seçin</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">
            Döviz Kurları ({selectedCurrencies.length} seçili)
          </h3>
          <button
            onClick={handleReset}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Varsayılanlara Dön"
          >
            <span className="sm:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </span>
            <span className="hidden sm:inline text-sm font-medium">Varsayılanlara Dön</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allCurrencies.map((currency) => {
            const isSelected = selectedCurrencies.includes(currency.code);
            return (
              <label
                key={currency.code}
                className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(currency.code)}
                  className="sr-only"
                  disabled={selectedCurrencies.length === 1 && isSelected}
                />
                <div className="flex items-center flex-1">
                  <div
                    className={`flex-shrink-0 w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {currency.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{currency.code}</div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {selectedCurrencies.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              En az bir döviz kuru seçili olmalıdır.
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 dark:text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Bilgi</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                Seçtiğiniz döviz kurları "Güncel Kurlar" sayfasında görüntülenecektir.
                Ayarlarınız tarayıcınızda saklanır ve bir sonraki ziyaretinizde hatırlanır.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Notification
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </div>
  );
}

export default SettingsPage;

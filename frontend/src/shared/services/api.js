import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ratesApi = {
  getAllCurrencies: async () => {
    const response = await api.get('/currencies');
    return response.data;
  },
  
  getCurrentRates: async (currencies = null) => {
    const params = currencies && currencies.length > 0 
      ? { currencies: currencies.join(',') }
      : {};
    const response = await api.get('/rates/current', { params });
    return response.data;
  },
  
  getHistoricalRates: async (currency, startDate, endDate) => {
    const response = await api.get('/rates/historical', {
      params: { currency, startDate, endDate }
    });
    return response.data;
  }
};

export default api;

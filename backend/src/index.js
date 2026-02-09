import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getCurrentRates, getHistoricalRates, getAllCurrencies } from './services/tcmbService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TCMB API Server is running' });
});

// API anahtarı test endpoint'i
app.get('/api/test-key', async (req, res) => {
  try {
    const axios = (await import('axios')).default;
    const TCMB_API_KEY = process.env.TCMB_API_KEY || '8bC8YP8pNM';
    const TCMB_API_URL = process.env.TCMB_API_URL || 'https://evds2.tcmb.gov.tr/service/evds';
    
    // Basit bir test isteği - son 1 günlük USD satış kuru
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };
    
    // Base URL'in sonunda / olmamalı
    const baseUrl = TCMB_API_URL.endsWith('/') ? TCMB_API_URL.slice(0, -1) : TCMB_API_URL;
    // API anahtarı header'da gönderilmeli, URL'de değil!
    const testUrl = `${baseUrl}/series=TP.DK.USD.S&startDate=${formatDate(yesterday)}&endDate=${formatDate(today)}&type=json`;
    
    console.log(`Testing API Key with URL: ${testUrl}`);
    console.log(`API Key (header): ${TCMB_API_KEY.substring(0, 4)}***`);
    
    const response = await axios.get(testUrl, {
      timeout: 10000,
      headers: {
        'key': TCMB_API_KEY  // API anahtarı header'da gönderilmeli!
      },
      validateStatus: () => true // Tüm status kodlarını kabul et
    });
    
    res.json({
      success: response.status === 200,
      status: response.status,
      statusText: response.statusText,
      message: response.status === 200 
        ? 'API anahtarı geçerli görünüyor' 
        : response.status === 403 
        ? 'API anahtarı geçersiz veya erişim reddedildi. Lütfen https://evds2.tcmb.gov.tr/ adresinden yeni bir API anahtarı alın.'
        : `Beklenmeyen hata: ${response.status}`,
      data: response.data ? JSON.stringify(response.data).substring(0, 500) : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'API anahtarı test edilirken bir hata oluştu'
    });
  }
});

// Tüm desteklenen döviz kurlarını listele
app.get('/api/currencies', (req, res) => {
  try {
    const currencies = getAllCurrencies();
    res.json({ success: true, data: currencies });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch currencies' 
    });
  }
});

// Güncel döviz kurları (dinamik - query parametresi ile)
app.get('/api/rates/current', async (req, res) => {
  try {
    // Query parametresinden kurları al, yoksa varsayılan olarak USD, EUR, CHF
    const currenciesParam = req.query.currencies;
    let currencies = ['USD', 'EUR', 'CHF'];
    
    if (currenciesParam) {
      // Virgülle ayrılmış string'i array'e çevir
      currencies = currenciesParam.split(',').map(c => c.trim().toUpperCase()).filter(c => c);
    }
    
    const rates = await getCurrentRates(currencies);
    res.json({ success: true, data: rates });
  } catch (error) {
    console.error('Error fetching current rates:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch current rates' 
    });
  }
});

// Tarih aralığına göre döviz kurları
app.get('/api/rates/historical', async (req, res) => {
  try {
    const { currency, startDate, endDate } = req.query;

    if (!currency || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'currency, startDate, and endDate are required'
      });
    }

    const rates = await getHistoricalRates(currency, startDate, endDate);
    res.json({ success: true, data: rates });
  } catch (error) {
    console.error('Error fetching historical rates:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch historical rates' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

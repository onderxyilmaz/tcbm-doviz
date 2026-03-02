import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getCurrentRates, getHistoricalRates, getAllCurrencies } from './services/tcmbService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Döviz Kurları API çalışıyor' });
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

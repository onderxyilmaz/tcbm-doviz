import { getCurrentRates } from '../lib/tcmbService.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Query parametresinden kurları al, yoksa varsayılan olarak USD, EUR, CHF
    const currenciesParam = req.query.currencies;
    let currencies = ['USD', 'EUR', 'CHF'];
    
    if (currenciesParam) {
      // Virgülle ayrılmış string'i array'e çevir
      currencies = currenciesParam.split(',').map(c => c.trim().toUpperCase()).filter(c => c);
    }
    
    const rates = await getCurrentRates(currencies);
    res.status(200).json({ success: true, data: rates });
  } catch (error) {
    console.error('Error fetching current rates:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch current rates' 
    });
  }
}

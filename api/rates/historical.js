import { getHistoricalRates } from '../lib/tcmbService.js';

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
    const { currency, startDate, endDate } = req.query;

    if (!currency || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'currency, startDate, and endDate are required'
      });
    }

    const rates = await getHistoricalRates(currency, startDate, endDate);
    res.status(200).json({ success: true, data: rates });
  } catch (error) {
    console.error('Error fetching historical rates:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch historical rates' 
    });
  }
}

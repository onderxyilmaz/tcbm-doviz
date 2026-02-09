import { getAllCurrencies } from './lib/tcmbService.js';

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
    const currencies = getAllCurrencies();
    res.status(200).json({ success: true, data: currencies });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch currencies' 
    });
  }
}

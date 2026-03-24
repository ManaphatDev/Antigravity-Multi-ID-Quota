import { getAllAccounts, getStats } from '../data/accounts.js';

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // POST /api/accounts/refresh — จำลองการ refresh ข้อมูล quotas
    // ในอนาคตสามารถเชื่อมต่อ API จริงของแต่ละ provider ได้
    const accounts = getAllAccounts();
    const stats = getStats();

    return res.status(200).json({
      accounts,
      stats,
      refreshedAt: new Date().toISOString(),
      message: 'Quotas refreshed successfully',
    });
  } catch (err) {
    console.error('Refresh Error:', err);
    return res.status(500).json({ error: 'Failed to refresh quotas' });
  }
}

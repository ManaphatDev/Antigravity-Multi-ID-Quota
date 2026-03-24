import { getAllAccounts, addAccount, getStats } from '../data/accounts.js';

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // GET /api/accounts — ดึงข้อมูลทั้งหมด
      const accounts = getAllAccounts();
      const stats = getStats();
      return res.status(200).json({ accounts, stats });
    }

    if (req.method === 'POST') {
      // POST /api/accounts — เพิ่ม account ใหม่
      const body = req.body;

      if (!body || !body.email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const newAccount = addAccount({
        email: body.email,
        status: body.status || 'active',
        models: body.models || {
          geminiFlash: { percent: 'N/A', time: 'N/A', color: 'text-gray-500' },
          geminiPro: { percent: 'N/A', time: 'N/A', color: 'text-gray-500' },
          claude: { percent: 'N/A', time: 'N/A', color: 'text-gray-500' },
        },
        credits: body.credits || {
          prompt: { current: 0, max: 50000 },
          flow: { current: 0, max: 150000 },
        },
      });

      return res.status(201).json({ account: newAccount, stats: getStats() });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

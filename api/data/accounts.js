import 'dotenv/config';
import { createClient } from '@vercel/kv';

// Initialize the KV client pointing to Upstash Redis
const kv = createClient({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Shared data store for accounts
// Now using @vercel/kv (Upstash Redis) for persistent storage

const DEFAULT_ACCOUNTS = [
  {
    id: '1',
    email: 'dev.primary@company.com',
    status: 'active',
    models: {
      geminiFlash: { percent: 'N/A', time: 'N/A', color: 'text-gray-500' },
      geminiPro: { percent: 100, time: '4h 36m', color: 'text-emerald-400' },
      claude: { percent: 20, time: '6d 14h', color: 'text-amber-500' },
    },
    credits: {
      prompt: { current: 500, max: 50000 },
      flow: { current: 100, max: 150000 },
    }
  },
  {
    id: '2',
    email: 'project.backend@company.com',
    status: 'warning',
    models: {
      geminiFlash: { percent: 85, time: '12h 00m', color: 'text-emerald-400' },
      geminiPro: { percent: 5, time: '0h 15m', color: 'text-red-500' },
      claude: { percent: 90, time: '30d 00m', color: 'text-emerald-400' },
    },
    credits: {
      prompt: { current: 48500, max: 50000 },
      flow: { current: 145000, max: 150000 },
    }
  },
  {
    id: '3',
    email: 'test.bot.01@gmail.com',
    status: 'active',
    models: {
      geminiFlash: { percent: 50, time: '2h 10m', color: 'text-amber-500' },
      geminiPro: { percent: 50, time: '2h 10m', color: 'text-amber-500' },
      claude: { percent: 'N/A', time: 'N/A', color: 'text-gray-500' },
    },
    credits: {
      prompt: { current: 25000, max: 50000 },
      flow: { current: 75000, max: 150000 },
    }
  }
];

async function initializeAccountsIfNeeded() {
  try {
    const data = await kv.get('accounts');
    if (!data) {
      await kv.set('accounts', DEFAULT_ACCOUNTS);
      return DEFAULT_ACCOUNTS;
    }
    return data;
  } catch (err) {
    console.error("KV Error (fallback to default):", err);
    return DEFAULT_ACCOUNTS;
  }
}// คำนวณ stats รวม
function computeStats(accountsList) {
  const activeCount = accountsList.filter(a => a.status === 'active').length;
  const totalCount = accountsList.length;

  let totalPromptRemaining = 0;
  let totalFlowRemaining = 0;

  for (const acc of accountsList) {
    totalPromptRemaining += (acc.credits.prompt.max - acc.credits.prompt.current);
    totalFlowRemaining += (acc.credits.flow.max - acc.credits.flow.current);
  }

  const formatK = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  return {
    activeCount,
    totalCount,
    totalPromptRemaining: formatK(totalPromptRemaining),
    totalFlowRemaining: formatK(totalFlowRemaining),
  };
}

// Getter/Setter functions
export async function getAllAccounts() {
  return await initializeAccountsIfNeeded();
}

export async function getAccountById(id) {
  const accountsList = await initializeAccountsIfNeeded();
  return accountsList.find(a => a.id === id) || null;
}

export async function addAccount(account) {
  const accountsList = await initializeAccountsIfNeeded();
  const newId = String(Math.max(...accountsList.map(a => parseInt(a.id) || 0), 0) + 1);
  const newAccount = { ...account, id: newId };
  accountsList.push(newAccount);
  await kv.set('accounts', accountsList);
  return newAccount;
}

export async function updateAccount(id, updates) {
  const accountsList = await initializeAccountsIfNeeded();
  const index = accountsList.findIndex(a => a.id === id);
  if (index === -1) return null;
  accountsList[index] = { ...accountsList[index], ...updates };
  await kv.set('accounts', accountsList);
  return accountsList[index];
}

export async function deleteAccount(id) {
  const accountsList = await initializeAccountsIfNeeded();
  const index = accountsList.findIndex(a => a.id === id);
  if (index === -1) return false;
  accountsList.splice(index, 1);
  await kv.set('accounts', accountsList);
  return true;
}

export async function getStats() {
  const accountsList = await initializeAccountsIfNeeded();
  return computeStats(accountsList);
}

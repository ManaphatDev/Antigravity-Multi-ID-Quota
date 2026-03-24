// Shared data store for accounts
// ใช้ in-memory store — ข้อมูลจะรีเซ็ตเมื่อ cold start

const accounts = [
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

// คำนวณ stats รวม
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
export function getAllAccounts() {
  return [...accounts];
}

export function getAccountById(id) {
  return accounts.find(a => a.id === id) || null;
}

export function addAccount(account) {
  const newId = String(Math.max(...accounts.map(a => parseInt(a.id))) + 1);
  const newAccount = { ...account, id: newId };
  accounts.push(newAccount);
  return newAccount;
}

export function updateAccount(id, updates) {
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) return null;
  accounts[index] = { ...accounts[index], ...updates };
  return accounts[index];
}

export function deleteAccount(id) {
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) return false;
  accounts.splice(index, 1);
  return true;
}

export function getStats() {
  return computeStats(accounts);
}

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, RefreshCw, Plus, AlertCircle, CheckCircle2, User, ChevronRight, BarChart2, Zap, X } from 'lucide-react';

// --- Minimalist Components ---

// Clean Arc Gauge
const ArcGauge = ({ label, percent, subtext, colorClass }) => {
  const radius = 34;
  const circumference = Math.PI * radius;
  const isNA = percent === 'N/A';
  const numericPercent = isNA ? 0 : percent;
  const dashoffset = circumference - (numericPercent / 100) * circumference;

  let strokeColor = '#262626'; // neutral-800
  let percentColor = 'text-neutral-500';
  let gradientId = 'grad-emerald';
  
  if (!isNA) {
    if (colorClass.includes('emerald')) { strokeColor = '#10b981'; percentColor = 'text-white'; gradientId = 'grad-emerald'; }
    else if (colorClass.includes('amber')) { strokeColor = '#f59e0b'; percentColor = 'text-white'; gradientId = 'grad-amber'; }
    else if (colorClass.includes('red')) { strokeColor = '#ef4444'; percentColor = 'text-white'; gradientId = 'grad-red'; }
    else if (colorClass.includes('blue')) { strokeColor = '#3b82f6'; percentColor = 'text-white'; gradientId = 'grad-blue'; }
    else { strokeColor = '#10b981'; }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[80px] h-[40px] overflow-hidden flex justify-center">
        <svg className="w-[80px] h-[80px] transform rotate-180 absolute top-0" viewBox="0 0 80 80">
          <defs>
            <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
            <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#1f1f1f" strokeWidth="6" strokeDasharray={`${circumference} ${circumference}`} />
          <circle 
            cx="40" cy="40" r={radius} fill="transparent" stroke={isNA ? '#262626' : `url(#${gradientId})`} 
            strokeWidth="6" strokeDasharray={`${circumference} ${circumference}`} 
            strokeDashoffset={dashoffset} strokeLinecap="round" 
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute bottom-[2px] w-full flex flex-col items-center justify-center">
          <span className={`font-bold text-[14px] leading-none ${percentColor}`}>
            {isNA ? 'N/A' : `${percent}`}<span className="text-[10px] text-neutral-500 font-normal ml-[1px]">%</span>
          </span>
        </div>
      </div>
      <div className="text-center mt-2 w-full">
        <div className="text-[11px] text-neutral-300 font-medium mb-[2px]">{label}</div>
        <div className="text-[10px] text-neutral-500">{isNA ? '—' : subtext}</div>
      </div>
    </div>
  );
};

// Clean Progress Bar
const CleanProgressBar = ({ label, current, max }) => {
  const percent = Math.min(100, (current / max) * 100);
  let barGradient = 'from-emerald-600 to-emerald-400';
  
  if (percent > 85) { barGradient = 'from-red-600 to-red-400'; }
  else if (percent > 65) { barGradient = 'from-amber-600 to-amber-400'; }

  const formatNumber = (num) => num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num;

  return (
    <div className="w-full mb-3 last:mb-0">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-[11px] text-neutral-400 font-medium uppercase tracking-wider">{label}</span>
        <span className="text-neutral-100 font-semibold text-xs">
          {current.toLocaleString()} <span className="text-neutral-500 font-normal">/ {formatNumber(max)}</span>
        </span>
      </div>
      <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden w-full">
        <div 
          className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-700`} 
          style={{ width: `${percent}%` }} 
        />
      </div>
    </div>
  );
};

// Skeleton
const SkeletonCard = () => (
  <div className="panel rounded-xl p-5 h-[320px] animate-pulse-subtle flex flex-col gap-6">
    <div className="flex justify-between items-start">
      <div className="flex gap-4 items-center">
        <div className="w-8 h-8 rounded-full bg-[#1f1f1f]" />
        <div>
          <div className="w-32 h-4 bg-[#1f1f1f] mb-2 rounded" />
          <div className="w-16 h-3 bg-neutral-900 rounded" />
        </div>
      </div>
    </div>
    <div className="flex justify-between py-4">
      <div className="w-16 h-16 bg-[#1f1f1f] rounded-full" />
      <div className="w-16 h-16 bg-[#1f1f1f] rounded-full" />
      <div className="w-16 h-16 bg-[#1f1f1f] rounded-full" />
    </div>
    <div className="mt-auto">
      <div className="w-full h-1.5 bg-[#1f1f1f] mb-4 flex justify-between rounded-full"></div>
      <div className="w-full h-1.5 bg-[#1f1f1f] rounded-full"></div>
    </div>
  </div>
);

// Account Card
const AccountCard = ({ account }) => {
  const isWarning = account.status === 'warning' || account.status === 'error';
  
  return (
    <div className="panel rounded-xl p-5 flex flex-col hover:-translate-y-0.5 hover:border-neutral-700 transition-all duration-300">
      
      {/* Card Header */}
      <div className="flex justify-between items-start mb-5 pb-4 border-b border-white/5">
        <div className="flex gap-3 items-center">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-neutral-800 shrink-0">
            <User size={14} className="text-neutral-400" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-[13px] font-semibold text-neutral-100 truncate w-[160px]" title={account.email}>
              {account.email}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isWarning ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]"></span>
                  <span className="text-[10px] text-red-400 font-medium">Quota Low</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]"></span>
                  <span className="text-[10px] text-emerald-400 font-medium">Active Node</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="text-neutral-500 hover:text-white transition-colors pt-1">
          <Settings size={14} />
        </button>
      </div>

      {/* Gauges */}
      <div className="flex justify-between items-center py-2 px-1">
        <ArcGauge label="Gemini Flash" percent={account.models.geminiFlash.percent} subtext={account.models.geminiFlash.time} colorClass={account.models.geminiFlash.color} />
        <ArcGauge label="Gemini Pro" percent={account.models.geminiPro.percent} subtext={account.models.geminiPro.time} colorClass={account.models.geminiPro.color} />
        <ArcGauge label="Claude" percent={account.models.claude.percent} subtext={account.models.claude.time} colorClass={account.models.claude.color} />
      </div>

      {/* AI Credits */}
      <div className="mt-5 flex flex-col pt-4 border-t border-white/5 relative">
        <div className="flex items-center gap-1.5 mb-3">
          <Zap size={10} className="text-amber-500" />
          <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-[0.15em]">AI Credits</span>
        </div>
        <CleanProgressBar label="Prompt" current={account.credits.prompt.current} max={account.credits.prompt.max} />
        <CleanProgressBar label="Flow" current={account.credits.flow.current} max={account.credits.flow.max} />
      </div>
    </div>
  );
};

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAccounts = useCallback(async (showRefreshAnim = false) => {
    try {
      if (showRefreshAnim) setIsRefreshing(true);
      setError(null);

      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      setAccounts(data.accounts);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      if (showRefreshAnim) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetch('/api/accounts/refresh', { method: 'POST' });
      await fetchAccounts(true);
    } catch (err) {
      console.error('Refresh failed:', err);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-200">
      
      {/* Sleek Top Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white flex items-center justify-center rounded-sm">
                <BarChart2 size={14} className="text-black" strokeWidth={3} />
              </div>
              <h1 className="font-semibold text-[15px] tracking-tight text-white">Antigravity</h1>
              <span className="text-neutral-600">/</span>
              <span className="text-[14px] text-neutral-400">Multi-ID Manager</span>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-sm text-neutral-400">
              {['overview', 'nodes', 'analytics', 'settings'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize transition-colors ${activeTab === tab ? 'text-white font-medium' : 'hover:text-neutral-200'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className={`text-neutral-400 hover:text-white transition-all ${isRefreshing ? 'animate-spin text-white' : ''}`}
              onClick={handleRefresh}
              title="Sync Data"
            >
              <RefreshCw size={14} />
            </button>
            <div className="h-4 w-px bg-neutral-800"></div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white text-black hover:bg-neutral-200 text-sm font-medium px-4 py-1.5 rounded-md transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <Plus size={14} /> Add ID
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {activeTab === 'overview' ? (
          <>
            {/* Page Header & Stats Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">Overview</h2>
            <p className="text-neutral-400 text-sm">Monitor and manage your connected AI identities.</p>
          </div>
          
          <div className="flex items-center gap-8">
            <div>
              <div className="text-[11px] text-neutral-500 font-medium mb-1 uppercase tracking-wider">Active IDs</div>
              <div className="text-2xl font-semibold text-white">
                {isLoading ? '...' : `${stats?.activeCount ?? 0}`}<span className="text-neutral-600 font-normal"> / {stats?.totalCount ?? 0}</span>
              </div>
            </div>
            <div className="w-px h-10 bg-neutral-800"></div>
            <div>
              <div className="text-[11px] text-neutral-500 font-medium mb-1 uppercase tracking-wider">Total Prompt</div>
              <div className="text-2xl font-semibold text-white">
                {isLoading ? '...' : stats?.totalPromptRemaining ?? '—'}
              </div>
            </div>
            <div className="w-px h-10 bg-neutral-800"></div>
            <div>
              <div className="text-[11px] text-neutral-500 font-medium mb-1 uppercase tracking-wider">Total Flow</div>
              <div className="text-2xl font-semibold text-white">
                {isLoading ? '...' : stats?.totalFlowRemaining ?? '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-8 border border-red-500/20 bg-red-500/10 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-200">Failed to sync data</h4>
              <p className="text-sm text-red-400/80 mt-1">{error}</p>
            </div>
            <button onClick={() => fetchAccounts()} className="ml-auto text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Nodes Grid */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              accounts.map((acc) => (
                <AccountCard key={acc.id} account={acc} />
              ))
            )}
          </div>
        </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-white/5 bg-white/[0.02] rounded-2xl border-dashed h-[400px]">
            <div className="text-neutral-500 mb-4 bg-black p-4 rounded-full border border-neutral-800">
              {activeTab === 'nodes' && <BarChart2 size={24} />}
              {activeTab === 'analytics' && <RefreshCw size={24} />}
              {activeTab === 'settings' && <Settings size={24} />}
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight capitalize">{activeTab}</h3>
            <p className="text-sm text-neutral-500 mt-2">
              The {activeTab} section is currently under development.
            </p>
          </div>
        )}

      </main>

      {/* Add ID Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Add New Identity</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-neutral-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Email / Associated Account</label>
                <input type="text" placeholder="e.g. system@company.com" className="w-full bg-[#111] border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors" />
              </div>
              
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Provider API Key</label>
                <input type="password" placeholder="••••••••••••••••" className="w-full bg-[#111] border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors" />
              </div>

              <button 
                onClick={() => {
                  alert('Backend integration coming soon!');
                  setIsAddModalOpen(false);
                }}
                className="w-full mt-2 bg-white text-black hover:bg-neutral-200 font-medium py-3 rounded-lg transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                Connect Identity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



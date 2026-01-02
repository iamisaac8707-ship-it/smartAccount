import React, { useState, useEffect, useMemo } from 'react';
import { Layout, History, Calendar as CalendarIcon, BarChart3, LogOut, RefreshCw, AlertCircle, Settings, ShieldCheck, Wallet, X, Server } from 'lucide-react';
import { Transaction, User, TransactionType, Asset, SpendingInsight } from './types';
import SummaryCards from './components/SummaryCards';
import QuickTip from './components/QuickTip';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import CalendarView from './components/CalendarView';
import DetailedAnalysis from './components/DetailedAnalysis';
import AssetView from './components/AssetView';
import Auth from './components/Auth';
import Charts from './components/Charts';
import { CloudService } from './services/cloudService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [insightsHistory, setInsightsHistory] = useState<SpendingInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'calendar' | 'analysis' | 'assets'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedChartCategory, setSelectedChartCategory] = useState<string | null>(null);

  useEffect(() => {
    // 자동 로그인 시도
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
        try {
            setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
            console.error("Failed to parse saved user", e);
        }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDataFromCloud();
    }
  }, [currentUser]);

  useEffect(() => {
    setSelectedChartCategory(null);
  }, [activeTab]);

  const loadDataFromCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const data = await CloudService.fetchData(currentUser.id);
      setTransactions(data.transactions);
      setAssets(data.assets);
      setInsightsHistory(data.insights);
      setSyncError(null);
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncDataToCloud = async (newList: Transaction[], newAssets: Asset[], newInsights: SpendingInsight[] = insightsHistory) => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      await CloudService.saveData(currentUser.id, newList, newAssets, newInsights);
      setSyncError(null);
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('auth_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('auth_user');
      setCurrentUser(null);
      // window.location.reload(); 
      setTransactions([]);
      setAssets([]);
      setInsightsHistory([]);
    }
  };

  // 트랜잭션/자산 핸들러들
  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    await syncDataToCloud(updated, assets);
  };

  const handleUpdateTransaction = async (id: string, data: Omit<Transaction, 'id'>) => {
    const updated = transactions.map(t => t.id === id ? { ...data, id } : t);
    setTransactions(updated);
    await syncDataToCloud(updated, assets);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    await syncDataToCloud(updated, assets);
  };

  const handleAddAsset = async (a: any) => {
    const dateToUse = a.date || new Date().toISOString().split('T')[0];
    const newAsset: Asset = { 
      ...a, id: crypto.randomUUID(), 
      lastUpdated: new Date().toISOString(),
      createdAt: dateToUse,
      deletedAt: null,
      history: [{ date: dateToUse, value: a.initialValue }]
    };
    const updated = [newAsset, ...assets];
    setAssets(updated);
    await syncDataToCloud(transactions, updated);
  };

  const handleUpdateAssetValue = async (id: string, newValue: number, unitPrice?: number, quantity?: number) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const updated = assets.map(asset => {
      if (asset.id === id) {
        const existingHistoryIdx = asset.history?.findIndex(h => h.date === nowStr);
        let newHistory = [...(asset.history || [])];
        if (existingHistoryIdx !== undefined && existingHistoryIdx !== -1) {
          newHistory[existingHistoryIdx] = { ...newHistory[existingHistoryIdx], value: newValue };
        } else {
          newHistory.push({ date: nowStr, value: newValue });
        }
        return {
          ...asset, currentValue: newValue,
          unitPrice: unitPrice !== undefined ? unitPrice : asset.unitPrice,
          quantity: quantity !== undefined ? quantity : asset.quantity,
          lastUpdated: new Date().toISOString(),
          history: newHistory
        };
      }
      return asset;
    });
    setAssets(updated);
    await syncDataToCloud(transactions, updated);
  };

  const handleBulkUpdateAssets = async (updates: any[]) => {
    const nowStr = new Date().toISOString().split('T')[0];
    const updated = assets.map(asset => {
      const update = updates.find(u => u.id === asset.id);
      if (update) {
        const existingHistoryIdx = asset.history?.findIndex(h => h.date === nowStr);
        let newHistory = [...(asset.history || [])];
        if (existingHistoryIdx !== undefined && existingHistoryIdx !== -1) {
          newHistory[existingHistoryIdx] = { ...newHistory[existingHistoryIdx], value: update.newValue };
        } else {
          newHistory.push({ date: nowStr, value: update.newValue });
        }
        return {
          ...asset, currentValue: update.newValue,
          unitPrice: update.unitPrice,
          lastUpdated: new Date().toISOString(),
          history: newHistory
        };
      }
      return asset;
    });
    setAssets(updated);
    await syncDataToCloud(transactions, updated);
  };

  const handleDeleteAsset = async (id: string, deleteDate: string) => {
    const finalAssets = assets.map(asset => {
        if (asset.id === id) return { ...asset, deletedAt: deleteDate };
        return asset;
    });
    setAssets(assets.filter(a => a.id !== id)); 
    await syncDataToCloud(transactions, finalAssets); 
  };

  const handleSaveInsight = async (insight: SpendingInsight) => {
    const updated = [insight, ...insightsHistory].slice(0, 50); 
    setInsightsHistory(updated);
    await syncDataToCloud(transactions, assets, updated);
  };

  const filteredTransactions = useMemo(() => {
    if (!selectedChartCategory) return transactions;
    return transactions.filter(t => t.category === selectedChartCategory);
  }, [transactions, selectedChartCategory]);

  if (!currentUser) return <Auth onLogin={handleLogin} />;

  const tabs = [
    { id: 'dashboard', label: '홈', icon: <Layout size={24} /> },
    { id: 'history', label: '기록', icon: <History size={24} /> },
    { id: 'assets', label: '자산', icon: <Wallet size={24} /> },
    { id: 'calendar', label: '달력', icon: <CalendarIcon size={24} /> },
    { id: 'analysis', label: 'AI 분석', icon: <BarChart3 size={24} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-['Pretendard'] overflow-x-hidden">
      {/* Top Bar */}
      <div className={`fixed top-0 left-0 right-0 z-[1000] px-6 flex items-center justify-between shadow-md h-16 bg-slate-900 text-white ${
        syncError ? 'bg-rose-600' : ''
      }`}>
        <div className="flex items-center gap-3">
          {syncError ? <AlertCircle size={20} /> : isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={20} className="text-emerald-400" />}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Connected Node</span>
            <span className="text-sm font-bold truncate max-w-[150px]">{currentUser.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="p-3 hover:bg-white/10 rounded-xl"><Settings size={22} /></button>
          <button onClick={handleLogout} className="p-3 hover:bg-rose-500/20 rounded-xl text-rose-300"><LogOut size={22} /></button>
        </div>
      </div>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full mt-20 pb-32">
        <header className="mb-8 px-2">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-900 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <Server size={14} /> System Secure
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <QuickTip transactions={transactions} />
              <SummaryCards transactions={transactions} assets={assets} />
              <section>
                 <div className="flex items-center justify-between mb-6 px-4">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">Recent Records</h2>
                    <button onClick={() => setActiveTab('history')} className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full">See All</button>
                 </div>
                 <TransactionList transactions={transactions.slice(0, 5)} onDelete={handleDeleteTransaction} onEdit={setEditingTransaction} isSyncing={isSyncing} hasError={!!syncError} />
              </section>
            </div>
          )}
          {activeTab === 'assets' && (
            <AssetView assets={assets} onAdd={handleAddAsset} onUpdateValue={handleUpdateAssetValue} onBulkUpdate={handleBulkUpdateAssets} onDelete={handleDeleteAsset} />
          )}
          {activeTab === 'calendar' && <CalendarView transactions={transactions} assets={assets} onDelete={handleDeleteTransaction} />}
          {activeTab === 'analysis' && <DetailedAnalysis transactions={transactions} assets={assets} insightsHistory={insightsHistory} onSaveInsight={handleSaveInsight} />}
          {activeTab === 'history' && (
            <div className="space-y-10">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                <Charts transactions={transactions} selectedCategory={selectedChartCategory} onCategorySelect={setSelectedChartCategory} />
              </div>
              <TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} onEdit={setEditingTransaction} isSyncing={isSyncing} hasError={!!syncError} />
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-4 left-4 right-4 h-16 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[1.5rem] flex items-center justify-around z-[900] shadow-2xl">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all ${activeTab === tab.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-300'}`}>
            {tab.icon}
            <span className="text-[10px] font-black mt-1 uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>

      <TransactionForm onAdd={handleAddTransaction} onUpdate={handleUpdateTransaction} editingTransaction={editingTransaction} onCancelEdit={() => setEditingTransaction(null)} />

      {showSettings && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 italic"><Settings size={20} className="text-indigo-600" /> Settings</h3>
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sync Status</p>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${syncError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <p className="text-sm font-bold text-slate-700">{syncError ? '연결 오류' : '보안 서버 연결됨'}</p>
                </div>
              </div>
              <div className="text-center space-y-2">
                 <p className="text-xs font-bold text-slate-500">계정: {currentUser.email}</p>
                 <button onClick={handleLogout} className="text-xs font-black text-rose-500 uppercase tracking-widest hover:underline">Sign Out</button>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black shadow-lg">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
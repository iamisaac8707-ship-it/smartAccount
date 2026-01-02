
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Asset, AssetType } from '../types';
import { Wallet, Plus, Trash2, TrendingUp, Coins, Landmark, Home, Gem, CircleDollarSign, ArrowUpRight, ArrowDownRight, CreditCard, ChevronLeft, ChevronRight, Calendar, RefreshCw, Scroll, CarFront, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchMarketPrice } from '../services/stockService';

interface AssetViewProps {
  assets: Asset[];
  onAdd: (asset: Omit<Asset, 'id' | 'lastUpdated' | 'history' | 'createdAt' | 'deletedAt'> & { initialValue: number, date?: string, ticker?: string, quantity?: number, unitPrice?: number }) => void;
  onUpdateValue: (id: string, newValue: number, unitPrice?: number, quantity?: number) => void;
  onDelete: (id: string, date: string) => void;
  onBulkUpdate?: (updates: { id: string, newValue: number, unitPrice: number }[]) => void;
}

const ASSET_COLORS: Record<AssetType, string> = {
  [AssetType.STOCK]: '#6366f1',
  [AssetType.CRYPTO]: '#f59e0b',
  [AssetType.BOND]: '#06b6d4',
  [AssetType.SAVINGS]: '#10b981',
  [AssetType.CAR]: '#f97316',
  [AssetType.REAL_ESTATE]: '#ec4899',
  [AssetType.COMMODITY]: '#8b5cf6',
  [AssetType.CASH]: '#94a3b8',
  [AssetType.LOAN]: '#f43f5e'
};

const ASSET_ICONS: Record<AssetType, React.ReactNode> = {
  [AssetType.STOCK]: <TrendingUp />,
  [AssetType.CRYPTO]: <Coins />,
  [AssetType.BOND]: <Scroll />,
  [AssetType.SAVINGS]: <Landmark />,
  [AssetType.CAR]: <CarFront />,
  [AssetType.REAL_ESTATE]: <Home />,
  [AssetType.COMMODITY]: <Gem />,
  [AssetType.CASH]: <CircleDollarSign />,
  [AssetType.LOAN]: <CreditCard />
};

const ASSET_ORDER = [
  AssetType.CASH,
  AssetType.SAVINGS,
  AssetType.BOND,
  AssetType.STOCK,
  AssetType.CRYPTO,
  AssetType.CAR,
  AssetType.REAL_ESTATE,
  AssetType.COMMODITY,
  AssetType.LOAN
];

interface AssetCardProps {
  asset: Asset & { contextValue: number };
  onDelete: () => void;
  onUpdate: () => void;
  isLoan?: boolean;
  isCurrentMonth: boolean;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onDelete, onUpdate, isLoan = false, isCurrentMonth }) => {
  const latest = asset.contextValue;
  const totalChange = latest - asset.purchaseAmount;
  const totalChangeRate = asset.purchaseAmount > 0 ? (totalChange / asset.purchaseAmount) * 100 : 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (window.confirm(`[${asset.name}] 항목을 정말 삭제하시겠습니까?`)) {
      onDelete();
    }
  };

  return (
    <div className={`bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border transition-all flex flex-col group ${isLoan ? 'border-rose-100 bg-rose-50/10' : 'border-slate-100'}`}>
      <div className="flex items-center">
        {/* Fix: Cast to React.ReactElement<any> to allow 'size' prop in cloneElement */}
        <div className={`p-4 rounded-2xl mr-4 sm:mr-5 flex-shrink-0`} style={{ backgroundColor: ASSET_COLORS[asset.type] + '20', color: ASSET_COLORS[asset.type] }}>
          {React.cloneElement(ASSET_ICONS[asset.type] as React.ReactElement<any>, { size: 24 })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg font-black truncate ${isLoan ? 'text-rose-900' : 'text-slate-900'}`}>{asset.name}</span>
            {asset.ticker && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[9px] font-black tracking-tighter uppercase">{asset.ticker}</span>}
          </div>
          <p className="text-[11px] text-slate-400 font-bold">
            매수/구매 ₩{asset.purchaseAmount.toLocaleString()}
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className={`text-xl sm:text-2xl font-black leading-none mb-2 ${isLoan ? 'text-rose-600' : 'text-slate-900'}`}>₩{latest.toLocaleString()}</p>
          <div className="flex items-center gap-1.5">
             <div className={`flex items-center text-[10px] font-black ${totalChange >= 0 ? (isLoan ? 'text-rose-500' : 'text-emerald-500') : (isLoan ? 'text-emerald-500' : 'text-rose-500')}`}>
                {totalChange >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                {Math.abs(totalChangeRate).toFixed(1)}%
             </div>
             {isCurrentMonth && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onUpdate(); }}
                  className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-colors ml-2"
                >
                  수정
                </button>
             )}
             <button 
               onClick={handleDelete}
               className="p-3 text-slate-300 hover:text-rose-600 transition-all rounded-xl hover:bg-rose-50"
               aria-label="삭제"
             >
               <Trash2 size={22} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssetView: React.FC<AssetViewProps> = ({ assets = [], onAdd, onUpdateValue, onDelete, onBulkUpdate }) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [updatingAsset, setUpdatingAsset] = useState<Asset | null>(null);
  const [newValue, setNewValue] = useState('');
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>(AssetType.STOCK);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [ticker, setTicker] = useState('');

  const lastDayOfMonthStr = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === (now.getMonth() + 1);
  const calculationDateStr = isCurrentMonth ? todayStr : lastDayOfMonthStr;

  const filteredAndGroupedAssets = useMemo(() => {
    const visibleAssets = (assets || []).filter(asset => {
      const createdAt = asset.createdAt || '0000-00-00';
      const deletedAt = asset.deletedAt || '9999-12-31';
      return calculationDateStr >= createdAt && calculationDateStr < deletedAt;
    });

    const assetsWithContextValue = visibleAssets.map(asset => {
      let contextValue = asset.currentValue;
      if (!isCurrentMonth && asset.history && asset.history.length > 0) {
        const historyPoint = [...asset.history]
          .filter(h => h.date <= calculationDateStr)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        if (historyPoint) contextValue = historyPoint.value;
      }
      return { ...asset, contextValue };
    });

    const sortFn = (list: typeof assetsWithContextValue) => {
      return [...list].sort((a, b) => {
        const orderA = ASSET_ORDER.indexOf(a.type);
        const orderB = ASSET_ORDER.indexOf(b.type);
        if (orderA !== orderB) return orderA - orderB;
        return b.contextValue - a.contextValue;
      });
    };

    return {
      assetsOnly: sortFn(assetsWithContextValue.filter(a => a.type !== AssetType.LOAN)),
      loansOnly: sortFn(assetsWithContextValue.filter(a => a.type === AssetType.LOAN))
    };
  }, [assets, calculationDateStr, isCurrentMonth]);

  const totalAssetsValue = filteredAndGroupedAssets.assetsOnly.reduce((acc, a) => acc + a.contextValue, 0);
  const totalLoansValue = filteredAndGroupedAssets.loansOnly.reduce((acc, a) => acc + a.contextValue, 0);
  const netWorth = totalAssetsValue - totalLoansValue;

  const chartData = Object.values(AssetType).map(t => ({
    name: t,
    value: [...filteredAndGroupedAssets.assetsOnly, ...filteredAndGroupedAssets.loansOnly]
      .filter(a => a.type === t)
      .reduce((acc, a) => acc + a.contextValue, 0)
  })).filter(d => d.value > 0);

  const handleUpdatePrices = async () => {
    if (!onBulkUpdate) return;
    const tickerAssets = assets.filter(a => !a.deletedAt && a.ticker && (a.type === AssetType.STOCK || a.type === AssetType.CRYPTO));
    if (tickerAssets.length === 0) {
      alert("티커(종목코드)가 입력된 자산이 없습니다. 자산 추가 시 티커를 입력해주세요.");
      return;
    }

    setIsUpdatingPrices(true);
    const updates: { id: string, newValue: number, unitPrice: number }[] = [];

    try {
      for (const asset of tickerAssets) {
        const info = await fetchMarketPrice(asset.ticker!);
        if (info) {
          updates.push({
            id: asset.id,
            newValue: info.price * (asset.quantity || 1),
            unitPrice: info.price
          });
        }
      }
      if (updates.length > 0) {
        onBulkUpdate(updates);
      }
    } catch (e) {
      alert("시세 조회 중 오류가 발생했습니다.");
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !purchaseAmount || !initialValue) return;
    onAdd({
      name, type,
      purchaseAmount: Number(purchaseAmount),
      initialValue: Number(initialValue),
      currentValue: Number(initialValue),
      ticker: ticker || undefined,
      date: todayStr
    });
    setName(''); setPurchaseAmount(''); setInitialValue(''); setTicker(''); setShowAddForm(false);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingAsset || !newValue) return;
    onUpdateValue(updatingAsset.id, Number(newValue));
    setUpdatingAsset(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Month Selector */}
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 sticky top-16 z-[300] backdrop-blur-md bg-white/90">
        <div className="flex items-center justify-between mb-4 px-4">
          <button onClick={() => setSelectedYear(y => y - 1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><ChevronLeft size={20} /></button>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            <span className="text-xl font-black text-slate-900 italic">{selectedYear}년</span>
          </div>
          <button onClick={() => setSelectedYear(y => y + 1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><ChevronRight size={20} /></button>
        </div>
        <div ref={scrollRef} className="flex overflow-x-auto gap-2 pb-2 px-2 no-scrollbar scroll-smooth">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <button key={m} data-active={selectedMonth === m} onClick={() => setSelectedMonth(m)} className={`flex-shrink-0 min-w-[55px] py-3 rounded-xl font-black text-sm transition-all ${selectedMonth === m ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>{m}월</button>
          ))}
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-8">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 w-full text-center md:text-left">
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2">Net Worth ({isCurrentMonth ? 'TODAY' : calculationDateStr})</p>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className={`text-4xl sm:text-5xl font-black tracking-tighter italic ${netWorth >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>₩{netWorth.toLocaleString()}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
               <div className="text-right">
                 <p className="text-[10px] font-black text-slate-300 uppercase leading-none">Total Assets</p>
                 <p className="text-base font-black text-indigo-600">₩{totalAssetsValue.toLocaleString()}</p>
               </div>
               <div className="text-right border-l pl-4 border-slate-100">
                 <p className="text-[10px] font-black text-slate-300 uppercase leading-none">Total Loans</p>
                 <p className="text-base font-black text-rose-500">₩{totalLoansValue.toLocaleString()}</p>
               </div>
            </div>
          </div>
          <div className="w-full md:w-48 h-48">
             <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name as AssetType]} />))}</Pie><Tooltip formatter={(v: number) => `₩${v.toLocaleString()}`} /></PieChart></ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Market Portfolio Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-slate-900 italic flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500"/> Market Portfolio
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={handleUpdatePrices} 
              disabled={isUpdatingPrices}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl font-black text-[13px] border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isUpdatingPrices ? "animate-spin" : ""} /> 시세 업데이트
            </button>
            <button 
              onClick={() => setShowAddForm(true)} 
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[13px] shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              <Plus size={18} /> 항목 추가
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredAndGroupedAssets.assetsOnly.length === 0 && filteredAndGroupedAssets.loansOnly.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
               <Wallet size={48} className="mb-4 opacity-20" />
               <p className="font-black italic">기록된 자산이 없습니다.</p>
            </div>
          ) : (
            <>
              {filteredAndGroupedAssets.assetsOnly.map(asset => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  onDelete={() => onDelete(asset.id, todayStr)} 
                  onUpdate={() => { 
                    setUpdatingAsset(asset); 
                    setNewValue(asset.currentValue.toString()); 
                  }} 
                  isCurrentMonth={isCurrentMonth} 
                />
              ))}
              {filteredAndGroupedAssets.loansOnly.map(asset => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  onDelete={() => onDelete(asset.id, todayStr)} 
                  onUpdate={() => { 
                    setUpdatingAsset(asset); 
                    setNewValue(asset.currentValue.toString()); 
                  }} 
                  isLoan isCurrentMonth={isCurrentMonth} 
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 italic">자산 항목 추가</h3>
              <button onClick={() => setShowAddForm(false)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">자산명</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" placeholder="예: 삼성전자, 현금" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">유형</label>
                    <select value={type} onChange={e => setType(e.target.value as AssetType)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold">
                      {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">티커/종목코드 (선택)</label>
                    <input type="text" value={ticker} onChange={e => setTicker(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" placeholder="005930, AAPL 등" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">매수/구매가</label>
                    <input type="number" value={purchaseAmount} onChange={e => setPurchaseAmount(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" required />
                  </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">현재 가치 (실제 자산가)</label>
                 <input type="number" value={initialValue} onChange={e => setInitialValue(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" required />
               </div>
               <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all">자산 데이터 저장</button>
            </form>
          </div>
        </div>
      )}

      {/* Update Value Modal */}
      {updatingAsset && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95">
             <h3 className="text-xl font-black text-slate-900 mb-6 italic">가치 업데이트 - {updatingAsset.name}</h3>
             <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">변경된 현재 가치</label>
                  <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-lg" autoFocus required />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setUpdatingAsset(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black">취소</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg active:scale-95 transition-all">반영하기</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetView;

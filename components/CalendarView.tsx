
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wallet, Gem, CreditCard, TrendingUp } from 'lucide-react';
import { Transaction, TransactionType, Asset, AssetType } from '../types';
import { CATEGORIES } from '../constants';

interface CalendarViewProps {
  transactions: Transaction[];
  assets: Asset[];
  onDelete: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ transactions, assets = [], onDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  const filteredTransactions = transactions.filter(t => t.date === selectedDate);
  
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const monthIncome = monthTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);
  const monthExpense = monthTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const getDayTransactions = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return transactions.filter(t => t.date === dateStr);
  };

  // 선택된 날짜 기준 자산 현황 계산 로직 개선
  const selectedDayWealth = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;

    const activeAssetsOnDay = assets.filter(a => {
      const createdAt = a.createdAt || a.lastUpdated?.split('T')[0] || '0000-00-00';
      const deletedAt = a.deletedAt || '9999-12-31';
      // 자산이 생성된 이후이고, 삭제되기 이전인 경우만 포함
      return selectedDate >= createdAt && selectedDate < deletedAt;
    });

    const assetDetails = activeAssetsOnDay.map(asset => {
      let valueOnDay = asset.currentValue;

      if (!isToday) {
        // 오늘이 아닌 과거 날짜를 조회할 경우, 히스토리에서 해당 날짜 시점의 값을 찾음
        if (asset.history && asset.history.length > 0) {
          const historyPoint = [...asset.history]
            .filter(h => h.date <= selectedDate)
            .sort((a, b) => b.date.localeCompare(a.date))[0];
          
          if (historyPoint) {
            valueOnDay = historyPoint.value;
          } else {
            // 해당 날짜 이전 기록이 없으면 최초 구매 금액(또는 초기값)으로 추정
            valueOnDay = asset.purchaseAmount || asset.currentValue;
          }
        }
      }
      // 오늘인 경우 asset.currentValue를 그대로 사용하여 실시간성 확보
      
      return { ...asset, valueOnDay };
    });

    const totalAssets = assetDetails.filter(a => a.type !== AssetType.LOAN).reduce((acc, a) => acc + a.valueOnDay, 0);
    const totalLoans = assetDetails.filter(a => a.type === AssetType.LOAN).reduce((acc, a) => acc + a.valueOnDay, 0);

    return {
      totalAssets,
      totalLoans,
      netWorth: totalAssets - totalLoans,
      details: assetDetails.sort((a, b) => b.valueOnDay - a.valueOnDay)
    };
  }, [selectedDate, assets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 월간 요약 섹션 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 italic">{year}년 {month + 1}월</h2>
            <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Monthly Overview</p>
          </div>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inflow</p>
            <p className="text-lg font-black text-emerald-600">+₩{monthIncome.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outflow</p>
            <p className="text-lg font-black text-rose-600">-₩{monthExpense.toLocaleString()}</p>
          </div>
          <div className="text-right border-l pl-8 border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
            <p className={`text-lg font-black ${monthIncome - monthExpense >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              ₩{(monthIncome - monthExpense).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 달력 본체 */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 text-xl italic">Activity Calendar</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div key={d} className={`text-center text-[10px] font-black py-2 uppercase tracking-widest ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-indigo-500' : 'text-slate-300'}`}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 sm:h-24"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayData = getDayTransactions(day);
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              const dayExpense = dayData.filter(t => t.type === TransactionType.EXPENSE).reduce((a, c) => a + c.amount, 0);
              const dayIncome = dayData.filter(t => t.type === TransactionType.INCOME).reduce((a, c) => a + c.amount, 0);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-16 sm:h-24 p-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-start relative group ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-50' 
                      : 'border-slate-50 hover:border-slate-200 bg-white'
                  }`}
                >
                  <span className={`text-sm font-black ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-lg' : isSelected ? 'text-indigo-600' : 'text-slate-600'}`}>
                    {day}
                  </span>
                  
                  <div className="mt-auto w-full space-y-0.5 overflow-hidden hidden sm:block">
                    {dayIncome > 0 && <p className="text-[9px] font-black text-emerald-500 truncate">+{(dayIncome/1000).toFixed(0)}k</p>}
                    {dayExpense > 0 && <p className="text-[9px] font-black text-rose-400 truncate">-{(dayExpense/1000).toFixed(0)}k</p>}
                  </div>
                  
                  <div className="sm:hidden mt-2 flex gap-0.5">
                    {dayIncome > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                    {dayExpense > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택한 날짜 상세 및 자산 현황 */}
        <div className="space-y-6">
          {/* 순자산 타임머신 카드 */}
          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <TrendingUp size={80} />
             </div>
             <div className="relative z-10">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Net Worth on {selectedDate}</p>
               <h4 className="text-3xl font-black italic tracking-tighter mb-4">₩{selectedDayWealth.netWorth.toLocaleString()}</h4>
               <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-[9px] font-bold text-white/50 uppercase">Assets</p>
                    <p className="font-black text-indigo-200">₩{selectedDayWealth.totalAssets.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-white/50 uppercase">Debt</p>
                    <p className="font-black text-rose-300">₩{selectedDayWealth.totalLoans.toLocaleString()}</p>
                  </div>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col max-h-[600px] overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 italic">Day Details</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedDate}</p>
              </div>
              <CalendarIcon size={18} className="text-indigo-600" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
              {/* 자산 목록 */}
              <div className="space-y-3">
                 <h5 className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                   <Gem size={10} /> Portfolio on this day
                 </h5>
                 {selectedDayWealth.details.length > 0 ? (
                   <div className="space-y-2">
                      {selectedDayWealth.details.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-indigo-500">
                               {a.type === AssetType.LOAN ? <CreditCard size={14}/> : <Gem size={14}/>}
                            </div>
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{a.name}</span>
                          </div>
                          <span className={`text-xs font-black ${a.type === AssetType.LOAN ? 'text-rose-500' : 'text-slate-900'}`}>₩{a.valueOnDay.toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <p className="text-xs text-slate-400 italic py-2 text-center">기록된 자산이 없습니다.</p>
                 )}
              </div>

              {/* 거래 내역 */}
              <div className="space-y-3">
                <h5 className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                  <TrendingUp size={10} /> Transactions
                </h5>
                {filteredTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {filteredTransactions.map(t => {
                      const catInfo = CATEGORIES[t.category];
                      return (
                        <div key={t.id} className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center group shadow-sm">
                          <div className={`p-2.5 rounded-xl mr-3 ${catInfo.color}`}>
                            {catInfo.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{t.description || t.category}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{t.category}</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className={`text-xs font-black ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-slate-900'}`}>
                              {t.type === TransactionType.INCOME ? '+' : '-'}₩{t.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-slate-300 opacity-50">
                    <TrendingUp size={24} className="mb-2" />
                    <p className="text-[10px] font-black uppercase">No Activity Recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

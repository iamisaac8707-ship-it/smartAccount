
import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Calendar, BarChart as BarChartIcon, Gem } from 'lucide-react';
import { Transaction, TransactionType, Asset, AssetType } from '../types';

interface SummaryCardsProps {
  transactions: Transaction[];
  assets: Asset[];
  onIncomeClick?: () => void;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ transactions, assets = [] }) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyBudget = 2000000; 

  // 당월 거래 내역
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const monthIncome = monthTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);
  const monthExpense = monthTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);
  const monthBalance = monthIncome - monthExpense;

  const yearTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear;
  });

  const yearIncome = yearTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);
  const yearExpense = yearTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 실시간 자산 계산
  const activeAssets = assets.filter(a => {
    const createdAt = a.createdAt || '0000-00-00';
    const deletedAt = a.deletedAt || '9999-12-31';
    return todayStr >= createdAt && todayStr < deletedAt;
  });

  const totalAssetsValue = activeAssets
    .filter(a => a.type !== AssetType.LOAN)
    .reduce((acc, a) => acc + a.currentValue, 0);
  
  const totalLoansValue = activeAssets
    .filter(a => a.type === AssetType.LOAN)
    .reduce((acc, a) => acc + a.currentValue, 0);
    
  const netWorth = totalAssetsValue - totalLoansValue;

  const budgetUsagePercent = Math.min(Math.round((monthExpense / monthlyBudget) * 100), 100);

  const cardClass = "bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[135px] relative overflow-hidden group transition-all hover:shadow-md";
  const labelClass = "text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1 flex items-center gap-1";
  const amountClass = "text-2xl font-black tracking-tighter italic leading-none";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 px-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
          <Calendar size={14} className="text-indigo-500" /> Current Month ({currentMonth + 1}월)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cardClass}>
            <div>
              <p className={labelClass}>당월 수입</p>
              <p className={`${amountClass} text-emerald-600`}>+₩{monthIncome.toLocaleString()}</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <TrendingUp size={24} className="text-emerald-100 group-hover:text-emerald-200 transition-colors" />
              <span className="text-[10px] font-bold text-emerald-300">Inflow</span>
            </div>
          </div>

          <div className={cardClass}>
            <div>
              <p className={labelClass}>당월 지출</p>
              <p className={`${amountClass} text-rose-600`}>-₩{monthExpense.toLocaleString()}</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase">
                   <span>Budget Usage</span>
                   <span>{budgetUsagePercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${budgetUsagePercent > 90 ? 'bg-rose-500' : budgetUsagePercent > 70 ? 'bg-amber-400' : 'bg-indigo-400'}`} 
                    style={{ width: `${budgetUsagePercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <TrendingDown size={24} className="text-rose-100 group-hover:text-rose-200 transition-colors" />
            </div>
          </div>

          <div className={`${cardClass} bg-indigo-600 border-none text-white`}>
            <div>
              <p className="text-indigo-200 text-[11px] font-black uppercase tracking-widest mb-1">당월 잔액</p>
              <p className={`${amountClass} text-white`}>₩{monthBalance.toLocaleString()}</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Wallet size={24} className="text-indigo-400" />
              <span className="text-[10px] font-bold opacity-60">Result</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 px-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
          <BarChartIcon size={14} className="text-slate-400" /> Cumulative & Wealth
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cardClass}>
            <div>
              <p className={labelClass}>누적 수입</p>
              <p className={`${amountClass} text-slate-900 opacity-80`}>₩{yearIncome.toLocaleString()}</p>
            </div>
            <div className="mt-2 text-right">
              <span className="text-[10px] font-bold text-slate-300">{currentYear}년</span>
            </div>
          </div>

          <div className={cardClass}>
            <div>
              <p className={labelClass}>누적 지출</p>
              <p className={`${amountClass} text-slate-900 opacity-80`}>₩{yearExpense.toLocaleString()}</p>
            </div>
            <div className="mt-2 text-right">
              <span className="text-[10px] font-bold text-slate-300">{currentYear}년</span>
            </div>
          </div>

          <div className={`${cardClass} border-indigo-100 bg-indigo-50/50`}>
            <div>
              <p className={`${labelClass} text-indigo-400`}><Gem size={10} /> 실시간 전체 자산</p>
              <p className={`${amountClass} text-indigo-900`}>
                ₩{totalAssetsValue.toLocaleString()}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-indigo-200 border border-white"></div>
                <div className="w-4 h-4 rounded-full bg-indigo-300 border border-white"></div>
                <div className="w-4 h-4 rounded-full bg-indigo-400 border border-white"></div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-indigo-300 uppercase leading-none">순자산 (Net Worth)</p>
                <p className="text-[11px] font-black text-indigo-600">₩{netWorth.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;

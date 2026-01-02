
import React from 'react';
import { Trash2, Cloud, Edit3, WifiOff, RefreshCw } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { CATEGORIES } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  isSyncing?: boolean;
  hasError?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit, isSyncing, hasError }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] p-16 sm:p-20 border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
        <p className="text-2xl sm:text-3xl font-black mb-4 text-slate-300">내역이 없습니다</p>
        <p className="font-bold text-lg">첫 거래를 기록해보세요!</p>
      </div>
    );
  }

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
      <div className="px-8 py-7 border-b border-slate-50 font-black text-slate-900 uppercase tracking-widest text-base flex justify-between items-center bg-white">
        <span>최근 거래</span>
        <span className={`text-xs flex items-center gap-2 font-black uppercase ${
          hasError ? 'text-rose-500' : isSyncing ? 'text-indigo-500' : 'text-emerald-500'
        }`}>
          {hasError ? (
            <><WifiOff size={16} /> ERROR</>
          ) : isSyncing ? (
            <><RefreshCw size={16} className="animate-spin" /> SYNCING</>
          ) : (
            <><Cloud size={16} /> SECURE CLOUD</>
          )}
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {sortedTransactions.map((t) => {
          const catInfo = CATEGORIES[t.category];
          return (
            <div key={t.id} className="px-8 py-8 flex items-center hover:bg-slate-50 transition-all group">
              <div className={`p-5 rounded-3xl mr-6 shadow-sm ${catInfo.color}`}>
                {React.cloneElement(catInfo.icon as React.ReactElement<any>, { size: 28 })}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-black text-slate-900 truncate mb-1">
                  {t.description || t.category}
                </div>
                <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                  {t.date} • {t.category}
                </div>
              </div>
              <div className="text-right ml-4">
                <div className={`text-xl sm:text-3xl font-black ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}₩{Math.round(t.amount).toLocaleString()}
                </div>
              </div>
              {/* 모바일에서도 항상 보이도록 수정 */}
              <div className="flex gap-1 ml-4 sm:ml-6">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                  className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="수정"
                >
                  <Edit3 size={20} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm('삭제하시겠습니까?')) onDelete(t.id); }}
                  className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="삭제"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionList;

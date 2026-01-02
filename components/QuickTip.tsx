
import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Transaction } from '../types';
import { getQuickFinancialTip } from '../services/geminiService';

interface QuickTipProps {
  transactions: Transaction[];
}

const QuickTip: React.FC<QuickTipProps> = ({ transactions }) => {
  const [tip, setTip] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchTip = async () => {
    setLoading(true);
    try {
      const result = await getQuickFinancialTip(transactions);
      setTip(result);
    } catch (e) {
      setTip("오늘도 스마트한 소비 습관을 유지해볼까요? 🌱");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTip();
  }, []);

  return (
    <div className="bg-white px-6 py-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4 transition-all hover:border-indigo-200">
      <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 flex-shrink-0">
        {loading ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">AI Daily Tip</p>
        <p className="text-sm font-bold text-slate-700 leading-snug">
          {loading ? "데이터를 읽고 조언을 준비 중입니다..." : tip}
        </p>
      </div>
      <button 
        onClick={fetchTip}
        disabled={loading}
        className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
      >
        <RefreshCw size={14} />
      </button>
    </div>
  );
};

export default QuickTip;


import React, { useState } from 'react';
import { Sparkles, RefreshCw, Lightbulb, TrendingDown, Info } from 'lucide-react';
import { Transaction, SpendingInsight } from '../types';
// Fixed the missing export error by importing the correct function name
import { getDetailedFinancialInsights } from '../services/geminiService';

interface AIAdvisorProps {
  transactions: Transaction[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions }) => {
  const [insight, setInsight] = useState<SpendingInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      // Updated to use the correct exported function name
      const result = await getDetailedFinancialInsights(transactions);
      setInsight(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-indigo-600 rounded-2xl shadow-lg p-6 mb-8 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Sparkles size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI 금융 비서</h2>
              <p className="text-indigo-100 text-xs">개인 맞춤형 재무 분석</p>
            </div>
          </div>
          <button 
            onClick={generateInsight}
            disabled={loading || transactions.length === 0}
            className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            {insight ? '다시 분석하기' : '데이터 분석하기'}
          </button>
        </div>

        {!insight && !loading && (
          <div className="flex flex-col items-center py-6 text-indigo-100 text-center">
            <Info size={40} className="mb-2 opacity-50" />
            <p>소비 습관을 분석할 준비가 되셨나요? 위 버튼을 클릭해주세요.</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-300 border-t-white rounded-full animate-spin"></div>
            <p className="text-indigo-100 animate-pulse">Gemini가 데이터를 분석 중입니다...</p>
          </div>
        )}

        {insight && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                  <TrendingDown size={14} /> 소비 패턴 분석
                </div>
                <p className="text-sm leading-relaxed">{insight.analysis}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                  <Lightbulb size={14} /> 전문가의 팁
                </div>
                <p className="text-sm leading-relaxed">{insight.tips}</p>
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} /> 당신을 위한 제안
              </div>
              <ul className="space-y-3">
                {insight.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAdvisor;

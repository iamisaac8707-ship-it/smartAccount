
import React, { useState, useRef, useEffect } from 'react';
// Added Plus to the import list from lucide-react
import { Sparkles, BarChart3, PieChart as PieIcon, Lightbulb, TrendingUp, ShieldCheck, RefreshCw, Wallet, Send, User, Bot, MessageSquareText, FileText, ChevronRight, History, Plus } from 'lucide-react';
import { Transaction, SpendingInsight, Asset, ChatMessage } from '../types';
import { getDetailedFinancialInsights, startFinancialChat } from '../services/geminiService';
import { Chat } from '@google/genai';
import Charts from './Charts';

interface DetailedAnalysisProps {
  transactions: Transaction[];
  assets?: Asset[];
  insightsHistory: SpendingInsight[];
  onSaveInsight: (insight: SpendingInsight) => void;
}

const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ transactions, assets = [], insightsHistory = [], onSaveInsight }) => {
  const [insight, setInsight] = useState<SpendingInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewingMode, setViewingMode] = useState<'intro' | 'report' | 'chat' | 'history'>('intro');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Fix: Added state for category selection to satisfy ChartsProps requirement
  const [selectedChartCategory, setSelectedChartCategory] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const fetchAnalysis = async () => {
    if (transactions.length === 0 && assets.length === 0) {
      alert("분석할 거래 내역이나 자산 데이터가 없습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await getDetailedFinancialInsights(transactions, assets);
      const newInsight: SpendingInsight = {
        ...res,
        id: crypto.randomUUID(),
        date: new Date().toISOString()
      };
      
      setInsight(newInsight);
      onSaveInsight(newInsight); 
      
      const totalAssets = assets.filter(a => !a.deletedAt && a.type !== '대출/부채' as any).reduce((acc, a) => acc + a.currentValue, 0);
      const totalLoans = assets.filter(a => !a.deletedAt && a.type === '대출/부채' as any).reduce((acc, a) => acc + a.currentValue, 0);
      const netWorth = totalAssets - totalLoans;

      const initialMsg: ChatMessage = {
        role: 'model',
        text: `안녕하세요! 방금 생성된 리포트를 바탕으로 맞춤형 재무 상담을 도와드릴게요.\n\n현재 순자산 ₩${netWorth.toLocaleString()}원을 기반으로 어떤 점이 가장 고민되시나요?`,
        timestamp: new Date()
      };
      setMessages([initialMsg]);
      setViewingMode('report');
      
      chatRef.current = startFinancialChat(transactions, assets);
    } catch (e) {
      console.error(e);
      alert("리포트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadOldInsight = (old: SpendingInsight) => {
    setInsight(old);
    setViewingMode('report');
    chatRef.current = startFinancialChat(transactions, assets);
    setMessages([{
      role: 'model',
      text: `${new Date(old.date).toLocaleDateString()}에 생성된 과거 리포트입니다. 이 데이터를 기반으로 계속 대화하실 수 있습니다.`,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chatRef.current || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: userInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);

    try {
      const result = await chatRef.current.sendMessage({ message: userMsg.text });
      setMessages(prev => [...prev, {
        role: 'model',
        text: result.text || "답변을 가져오지 못했습니다.",
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "연결 오류가 발생했습니다.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  // '인트로(생성하기)' 화면: 사용자가 가장 먼저 보게 될 화면
  if (viewingMode === 'intro') {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 hidden sm:block"><Sparkles size={180} /></div>
          <div className="relative z-10 text-center sm:text-left">
            <h2 className="text-4xl md:text-6xl font-black mb-6 flex items-center justify-center sm:justify-start gap-3 tracking-tighter italic">
              AI FINANCIAL ADVISOR <Sparkles className="text-yellow-300" />
            </h2>
            <p className="text-indigo-100 text-lg md:text-2xl font-medium leading-relaxed mb-12 max-w-2xl">
              지출 패턴과 자산 흐름을 Gemini가 정밀 분석합니다.<br/>
              개인 맞춤형 리포트와 실시간 재무 상담을 시작하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={fetchAnalysis}
                disabled={loading}
                className="bg-white text-indigo-600 px-12 py-6 rounded-[2rem] font-black text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={32} /> : <BarChart3 size={32} />}
                정밀 분석 리포트 생성
              </button>
            </div>
          </div>
        </div>

        {/* 과거 이력 섹션 */}
        {insightsHistory.length > 0 && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 italic mb-6 flex items-center gap-2">
              <History className="text-indigo-600" /> 과거 분석 불러오기
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insightsHistory.slice(0, 4).map(old => (
                <button 
                  key={old.id} 
                  onClick={() => loadOldInsight(old)} 
                  className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">{new Date(old.date).toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{old.analysis}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors ml-4" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
      {/* 분석 결과 페이지의 상단 네비게이션 */}
      <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100 sticky top-16 z-[400] backdrop-blur-md bg-white/90">
        <button 
          onClick={() => setViewingMode('report')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${viewingMode === 'report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
        >
          <FileText size={16} /> 분석 결과
        </button>
        <button 
          onClick={() => setViewingMode('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${viewingMode === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
        >
          <MessageSquareText size={16} /> AI 상담
        </button>
        <button 
          onClick={() => setViewingMode('intro')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs text-slate-400 hover:bg-slate-50 transition-all"
        >
          <Plus size={16} /> 새 리포트
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 리포트 본문 영역 */}
        <div className={`${viewingMode === 'report' ? 'flex' : 'hidden'} xl:flex flex-col gap-6`}>
           <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 italic flex items-center gap-2">
                  <ShieldCheck className="text-indigo-600" /> 리포트 본문
                </h3>
                {insight && <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">{new Date(insight.date).toLocaleDateString()}</span>}
              </div>
              
              {insight && (
                <div className="space-y-8">
                   <section className="space-y-3">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500" /> 주요 진단</h4>
                     <div className="bg-indigo-50/30 p-5 rounded-3xl border border-indigo-100">
                       <p className="text-indigo-900 leading-relaxed font-bold text-sm">"{insight.analysis}"</p>
                     </div>
                     <p className="text-slate-600 leading-relaxed text-sm p-1">{insight.assetAnalysis}</p>
                   </section>

                   <section className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lightbulb size={14} className="text-amber-500" /> 맞춤형 제언</h4>
                     <div className="grid grid-cols-1 gap-3">
                       {insight.suggestions.map((s, i) => (
                         <div key={i} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs flex-shrink-0">{i + 1}</span>
                           <p className="text-xs font-bold text-slate-700">{s}</p>
                         </div>
                       ))}
                     </div>
                   </section>

                   <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-lg">
                      <h4 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2">Long-term Strategy</h4>
                      <p className="text-base font-bold leading-snug">"{insight.savingGoalAdvice}"</p>
                   </div>
                </div>
              )}
           </div>
           <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 italic">
                <PieIcon className="text-indigo-600" /> Consumption Chart
              </h3>
              {/* Fix: Passed required selectedCategory and onCategorySelect props */}
              <Charts 
                transactions={transactions} 
                selectedCategory={selectedChartCategory}
                onCategorySelect={setSelectedChartCategory}
              />
           </div>
        </div>

        {/* AI 상담 채팅 영역 */}
        <div className={`${viewingMode === 'chat' ? 'flex' : 'hidden'} xl:flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden xl:h-[calc(100vh-280px)] min-h-[500px]`}>
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-indigo-600 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-2xl"><Bot size={22} /></div>
              <div>
                <h3 className="font-black text-base italic leading-tight">Gemini Advisor</h3>
                <p className="text-[8px] font-black uppercase opacity-70 tracking-widest">Live Personal Finance Chat</p>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 no-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 rounded-[1.5rem] rounded-tl-none flex gap-1 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="궁금한 재무 상황을 질문하세요..."
                className="w-full pl-5 pr-14 py-4 bg-slate-50 border-none rounded-[1.5rem] font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all disabled:opacity-50"
                disabled={isTyping}
              />
              <button 
                type="submit"
                disabled={!userInput.trim() || isTyping}
                className="absolute right-1.5 p-3.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 active:scale-90 transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalysis;

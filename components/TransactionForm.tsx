
import React, { useState, useEffect } from 'react';
import { Plus, X, CloudUpload, Edit3, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { CATEGORIES } from '../constants';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  onUpdate: (id: string, transaction: Omit<Transaction, 'id'>) => Promise<void>;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, onUpdate, editingTransaction, onCancelEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('식비');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(Math.round(editingTransaction.amount).toString());
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
      setIsOpen(true);
    }
  }, [editingTransaction]);

  const handleClose = () => {
    setIsOpen(false);
    setShowDatePicker(false);
    setAmount('');
    setDescription('');
    if (editingTransaction) onCancelEdit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    setIsSyncing(true);
    try {
      const finalAmount = Math.round(Number(amount));
      const data = { type, amount: finalAmount, category, description, date };
      
      if (editingTransaction) {
        await onUpdate(editingTransaction.id, data);
      } else {
        await onAdd(data);
      }
      handleClose();
    } finally {
      setIsSyncing(false);
    }
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const handleDateSelect = (day: number) => {
    const selected = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setDate(selected);
    setShowDatePicker(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 bg-indigo-600 text-white w-16 h-16 rounded-full shadow-[0_10px_30px_-5px_rgba(79,70,229,0.5)] hover:bg-indigo-700 transition-all transform hover:scale-105 z-40 flex items-center justify-center active:scale-90"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-end justify-center px-0">
          <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between flex-shrink-0 bg-white z-10 border-b border-slate-50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingTransaction ? '기록 수정' : '내역 추가'}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-indigo-600 font-bold text-xs uppercase tracking-tight">
                  <CloudUpload size={14} /> 실시간 동기화
                </div>
              </div>
              <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
                <X size={28} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Scrollable Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide pb-32">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-3 text-base font-black rounded-xl transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}
                >
                  지출
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
                  className={`flex-1 py-3 text-base font-black rounded-xl transition-all ${type === TransactionType.INCOME ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  수입
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">금액 입력</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-900 font-black text-3xl">₩</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-14 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 text-4xl font-black text-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">카테고리 선택</label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
                    const isSelected = category === cat;
                    const catInfo = CATEGORIES[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                      >
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${catInfo.color}`}>
                           {React.cloneElement(catInfo.icon as React.ReactElement<any>, { size: 20 })}
                        </div>
                        <span className={`text-[15px] font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">날짜</label>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full flex items-center gap-4 px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-indigo-200 transition-all"
                >
                  <CalendarIcon className="text-indigo-500" size={22} />
                  <span className="text-lg font-bold text-slate-900">{date}</span>
                </button>

                {showDatePicker && (
                  <div className="mt-2 bg-white rounded-2xl border-2 border-slate-100 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-black text-slate-800 text-base">{year}년 {month + 1}월</h4>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setViewDate(new Date(year, month - 1))} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronLeft size={20}/></button>
                        <button type="button" onClick={() => setViewDate(new Date(year, month + 1))} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronRight size={20}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-300 uppercase mb-4 tracking-tighter">
                      {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isSelected = date === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleDateSelect(day)}
                            className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                              isSelected ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">내용 설명</label>
                <input 
                  type="text" 
                  placeholder="예: 점심 식사, 스타벅스" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-lg text-slate-900" 
                />
              </div>
            </form>

            {/* Fixed Bottom Button Area */}
            <div className="flex-shrink-0 px-8 pt-4 pb-8 bg-white border-t border-slate-50 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSyncing}
                    className={`w-full py-5 rounded-2xl text-white text-lg font-black shadow-lg transition-all active:scale-95 ${isSyncing ? 'bg-slate-300' : type === TransactionType.EXPENSE ? 'bg-rose-500 shadow-rose-100' : 'bg-emerald-500 shadow-emerald-100'}`}
                >
                    {isSyncing ? '저장 중...' : editingTransaction ? '내역 업데이트' : '저장하기'}
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionForm;

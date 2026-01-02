
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Transaction, TransactionType } from '../types';

interface ChartsProps {
  transactions: Transaction[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

const Charts: React.FC<ChartsProps> = ({ transactions, selectedCategory, onCategorySelect }) => {
  // 지출 데이터 가공
  const expenseData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  // 월별 흐름 데이터 가공 (최근 6개월)
  const monthlyData = transactions.reduce((acc: any[], curr) => {
    const month = curr.date.substring(0, 7); // YYYY-MM
    const existing = acc.find(item => item.month === month);
    if (existing) {
      if (curr.type === TransactionType.INCOME) existing.income += curr.amount;
      else existing.expense += curr.amount;
    } else {
      acc.push({ 
        month, 
        income: curr.type === TransactionType.INCOME ? curr.amount : 0, 
        expense: curr.type === TransactionType.EXPENSE ? curr.amount : 0 
      });
    }
    return acc;
  }, [])
  .sort((a, b) => a.month.localeCompare(b.month))
  .slice(-6);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].name || payload[0].payload.month}</p>
          <p className="text-sm font-black text-slate-900">₩{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const handlePieClick = (data: any) => {
    if (selectedCategory === data.name) {
      onCategorySelect(null);
    } else {
      onCategorySelect(data.name);
    }
  };

  const handleLegendClick = (data: any) => {
    const category = data.value;
    if (selectedCategory === category) {
      onCategorySelect(null);
    } else {
      onCategorySelect(category);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 카테고리별 지출 */}
      <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col h-[420px]">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Category Distribution</h3>
          {selectedCategory && (
            <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded-md animate-pulse">
              {selectedCategory} 필터링 중
            </span>
          )}
        </div>
        {expenseData.length > 0 ? (
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  onClick={handlePieClick}
                  style={{ cursor: 'pointer' }}
                >
                  {expenseData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      opacity={selectedCategory === null || selectedCategory === entry.name ? 1 : 0.3}
                      className="transition-all duration-300"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  onClick={handleLegendClick}
                  wrapperStyle={{ paddingTop: '30px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-300 italic font-bold">지출 내역이 없습니다</div>
        )}
      </div>

      {/* 월별 흐름 */}
      <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col h-[420px]">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Cash Flow Trend</h3>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(v) => `${(v/10000).toFixed(0)}만`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: '30px', fontSize: '11px', fontWeight: 'bold' }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="수입" barSize={20} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} name="지출" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;

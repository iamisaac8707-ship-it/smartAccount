
export enum TransactionType {
  INCOME = '수입',
  EXPENSE = '지출'
}

export type Category = 
  | '식비' | '교통' | '쇼핑' | '문화/여가' 
  | '의료/건강' | '주거/통신' | '생활용품' | '급여' 
  | '투자' | '기타';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
}

export enum AssetType {
  STOCK = '주식',
  CRYPTO = '가상화폐',
  BOND = '채권',
  SAVINGS = '예적금',
  CAR = '자동차',
  REAL_ESTATE = '부동산',
  COMMODITY = '금/현물',
  CASH = '현금/기타',
  LOAN = '대출/부채'
}

export interface AssetHistory {
  date: string;
  value: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  purchaseAmount: number;
  currentValue: number;
  history: AssetHistory[];
  lastUpdated: string;
  createdAt: string; 
  deletedAt: string | null;
  ticker?: string;    
  quantity?: number;  
  unitPrice?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface SpendingInsight {
  id: string;
  date: string;
  analysis: string;
  suggestions: string[];
  tips: string;
  categoryBreakdown?: string; 
  savingGoalAdvice?: string; 
  assetAnalysis?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

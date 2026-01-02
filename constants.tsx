
import React from 'react';
import { 
  Utensils, Car, ShoppingBag, Film, 
  HeartPulse, Home, Zap, DollarSign, 
  TrendingUp, HelpCircle 
} from 'lucide-react';
import { Category } from './types';

export const CATEGORIES: Record<Category, { icon: React.ReactNode, color: string }> = {
  '식비': { icon: <Utensils className="w-4 h-4" />, color: 'bg-orange-100 text-orange-600' },
  '교통': { icon: <Car className="w-4 h-4" />, color: 'bg-blue-100 text-blue-600' },
  '쇼핑': { icon: <ShoppingBag className="w-4 h-4" />, color: 'bg-pink-100 text-pink-600' },
  '문화/여가': { icon: <Film className="w-4 h-4" />, color: 'bg-purple-100 text-purple-600' },
  '의료/건강': { icon: <HeartPulse className="w-4 h-4" />, color: 'bg-red-100 text-red-600' },
  '주거/통신': { icon: <Home className="w-4 h-4" />, color: 'bg-amber-100 text-amber-600' },
  '생활용품': { icon: <Zap className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-600' },
  '급여': { icon: <DollarSign className="w-4 h-4" />, color: 'bg-green-100 text-green-600' },
  '투자': { icon: <TrendingUp className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-600' },
  '기타': { icon: <HelpCircle className="w-4 h-4" />, color: 'bg-gray-100 text-gray-600' },
};

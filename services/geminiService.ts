
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Transaction, SpendingInsight, Asset, AssetType, TransactionType } from "../types";

const getFinancialContext = (transactions: Transaction[], assets: Asset[]) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // UI 필터링 로직과 동일하게: 오늘 시점에 존재하고 삭제되지 않은 자산만 포함
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

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const monthIncome = currentMonthTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);
  const monthExpense = currentMonthTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const assetSummary = activeAssets.map(a => ({
    name: a.name,
    type: a.type,
    currentValue: a.currentValue,
    purchaseAmount: a.purchaseAmount,
    pnl: a.currentValue - a.purchaseAmount
  }));

  return {
    totalAssetsValue,
    totalLoansValue,
    netWorth,
    monthIncome,
    monthExpense,
    assetSummary,
    recentTransactions: currentMonthTransactions.slice(0, 20)
  };
};

export const startFinancialChat = (transactions: Transaction[], assets: Asset[]): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = getFinancialContext(transactions, assets);

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `
        당신은 사용자의 전담 수석 재무 설계사 '클라우드 AI'입니다. 
        사용자의 모든 재무 데이터는 시스템에서 정확히 합산되어 제공됩니다. 
        절대로 숫자를 스스로 재계산하거나 의심하지 마세요. 특히 순자산 ${context.netWorth}원은 가장 정확한 팩트입니다.

        [시스템 확정 재무 팩트]
        - 총 자산: ₩${context.totalAssetsValue.toLocaleString()}
        - 총 부채: ₩${context.totalLoansValue.toLocaleString()}
        - 순자산(가장 중요): ₩${context.netWorth.toLocaleString()}
        - 이번 달 수입: ₩${context.monthIncome.toLocaleString()}
        - 이번 달 지출: ₩${context.monthExpense.toLocaleString()}

        [보유 자산 목록]
        ${JSON.stringify(context.assetSummary)}

        당신은 이 데이터를 바탕으로만 상담해야 합니다. 
        대화 시 항상 존댓말을 사용하고, 전문적이면서도 친절하게 대응하세요.
        사용자가 자산 구성이나 지출에 대해 물어보면 위 데이터를 근거로 답변하세요.
      `,
    },
  });
};

export const getQuickFinancialTip = async (transactions: Transaction[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const recentTransactions = transactions.slice(0, 10);
  const prompt = `가계부 데이터: ${JSON.stringify(recentTransactions)}. 20자 내외로 짧고 친절한 재무 조언 한마디 해줘. 이모지 포함.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "계획적인 소비로 부자 되세요! 💰";
  } catch (e) {
    return "티끌 모아 태산입니다! 🌱";
  }
};

export const getDetailedFinancialInsights = async (transactions: Transaction[], assets: Asset[] = []): Promise<SpendingInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = getFinancialContext(transactions, assets);

  const prompt = `
    다음은 시스템에서 100% 정확하게 계산된 팩트입니다. 이를 바탕으로 정밀 리포트를 작성하세요.
    순자산: ₩${context.netWorth.toLocaleString()}
    총자산: ₩${context.totalAssetsValue.toLocaleString()}
    총부채: ₩${context.totalLoansValue.toLocaleString()}
    수입: ₩${context.monthIncome.toLocaleString()}
    지출: ₩${context.monthExpense.toLocaleString()}
    
    데이터 변경이나 재계산은 절대 금지합니다. 제공된 숫자 그대로 분석만 수행하세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: '지출 및 수지 분석' },
            assetAnalysis: { type: Type.STRING, description: '순자산 및 자산 포트폴리오 분석' },
            categoryBreakdown: { type: Type.STRING, description: '주요 소비 카테고리 진단' },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: '4가지 구체적 제언' },
            savingGoalAdvice: { type: Type.STRING, description: '장기 저축 목표 조언' },
            tips: { type: Type.STRING, description: '리스크 관리 팁' }
          },
          required: ['analysis', 'assetAnalysis', 'categoryBreakdown', 'suggestions', 'savingGoalAdvice', 'tips']
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...data
    };
  } catch (e) {
    console.error(e);
    return {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      analysis: "분석 중 오류가 발생했습니다.",
      suggestions: ["데이터를 다시 확인해주세요."],
      tips: "정확한 입력을 부탁드립니다.",
      assetAnalysis: "순자산 분석에 실패했습니다."
    };
  }
};

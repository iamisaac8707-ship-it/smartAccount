
import { GoogleGenAI } from "@google/genai";

export interface MarketPriceInfo {
  price: number;
  currency: string;
  name: string;
  ticker: string;
}

export const fetchMarketPrice = async (query: string): Promise<MarketPriceInfo | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    다음 종목의 가장 최신 실시간 시장 가격(현재가)을 알려주세요: "${query}"
    반드시 다음 JSON 형식으로만 응답하세요. 숫자에 콤마를 넣지 마세요. 
    한국 종목이면 KRW 기준, 해외 종목이면 현재 환율을 적용한 KRW 환산가로 계산해서 알려주세요.
    {
      "price": 0,
      "currency": "KRW",
      "name": "종목 정식 명칭",
      "ticker": "티커 또는 종목코드"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      },
    });

    const data = JSON.parse(response.text || '{}');
    if (data.price && data.price > 0) {
      return {
        price: Math.round(data.price),
        currency: data.currency || "KRW",
        name: data.name,
        ticker: data.ticker
      };
    }
    return null;
  } catch (e) {
    console.error("실시간 가격 조회 실패:", e);
    return null;
  }
};


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
    Find the latest market price for: "${query}".
    Return ONLY a JSON object: {"price": number, "currency": "KRW", "name": "official_name", "ticker": "ticker_symbol"}.
    Convert to KRW if needed. No markdown.
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

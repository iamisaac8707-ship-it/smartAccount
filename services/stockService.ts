
import { CloudService } from './cloudService';

export interface MarketPriceInfo {
  price: number;
  currency: string;
  name: string;
  ticker: string;
}

export const fetchMarketPrice = async (query: string): Promise<MarketPriceInfo | null> => {
  try {
    const serverUrl = CloudService.getServerUrl();
    const response = await fetch(`${serverUrl}/api/stock/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    // 환율 계산이 필요하다면 여기서 처리하거나 백엔드에서 처리해야 하지만,
    // 일단은 원화(KRW)가 아니면 표시만 해주는 식으로 처리 (간단화)
    // 실제로는 Yahoo Finance가 해당 통화로 값을 줌.
    // 한국 사용자를 위해 USD인 경우 대략적인 환율(예: 1400원) 적용 가능하나
    // 정확성을 위해 일단 그대로 반환하거나, 백엔드에서 변환 로직 추가 가능.
    // 여기서는 원화로 변환하는 간단한 로직 추가 (USD -> KRW 1400 가정)
    
    let price = data.price;
    if (data.currency === 'USD') {
        price = price * 1450; // 임시 고정 환율
    }

    return {
      price: Math.round(price),
      currency: 'KRW', // 편의상 변환 후 KRW로 표기
      name: data.name,
      ticker: data.ticker
    };
  } catch (e) {
    console.error("실시간 가격 조회 실패:", e);
    return null;
  }
};

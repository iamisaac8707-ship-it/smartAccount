
import { Transaction, Asset, SpendingInsight, User } from "../types";

// IP 주소 앞에 https:// 가 정확히 붙어있는지 확인하세요.
const INTERNAL_GCP_SERVER_URL = "https://136.116.156.15:8000"; 

export const CloudService = {
  getServerUrl: () => {
    return INTERNAL_GCP_SERVER_URL.endsWith('/') 
      ? INTERNAL_GCP_SERVER_URL.slice(0, -1) 
      : INTERNAL_GCP_SERVER_URL;
  },

  isLocalUser: (userId: string) => userId === 'local_user',

  // 서버 연결 상태를 더 확실하게 체크 (타임아웃 연장)
  testConnection: async (): Promise<boolean> => {
    const serverUrl = CloudService.getServerUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초로 연장
      
      const response = await fetch(`${serverUrl}/`, { 
        method: 'GET', 
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      return response.ok || response.status === 200;
    } catch (err) {
      console.error("DEBUG - Connection test failed:", err);
      return false;
    }
  },

  request: async (endpoint: string, options: RequestInit) => {
    const serverUrl = CloudService.getServerUrl();
    try {
      const response = await fetch(`${serverUrl}${endpoint}`, {
        ...options,
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `서버 오류 (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      return response;
    } catch (error: any) {
      console.error("DEBUG - Request failed:", error);
      // 브라우저가 SSL 인증서 문제로 차단할 때 발생하는 전형적인 TypeError 처리
      if (error.name === 'TypeError') {
        throw new Error("보안 승인이 필요합니다. [문제 해결하기] 버튼을 눌러 승인해주세요.");
      }
      throw error;
    }
  },

  registerUser: async (username: string, password: string, name: string): Promise<void> => {
    await CloudService.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password, name })
    });
  },

  loginUser: async (username: string, password: string): Promise<User> => {
    const response = await CloudService.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    return { id: result.id, email: result.email, name: result.name };
  },

  fetchData: async (userId: string): Promise<{transactions: Transaction[], assets: Asset[], insights: SpendingInsight[]}> => {
    if (CloudService.isLocalUser(userId)) {
      const localData = localStorage.getItem('local_ledger_data');
      return localData ? JSON.parse(localData) : { transactions: [], assets: [], insights: [] };
    }
    const response = await CloudService.request(`/api/data?userId=${userId}`, { method: 'GET' });
    const result = await response.json();
    return { transactions: result.transactions || [], assets: result.assets || [], insights: result.insights || [] };
  },

  saveData: async (userId: string, transactions: Transaction[], assets: Asset[], insights: SpendingInsight[] = []): Promise<void> => {
    const data = { transactions, assets, insights, lastUpdated: new Date().toISOString() };
    if (CloudService.isLocalUser(userId)) {
      localStorage.setItem('local_ledger_data', JSON.stringify(data));
      return;
    }
    await CloudService.request('/api/data', {
      method: 'POST',
      body: JSON.stringify({ userId, ...data })
    });
  }
};

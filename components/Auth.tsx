import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, AlertCircle, RefreshCw, User as UserIcon, ArrowRight, Mail, Key, UserPlus, Server, RotateCcw, Activity, Globe, X, Terminal, ShieldAlert, ExternalLink, Shield, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { CloudService } from '../services/cloudService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLogin, setIsAutoLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const serverUrl = CloudService.getServerUrl();

  useEffect(() => {
    const rawUser = localStorage.getItem('auth_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      onLogin(user);
    } else {
      setIsAutoLogin(false);
      checkServer();
    }
  }, []);

  const checkServer = async () => {
    setServerStatus('checking');
    const isOnline = await CloudService.testConnection();
    setServerStatus(isOnline ? 'online' : 'offline');
    if (!isOnline) {
      setError("보안 서버에 연결할 수 없습니다. 승인이 필요할 수 있습니다.");
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!username || !password || !name) throw new Error("모든 필드를 입력해주세요.");
        await CloudService.registerUser(username, password, name);
        setMode('login');
        alert("회원가입 성공! 이제 로그인 해주세요.");
      } else {
        const user = await CloudService.loginUser(username, password);
        localStorage.setItem('auth_user', JSON.stringify(user));
        onLogin(user);
      }
    } catch (err: any) {
      console.error("Submit Error:", err);
      setError(err.message);
      if (err.message.includes("승인") || err.message.includes("TypeError")) {
        setShowGuide(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullReload = () => {
    window.location.reload();
  };

  if (isAutoLogin) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
        <div className="relative mb-10">
          <div className="w-24 h-24 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Server size={32} className="text-indigo-600 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight italic uppercase">Connecting Node</h2>
        <p className="text-lg font-bold text-slate-400">보안 서버에 접속 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Pretendard']">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl mb-6 transform rotate-3">
            <Server size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic mb-2">PRIVATE LEDGER</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Encrypted Cloud Sync</p>
        </div>

        <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-10 border border-slate-100 relative">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${
              serverStatus === 'online' ? 'bg-emerald-50 text-emerald-600' : 
              serverStatus === 'checking' ? 'bg-slate-100 text-slate-400' : 'bg-rose-50 text-rose-600'
            }`}>
               {serverStatus === 'online' ? <ShieldCheck size={12} /> : serverStatus === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
               {serverStatus === 'online' ? 'HTTPS NODE ONLINE' : serverStatus === 'checking' ? 'CHECKING NODE...' : 'NODE CONNECTION FAILED'}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight italic">
              {mode === 'login' ? 'Authentication' : 'New Account'}
            </h2>
            <p className="text-[10px] font-bold text-slate-300">Target: {serverUrl}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">사용자 이름</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름 입력"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-slate-900 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">아이디</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ID 입력"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-slate-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">비밀번호</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-slate-900 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex flex-col gap-3 p-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 text-indigo-900 animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={20} className="text-indigo-600 shrink-0 mt-0.5" /> 
                  <div>
                    <p className="text-xs font-black italic uppercase tracking-tighter">Connection Error</p>
                    <p className="text-[10px] opacity-70 mt-1 leading-relaxed font-bold">{error}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    type="button"
                    onClick={() => setShowGuide(true)}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 font-black text-[10px] shadow-lg shadow-indigo-200"
                  >
                    <Activity size={14} /> 문제 해결하기 (진단)
                  </button>
                  <button 
                    type="button"
                    onClick={checkServer}
                    className="px-4 py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl font-black text-[10px]"
                  >
                    <RotateCcw size={14} /> 다시 시도
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || serverStatus === 'offline'}
              className={`w-full py-5 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-30 ${
                mode === 'login' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : (mode === 'login' ? '로그인' : '회원가입')}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="text-sm font-bold text-indigo-600 hover:underline underline-offset-4 flex items-center justify-center gap-2 mx-auto"
            >
              {mode === 'login' ? <UserPlus size={16} /> : <Lock size={16} />}
              {mode === 'login' ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            </button>
          </div>
        </div>

        {/* 보안 승인 가이드 모달 */}
        {showGuide && (
          <div className="fixed inset-0 z-[2000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 my-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 italic flex items-center gap-2">
                  <Shield className="text-indigo-600" /> 서버 연결 해결 가이드
                </h3>
                <button onClick={() => setShowGuide(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                  <div className="flex gap-2 mb-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <p className="text-emerald-900 text-xs font-black uppercase tracking-tight">Status: Ready</p>
                  </div>
                  <p className="text-emerald-800 text-[11px] font-bold">
                    사용자님의 서버는 현재 정상 작동 중입니다! 단지 브라우저가 이 탭에서도 통신을 허용하도록 <b>[새로고침]</b>이 한 번 필요합니다.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">1</div>
                    <div className="flex-1">
                      <p className="text-slate-800 font-black text-sm">서버 창 확인</p>
                      <p className="text-slate-500 text-[11px] leading-relaxed">이미 열려있는 서버 페이지에서 <b>"✅ 서버 연결 성공!"</b>이 보이는지 확인하세요.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">2</div>
                    <div>
                      <p className="text-slate-800 font-black text-sm">이 탭에서 새로고침 실행</p>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        아래의 <b>[강제 새로고침]</b> 버튼을 누르거나, 브라우저 상단의 새로고침 아이콘을 눌러주세요.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={handleFullReload}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <RefreshCw size={20} /> 앱 강제 새로고침 (필수)
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-4 font-bold">새로고침 후에는 에러 없이 로그인이 가능합니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
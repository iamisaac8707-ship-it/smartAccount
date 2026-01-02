
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#e11d48', fontFamily: 'sans-serif', backgroundColor: '#fff1f2', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>⚠️ 런타임 에러 발생</h1>
          <pre style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            overflow: 'auto', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#334155'
          }}>
            {this.state.error?.toString()}
            <br />
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '30px', 
              padding: '12px 24px', 
              backgroundColor: '#e11d48', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

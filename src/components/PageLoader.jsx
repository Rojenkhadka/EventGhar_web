import React from 'react';

const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f7fb',
    gap: 16,
  }}>
    <div style={{ position: 'relative', width: 48, height: 48 }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        border: '3px solid #e9d5ff',
        borderTopColor: '#7c3aed',
        animation: 'pageloader-spin 0.7s linear infinite',
      }} />
    </div>
    <span style={{
      fontSize: 14,
      fontWeight: 600,
      color: '#94a3b8',
      letterSpacing: '0.3px',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      Loading…
    </span>
    <style>{`
      @keyframes pageloader-spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default PageLoader;

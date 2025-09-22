'use client';

import { Trophy } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Se încarcă...' }: LoadingSpinnerProps) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '400px', 
      gap: '16px',
      padding: '20px'
    }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid #e5e7eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid var(--superbet-red)',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          position: 'absolute',
          top: 0,
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Trophy style={{ width: '24px', height: '24px', color: 'var(--superbet-red)' }} />
        </div>
      </div>
      <p style={{ 
        color: '#1a1a1a', 
        fontWeight: 500,
        fontSize: '16px',
        textAlign: 'center',
        margin: 0
      }}>
        {message}
      </p>
    </div>
  );
}

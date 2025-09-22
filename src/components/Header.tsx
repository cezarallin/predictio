'use client';

import { Trophy, LogOut } from 'lucide-react';

interface HeaderProps {
  currentUser: {id: number, name: string} | null;
  onLogout: () => void;
}

export default function Header({ currentUser, onLogout }: HeaderProps) {
  return (
    <header style={{ 
      background: '#ffffff', 
      borderBottom: '1px solid #e5e7eb', 
      position: 'sticky', 
      top: 0, 
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '16px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--superbet-red)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
          }}>
            <Trophy style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1a1a1a',
              margin: 0 
            }}>
              Predictio
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--superbet-gray)', 
              margin: 0
            }} className="hidden-mobile">
              Joc de Predicții Fotbal
            </p>
          </div>
        </div>
        
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>Bun venit</div>
              <div style={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                fontSize: '14px'
              }}>
                {currentUser.name}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="superbet-outline-button"
              title="Ieșire"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              <span className="hidden-mobile-text">Ieșire</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

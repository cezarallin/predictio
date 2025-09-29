'use client';

import { Trophy, LogOut, BarChart3, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  currentUser: {id: number, name: string} | null;
  onLogout: () => void;
}

export default function Header({ currentUser, onLogout }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header style={{ 
      background: 'var(--superbet-card-bg)', 
      borderBottom: '1px solid var(--superbet-border)', 
      position: 'sticky', 
      top: 0, 
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      <div className="header-container" style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '16px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="header-logo" style={{
            width: '40px',
            height: '40px',
            background: 'var(--superbet-red)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
          }}>
            <Trophy className="header-logo-icon" style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div>
            <h1 className="header-title" style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: 'var(--superbet-text)',
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
        
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="superbet-outline-button header-theme-btn"
            title={theme === 'dark' ? 'Temă luminoasă' : 'Temă întunecată'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px'
            }}
          >
            {theme === 'dark' ? 
              <Sun className="header-icon" style={{ width: '16px', height: '16px' }} /> : 
              <Moon className="header-icon" style={{ width: '16px', height: '16px' }} />
            }
          </button>
          
          {currentUser && (
            <>
              <div className="header-user-info" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>Bun venit</div>
                <div style={{ 
                  fontWeight: 600, 
                  color: 'var(--superbet-text)', 
                  fontSize: '14px'
                }}>
                  {currentUser.name}
                </div>
              </div>
              <div className="header-buttons" style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => window.location.href = '/stats'}
                  className="superbet-button header-nav-btn"
                  title="Statistici și Istoric"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <BarChart3 className="header-icon" style={{ width: '16px', height: '16px' }} />
                  <span className="hidden-mobile-text">Stats</span>
                </button>
                <button
                  onClick={onLogout}
                  className="superbet-outline-button header-nav-btn"
                  title="Ieșire"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <LogOut className="header-icon" style={{ width: '16px', height: '16px' }} />
                  <span className="hidden-mobile-text">Ieșire</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .header-logo {
            width: 36px !important;
            height: 36px !important;
            border-radius: 10px !important;
          }
          
          .header-logo-icon {
            width: 18px !important;
            height: 18px !important;
          }
          
          .header-title {
            font-size: 20px !important;
          }
          
          .header-actions {
            gap: 12px !important;
          }
          
          .header-buttons {
            gap: 8px !important;
          }
          
          .header-nav-btn {
            padding: 8px !important;
            min-width: 36px !important;
            min-height: 36px !important;
          }
          
          .header-theme-btn {
            padding: 8px !important;
            min-width: 36px !important;
            min-height: 36px !important;
          }
          
          .header-icon {
            width: 16px !important;
            height: 16px !important;
          }
          
          .header-user-info div:first-child {
            font-size: 10px !important;
          }
          
          .header-user-info div:last-child {
            font-size: 12px !important;
          }
        }
        
        @media (max-width: 480px) {
          .header-container {
            padding: 12px 16px !important;
          }
          
          .header-logo {
            width: 32px !important;
            height: 32px !important;
          }
          
          .header-logo-icon {
            width: 16px !important;
            height: 16px !important;
          }
          
          .header-title {
            font-size: 18px !important;
          }
          
          .header-actions {
            gap: 8px !important;
          }
          
          .header-buttons {
            gap: 6px !important;
          }
          
          .header-nav-btn {
            padding: 6px !important;
            min-width: 32px !important;
            min-height: 32px !important;
          }
          
          .header-theme-btn {
            padding: 6px !important;
            min-width: 32px !important;
            min-height: 32px !important;
          }
          
          .header-icon {
            width: 14px !important;
            height: 14px !important;
          }
        }
      `}</style>
    </header>
  );
}

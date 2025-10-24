'use client';

import { Wallet, User, Swords, BarChart3, Trophy } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface BottomNavProps {
  pendingChallengesCount?: number;
}

export default function BottomNav({ pendingChallengesCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const navItems = [
    { id: 'predictions', icon: Trophy, label: 'Predicții', path: '/' },
    { id: 'bank', icon: Wallet, label: 'Bancă', path: '/bank' },
    { id: 'profile', icon: User, label: 'Profil', path: '/profile' },
    { id: 'h2h', icon: Swords, label: 'H2H', path: '/' },
    { id: 'stats', icon: BarChart3, label: 'Statistici', path: '/stats' },
  ];
  
  const handleNavigate = (path: string, id: string) => {
    if (id === 'h2h') {
      const event = new CustomEvent('openH2H');
      window.dispatchEvent(event);
    } else if (id === 'predictions') {
      router.push('/');
    } else {
      router.push(path);
    }
  };

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--superbet-card-bg)',
      borderTop: '1px solid var(--superbet-border)',
      boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
      zIndex: 50,
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = (item.id === 'predictions' && pathname === '/') || 
                          (item.id !== 'predictions' && item.id !== 'h2h' && pathname === item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path, item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 8px 10px',
                gap: '4px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
                color: isActive ? 'var(--superbet-red)' : 'var(--superbet-gray)',
              }}
              className="bottom-nav-item"
            >
              <div style={{ position: 'relative' }}>
                <Icon
                  style={{
                    width: '24px',
                    height: '24px',
                    transition: 'transform 0.2s ease'
                  }}
                />
                {item.id === 'h2h' && pendingChallengesCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    background: 'var(--superbet-red)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    border: '2px solid var(--superbet-card-bg)',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)',
                    animation: 'pulse-badge 2s ease-in-out infinite'
                  }}>
                    {pendingChallengesCount}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s ease'
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '3px',
                  background: 'var(--superbet-red)',
                  borderRadius: '0 0 3px 3px'
                }} />
              )}
            </button>
          );
        })}
      </div>
      
      <style jsx global>{`
        .bottom-nav-item:hover {
          background: var(--superbet-hover) !important;
        }
        
        .bottom-nav-item:active {
          transform: scale(0.95);
        }
        
        @keyframes pulse-badge {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        
        @media (max-width: 480px) {
          .bottom-nav-item span {
            font-size: 10px !important;
          }
          
          .bottom-nav-item svg {
            width: 22px !important;
            height: 22px !important;
          }
        }
      `}</style>
    </nav>
  );
}


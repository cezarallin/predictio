'use client';

import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Trophy, RotateCcw } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import H2HManager from '@/components/H2HManager';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface BankEntry {
  id: number;
  user_id: number;
  user_name: string;
  entry_type: string;
  amount: number;
  gameweek: string | null;
  notes: string | null;
  created_at: string;
}

interface UserBalance {
  userId: number;
  userName: string;
  moneyIn: number;
  moneyOut: number;
  balance: number;
  isAdmin: boolean;
}

export default function BankPage() {
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; is_admin?: boolean } | null>(null);
  const [entries, setEntries] = useState<BankEntry[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showH2HManager, setShowH2HManager] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    fetchBankData();
  }, []);

  useEffect(() => {
    const handleOpenH2HEvent = () => {
      setShowH2HManager(true);
    };

    window.addEventListener('openH2H', handleOpenH2HEvent);
    return () => window.removeEventListener('openH2H', handleOpenH2HEvent);
  }, []);

  const fetchBankData = async () => {
    try {
      const response = await fetch('/api/bank');
      const data = await response.json();
      setEntries(data.entries);
      // Filter out admins from userBalances
      const nonAdminBalances = data.userBalances.filter((user: UserBalance) => !user.isAdmin);
      setUserBalances(nonAdminBalances.sort((a: UserBalance, b: UserBalance) => b.balance - a.balance));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching bank data:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('predictio_user');
    window.location.href = '/';
  };

  const handleResetBank = async () => {
    if (!confirm('⚠️ Ești sigur că vrei să resetezi banca complet? Toate tranzacțiile vor fi șterse! Această acțiune NU poate fi anulată!')) {
      return;
    }

    try {
      const response = await fetch('/api/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_all' })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        fetchBankData();
      } else {
        alert('❌ Eroare la resetarea băncii');
      }
    } catch (error) {
      console.error('Error resetting bank:', error);
      alert('❌ Eroare la resetarea băncii');
    }
  };

  const handleCloseH2H = () => {
    setShowH2HManager(false);
  };

  const totalPool = userBalances.reduce((sum, u) => sum + u.moneyOut, 0);

  if (isLoading) {
    return (
      <ThemeProvider>
        <div style={{ 
          minHeight: '100vh', 
          background: 'var(--superbet-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>Se încarcă...</div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--superbet-bg)',
        paddingBottom: '80px'
      }}>
        <Header currentUser={currentUser} onLogout={handleLogout} />
        
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '24px 20px' 
        }}>
          <div style={{ 
            marginBottom: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: currentUser?.is_admin ? 'space-between' : 'flex-start'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Wallet style={{ width: '32px', height: '32px', color: 'var(--superbet-red)' }} />
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: 'var(--superbet-text)',
                margin: 0 
              }}>
                Bancă
              </h1>
            </div>
            
            {currentUser?.is_admin && (
              <button
                onClick={handleResetBank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <RotateCcw style={{ width: '16px', height: '16px' }} />
                <span>Reset Bancă</span>
              </button>
            )}
          </div>

          {totalPool > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
              color: '#1f2937'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Trophy style={{ width: '32px', height: '32px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  Pool Total
                </h2>
              </div>
              <div style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '8px' }}>
                {totalPool} RON
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {userBalances.filter(u => u.moneyOut > 0).length} jucători participă în această lună
              </div>
            </div>
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '32px'
          }}
          className="bank-grid"
          >
            {userBalances.map((user) => (
              <div
                key={user.userId}
                className="bank-card"
                style={{
                  background: 'var(--superbet-card-bg)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid var(--superbet-border)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  position: 'relative'
                }}
              >
                <div 
                  className="bank-card-title"
                  style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: 'var(--superbet-text)',
                    marginBottom: '16px'
                  }}>
                  {user.userName}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="bank-card-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                      <TrendingUp style={{ width: '16px', height: '16px' }} />
                      <span style={{ fontSize: '14px' }}>Câștiguri</span>
                    </div>
                    <span className="bank-card-amount" style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                      {user.moneyIn} RON
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="bank-card-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                      <TrendingDown style={{ width: '16px', height: '16px' }} />
                      <span style={{ fontSize: '14px' }}>Pariuri<span className="hide-on-mobile"> Plasate</span></span>
                    </div>
                    <span className="bank-card-amount" style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
                      {user.moneyOut} RON
                    </span>
                  </div>
                  
                  <div style={{
                    borderTop: '1px solid var(--superbet-border)',
                    paddingTop: '12px',
                    marginTop: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="bank-card-label" style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>Balanță</span>
                      <span 
                        className="bank-card-balance"
                        style={{ 
                          fontSize: '20px', 
                          fontWeight: 'bold', 
                          color: user.balance >= 0 ? '#10b981' : '#ef4444'
                        }}>
                        {user.balance > 0 ? '+' : ''}{user.balance} RON
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {userBalances.length === 0 && (
            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '12px',
              padding: '48px 24px',
              border: '1px solid var(--superbet-border)',
              textAlign: 'center',
              color: 'var(--superbet-gray)'
            }}>
              <Wallet style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                Niciun jucător nu joacă cu miza momentan
              </div>
              <div style={{ fontSize: '14px' }}>
                Selectează &quot;Miza&quot; după predicții pentru a participa
              </div>
            </div>
          )}

          {entries.length > 0 && (
            <div style={{
              background: 'var(--superbet-card-bg)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--superbet-border)'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: 'var(--superbet-text)',
                marginBottom: '20px'
              }}>
                Istoric Tranzacții
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'var(--superbet-bg)',
                      borderRadius: '8px',
                      border: '1px solid var(--superbet-border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: entry.entry_type === 'in' ? '#10b981' : '#ef4444'
                      }} />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--superbet-text)' }}>
                          {entry.user_name}
                        </div>
                        {entry.notes && (
                          <div style={{ fontSize: '12px', color: 'var(--superbet-gray)' }}>
                            {entry.notes}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: 'var(--superbet-gray)', marginTop: '4px' }}>
                          {new Date(entry.created_at).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: entry.entry_type === 'in' ? '#10b981' : '#ef4444'
                    }}>
                      {entry.entry_type === 'in' ? '+' : '-'}{entry.amount} RON
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <BottomNav />

        {showH2HManager && currentUser && (
          <H2HManager 
            currentUser={currentUser}
            isOpen={showH2HManager}
            onClose={handleCloseH2H}
          />
        )}
      </div>
    </ThemeProvider>
  );
}


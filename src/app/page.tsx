'use client';

import { useState, useEffect } from 'react';
import PredictionTable from '@/components/PredictionTable';
import LoginForm from '@/components/LoginForm';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import H2HManager from '@/components/H2HManager';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null);
  const [showH2HManager, setShowH2HManager] = useState(false);
  const [pendingChallengesCount, setPendingChallengesCount] = useState(0);

  const fetchPendingChallengesCount = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/h2h?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const challenges = data.challenges || [];
        const pendingForUser = challenges.filter((challenge: any) => 
          challenge.status === 'pending' && challenge.challenged_id === currentUser.id
        );
        setPendingChallengesCount(pendingForUser.length);
      }
    } catch (error) {
      console.error('Error fetching pending challenges count:', error);
      setPendingChallengesCount(0);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('predictio_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch {
        localStorage.removeItem('predictio_user');
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchPendingChallengesCount();
      const interval = setInterval(fetchPendingChallengesCount, 30000);
      return () => clearInterval(interval);
    } else {
      setPendingChallengesCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openH2H') === 'true') {
        setShowH2HManager(true);
        window.history.replaceState({}, '', '/');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const handleOpenH2HEvent = () => {
      setShowH2HManager(true);
      fetchPendingChallengesCount();
    };

    window.addEventListener('openH2H', handleOpenH2HEvent);
    return () => window.removeEventListener('openH2H', handleOpenH2HEvent);
  }, []);

  const handleLogin = (user: {id: number, name: string}) => {
    setCurrentUser(user);
    localStorage.setItem('predictio_user', JSON.stringify(user));
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('predictio_user');
    localStorage.removeItem('currentUser');
  };

  const handleCloseH2H = () => {
    setShowH2HManager(false);
    fetchPendingChallengesCount();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--superbet-bg)', paddingBottom: currentUser ? '70px' : '0' }}>
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout}
      />
      
      <main style={{ padding: '20px', background: 'var(--superbet-light-gray)', minHeight: currentUser ? 'calc(100vh - 140px)' : 'calc(100vh - 70px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {!currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <LoginForm onLogin={handleLogin} />
            </div>
          ) : (
            <>
              {/* Gameweek Badge */}
              <div style={{
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '24px' }}>🏆</span>
                  <span>GAMEWEEK 12</span>
                </div>
              </div>
              <PredictionTable currentUser={currentUser} />
            </>
          )}
        </div>
      </main>
      
      {!currentUser && (
        <footer style={{ background: 'var(--superbet-card-bg)', borderTop: '1px solid var(--superbet-border)', padding: '20px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: 'var(--superbet-red)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>P</span>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--superbet-text)' }}>
                    Predictio
                  </div>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>
                  🏆 Joc de Predicții Fotbal cu Prietenii
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}

      {currentUser && <BottomNav pendingChallengesCount={pendingChallengesCount} />}
      
      {showH2HManager && currentUser && (
        <H2HManager 
          currentUser={currentUser}
          isOpen={showH2HManager}
          onClose={handleCloseH2H}
        />
      )}
    </div>
  );
}

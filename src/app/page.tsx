'use client';

import { useState, useEffect } from 'react';
import PredictionTable from '@/components/PredictionTable';
import LoginForm from '@/components/LoginForm';
import Header from '@/components/Header';
// import WelcomeModal from '@/components/WelcomeModal'; // HIDDEN - not shown for now
import H2HManager from '@/components/H2HManager';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null);
  // const [showWelcomeModal, setShowWelcomeModal] = useState(false); // HIDDEN - not shown for now
  const [showH2HManager, setShowH2HManager] = useState(false);
  const [pendingChallengesCount, setPendingChallengesCount] = useState(0);

  // Fetch pending challenges count for notifications
  const fetchPendingChallengesCount = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/h2h?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const challenges = data.challenges || [];
        // Count challenges that are pending and where current user is challenged (not challenger)
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
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('predictio_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('predictio_user');
      }
    }
  }, []);

  // Fetch pending challenges count when user changes
  useEffect(() => {
    if (currentUser) {
      fetchPendingChallengesCount();
      
      // Set up interval to check for new challenges every 30 seconds
      const interval = setInterval(fetchPendingChallengesCount, 30000);
      
      return () => {
        clearInterval(interval);
      };
    } else {
      setPendingChallengesCount(0);
    }
  }, [currentUser]);

  // Check URL for openH2H parameter
  useEffect(() => {
    if (currentUser) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('openH2H') === 'true') {
        setShowH2HManager(true);
        // Clean up URL
        window.history.replaceState({}, '', '/');
      }
    }
  }, [currentUser]);

  const handleLogin = (user: {id: number, name: string}) => {
    setCurrentUser(user);
    localStorage.setItem('predictio_user', JSON.stringify(user));
    // HIDDEN - Welcome modal not shown for now
    // setShowWelcomeModal(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('predictio_user');
  };

  // HIDDEN - Welcome modal handler not used for now
  // const handleCloseWelcomeModal = () => {
  //   setShowWelcomeModal(false);
  // };

  const handleOpenH2H = () => {
    setShowH2HManager(true);
    // Refresh count when opening H2H (in case user responds to challenges)
    fetchPendingChallengesCount();
  };

  const handleCloseH2H = () => {
    setShowH2HManager(false);
    // Refresh count when closing H2H (user may have responded to challenges)
    fetchPendingChallengesCount();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--superbet-bg)' }}>
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onOpenH2H={handleOpenH2H} 
        pendingChallengesCount={pendingChallengesCount}
      />
      
      <main style={{ padding: '20px', background: 'var(--superbet-light-gray)', minHeight: 'calc(100vh - 140px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {!currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <LoginForm onLogin={handleLogin} />
            </div>
          ) : (
            <PredictionTable currentUser={currentUser} />
          )}
        </div>
      </main>
      
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
      
      {/* HIDDEN - Welcome Modal not shown for now */}
      {/*
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={handleCloseWelcomeModal} 
      />
      */}
      
      {/* H2H Manager Modal - shown when user clicks H2H button */}
      {currentUser && (
        <H2HManager 
          currentUser={currentUser}
          isOpen={showH2HManager} 
          onClose={handleCloseH2H} 
        />
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import PredictionTable from '@/components/PredictionTable';
import LoginForm from '@/components/LoginForm';
import Header from '@/components/Header';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('predictio_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('predictio_user');
      }
    }
  }, []);

  const handleLogin = (user: {id: number, name: string}) => {
    setCurrentUser(user);
    localStorage.setItem('predictio_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('predictio_user');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Header currentUser={currentUser} onLogout={handleLogout} />
      
      <main style={{ padding: '20px', background: '#f9fafb', minHeight: 'calc(100vh - 140px)' }}>
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
      
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '20px 0' }}>
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
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  Predictio
                </div>
                <div style={{ fontSize: '14px', color: 'var(--superbet-gray)' }}>
                  Inspirat din Superbet
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
    </div>
  );
}
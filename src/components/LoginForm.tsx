'use client';

import { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: {id: number, name: string}) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to login');
      }

      const data = await response.json();
      onLogin(data.user);
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div className="superbet-card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--superbet-red)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 6px rgba(220, 38, 38, 0.2)'
          }}>
            <User style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: 'var(--superbet-text)', 
            margin: '0 0 8px 0' 
          }}>
            Intră în Joc!
          </h2>
          <p style={{ 
            color: 'var(--superbet-gray)', 
            margin: 0,
            fontSize: '16px'
          }}>
            Introdu numele tău pentru a începe să faci predicții
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label htmlFor="name" style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: 'var(--superbet-text)', 
              marginBottom: '8px' 
            }}>
              Numele Tău
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--superbet-border)',
                borderRadius: '8px',
                fontSize: '16px',
                color: 'var(--superbet-text)',
                background: 'var(--superbet-input-bg)',
                transition: 'border-color 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--superbet-red)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--superbet-border)';
              }}
              placeholder="Introdu numele tău..."
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <div style={{ 
              padding: '12px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '8px' 
            }}>
              <p style={{ fontSize: '14px', color: 'var(--superbet-red)', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="superbet-button"
            style={{ 
              width: '100%',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            {isLoading ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <>
                Începe să Joci
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--superbet-gray)',
            margin: 0
          }}>
            🏆 Prezice rezultatele meciurilor și concurează cu prietenii!
          </p>
        </div>
      </div>
    </div>
  );
}

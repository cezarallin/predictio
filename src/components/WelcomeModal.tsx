'use client';

import React from 'react';
import { X, Trophy, Users, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--superbet-card-bg)',
        borderRadius: '16px',
        padding: '20px',
        maxWidth: '420px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideInUp 0.3s ease-out',
        border: '1px solid var(--superbet-border)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--superbet-gray)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--superbet-light-gray)';
            e.currentTarget.style.color = 'var(--superbet-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--superbet-gray)';
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <Sparkles style={{ 
              width: '24px', 
              height: '24px', 
              color: '#fbbf24',
              animation: 'pulse 2s infinite'
            }} />
            <h2 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              H2H Challenges! 🔥⚔️
            </h2>
            <Sparkles style={{ 
              width: '24px', 
              height: '24px', 
              color: '#fbbf24',
              animation: 'pulse 2s infinite 0.5s'
            }} />
          </div>
          <p style={{
            fontSize: '14px',
            color: 'var(--superbet-gray)',
            margin: 0,
            lineHeight: 1.4
          }}>
            Provocă-ți prietenii la dueluri head-to-head! 🥊⚡
          </p>
        </div>

        {        /* Features */}
        <div className="features-container" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Feature: H2H Challenges - MAIN FEATURE */}
          <div className="feature-card dark-theme-card" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '18px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 20%, #fca5a5 40%, #f87171 60%, #ef4444 80%, #dc2626 100%)',
            borderRadius: '12px',
            border: '3px solid #dc2626',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.5)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <Users style={{ 
                width: '22px', 
                height: '22px', 
                color: 'white',
                animation: 'pulse 2s infinite'
              }} />
            </div>
            <div>
              <h3 className="dark-theme-title" style={{
                fontSize: '17px',
                fontWeight: 'bold',
                color: '#7f1d1d',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ⚔️ H2H Challenges
                <span style={{
                  fontSize: '20px',
                  animation: 'bounce 1s infinite'
                }}>🔥</span>
              </h3>
              <p className="dark-theme-text" style={{
                fontSize: '13px',
                color: '#7f1d1d',
                lineHeight: 1.5,
                margin: 0,
                fontWeight: 500
              }}>
                <strong className="dark-theme-text">Provocă un prieten la duel!</strong> Alegeți o dată specifică (de ex. meciurile de sâmbătă) și vedeți cine are mai multe predicții corecte! Cel cu <strong className="dark-theme-text">cel mai mare scor câștigă</strong>, iar la egalitate, cel cu <strong className="dark-theme-text">cotele mai mari</strong> ia victoria! Accesează din butonul H2H din header! ⚔️🏆
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 3px 8px rgba(16, 185, 129, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 3px 8px rgba(16, 185, 129, 0.4)';
            }}
          >
            <Users style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
            Perfect, să încep să provoc! 🥊⚔️
          </button>
          <p style={{
            fontSize: '11px',
            color: 'var(--superbet-gray)',
            marginTop: '12px',
            margin: '12px 0 0 0'
          }}>
            Mult noroc cu provocările! May the best predictor win! 🔥🏆
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0);
          }
          40%, 43% {
            transform: translateY(-8px);
          }
          70% {
            transform: translateY(-4px);
          }
        }
        
        @media (max-width: 768px) {
          .features-container {
            gap: 12px !important;
            margin-bottom: 20px !important;
          }
          
          .feature-card {
            padding: 12px !important;
            gap: 8px !important;
          }
          
          .feature-card > div:first-child {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
          }
          
          .feature-card > div:first-child svg {
            width: 16px !important;
            height: 16px !important;
          }
          
          .feature-card h3 {
            font-size: 14px !important;
            margin-bottom: 4px !important;
          }
          
          .feature-card p {
            font-size: 12px !important;
            line-height: 1.3 !important;
          }
        }
        
        /* Dark theme custom properties */
        :global(html.dark) {
          --dark-theme-title-color: #ffffff;
          --dark-theme-text-color: #ffffff;
        }

        /* Dark theme card adaptation - maximum specificity to override inline styles */
        .dark .dark-theme-card {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(21, 128, 61, 0.2) 100%) !important;
          border: 2px solid rgba(34, 197, 94, 0.4) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }
        
        /* Target specific classes with maximum specificity */
        html.dark .dark-theme-card .dark-theme-title {
          color: #ffffff !important;
          font-weight: bold !important;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9) !important;
        }
        
        html.dark .dark-theme-card .dark-theme-text {
          color: #ffffff !important;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9) !important;
        }
        
        html.dark .dark-theme-card .dark-theme-text strong {
          color: #ffffff !important;
          font-weight: 900 !important;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9) !important;
        }
        
        /* Fallback with universal selector */
        html.dark .dark-theme-card * {
          color: #ffffff !important;
        }
        
        /* Override any emoji or specific inline styles */
        html.dark .dark-theme-card[style] * {
          color: #ffffff !important;
        }
        
        html.dark .dark-theme-card > div:first-child {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7) !important;
        }
        
        /* HIDDEN TEMPORARILY - SuperSpin dark theme adaptation */
        /*
        html.dark .superspin-card {
          background: linear-gradient(135deg, #1f2937 0%, #374151 20%, #4b5563 40%, #6b7280 60%, #9ca3af 80%, #d1d5db 100%) !important;
          border: 3px solid #9ca3af !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
        }
        
        html.dark .superspin-card > div:first-child {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8) !important;
        }
        */
      `}</style>
    </div>
  );
}

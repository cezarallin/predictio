'use client';

import React from 'react';
import { X, Zap, Heart, Trophy, Sparkles, BarChart3, Moon } from 'lucide-react';

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
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Noutăți Tari! 🎉
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
            Am adăugat funcții noi pentru mai multă distracție! 🚀
          </p>
        </div>

        {        /* Features */}
        <div className="features-container" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Feature 1: Boost */}
          <div className="feature-card" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '12px',
            border: '2px solid #fbbf24'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 3px 8px rgba(251, 191, 36, 0.4)'
            }}>
              <Zap style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#92400e',
                margin: '0 0 6px 0'
              }}>
                🚀 Boost Meci Favorit
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#92400e',
                lineHeight: 1.4,
                margin: 0
              }}>
                <strong>După ce faci toate predicțiile</strong>, poți alege <strong>un singur meci pentru boost</strong> și să-ți dublezi punctele dacă ghicești rezultatul! 
                Perfect pentru când ești super sigur de o predicție! 💪
              </p>
            </div>
          </div>

          {/* Feature 2: Reactions */}
          <div className="feature-card" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
            borderRadius: '12px',
            border: '2px solid #ec4899'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 3px 8px rgba(236, 72, 153, 0.4)'
            }}>
              <Heart style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#9d174d',
                margin: '0 0 6px 0'
              }}>
                😍 Reacții la Predicții
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#9d174d',
                lineHeight: 1.4,
                margin: 0
              }}>
                <strong>Click pe predicția</strong> unui prieten și arată-i ce simți! 
                👍 👎 😂 😮 ❤️ 😡 🎉 🔥 - direct ca pe Instagram!
              </p>
            </div>
          </div>

          {/* Feature 3: Statistics */}
          <div className="feature-card" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
            borderRadius: '12px',
            border: '2px solid #0ea5e9'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 3px 8px rgba(14, 165, 233, 0.4)'
            }}>
              <BarChart3 style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#0c4a6e',
                margin: '0 0 6px 0'
              }}>
                📊 Istoric & Statistici
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#0c4a6e',
                lineHeight: 1.4,
                margin: 0
              }}>
                Vezi <strong>clasamentul complet</strong>, performanțele săptămânale și statistici detaliate! 
                Cine e cel mai bun predictor? Click pe <strong>&ldquo;Stats&rdquo;</strong> din header! 📈
              </p>
            </div>
          </div>

          {/* Feature 4: Dark Theme */}
          <div className="feature-card dark-theme-card" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(55, 65, 81, 0.2) 0%, rgba(75, 85, 99, 0.2) 100%)',
            borderRadius: '12px',
            border: '2px solid rgba(107, 114, 128, 0.5)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 3px 8px rgba(75, 85, 99, 0.4)'
            }}>
              <Moon style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 className="dark-theme-title" style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--dark-theme-title-color, #1f2937)',
                margin: '0 0 6px 0'
              }}>
                🌙 Mod Întunecat
              </h3>
              <p className="dark-theme-text" style={{
                fontSize: '13px',
                color: 'var(--dark-theme-text-color, #374151)',
                lineHeight: 1.4,
                margin: 0
              }}>
                <strong style={{color: 'var(--dark-theme-text-color, inherit)'}}>Ai cerut, acum ai!</strong> 🎉 Mod întunecat pentru ochi odihniti! 
                Click pe butonul 🌙 din header să comuti! 🌚
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
            <Trophy style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
            Perfect, să încep să joc! 🎯
          </button>
          <p style={{
            fontSize: '11px',
            color: 'var(--superbet-gray)',
            marginTop: '12px',
            margin: '12px 0 0 0'
          }}>
            Mult noroc cu predicțiile! May the odds be ever in your favor! 🍀
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
      `}</style>
    </div>
  );
}

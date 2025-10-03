'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SuperSpinWheelProps {
  userName: string;
  onSpinComplete: (result: any) => void;
  onClose: () => void;
}

interface PrizeSegment {
  type: string;
  label: string;
  color: string;
  textColor: string;
  angle: number;
}

// 8 segments total: 45 degrees each
const SEGMENTS: PrizeSegment[] = [
  { type: 'triple_boost', label: 'TRIPLE BOOST', color: 'var(--superbet-red)', textColor: '#fff', angle: 0 },
  { type: 'no_win', label: 'NECÂȘTIGĂTOR', color: '#ffffff', textColor: 'var(--superbet-red)', angle: 45 },
  { type: 'extra_point', label: '+1 PUNCT', color: 'var(--superbet-red)', textColor: '#fff', angle: 90 },
  { type: 'double_boost', label: 'DOUBLE BOOST', color: '#ffffff', textColor: 'var(--superbet-red)', angle: 135 },
  { type: 'five_lei', label: '5 LEI', color: 'var(--superbet-red)', textColor: '#fff', angle: 180 },
  { type: 'double_boost', label: 'DOUBLE BOOST', color: '#ffffff', textColor: 'var(--superbet-red)', angle: 225 },
  { type: 'extra_point', label: '+1 PUNCT', color: 'var(--superbet-red)', textColor: '#fff', angle: 270 },
  { type: 'no_win', label: 'NECÂȘTIGĂTOR', color: '#ffffff', textColor: 'var(--superbet-red)', angle: 315 }
];

export default function SuperSpinWheel({ userName, onSpinComplete, onClose }: SuperSpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Verifică dacă utilizatorul a mai învârtit astăzi
    checkSpinStatus();
  }, [userName]);

  const checkSpinStatus = async () => {
    try {
      const response = await fetch(`/api/superspin?user=${encodeURIComponent(userName)}`);
      const data = await response.json();
      
      if (data.hasSpinnedToday) {
        setHasSpun(true);
        // Also get the last spin result if available
        if (data.lastSpinResult) {
          setSpinResult(data.lastSpinResult);
        }
      }
    } catch (error) {
      console.error('Error checking spin status:', error);
    }
  };

  const handleWheelClick = async () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    setShowResult(false);
    
    try {
      const response = await fetch('/api/superspin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error);
        setIsSpinning(false);
        return;
      }

      // Animație realistă de rotire
      const spins = 5 + Math.random() * 5; // 5-10 rotiri complete
      const extraDegrees = Math.random() * 360; // Unghi aleatoriu final
      const finalRotation = spins * 360 + extraDegrees;
      
      setRotation(prev => prev + finalRotation);
      
      // Așteaptă să se termine animația (4 secunde)
      setTimeout(() => {
        setIsSpinning(false);
        setSpinResult(result);
        setHasSpun(true);
        setShowResult(true); // Show result directly in the same modal
        onSpinComplete(result);
      }, 4000);

    } catch (error) {
      console.error('Error spinning wheel:', error);
      setIsSpinning(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      {/* Modal container */}
      <div style={{
        background: 'var(--modal-bg)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: `
          0 20px 40px rgba(220, 38, 38, 0.15),
          0 8px 16px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
        textAlign: 'center',
        border: '1px solid rgba(220, 38, 38, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
          borderRadius: '20px 20px 0 0',
          zIndex: -1
        }} />
        
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '28px',
            height: '28px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#dc2626',
            zIndex: 10,
            transition: 'all 0.2s ease'
          }}
        >
          ✕
        </button>

        {/* Centered wheel container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
        
        {/* Predictio Wheel title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: 'var(--superbet-text)', 
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            🎰 Predictio Wheel
          </h2>
        </div>

        {/* The spinning wheel - responsive size */}
        <div className="relative wheel-container" style={{ 
          width: '400px', 
          height: '400px' 
        }}>
          {/* Wheel pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[50px] border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
          </div>

          {/* Main spinning wheel */}
          <div 
            ref={wheelRef}
            onClick={handleWheelClick}
            className={`w-full h-full rounded-full relative shadow-2xl cursor-pointer transform transition-transform ${
              isSpinning ? 'duration-4000 ease-out' : 'hover:scale-105 duration-200'
            } ${isSpinning || hasSpun ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              transform: `rotate(${rotation}deg) ${!isSpinning ? 'scale(1)' : ''}`,
              background: `conic-gradient(from 0deg, 
                var(--superbet-red) 0deg 45deg, 
                #ffffff 45deg 90deg, 
                var(--superbet-red) 90deg 135deg, 
                #ffffff 135deg 180deg, 
                var(--superbet-red) 180deg 225deg, 
                #ffffff 225deg 270deg, 
                var(--superbet-red) 270deg 315deg, 
                #ffffff 315deg 360deg)`,
              border: '8px solid var(--superbet-red)'
            }}
          >
            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center" style={{ border: '4px solid var(--superbet-red)' }}>
              <span className="font-bold text-2xl" style={{ color: 'var(--superbet-red)' }}>P</span>
            </div>

            {/* Segment labels - optimized radial text with mobile responsivity */}
            {SEGMENTS.map((segment, index) => {
              // Each segment is 45 degrees, center at angle + 22.5 degrees
              const segmentCenter = segment.angle + 22.5;
              
              return (
                <div
                  key={index}
                  className="absolute font-bold text-center pointer-events-none segment-text"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${segmentCenter}deg) translateY(-110px) rotate(-${segmentCenter}deg)`,
                    transformOrigin: '0 0',
                    color: segment.textColor,
                    width: '80px',
                    marginLeft: '-40px',
                    textShadow: segment.textColor === '#fff' ? '2px 2px 4px rgba(0,0,0,0.9)' : '2px 2px 4px rgba(255,255,255,0.9)',
                    fontSize: '9px',
                    lineHeight: '1.1',
                    fontWeight: '900',
                    letterSpacing: '0.5px',
                    textAlign: 'center'
                  }}
                >
                  {segment.label.split(' ').map((word, wordIndex) => (
                    <div key={wordIndex} style={{ marginBottom: '1px' }}>
                      {word}
                    </div>
                  ))}
                </div>
              );
            })}
            
            {/* Decorative dots */}
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 22.5}deg) translateY(-185px)`,
                  transformOrigin: '0 0'
                }}
              />
            ))}
          </div>
        </div>

        {/* Result display - after spin finishes - MODERN STYLE */}
        {showResult && spinResult && (
          <div style={{
            marginTop: '30px',
            padding: '0'
          }}>
            {/* Success celebration header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ 
                fontSize: '60px', 
                marginBottom: '15px',
                animation: 'bounce 1s infinite'
              }}>
                {spinResult.prize.type === 'no_win' ? '😞' : '🎉'}
              </div>
              <h3 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                background: spinResult.prize.type === 'no_win' 
                  ? 'linear-gradient(135deg, #6b7280, #9ca3af)'
                  : 'linear-gradient(135deg, var(--superbet-red), var(--superbet-red-hover))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                margin: '0 0 10px 0'
              }}>
                {spinResult.prize.type === 'no_win' ? 'Poate data viitoare!' : 'FELICITĂRI!'}
              </h3>
            </div>

            {/* Prize box */}
            <div style={{
              background: spinResult.prize.type === 'no_win' 
                ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                : 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
              border: spinResult.prize.type === 'no_win' 
                ? '3px solid #9ca3af'
                : '3px solid var(--superbet-red)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: spinResult.prize.type === 'no_win' 
                ? '0 8px 20px rgba(0, 0, 0, 0.1)'
                : '0 8px 20px rgba(220, 38, 38, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: spinResult.prize.type === 'no_win' 
                  ? 'none'
                  : `radial-gradient(circle at 20% 80%, rgba(220, 38, 38, 0.1) 0%, transparent 50%),
                     radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)`,
                borderRadius: '16px',
                zIndex: -1
              }} />
              
              <div style={{
                fontSize: '16px',
                color: spinResult.prize.type === 'no_win' ? '#6b7280' : 'var(--superbet-text)',
                marginBottom: '12px',
                fontWeight: '500'
              }}>
                {spinResult.prize.type === 'no_win' ? 'Oops! 😞' : 'Ai câștigat:'}
              </div>
              
              <div style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: spinResult.prize.type === 'no_win' ? '#4b5563' : 'var(--superbet-red)',
                lineHeight: 1.3,
                marginBottom: spinResult.prize.type === 'no_win' ? '12px' : '20px'
              }}>
                {spinResult.prize.message}
              </div>
              
              {spinResult.prize.type !== 'no_win' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: 'var(--superbet-gray)',
                  fontWeight: '500'
                }}>
                  <span>✨</span>
                  <span>Premiul a fost adăugat în contul tău!</span>
                  <span>✨</span>
                </div>
              )}
              
              {spinResult.prize.type === 'no_win' && (
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  marginBottom: '20px'
                }}>
                  Încearcă din nou mâine! 🌅
                </div>
              )}
              
              {/* Action button */}
              <button
                onClick={() => {
                  if (spinResult.prize.type === 'no_win') {
                    onClose(); // Close directly for no win
                  } else {
                    setShowCongratsModal(true); // Show congrats modal for wins
                  }
                }}
                style={{
                  background: spinResult.prize.type === 'no_win' 
                    ? 'linear-gradient(135deg, #6b7280, #9ca3af)'
                    : 'linear-gradient(135deg, var(--superbet-red), var(--superbet-red-hover))',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                {spinResult.prize.type === 'no_win' ? 'OK 😔' : 'Super! 🎉'}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* Congratulations Modal - inspired by the photo */}
      {showCongratsModal && spinResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          {/* Colorful confetti background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 10% 20%, rgba(255, 0, 150, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(0, 150, 255, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255, 200, 0, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 90% 10%, rgba(150, 255, 0, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 60% 90%, rgba(255, 100, 0, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 20% 70%, rgba(200, 0, 255, 0.3) 0%, transparent 50%)
            `,
            zIndex: -1
          }} />
          
          <div style={{
            background: 'var(--superbet-card-bg)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--superbet-border)',
            position: 'relative',
            animation: 'modalSlideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Prize icon */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              animation: 'bounce 2s infinite'
            }}>
              🎁
            </div>
            
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #feca57 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              animation: 'colorShift 3s infinite'
            }}>
              Congratulations!
            </h2>
            
            <p style={{
              fontSize: '18px',
              color: 'var(--superbet-text)',
              marginBottom: '25px',
              fontWeight: '500'
            }}>
              You Won This! 🎉
            </p>
            
            {/* Prize display box - same as original modal */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
              border: '3px solid var(--superbet-red)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '30px',
              boxShadow: '0 8px 20px rgba(220, 38, 38, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 20% 80%, rgba(220, 38, 38, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)`,
                borderRadius: '16px',
                zIndex: -1
              }} />
              
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'var(--superbet-red)',
                lineHeight: 1.3,
                marginBottom: '15px'
              }}>
                {spinResult.prize.message}
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                color: 'var(--superbet-gray)',
                fontWeight: '500'
              }}>
                <span>✨</span>
                <span>Premiul a fost adăugat în contul tău!</span>
                <span>✨</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowCongratsModal(false);
                onClose(); // Close the entire SuperSpin modal
              }}
              style={{
                background: 'linear-gradient(135deg, #4ecdc4 0%, #45b7d1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '15px 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(78, 205, 196, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(78, 205, 196, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.4)';
              }}
            >
              Claim Now! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

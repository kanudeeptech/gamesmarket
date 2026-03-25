import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trophy, Shield, RefreshCw } from 'lucide-react';

const GRAVITY = 0.7;
const JUMP_FORCE = -10;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 60;
const MIN_PIPE_GAP = 140;
const MAX_PIPE_GAP = 220;
const BIRD_SIZE = 50;
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 768;
const BIRD_LEFT = 256;

type Pipe = {
  x: number;
  topHeight: number;
  passed: boolean;
  gap: number;
};

const FlappyNeonPage: React.FC = () => {
  const navigate = useNavigate();

  // Game State
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('flappyNeonHighScore') || '0');
  });

  // Physics State
  const [birdPos, setBirdPos] = useState(300);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const birdPosRef = useRef(300);
  const birdVelocityRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);

  // Sync refs
  useEffect(() => { birdPosRef.current = birdPos; }, [birdPos]);
  useEffect(() => { birdVelocityRef.current = birdVelocity; }, [birdVelocity]);
  useEffect(() => { pipesRef.current = pipes; }, [pipes]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Fullscreen management
  const enterFullscreen = useCallback(() => {
    const element = containerRef.current || document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.warn(`Fullscreen request failed: ${err.message}`);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && gameStarted && !isGameOver) {
        setIsPaused(true);
        setShowWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [gameStarted, isGameOver]);

  const startGame = () => {
    setGameStarted(true);
    resetGame();
    enterFullscreen();
  };

  const resetGame = () => {
    setBirdPos(300);
    setBirdVelocity(0);
    birdPosRef.current = 300;
    birdVelocityRef.current = 0;
    
    // Initial pipe
    const initialPipes = [{ x: GAME_WIDTH, topHeight: 200, passed: false, gap: 180 }];
    setPipes(initialPipes);
    pipesRef.current = initialPipes;
    
    setScore(0);
    scoreRef.current = 0;
    setIsGameOver(false);
    setIsPaused(false);
    setShowWarning(false);
  };

  const jump = useCallback(() => {
    if (isGameOver || isPaused || !gameStarted) return;
    setBirdVelocity(JUMP_FORCE);
    birdVelocityRef.current = JUMP_FORCE;
  }, [isGameOver, isPaused, gameStarted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  const endGame = useCallback(() => {
    setIsGameOver(true);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('flappyNeonHighScore', finalScore.toString());
    }

    // Save to global stats
    const existingStats = JSON.parse(localStorage.getItem('gameStats') || '[]');
    const newStat = {
      gameName: 'Flappy Neon',
      score: finalScore,
      date: new Date().toISOString(),
      isHighScore: finalScore > highScore
    };
    localStorage.setItem('gameStats', JSON.stringify([...existingStats, newStat]));
  }, [highScore]);

  const gameLoop = useCallback(() => {
    if (isGameOver || isPaused || !gameStarted) return;

    const gameHeight = GAME_HEIGHT;
    const gameWidth = GAME_WIDTH;

    // Bird Physics
    let currentVel = birdVelocityRef.current + GRAVITY;
    let currentPos = birdPosRef.current + currentVel;
    
    // Limits
    if (currentPos < 0) currentPos = 0;
    if (currentPos > gameHeight - BIRD_SIZE) {
      currentPos = gameHeight - BIRD_SIZE;
      endGame();
      return;
    }

    setBirdVelocity(currentVel);
    setBirdPos(currentPos);
    birdVelocityRef.current = currentVel;
    birdPosRef.current = currentPos;

    // Pipes Logic
    let currentPipes = [...pipesRef.current];
    
    // Move pipes
    currentPipes = currentPipes.map(p => ({ ...p, x: p.x - PIPE_SPEED }));
    
    // Remove off-screen pipes
    currentPipes = currentPipes.filter(p => p.x + PIPE_WIDTH > 0);
    
    // Add new pipes
    const lastPipe = currentPipes[currentPipes.length - 1];
    if (lastPipe && lastPipe.x < gameWidth - 300) {
      const currentGap = Math.floor(Math.random() * (MAX_PIPE_GAP - MIN_PIPE_GAP + 1)) + MIN_PIPE_GAP;
      const minHeight = 50;
      const maxHeight = gameHeight - currentGap - 50;
      const topHeight = Math.max(minHeight, Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight);
      currentPipes.push({ x: gameWidth, topHeight, passed: false, gap: currentGap });
    }

    // Collision & Scoring
    const hitboxPadding = 8;
    const birdRect = {
      left: BIRD_LEFT + hitboxPadding,
      right: BIRD_LEFT + BIRD_SIZE - hitboxPadding,
      top: currentPos + hitboxPadding,
      bottom: currentPos + BIRD_SIZE - hitboxPadding
    };

    let hitPipe = false;
    currentPipes.forEach(pipe => {
      // Check Scoring
      if (!pipe.passed && birdRect.left > pipe.x + PIPE_WIDTH) {
        pipe.passed = true;
        const newScore = scoreRef.current + 1;
        setScore(newScore);
        scoreRef.current = newScore;
      }

      // Check Collision
      const inHorizontalRange = birdRect.right > pipe.x && birdRect.left < pipe.x + PIPE_WIDTH;
      if (inHorizontalRange) {
        const hitTop = birdRect.top < pipe.topHeight;
        const hitBottom = birdRect.bottom > pipe.topHeight + pipe.gap;
        if (hitTop || hitBottom) {
          hitPipe = true;
        }
      }
    });

    if (hitPipe) {
      endGame();
      return;
    }

    setPipes(currentPipes);
    pipesRef.current = currentPipes;

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [isGameOver, isPaused, gameStarted, endGame]);

  useEffect(() => {
    if (gameStarted && !isPaused && !isGameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, isPaused, isGameOver, gameLoop]);

  const handleContinue = () => {
    setShowWarning(false);
    setIsPaused(false);
    enterFullscreen();
  };

  const handleQuit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    navigate('/', { replace: true });
  };

  if (!gameStarted) {
    return (
      <div style={{
        height: '100vh',
        background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Orbitron, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--neon-yellow, #fbbf24)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)'
          }}>
             <svg width="40" height="40" viewBox="0 0 24 24" fill="black"><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zM12 4a8 8 0 100 16 8 8 0 000-16z"/><path d="M15 9a1 1 0 11-2 0 1 1 0 012 0zM14 15h2v-2h-2v2zM8 15h2v-2H8v2zM11 15h2v-2h-2v2z"/></svg>
          </div>
          <h1 style={{ fontSize: '3rem', marginBottom: '16px', fontWeight: 'bold', textShadow: '0 0 10px rgba(251,191,36,0.5)' }}>FLAPPY NEON</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px', lineHeight: '1.6', fontFamily: 'Inter, sans-serif' }}>
            Navigate the neon skyline. Press Space or Click to jump. Full-screen mode required.
          </p>
          <button
            onClick={startGame}
            className="btn-primary"
            style={{
              padding: '16px 48px',
              fontSize: '1.2rem',
              borderRadius: '12px',
              boxShadow: '0 0 30px rgba(0, 210, 255, 0.3)',
            }}
          >
            START FLIGHT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        width: '100vw',
        background: '#020617', // Outer background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          background: '#0f172a',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Orbitron, sans-serif',
          cursor: isGameOver ? 'default' : 'pointer',
          boxShadow: '0 0 15px #00f3ff',
          border: '2px solid #00f3ff',
          borderRadius: '8px',
        }}
        onMouseDownCapture={jump}
        onTouchStartCapture={jump}
      >
        {/* Cinematic Parallax Background */}
        {/* Layer 1 - Slow */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '200%', height: '60%',
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'200\' opacity=\'0.2\'%3E%3Cpath d=\'M0 200V150h40v-40h30v-20h40v60h50v-80h60v30h40v-50h60v10h40v90h40v-30h0v130H0z\' fill=\'%23334155\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat-x', backgroundSize: '400px 200px',
          animation: !isGameOver && !isPaused ? 'scrollSkyline 40s linear infinite' : 'none',
          zIndex: 1, pointerEvents: 'none'
        }} />
        {/* Layer 2 - Medium */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '200%', height: '40%',
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'150\' opacity=\'0.4\'%3E%3Cpath d=\'M0 150v-60h30v-20h20v40h40v-50h30v30h40v-70h30v40h40v-30h30v120z\' fill=\'%231e293b\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat-x', backgroundSize: '300px 150px',
          animation: !isGameOver && !isPaused ? 'scrollSkyline 20s linear infinite' : 'none',
          zIndex: 2, pointerEvents: 'none'
        }} />
        {/* Layer 3 - Fast */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '200%', height: '10%',
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'40\'%3E%3Crect width=\'100\' height=\'40\' fill=\'%23020617\'/%3E%3Cpath d=\'M0 0h100v4H0zM0 10h100v2H0zM0 20h100v2H0z\' fill=\'%23334155\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat-x', backgroundSize: '100px 40px',
          animation: !isGameOver && !isPaused ? 'scrollSkyline 5s linear infinite' : 'none',
          zIndex: 3, pointerEvents: 'none'
        }} />

        {/* Pipes */}
        {pipes.map((pipe, i) => (
          <React.Fragment key={i}>
            <div style={{
              position: 'absolute', left: `${pipe.x}px`, top: 0, width: `${PIPE_WIDTH}px`, height: `${pipe.topHeight}px`,
              background: 'var(--neon-green, #4ade80)', border: '2px solid white', borderTop: 'none',
              boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)', zIndex: 5
            }}>
                <div style={{ position: 'absolute', bottom: 0, left: '-4px', right: '-4px', height: '20px', background: '#22c55e', border: '2px solid white' }} />
            </div>
            <div style={{
              position: 'absolute', left: `${pipe.x}px`, top: `${pipe.topHeight + pipe.gap}px`, width: `${PIPE_WIDTH}px`, bottom: 0,
              background: 'var(--neon-green, #4ade80)', border: '2px solid white', borderBottom: 'none',
              boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)', zIndex: 5
            }}>
                <div style={{ position: 'absolute', top: 0, left: '-4px', right: '-4px', height: '20px', background: '#22c55e', border: '2px solid white' }} />
            </div>
          </React.Fragment>
        ))}

        {/* Bird SVG Sprite */}
        <div style={{
          position: 'absolute', left: `${BIRD_LEFT}px`, top: `${birdPos}px`, width: `${BIRD_SIZE}px`, height: `${BIRD_SIZE}px`,
          transform: `rotate(${Math.min(Math.max(birdVelocity * 3, -45), 90)}deg)`,
          transition: 'transform 0.1s linear', zIndex: 10,
          filter: 'drop-shadow(0 0 10px rgba(0, 243, 255, 0.8))'
        }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <ellipse cx="45" cy="50" rx="35" ry="25" fill="#00f3ff" />
            <path d="M75 45 L95 50 L75 55 Z" fill="#fbbf24" stroke="white" strokeWidth="2" />
            <circle cx="60" cy="42" r="8" fill="white" />
            <circle cx="63" cy="42" r="3" fill="black" />
            <path 
              d={birdVelocity < 0 ? "M45 50 Q30 20 15 45 Q30 55 45 50" : "M45 50 Q30 80 15 55 Q30 45 45 50"} 
              fill="white" opacity="0.8" 
              style={{ transition: 'd 0.1s ease-in-out' }}
            />
          </svg>
        </div>

        {/* HUD Score */}
        <div style={{ position: 'absolute', top: '20px', left: '25px', fontSize: '2.5rem', fontWeight: 'bold', color: '#00f3ff', textShadow: '0 0 10px #00f3ff', zIndex: 20, pointerEvents: 'none' }}>
          {score}
        </div>
        
        {/* HUD High Score */}
        <div style={{ position: 'absolute', top: '20px', right: '25px', fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24', textShadow: '0 0 10px #fbbf24', zIndex: 20, pointerEvents: 'none', textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>HIGH SCORE</div>
          <div>{highScore}</div>
        </div>

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="fade-in" style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30
        }}>
          <Trophy size={80} color="var(--neon-purple, #9d50bb)" style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 20px rgba(157, 80, 187, 0.5))' }} />
          <h1 style={{ fontSize: '3rem', marginBottom: '8px', textShadow: '0 0 10px red' }}>CRASHED!</h1>
          
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '24px 48px',
            marginBottom: '40px',
            display: 'flex',
            gap: '40px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>SCORE</div>
              <div style={{ fontSize: '2.5rem', color: 'var(--neon-blue)', fontWeight: 'bold' }}>{score}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>BEST</div>
              <div style={{ fontSize: '2.5rem', color: '#10b981', fontWeight: 'bold' }}>{highScore}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); resetGame(); }}
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={18} /> PLAY AGAIN
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/'); }}
              className="btn-primary"
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              QUIT
            </button>
          </div>
        </div>
      )}

      {/* Warning Overlay */}
      {showWarning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          textAlign: 'center',
          padding: '20px'
        }}>
          <div className="glass fade-in" style={{
            background: 'var(--bg-card, #1e293b)',
            padding: '40px',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            border: '2px solid #ffcc00',
            boxShadow: '0 0 30px rgba(255, 204, 0, 0.2)',
            fontFamily: 'Inter, sans-serif'
          }}>
            <AlertTriangle size={64} color="#ffcc00" style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '2rem', color: '#ffcc00', marginBottom: '16px', fontFamily: 'Orbitron' }}>Anti-Cheat Warning</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '40px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              Game will terminate and no score will be saved if you leave full-screen. Return to game?
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={handleQuit}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Exit Game
              </button>
              <button
                onClick={handleContinue}
                style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  background: '#ffcc00',
                  color: 'black',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(255, 204, 0, 0.3)'
                }}
              >
                Return to Game
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scrollSkyline {
          from { background-position: 0 0; }
          to { background-position: -400px 0; }
        }
      `}</style>
      </div>
    </div>
  );
};

export default FlappyNeonPage;

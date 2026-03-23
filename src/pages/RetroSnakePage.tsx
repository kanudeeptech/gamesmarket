import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Trophy, Timer, Shield, RefreshCw } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 10;
const MIN_SPEED = 60;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const RetroSnakePage: React.FC = () => {
  const navigate = useNavigate();
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef<Direction>('UP');

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

  // Auto-start if requested
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('start') === 'true' && !gameStarted) {
      setGameStarted(true);
      setTimeout(() => {
        if (!document.fullscreenElement) {
          enterFullscreen();
        }
      }, 100);
    }
  }, [gameStarted, enterFullscreen]);

  const getRandomPoint = useCallback((): Point => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }, []);

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        endGame();
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore % 50 === 0) {
            setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
          }
          return newScore;
        });
        setFood(getRandomPoint());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, getRandomPoint]);

  useEffect(() => {
    if (gameStarted && !isGameOver && !isPaused) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameStarted, isGameOver, isPaused, moveSnake, speed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (directionRef.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown': case 's': case 'S':
          if (directionRef.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft': case 'a': case 'A':
          if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight': case 'd': case 'D':
          if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const endGame = () => {
    setIsGameOver(true);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    // Save score
    const existingStats = JSON.parse(localStorage.getItem('gameStats') || '[]');
    const newStat = {
      gameName: 'Retro Snake',
      score: score,
      date: new Date().toISOString(),
      isHighScore: true
    };
    localStorage.setItem('gameStats', JSON.stringify([...existingStats, newStat]));
  };

  const startGame = () => {
    setGameStarted(true);
    enterFullscreen();
  };

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

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    setFood(getRandomPoint());
    setDirection('UP');
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsGameOver(false);
    setIsPaused(false);
  };

  if (!gameStarted) {
    return (
      <div style={{
        height: '100vh',
        background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
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
            background: 'var(--neon-blue)', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)'
          }}>
            <Shield size={48} color="black" />
          </div>
          <h1 style={{ fontSize: '3rem', marginBottom: '16px', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,210,255,0.5)' }}>RETRO SNAKE</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px', lineHeight: '1.6', fontFamily: 'Inter, sans-serif' }}>
            A classic 2D challenge. Eat pixels to grow and speed up. Full-screen mode required for anti-cheat protection.
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
            START MISSION
          </button>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div style={{
        height: '100vh',
        background: '#020617',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Orbitron, sans-serif'
      }}>
        <Trophy size={80} color="var(--neon-purple)" style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 10px rgba(157, 80, 187, 0.5))' }} />
        <h1 style={{ fontSize: '3rem', marginBottom: '8px' }}>CRASHED!</h1>
        <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>
          Final Score: <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>{score}</span>
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            onClick={resetGame}
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <RefreshCw size={18} /> RETRY
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{
              padding: '12px 32px',
              borderRadius: '8px',
            }}
          >
            EXIT TO ARCADE
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
        background: '#020617',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Orbitron, sans-serif'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>CURRENT SCORE</div>
        <div style={{ fontSize: '2rem', color: 'var(--neon-blue)', fontWeight: 'bold' }}>{score.toString().padStart(4, '0')}</div>
      </div>

      <div style={{
        position: 'absolute',
        top: '40px',
        right: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px'
      }}>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>CORE SPEED</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-purple)' }}>
          {((INITIAL_SPEED - speed + 10) / 10).toFixed(1)}x
        </div>
      </div>

      {/* Game Board */}
      <div style={{
        width: 'min(80vh, 90vw)',
        height: 'min(80vh, 90vw)',
        background: '#0f172a',
        border: '2px solid var(--border-color)',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Snake segments */}
        {snake.map((segment, i) => (
          <div
            key={i}
            style={{
              gridColumnStart: segment.x + 1,
              gridRowStart: segment.y + 1,
              background: i === 0 ? '#4ade80' : '#22c55e',
              border: '1px solid #0f172a',
              borderRadius: i === 0 ? '4px' : '2px',
              boxShadow: i === 0 ? '0 0 10px rgba(74, 222, 128, 0.5)' : 'none',
              zIndex: i === 0 ? 2 : 1
            }}
          />
        ))}

        {/* Food */}
        <div
          style={{
            gridColumnStart: food.x + 1,
            gridRowStart: food.y + 1,
            background: '#ef4444',
            borderRadius: '50%',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)',
            animation: 'pulse 1s infinite'
          }}
        />
      </div>

      {/* Controls Help */}
      <div style={{
        marginTop: '32px',
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.3)',
        display: 'flex',
        gap: '24px'
      }}>
        <span>WASD / ARROWS TO MOVE</span>
        <span>ESC TO PAUSE/EXIT</span>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
      `}</style>

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
            background: 'var(--bg-card)',
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
              Snake will terminate and no score will be saved if you leave full-screen. Return to game?
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={handleQuit}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-dim)',
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
    </div>
  );
};

export default RetroSnakePage;

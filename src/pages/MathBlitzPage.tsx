import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, XCircle, Timer, Shield } from 'lucide-react';

interface Question {
  id: number;
  expression: string;
  answer: number;
}

const QUESTIONS: Question[] = [
  { id: 1, expression: '5 + (3 * 2)', answer: 11 },
  { id: 2, expression: '(10 / 2) + 7', answer: 12 },
  { id: 3, expression: '4 * (5 - 2)', answer: 12 },
  { id: 4, expression: '15 - (3 + 4)', answer: 8 },
  { id: 5, expression: '(12 + 8) / 4', answer: 5 },
  { id: 6, expression: '6 + 10 / 2', answer: 11 },
  { id: 7, expression: '20 - 4 * 3', answer: 8 },
  { id: 8, expression: '(7 + 3) * (10 / 5)', answer: 20 },
  { id: 9, expression: '50 / (5 + 5)', answer: 5 },
  { id: 10, expression: '9 + (2 * 4) - 3', answer: 14 }
];

const MathBlitzPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen management
  const enterFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    }
  };

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

  // Timer logic
  useEffect(() => {
    if (gameStarted && !isGameOver && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextQuestion();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, isGameOver, isPaused, currentQuestionIndex]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setTimeLeft(10);
    } else {
      endGame();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaused || isGameOver) return;

    const correct = QUESTIONS[currentQuestionIndex].answer === parseInt(userAnswer);
    if (correct) {
      setScore(prev => prev + 1);
    }
    handleNextQuestion();
  };

  const endGame = () => {
    setIsGameOver(true);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    // Save score
    const existingStats = JSON.parse(localStorage.getItem('gameStats') || '[]');
    const newStat = {
      gameName: 'Math Blitz',
      score: score + (QUESTIONS[currentQuestionIndex].answer === parseInt(userAnswer) ? 1 : 0),
      date: new Date().toISOString()
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
    navigate('/');
  };

  if (!gameStarted) {
    return (
      <div style={{
        height: '100vh',
        background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
          <Shield size={64} color="var(--neon-blue, #00d2ff)" style={{ marginBottom: '24px' }} />
          <h1 style={{ fontSize: '3rem', marginBottom: '16px', fontWeight: 'bold' }}>Math Blitz</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px', lineHeight: '1.6' }}>
            Solve 10 BODMAS problems in record time. Full-screen mode is required to combat cheating.
          </p>
          <button
            onClick={startGame}
            style={{
              padding: '16px 48px',
              fontSize: '1.2rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
              color: 'black',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(0, 210, 255, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            START CHALLENGE
          </button>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div style={{
        height: '100vh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <CheckCircle2 size={80} color="#4ade80" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Challenge Complete!</h1>
        <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>
          Final Score: <span style={{ color: 'var(--neon-blue, #00d2ff)', fontWeight: 'bold' }}>{score}/10</span>
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          FINISH
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{
        height: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Zen Mode Elements Only */}
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '40px',
        fontSize: '1.2rem',
        color: 'rgba(255,255,255,0.4)'
      }}>
        Question <span style={{ color: 'white' }}>{currentQuestionIndex + 1}</span> of 10
      </div>

      <div style={{
        position: 'absolute',
        top: '40px',
        right: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: timeLeft <= 3 ? '#ff4444' : 'var(--neon-blue, #00d2ff)'
      }}>
        <Timer size={24} />
        {timeLeft}s
      </div>

      <div style={{ textAlign: 'center', width: '100%', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '4rem', marginBottom: '60px', letterSpacing: '2px' }}>
          {QUESTIONS[currentQuestionIndex].expression} = ?
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter answer"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '2.5rem',
              textAlign: 'center',
              width: '200px',
              padding: '10px',
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderBottomColor = 'var(--neon-blue, #00d2ff)'}
            onBlur={(e) => e.target.style.borderBottomColor = 'rgba(255,255,255,0.2)'}
          />
          <div style={{ marginTop: '40px' }}>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '12px 40px', fontSize: '1.1rem' }}
            >
              SUBMIT
            </button>
          </div>
        </form>
      </div>

      {/* Warning Overlay */}
      {showWarning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          textAlign: 'center',
          padding: '20px'
        }}>
          <AlertTriangle size={80} color="#ffcc00" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '2.5rem', color: '#ffcc00', marginBottom: '16px' }}>Warning: Anti-Cheat Triggered</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', maxWidth: '600px', color: 'rgba(255,255,255,0.8)' }}>
            Leaving full-screen will end your game. Do you want to Quit or Continue?
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={handleQuit}
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                border: '1px solid #ff4444',
                background: 'transparent',
                color: '#ff4444',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              QUIT GAME
            </button>
            <button
              onClick={handleContinue}
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                background: '#ffcc00',
                color: 'black',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathBlitzPage;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trophy, Shield, RefreshCw, Zap } from 'lucide-react';

const GRID_SIZE = 20;
const GHOST_SPEED = 280;
const PACMAN_SPEED = 290;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const INITIAL_MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 1, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 1, 2, 2, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

type Ghost = {
  pos: Point;
  direction: Direction;
  color: string;
};

const INITIAL_GHOSTS: Ghost[] = [
  { pos: { x: 1, y: 1 }, direction: 'RIGHT', color: '#FF1493' },
  { pos: { x: 18, y: 1 }, direction: 'LEFT', color: '#00FFFF' }
];

const PacManRetroPage: React.FC = () => {
  const navigate = useNavigate();
  const [maze, setMaze] = useState<number[][]>(INITIAL_MAZE.map(row => [...row]));
  const [pacmanPos, setPacmanPos] = useState<Point>({ x: 10, y: 14 });
  const [ghosts, setGhosts] = useState<Ghost[]>(INITIAL_GHOSTS);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWin, setIsGameWin] = useState(false);
  const [isDying, setIsDying] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef<Direction>('RIGHT');
  const pacmanPosRef = useRef<Point>(pacmanPos);
  const ghostsRef = useRef<Ghost[]>(ghosts);
  const mazeRef = useRef<number[][]>(maze);
  const pacmanLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ghostLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pacmanPosRef.current = pacmanPos;
  }, [pacmanPos]);

  useEffect(() => {
    ghostsRef.current = ghosts;
  }, [ghosts]);

  useEffect(() => {
    mazeRef.current = maze;
  }, [maze]);

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
      if (!document.fullscreenElement && gameStarted && !isGameOver && !isGameWin) {
        setIsPaused(true);
        setShowWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [gameStarted, isGameOver, isGameWin]);

  // Movement Logic
  const movePacman = useCallback(() => {
    if (isDying) return;
    setPacmanPos(prev => {
      const currentMaze = mazeRef.current;
      const next = { ...prev };
      switch (directionRef.current) {
        case 'UP': next.y -= 1; break;
        case 'DOWN': next.y += 1; break;
        case 'LEFT': next.x -= 1; break;
        case 'RIGHT': next.x += 1; break;
      }

      // Check boundaries and walls (Not fatal anymore!)
      if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE || currentMaze[next.y][next.x] === 1) {
        return prev;
      }

      // Check dot
      if (currentMaze[next.y][next.x] === 2) {
        setMaze(m => {
          const newMaze = [...m];
          newMaze[next.y][next.x] = 0;
          return newMaze;
        });
        setScore(s => s + 10);
      }

      return next;
    });
  }, [isDying]);

  // Ghost AI: BFS for shortest path to Pac-Man
  const moveGhost = useCallback(() => {
    if (isDying) return;
    setGhosts(prevGhosts => {
      const currentPacmanPos = pacmanPosRef.current;
      const currentMaze = mazeRef.current;

      return prevGhosts.map(ghost => {
        const queue: { pos: Point; path: Direction[] }[] = [{ pos: ghost.pos, path: [] }];
        const visited = new Set<string>();
        visited.add(`${ghost.pos.x},${ghost.pos.y}`);

        const directions: { dir: Direction; dx: number; dy: number }[] = [
          { dir: 'UP', dx: 0, dy: -1 },
          { dir: 'DOWN', dx: 0, dy: 1 },
          { dir: 'LEFT', dx: -1, dy: 0 },
          { dir: 'RIGHT', dx: 1, dy: 0 }
        ];

        while (queue.length > 0) {
          const { pos, path } = queue.shift()!;

          if (pos.x === currentPacmanPos.x && pos.y === currentPacmanPos.y) {
            if (path.length > 0) {
              const firstStep = path[0];
              const nextX = ghost.pos.x + (firstStep === 'LEFT' ? -1 : firstStep === 'RIGHT' ? 1 : 0);
              const nextY = ghost.pos.y + (firstStep === 'UP' ? -1 : firstStep === 'DOWN' ? 1 : 0);
              return { ...ghost, pos: { x: nextX, y: nextY }, direction: firstStep };
            }
            return ghost;
          }

          for (const { dir, dx, dy } of directions) {
            const next = { x: pos.x + dx, y: pos.y + dy };
            const key = `${next.x},${next.y}`;

            if (
              next.x >= 0 && next.x < GRID_SIZE &&
              next.y >= 0 && next.y < GRID_SIZE &&
              currentMaze[next.y][next.x] !== 1 &&
              !visited.has(key)
            ) {
              visited.add(key);
              queue.push({ pos: next, path: [...path, dir] });
            }
          }
        }
        return ghost;
      });
    });
  }, [isDying]);

  // Game Loops
  useEffect(() => {
    if (gameStarted && !isGameOver && !isGameWin && !isPaused && !isDying) {
      pacmanLoopRef.current = setInterval(movePacman, PACMAN_SPEED);
      ghostLoopRef.current = setInterval(moveGhost, GHOST_SPEED);
    } else {
      if (pacmanLoopRef.current) clearInterval(pacmanLoopRef.current);
      if (ghostLoopRef.current) clearInterval(ghostLoopRef.current);
    }
    return () => {
      if (pacmanLoopRef.current) clearInterval(pacmanLoopRef.current);
      if (ghostLoopRef.current) clearInterval(ghostLoopRef.current);
    };
  }, [gameStarted, isGameOver, isGameWin, isPaused, isDying, movePacman, moveGhost]);

  // Collision and Win Condition
  useEffect(() => {
    if (isGameOver || isGameWin || isDying) return;

    const hasCollision = ghosts.some(g => g.pos.x === pacmanPos.x && g.pos.y === pacmanPos.y);
    if (hasCollision) {
      setIsDying(true);
      setTimeout(() => {
        setGameOverMessage('Caught by the Ghost!');
        endGame(false);
      }, 1000);
    }

    // Win Condition: No more dots (2) in maze
    const hasDots = maze.some(row => row.includes(2));
    if (!hasDots && gameStarted) {
      endGame(true);
    }
  }, [pacmanPos, ghosts, maze, gameStarted, isGameOver, isGameWin, isDying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': directionRef.current = 'UP'; setDirection('UP'); break;
        case 'ArrowDown': directionRef.current = 'DOWN'; setDirection('DOWN'); break;
        case 'ArrowLeft': directionRef.current = 'LEFT'; setDirection('LEFT'); break;
        case 'ArrowRight': directionRef.current = 'RIGHT'; setDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const endGame = (win: boolean) => {
    if (win) setIsGameWin(true);
    else setIsGameOver(true);

    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    // Save score
    const existingStats = JSON.parse(localStorage.getItem('gameStats') || '[]');
    const newStat = {
      gameName: 'Pac-Man Retro',
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

  const resetGame = () => {
    setMaze(INITIAL_MAZE.map(row => [...row]));
    setPacmanPos({ x: 10, y: 14 });
    setGhosts(INITIAL_GHOSTS);
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setIsGameOver(false);
    setIsGameWin(false);
    setIsDying(false);
    setGameOverMessage('');
    setIsPaused(false);
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
          <h1 style={{ fontSize: '3rem', marginBottom: '16px', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,210,255,0.5)' }}>PAC-MAN RETRO</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px', lineHeight: '1.6', fontFamily: 'Inter, sans-serif' }}>
            Eat all the pellets while avoiding the hunter ghosts. Don't get caught! Full-screen mode required.
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

  if (isGameOver || isGameWin) {
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
        <Trophy size={80} color={isGameWin ? "#FFD700" : "var(--neon-purple)"} style={{ marginBottom: '24px', filter: `drop-shadow(0 0 10px ${isGameWin ? "rgba(255, 215, 0, 0.5)" : "rgba(157, 80, 187, 0.5)"})` }} />
        <h1 style={{ fontSize: '3rem', marginBottom: '8px' }}>{isGameWin ? 'LEVEL COMPLETE' : gameOverMessage}</h1>
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
            QUIT TO HOME
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

      {/* Game Board */}
      <div style={{
        width: 'min(80vh, 90vw)',
        height: 'min(80vh, 90vw)',
        background: '#000',
        border: '2px solid var(--neon-blue)',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        boxShadow: isDying ? '0 0 50px rgba(255, 0, 0, 0.4)' : '0 0 50px rgba(0, 210, 255, 0.2)',
        borderRadius: '8px',
        overflow: 'hidden',
        padding: '2px',
        transition: 'box-shadow 0.5s ease'
      }}>
        {maze.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                gridColumnStart: x + 1,
                gridRowStart: y + 1,
                background: cell === 1 ? 'rgba(0, 210, 255, 0.2)' : 'transparent',
                border: cell === 1 ? '1px solid var(--neon-blue)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {cell === 2 && (
                <div style={{
                  width: '4px',
                  height: '4px',
                  background: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 0 5px white'
                }} />
              )}
            </div>
          ))
        )}

        {/* Entities (Absolute Layer) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none'
        }}>
          {/* Pac-Man */}
          <div
            style={{
              position: 'absolute',
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              left: `${(pacmanPos.x / GRID_SIZE) * 100}%`,
              top: `${(pacmanPos.y / GRID_SIZE) * 100}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: isDying ? 'all 1s ease-in' : `all ${PACMAN_SPEED}ms linear`,
              transform: isDying ? 'scale(0) rotate(720deg)' : 'scale(1) rotate(0deg)',
              opacity: isDying ? 0 : 1,
              zIndex: 10
            }}
          >
            <div style={{
              width: '90%',
              height: '90%',
              background: isDying ? '#FF0000' : '#FFD700',
              borderRadius: '50%',
              position: 'relative',
              boxShadow: isDying ? '0 0 25px rgba(255, 0, 0, 0.8)' : '0 0 15px rgba(255, 215, 0, 0.6)',
              transition: 'all 0.3s ease'
            }}>
              {/* Mouth */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: '#000',
                clipPath: direction === 'RIGHT' ? 'polygon(100% 50%, 50% 50%, 100% 20%, 100% 80%)' :
                  direction === 'LEFT' ? 'polygon(0% 50%, 50% 50%, 0% 20%, 0% 80%)' :
                    direction === 'UP' ? 'polygon(50% 0%, 50% 50%, 20% 0%, 80% 0%)' :
                      'polygon(50% 100%, 50% 50%, 20% 100%, 80% 100%)',
              }} />
            </div>
          </div>

          {/* Ghosts */}
          {ghosts.map((ghost, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                left: `${(ghost.pos.x / GRID_SIZE) * 100}%`,
                top: `${(ghost.pos.y / GRID_SIZE) * 100}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: `all ${GHOST_SPEED}ms linear`,
                zIndex: 9
              }}
            >
              <div style={{
                width: '90%',
                height: '90%',
                background: ghost.color,
                borderRadius: '50%',
                position: 'relative',
                boxShadow: `0 0 15px ${ghost.color}99`
              }}>
                {/* Ghost Mouth */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: '#000',
                  clipPath: ghost.direction === 'RIGHT' ? 'polygon(100% 50%, 50% 50%, 100% 20%, 100% 80%)' :
                    ghost.direction === 'LEFT' ? 'polygon(0% 50%, 50% 50%, 0% 20%, 0% 80%)' :
                      ghost.direction === 'UP' ? 'polygon(50% 0%, 50% 50%, 20% 0%, 80% 0%)' :
                        'polygon(50% 100%, 50% 50%, 20% 100%, 80% 100%)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Help */}
      <div style={{
        marginTop: '32px',
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.3)',
        display: 'flex',
        gap: '24px'
      }}>
        <span>ARROWS TO MOVE</span>
        <span>ESC TO PAUSE/EXIT</span>
      </div>

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
              Game will terminate and no score will be saved if you leave full-screen. Return to game?
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

export default PacManRetroPage;

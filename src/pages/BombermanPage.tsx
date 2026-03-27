import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const COLS = 21;
const ROWS = 15;
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 768;
const CELL_W = GAME_WIDTH / COLS;
const CELL_H = GAME_HEIGHT / ROWS;

// Enums & Types
enum CellType {
  EMPTY = 0,
  FIXED_WALL = 1,
  SOFT_WALL = 2,
}

interface Position {
  x: number;
  y: number;
}

interface Character {
  pos: Position;
  logicalPos: Position;
  dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  animFrame: number;
  speed: number;
  isDead: boolean;
  deathTimer: number; // 0 to 1
  maxBombs: number;
}

interface Bomb {
  pos: Position;
  timer: number;
}

interface Explosion {
  pos: Position;
  timer: number; // 0 to 1
  cells: Position[]; // the cross cells
}

interface Powerup {
  pos: Position;
  type: '2x';
}

interface Particle {
  pos: Position;
  vel: Position;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'crumble' | 'puff';
}

const BombermanPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [antiCheatWarning, setAntiCheatWarning] = useState(false);

  // Game state refs (mutable to avoid dependency issues in loop)
  const stateRef = useRef({
    grid: [] as CellType[][],
    hero: {
      pos: { x: 1, y: 1 },
      logicalPos: { x: 1, y: 1 },
      dir: 'DOWN',
      animFrame: 0,
      speed: 4, // pixels per frame
      isDead: false,
      deathTimer: 0,
    } as Character,
    villains: [] as Character[],
    bombs: [] as Bomb[],
    explosions: [] as Explosion[],
    powerups: [] as Powerup[],
    particles: [] as Particle[],
    keys: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false },
    score: 0,
    gameOver: false,
    spacePressed: false, // debounce flag
  });

  // Initialize game
  useEffect(() => {
    const savedHighScore = localStorage.getItem('bombermanHighScore') || '0';
    setHighScore(parseInt(savedHighScore, 10));

    initGame();
  }, []);

  const initGame = () => {
    const grid: CellType[][] = Array(ROWS).fill(0).map(() => Array(COLS).fill(CellType.EMPTY));
    
    // Borders & Fixed walls
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
          grid[r][c] = CellType.FIXED_WALL;
        } else if (r % 2 === 0 && c % 2 === 0) {
          grid[r][c] = CellType.FIXED_WALL;
        } else if (Math.random() < 0.6) {
          // Safe zone for player (1,1), (1,2), (2,1)
          if (!((r === 1 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 1))) {
            grid[r][c] = CellType.SOFT_WALL;
          }
        }
      }
    }

    // Spawn 3 villains far from player
    const villains: Character[] = [];
    while (villains.length < 3) {
      let vr = Math.floor(Math.random() * (ROWS - 2)) + 1;
      let vc = Math.floor(Math.random() * (COLS - 2)) + 1;
      if (grid[vr][vc] === CellType.EMPTY && (vr > 5 || vc > 5)) {
        villains.push({
          pos: { x: vc * CELL_W, y: vr * CELL_H },
          logicalPos: { x: vc, y: vr },
          dir: 'LEFT',
          animFrame: 0,
          speed: 1.5,
          isDead: false,
          deathTimer: 0,
          maxBombs: 1,
        });
      }
    }

    stateRef.current = {
      grid,
      hero: {
        pos: { x: 1 * CELL_W, y: 1 * CELL_H },
        logicalPos: { x: 1, y: 1 },
        dir: 'DOWN',
        animFrame: 0,
        speed: 3,
        isDead: false,
        deathTimer: 0,
        maxBombs: 1,
      },
      villains,
      bombs: [],
      explosions: [],
      powerups: [],
      particles: [],
      keys: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false },
      score: 0,
      gameOver: false,
      spacePressed: false,
    };
    
    setScore(0);
    setGameOver(false);
  };

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPaused && !stateRef.current.gameOver) {
        if (e.code === 'ArrowUp') stateRef.current.keys.ArrowUp = true;
        if (e.code === 'ArrowDown') stateRef.current.keys.ArrowDown = true;
        if (e.code === 'ArrowLeft') stateRef.current.keys.ArrowLeft = true;
        if (e.code === 'ArrowRight') stateRef.current.keys.ArrowRight = true;
        if (e.code === 'Space' && !stateRef.current.spacePressed) {
          stateRef.current.keys.Space = true;
          stateRef.current.spacePressed = true;
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp') stateRef.current.keys.ArrowUp = false;
      if (e.code === 'ArrowDown') stateRef.current.keys.ArrowDown = false;
      if (e.code === 'ArrowLeft') stateRef.current.keys.ArrowLeft = false;
      if (e.code === 'ArrowRight') stateRef.current.keys.ArrowRight = false;
      if (e.code === 'Space') {
        stateRef.current.keys.Space = false;
        stateRef.current.spacePressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused]);

  // Fullscreen Anti-Cheat
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsPaused(true);
        setAntiCheatWarning(true);
      } else {
        setIsPaused(false);
        setAntiCheatWarning(false);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsPaused(true);
        setAntiCheatWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const resumeGame = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        setIsPaused(false);
        setAntiCheatWarning(false);
      }).catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    }
  };

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (!isPaused) {
        update(dt);
      }
      draw(ctx);

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // Helper function for collision (Rectangle collision)
  const isSolid = (r: number, c: number, checkBombs = false) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
    if (stateRef.current.grid[r][c] !== CellType.EMPTY) return true;
    if (checkBombs && stateRef.current.bombs.some(b => b.pos.x === c && b.pos.y === r)) return true;
    return false;
  };

  const getCollision = (x: number, y: number, oldX: number, oldY: number, hitboxFrac = 0.6) => {
    const hw = CELL_W * hitboxFrac;
    const hh = CELL_H * hitboxFrac;
    
    const cx = x + CELL_W / 2;
    const cy = y + CELL_H / 2;
    const left = cx - hw / 2;
    const right = cx + hw / 2;
    const top = cy - hh / 2;
    const bottom = cy + hh / 2;

    const c1 = Math.floor(left / CELL_W);
    const r1 = Math.floor(top / CELL_H);
    const c2 = Math.floor(right / CELL_W);
    const r2 = Math.floor(bottom / CELL_H);

    const oldCx = oldX + CELL_W / 2;
    const oldCy = oldY + CELL_H / 2;
    const oldLeft = oldCx - hw / 2;
    const oldRight = oldCx + hw / 2;
    const oldTop = oldCy - hh / 2;
    const oldBottom = oldCy + hh / 2;

    const oldC1 = Math.floor(oldLeft / CELL_W);
    const oldR1 = Math.floor(oldTop / CELL_H);
    const oldC2 = Math.floor(oldRight / CELL_W);
    const oldR2 = Math.floor(oldBottom / CELL_H);

    const wasIntersecting = (rC: number, cC: number) => {
      for (let or = oldR1; or <= oldR2; or++) {
        for (let oc = oldC1; oc <= oldC2; oc++) {
          if (or === rC && oc === cC) return true;
        }
      }
      return false;
    };

    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (isSolid(r, c, false)) return true;
        const bomb = stateRef.current.bombs.find(b => b.pos.x === c && b.pos.y === r);
        if (bomb) {
          if (!wasIntersecting(r, c)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const update = (dt: number) => {
    const state = stateRef.current;
    if (state.gameOver && state.hero.deathTimer >= 1) return;

    // Movement Delta
    const fpsScale = dt / (1000 / 60); // normalize speed to 60fps

    // --- HERO ---
    if (!state.hero.isDead) {
      const hSpeed = state.hero.speed * fpsScale;
      let dx = 0;
      let dy = 0;
      let moving = false;

      if (state.keys.ArrowUp) { dy = -hSpeed; state.hero.dir = 'UP'; moving = true; }
      else if (state.keys.ArrowDown) { dy = hSpeed; state.hero.dir = 'DOWN'; moving = true; }
      else if (state.keys.ArrowLeft) { dx = -hSpeed; state.hero.dir = 'LEFT'; moving = true; }
      else if (state.keys.ArrowRight) { dx = hSpeed; state.hero.dir = 'RIGHT'; moving = true; }

      // Corner Cutting / Nudging Logic
      if (moving) {
        state.hero.animFrame += dt * 0.01;
        
        let newX = state.hero.pos.x + dx;
        let newY = state.hero.pos.y + dy;

        // Try movement and nudge if blocked
        if (getCollision(newX, newY, state.hero.pos.x, state.hero.pos.y, 0.5)) {
          // If we are moving vertically and blocked, try nudging horizontally
          if (dy !== 0) {
            const centerX = state.hero.pos.x + CELL_W / 2;
            const tileCenterX = Math.floor(centerX / CELL_W) * CELL_W + CELL_W / 2;
            const diffX = centerX - tileCenterX;
            
            // if we are off-center by less than 40% of cell width
            if (Math.abs(diffX) < CELL_W * 0.45) {
               const nudgeDir = diffX > 0 ? -1 : 1;
               if (!getCollision(state.hero.pos.x + hSpeed * nudgeDir, newY, state.hero.pos.x, state.hero.pos.y, 0.5)) {
                  newX = state.hero.pos.x + hSpeed * nudgeDir; 
                  // auto-center logic
                  if (Math.abs(newX + CELL_W/2 - tileCenterX) < hSpeed) {
                    newX = tileCenterX - CELL_W/2;
                  }
               } else {
                 newY = state.hero.pos.y; // completely blocked
               }
            } else {
              newY = state.hero.pos.y;
            }
          }
          // If we are moving horizontally and blocked, try nudging vertically
          else if (dx !== 0) {
            const centerY = state.hero.pos.y + CELL_H / 2;
            const tileCenterY = Math.floor(centerY / CELL_H) * CELL_H + CELL_H / 2;
            const diffY = centerY - tileCenterY;
            
            if (Math.abs(diffY) < CELL_H * 0.45) {
               const nudgeDir = diffY > 0 ? -1 : 1;
               if (!getCollision(newX, state.hero.pos.y + hSpeed * nudgeDir, state.hero.pos.x, state.hero.pos.y, 0.5)) {
                  newY = state.hero.pos.y + hSpeed * nudgeDir; 
                  // auto-center logic
                  if (Math.abs(newY + CELL_H/2 - tileCenterY) < hSpeed) {
                    newY = tileCenterY - CELL_H/2;
                  }
               } else {
                 newX = state.hero.pos.x;
               }
            } else {
              newX = state.hero.pos.x;
            }
          }
        }

        // Only update if no collision
        if (!getCollision(newX, newY, state.hero.pos.x, state.hero.pos.y, 0.5)) {
           state.hero.pos.x = newX;
           state.hero.pos.y = newY;
        }

        state.hero.logicalPos.x = Math.floor((state.hero.pos.x + CELL_W/2) / CELL_W);
        state.hero.logicalPos.y = Math.floor((state.hero.pos.y + CELL_H/2) / CELL_H);
      } else {
        state.hero.animFrame = 0;
      }

      // Bomb Drop
      if (state.keys.Space && state.bombs.length < state.hero.maxBombs) { // Limit based on powerups
        const lx = state.hero.logicalPos.x;
        const ly = state.hero.logicalPos.y;
        if (!state.bombs.some(b => b.pos.x === lx && b.pos.y === ly)) {
          state.bombs.push({
            pos: { x: lx, y: ly },
            timer: 3000, 
          });
          state.keys.Space = false; // consume
        }
      }
    } else {
      state.hero.deathTimer += dt / 1000;
      if (state.hero.deathTimer >= 1 && !state.gameOver) {
        state.gameOver = true;
        setGameOver(true);
        saveGameStats();
      }
    }

    // --- VILLAINS ---
    state.villains.forEach(v => {
      if (v.isDead) {
        v.deathTimer += dt / 1000;
        return;
      }
      const vSpeed = v.speed * fpsScale;
      let dx = 0; let dy = 0;
      
      // Basic stalk logic: move towards hero
      const hxC = state.hero.pos.x;
      const hyC = state.hero.pos.y;
      
      // Simple logic: prefer changing direction at tile centers
      const centerX = v.pos.x + CELL_W / 2;
      const centerY = v.pos.y + CELL_H / 2;
      const tileCenterX = Math.floor(centerX / CELL_W) * CELL_W + CELL_W / 2;
      const tileCenterY = Math.floor(centerY / CELL_H) * CELL_H + CELL_H / 2;

      const isCenteredX = Math.abs(centerX - tileCenterX) < vSpeed * 2;
      const isCenteredY = Math.abs(centerY - tileCenterY) < vSpeed * 2;

      if (v.dir === 'LEFT') dx = -vSpeed;
      if (v.dir === 'RIGHT') dx = vSpeed;
      if (v.dir === 'UP') dy = -vSpeed;
      if (v.dir === 'DOWN') dy = vSpeed;

      // Decision making at tile centers
      if (isCenteredX && isCenteredY) {
         // Snap to center to avoid getting stuck
         v.pos.x = tileCenterX - CELL_W/2;
         v.pos.y = tileCenterY - CELL_H/2;
         
         const possibleDirs: ('UP' | 'DOWN' | 'LEFT' | 'RIGHT')[] = [];
         const c = v.logicalPos.x;
         const r = v.logicalPos.y;

         if (!isSolid(r-1, c, true)) possibleDirs.push('UP');
         if (!isSolid(r+1, c, true)) possibleDirs.push('DOWN');
         if (!isSolid(r, c-1, true)) possibleDirs.push('LEFT');
         if (!isSolid(r, c+1, true)) possibleDirs.push('RIGHT');

         if (possibleDirs.length > 0) {
            // Pick direction towards player
            const dxH = hxC - v.pos.x;
            const dyH = hyC - v.pos.y;
            
            let bestDir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' = v.dir;
            if (Math.abs(dxH) > Math.abs(dyH)) {
               bestDir = dxH > 0 ? 'RIGHT' : 'LEFT';
               if (!possibleDirs.includes(bestDir)) {
                 bestDir = dyH > 0 ? 'DOWN' : 'UP';
               }
            } else {
               bestDir = dyH > 0 ? 'DOWN' : 'UP';
               if (!possibleDirs.includes(bestDir)) {
                 bestDir = dxH > 0 ? 'RIGHT' : 'LEFT';
               }
            }
            
            if (!possibleDirs.includes(bestDir)) {
              bestDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            }
            v.dir = bestDir;
         } else {
            v.dir = 'LEFT'; // stuck
         }

         if (v.dir === 'LEFT') { dx = -vSpeed; dy = 0; }
         if (v.dir === 'RIGHT') { dx = vSpeed; dy = 0; }
         if (v.dir === 'UP') { dy = -vSpeed; dx = 0; }
         if (v.dir === 'DOWN') { dy = vSpeed; dx = 0; }
      }

      v.pos.x += dx;
      v.pos.y += dy;
      v.logicalPos.x = Math.floor((v.pos.x + CELL_W/2) / CELL_W);
      v.logicalPos.y = Math.floor((v.pos.y + CELL_H/2) / CELL_H);
      v.animFrame += dt * 0.01;

      // Check collision with Hero
      if (!state.hero.isDead && !v.isDead) {
        const dist = Math.hypot(
          (v.pos.x + CELL_W/2) - (state.hero.pos.x + CELL_W/2),
          (v.pos.y + CELL_H/2) - (state.hero.pos.y + CELL_H/2)
        );
        if (dist < CELL_W * 0.6) {
          triggerDeath(state.hero);
        }
      }
    });

    // Cleanup dead villains who finished animation
    state.villains = state.villains.filter(v => !(v.isDead && v.deathTimer >= 1));

    // --- BOMBS ---
    state.bombs.forEach(b => {
      b.timer -= dt;
      if (b.timer <= 0) {
        // EXPLODE
        createExplosion(b.pos.x, b.pos.y, 1); // Blast radius 1
      }
    });
    state.bombs = state.bombs.filter(b => b.timer > 0);

    // --- EXPLOSIONS ---
    state.explosions.forEach(e => {
      e.timer -= dt / 500; // 500ms blast duration
      
      // Collision with Hero/Villains within blast
      const checkBlastHit = (char: Character) => {
        if (char.isDead) return;
        const cl = char.logicalPos;
        if (e.cells.some(c => c.x === cl.x && c.y === cl.y)) {
           triggerDeath(char);
           if (char !== state.hero) {
             state.score += 100;
             setScore(s => s + 100);
           }
        }
      };
      
      checkBlastHit(state.hero);
      state.villains.forEach(v => checkBlastHit(v));
    });
    state.explosions = state.explosions.filter(e => e.timer > 0);

    // --- PARTICLES ---
    state.particles.forEach(p => {
      p.pos.x += p.vel.x * fpsScale;
      p.pos.y += p.vel.y * fpsScale;
      p.life -= dt;
    });
    state.particles = state.particles.filter(p => p.life > 0);

    // --- POWERUPS COLLECTION ---
    state.powerups = state.powerups.filter(p => {
      if (!state.hero.isDead && state.hero.logicalPos.x === p.pos.x && state.hero.logicalPos.y === p.pos.y) {
        state.hero.maxBombs = 2; // unlock 2x bombs
        state.score += 50;
        setScore(sc => sc + 50);
        return false;
      }
      return true;
    });
  };

  const createExplosion = (cx: number, cy: number, radius: number) => {
    const s = stateRef.current;
    const cells: Position[] = [{ x: cx, y: cy }];
    
    const dirs = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
    ];

    dirs.forEach(d => {
      for (let i = 1; i <= radius; i++) {
        const nx = cx + d.dx * i;
        const ny = cy + d.dy * i;
        
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) break;
        
        if (s.grid[ny][nx] === CellType.FIXED_WALL) {
          break; // blast stops
        } else if (s.grid[ny][nx] === CellType.SOFT_WALL) {
          // Destroy soft wall
          s.grid[ny][nx] = CellType.EMPTY;
          cells.push({ x: nx, y: ny });
          s.score += 10;
          setScore(sc => sc + 10);
          createCrumble(nx, ny);
          if (Math.random() < 0.20) {
             s.powerups.push({ pos: { x: nx, y: ny }, type: '2x' });
          }
          break; // Blast stops after breaking one wall
        } else {
          cells.push({ x: nx, y: ny });
        }
      }
    });

    s.explosions.push({
      pos: { x: cx, y: cy },
      timer: 1, // 1 to 0
      cells
    });
  };

  const createCrumble = (c: number, r: number) => {
    const s = stateRef.current;
    const x = c * CELL_W + CELL_W / 2;
    const y = r * CELL_H + CELL_H / 2;
    // 4 particles
    for (let i = 0; i < 4; i++) {
      s.particles.push({
        pos: { x: x + (i % 2 === 0 ? -10 : 10), y: y + (i < 2 ? -10 : 10) },
        vel: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 },
        life: 300,
        maxLife: 300,
        color: '#888', // brick color
        size: 15,
        type: 'crumble'
      });
    }
  };

  const triggerDeath = (char: Character) => {
    if (char.isDead) return;
    char.isDead = true;
    char.deathTimer = 0;
    
    // Create white puff
    const s = stateRef.current;
    for (let i = 0; i < 8; i++) {
      s.particles.push({
        pos: { x: char.pos.x + CELL_W/2, y: char.pos.y + CELL_H/2 },
        vel: { x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6 },
        life: 500,
        maxLife: 500,
        color: 'white',
        size: Math.random() * 6 + 4,
        type: 'puff'
      });
    }
  };

  const saveGameStats = () => {
    const s = stateRef.current;
    const savedHighScore = parseInt(localStorage.getItem('bombermanHighScore') || '0', 10);
    if (s.score > savedHighScore) {
      localStorage.setItem('bombermanHighScore', s.score.toString());
      setHighScore(s.score);
    }
    
    const existingStats = JSON.parse(localStorage.getItem('gameStats') || '[]');
    existingStats.push({
      gameName: 'Bomberman',
      score: s.score,
      date: new Date().toISOString()
    });
    localStorage.setItem('gameStats', JSON.stringify(existingStats));
  };


  // --- RENDERING ---
  const draw = (ctx: CanvasRenderingContext2D) => {
    const s = stateRef.current;

    // Clear background
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Grid Lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL_W, 0); ctx.lineTo(i * CELL_W, GAME_HEIGHT); ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * CELL_H); ctx.lineTo(GAME_WIDTH, i * CELL_H); ctx.stroke();
    }

    // Draw Walls
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL_W;
        const y = r * CELL_H;
        if (s.grid[r][c] === CellType.FIXED_WALL) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x, y, CELL_W, CELL_H);
          ctx.strokeStyle = '#00f3ff'; // Neon blue border
          ctx.lineWidth = 2;
          ctx.strokeRect(x+2, y+2, CELL_W-4, CELL_H-4);
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 10;
          ctx.strokeRect(x+2, y+2, CELL_W-4, CELL_H-4);
          ctx.shadowBlur = 0; // reset
        } else if (s.grid[r][c] === CellType.SOFT_WALL) {
          // Brick pattern
          ctx.fillStyle = '#475569';
          ctx.fillRect(x+2, y+2, CELL_W-4, CELL_H-4);
          ctx.fillStyle = '#334155';
          ctx.fillRect(x+4, y+4, CELL_W-8, CELL_H-8);
          // Highlight
          ctx.fillStyle = '#64748b';
          ctx.fillRect(x+4, y+4, CELL_W-8, 4);
        }
      }
    }

    // Draw Bombs
    s.bombs.forEach(b => {
      const x = b.pos.x * CELL_W + CELL_W / 2;
      const y = b.pos.y * CELL_H + CELL_H / 2;
      
      const pulseTime = b.timer / 3000; // 1 to 0
      const pulseScale = 1 + Math.sin(b.timer / 100) * 0.1;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(pulseScale, pulseScale);
      
      ctx.beginPath();
      ctx.arc(0, 0, CELL_W * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1b4b'; // dark purple
      ctx.fill();
      
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#a855f7'; // Neon purple
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 15;
      ctx.stroke();

      // Bomb fuse
      ctx.beginPath();
      ctx.moveTo(0, -CELL_H * 0.35);
      ctx.lineTo(0, -CELL_H * 0.5);
      ctx.strokeStyle = '#fbbf24'; // orange/yellow
      ctx.shadowColor = '#fbbf24';
      ctx.stroke();

      ctx.restore();
    });

    // Draw Powerups
    s.powerups.forEach(p => {
      const x = p.pos.x * CELL_W + CELL_W / 2;
      const y = p.pos.y * CELL_H + CELL_H / 2;
      
      // Pulse animation
      const pulse = 1 + Math.sin(performance.now() / 200) * 0.1;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(pulse, pulse);
      
      ctx.fillStyle = '#10b981'; // neon green 2x text
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.fillText('2X', 0, 0);

      // Border circle
      ctx.beginPath();
      ctx.arc(0, 0, CELL_W * 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    });

    // Draw Explosions
    s.explosions.forEach(e => {
      ctx.fillStyle = `rgba(255, 165, 0, ${e.timer})`; // Neon orange
      ctx.shadowColor = '#ff6a00';
      ctx.shadowBlur = 20;

      e.cells.forEach(c => {
        const x = c.x * CELL_W;
        const y = c.y * CELL_H;
        // Cross shape in tile
        ctx.fillRect(x + CELL_W*0.2, y, CELL_W*0.6, CELL_H);
        ctx.fillRect(x, y + CELL_H*0.2, CELL_W, CELL_H*0.6);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${e.timer})`;
        ctx.fillRect(x + CELL_W*0.35, y + CELL_H*0.35, CELL_W*0.3, CELL_H*0.3);
        ctx.fillStyle = `rgba(255, 165, 0, ${e.timer})`;
      });
      ctx.shadowBlur = 0;
    });

    // Draw Particles
    s.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.type === 'crumble') {
        ctx.rect(p.pos.x - p.size/2, p.pos.y - p.size/2, p.size, p.size);
      } else {
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Helper to draw characters
    const drawChar = (char: Character, isHero: boolean) => {
      if (char.isDead && char.deathTimer >= 1) return;

      const px = char.pos.x + CELL_W / 2;
      const py = char.pos.y + CELL_H / 2;

      ctx.save();
      ctx.translate(px, py);

      // Death Animation: Spin and shrink
      if (char.isDead) {
        const t = char.deathTimer; // 0 to 1
        ctx.rotate(t * Math.PI * 4); // spin 720 deg
        const scale = 1 - t;
        ctx.scale(scale, scale);
      } else {
        // Walk bobbing animation
        const steps = Math.floor(char.animFrame) % 3;
        if (steps === 1) ctx.translate(0, -3); // slight bob
      }

      const drawSpaceman = () => {
         // Body Base
         ctx.fillStyle = isHero ? '#ffffff' : '#3b0764'; // White or Deep Purple
         ctx.shadowColor = isHero ? '#ffffff' : '#9333ea';
         ctx.shadowBlur = 10;
         
         ctx.beginPath();
         // rounded rect roughly
         ctx.roundRect(-CELL_W*0.3, -CELL_H*0.1, CELL_W*0.6, CELL_H*0.4, 5);
         ctx.fill();
         ctx.shadowBlur = 0;

         // Helmet (Dome)
         ctx.fillStyle = isHero ? 'rgba(255,255,255,0.9)' : '#581c87';
         ctx.beginPath();
         ctx.arc(0, -CELL_H*0.15, CELL_W*0.25, 0, Math.PI*2);
         ctx.fill();

         // Visor
         ctx.fillStyle = isHero ? '#0ea5e9' : '#000000';
         ctx.beginPath();
         // Face direction
         let vx = 0; let vy = -CELL_H*0.15;
         let vw = CELL_W*0.3; let vh = CELL_H*0.15;
         
         // Left Right adjustments
         if (char.dir === 'LEFT') { vx -= 8; vw *= 0.8; }
         if (char.dir === 'RIGHT') { vx += 8; vw *= 0.8; }
         if (char.dir === 'UP') { vh = 0; /* looking away */ }
         
         if (vh > 0) {
           ctx.roundRect(vx - vw/2, vy - vh/2, vw, vh, 4);
           ctx.fill();

           // Glow Eyes for Villain
           if (!isHero) {
             ctx.fillStyle = '#ff003c'; // Neon Red
             ctx.shadowColor = '#ff003c';
             ctx.shadowBlur = 10;
             ctx.beginPath();
             ctx.arc(vx - 4, vy, 2, 0, Math.PI*2);
             ctx.arc(vx + 4, vy, 2, 0, Math.PI*2);
             ctx.fill();
             ctx.shadowBlur = 0;
           } else {
              // Highlight on visor
              ctx.fillStyle = 'rgba(255,255,255,0.5)';
              ctx.beginPath();
              ctx.arc(vx - vw*0.2, vy - vh*0.2, 2, 0, Math.PI*2);
              ctx.fill();
           }
         }
      };

      drawSpaceman();
      ctx.restore();
    };

    // Draw Villains
    s.villains.forEach(v => drawChar(v, false));
    // Draw Hero
    drawChar(s.hero, true);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      fontFamily: 'monospace'
    }}>
      {/* HUD Background Gradient */}
      <div style={{
         position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
         background: 'linear-gradient(to bottom, rgba(15,23,42,1) 0%, rgba(15,23,42,0) 100%)',
         zIndex: 1
      }}></div>

      {/* Top Header Controls */}
      <div style={{
         position: 'absolute', top: 20, left: 20, right: 20,
         display: 'flex', justifyContent: 'space-between', zIndex: 10,
         color: 'white'
      }}>
         <button 
           onClick={() => navigate('/')}
           style={{
             display: 'flex', alignItems: 'center', gap: '8px',
             background: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px 16px',
             borderRadius: '8px', color: 'white', cursor: 'pointer',
             backdropFilter: 'blur(5px)'
           }}
           className="hover-fade"
         >
           <ArrowLeft size={18} /> Back
         </button>

         <div style={{
           display: 'flex', gap: '40px', fontSize: '1.5rem', fontWeight: 'bold'
         }}>
            <div style={{ textShadow: '0 0 10px #00f3ff' }}>SCORE: {score}</div>
            <div style={{ textShadow: '0 0 10px #facc15', color: '#facc15' }}>HIGH: {highScore}</div>
         </div>
      </div>

      {/* Game Container */}
      <div style={{
         width: `${GAME_WIDTH}px`,
         height: `${GAME_HEIGHT}px`,
         borderRadius: '8px',
         overflow: 'hidden',
         boxShadow: '0 0 25px #00f3ff',
         border: '2px solid #00f3ff',
         position: 'relative',
         zIndex: 5
      }}>
         <canvas 
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            style={{ display: 'block' }}
         />

         {/* Overlay Menus */}
         {(gameOver || isPaused) && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', zIndex: 20
            }}>
               {antiCheatWarning ? (
                  <div style={{
                    background: 'rgba(220, 38, 38, 0.1)', border: '1px solid #dc2626',
                    padding: '40px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 0 30px rgba(220, 38, 38, 0.4)'
                  }}>
                    <AlertCircle size={64} color="#dc2626" style={{ marginBottom: '20px', filter: 'drop-shadow(0 0 10px red)' }} />
                    <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '16px', textShadow: '0 0 10px red' }}>
                      FOCUS LOST
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px', maxWidth: '300px' }}>
                      Bomberman requires full-screen mode to ensure fair play.
                    </p>
                    <button 
                      onClick={resumeGame}
                      className="btn-primary"
                      style={{ padding: '12px 32px', borderRadius: '8px', fontSize: '1.1rem', background: '#dc2626', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                      RESUME GAME
                    </button>
                  </div>
               ) : gameOver ? (
                  <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                    <h2 style={{ color: '#ff003c', fontSize: '4rem', textShadow: '0 0 20px #ff003c', marginBottom: '20px' }}>
                      GAME OVER
                    </h2>
                    <p style={{ color: 'white', fontSize: '1.5rem', marginBottom: '30px' }}>Final Score: {score}</p>
                    <button 
                      onClick={initGame}
                      className="btn-primary"
                      style={{ padding: '16px 40px', borderRadius: '12px', fontSize: '1.2rem', cursor: 'pointer', border: '1px solid #00f3ff', background: 'transparent', color: '#00f3ff', boxShadow: '0 0 15px rgba(0,243,255,0.4)' }}
                    >
                      PLAY AGAIN
                    </button>
                  </div>
               ) : null}
            </div>
         )}
      </div>
    </div>
  );
};

export default BombermanPage;

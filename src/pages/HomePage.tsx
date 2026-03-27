import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import { Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [isMathBlitzEnabled, setIsMathBlitzEnabled] = useState<boolean>(false);
  const [isRetroSnakeEnabled, setIsRetroSnakeEnabled] = useState<boolean>(false);
  const [isPacManRetroEnabled, setIsPacManRetroEnabled] = useState<boolean>(false);
  const [isFlappyNeonEnabled, setIsFlappyNeonEnabled] = useState<boolean>(false);
  const [isBombermanEnabled, setIsBombermanEnabled] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMathBlitzEnabled(localStorage.getItem('mathBlitzEnabled') === 'true');
    setIsRetroSnakeEnabled(localStorage.getItem('retroSnakeEnabled') === 'true');
    setIsPacManRetroEnabled(localStorage.getItem('pacmanRetroEnabled') === 'true');
    setIsFlappyNeonEnabled(localStorage.getItem('flappyNeonEnabled') === 'true');
    setIsBombermanEnabled(localStorage.getItem('bombermanEnabled') === 'true');
  }, []);

  const games = [];
  if (isMathBlitzEnabled) {
    games.push({
      id: 'math-blitz',
      title: 'Math Blitz',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop'
    });
  }
  if (isRetroSnakeEnabled) {
    games.push({
      id: 'retro-snake',
      title: 'Retro Snake',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop'
    });
  }
  if (isPacManRetroEnabled) {
    games.push({
      id: 'pacman-retro',
      title: 'Pac-Man Retro',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?q=80&w=800&auto=format&fit=crop'
    });
  }
  if (isFlappyNeonEnabled) {
    games.push({
      id: 'flappy-neon',
      title: 'Flappy Neon',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=800&auto=format&fit=crop'
    });
  }
  if (isBombermanEnabled) {
    games.push({
      id: 'bomberman',
      title: 'Bomberman',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1614680376593-902f74a9cb0d?q=80&w=800&auto=format&fit=crop'
    });
  }

  const handleGameClick = (id: string) => {
    setSelectedGameId(id);
    setShowConfirmation(true);
  };

  const handleStartGame = () => {
    if (selectedGameId) {
      // Trigger fullscreen on user gesture
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      }
      navigate(`/${selectedGameId}?start=true`);
    }
    setShowConfirmation(false);
  };

  return (
    <>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '40px',
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: 'calc(1.5rem + 1vw)', marginBottom: '8px' }}>Welcome to the 2D Arcade</h1>
          <p style={{ color: 'var(--text-dim)' }}>Discover and manage the best 2D experiences.</p>
        </div>
      </header>

      {games.length === 0 ? (
        <div className="fade-in" style={{
          height: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed var(--border-color)',
          borderRadius: '24px',
          background: 'rgba(255,255,255,0.01)',
          padding: '20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-neon)'
          }}>
            <Gamepad2 size={40} color="white" />
          </div>
          <h2 style={{ marginBottom: '12px', fontSize: '1.5rem', textAlign: 'center' }}>No games added yet</h2>
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', maxWidth: '400px' }}>
            Start by configuring your first game!.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {games.map(game => (
            <div key={game.id} onClick={() => handleGameClick(game.id)} style={{ cursor: 'pointer' }}>
              <GameCard 
                title={game.title}
                rating={game.rating}
                image={game.image}
              />
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass fade-in" style={{
            background: 'var(--bg-card)',
            padding: '40px',
            borderRadius: '24px',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid var(--neon-blue)',
            boxShadow: 'var(--shadow-neon)'
          }}>
            <h2 style={{ marginBottom: '16px', color: 'white' }}>Ready to play?</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '32px', lineHeight: '1.6' }}>
              You are about to launch <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>
                {games.find(g => g.id === selectedGameId)?.title}
              </span>. 
              The game will open in full-screen mode for the best experience and anti-cheat protection.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowConfirmation(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: 'var(--text-dim)',
                  border: '1px solid var(--border-color)',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleStartGame}
                className="btn-primary"
                style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)'
                }}
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomePage;

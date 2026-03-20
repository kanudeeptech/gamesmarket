import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import { Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [isMathBlitzEnabled, setIsMathBlitzEnabled] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMathBlitzEnabled(localStorage.getItem('mathBlitzEnabled') === 'true');
  }, []);

  const games = isMathBlitzEnabled ? [
    {
      id: 'math-blitz',
      title: 'Math Blitz',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop'
    }
  ] : [];

  const handleGameClick = (id: string) => {
    if (id === 'math-blitz') {
      navigate('/math-blitz');
    }
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
    </>
  );
};

export default HomePage;

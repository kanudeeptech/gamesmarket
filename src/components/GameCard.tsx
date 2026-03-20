import React from 'react';
import { Star, Image as ImageIcon } from 'lucide-react';

interface GameCardProps {
  title: string;
  rating: number;
  image: string;
}

const GameCard: React.FC<GameCardProps> = ({ title, rating, image }) => {
  return (
    <div className="glass fade-in" style={{
      background: 'var(--bg-card)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      cursor: 'pointer',
      aspectRatio: '1/1',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid var(--border-color)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.05)';
      e.currentTarget.style.boxShadow = 'var(--shadow-neon)';
      e.currentTarget.style.borderColor = 'var(--neon-blue)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = 'var(--border-color)';
    }}
    >
      <div style={{
        flex: 1,
        background: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {!image && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'var(--text-dim)',
            gap: '12px'
          }}>
            <ImageIcon size={48} strokeWidth={1} style={{ opacity: 0.5 }} />
          </div>
        )}
      </div>
      
      <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', color: 'white' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={14} 
              fill={i < rating ? 'var(--neon-purple)' : 'transparent'} 
              color={i < rating ? 'var(--neon-purple)' : 'var(--text-dim)'} 
              strokeWidth={2}
            />
          ))}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '4px' }}>{rating}.0</span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;

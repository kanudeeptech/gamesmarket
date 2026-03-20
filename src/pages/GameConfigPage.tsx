import React, { useState, useEffect } from 'react';

const GameConfigPage: React.FC = () => {
  const [isMathBlitzEnabled, setIsMathBlitzEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mathBlitzEnabled') === 'true';
  });

  const toggleMathBlitz = () => {
    const newState = !isMathBlitzEnabled;
    setIsMathBlitzEnabled(newState);
    localStorage.setItem('mathBlitzEnabled', String(newState));
  };

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '30px', fontWeight: 'bold', letterSpacing: '1px' }}>
        Game Configuration
      </h1>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '600px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Math Blitz</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
              Enable this to show Math Blitz in the game grid.
            </p>
          </div>
          
          <button
            onClick={toggleMathBlitz}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              background: isMathBlitzEnabled ? 'var(--neon-blue, #00d2ff)' : 'rgba(255, 255, 255, 0.1)',
              color: isMathBlitzEnabled ? '#000' : '#fff',
              boxShadow: isMathBlitzEnabled ? '0 0 15px rgba(0, 210, 255, 0.4)' : 'none'
            }}
          >
            {isMathBlitzEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameConfigPage;
